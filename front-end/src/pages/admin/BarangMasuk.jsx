import { useMemo, useState } from 'react'
import { fmtDate } from '../../util.js'
import { firstOfMonth, today } from './dates.js'
import { inputClass, panelClass } from './components.jsx'

// Halaman Riwayat Barang Masuk (admin)
export default function AdminBarangMasuk({ data = [] }) {
  const safeData = Array.isArray(data) ? data : []

  const [receiptFrom, setReceiptFrom] = useState(firstOfMonth)
  const [receiptTo, setReceiptTo] = useState(today)

  const periodReceiptBatches = useMemo(
    () =>
      safeData
        .filter(
          (batch) =>
            batch.entry_date >= receiptFrom &&
            batch.entry_date <= receiptTo
        )
        .sort((a, b) => b.entry_date.localeCompare(a.entry_date)),
    [safeData, receiptFrom, receiptTo]
  )

  const periodReceivedUnits = periodReceiptBatches.reduce(
    (total, batch) => total + Number(batch.initial_stock || 0),
    0
  )

  return (
    <section className={panelClass}>
      <div className="mb-4">
        <h3 className="text-[15px] font-bold">
          Riwayat barang masuk
        </h3>
        <p className="mt-1 text-xs text-[#788984]">
          Pilih periode untuk melihat penerimaan barang.
        </p>
      </div>

      <div className="mb-5 flex flex-wrap items-end gap-3 rounded-xl bg-[#f6f8f6] p-3.5">
        <label className="text-xs font-semibold text-[#52685f]">
          Dari
          <input
            className={`${inputClass} min-w-[155px]`}
            type="date"
            value={receiptFrom}
            max={receiptTo}
            onChange={(event) => setReceiptFrom(event.target.value)}
          />
        </label>

        <label className="text-xs font-semibold text-[#52685f]">
          Sampai
          <input
            className={`${inputClass} min-w-[155px]`}
            type="date"
            value={receiptTo}
            min={receiptFrom}
            max={today()}
            onChange={(event) => setReceiptTo(event.target.value)}
          />
        </label>

        <p className="pb-2 text-xs font-semibold text-[#52685f]">
          {periodReceiptBatches.length} batch ·{' '}
          {periodReceivedUnits.toLocaleString('id-ID')} unit
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-xs">
          <thead className="border-y border-[#edf0ed] text-[#788984]">
            <tr>
              <th className="py-3 pr-3">Tanggal masuk</th>
              <th className="py-3 pr-3">Produk</th>
              <th className="py-3 pr-3">Batch</th>
              <th className="py-3 pr-3">Jumlah masuk</th>
              <th className="py-3">Stok saat ini</th>
            </tr>
          </thead>

          <tbody>
            {periodReceiptBatches.map((batch) => (
              <tr
                key={batch.batch_id}
                className="border-b border-[#edf0ed]"
              >
                <td className="py-3 pr-3">
                  {fmtDate(batch.entry_date)}
                </td>
                <td className="py-3 pr-3 font-semibold">
                  {batch.product_name}
                </td>
                <td className="py-3 pr-3">
                  {batch.batch_number || batch.batch_id}
                </td>
                <td className="py-3 pr-3">
                  {Number(batch.initial_stock || 0).toLocaleString('id-ID')}
                </td>
                <td className="py-3">
                  {Number(batch.current_stock || 0).toLocaleString('id-ID')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {periodReceiptBatches.length === 0 && (
          <p className="py-8 text-center text-sm text-[#788984]">
            Tidak ada data barang masuk pada periode ini.
          </p>
        )}
      </div>
    </section>
  )
}
