
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Normalisasi tanggal tanpa mengubah tanggal kalender.
function normalizeDate(value) {
  if (value == null || value === '') return null;

  if (typeof value === 'string') {
    const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (match) {
      const [, year, month, day] = match;
      const y = Number(year);
      const m = Number(month);
      const d = Number(day);

      const check = new Date(Date.UTC(y, m - 1, d));

      if (
        check.getUTCFullYear() !== y ||
        check.getUTCMonth() !== m - 1 ||
        check.getUTCDate() !== d
      ) {
        throw new Error('Tanggal kedaluwarsa tidak valid.');
      }

      return `${year}-${month}-${day}`;
    }
  }

  throw new Error('Format tanggal harus YYYY-MM-DD.');
}

// Format tanggal dari PostgreSQL untuk frontend.
function formatDateOnly(value) {
  if (value == null || value === '') return null;

  if (typeof value === 'string') {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return [
      value.getUTCFullYear(),
      String(value.getUTCMonth() + 1).padStart(2, '0'),
      String(value.getUTCDate()).padStart(2, '0'),
    ].join('-');
  }

  return null;
}

function formatBatch(row) {
  return {
    batch_id: String(row.id),
    id: row.id,
    product_id: row.product_id || String(row.id),
    product_name: row.product_name,
    category: row.category || '',
    batch_number: row.batch_number || `BATCH-${row.id}`,
    current_stock: Number(row.quantity),
    unit_price: Number(row.unit_price ?? row.selling_price),
    purchase_price: Number(row.purchase_price),
    selling_price: Number(row.selling_price),
    received_at: row.received_at,
    expiry_date: formatDateOnly(row.expiry_date),
    supplier_id: row.supplier_id,
    supplier_name: row.supplier_name || '',
    created_at: row.created_at,
  };
}

