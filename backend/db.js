
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'petcare_db',
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT || 5433),
});

pool.on('connect', () => {
  console.log('PostgreSQL berhasil terhubung.');
});

pool.on('error', (err) => {
  console.error('Kesalahan koneksi PostgreSQL:', err.message);
});

module.exports = pool;
