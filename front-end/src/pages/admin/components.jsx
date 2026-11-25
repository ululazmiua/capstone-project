// Bagian yang dipakai bersama oleh halaman-halaman admin

export const inputClass =
  'mt-1 w-full rounded-[10px] border border-[#dfe7e1] bg-white px-3 py-2.5 text-sm text-[#19352e] outline-none focus:border-[#7eae96] focus:shadow-[0_0_0_3px_rgba(23,115,91,0.1)]'

export const panelClass =
  'mb-5 rounded-[15px] border border-[#e7ece8] bg-white px-[15px] py-[17px] shadow-[0_4px_16px_rgba(29,56,44,0.025)] sm:px-[22px] sm:py-[21px]'

export function Metric({ label, value, tone = 'blue', detail }) {
  const colors = {
    blue: 'border-[#d7eaf1] bg-[#eaf5f8] text-[#155b77]',
    green: 'border-[#d4eadc] bg-[#eaf6ee] text-[#276b4c]',
    amber: 'border-[#f1e3c5] bg-[#fff5df] text-[#8a641f]',
    red: 'border-[#f1d5cf] bg-[#fff0ec] text-[#a3483a]',
  }

  return (
    <article className={`rounded-[13px] border p-4 ${colors[tone]}`}>
      <p className="text-xs font-semibold opacity-80">{label}</p>
      <p className="mt-2 text-xl font-extrabold tracking-tight sm:text-2xl">
        {value}
      </p>
      {detail && <p className="mt-1 text-[11px] opacity-75">{detail}</p>}
    </article>
  )
}
