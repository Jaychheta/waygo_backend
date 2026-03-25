require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_DATABASE,
  // ✅ No SSL — local PostgreSQL does not require it
  connectionTimeoutMillis: 10000,   // give up connecting after 10 s
  idleTimeoutMillis: 30000,   // release idle clients after 30 s
  max: 10,      // max connections in pool
});

// Prevent server crash when a pooled connection drops unexpectedly
pool.on('error', (err) => {
  console.warn('⚠️  Idle DB client error (pool will auto-recover):', err.message);
});

// Verify the connection on startup
async function connectWithRetry(attempt = 1, maxAttempts = 5) {
  try {
    const client = await pool.connect();
    console.log('✅ Local Database Connected Successfully!');
    client.release();
  } catch (err) {
    const isRetryable = err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED';
    if (isRetryable && attempt < maxAttempts) {
      const delay = attempt * 3000; // 3s, 6s, 9s …
      console.warn(`⚠️  DB connection attempt ${attempt} failed (${err.code}). Retrying in ${delay / 1000}s...`);
      setTimeout(() => connectWithRetry(attempt + 1, maxAttempts), delay);
    } else {
      console.error(`❌ Database Connection Failed after ${attempt} attempt(s): ${err.code || err.message}`);
      console.error('   → Make sure PostgreSQL is running locally and your .env DB_ vars are correct.');
    }
  }
}

connectWithRetry();

module.exports = pool;
