import { useEffect, useState } from 'react'
import {
  createKaryawan,
  deleteKaryawan,
  getKaryawan,
  updateKaryawan,
} from '../../api.js'
import { validateUsername } from '../../util.js'
import { inputClass, Metric, panelClass } from './components.jsx'

const karyawanBlank = {
  full_name: '',
  username: '',
  email: '',
  password: '',
  role: 'karyawan',
  status: 'active',
}

function EyeIcon({ open }) {
  return open ? (
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
  const normalizedStatus =
    raw.status === 'approved'
      ? 'active'
      : raw.status ||
        (raw.is_active === false || raw.active === false ? 'inactive' : 'active')
  const rawRole = String(raw.role || '').toLowerCase()

  return {
    ...raw,
    karyawan_id: raw.karyawan_id ?? raw.user_id ?? raw.id,
    full_name: raw.full_name ?? raw.name ?? '',
    username:
      raw.username ||
      raw.user_name ||
      (raw.email ? raw.email.split('@')[0] : ''),
    role: rawRole === 'admin' ? 'admin' : 'karyawan',
    status: normalizedStatus,
  }
}

function formatIdDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('id-ID')
}

function KaryawanDialog({ initial, busy, error, onClose, onSave }) {
  const [form, setForm] = useState({
    full_name: initial.full_name || initial.name || '',
    username: initial.username || '',
    original_username: initial.username || '',
    email: initial.email || '',
    password: '',
    role: initial.role === 'admin' ? 'admin' : 'karyawan',
    status: initial.status === 'inactive' ? 'inactive' : 'active',
    karyawan_id: initial.karyawan_id ?? initial.user_id ?? initial.id,
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
              autoComplete="off"
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
              autoComplete="off"
              required
              maxLength={60}
            />
          </label>

          <label className="text-xs font-semibold text-[#52685f]">
            Email *
            <input
              className={inputClass}
              type="email"
              value={form.email}
              onChange={set('email')}
              autoComplete="off"
              required
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
                autoComplete="new-password"
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

export default function AdminKaryawan() {
  const [daftarKaryawan, setDaftarKaryawan] = useState([])
  const [karyawanState, setKaryawanState] = useState('loading')
  const [karyawanError, setKaryawanError] = useState('')
  const [karyawanForm, setKaryawanForm] = useState(null)
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  const pendingRegistrations = daftarKaryawan.filter(
    (karyawan) => karyawan.status === 'pending'
  )
  const rejectedRegistrations = daftarKaryawan.filter(
    (karyawan) => karyawan.status === 'rejected'
  )
  const userAccounts = daftarKaryawan.filter(
    (karyawan) =>
      karyawan.status === 'active' || karyawan.status === 'inactive'
  )
  const activeAccounts = userAccounts.filter(
    (karyawan) => karyawan.status === 'active'
  )

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

  const updateAccountInList = (account, result, fallbackStatus) => {
    const saved = result?.data || result?.karyawan || result || {}
    const normalizedSaved = normalizeKaryawan({
      ...account,
      ...saved,
      karyawan_id:
        saved.karyawan_id ??
        saved.user_id ??
        saved.id ??
        account.karyawan_id,
      status: saved.status ?? fallbackStatus,
    })

    setDaftarKaryawan((current) =>
      current.map((item) =>
        String(item.karyawan_id) === String(normalizedSaved.karyawan_id)
          ? normalizedSaved
          : item
      )
    )
    return normalizedSaved
  }

  const reviewRegistration = async (account, status) => {
    const cleanName = (account.full_name || account.name || '').trim()
    const approve = status === 'active'
    const action = approve ? 'Setujui' : 'Tolak'

    if (!window.confirm(`${action} permintaan pendaftaran ${cleanName}?`)) {
      return
    }

    setBusy(true)
    setKaryawanError('')

    try {
      const result = await updateKaryawan(
        account.karyawan_id ?? account.id,
        { ...account, status }
      )
      updateAccountInList(account, result, status)
      setNotice(
        approve
          ? `Permintaan ${cleanName} disetujui.`
          : `Permintaan ${cleanName} ditolak.`
      )
      window.setTimeout(() => setNotice(''), 3000)
    } catch (error) {
      setKaryawanError(
        error?.message || 'Permintaan pendaftaran gagal diperbarui.'
      )
    } finally {
      setBusy(false)
    }
  }

  const saveKaryawan = async (form) => {
    setBusy(true)
    setFormError('')

    try {
      const isEditing = Boolean(form.karyawan_id)
      const cleanName = form.full_name.trim()
      const cleanUsername = form.username.trim()
      const trimmedEmail = form.email.trim()
      const trimmedPassword = (form.password || '').trim()

      if (!isEditing || form.username !== form.original_username) {
        const usernameError = validateUsername(cleanUsername)
        if (usernameError) {
          setFormError(usernameError)
          return
        }
      }

      if (!cleanName || !trimmedEmail) {
        setFormError('Nama lengkap dan email wajib diisi.')
        return
      }

      const selectedRole = form.role === 'admin' ? 'admin' : 'karyawan'
      const selectedStatus =
        form.status === 'inactive' ? 'inactive' : 'active'
      const payload = {
        name: cleanName,
        full_name: cleanName,
        username: cleanUsername,
        user_name: cleanUsername,
        email: trimmedEmail,
        role: selectedRole,
        ...(trimmedPassword ? { password: trimmedPassword } : {}),
        ...(isEditing ? { status: selectedStatus } : {}),
      }

      const result = isEditing
        ? await updateKaryawan(form.karyawan_id, payload)
        : await createKaryawan(payload)
      const saved = result?.data || result?.karyawan || result || {}
      const previous = isEditing
        ? daftarKaryawan.find(
            (account) =>
              String(account.karyawan_id) === String(form.karyawan_id)
          ) || {}
        : {}
      const normalizedSaved = normalizeKaryawan({
        ...previous,
        ...saved,
        karyawan_id:
          saved.karyawan_id ?? saved.user_id ?? saved.id ?? form.karyawan_id,
        full_name: saved.full_name ?? saved.name ?? cleanName,
        username: saved.username ?? cleanUsername,
        email: saved.email ?? trimmedEmail,
        role: saved.role || selectedRole,
        status: saved.status || (isEditing ? selectedStatus : 'active'),
      })

      setDaftarKaryawan((current) =>
        isEditing
          ? current.map((account) =>
              String(account.karyawan_id) ===
              String(normalizedSaved.karyawan_id)
                ? normalizedSaved
                : account
            )
          : [normalizedSaved, ...current]
      )
      setKaryawanForm(null)
      setNotice(
        isEditing
          ? 'Akun berhasil diperbarui.'
          : 'Akun berhasil ditambahkan.'
      )
      window.setTimeout(() => setNotice(''), 2500)
    } catch (error) {
      setFormError(
        error?.message || 'Akun gagal disimpan. Periksa data lalu coba lagi.'
      )
    } finally {
      setBusy(false)
    }
  }

  const removeKaryawan = async (account, label) => {
    const accountId = account.karyawan_id ?? account.id
    const accountName = (account.full_name || account.name || '').trim()

    if (!window.confirm(`Hapus ${label} ${accountName}?`)) return

    setBusy(true)
    setKaryawanError('')

    try {
      await deleteKaryawan(accountId)
      setDaftarKaryawan((current) =>
        current.filter(
          (item) => String(item.karyawan_id) !== String(accountId)
        )
      )
      setNotice(
        label === 'akun'
          ? 'Akses akun berhasil dihapus.'
          : 'Riwayat penolakan berhasil dihapus.'
      )
      window.setTimeout(() => setNotice(''), 2500)
    } catch (error) {
      setKaryawanError(
        error?.message || 'Data gagal dihapus. Coba lagi.'
      )
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

        {karyawanState === 'ok' && (
          <>
            <div className="mb-5 rounded-xl border border-[#e7ece8] p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold">
                    Permintaan pendaftaran
                  </h3>
                  <p className="mt-1 text-xs text-[#788984]">
                    Tinjau pengajuan akses karyawan yang masuk.
                  </p>
                </div>
                <span className="rounded-full bg-[#fff2dc] px-2.5 py-1 text-[11px] font-bold text-[#a76b1e]">
                  {pendingRegistrations.length} menunggu
                </span>
              </div>

              {pendingRegistrations.length === 0 ? (
                <p className="border-t border-[#edf0ed] py-5 text-center text-sm text-[#788984]">
                  Belum ada permintaan pendaftaran.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-xs">
                    <thead className="border-y border-[#edf0ed] text-[#788984]">
                      <tr>
                        <th className="py-3 pr-3">Nama lengkap</th>
                        <th className="py-3 pr-3">Username</th>
                        <th className="py-3 pr-3">Email</th>
                        <th className="py-3 pr-3">Diajukan</th>
                        <th className="py-3">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingRegistrations.map((account) => (
                        <tr
                          key={account.karyawan_id}
                          className="border-b border-[#edf0ed]"
                        >
                          <td className="py-3 pr-3 font-semibold">
                            {account.full_name || '—'}
                          </td>
                          <td className="py-3 pr-3">
                            {account.username || '—'}
                          </td>
                          <td className="py-3 pr-3">
                            {account.email || '—'}
                          </td>
                          <td className="py-3 pr-3">
                            {formatIdDate(account.created_at)}
                          </td>
                          <td className="py-3">
                            <div className="flex gap-3">
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  reviewRegistration(account, 'active')
                                }
                                className="font-bold text-[#236b51] hover:underline disabled:opacity-50"
                              >
                                Setujui
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  reviewRegistration(account, 'rejected')
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
            </div>

            <div className="mb-5 rounded-xl border border-[#e7ece8] p-4">
              <h3 className="mb-3 text-sm font-bold">Riwayat penolakan</h3>
              {rejectedRegistrations.length === 0 ? (
                <p className="border-t border-[#edf0ed] py-5 text-center text-sm text-[#788984]">
                  Belum ada permintaan yang ditolak.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left text-xs">
                    <thead className="border-y border-[#edf0ed] text-[#788984]">
                      <tr>
                        <th className="py-3 pr-3">Nama lengkap</th>
                        <th className="py-3 pr-3">Username</th>
                        <th className="py-3 pr-3">Status</th>
                        <th className="py-3">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rejectedRegistrations.map((account) => (
                        <tr
                          key={account.karyawan_id}
                          className="border-b border-[#edf0ed]"
                        >
                          <td className="py-3 pr-3 font-semibold">
                            {account.full_name || '—'}
                          </td>
                          <td className="py-3 pr-3">
                            {account.username || '—'}
                          </td>
                          <td className="py-3 pr-3">
                            <span className="rounded-full bg-[#fbeae7] px-2 py-1 font-bold text-[#a43e32]">
                              Ditolak
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex gap-3">
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  reviewRegistration(account, 'active')
                                }
                                className="font-bold text-[#236b51] hover:underline disabled:opacity-50"
                              >
                                Setujui
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  removeKaryawan(account, 'riwayat penolakan')
                                }
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
                </div>
              )}
            </div>

            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="text-[15px] font-bold">Akun pengguna</h3>
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
              <Metric label="Total akun" value={userAccounts.length} />
              <Metric
                label="Akun aktif"
                value={activeAccounts.length}
                tone="green"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead className="border-y border-[#edf0ed] text-[#788984]">
                  <tr>
                    <th className="py-3 pr-3">Nama lengkap</th>
                    <th className="py-3 pr-3">Username</th>
                    <th className="py-3 pr-3">Email</th>
                    <th className="py-3 pr-3">Role</th>
                    <th className="py-3 pr-3">Status</th>
                    <th className="py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {userAccounts.map((account) => (
                    <tr
                      key={account.karyawan_id}
                      className="border-b border-[#edf0ed]"
                    >
                      <td className="py-3 pr-3 font-semibold">
                        {account.full_name || '—'}
                      </td>
                      <td className="py-3 pr-3">
                        {account.username || '—'}
                      </td>
                      <td className="py-3 pr-3">
                        {account.email || '—'}
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className={`rounded-full px-2.5 py-1 font-bold ${
                            account.role === 'admin'
                              ? 'bg-[#eaf5f8] text-[#155b77]'
                              : 'bg-[#f4f6f4] text-[#486158]'
                          }`}
                        >
                          {account.role === 'admin' ? 'Admin' : 'Karyawan'}
                        </span>
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className={`rounded-full px-2 py-1 font-bold ${
                            account.status === 'inactive'
                              ? 'bg-[#f3f4f3] text-[#65736d]'
                              : 'bg-[#e6f4ed] text-[#236b51]'
                          }`}
                        >
                          {account.status === 'inactive'
                            ? 'Nonaktif'
                            : 'Aktif'}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setKaryawanForm(account)
                              setFormError('')
                            }}
                            className="font-bold text-[#155b77] hover:underline"
                          >
                            Ubah
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => removeKaryawan(account, 'akun')}
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

              {userAccounts.length === 0 && (
                <p className="py-8 text-center text-sm text-[#788984]">
                  Belum ada akun terdaftar.
                </p>
              )}
            </div>
          </>
        )}
      </section>

      {notice && (
        <div
          className="fixed bottom-6 left-1/2 z-50 max-w-[90vw] -translate-x-1/2 rounded-xl bg-[#104b6b] px-[18px] py-3 text-[13px] font-semibold text-white shadow-xl"
          role="status"
        >
          {notice}
        </div>
      )}

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
