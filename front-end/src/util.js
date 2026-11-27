export const rp = (n) => 'Rp' + Number(n).toLocaleString('id-ID')
export const fmtDate = (s) => String(s).split('-').reverse().join('/')
export const dtxt = (d) => (d < 0 ? `Lewat ${-d} hari` : d === 0 ? 'Hari ini' : `${d} hari lagi`)
export const CATEGORIES = [
  'Makanan Kering',
  'Makanan Basah',
  'Snack',
  'Susu',
  'Vitamin & Suplemen',
  'Perawatan',
]
export const STATUS = {
  KADALUARSA: { label: 'Kedaluwarsa', cls: 'bad' },
  KRITIS: { label: 'Kritis (≤ 30 hari)', cls: 'att' },
  WASPADA: { label: 'Waspada (31–90 hari)', cls: 'warn' },
  AMAN: { label: 'Aman', cls: 'ok' },
}
export const nilai = (b) => b.current_stock * b.unit_price
