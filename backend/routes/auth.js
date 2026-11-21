const express = require('express')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const pool = require('../db')

const router = express.Router()

// Mendukung verifikasi bcryptjs maupun scrypt lama
async function verifyPassword(plainPassword, storedHash) {
  if (!storedHash) return false
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
    return bcrypt.compare(plainPassword, storedHash)
  }
  if (storedHash.includes(':')) {
    const [salt, key] = storedHash.split(':')
    const derivedKey = crypto.scryptSync(plainPassword, salt, 64).toString('hex')
    return key === derivedKey
  }
  return plainPassword === storedHash
}

// ========================================
// REGISTRASI AKUN BARU
// ========================================
router.post('/register', async (req, res) => {
  try {
    const { name, username, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Nama, email, dan password wajib diisi.',
      })
    }

    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string'
    ) {
      return res.status(400).json({
        message: 'Format data tidak valid.',
      })
    }

    const normalizedName = name.trim()
    const normalizedEmail = email.trim().toLowerCase()
    const normalizedUsername =
      typeof username === 'string' && username.trim()
        ? username.trim()
        : normalizedEmail.split('@')[0]

    if (!normalizedName) {
      return res.status(400).json({
        message: 'Nama tidak boleh kosong.',
      })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        message: 'Format email tidak valid.',
      })
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: 'Password minimal 8 karakter.',
      })
    }

    const existingUser = await pool.query(
      `SELECT u.id, u.status, u.role, e.id AS employee_id
       FROM users u
       LEFT JOIN employees e ON e.user_id = u.id
       WHERE LOWER(u.email) = $1`,
      [normalizedEmail]
    )

    const passwordHash = await bcrypt.hash(password, 10)

    if (existingUser.rows.length > 0) {
      const existing = existingUser.rows[0]

      // Jika akun masih aktif & terhubung di employees (atau role admin), tolak duplikat
      if (
        (existing.status === 'active' || existing.status === 'approved') &&
        (existing.employee_id || existing.role === 'admin')
      ) {
        return res.status(409).json({
          message: 'Email sudah terdaftar dan aktif. Silakan langsung masuk.',
        })
      }

      // Jika sudah dihapus dari employees atau berstatus pending/rejected/inactive, perbarui pengajuan
      const updated = await pool.query(
        `UPDATE users
         SET name = $1,
             username = $2,
             password_hash = $3,
             role = 'employee',
             status = 'pending'
         WHERE id = $4
         RETURNING id, name, username, email, role, status`,
        [normalizedName, normalizedUsername, passwordHash, existing.id]
      )

      return res.status(201).json({
        message: 'Registrasi berhasil dikirim. Akun menunggu persetujuan admin.',
        user: updated.rows[0],
      })
    }

    const result = await pool.query(
      `INSERT INTO users
        (name, username, email, password_hash, role, status)
       VALUES ($1, $2, $3, $4, 'employee', 'pending')
       RETURNING id, name, username, email, role, status`,
      [normalizedName, normalizedUsername, normalizedEmail, passwordHash]
    )

    return res.status(201).json({
      message: 'Registrasi berhasil. Akun menunggu persetujuan admin.',
      user: result.rows[0],
    })
  } catch (error) {
    console.error('Register error:', error.message)

    if (error.code === '23505') {
      return res.status(409).json({
        message: 'Username sudah digunakan akun lain. Silakan gunakan username berbeda.',
      })
    }

    return res.status(500).json({
      message: 'Terjadi kesalahan saat registrasi.',
    })
  }
})

// ========================================
// LOGIN AKUN
// ========================================
router.post('/login', async (req, res) => {
  try {
    const { email, username, password } = req.body
    const identifier = (email || username || '').trim().toLowerCase()

    if (!identifier || !password) {
      return res.status(400).json({
        message: 'Email/username dan password wajib diisi.',
      })
    }

    if (typeof password !== 'string') {
      return res.status(400).json({
        message: 'Format email atau password tidak valid.',
      })
    }

    const result = await pool.query(
      `SELECT id, name, username, email, password_hash, role, status
       FROM users
       WHERE LOWER(email) = $1 OR LOWER(username) = $1`,
      [identifier]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: 'Email atau password salah.',
      })
    }

    const user = result.rows[0]

    const passwordMatch = await verifyPassword(password, user.password_hash)

    if (!passwordMatch) {
      return res.status(401).json({
        message: 'Email atau password salah.',
      })
    }

    if (user.status !== 'active' && user.status !== 'approved') {
      let msg = 'Akun belum disetujui admin.'
      if (user.status === 'rejected') msg = 'Registrasi akun ditolak.'
      if (user.status === 'inactive') msg = 'Akun Anda dinonaktifkan. Hubungi Admin.'

      return res.status(403).json({
        message: msg,
        status: user.status,
      })
    }

    const secret = process.env.JWT_SECRET || 'royal_petcare_secret_2026'
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      secret,
      {
        expiresIn: '8h',
      }
    )

    return res.status(200).json({
      message: 'Login berhasil.',
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Login error:', error.message)

    return res.status(500).json({
      message: 'Terjadi kesalahan saat login.',
    })
  }
})

module.exports = router