// GET: Ambil semua stok
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, s.name AS supplier_name
      FROM batches b
      LEFT JOIN suppliers s ON b.supplier_id = s.id
      ORDER BY b.id DESC
    `);

    res.json(result.rows.map(formatBatch));
  } catch (error) {
    console.error('Gagal mengambil stok:', error.message);
    res.status(500).json({ message: 'Gagal mengambil data stok.' });
  }
});

// POST: Tambah stok
router.post('/', async (req, res) => {
  try {
    const {
      product_id,
      product_name,
      category,
      batch_number,
      current_stock,
      unit_price,
      purchase_price,
      selling_price,
      received_at,
      expiry_date,
      supplier_id,
      supplier_name,
    } = req.body;

    const stock = Number(current_stock);
    const unitPrice = Number(unit_price ?? selling_price);
    const purchasePrice = Number(purchase_price ?? unit_price);
    const sellingPrice = Number(selling_price ?? unit_price);
    const expiryDate = normalizeDate(expiry_date);

    if (
      typeof product_name !== 'string' ||
      !product_name.trim() ||
      current_stock === undefined ||
      !Number.isInteger(stock) ||
      stock < 0 ||
      !Number.isFinite(unitPrice) ||
      unitPrice < 0 ||
      !Number.isFinite(purchasePrice) ||
      purchasePrice < 0 ||
      !Number.isFinite(sellingPrice) ||
      sellingPrice < 0
    ) {
      return res.status(400).json({
        message: 'Nama, jumlah stok, dan harga barang harus valid.',
      });
    }

    let finalSupplierId = supplier_id || null;

    if (!finalSupplierId && supplier_name?.trim()) {
      const supplier = await pool.query(
        `INSERT INTO suppliers (name)
         VALUES ($1)
         RETURNING id`,
        [supplier_name.trim()]
      );

      finalSupplierId = supplier.rows[0].id;
    }

    const result = await pool.query(
      `INSERT INTO batches (
        product_id, product_name, category, batch_number,
        quantity, unit_price, purchase_price, selling_price,
        received_at, expiry_date, supplier_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id`,
      [
        product_id || null,
        product_name.trim(),
        category || null,
        batch_number || null,
        stock,
        unitPrice,
        purchasePrice,
        sellingPrice,
        received_at || null,
        expiryDate,
        finalSupplierId,
      ]
    );

    const saved = await pool.query(
      `SELECT b.*, s.name AS supplier_name
       FROM batches b
       LEFT JOIN suppliers s ON b.supplier_id = s.id
       WHERE b.id = $1`,
      [result.rows[0].id]
    );

    res.status(201).json(formatBatch(saved.rows[0]));
  } catch (error) {
    console.error('Gagal menambahkan stok:', error.message);

    if (error.message === 'Tanggal kedaluwarsa tidak valid.' ||
        error.message === 'Format tanggal harus YYYY-MM-DD.') {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: 'Gagal menambahkan stok barang.' });
  }
});

// PATCH: Ubah data stok
router.patch('/:batch_id', async (req, res) => {
  try {
    const id = Number(req.params.batch_id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID stok tidak valid.' });
    }

    const {
      product_id,
      product_name,
      category,
      batch_number,
      current_stock,
      unit_price,
      purchase_price,
      selling_price,
      received_at,
      expiry_date,
      supplier_id,
    } = req.body;

    const fields = [];
    const values = [];

    function setField(column, value) {
      values.push(value);
      fields.push(`${column} = $${values.length}`);
    }

    if (product_id !== undefined) setField('product_id', product_id || null);

    if (product_name !== undefined) {
      if (typeof product_name !== 'string' || !product_name.trim()) {
        return res.status(400).json({ message: 'Nama produk tidak valid.' });
      }
      setField('product_name', product_name.trim());
    }

    if (category !== undefined) setField('category', category || null);
    if (batch_number !== undefined) setField('batch_number', batch_number || null);

    if (current_stock !== undefined) {
      const stock = Number(current_stock);
      if (!Number.isInteger(stock) || stock < 0) {
        return res.status(400).json({ message: 'Jumlah stok tidak valid.' });
      }
      setField('quantity', stock);
    }

    if (unit_price !== undefined) {
      const price = Number(unit_price);
      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({ message: 'Harga satuan tidak valid.' });
      }

      setField('unit_price', price);
      if (selling_price === undefined) setField('selling_price', price);
    }

    for (const [key, column] of [
      ['purchase_price', 'purchase_price'],
      ['selling_price', 'selling_price'],
    ]) {
      if (req.body[key] !== undefined) {
        const price = Number(req.body[key]);
        if (!Number.isFinite(price) || price < 0) {
          return res.status(400).json({ message: 'Harga tidak valid.' });
        }
        setField(column, price);
      }
    }

    if (received_at !== undefined) setField('received_at', received_at || null);

    if (expiry_date !== undefined) {
      setField('expiry_date', normalizeDate(expiry_date));
    }

    if (supplier_id !== undefined) setField('supplier_id', supplier_id || null);

    if (fields.length === 0) {
      return res.status(400).json({ message: 'Tidak ada data yang diubah.' });
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE batches
       SET ${fields.join(', ')}
       WHERE id = $${values.length}
       RETURNING id`,
      values
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Stok barang tidak ditemukan.' });
    }

    const saved = await pool.query(
      `SELECT b.*, s.name AS supplier_name
       FROM batches b
       LEFT JOIN suppliers s ON b.supplier_id = s.id
       WHERE b.id = $1`,
      [id]
    );

    res.json(formatBatch(saved.rows[0]));
  } catch (error) {
    console.error('Gagal mengubah stok:', error.message);

    if (error.message === 'Tanggal kedaluwarsa tidak valid.' ||
        error.message === 'Format tanggal harus YYYY-MM-DD.') {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: 'Gagal memperbarui stok barang.' });
  }
});

// DELETE: Hapus stok hanya jika tidak memiliki riwayat transaksi
router.delete('/:batch_id', async (req, res) => {
  try {
    const id = Number(req.params.batch_id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID stok tidak valid.' });
    }

    const history = await pool.query(
      'SELECT 1 FROM sale_items WHERE batch_id = $1 LIMIT 1',
      [id]
    );

    if (history.rowCount > 0) {
      return res.status(409).json({
        message: 'Stok memiliki riwayat penjualan sehingga tidak dapat dihapus.',
      });
    }

    const result = await pool.query(
      'DELETE FROM batches WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Stok barang tidak ditemukan.' });
    }

    res.json({ message: 'Stok berhasil dihapus.' });
  } catch (error) {
    console.error('Gagal menghapus stok:', error.message);
    res.status(500).json({ message: 'Gagal menghapus stok barang.' });
  }
});

module.exports = router;
