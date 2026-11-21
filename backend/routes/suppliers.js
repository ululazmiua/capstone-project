
const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET: tampilkan semua supplier
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, phone, address, created_at
      FROM suppliers
      ORDER BY id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Gagal mengambil supplier:', error.message);
    res.status(500).json({
      message: 'Gagal mengambil data supplier',
    });
  }
});

// POST: tambah supplier
router.post('/', async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: 'Nama supplier wajib diisi',
      });
    }

    const result = await pool.query(
      `INSERT INTO suppliers (name, phone, address)
       VALUES ($1, $2, $3)
       RETURNING id, name, phone, address, created_at`,
      [
        name.trim(),
        phone || null,
        address || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Gagal menambahkan supplier:', error.message);
    res.status(500).json({
      message: 'Gagal menambahkan supplier',
    });
  }
});

// PATCH: edit supplier
router.patch('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, phone, address } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID supplier tidak valid',
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: 'Nama supplier wajib diisi',
      });
    }

    const result = await pool.query(
      `UPDATE suppliers
       SET name = $1, phone = $2, address = $3
       WHERE id = $4
       RETURNING id, name, phone, address, created_at`,
      [name.trim(), phone || null, address || null, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: 'Supplier tidak ditemukan',
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Gagal mengedit supplier:', error.message);
    res.status(500).json({
      message: 'Gagal mengedit supplier',
    });
  }
});

// DELETE: hapus supplier
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID supplier tidak valid',
      });
    }

    // Jangan hapus supplier yang masih dipakai data stok
    const used = await pool.query(
      'SELECT 1 FROM batches WHERE supplier_id = $1 LIMIT 1',
      [id]
    );

    if (used.rowCount > 0) {
      return res.status(409).json({
        message: 'Supplier masih digunakan oleh data stok',
      });
    }

    const result = await pool.query(
      'DELETE FROM suppliers WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: 'Supplier tidak ditemukan',
      });
    }

    res.json({
      message: 'Supplier berhasil dihapus',
    });
  } catch (error) {
    console.error('Gagal menghapus supplier:', error.message);
    res.status(500).json({
      message: 'Gagal menghapus supplier',
    });
  }
});

module.exports = router;
