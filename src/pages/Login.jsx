import { useState } from 'react'
import logo from '../../Logo.jpg'
import { loginUser } from '../api.js'

const inputClass =
  'mt-1.5 w-full rounded-xl border border-[#dfe7e1] bg-white px-3.5 py-2.5 text-sm text-[#19352e] outline-none transition focus:border-[#104b6b] focus:shadow-[0_0_0_3px_rgba(16,75,107,0.1)]'

export default function Login({ onLogin, onRegisterClick }) {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const cleanIdentifier = identifier.trim()
    if (!cleanIdentifier || !password) {
      setError('Email atau username dan password wajib diisi.')
      return
    }

    setBusy(true)
    try {
      const response = await loginUser({
        email: cleanIdentifier,
        username: cleanIdentifier,
        password,
      })

      if (response?.token) {
        try {
          localStorage.setItem('token', response.token)
        } catch {
          // abaikan jika storage penuh
        }
      }

      const account = response?.user || response
      onLogin?.(account)
    } catch (err) {
      const serverMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        (err?.code === 'ERR_NETWORK'
          ? 'Tidak dapat terhubung ke server. Pastikan backend menyala.'
          : 'Email atau password salah.')
      setError(serverMessage)
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
              INVENTORY WORKSPACE
            </span>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-[-0.04em] sm:text-[34px]">
              Kelola toko, lebih mudah.
            </h1>
            <p className="mt-3.5 text-sm leading-relaxed text-[#cde3ec]">
              Masuk untuk mengakses pengelolaan stok, penjualan, dan pemantauan Royal PetCare.
            </p>
          </div>

          <p className="text-xs text-[#9ec7d6]">Satu ruang kerja untuk operasional toko.</p>
        </aside>

        <section className="flex flex-col justify-center p-7 sm:p-10">
          <span className="text-[11px] font-bold tracking-[0.14em] text-[#17735b]">
            SELAMAT DATANG
          </span>
          <h2 className="mt-1.5 text-2xl font-extrabold tracking-[-0.03em] text-[#19352e] sm:text-[28px]">
            Masuk ke akun
          </h2>
          <p className="mt-1.5 text-xs text-[#788984] sm:text-sm">
            Gunakan akun yang sudah terdaftar untuk melanjutkan.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label htmlFor="login-email" className="block text-xs font-semibold text-[#52685f]">
              Email atau Username
              <input
                id="login-email"
                name="email"
                type="text"
                className={inputClass}
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="nama@email.com atau username"
                autoComplete="username"
                required
              />
            </label>

            <label htmlFor="login-password" className="block text-xs font-semibold text-[#52685f]">
              Kata sandi
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`${inputClass} pr-24`}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Masukkan kata sandi"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 mt-0.5 -translate-y-1/2 text-xs font-semibold text-[#104b6b] hover:underline"
                >
                  {showPassword ? 'Sembunyikan' : 'Tampilkan'}
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

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-[#104b6b] py-3 text-sm font-bold text-white transition hover:bg-[#0b3c56] disabled:cursor-wait disabled:opacity-60"
            >
              {busy ? 'Memproses…' : 'Masuk'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-[#788984]">
            Belum punya akun?{' '}
            <button
              type="button"
              onClick={onRegisterClick}
              className="font-bold text-[#104b6b] hover:underline"
            >
              Daftar
            </button>
          </p>
        </section>
      </div>
    </div>
  )
}