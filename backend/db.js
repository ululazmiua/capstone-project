
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '.env'),
});

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5433),
  database: process.env.DB_NAME || 'royal_petcare',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

module.exports = pool;
