require('dotenv').config();

const readline = require('readline');
const bcrypt = require('bcryptjs');
const pool = require('./db');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Masukkan password baru: ', async (password) => {
  try {
    if (password.length < 8) {
      console.log('Password minimal 8 karakter.');
      return;
    }

    const hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `UPDATE users
       SET password_hash = $1, updated_at = NOW()
       WHERE email = $2
       RETURNING id, email`,
      [hash, 'admin@royalpetcare.com']
    );

    if (result.rowCount === 0) {
      console.log('Akun admin tidak ditemukan.');
    } else {
      console.log('Password admin berhasil direset!');
      console.log('Email:', result.rows[0].email);
    }
  } catch (error) {
    console.error('Gagal reset password:', error.message);
  } finally {
    await pool.end();
    rl.close();
  }
});