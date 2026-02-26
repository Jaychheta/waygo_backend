require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect()
  .then(() => console.log("✅ Live Database Connected!"))
  .catch(err => console.error("❌ Database Connection Error:", err));

module.exports = pool;