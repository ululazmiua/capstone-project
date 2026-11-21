
const pool = require('./db');

async function approveTestAccount() {
  try {
    const result = await pool.query(
      'UPDATE users SET status = $1 WHERE email = $2',
      ['approved', 'tes.karyawan@example.com']
    );

    console.log('Akun disetujui:', result.rowCount);
  } catch (error) {
   console.error('Gagal menyetujui akun:', error);
  } finally {
    await pool.end();
  }
}

approveTestAccount();
