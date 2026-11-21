
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const pool = require('./db');

async function main() {
  const csvPath = path.join(
    __dirname,
    '..',
    'public',
    'data',
    'inventory_batches.csv'
  );

  const csvText = fs.readFileSync(csvPath, 'utf8');

  const rows = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const count = await client.query(
      'SELECT COUNT(*)::int AS total FROM batches'
    );

    if (count.rows[0].total > 0) {
      throw new Error(
        'Tabel batches tidak kosong. Impor dibatalkan untuk mencegah duplikasi.'
      );
    }

    for (const row of rows) {
      await client.query(
        `INSERT INTO batches (
          product_id,
          product_name,
          category,
          batch_number,
          quantity,
          unit_price,
          purchase_price,
          selling_price,
          received_at,
          expiry_date
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          row.product_id || null,
          row.product_name,
          row.category || null,
          row.batch_number || row.batch_id,
          Number(row.current_stock || 0),
          Number(row.unit_price || 0),
          Number(row.unit_price || 0),
          Number(row.unit_price || 0),
          row.entry_date || null,
          row.expiry_date || null,
        ]
      );
    }

    await client.query('COMMIT');
    console.log(`Berhasil mengimpor ${rows.length} data stok.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Impor gagal:', error.message);
  process.exitCode = 1;
});
