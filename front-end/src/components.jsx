
import { STATUS } from './util.js'

const STATUS_STYLES = {
  ok: 'bg-[#e6f4ed] text-[#278264]',
  warn: 'bg-[#fff2dc] text-[#a76b1e]',
  att: 'bg-[#eaf1fc] text-[#4975b6]',
  bad: 'bg-[#fbeae7] text-[#c55342]',
}

const BAR_STYLES = {
  ok: 'bg-[#278264]',
  warn: 'bg-[#dfa83f]',
  att: 'bg-[#6591d0]',
  bad: 'bg-[#c55342]',
}

const DEFAULT_STATUS = {
  label: 'Status tidak diketahui',
  cls: 'att',
}

const getStatus = (status) => {
  if (!STATUS || typeof STATUS !== 'object' || !status) {
    return DEFAULT_STATUS
  }

  return STATUS[status] ?? DEFAULT_STATUS
}

const getStatusClass = (status) => {
  return getStatus(status)?.cls ?? 'att'
}

export const Pill = ({ status }) => {
  const config = getStatus(status)
  const statusClass = getStatusClass(status)
  const style = STATUS_STYLES[statusClass] ?? STATUS_STYLES.att

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-[5px] text-[11px] font-bold leading-tight ${style}`}
    >
      {config.label}
    </span>
  )
}

export function ExpiryBar({ b }) {
  const parseExpiryDate = (value) => {
    if (!value) return null

    const text = String(value).trim()
    const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/)

    if (match) {
      const year = Number(match[1])
      const month = Number(match[2])
      const day = Number(match[3])
      const date = new Date(year, month - 1, day)

      if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
      ) {
        return null
      }

      return date
    }

    const date = new Date(text)
    if (Number.isNaN(date.getTime())) return null

    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    )
  }

  const expiryDate = parseExpiryDate(b?.expiry_date)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const days = expiryDate
    ? Math.round(
        (expiryDate.getTime() - today.getTime()) / 86400000
      )
    : null

  const width =
    days === null
      ? 0
      : days < 0
        ? 100
        : Math.max(6, Math.min(100, Math.round((days / 90) * 100)))

  const statusClass = getStatusClass(b?.status)
  const barStyle = BAR_STYLES[statusClass] ?? BAR_STYLES.att

  const daysLabel =
    days === null
      ? 'Tanggal tidak tersedia'
      : days < 0
        ? `Kedaluwarsa ${Math.abs(days)} hari lalu`
        : days === 0
          ? 'Kedaluwarsa hari ini'
          : `${days} hari lagi`

  const dateLabel = expiryDate
    ? `${String(expiryDate.getDate()).padStart(2, '0')}/${String(
        expiryDate.getMonth() + 1
      ).padStart(2, '0')}/${expiryDate.getFullYear()}`
    : 'Tanggal tidak valid'

  return (
    <div>
      <div className="h-[7px] overflow-hidden rounded-full bg-[#edf1ed]">
        <i
          className={`block h-full rounded-full ${barStyle}`}
          style={{ width: `${width}%` }}
        />
      </div>

      <small className="mt-1.5 block text-[11px] text-[#788984]">
        {daysLabel} · {dateLabel}
      </small>
    </div>
  )
}

const STAT_STYLES = {
  bad: 'border-[#e7c2bb] bg-[#f2dcd7]',
  warn: 'border-[#e2d0a8] bg-[#efe3c5]',
  att: 'border-[#bfd0e2] bg-[#dce6f1]',
}

export const Stat = ({ n, label, tone }) => {
  const style =
    STAT_STYLES[tone] || 'border-[#d7e8ee] bg-[#eef8fb]'

  return (
    <div
      className={`min-h-[110px] overflow-hidden rounded-[15px] border px-[13px] py-[15px] shadow-[0_3px_12px_rgba(29,56,44,0.025)] sm:min-h-[126px] sm:px-[18px] sm:py-[19px] ${style}`}
    >
      <b className="mb-2 block break-words text-[21px] font-bold leading-[1.15] tracking-[-0.045em] sm:mb-2.5 sm:text-[clamp(21px,2vw,28px)]">
        {n}
      </b>

      <span className="block max-w-[190px] text-[11px] leading-[1.4] text-[#788984] sm:text-xs">
        {label}
      </span>
    </div>
  )
}
