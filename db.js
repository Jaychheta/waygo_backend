const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',       // Taro postgres username (default 'postgres' hoy)
  host: 'localhost',
  database: 'waygo',      // Apde banavelu DB name
  password: '123456789', // Ahiya te install karti vakhte rakhelo password nakhje
  port: 5432,
});

module.exports = pool;