import { useEffect, useMemo, useState } from 'react'
import {
  createEmployee,
  deleteEmployee,
  getEmployees,
  getSalesSummary,
  updateEmployee,
} from '../api.js'
import { dtxt, fmtDate, nilai, rp } from '../util.js'

const inputClass =
  'mt-1 w-full rounded-[10px] border border-[#dfe7e1] bg-white px-3 py-2.5 text-sm text-[#19352e] outline-none focus:border-[#7eae96] focus:shadow-[0_0_0_3px_rgba(23,115,91,0.1)]'
const panelClass =
  'mb-5 rounded-[15px] border border-[#e7ece8] bg-white px-[15px] py-[17px] shadow-[0_4px_16px_rgba(29,56,44,0.025)] sm:px-[22px] sm:py-[21px]'
const employeeBlank = {
  full_name: '',
  username: '',
  email: '',
  phone: '',
  password: '',
  role: 'employee',
  status: 'active',
}
const DISMISSED_STORAGE_KEY = 'petcare_dismissed_registrations'

function EyeIcon({ open, size = 'h-5 w-5' }) {
  if (open) {
    return (
      <svg
        className={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    )
  }

  return (
    <svg
      className={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function today() {
  const date = new Date()
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 10)
}

function firstOfMonth() {
  return `${today().slice(0, 7)}-01`
}

function normalizeEmployee(employee) {
  const raw = employee?.data || employee?.employee || employee || {}

  let normalizedStatus = 'active'
  if (
    raw.status === 'inactive' ||
    raw.status === 'nonaktif' ||
    raw.status === false ||
    raw.is_active === false ||
    raw.active === false
  ) {
    normalizedStatus = 'inactive'
  }

  const rawRole = String(raw.role || '').toLowerCase()
  const normalizedRole = rawRole === 'admin' ? 'admin' : 'employee'

  return {
    ...raw,
    employee_id: raw.employee_id ?? raw.id,
    full_name: raw.full_name ?? raw.name ?? '',
    username:
      raw.username ||
      raw.user_name ||
      (raw.email ? raw.email.split('@')[0] : ''),
    role: normalizedRole,
    status: normalizedStatus,
  }
}

function Metric({ label, value, tone = 'blue', detail }) {
  const colors = {
    blue: 'border-[#d7eaf1] bg-[#eaf5f8] text-[#155b77]',
    green: 'border-[#d4eadc] bg-[#eaf6ee] text-[#276b4c]',
    amber: 'border-[#f1e3c5] bg-[#fff5df] text-[#8a641f]',
    red: 'border-[#f1d5cf] bg-[#fff0ec] text-[#a3483a]',
  }
  return (
    <article className={`rounded-[13px] border p-4 ${colors[tone]}`}>
      <p className="text-xs font-semibold opacity-80">{label}</p>
      <p className="mt-2 text-xl font-extrabold tracking-tight sm:text-2xl">{value}</p>
      {detail && <p className="mt-1 text-[11px] opacity-75">{detail}</p>}
    </article>
  )
}

function EmployeeDialog({ initial, busy, error, onClose, onSave }) {
  const [form, setForm] = useState({
    request_id: initial.request_id,
    full_name: initial.full_name || initial.name || '',
    username: initial.username || '',
    email: initial.email || '',
    phone: initial.phone || '',
    password: '',
    role: initial.role === 'admin' ? 'admin' : 'employee',
    status: initial.status === 'inactive' ? 'inactive' : 'active',
    employee_id: initial.employee_id ?? initial.id,
  })
  const [showPassword, setShowPassword] = useState(false)
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center overflow-y-auto bg-[#102d3d]/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose()
      }}
    >
      <section
        className="my-auto w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
        role="dialog"
        aria-modal="true"
        aria-labelledby="employee-form-title"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 id="employee-form-title" className="mb-1 text-lg font-bold">
              {form.employee_id ? 'Ubah akun pengguna' : 'Tambah akun pengguna'}
            </h3>
            <p className="text-xs text-[#788984]">
              Atur informasi akun dan role akses (Admin atau Karyawan).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg px-2 py-1 text-xl leading-none text-[#788984] hover:bg-[#f3f6f3] disabled:opacity-50"
            aria-label="Tutup form"
          >
            ×
          </button>
        </div>

        <form
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault()
            onSave(form)
          }}
        >
          <label
            htmlFor="emp-full-name"
            className="text-xs font-semibold text-[#52685f] sm:col-span-2"
          >
            Nama lengkap *
            <input
              id="emp-full-name"
              name="full_name"
              className={inputClass}
              value={form.full_name}
              onChange={set('full_name')}
              required
              maxLength={120}
              autoComplete="name"
            />
          </label>

          <label htmlFor="emp-username" className="text-xs font-semibold text-[#52685f]">
            Username *
            <input
              id="emp-username"
              name="username"
              className={inputClass}
              value={form.username}
              onChange={set('username')}
              required
              maxLength={60}
              autoComplete="username"
            />
          </label>

          <label htmlFor="emp-email" className="text-xs font-semibold text-[#52685f]">
            Email
            <input
              id="emp-email"
              name="email"
              className={inputClass}
              type="email"
              value={form.email}
              onChange={set('email')}
              maxLength={150}
              autoComplete="email"
            />
          </label>

          <label htmlFor="emp-phone" className="text-xs font-semibold text-[#52685f]">
            Nomor telepon
            <input
              id="emp-phone"
              name="phone"
              className={inputClass}
              type="tel"
              value={form.phone}
              onChange={set('phone')}
              maxLength={40}
              autoComplete="tel"
            />
          </label>

          <label htmlFor="emp-role" className="text-xs font-semibold text-[#52685f]">
            Role akses
            <select
              id="emp-role"
              name="role"
              className={inputClass}
              value={form.role || 'employee'}
              onChange={set('role')}
            >
              <option value="employee">Karyawan</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <label
            htmlFor="emp-password"
            className="text-xs font-semibold text-[#52685f] sm:col-span-2"
          >
            {form.employee_id
              ? 'Password baru (kosongkan jika tidak ingin mengubah)'
              : 'Password *'}
            <div className="relative">
              <input
                id="emp-password"
                name="password"
                className={`${inputClass} pr-11`}
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                required={!form.employee_id}
                minLength={8}
                placeholder="Minimal 8 karakter"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                className="absolute right-3 top-1/2 mt-0.5 -translate-y-1/2 rounded-lg p-1 text-[#52685f] transition hover:bg-[#f0f4f2] hover:text-[#104b6b]"
              >
                <EyeIcon open={showPassword} size="h-5 w-5" />
              </button>
            </div>
          </label>

          {form.employee_id && (
            <label
              htmlFor="emp-status"
              className="text-xs font-semibold text-[#52685f] sm:col-span-2"
            >
              Status akses
              <select
                id="emp-status"
                name="status"
                className={inputClass}
                value={form.status || 'active'}
                onChange={set('status')}
              >
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </label>
          )}

          {error && (
            <p
              className="rounded-lg bg-[#fbeae7] px-3 py-2.5 text-sm text-[#a43e32] sm:col-span-2"
              role="alert"
            >
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1 sm:col-span-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-lg border border-[#dfe7e1] px-4 py-2.5 text-sm font-semibold text-[#486158] hover:bg-[#f4f8f4] disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-[#104b6b] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0b3c56] disabled:cursor-wait disabled:opacity-60"
            >
              {busy
                ? 'Menyimpan…'
                : form.employee_id
                  ? 'Simpan perubahan'
                  : 'Tambah akun'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default function Admin({
  data,
  suppliers,
  supplierState,
  tab,
  registrationRequests,
  registrationError,
  onReviewRegistration,
  onDeleteRegistration,
}) {
  const [from, setFrom] = useState(firstOfMonth)
  const [to, setTo] = useState(today)
  const [receiptFrom, setReceiptFrom] = useState(firstOfMonth)
  const [receiptTo, setReceiptTo] = useState(today)
  const [sales, setSales] = useState(null)
  const [salesState, setSalesState] = useState('loading')
  const [employees, setEmployees] = useState([])
  const [employeeState, setEmployeeState] = useState('loading')
  const [employeeError, setEmployeeError] = useState('')
  const [employeeForm, setEmployeeForm] = useState(null)
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      const raw = localStorage.getItem(DISMISSED_STORAGE_KEY)
      return new Set(raw ? JSON.parse(raw) : [])
    } catch {
      return new Set()
    }
  })

  const dismissRegistration = (requestId) => {
    if (!requestId) return
    setDismissedIds((prev) => {
      const next = new Set(prev)
      next.add(requestId)
      try {
        localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify([...next]))
      } catch {
        // abaikan jika storage penuh
      }
      return next
    })
    onDeleteRegistration?.(requestId)
  }

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

  const loadEmployees = async () => {
    setEmployeeState('loading')
    setEmployeeError('')
    try {
      const result = await getEmployees()
      const list = Array.isArray(result) ? result : result?.data || []
      setEmployees(list.map(normalizeEmployee))
      setEmployeeState('ok')
    } catch {
      setEmployeeState('error')
      setEmployeeError('Data karyawan gagal dimuat. Periksa koneksi lalu coba lagi.')
    }
  }

  useEffect(() => {
    loadEmployees()
  }, [])

  const isAccountCreated = (request) => {
    if (dismissedIds.has(request.request_id)) return true

    const reqUsername = (request.username || '').trim().toLowerCase()
    const reqEmail = (request.email || '').trim().toLowerCase()
    const reqName = (request.full_name || request.name || '').trim().toLowerCase()

    return employees.some((emp) => {
      const empUsername = (emp.username || '').trim().toLowerCase()
      const empEmail = (emp.email || '').trim().toLowerCase()
      const empName = (emp.full_name || emp.name || '').trim().toLowerCase()

      if (reqUsername && empUsername && reqUsername === empUsername) return true
      if (reqEmail && empEmail && reqEmail === empEmail) return true
      if (reqName && empName && reqName === empName) return true
      return false
    })
  }

  const receivedBatches = useMemo(
    () =>
      data
        .filter((batch) => batch.entry_date >= from && batch.entry_date <= to)
        .sort((a, b) => b.entry_date.localeCompare(a.entry_date)),
    [data, from, to]
  )
  const periodReceiptBatches = useMemo(
    () =>
      data
        .filter((batch) => batch.entry_date >= receiptFrom && batch.entry_date <= receiptTo)
        .sort((a, b) => b.entry_date.localeCompare(a.entry_date)),
    [data, receiptFrom, receiptTo]
  )
  const receivedUnits = receivedBatches.reduce(
    (total, batch) => total + Number(batch.initial_stock || 0),
    0
  )
  const periodReceivedUnits = periodReceiptBatches.reduce(
    (total, batch) => total + Number(batch.initial_stock || 0),
    0
  )
  const expired = data.filter((batch) => batch.status === 'EXPIRED' && batch.current_stock > 0)
  const nearExpiry = data.filter(
    (batch) => ['WARNING_NEAR_EXPIRY', 'ATTENTION'].includes(batch.status) && batch.current_stock > 0
  )
  const expiredValue = expired.reduce((total, batch) => total + nilai(batch), 0)
  const activeEmployees = employees.filter((employee) => employee.status !== 'inactive')
  const pendingRegistrations = registrationRequests.filter(
    (request) => request.status === 'pending' && !isAccountCreated(request)
  )
  const reviewedRegistrations = registrationRequests
    .filter((request) => request.status !== 'pending' && !isAccountCreated(request))
    .sort((a, b) => (b.reviewed_at || '').localeCompare(a.reviewed_at || ''))

  const reviewRegistration = async (request, status) => {
    const action = status === 'approved' ? 'setujui' : 'tolak'
    const cleanName = (request.full_name || request.name || '').trim()
    if (
      !window.confirm(
        `${action === 'setujui' ? 'Setujui' : 'Tolak'} permintaan pendaftaran ${cleanName}?`
      )
    )
      return

    setBusy(true)
    setEmployeeError('')

    try {
      if (status === 'approved') {
        const cleanUsername = (request.username || '').trim()
        const cleanEmail = (request.email || '').trim()
        const cleanPhone = (request.phone || '').trim()
        const rawPassword = request.password || 'PetCare1234'

        if (!isAccountCreated(request)) {
          const payload = {
            name: cleanName,
            full_name: cleanName,
            username: cleanUsername,
            ...(cleanEmail ? { email: cleanEmail } : {}),
            ...(cleanPhone ? { phone: cleanPhone } : {}),
            role: 'employee',
            password: rawPassword,
          }

          const saved = await createEmployee(payload)
          const rawSaved = saved?.data || saved?.employee || saved || {}
          const normalizedSaved = normalizeEmployee({
            ...rawSaved,
            full_name: rawSaved.full_name ?? rawSaved.name ?? cleanName,
            username: rawSaved.username || rawSaved.user_name || cleanUsername,
            role: rawSaved.role || 'employee',
            status: rawSaved.status || 'active',
          })

          setEmployees((current) => [normalizedSaved, ...current])
        }

        dismissRegistration(request.request_id)
      }

      onReviewRegistration(request.request_id, status)
      setNotice(
        status === 'approved'
          ? `Permintaan ${cleanName} disetujui dan akun karyawan otomatis ditambahkan.`
          : 'Permintaan pendaftaran ditolak.'
      )
      window.setTimeout(() => setNotice(''), 3000)
    } catch (err) {
      const serverMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        (Array.isArray(err?.response?.data?.errors) ? err.response.data.errors.join(', ') : '') ||
        err?.message
      setEmployeeError(
        serverMessage || 'Gagal menyetujui dan membuat akun karyawan. Periksa data lalu coba lagi.'
      )
    } finally {
      setBusy(false)
    }
  }

  const saveEmployee = async (form) => {
    setBusy(true)
    setFormError('')
    try {
      const isEditing = Boolean(form.employee_id)
      const cleanName = form.full_name.trim()
      const cleanUsername = form.username.trim()
      const trimmedEmail = form.email.trim()
      const trimmedPhone = form.phone.trim()
      const trimmedPassword = (form.password || '').trim()
      const selectedRole = form.role === 'admin' ? 'admin' : 'employee'
      const selectedStatus = form.status === 'inactive' ? 'inactive' : 'active'

      const payload = {
        name: cleanName,
        full_name: cleanName,
        username: cleanUsername,
        user_name: cleanUsername,
        ...(trimmedEmail ? { email: trimmedEmail } : {}),
        ...(trimmedPhone ? { phone: trimmedPhone } : {}),
        role: selectedRole,
        ...(trimmedPassword ? { password: trimmedPassword } : {}),
        ...(isEditing
          ? {
              status: selectedStatus,
              is_active: selectedStatus === 'active',
            }
          : {}),
      }

      const saved = isEditing
        ? await updateEmployee(form.employee_id, payload)
        : await createEmployee(payload)

      const rawSaved = saved?.data || saved?.employee || saved || {}

      const normalizedSaved = normalizeEmployee({
        ...rawSaved,
        employee_id: rawSaved.employee_id ?? rawSaved.id ?? form.employee_id,
        full_name: rawSaved.full_name ?? rawSaved.name ?? cleanName,
        username: rawSaved.username || cleanUsername,
        email: rawSaved.email ?? trimmedEmail,
        phone: rawSaved.phone ?? trimmedPhone,
        role: rawSaved.role || selectedRole,
        status: isEditing ? rawSaved.status || selectedStatus : 'active',
      })

      setEmployees((current) =>
        isEditing
          ? current.map((employee) =>
              employee.employee_id === normalizedSaved.employee_id ? normalizedSaved : employee
            )
          : [normalizedSaved, ...current]
      )

      if (!isEditing && form.request_id) {
        dismissRegistration(form.request_id)
      }

      setEmployeeForm(null)
      setNotice(
        isEditing ? 'Akun berhasil diperbarui.' : 'Akun berhasil ditambahkan.'
      )
      window.setTimeout(() => setNotice(''), 2500)
    } catch (err) {
      const serverMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        (Array.isArray(err?.response?.data?.errors) ? err.response.data.errors.join(', ') : '') ||
        err?.message
      setFormError(
        serverMessage || 'Akun gagal disimpan. Periksa data lalu coba lagi.'
      )
    } finally {
      setBusy(false)
    }
  }

  const removeEmployee = async (employee) => {
    const empId = employee.employee_id ?? employee.id
    const empName = (employee.full_name || employee.name || '').trim()
    const empEmail = (employee.email || '').trim().toLowerCase()
    const empUsername = (employee.username || '').trim().toLowerCase()

    if (!window.confirm(`Hapus akses akun ${empName}?`)) return
    setBusy(true)
    setEmployeeError('')
    try {
      await deleteEmployee(empId)
      setEmployees((current) => current.filter((item) => item.employee_id !== empId))

      registrationRequests.forEach((req) => {
        const reqName = (req.full_name || req.name || '').trim().toLowerCase()
        const reqEmail = (req.email || '').trim().toLowerCase()
        const reqUsername = (req.username || '').trim().toLowerCase()

        if (
          (empUsername && reqUsername === empUsername) ||
          (empEmail && reqEmail === empEmail) ||
          (empName && reqName === empName.toLowerCase())
        ) {
          dismissRegistration(req.request_id)
        }
      })

      setNotice('Akses akun berhasil dihapus.')
      window.setTimeout(() => setNotice(''), 2500)
    } catch {
      setEmployeeError('Akses akun gagal dihapus. Coba lagi.')
    } finally {
      setBusy(false)
    }
  }

  const pageTitles = {
    receipts: ['Riwayat Barang Masuk', 'Periksa penerimaan barang berdasarkan periode.'],
    suppliers: ['Data Supplier', 'Lihat informasi supplier yang terdaftar.'],
    employees: ['Kelola Karyawan', 'Atur akun dan role akses admin atau karyawan.'],
  }

  return (
    <>
      {tab !== 'overview' && (
        <div className="mb-[22px]">
          <h2 className="text-[22px] font-bold leading-tight tracking-[-0.04em] sm:text-[28px]">
            {pageTitles[tab][0]}
          </h2>
          <p className="mt-[7px] text-sm text-[#788984]">{pageTitles[tab][1]}</p>
        </div>
      )}

      {tab === 'overview' && (
        <>
          <section className={`${panelClass} flex flex-wrap items-end gap-3`}>
            <div>
              <h3 className="text-sm font-bold">Periode laporan</h3>
              <p className="mt-1 text-xs text-[#788984]">
                Atur rentang tanggal untuk ringkasan penjualan dan barang masuk.
              </p>
            </div>
            <label htmlFor="overview-from" className="text-xs font-semibold text-[#52685f]">
              Dari
              <input
                id="overview-from"
                name="overview_from"
                className={`${inputClass} min-w-[155px]`}
                type="date"
                value={from}
                max={to}
                onChange={(event) => setFrom(event.target.value)}
              />
            </label>
            <label htmlFor="overview-to" className="text-xs font-semibold text-[#52685f]">
              Sampai
              <input
                id="overview-to"
                name="overview_to"
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
              detail="Stok tersisa dengan masa kedaluwarsa ≤ 60 hari"
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
            <h3 className="mb-1 text-[15px] font-bold">Pantauan stok berisiko</h3>
            <p className="mb-4 text-xs text-[#788984]">
              Batch kedaluwarsa dan yang perlu segera dipantau.
            </p>
            {expired.length + nearExpiry.length === 0 && (
              <p className="py-6 text-center text-sm text-[#788984]">
                Tidak ada batch berisiko saat ini.
              </p>
            )}
            {[...expired, ...nearExpiry]
              .sort((a, b) => a.days_until_expiry - b.days_until_expiry)
              .slice(0, 8)
              .map((batch) => (
                <div
                  key={batch.batch_id}
                  className="flex flex-wrap items-center justify-between gap-2 border-t border-[#edf0ed] py-3"
                >
                  <div>
                    <b className="block text-sm">{batch.product_name}</b>
                    <span className="text-xs text-[#788984]">
                      {batch.batch_id} · stok {batch.current_stock} · kedaluwarsa{' '}
                      {fmtDate(batch.expiry_date)}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      batch.status === 'EXPIRED'
                        ? 'bg-[#fbeae7] text-[#a43e32]'
                        : 'bg-[#fff2dc] text-[#a76b1e]'
                    }`}
                  >
                    {dtxt(batch.days_until_expiry)}
                  </span>
                </div>
              ))}
          </section>
        </>
      )}

      {tab === 'receipts' && (
        <section className={panelClass}>
          <div className="mb-4">
            <h3 className="text-[15px] font-bold">Riwayat barang masuk</h3>
            <p className="mt-1 text-xs text-[#788984]">
              Pilih periode untuk melihat penerimaan barang.
            </p>
          </div>
          <div className="mb-5 flex flex-wrap items-end gap-3 rounded-xl bg-[#f6f8f6] p-3.5">
            <label htmlFor="receipt-from" className="text-xs font-semibold text-[#52685f]">
              Dari
              <input
                id="receipt-from"
                name="receipt_from"
                className={`${inputClass} min-w-[155px]`}
                type="date"
                value={receiptFrom}
                max={receiptTo}
                onChange={(event) => setReceiptFrom(event.target.value)}
              />
            </label>
            <label htmlFor="receipt-to" className="text-xs font-semibold text-[#52685f]">
              Sampai
              <input
                id="receipt-to"
                name="receipt_to"
                className={`${inputClass} min-w-[155px]`}
                type="date"
                value={receiptTo}
                min={receiptFrom}
                max={today()}
                onChange={(event) => setReceiptTo(event.target.value)}
              />
            </label>
            <p className="pb-2 text-xs font-semibold text-[#52685f]">
              {periodReceiptBatches.length} batch · {periodReceivedUnits.toLocaleString('id-ID')}{' '}
              unit
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
                  <tr key={batch.batch_id} className="border-b border-[#edf0ed]">
                    <td className="py-3 pr-3">{fmtDate(batch.entry_date)}</td>
                    <td className="py-3 pr-3 font-semibold">{batch.product_name}</td>
                    <td className="py-3 pr-3">{batch.batch_number || batch.batch_id}</td>
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
      )}

      {tab === 'suppliers' && (
        <section className={panelClass}>
          <h3 className="mb-1 text-[15px] font-bold">Data supplier</h3>
          <p className="mb-4 text-xs text-[#788984]">
            Informasi supplier hanya dapat dilihat dari panel admin.
          </p>
          {supplierState === 'disconnected' && (
            <p
              className="rounded-lg bg-[#fff5df] px-3 py-3 text-sm text-[#8a641f]"
              role="status"
            >
              Data supplier akan tampil setelah terhubung dengan server.
            </p>
          )}
          {supplierState === 'loading' && (
            <p className="py-6 text-center text-sm text-[#788984]" role="status">
              Memuat data supplier…
            </p>
          )}
          {supplierState === 'error' && (
            <p
              className="rounded-lg bg-[#fbeae7] px-3 py-3 text-sm text-[#a43e32]"
              role="alert"
            >
              Data supplier gagal dimuat.
            </p>
          )}
          {supplierState === 'ok' && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-xs">
                <thead className="border-y border-[#edf0ed] text-[#788984]">
                  <tr>
                    <th className="py-3 pr-3">Nama supplier</th>
                    <th className="py-3 pr-3">Kontak</th>
                    <th className="py-3 pr-3">Telepon</th>
                    <th className="py-3">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((supplier) => (
                    <tr key={supplier.supplier_id} className="border-b border-[#edf0ed]">
                      <td className="py-3 pr-3 font-semibold">{supplier.name}</td>
                      <td className="py-3 pr-3">{supplier.contact_person || '—'}</td>
                      <td className="py-3 pr-3">{supplier.phone || '—'}</td>
                      <td className="py-3">{supplier.email || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {suppliers.length === 0 && (
                <p className="py-8 text-center text-sm text-[#788984]">
                  Belum ada data supplier.
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {tab === 'employees' && (
        <section className={panelClass}>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-[15px] font-bold">Akun pengguna (Admin & Karyawan)</h3>
              <p className="mt-1 text-xs text-[#788984]">
                Kelola akun dan role akses untuk admin maupun operasional karyawan.
              </p>
            </div>
            <button
              onClick={() => {
                setEmployeeForm({ ...employeeBlank })
                setFormError('')
              }}
              className="rounded-lg bg-[#104b6b] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0b3c56]"
            >
              Tambah akun
            </button>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:max-w-sm">
            <Metric label="Total akun" value={employees.length} />
            <Metric label="Akun aktif" value={activeEmployees.length} tone="green" />
          </div>
          <div className="mb-6 rounded-xl border border-[#e7ece8] p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold">Permintaan pendaftaran</h4>
                <p className="mt-1 text-xs text-[#788984]">
                  Tinjau pengajuan akses karyawan yang masuk.
                </p>
              </div>
              <span className="rounded-full bg-[#fff2dc] px-2.5 py-1 text-[11px] font-bold text-[#a76b1e]">
                {pendingRegistrations.length} menunggu
              </span>
            </div>
            {registrationError && (
              <p
                className="mb-3 rounded-lg bg-[#fbeae7] px-3 py-2 text-xs text-[#a43e32]"
                role="alert"
              >
                {registrationError}
              </p>
            )}
            {pendingRegistrations.length === 0 ? (
              <p className="border-t border-[#edf0ed] py-5 text-center text-sm text-[#788984]">
                Belum ada permintaan pendaftaran.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-xs">
                  <thead className="border-y border-[#edf0ed] text-[#788984]">
                    <tr>
                      <th className="py-3 pr-3">Nama</th>
                      <th className="py-3 pr-3">Username</th>
                      <th className="py-3 pr-3">Email / telepon</th>
                      <th className="py-3 pr-3">Diajukan</th>
                      <th className="py-3">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingRegistrations.map((request) => (
                      <tr key={request.request_id} className="border-b border-[#edf0ed]">
                        <td className="py-3 pr-3 font-semibold">{request.full_name}</td>
                        <td className="py-3 pr-3">{request.username}</td>
                        <td className="py-3 pr-3">
                          {[request.email, request.phone].filter(Boolean).join(' · ') || '—'}
                        </td>
                        <td className="py-3 pr-3">
                          {new Date(request.requested_at).toLocaleDateString('id-ID')}
                        </td>
                        <td className="py-3">
                          <div className="flex gap-3">
                            <button
                              disabled={busy}
                              onClick={() => reviewRegistration(request, 'approved')}
                              className="font-bold text-[#236b51] hover:underline disabled:opacity-50"
                            >
                              Setujui
                            </button>
                            <button
                              disabled={busy}
                              onClick={() => reviewRegistration(request, 'rejected')}
                              className="font-bold text-[#a43e32] hover:underline disabled:opacity-50"
                            >
                              Tolak
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {reviewedRegistrations.length > 0 && (
              <div className="mt-5">
                <h5 className="mb-2 text-xs font-bold text-[#52685f]">Riwayat persetujuan</h5>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left text-xs">
                    <thead className="border-y border-[#edf0ed] text-[#788984]">
                      <tr>
                        <th className="py-2.5 pr-3">Nama</th>
                        <th className="py-2.5 pr-3">Username</th>
                        <th className="py-2.5 pr-3">Status</th>
                        <th className="py-2.5 pr-3">Tanggal ditinjau</th>
                        <th className="py-2.5">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviewedRegistrations.map((request) => (
                        <tr key={request.request_id} className="border-b border-[#edf0ed]">
                          <td className="py-2.5 pr-3 font-semibold">{request.full_name}</td>
                          <td className="py-2.5 pr-3">{request.username}</td>
                          <td className="py-2.5 pr-3">
                            <span
                              className={`rounded-full px-2 py-1 font-bold ${
                                request.status === 'approved'
                                  ? 'bg-[#e6f4ed] text-[#236b51]'
                                  : 'bg-[#fbeae7] text-[#a43e32]'
                              }`}
                            >
                              {request.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                            </span>
                          </td>
                          <td className="py-2.5 pr-3">
                            {request.reviewed_at
                              ? new Date(request.reviewed_at).toLocaleDateString('id-ID')
                              : '—'}
                          </td>
                          <td className="py-2.5">
                            <div className="flex gap-3">
                              {request.status === 'approved' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormError('')
                                    setEmployeeForm({
                                      request_id: request.request_id,
                                      full_name: request.full_name || '',
                                      username: request.username || '',
                                      email: request.email || '',
                                      phone: request.phone || '',
                                      password: '',
                                      role: 'employee',
                                      status: 'active',
                                    })
                                  }}
                                  className="font-bold text-[#155b77] hover:underline"
                                >
                                  Buat akun
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => dismissRegistration(request.request_id)}
                                className="font-bold text-[#a43e32] hover:underline"
                              >
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          {employeeError && (
            <p
              className="mb-4 rounded-lg bg-[#fbeae7] px-3 py-2.5 text-sm text-[#a43e32]"
              role="alert"
            >
              {employeeError}{' '}
              <button className="ml-2 font-bold underline" onClick={loadEmployees}>
                Muat ulang
              </button>
            </p>
          )}
          {employeeState === 'loading' && (
            <p className="py-6 text-center text-sm text-[#788984]" role="status">
              Memuat data akun…
            </p>
          )}
          {employeeState === 'ok' && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[840px] text-left text-xs">
                <thead className="border-y border-[#edf0ed] text-[#788984]">
                  <tr>
                    <th className="py-3 pr-3">Nama</th>
                    <th className="py-3 pr-3">Username</th>
                    <th className="py-3 pr-3">Email</th>
                    <th className="py-3 pr-3">Password</th>
                    <th className="py-3 pr-3">Role</th>
                    <th className="py-3 pr-3">Status</th>
                    <th className="py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.employee_id} className="border-b border-[#edf0ed]">
                      <td className="py-3 pr-3 font-semibold">{employee.full_name}</td>
                      <td className="py-3 pr-3">{employee.username || '—'}</td>
                      <td className="py-3 pr-3">{employee.email || '—'}</td>
                      <td className="py-3 pr-3 font-mono text-[#52685f]">••••••••</td>
                      <td className="py-3 pr-3">
                        <span
                          className={`rounded-full px-2.5 py-1 font-bold ${
                            employee.role === 'admin'
                              ? 'bg-[#eaf5f8] text-[#155b77]'
                              : 'bg-[#f4f6f4] text-[#486158]'
                          }`}
                        >
                          {employee.role === 'admin' ? 'Admin' : 'Karyawan'}
                        </span>
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className={`rounded-full px-2 py-1 font-bold ${
                            employee.status === 'inactive'
                              ? 'bg-[#f3f4f3] text-[#65736d]'
                              : 'bg-[#e6f4ed] text-[#236b51]'
                          }`}
                        >
                          {employee.status === 'inactive' ? 'Nonaktif' : 'Aktif'}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEmployeeForm(employee)
                              setFormError('')
                            }}
                            className="font-bold text-[#155b77] hover:underline"
                          >
                            Ubah
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => removeEmployee(employee)}
                            className="font-bold text-[#a43e32] hover:underline disabled:opacity-50"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {employees.length === 0 && (
                <p className="py-8 text-center text-sm text-[#788984]">
                  Belum ada akun terdaftar.
                </p>
              )}
            </div>
          )}
        </section>
      )}
      {notice && (
        <div
          className="fixed bottom-6 left-1/2 z-20 max-w-[90vw] -translate-x-1/2 rounded-xl bg-[#104b6b] px-[18px] py-3 text-[13px] font-semibold text-white shadow-xl"
          role="status"
        >
          {notice}
        </div>
      )}
      {employeeForm && (
        <EmployeeDialog
          initial={employeeForm}
          busy={busy}
          error={formError}
          onClose={() => setEmployeeForm(null)}
          onSave={saveEmployee}
        />
      )}
    </>
  )
}