# Royal PetCare – Front End (Tim A26-CS071)

Antarmuka web untuk memantau stok dan tanggal kedaluwarsa produk Royal PetCare.

## Menjalankan
```bash
npm install
npm run dev      # buka http://localhost:5173
npm run build    # hasil di folder dist (untuk deploy ke Netlify / Cloudflare Pages)
```

## Sumber data
- Default: `public/data/inventory_batches.csv` (data sintetis dari tim DS, acuan tanggal 23/10/2026).
- Dengan back end: salin `.env.example` menjadi `.env`, isi `VITE_API_URL`. Front end memanggil `GET {VITE_API_URL}/api/v1/batches`
  dan mengharapkan array objek dengan kolom yang sama seperti CSV.

## Struktur
- `src/api.js` – semua panggilan data (Axios)
- `src/pages/` – Ringkasan, Stok & Batch, Penjualan
- `src/components.jsx`, `src/util.js`, `src/styles.css`

## Sumber data (untuk README checklist)
Data inventory sintetis: `inventory_batches.csv` dari tim Data Science.
