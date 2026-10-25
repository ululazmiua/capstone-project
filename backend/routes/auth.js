
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

// Registrasi akun baru
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Nama, email, dan password wajib diisi.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: 'Password minimal 8 karakter.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: 'Email sudah terdaftar.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, status)
       VALUES ($1, $2, $3, 'employee', 'pending')
       RETURNING id, name, email, role, status`,
      [name.trim(), normalizedEmail, passwordHash]
    );

    return res.status(201).json({
      message: 'Registrasi berhasil. Akun menunggu persetujuan admin.',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Register error:', error.message);

    return res.status(500).json({
      message: 'Terjadi kesalahan saat registrasi.',
    });
  }
});

// Login akun
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email dan password wajib diisi.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: 'Email atau password salah.',
      });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: 'Email atau password salah.',
      });
    }

    if (user.status !== 'approved') {
      return res.status(403).json({
        message:
          user.status === 'rejected'
            ? 'Registrasi akun ditolak.'
            : 'Akun belum disetujui admin.',
        status: user.status,
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET belum dikonfigurasi.');

      return res.status(500).json({
        message: 'Konfigurasi autentikasi belum lengkap.',
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      message: 'Login berhasil.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);

    return res.status(500).json({
      message: 'Terjadi kesalahan saat login.',
    });
  }
});

module.exports = router;
