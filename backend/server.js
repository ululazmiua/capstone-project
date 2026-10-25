
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Pemeriksaan server
app.get('/', (req, res) => {
  res.json({
    message: 'Royal PetCare Backend berjalan',
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server siap menerima permintaan',
  });
});

// API registrasi dan login
app.use('/api/v1/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
