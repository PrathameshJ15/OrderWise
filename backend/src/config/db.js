const { Pool } = require('pg');
const { env } = require('./env');

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.DEBUG_SQL === 'true') {
    console.log('Executed query', { text, duration, rows: res.rowCount });
  }
  return res;
}

async function getClient() {
  return await pool.connect();
}

async function checkDbHealth() {
  try {
    const res = await pool.query('SELECT 1 AS healthy');
    return {
      connected: true,
      status: 'up',
      result: res.rows[0],
    };
  } catch (error) {
    return {
      connected: false,
      status: 'down',
      error: error.message,
    };
  }
}

async function closePool() {
  await pool.end();
}

module.exports = {
  pool,
  getPool: () => pool,
  query,
  getClient,
  checkDbHealth,
  closePool,
};
