
const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');

const router = express.Router();

const allowedRoles = ['admin', 'employee'];
const allowedStatuses = [
  'pending',
  'approved',
  'active',
  'inactive',
  'rejected',
];

function formatAccount(row) {
  return {
    id: row.id,
    user_id: row.id,
    karyawan_id: row.id,
    employee_id: row.id,
    name: row.name,
    full_name: row.name,
    username: row.username,
    email: row.email,
    phone: '',
    position: '',
    role: row.role,
    status: row.status,
    created_at: row.created_at,
  };
}

// GET SEMUA AKUN
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, username, email, role, status, created_at
      FROM karyawan
      WHERE role IN ('admin', 'employee')
      ORDER BY id DESC
    `);

    res.json(result.rows.map(formatAccount));
  } catch (error) {
    console.error('Get accounts error:', error.message);
    res.status(500).json({
      message: 'Gagal mengambil data akun.',
    });
  }
});

// GET AKUN BERDASARKAN ID
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, username, email, role, status, created_at
      FROM karyawan
      WHERE id = $1
        AND role IN ('admin', 'employee')
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Akun tidak ditemukan.',
      });
    }

    res.json(formatAccount(result.rows[0]));
  } catch (error) {
    console.error('Get account error:', error.message);
    res.status(500).json({
      message: 'Gagal mengambil data akun.',
    });
  }
});

// TAMBAH AKUN
router.post('/', async (req, res) => {
  try {
    const {
      name,
      full_name,
      username,
      email,
      password,
      role,
      status,
    } = req.body;

    const cleanName = String(full_name || name || '').trim();
    const cleanUsername = String(username || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPassword = String(password || '');

    const newRole = allowedRoles.includes(role) ? role : 'employee';
    const newStatus = allowedStatuses.includes(status) ? status : 'active';

    if (!cleanName || !cleanUsername || !cleanEmail || !cleanPassword) {
      return res.status(400).json({
        message: 'Nama, username, email, dan password wajib diisi.',
      });
    }

    if (cleanPassword.length < 8) {
      return res.status(400).json({
        message: 'Password minimal 8 karakter.',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        message: 'Format email tidak valid.',
      });
    }

    const result = await pool.query(`
      INSERT INTO karyawan
        (name, username, email, password_hash, role, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, username, email, role, status, created_at
    `, [
      cleanName,
      cleanUsername,
      cleanEmail,
      await bcrypt.hash(cleanPassword, 10),
      newRole,
      newStatus,
    ]);

    res.status(201).json(formatAccount(result.rows[0]));
  } catch (error) {
    console.error('Create account error:', error.message);

    if (error.code === '23505') {
      return res.status(409).json({
        message: 'Username atau email sudah terdaftar.',
      });
    }

    res.status(500).json({
      message: 'Gagal menambahkan akun.',
    });
  }
});

// EDIT AKUN
router.patch('/:id', async (req, res) => {
  try {
    const {
      name,
      full_name,
      username,
      email,
      role,
      status,
      password,
    } = req.body;

    const existing = await pool.query(`
      SELECT id, name, username, email, role, status
      FROM karyawan
      WHERE id = $1
    `, [req.params.id]);

    if (existing.rows.length === 0) {
      return res.status(404).json({
        message: 'Akun tidak ditemukan.',
      });
    }

    const account = existing.rows[0];

    const newName = String(full_name || name || account.name).trim();
    const newUsername = String(username || account.username).trim();
    const newEmail = String(email || account.email).trim().toLowerCase();

    const newRole = allowedRoles.includes(role) ? role : account.role;
    const newStatus = allowedStatuses.includes(status) ? status : account.status;
    const newPassword = String(password || '');

    if (!newName || !newUsername || !newEmail) {
      return res.status(400).json({
        message: 'Nama, username, dan email wajib diisi.',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({
        message: 'Format email tidak valid.',
      });
    }

    if (newPassword && newPassword.length < 8) {
      return res.status(400).json({
        message: 'Password minimal 8 karakter.',
      });
    }

    const passwordHash = newPassword
      ? await bcrypt.hash(newPassword, 10)
      : null;

    const result = await pool.query(`
      UPDATE karyawan
      SET name = $1,
          username = $2,
          email = $3,
          role = $4,
          status = $5,
          password_hash = COALESCE($6, password_hash),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING id, name, username, email, role, status, created_at
    `, [
      newName,
      newUsername,
      newEmail,
      newRole,
      newStatus,
      passwordHash,
      account.id,
    ]);

    res.json(formatAccount(result.rows[0]));
  } catch (error) {
    console.error('Update account error:', error.message);

    if (error.code === '23505') {
      return res.status(409).json({
        message: 'Username atau email sudah digunakan akun lain.',
      });
    }

    res.status(500).json({
      message: 'Gagal memperbarui akun.',
    });
  }
});

// HAPUS AKUN
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, role
      FROM karyawan
      WHERE id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Akun tidak ditemukan.',
      });
    }

    const account = result.rows[0];

    if (account.role === 'admin') {
      const adminCount = await pool.query(`
        SELECT COUNT(*)::INTEGER AS total
        FROM karyawan
        WHERE role = 'admin'
      `);

      if (adminCount.rows[0].total <= 1) {
        return res.status(400).json({
          message: 'Admin terakhir tidak dapat dihapus.',
        });
      }
    }

    await pool.query(
      'DELETE FROM karyawan WHERE id = $1',
      [account.id]
    );

    res.json({
      message: 'Akun berhasil dihapus.',
    });
  } catch (error) {
    console.error('Delete account error:', error.message);
    res.status(500).json({
      message: 'Gagal menghapus akun.',
    });
  }
});

module.exports = router;
