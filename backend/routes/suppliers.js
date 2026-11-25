
const express = require('express');
const pool = require('../db');

const router = express.Router();

// GET: Menampilkan semua supplier
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM suppliers ORDER BY supplier_id ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Gagal mengambil supplier:', error.message);
    res.status(500).json({ message: 'Gagal mengambil data supplier.' });
  }
});

// GET: Menampilkan supplier berdasarkan ID
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM suppliers WHERE supplier_id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Supplier tidak ditemukan.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Gagal mengambil supplier:', error.message);
    res.status(500).json({ message: 'Gagal mengambil data supplier.' });
  }
});

// POST: Menambahkan supplier
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'Nama supplier wajib diisi.' });
    }

    const result = await pool.query(
      `INSERT INTO suppliers (name, phone, email, address)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        String(name).trim(),
        phone || '',
        email || '',
        address || '',
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Gagal menambahkan supplier:', error.message);
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Supplier dengan nama ini sudah ada.' });
    }
    res.status(500).json({ message: 'Supplier gagal ditambahkan.' });
  }
});

// PATCH: Mengubah supplier
router.patch('/:id', async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'Nama supplier wajib diisi.' });
    }

    const result = await pool.query(
      `UPDATE suppliers
       SET name = $1,
           phone = $2,
           email = $3,
           address = $4,
           updated_at = NOW()
       WHERE supplier_id = $5
       RETURNING *`,
      [
        String(name).trim(),
        phone || '',
        email || '',
        address || '',
        req.params.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Supplier tidak ditemukan.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Gagal mengubah supplier:', error.message);
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Nama supplier sudah digunakan.' });
    }
    res.status(500).json({ message: 'Supplier gagal diperbarui.' });
  }
});

// DELETE: Menghapus supplier
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM suppliers WHERE supplier_id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Supplier tidak ditemukan.' });
    }

    res.json({
      message: 'Supplier berhasil dihapus.',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Gagal menghapus supplier:', error.message);
    res.status(500).json({ message: 'Supplier gagal dihapus.' });
  }
});

module.exports = router;
