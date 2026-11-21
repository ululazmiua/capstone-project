const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');

const router = express.Router();

// Hash password menggunakan bcryptjs (sama dengan routes/auth.js)
function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

// Auto-migrasi kolom username & sinkronisasi data lama saat server menyala
(async () => {
  try {
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(60) UNIQUE;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS username VARCHAR(60);
    `);
    await pool.query(`
      UPDATE users
      SET username = SPLIT_PART(email, '@', 1)
      WHERE username IS NULL AND email IS NOT NULL;
    `);
    await pool.query(`
      UPDATE employees e
      SET user_id = u.id
      FROM users u
      WHERE e.user_id IS NULL AND LOWER(e.email) = LOWER(u.email);
    `);
    await pool.query(`
      UPDATE employees e
      SET username = COALESCE(u.username, SPLIT_PART(e.email, '@', 1))
      FROM users u
      WHERE e.user_id = u.id AND (e.username IS NULL OR e.username = '');
    `);
  } catch (err) {
    console.error('Auto-migration error:', err.message);
  }
})();

// Get all employees
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.id,
              e.user_id,
              e.name,
              COALESCE(u.username, e.username, SPLIT_PART(e.email, '@', 1)) AS username,
              e.email,
              e.phone,
              e.position,
              COALESCE(u.role, 'employee') AS role,
              COALESCE(u.status, 'active') AS status
       FROM employees e
       LEFT JOIN users u ON e.user_id = u.id
       ORDER BY e.id DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get employees error:', error.message);
    res.status(500).json({ message: 'Error fetching employees' });
  }
});

// Get employee by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT e.id,
              e.user_id,
              e.name,
              COALESCE(u.username, e.username, SPLIT_PART(e.email, '@', 1)) AS username,
              e.email,
              e.phone,
              e.position,
              COALESCE(u.role, 'employee') AS role,
              COALESCE(u.status, 'active') AS status
       FROM employees e
       LEFT JOIN users u ON e.user_id = u.id
       WHERE e.id = $1`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Employee not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get employee error:', error.message);
    res.status(500).json({ message: 'Error fetching employee' });
  }
});

// Create new employee + user account
router.post('/', async (req, res) => {
  const { name, full_name, username, email, phone, position, role, password } = req.body;
  const cleanName = (full_name || name || '').trim();
  const cleanUsername = (username || '').trim();
  const cleanRole = role === 'admin' ? 'admin' : 'employee';
  const cleanEmail = (email || `${cleanUsername}@petcare.local`).trim().toLowerCase();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const hashedPassword = hashPassword(password || 'PetCare1234');
    const userRes = await client.query(
      `INSERT INTO users (name, username, email, password_hash, role, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING id, username, role, status`,
      [cleanName, cleanUsername || null, cleanEmail, hashedPassword, cleanRole]
    );
    const newUser = userRes.rows[0];

    const empRes = await client.query(
      `INSERT INTO employees (user_id, name, username, email, phone, position)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, name, username, email, phone, position`,
      [newUser.id, cleanName, newUser.username, cleanEmail, phone || null, position || null]
    );

    await client.query('COMMIT');

    res.status(201).json({
      ...empRes.rows[0],
      username: newUser.username,
      role: newUser.role,
      status: newUser.status,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create employee error:', error.message);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Username atau email sudah terdaftar.' });
    }
    res.status(500).json({ message: 'Error creating employee' });
  } finally {
    client.release();
  }
});

// Update employee + user account (username, role, status, password)
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, full_name, username, email, phone, position, role, status, password } = req.body;
  const cleanName = (full_name || name || '').trim();
  const cleanUsername = (username || '').trim();
  const cleanRole = role === 'admin' ? 'admin' : 'employee';
  const cleanStatus = status === 'inactive' ? 'inactive' : 'active';
  const cleanPassword = (password || '').trim();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Update tabel employees
    const empRes = await client.query(
      `UPDATE employees
       SET name = COALESCE(NULLIF($1, ''), name),
           username = COALESCE(NULLIF($2, ''), username),
           email = COALESCE(NULLIF($3, ''), email),
           phone = $4,
           position = COALESCE($5, position)
       WHERE id = $6
       RETURNING id, user_id, name, username, email, phone, position`,
      [cleanName, cleanUsername, email, phone || null, position || null, id]
    );

    if (empRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Employee not found' });
    }

    let updatedEmp = empRes.rows[0];
    let updatedUser = {
      username: cleanUsername || updatedEmp.username,
      role: cleanRole,
      status: cleanStatus,
    };

    const newPasswordHash = cleanPassword ? hashPassword(cleanPassword) : null;

    if (updatedEmp.user_id) {
      // 2a. Update tabel users termasuk password_hash jika diisi
      const userRes = await client.query(
        `UPDATE users
         SET name = COALESCE(NULLIF($1, ''), name),
             username = COALESCE(NULLIF($2, ''), username),
             email = COALESCE(NULLIF($3, ''), email),
             role = $4,
             status = $5,
             password_hash = COALESCE($6, password_hash)
         WHERE id = $7
         RETURNING username, role, status`,
        [
          cleanName,
          cleanUsername,
          updatedEmp.email,
          cleanRole,
          cleanStatus,
          newPasswordHash,
          updatedEmp.user_id,
        ]
      );
      if (userRes.rows.length > 0) {
        updatedUser = userRes.rows[0];
      }
    } else {
      // 2b. Jika user_id masih NULL (akun lama), buatkan baris di users & sambungkan otomatis
      const fallbackEmail =
        updatedEmp.email || `${cleanUsername || `user${updatedEmp.id}`}@petcare.local`;
      const defaultPass = newPasswordHash || hashPassword('PetCare1234');

      const userUpsert = await client.query(
        `INSERT INTO users (name, username, email, password_hash, role, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO UPDATE
           SET name = EXCLUDED.name,
               username = COALESCE(EXCLUDED.username, users.username),
               role = EXCLUDED.role,
               status = EXCLUDED.status,
               password_hash = CASE
                 WHEN $7::text IS NOT NULL THEN EXCLUDED.password_hash
                 ELSE users.password_hash
               END
         RETURNING id, username, role, status`,
        [
          updatedEmp.name,
          cleanUsername || null,
          fallbackEmail,
          defaultPass,
          cleanRole,
          cleanStatus,
          newPasswordHash,
        ]
      );

      const linkedUser = userUpsert.rows[0];
      await client.query('UPDATE employees SET user_id = $1 WHERE id = $2', [
        linkedUser.id,
        updatedEmp.id,
      ]);

      updatedEmp.user_id = linkedUser.id;
      updatedUser = {
        username: linkedUser.username,
        role: linkedUser.role,
        status: linkedUser.status,
      };
    }

    await client.query('COMMIT');

    res.json({
      ...updatedEmp,
      username: updatedUser.username,
      role: updatedUser.role,
      status: updatedUser.status,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update employee error:', error.message);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Username atau email sudah digunakan akun lain.' });
    }
    res.status(500).json({ message: 'Error updating employee' });
  } finally {
    client.release();
  }
});

// Delete employee + user account
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const empRes = await client.query(
      'DELETE FROM employees WHERE id = $1 RETURNING user_id',
      [id]
    );
    if (empRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Employee not found' });
    }

    const userId = empRes.rows[0].user_id;
    if (userId) {
      await client.query('DELETE FROM users WHERE id = $1', [userId]);
    }

    await client.query('COMMIT');
    res.json({ message: 'Employee deleted' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete employee error:', error.message);
    res.status(500).json({ message: 'Error deleting employee' });
  } finally {
    client.release();
  }
});

module.exports = router;