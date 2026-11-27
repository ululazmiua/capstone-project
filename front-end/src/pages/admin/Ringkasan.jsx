import { useEffect, useMemo, useState } from 'react'
import { getSalesSummary } from '../../api.js'
import { dtxt, fmtDate, nilai, rp } from '../../util.js'
import { firstOfMonth, today } from './dates.js'
import { inputClass, Metric, panelClass } from './components.jsx'

// Halaman Ringkasan (admin)
export default function AdminRingkasan({ data = [], pulled = new Set() }) {
  const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data])

  const [from, setFrom] = useState(firstOfMonth)
  const [to, setTo] = useState(today)
  const [sales, setSales] = useState(null)
  const [salesState, setSalesState] = useState('loading')

  // Ringkasan Penjualan
  useEffect(() => {
    let current = true

    setSalesState('loading')

    getSalesSummary(from, to)
      .then((summary) => {
        if (current) {
          setSales(summary)
          setSalesState('ok')
        }
      })
      .catch(() => {
        if (current) setSalesState('error')
      })

    return () => {
      current = false
    }
  }, [from, to])

  // Filter Data
  const receivedBatches = useMemo(
    () =>
      safeData
        .filter(
          (batch) =>
            batch.entry_date >= from && batch.entry_date <= to
        )
        .sort((a, b) => b.entry_date.localeCompare(a.entry_date)),
    [safeData, from, to]
  )

  const receivedUnits = receivedBatches.reduce(
    (total, batch) => total + Number(batch.initial_stock || 0),
    0
  )

  // Batch yang sudah ditandai ditarik oleh karyawan tidak dihitung lagi.
  const expired = safeData.filter(
    (batch) =>
      batch.status === 'KADALUARSA' &&
      batch.current_stock > 0 &&
      !pulled.has(batch.batch_id)
  )

  const nearExpiry = safeData.filter(
    (batch) =>
      ['KRITIS', 'WASPADA'].includes(batch.status) &&
      batch.current_stock > 0
  )

  const expiredValue = expired.reduce(
    (total, batch) => total + nilai(batch),
    0
  )

  return (
    <>
      <section
        className={`${panelClass} flex flex-wrap items-end gap-3`}
      >
        <div>
          <h3 className="text-sm font-bold">Periode laporan</h3>
          <p className="mt-1 text-xs text-[#788984]">
            Atur rentang tanggal untuk ringkasan penjualan dan barang masuk.
          </p>
        </div>

        <label className="text-xs font-semibold text-[#52685f]">
          Dari
          <input
            className={`${inputClass} min-w-[155px]`}
            type="date"
            value={from}
            max={to}
            onChange={(event) => setFrom(event.target.value)}
          />
        </label>

        <label className="text-xs font-semibold text-[#52685f]">
          Sampai
          <input
            className={`${inputClass} min-w-[155px]`}
            type="date"
            value={to}
            min={from}
            max={today()}
            onChange={(event) => setTo(event.target.value)}
          />
        </label>
      </section>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Pendapatan penjualan"
          value={
            salesState === 'ok'
              ? rp(sales?.revenue ?? sales?.gross_revenue ?? 0)
              : salesState === 'loading'
                ? 'Memuat…'
                : 'Belum tersedia'
          }
          tone="green"
          detail={
            salesState === 'error'
              ? 'Data transaksi periode ini belum dapat dimuat'
              : `${sales?.transaction_count ?? 0} transaksi pada periode terpilih`
          }
        />

        <Metric
          label="Batch mendekati kedaluwarsa"
          value={`${nearExpiry.length} batch`}
          tone="amber"
          detail="Stok tersisa dengan masa kedaluwarsa ≤ 90 hari"
        />

        <Metric
          label="Estimasi nilai stok kedaluwarsa"
          value={rp(expiredValue)}
          tone="red"
          detail="Stok tersisa × Unit price"
        />

        <Metric
          label="Barang masuk periode ini"
          value={`${receivedUnits.toLocaleString('id-ID')} unit`}
          tone="blue"
          detail={`${receivedBatches.length} batch diterima`}
        />
      </div>

      <section className={panelClass}>
        <h3 className="mb-1 text-[15px] font-bold">
          Pantauan stok berisiko
        </h3>
        <p className="mb-4 text-xs text-[#788984]">
          Batch kedaluwarsa dan yang perlu segera dipantau.
        </p>

        {expired.length + nearExpiry.length === 0 && (
          <p className="py-6 text-center text-sm text-[#788984]">
            Tidak ada batch berisiko saat ini.
          </p>
        )}

        {[...expired, ...nearExpiry]
          .sort(
            (a, b) =>
              a.days_until_expiry - b.days_until_expiry
          )
          .slice(0, 8)
          .map((batch) => (
            <div
              key={batch.batch_id}
              className="flex flex-wrap items-center justify-between gap-2 border-t border-[#edf0ed] py-3"
            >
              <div>
                <b className="block text-sm">{batch.product_name}</b>
                <span className="text-xs text-[#788984]">
                  {batch.batch_id} · stok {batch.current_stock} ·
                  kedaluwarsa {fmtDate(batch.expiry_date)}
                </span>
              </div>

              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  batch.status === 'KADALUARSA'
                    ? 'bg-[#fbeae7] text-[#a43e32]'
                    : batch.status === 'KRITIS'
                      ? 'bg-[#ffedd5] text-[#c2410c]'
                      : 'bg-[#fff2dc] text-[#a76b1e]'
                }`}
              >
                {dtxt(batch.days_until_expiry)}
              </span>
            </div>
          ))}
      </section>
    </>
  )
}
