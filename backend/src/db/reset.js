const { Client } = require('pg');
const { execSync } = require('child_process');
const path = require('path');

/**
 * Safe database reset utility for OrderWise.
 * REFUSES to run against development or production databases.
 */
async function resetTestDatabase(targetDbUrl = null) {
  const dbUrl = targetDbUrl || process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: Database reset is strictly forbidden in production environment.');
  }

  // Parse database name from URL
  const urlParts = new URL(dbUrl);
  const dbName = urlParts.pathname.replace(/^\//, '');

  const isExplicitTestDb = dbName.toLowerCase().endsWith('_test');
  const isExplicitlyForced = process.env.FORCE_DB_RESET === 'true';

  if (!isExplicitTestDb && !isExplicitlyForced) {
    throw new Error(
      `ABORTED: Refusing to reset database "${dbName}". Reset script can ONLY run against databases ending in "_test" (e.g. orderwise_test). To force, set FORCE_DB_RESET=true.`
    );
  }

  console.log(`[RESET] Target database verified safe: "${dbName}"`);

  // Connect to postgres management database to drop and recreate cleanly
  const adminUrl = new URL(dbUrl);
  adminUrl.pathname = '/postgres';

  const client = new Client({ connectionString: adminUrl.toString() });
  await client.connect();

  try {
    console.log(`[RESET] Terminating active connections to "${dbName}"...`);
    await client.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = $1 AND pid <> pg_backend_pid();
    `, [dbName]);

    console.log(`[RESET] Dropping database "${dbName}"...`);
    await client.query(`DROP DATABASE IF EXISTS "${dbName}";`);

    console.log(`[RESET] Recreating database "${dbName}"...`);
    await client.query(`CREATE DATABASE "${dbName}";`);

    console.log(`[RESET] Running migrations on "${dbName}"...`);
    const migrationsDir = path.resolve(__dirname, 'migrations');
    execSync(`npx node-pg-migrate --migrations-dir "${migrationsDir}" up`, {
      env: { ...process.env, DATABASE_URL: dbUrl },
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '../../..'),
    });

    console.log(`[RESET] Database "${dbName}" reset and migrated successfully.`);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  const testDbUrl =
    process.env.TEST_DATABASE_URL ||
    'postgresql://orderwise_user:password@localhost:5432/orderwise_test';

  resetTestDatabase(testDbUrl)
    .then(() => {
      console.log('Reset complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err.message);
      process.exit(1);
    });
}

module.exports = { resetTestDatabase };
