
const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
}));

app.use(express.json());

// Route utama
app.get('/', (req, res) => {
  res.json({
    message: 'Backend Royal PetCare berhasil dijalankan!',
    status: 'success',
  });
});

// Cek koneksi database
app.get('/api/db-check', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');

    res.json({
      message: 'Database petcare_db berhasil terhubung!',
      status: 'success',
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error('Database error:', error.message);

    res.status(500).json({
      message: 'Koneksi database gagal.',
      status: 'error',
    });
  }
});

// Route autentikasi
app.use('/api/auth', require('./routes/auth'));

// Route data karyawan
app.use('/api/karyawan', require('./routes/karyawan'));

// Route data supplier
app.use('/api/suppliers', require('./routes/suppliers'));

// Menjalankan server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
