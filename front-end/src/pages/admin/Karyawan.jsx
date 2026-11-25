import { useEffect, useState } from 'react'
import {
  createKaryawan,
  deleteKaryawan,
  getKaryawan,
  updateKaryawan,
} from '../../api.js'
import { inputClass, Metric, panelClass } from './components.jsx'

const karyawanBlank = {
  full_name: '',
  username: '',
  email: '',
  password: '',
  role: 'karyawan',
  status: 'active',
}

const DISMISSED_STORAGE_KEY = 'petcare_dismissed_registrations'

function EyeIcon({ open }) {
  return open ? (
    // Password terlihat: mata terbuka
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 5.2A10.5 10.5 0 0 1 12 5c5 0 9 7 9 7a15.5 15.5 0 0 1-4 4.5" />
      <path d="M6.2 6.2C4.2 7.6 3 12 3 12s4 7 9 7a9.8 9.8 0 0 0 3.8-.8" />
    </svg>
  )
}

function normalizeKaryawan(karyawan) {
  const raw = karyawan?.data || karyawan?.karyawan || karyawan || {}

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

  return {
    ...raw,
    karyawan_id: raw.karyawan_id ?? raw.id,
    full_name: raw.full_name ?? raw.name ?? '',
    username:
      raw.username ||
      raw.user_name ||
      (raw.email ? raw.email.split('@')[0] : ''),
    role: rawRole === 'admin' ? 'admin' : 'karyawan',
    status: normalizedStatus,
  }
}

