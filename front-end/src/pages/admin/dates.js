// Fungsi tanggal untuk filter periode di halaman admin

export function today() {
  const date = new Date()
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 10)
}

export function firstOfMonth() {
  return `${today().slice(0, 7)}-01`
}
