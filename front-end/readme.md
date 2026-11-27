# Royal PetCare – Front End (Tim A26-CS071)

Antarmuka web untuk pengelolaan stok, penjualan, supplier, dan akun pengguna.

## Menjalankan

Login, pendaftaran, supplier, dan akun karyawan memerlukan backend PostgreSQL dari folder `backend`, tersedia di `http://localhost:5000`.

Jalankan front-end dari folder ini:

```bash
npm install
npm run dev
```

Buka aplikasi di `http://localhost:5173` (bukan `127.0.0.1`), karena hanya alamat itu yang diizinkan oleh backend. Jika port 5173 sedang dipakai, `npm run dev` akan berhenti dengan pesan kesalahan; tutup aplikasi yang memakai port tersebut lalu jalankan ulang. Untuk membuat build produksi, jalankan `npm run build`.

## Sumber data

- Data awal berisi 1.300 batch dari `public/data/inventory_batches.csv`, dengan enam kategori dan acuan tanggal 25/11/2026.
- Status `AMAN`, `WASPADA`, `KRITIS`, dan `KADALUARSA`, beserta jumlah hari menuju kedaluwarsa, dihitung ulang berdasarkan tanggal hari ini.
- Data stok dan penjualan disimpan di `localStorage`. Login, pendaftaran, supplier, dan akun karyawan menggunakan backend.
- Untuk mengulang data stok dan penjualan dari awal, buka Console browser lalu jalankan `resetDemoData()` dan muat ulang halaman.

## Struktur

```text
front-end/
├── public/
│   └── data/
│       └── inventory_batches.csv
├── src/
│   ├── layouts/
│   ├── pages/
│   │   └── admin/
│   ├── routes/
│   ├── api.js
│   ├── App.jsx
│   ├── components.jsx
│   ├── main.jsx
│   ├── styles.css
│   └── util.js
├── Logo.jpg
├── index.html
├── package.json
├── package-lock.json
├── tailwind.config.js
└── vite.config.js
```