// Form Karyawan
function KaryawanDialog({ initial, busy, error, onClose, onSave }) {
  const [form, setForm] = useState({
    request_id: initial.request_id,
    full_name: initial.full_name || initial.name || '',
    username: initial.username || '',
    email: initial.email || '',
    password: '',
    role: initial.role === 'admin' ? 'admin' : 'karyawan',
    status: initial.status === 'inactive' ? 'inactive' : 'active',
    karyawan_id: initial.karyawan_id ?? initial.id,
  })

  const [showPassword, setShowPassword] = useState(false)

  const set = (key) => (event) =>
    setForm((current) => ({
      ...current,
      [key]: event.target.value,
    }))

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
        aria-labelledby="karyawan-form-title"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 id="karyawan-form-title" className="mb-1 text-lg font-bold">
              {form.karyawan_id
                ? 'Ubah akun pengguna'
                : 'Tambah akun pengguna'}
            </h3>
            <p className="text-xs text-[#788984]">
              Atur informasi akun dan role akses.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg px-2 py-1 text-xl leading-none text-[#788984] hover:bg-[#f3f6f3] disabled:opacity-50"
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
          <label className="text-xs font-semibold text-[#52685f] sm:col-span-2">
            Nama lengkap *
            <input
              className={inputClass}
              value={form.full_name}
              onChange={set('full_name')}
              required
              maxLength={120}
            />
          </label>

          <label className="text-xs font-semibold text-[#52685f]">
            Username *
            <input
              className={inputClass}
              value={form.username}
              onChange={set('username')}
              required
              maxLength={60}
            />
          </label>

          <label className="text-xs font-semibold text-[#52685f]">
            Email
            <input
              className={inputClass}
              type="email"
              value={form.email}
              onChange={set('email')}
              maxLength={150}
            />
          </label>

          <label className="text-xs font-semibold text-[#52685f]">
            Role akses
            <select
              className={inputClass}
              value={form.role}
              onChange={set('role')}
            >
              <option value="karyawan">Karyawan</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <label className="text-xs font-semibold text-[#52685f] sm:col-span-2">
            {form.karyawan_id
              ? 'Password baru (opsional)'
              : 'Password *'}
            <div className="relative">
              <input
                className={`${inputClass} pr-11`}
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                required={!form.karyawan_id}
                minLength={8}
                placeholder="Minimal 8 karakter"
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 mt-0.5 -translate-y-1/2 rounded-lg p-1 text-[#52685f] hover:bg-[#f0f4f2]"
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </label>

          {form.karyawan_id && (
            <label className="text-xs font-semibold text-[#52685f] sm:col-span-2">
              Status akses
              <select
                className={inputClass}
                value={form.status}
                onChange={set('status')}
              >
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </label>
          )}

          {error && (
            <p className="rounded-lg bg-[#fbeae7] px-3 py-2.5 text-sm text-[#a43e32] sm:col-span-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1 sm:col-span-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-lg border border-[#dfe7e1] px-4 py-2.5 text-sm font-semibold text-[#486158]"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-[#104b6b] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {busy
                ? 'Menyimpan…'
                : form.karyawan_id
                  ? 'Simpan perubahan'
                  : 'Tambah akun'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

// Halaman Kelola Karyawan (admin)
export default function AdminKaryawan({
  registrationRequests = [],
  registrationError = '',
  onReviewRegistration,
  onDeleteRegistration,
}) {
  const safeRegistrations = Array.isArray(registrationRequests)
    ? registrationRequests
    : []

  const [daftarKaryawan, setDaftarKaryawan] = useState([])
  const [karyawanState, setKaryawanState] = useState('loading')
  const [karyawanError, setKaryawanError] = useState('')

  const [karyawanForm, setKaryawanForm] = useState(null)
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

  // Registrasi
  const dismissRegistration = (requestId) => {
    if (!requestId) return

    setDismissedIds((prev) => {
      const next = new Set(prev)
      next.add(requestId)

      try {
        localStorage.setItem(
          DISMISSED_STORAGE_KEY,
          JSON.stringify([...next])
        )
      } catch {
        // Abaikan jika storage penuh
      }

      return next
    })

    onDeleteRegistration?.(requestId)
  }

  // Data Karyawan
  const loadKaryawan = async () => {
    setKaryawanState('loading')
    setKaryawanError('')

    try {
      const result = await getKaryawan()

      const list = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : Array.isArray(result?.karyawan)
            ? result.karyawan
            : []

      setDaftarKaryawan(list.map(normalizeKaryawan))
      setKaryawanState('ok')
    } catch {
      setKaryawanState('error')
      setKaryawanError(
        'Data karyawan gagal dimuat. Muat ulang halaman lalu coba lagi.'
      )
    }
  }

  useEffect(() => {
    loadKaryawan()
  }, [])

  const isAccountCreated = (request) => {
    if (dismissedIds.has(request.request_id)) return true

    const reqUsername = (request.username || '').trim().toLowerCase()
    const reqEmail = (request.email || '').trim().toLowerCase()
    const reqName = (request.full_name || request.name || '')
      .trim()
      .toLowerCase()

    return daftarKaryawan.some((emp) => {
      const empUsername = (emp.username || '').trim().toLowerCase()
      const empEmail = (emp.email || '').trim().toLowerCase()
      const empName = (emp.full_name || emp.name || '')
        .trim()
        .toLowerCase()

      if (reqUsername && empUsername && reqUsername === empUsername)
        return true

      if (reqEmail && empEmail && reqEmail === empEmail)
        return true

      if (reqName && empName && reqName === empName)
        return true

      return false
    })
  }

  const karyawanAktif = daftarKaryawan.filter(
    (karyawan) => karyawan.status !== 'inactive'
  )

  const pendingRegistrations = safeRegistrations.filter(
    (request) =>
      request.status === 'pending' && !isAccountCreated(request)
  )

  const reviewedRegistrations = safeRegistrations
    .filter(
      (request) =>
        request.status !== 'pending' && !isAccountCreated(request)
    )
    .sort((a, b) =>
      (b.reviewed_at || '').localeCompare(a.reviewed_at || '')
    )

  // Setujui / Tolak Registrasi
  const reviewRegistration = async (request, status) => {
    const action = status === 'approved' ? 'setujui' : 'tolak'
    const cleanName = (request.full_name || request.name || '').trim()

    if (
      !window.confirm(
        `${action === 'setujui' ? 'Setujui' : 'Tolak'} permintaan pendaftaran ${cleanName}?`
      )
    ) {
      return
    }

    setBusy(true)
    setKaryawanError('')

    try {
      if (status === 'approved') {
        const cleanUsername = (request.username || '').trim()
        const cleanEmail = (request.email || '').trim()
        const rawPassword = request.password || 'PetCare1234'

        if (!isAccountCreated(request)) {
          const payload = {
            name: cleanName,
            full_name: cleanName,
            username: cleanUsername,
            ...(cleanEmail ? { email: cleanEmail } : {}),
            role: 'karyawan',
            password: rawPassword,
          }

          const saved = await createKaryawan(payload)
          const rawSaved = saved?.data || saved?.karyawan || saved || {}

          const normalizedSaved = normalizeKaryawan({
            ...rawSaved,
            full_name: rawSaved.full_name ?? rawSaved.name ?? cleanName,
            username:
              rawSaved.username || rawSaved.user_name || cleanUsername,
            role: rawSaved.role || 'karyawan',
            status: rawSaved.status || 'active',
          })

          setDaftarKaryawan((current) => [normalizedSaved, ...current])
        }

        dismissRegistration(request.request_id)
      }

      onReviewRegistration?.(request.request_id, status)

      setNotice(
        status === 'approved'
          ? `Permintaan ${cleanName} disetujui dan akun karyawan otomatis ditambahkan.`
          : 'Permintaan pendaftaran ditolak.'
      )

      window.setTimeout(() => setNotice(''), 3000)
    } catch (err) {
      const serverMessage = err?.message

      setKaryawanError(
        serverMessage ||
          'Gagal menyetujui dan membuat akun karyawan. Periksa data lalu coba lagi.'
      )
    } finally {
      setBusy(false)
    }
  }

  // Tambah / Ubah Karyawan
  const saveKaryawan = async (form) => {
    setBusy(true)
    setFormError('')

    try {
      const isEditing = Boolean(form.karyawan_id)

      const cleanName = form.full_name.trim()
      const cleanUsername = form.username.trim()
      const trimmedEmail = form.email.trim()
      const trimmedPassword = (form.password || '').trim()

      const selectedRole = form.role === 'admin' ? 'admin' : 'karyawan'
      const selectedStatus =
        form.status === 'inactive' ? 'inactive' : 'active'

      const payload = {
        name: cleanName,
        full_name: cleanName,
        username: cleanUsername,
        user_name: cleanUsername,
        ...(trimmedEmail ? { email: trimmedEmail } : {}),
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
        ? await updateKaryawan(form.karyawan_id, payload)
        : await createKaryawan(payload)

      const rawSaved = saved?.data || saved?.karyawan || saved || {}

      const normalizedSaved = normalizeKaryawan({
        ...rawSaved,
        karyawan_id:
          rawSaved.karyawan_id ?? rawSaved.id ?? form.karyawan_id,
        full_name: rawSaved.full_name ?? rawSaved.name ?? cleanName,
        username: rawSaved.username || cleanUsername,
        email: rawSaved.email ?? trimmedEmail,
        role: rawSaved.role || selectedRole,
        status: isEditing
          ? rawSaved.status || selectedStatus
          : 'active',
      })

      setDaftarKaryawan((current) => {
        if (isEditing) {
          return current.map((karyawan) =>
            String(karyawan.karyawan_id) ===
            String(normalizedSaved.karyawan_id)
              ? normalizedSaved
              : karyawan
          )
        }

        return [
          normalizedSaved,
          ...current.filter(
            (karyawan) =>
              String(karyawan.karyawan_id) !==
              String(normalizedSaved.karyawan_id)
          ),
        ]
      })

      if (!isEditing && form.request_id) {
        dismissRegistration(form.request_id)
      }

      setKaryawanForm(null)

      setNotice(
        isEditing
          ? 'Akun berhasil diperbarui.'
          : 'Akun berhasil ditambahkan.'
      )

      window.setTimeout(() => setNotice(''), 2500)
    } catch (err) {
      const serverMessage = err?.message

      setFormError(
        serverMessage || 'Akun gagal disimpan. Periksa data lalu coba lagi.'
      )
    } finally {
      setBusy(false)
    }
  }

  // Hapus Karyawan
  const removeKaryawan = async (karyawan) => {
    const empId = karyawan.karyawan_id ?? karyawan.id
    const empName = (karyawan.full_name || karyawan.name || '').trim()
    const empEmail = (karyawan.email || '').trim().toLowerCase()
    const empUsername = (karyawan.username || '').trim().toLowerCase()

    if (!window.confirm(`Hapus akses akun ${empName}?`)) return

    setBusy(true)
    setKaryawanError('')

    try {
      await deleteKaryawan(empId)

      setDaftarKaryawan((current) =>
        current.filter(
          (item) => String(item.karyawan_id) !== String(empId)
        )
      )

      safeRegistrations.forEach((req) => {
        const reqName = (req.full_name || req.name || '')
          .trim()
          .toLowerCase()
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
      setKaryawanError('Akses akun gagal dihapus. Coba lagi.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="mb-[22px]">
        <h2 className="text-[22px] font-bold leading-tight tracking-[-0.04em] sm:text-[28px]">
          Kelola Karyawan
        </h2>
        <p className="mt-[7px] text-sm text-[#788984]">
          Atur akun dan role akses admin atau karyawan.
        </p>
      </div>
      <section className={panelClass}>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-bold">
              Akun pengguna (Admin & Karyawan)
            </h3>
            <p className="mt-1 text-xs text-[#788984]">
              Kelola akun dan role akses untuk admin maupun operasional karyawan.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setKaryawanForm({ ...karyawanBlank })
              setFormError('')
            }}
            className="rounded-lg bg-[#104b6b] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0b3c56]"
          >
            Tambah akun
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 sm:max-w-sm">
          <Metric label="Total akun" value={daftarKaryawan.length} />
          <Metric
            label="Akun aktif"
            value={karyawanAktif.length}
            tone="green"
          />
        </div>

        {/* Permintaan Pendaftaran */}
        <div className="mb-6 rounded-xl border border-[#e7ece8] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold">
                Permintaan pendaftaran
              </h4>
              <p className="mt-1 text-xs text-[#788984]">
                Tinjau pengajuan akses karyawan yang masuk.
              </p>
            </div>

            <span className="rounded-full bg-[#fff2dc] px-2.5 py-1 text-[11px] font-bold text-[#a76b1e]">
              {pendingRegistrations.length} menunggu
            </span>
          </div>

          {registrationError && (
            <p className="mb-3 rounded-lg bg-[#fbeae7] px-3 py-2 text-xs text-[#a43e32]">
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
                    <th className="py-3 pr-3">Email</th>
                    <th className="py-3 pr-3">Diajukan</th>
                    <th className="py-3">Tindakan</th>
                  </tr>
                </thead>

                <tbody>
                  {pendingRegistrations.map((request) => (
                    <tr
                      key={request.request_id}
                      className="border-b border-[#edf0ed]"
                    >
                      <td className="py-3 pr-3 font-semibold">
                        {request.full_name || request.name || '—'}
                      </td>

                      <td className="py-3 pr-3">
                        {request.username || '—'}
                      </td>

                      <td className="py-3 pr-3">
                        {request.email || '—'}
                      </td>

                      <td className="py-3 pr-3">
                        {request.requested_at
                          ? new Date(
                              request.requested_at
                            ).toLocaleDateString('id-ID')
                          : '—'}
                      </td>

                      <td className="py-3">
                        <div className="flex gap-3">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              reviewRegistration(request, 'approved')
                            }
                            className="font-bold text-[#236b51] hover:underline disabled:opacity-50"
                          >
                            Setujui
                          </button>

                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              reviewRegistration(request, 'rejected')
                            }
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

          {/* Riwayat Registrasi */}
          {reviewedRegistrations.length > 0 && (
            <div className="mt-5">
              <h5 className="mb-2 text-xs font-bold text-[#52685f]">
                Riwayat persetujuan
              </h5>

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
                      <tr
                        key={request.request_id}
                        className="border-b border-[#edf0ed]"
                      >
                        <td className="py-2.5 pr-3 font-semibold">
                          {request.full_name || request.name || '—'}
                        </td>

                        <td className="py-2.5 pr-3">
                          {request.username || '—'}
                        </td>

                        <td className="py-2.5 pr-3">
                          <span
                            className={`rounded-full px-2 py-1 font-bold ${
                              request.status === 'approved'
                                ? 'bg-[#e6f4ed] text-[#236b51]'
                                : 'bg-[#fbeae7] text-[#a43e32]'
                            }`}
                          >
                            {request.status === 'approved'
                              ? 'Disetujui'
                              : 'Ditolak'}
                          </span>
                        </td>

                        <td className="py-2.5 pr-3">
                          {request.reviewed_at
                            ? new Date(
                                request.reviewed_at
                              ).toLocaleDateString('id-ID')
                            : '—'}
                        </td>

                        <td className="py-2.5">
                          <div className="flex gap-3">
                            {request.status === 'approved' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setFormError('')
                                  setKaryawanForm({
                                    request_id: request.request_id,
                                    full_name:
                                      request.full_name || request.name || '',
                                    username: request.username || '',
                                    email: request.email || '',
                                    password: '',
                                    role: 'karyawan',
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
                              onClick={() =>
                                dismissRegistration(request.request_id)
                              }
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

        {/* Error Karyawan */}
        {karyawanError && (
          <p
            className="mb-4 rounded-lg bg-[#fbeae7] px-3 py-2.5 text-sm text-[#a43e32]"
            role="alert"
          >
            {karyawanError}{' '}
            <button
              type="button"
              className="ml-2 font-bold underline"
              onClick={loadKaryawan}
            >
              Muat ulang
            </button>
          </p>
        )}

        {karyawanState === 'loading' && (
          <p className="py-6 text-center text-sm text-[#788984]">
            Memuat data akun…
          </p>
        )}

        {/* Tabel Karyawan */}
        {karyawanState === 'ok' && (
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
                {daftarKaryawan.map((karyawan) => (
                  <tr
                    key={karyawan.karyawan_id ?? karyawan.id}
                    className="border-b border-[#edf0ed]"
                  >
                    <td className="py-3 pr-3 font-semibold">
                      {karyawan.full_name || karyawan.name || '—'}
                    </td>

                    <td className="py-3 pr-3">
                      {karyawan.username || '—'}
                    </td>

                    <td className="py-3 pr-3">
                      {karyawan.email || '—'}
                    </td>

                    <td className="py-3 pr-3 font-mono text-[#52685f]">
                      ••••••••
                    </td>

                    <td className="py-3 pr-3">
                      <span
                        className={`rounded-full px-2.5 py-1 font-bold ${
                          karyawan.role === 'admin'
                            ? 'bg-[#eaf5f8] text-[#155b77]'
                            : 'bg-[#f4f6f4] text-[#486158]'
                        }`}
                      >
                        {karyawan.role === 'admin' ? 'Admin' : 'Karyawan'}
                      </span>
                    </td>

                    <td className="py-3 pr-3">
                      <span
                        className={`rounded-full px-2 py-1 font-bold ${
                          karyawan.status === 'inactive'
                            ? 'bg-[#f3f4f3] text-[#65736d]'
                            : 'bg-[#e6f4ed] text-[#236b51]'
                        }`}
                      >
                        {karyawan.status === 'inactive'
                          ? 'Nonaktif'
                          : 'Aktif'}
                      </span>
                    </td>

                    <td className="py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setKaryawanForm(karyawan)
                            setFormError('')
                          }}
                          className="font-bold text-[#155b77] hover:underline"
                        >
                          Ubah
                        </button>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => removeKaryawan(karyawan)}
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

            {daftarKaryawan.length === 0 && (
              <p className="py-8 text-center text-sm text-[#788984]">
                Belum ada akun terdaftar.
              </p>
            )}
          </div>
        )}
      </section>

      {/* Notifikasi */}
      {notice && (
        <div
          className="fixed bottom-6 left-1/2 z-50 max-w-[90vw] -translate-x-1/2 rounded-xl bg-[#104b6b] px-[18px] py-3 text-[13px] font-semibold text-white shadow-xl"
          role="status"
        >
          {notice}
        </div>
      )}

      {/* Modal Karyawan */}
      {karyawanForm && (
        <KaryawanDialog
          initial={karyawanForm}
          busy={busy}
          error={formError}
          onClose={() => {
            if (!busy) {
              setKaryawanForm(null)
              setFormError('')
            }
          }}
          onSave={saveKaryawan}
        />
      )}
    </>
  )
}
