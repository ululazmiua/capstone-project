import { useMemo, useState } from 'react'
import { fmtDate, rp } from '../../util.js'
import { firstOfMonth, today } from './dates.js'
import { inputClass, panelClass } from './components.jsx'

// Halaman Riwayat Barang Masuk (admin)
export default function AdminBarangMasuk({ data = [] }) {
  const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data])

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
    <>
      <div className="mb-[22px]">
        <h2 className="text-[22px] font-bold leading-tight tracking-[-0.04em] sm:text-[28px]">
          Riwayat Barang Masuk
        </h2>
        <p className="mt-[7px] text-sm text-[#788984]">
          Periksa penerimaan barang berdasarkan periode.
        </p>
      </div>

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
          <table className="w-full min-w-[820px] border-collapse">
            <thead className="border-y border-[#edf0ed] text-[#788984]">
              <tr>
                <th className="border-b border-[#e6ece7] px-2.5 py-2.5 text-left text-[10px] font-bold uppercase text-[#809089]">
                  Tanggal masuk
                </th>
                <th className="border-b border-[#e6ece7] px-2.5 py-2.5 text-left text-[10px] font-bold uppercase text-[#809089]">
                  Produk
                </th>
                <th className="border-b border-[#e6ece7] px-2.5 py-2.5 text-left text-[10px] font-bold uppercase text-[#809089]">
                  No. batch
                </th>
                <th className="border-b border-[#e6ece7] px-2.5 py-2.5 text-left text-[10px] font-bold uppercase text-[#809089]">
                  Jumlah masuk
                </th>
                <th className="border-b border-[#e6ece7] px-2.5 py-2.5 text-left text-[10px] font-bold uppercase text-[#809089]">
                  Harga satuan
                </th>
                <th className="border-b border-[#e6ece7] px-2.5 py-2.5 text-left text-[10px] font-bold uppercase text-[#809089]">
                  Supplier
                </th>
                <th className="border-b border-[#e6ece7] px-2.5 py-2.5 text-left text-[10px] font-bold uppercase text-[#809089]">
                  Kedaluwarsa
                </th>
              </tr>
            </thead>

            <tbody>
              {periodReceiptBatches.map((batch) => (
                <tr
                  key={batch.batch_id}
                  className="hover:bg-[#fafcf9]"
                >
                  <td className="border-b border-[#edf0ed] px-2.5 py-3 text-xs">
                    {batch.entry_date ? fmtDate(batch.entry_date) : '—'}
                  </td>
                  <td className="border-b border-[#edf0ed] px-2.5 py-3 text-xs">
                    <b className="block font-semibold text-[#19352e]">
                      {batch.product_name}
                    </b>
                    <span className="text-[11px] text-[#788984]">
                      {batch.category || '—'}
                    </span>
                  </td>
                  <td className="border-b border-[#edf0ed] px-2.5 py-3 text-xs">
                    {batch.batch_number || batch.batch_id}
                  </td>
                  <td className="border-b border-[#edf0ed] px-2.5 py-3 text-xs">
                    {Number(batch.initial_stock || 0).toLocaleString('id-ID')}
                  </td>
                  <td className="border-b border-[#edf0ed] px-2.5 py-3 text-xs">
                    {rp(batch.unit_price || 0)}
                  </td>
                  <td className="border-b border-[#edf0ed] px-2.5 py-3 text-xs">
                    {batch.supplier_name || '—'}
                  </td>
                  <td className="border-b border-[#edf0ed] px-2.5 py-3 text-xs">
                    {batch.expiry_date ? fmtDate(batch.expiry_date) : '—'}
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
    </>
  )
}
