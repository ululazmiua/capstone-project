
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const batchRoutes = require('./routes/batches');
const employeeRoutes = require('./routes/employees');

// after other route imports

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Route utama
app.get('/', (req, res) => {
  res.json({
    message: 'Royal PetCare Backend berjalan',
  });
});

// Cek kesehatan server
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server siap menerima permintaan',
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/batches', batchRoutes);
app.use('/api/v1/employees', employeeRoutes);

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
