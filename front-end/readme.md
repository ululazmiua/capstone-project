# Royal PetCare – Front End (Tim A26-CS071)

Antarmuka web untuk memantau stok dan tanggal kedaluwarsa produk Royal PetCare.
Folder ini **hanya berisi front end** dan bisa dijalankan tanpa backend.

## Menjalankan
```bash
npm install
npm run dev      # buka http://localhost:5173
npm run build    # hasil di folder dist
```

## Akun contoh
| Role     | Username   | Password      |
|----------|------------|---------------|
| Admin    | `admin`    | `admin123`    |
| Karyawan | `karyawan` | `karyawan123` |

## Sumber data
- Data stok awal: `public/data/inventory_batches.csv` (data sintetis dari tim Data Science, acuan tanggal 23/10/2026).
- Semua perubahan (batch, barang masuk, penjualan, supplier, akun) disimpan di browser (localStorage) lewat `src/api.js`.
- Untuk mengulang data dari awal, buka Console browser lalu jalankan `resetDemoData()` dan muat ulang halaman.

## Struktur
- `src/api.js` – lapisan data lokal (pengganti panggilan backend)
- `src/pages/` – Login, Register, Admin, Ringkasan, Stok & Batch, Barang Masuk, Penjualan, Supplier
- `src/components.jsx`, `src/util.js`, `src/styles.css`
