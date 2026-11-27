import { useState } from 'react'
import logo from '../../Logo.jpg'
import { registerUser } from '../api.js'
import { validateUsername } from '../util.js'

const inputClass =
  'mt-1.5 w-full rounded-xl border border-[#dfe7e1] bg-white px-3.5 py-2.5 text-sm text-[#19352e] outline-none transition focus:border-[#104b6b] focus:shadow-[0_0_0_3px_rgba(16,75,107,0.1)]'

function EyeIcon({ open, size = 'h-5 w-5' }) {
  if (!open) {
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

export default function Register({ onBackToLogin }) {
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    const cleanName = fullName.trim()
    const cleanUsername = username.trim()
    const cleanEmail = email.trim().toLowerCase()

    const usernameError = validateUsername(username)
    if (usernameError) {
      setError(usernameError)
      return
    }

    if (password !== passwordConfirmation) {
      setError('Konfirmasi password tidak sama.')
      return
    }

    if (!cleanName || !cleanEmail || !password) {
      setError('Nama lengkap, email, dan kata sandi wajib diisi.')
      return
    }

    if (password.length < 8) {
      setError('Kata sandi minimal 8 karakter.')
      return
    }

    setBusy(true)
    try {
      const response = await registerUser({
        name: cleanName,
        username: cleanUsername,
        email: cleanEmail,
        password,
      })

      setSuccess(
        response?.message ||
          'Pendaftaran berhasil dikirim. Silakan tunggu persetujuan Admin sebelum masuk.'
      )
      setFullName('')
      setUsername('')
      setEmail('')
      setPassword('')
      setPasswordConfirmation('')
    } catch (err) {
      setError(err?.message || 'Pendaftaran gagal diproses. Periksa data lalu coba lagi.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7f4] p-4 text-[#19352e]">
      <div className="grid w-full max-w-[940px] overflow-hidden rounded-[24px] border border-[#e4eae5] bg-white shadow-[0_20px_50px_rgba(16,45,61,0.08)] md:grid-cols-[1.05fr_1fr]">
        <aside className="flex flex-col justify-between bg-[#104b6b] p-7 text-[#f4fbfe] sm:p-10">
          <div className="flex items-center gap-3">
            <span
              className="relative h-11 w-11 flex-none overflow-hidden rounded-[13px] bg-white"
              aria-hidden="true"
            >
              <img
                src={logo}
                alt=""
                className="absolute left-[-19px] top-[-13px] w-[80px] max-w-none"
              />
            </span>
            <span className="text-lg font-bold tracking-[-0.03em]">Royal PetCare</span>
          </div>

          <div className="my-10 md:my-0">
            <span className="text-[11px] font-bold tracking-[0.14em] text-[#9ec7d6]">
              AKSES KARYAWAN
            </span>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-[-0.04em] sm:text-[34px]">
              Ajukan akun operasional.
            </h1>
            <p className="mt-3.5 text-sm leading-relaxed text-[#cde3ec]">
              Daftarkan akun karyawan baru. Akun akan aktif setelah disetujui oleh Admin toko.
            </p>
          </div>

          <p className="text-xs text-[#9ec7d6]">Satu ruang kerja untuk operasional toko.</p>
        </aside>

        <section className="flex flex-col justify-center p-7 sm:p-10">
          <span className="text-[11px] font-bold tracking-[0.14em] text-[#17735b]">
            PENDAFTARAN BARU
          </span>
          <h2 className="mt-1.5 text-2xl font-extrabold tracking-[-0.03em] text-[#19352e] sm:text-[28px]">
            Buat akun
          </h2>
          <p className="mt-1.5 text-xs text-[#788984] sm:text-sm">
            Lengkapi data di bawah untuk mengajukan akses masuk.
          </p>

          <form className="mt-5 space-y-3.5" onSubmit={handleSubmit}>
            <label htmlFor="reg-name" className="block text-xs font-semibold text-[#52685f]">
              Nama lengkap *
              <input
                id="reg-name"
                name="name"
                type="text"
                className={inputClass}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Masukkan nama lengkap"
                autoComplete="name"
                required
              />
            </label>

            <label htmlFor="reg-username" className="block text-xs font-semibold text-[#52685f]">
              Username *
              <input
                id="reg-username"
                name="username"
                type="text"
                className={inputClass}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                onInvalid={(event) => {
                  if (!event.currentTarget.value.trim()) {
                    setError('Username wajib diisi.')
                  }
                }}
                placeholder="Contoh: username123"
                autoComplete="username"
                required
              />
            </label>

            <label htmlFor="reg-email" className="block text-xs font-semibold text-[#52685f]">
              Email *
              <input
                id="reg-email"
                name="email"
                type="email"
                className={inputClass}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nama@email.com"
                autoComplete="email"
                required
              />
            </label>

            <label htmlFor="reg-password" className="block text-xs font-semibold text-[#52685f]">
              Password *
              <div className="relative">
                <input
                  id="reg-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`${inputClass} pr-11`}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimal 8 karakter"
                  minLength={8}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  className="absolute right-3 top-1/2 mt-0.5 -translate-y-1/2 rounded-lg p-1 text-[#52685f] transition hover:bg-[#f0f4f2] hover:text-[#104b6b]"
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </label>

            <label htmlFor="reg-password-confirmation" className="block text-xs font-semibold text-[#52685f]">
              Konfirmasi password *
              <div className="relative">
                <input
                  id="reg-password-confirmation"
                  name="password_confirmation"
                  type={showPasswordConfirmation ? 'text' : 'password'}
                  className={`${inputClass} pr-11`}
                  value={passwordConfirmation}
                  onChange={(event) => setPasswordConfirmation(event.target.value)}
                  placeholder="Ulangi password"
                  minLength={8}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirmation((prev) => !prev)}
                  aria-label={
                    showPasswordConfirmation ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'
                  }
                  title={
                    showPasswordConfirmation ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'
                  }
                  className="absolute right-3 top-1/2 mt-0.5 -translate-y-1/2 rounded-lg p-1 text-[#52685f] transition hover:bg-[#f0f4f2] hover:text-[#104b6b]"
                >
                  <EyeIcon open={showPasswordConfirmation} />
                </button>
              </div>
            </label>

            {error && (
              <p
                className="rounded-xl border border-[#f2c8c1] bg-[#fbeae7] px-3.5 py-2.5 text-xs font-medium text-[#a43e32]"
                role="alert"
              >
                {error}
              </p>
            )}

            {success && (
              <p
                className="rounded-xl border border-[#bfe3cf] bg-[#e6f4ed] px-3.5 py-2.5 text-xs font-medium text-[#236b51]"
                role="status"
              >
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-[#104b6b] py-3 text-sm font-bold text-white transition hover:bg-[#0b3c56] disabled:cursor-wait disabled:opacity-60"
            >
              {busy ? 'Mendaftarkan…' : 'Daftar'}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-[#788984]">
            Sudah punya akun?{' '}
            <button
              type="button"
              onClick={onBackToLogin}
              className="font-bold text-[#104b6b] hover:underline"
            >
              Masuk
            </button>
          </p>
        </section>
      </div>
    </div>
  )
}