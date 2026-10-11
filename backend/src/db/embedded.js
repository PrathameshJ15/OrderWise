const EmbeddedPostgres = require('embedded-postgres').default;
const path = require('path');
const fs = require('fs');
const { Client } = require('pg');

const dbDir = path.resolve(__dirname, '../../data/db');

const pgInstance = new EmbeddedPostgres({
  databaseDir: dbDir,
  port: 5432,
  user: 'orderwise_user',
  password: 'password',
  database: 'postgres',
  persistent: true,
});

async function ensureDatabasesExist() {
  const client = new Client({
    connectionString: 'postgresql://orderwise_user:password@localhost:5432/postgres',
  });
  await client.connect();

  const dbs = ['orderwise_db', 'orderwise_test'];
  for (const dbName of dbs) {
    const checkRes = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );
    if (checkRes.rowCount === 0) {
      console.log(`Creating database: ${dbName}...`);
      await client.query(`CREATE DATABASE "${dbName}";`);
    }
  }
  await client.end();
}

async function startEmbeddedPostgres() {
  try {
    // Check if postgres is already running on port 5432
    const testClient = new Client({
      connectionString: 'postgresql://orderwise_user:password@localhost:5432/postgres',
      connectionTimeoutMillis: 1500,
    });
    try {
      await testClient.connect();
      await testClient.end();
      console.log('PostgreSQL is already active on port 5432.');
      await ensureDatabasesExist();
      return;
    } catch {
      // Not running, proceed
    }

    const isInitialized = fs.existsSync(path.join(dbDir, 'PG_VERSION'));
    if (!isInitialized) {
      console.log('Initializing embedded PostgreSQL 15...');
      await pgInstance.initialise();
    }

    console.log('Starting PostgreSQL on port 5432...');
    await pgInstance.start();
    console.log('PostgreSQL started.');
    await ensureDatabasesExist();
    console.log('Databases initialized.');
  } catch (err) {
    console.error('Error in embedded postgres:', err);
    throw err;
  }
}

async function stopEmbeddedPostgres() {
  try {
    await pgInstance.stop();
  } catch (err) {
    console.warn('Error stopping embedded postgres:', err.message);
  }
}

if (require.main === module) {
  startEmbeddedPostgres().then(() => {
    console.log('PostgreSQL 15 server ready and running. Keeping process alive...');
    // Keep alive when executed directly
    setInterval(() => {}, 1000);
  });
}

module.exports = {
  startEmbeddedPostgres,
  stopEmbeddedPostgres,
  ensureDatabasesExist,
};
