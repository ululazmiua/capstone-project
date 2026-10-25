import { ExpiryBar, Stat } from '../components.jsx'
import { nilai, rp } from '../util.js'

export default function Ringkasan({ data, pulled, pull }) {
  const expired = data.filter((b) => b.status === 'EXPIRED' && b.current_stock > 0 && !pulled.has(b.batch_id))
  const near = data.filter((b) => b.status === 'WARNING_NEAR_EXPIRY' && b.current_stock > 0)
  const att = data.filter((b) => b.status === 'ATTENTION' && b.current_stock > 0)
  const loss = expired.reduce((s, b) => s + nilai(b), 0)
  const top = [...expired].sort((a, b) => nilai(b) - nilai(a)).slice(0, 8)
  const soon = [...near].sort((a, b) => a.days_until_expiry - b.days_until_expiry).slice(0, 8)
  return (
    <>
      <h2 className="text-[22px] font-bold leading-tight tracking-[-0.04em] sm:text-[28px]">Ringkasan stok</h2>
      <p className="mb-[22px] mt-[7px] text-sm text-[#788984]">Batch yang perlu ditindak hari ini.</p>
      <div className="mb-[22px] grid grid-cols-2 gap-[9px] lg:grid-cols-4 lg:gap-[14px]">
        <Stat n={`${expired.length} batch`} label="Batch kedaluwarsa masih di rak" tone="bad" />
        <Stat n={rp(loss)} label="Nilai stok kedaluwarsa" tone="bad" />
        <Stat n={`${near.length} batch`} label="Kedaluwarsa ≤ 30 hari" tone="warn" />
        <Stat n={`${att.length} batch`} label="Kedaluwarsa 31–60 hari" tone="att" />
      </div>
      <section className="mb-5 rounded-[15px] border border-[#e7ece8] bg-white px-[15px] py-[17px] shadow-[0_4px_16px_rgba(29,56,44,0.025)] sm:px-[22px] sm:py-[21px]">
        <h3 className="mb-[15px] text-[15px] font-bold tracking-[-0.015em]">Tarik dari rak (nilai terbesar dulu)</h3>
        {top.length === 0 && <p className="px-5 py-7 text-center text-[#788984]">Tidak ada batch kedaluwarsa yang tersisa di rak.</p>}
        {top.map((b) => (
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2.5 border-t border-[#edf0ed] py-3.5 sm:grid-cols-[minmax(0,1.15fr)_minmax(170px,1.7fr)_auto] sm:gap-[18px]" key={b.batch_id}>
            <div><b className="mb-0.5 block text-[13px] font-semibold">{b.product_name}</b><small className="block text-xs text-[#788984]">{b.batch_id} · stok {b.current_stock} · {rp(nilai(b))}</small></div>
            <ExpiryBar b={b} />
            <button className="whitespace-nowrap rounded-lg border border-[#dfe7e1] bg-white px-[11px] py-[7px] text-[11px] font-bold text-[#486158] transition hover:border-[#b9d2c2] hover:bg-[#f4f8f4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8cc5a4]" onClick={() => pull(b)}>Tandai ditarik</button>
          </div>
        ))}
      </section>
      <section className="mb-5 rounded-[15px] border border-[#e7ece8] bg-white px-[15px] py-[17px] shadow-[0_4px_16px_rgba(29,56,44,0.025)] sm:px-[22px] sm:py-[21px]">
        <h3 className="mb-[15px] text-[15px] font-bold tracking-[-0.015em]">Prioritas jual (paling dekat kedaluwarsa)</h3>
        {soon.length === 0 && <p className="px-5 py-7 text-center text-[#788984]">Tidak ada batch yang mendekati kedaluwarsa.</p>}
        {soon.map((b) => (
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2.5 border-t border-[#edf0ed] py-3.5 sm:grid-cols-[minmax(0,1.15fr)_minmax(170px,1.7fr)_auto] sm:gap-[18px]" key={b.batch_id}>
            <div><b className="mb-0.5 block text-[13px] font-semibold">{b.product_name}</b><small className="block text-xs text-[#788984]">{b.batch_id} · stok {b.current_stock}</small></div>
            <ExpiryBar b={b} />
            <span className="inline-flex whitespace-nowrap rounded-full bg-[#fff2dc] px-2.5 py-[5px] text-[11px] font-bold leading-tight text-[#a76b1e]">Jual dulu</span>
          </div>
        ))}
      </section>
    </>
  )
}
