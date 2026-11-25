export const rp = (n) => 'Rp' + Number(n).toLocaleString('id-ID')
export const fmtDate = (s) => String(s).split('-').reverse().join('/')
export const dtxt = (d) => (d < 0 ? `Lewat ${-d} hari` : d === 0 ? 'Hari ini' : `${d} hari lagi`)
export const STATUS = {
  EXPIRED: { label: 'Kedaluwarsa', cls: 'bad' },
  WARNING_NEAR_EXPIRY: { label: '≤ 30 hari', cls: 'warn' },
  ATTENTION: { label: '31–60 hari', cls: 'att' },
  SAFE: { label: 'Aman', cls: 'ok' },
}
export const nilai = (b) => b.current_stock * b.unit_price
