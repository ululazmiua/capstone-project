const pool = require('./db');

async function checkTables() {
  try {
    const result = await pool.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = $1
       ORDER BY table_name`,
      ['public']
    );

    console.table(result.rows);
  } catch (error) {
    console.error('Gagal memeriksa tabel:', error.message);
  } finally {
    await pool.end();
  }
}

checkTables();
