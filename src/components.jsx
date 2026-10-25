import { STATUS, dtxt, fmtDate } from './util.js'

const STATUS_STYLES = {
  ok: 'bg-[#e6f4ed] text-[#278264]',
  warn: 'bg-[#fff2dc] text-[#a76b1e]',
  att: 'bg-[#eaf1fc] text-[#4975b6]',
  bad: 'bg-[#fbeae7] text-[#c55342]',
}

export const Pill = ({ status }) => (
  <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-[5px] text-[11px] font-bold leading-tight ${STATUS_STYLES[STATUS[status].cls]}`}>
    {STATUS[status].label}
  </span>
)

export function ExpiryBar({ b }) {
  const w = b.days_until_expiry < 0 ? 100 : Math.max(6, Math.min(100, Math.round((b.days_until_expiry / 90) * 100)))
  const barStyles = {
    ok: 'bg-[#278264]',
    warn: 'bg-[#dfa83f]',
    att: 'bg-[#6591d0]',
    bad: 'bg-[#c55342]',
  }
  return (
    <div>
      <div className="h-[7px] overflow-hidden rounded-full bg-[#edf1ed]">
        <i className={`block h-full rounded-full ${barStyles[STATUS[b.status].cls]}`} style={{ width: w + '%' }} />
      </div>
      <small className="mt-1.5 block text-[11px] text-[#788984]">{dtxt(b.days_until_expiry)} · {fmtDate(b.expiry_date)}</small>
    </div>
  )
}

const STAT_STYLES = {
  bad: 'border-[#e7c2bb] bg-[#f2dcd7]',
  warn: 'border-[#e2d0a8] bg-[#efe3c5]',
  att: 'border-[#bfd0e2] bg-[#dce6f1]',
}

export const Stat = ({ n, label, tone }) => (
  <div className={`min-h-[110px] overflow-hidden rounded-[15px] border px-[13px] py-[15px] shadow-[0_3px_12px_rgba(29,56,44,0.025)] sm:min-h-[126px] sm:px-[18px] sm:py-[19px] ${STAT_STYLES[tone] || 'border-[#d7e8ee] bg-[#eef8fb]'}`}>
    <b className="mb-2 block break-words text-[21px] font-bold leading-[1.15] tracking-[-0.045em] sm:mb-2.5 sm:text-[clamp(21px,2vw,28px)]">{n}</b>
    <span className="block max-w-[190px] text-[11px] leading-[1.4] text-[#788984] sm:text-xs">{label}</span>
  </div>
)
