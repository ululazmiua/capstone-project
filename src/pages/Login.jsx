import { useState } from 'react'
import logo from '../../Logo.jpg'

const inputClass = 'mt-1.5 w-full rounded-xl border border-[#dce7e5] bg-white px-4 py-3 text-sm text-[#19352e] outline-none transition placeholder:text-[#9aa9a4] focus:border-[#4b9baa] focus:shadow-[0_0_0_3px_rgba(23,115,139,0.12)]'

function RegistrationForm({ onSubmit, onBack }) {
  const [form, setForm] = useState({ full_name: '', username: '', email: '', phone: '' })
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))

  const submit = (event) => {
    event.preventDefault()
    setError('')
    try {
      onSubmit(form)
      setSubmitted(true)
    } catch (submitError) {
      setError(submitError.message || 'Permintaan pendaftaran gagal dikirim.')
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-[#d4eadc] bg-[#edf7f0] p-5" role="status">
        <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg font-bold text-[#278264]" aria-hidden="true">✓</span>
        <h3 className="text-base font-bold text-[#236b51]">Permintaan terkirim</h3>
        <p className="mt-2 text-sm leading-6 text-[#52685f]">Pendaftaranmu menunggu persetujuan admin. Setelah disetujui, admin akan membantu aktivasi akun.</p>
        <button type="button" onClick={onBack} className="mt-5 w-full rounded-xl bg-[#104b6b] px-4 py-3 text-sm font-bold text-white hover:bg-[#0b3c56]">Kembali ke login</button>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6">
        <p className="mb-2 text-[10px] font-bold tracking-[0.16em] text-[#388396]">AKSES KARYAWAN</p>
        <h2 className="text-[28px] font-extrabold leading-tight tracking-[-0.04em] sm:text-[32px]">Daftar karyawan</h2>
        <p className="mt-2 text-sm text-[#788984]">Ajukan pendaftaran untuk ditinjau admin toko.</p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-xs font-bold text-[#40584f]">
          Nama lengkap *
          <input className={inputClass} type="text" value={form.full_name} onChange={set('full_name')} autoComplete="name" maxLength={120} required placeholder="Masukkan nama lengkap" />
        </label>
        <label className="block text-xs font-bold text-[#40584f]">
          Username *
          <input className={inputClass} type="text" value={form.username} onChange={set('username')} autoComplete="username" autoCapitalize="none" maxLength={60} required placeholder="Buat username" />
        </label>
        <label className="block text-xs font-bold text-[#40584f]">
          Email
          <input className={inputClass} type="email" value={form.email} onChange={set('email')} autoComplete="email" maxLength={150} placeholder="nama@email.com" />
        </label>
        <label className="block text-xs font-bold text-[#40584f]">
          Nomor telepon
          <input className={inputClass} type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" maxLength={40} placeholder="08xxxxxxxxxx" />
        </label>
        {error && <p className="rounded-xl border border-[#f0d2cc] bg-[#fff1ee] px-3.5 py-3 text-xs leading-5 text-[#a43e32]" role="alert">{error}</p>}
        <button type="submit" className="flex w-full items-center justify-center rounded-xl bg-[#104b6b] px-4 py-3.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(16,75,107,0.18)] transition hover:bg-[#0b3c56]">
          Kirim permintaan pendaftaran
        </button>
        <button type="button" onClick={onBack} className="w-full rounded-xl border border-[#dce7e5] px-4 py-3 text-sm font-bold text-[#486158] transition hover:bg-[#f4f8f4]">Kembali ke login</button>
      </form>
    </>
  )
}

export default function Login({ onRegister }) {
  const [view, setView] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f3f7f5] px-4 py-10 text-[#19352e]">
      <div className="pointer-events-none absolute -left-24 -top-28 h-80 w-80 rounded-full bg-[#d9eef1]/70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-36 -right-24 h-96 w-96 rounded-full bg-[#e0eee4]/80 blur-3xl" />
      <section className="relative grid w-full max-w-[940px] overflow-hidden rounded-[26px] border border-white/80 bg-white shadow-[0_24px_80px_rgba(26,61,58,0.12)] md:min-h-[570px] md:grid-cols-[1fr_1fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#104b6b] p-10 text-white md:flex">
          <div className="absolute -right-24 top-20 h-72 w-72 rounded-full border border-white/10" />
          <div className="absolute -right-10 top-36 h-44 w-44 rounded-full border border-white/10" />
          <div className="relative flex items-center gap-3">
            <span className="relative h-12 w-12 overflow-hidden rounded-2xl bg-white">
              <img src={logo} alt="" className="absolute left-[-19px] top-[-13px] w-[80px] max-w-none" />
            </span>
            <span className="text-lg font-extrabold tracking-tight">Royal PetCare</span>
          </div>
          <div className="relative max-w-sm pb-6">
            <span className="mb-4 block text-[10px] font-bold tracking-[0.18em] text-[#a9d8e4]">INVENTORY WORKSPACE</span>
            <h1 className="text-[36px] font-extrabold leading-[1.12] tracking-[-0.045em]">Kelola toko, lebih mudah.</h1>
            <p className="mt-4 text-sm leading-6 text-[#d1e7ed]">Masuk untuk mengakses pengelolaan stok, penjualan, dan pemantauan Royal PetCare.</p>
          </div>
          <p className="relative text-[11px] text-[#a9cbd5]">Satu ruang kerja untuk operasional toko.</p>
        </aside>

        <div className="flex flex-col justify-center px-6 py-9 sm:px-10 md:px-12">
          <div className="mb-8 flex items-center gap-3 md:hidden">
            <span className="relative h-11 w-11 overflow-hidden rounded-[13px] bg-[#104b6b]">
              <img src={logo} alt="" className="absolute left-[-17px] top-[-12px] w-[73px] max-w-none" />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-[#104b6b]">Royal PetCare</span>
          </div>
          {view === 'register' ? (
            <RegistrationForm onSubmit={onRegister} onBack={() => setView('login')} />
          ) : (
            <>
              <div className="mb-7">
                <p className="mb-2 text-[10px] font-bold tracking-[0.16em] text-[#388396]">SELAMAT DATANG</p>
                <h2 className="text-[28px] font-extrabold leading-tight tracking-[-0.04em] sm:text-[32px]">Masuk ke akun</h2>
                <p className="mt-2 text-sm text-[#788984]">Gunakan akun yang sudah terdaftar untuk melanjutkan.</p>
              </div>
              <form onSubmit={(event) => event.preventDefault()} className="space-y-5">
                <label className="block text-xs font-bold text-[#40584f]">
                  Username
                  <input
                    className={inputClass}
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    autoComplete="username"
                    autoCapitalize="none"
                    maxLength={60}
                    required
                    autoFocus
                    placeholder="Masukkan username"
                  />
                </label>
                <label className="block text-xs font-bold text-[#40584f]">
                  Kata sandi
                  <span className="relative mt-1.5 block">
                    <input
                      className={`${inputClass} mt-0 pr-16`}
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="current-password"
                      required
                      placeholder="Masukkan kata sandi"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded px-1 py-1 text-[11px] font-bold text-[#36788a] hover:text-[#104b6b]"
                      aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    >
                      {showPassword ? 'Sembunyikan' : 'Lihat'}
                    </button>
                  </span>
                </label>
                <button
                  type="submit"
                  className="flex w-full items-center justify-center rounded-xl bg-[#104b6b] px-4 py-3.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(16,75,107,0.18)] transition hover:bg-[#0b3c56] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#65bacb]"
                >
                  Masuk
                </button>
              </form>
              <p className="mt-7 text-center text-xs text-[#788984]">
                Belum punya akun?{' '}
                <button type="button" onClick={() => setView('register')} className="font-bold text-[#26788c] hover:text-[#104b6b] hover:underline">Daftar</button>
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  )
}
