import logo from '../../Logo.jpg'
import { Link, NavLink, Outlet } from 'react-router-dom'

export default function DashboardLayout({
  role,
  user,
  menu,
  onLogout,
  state,
  onReload,
}) {
  const isAdmin = role === 'admin'
  const profileName =
    user?.full_name || user?.name || user?.username || (isAdmin ? 'Admin' : 'Karyawan')
  const profileRoleLabel = isAdmin ? 'Admin' : 'Karyawan'
  const profileInitial = profileName.trim().charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-[#f5f7f4] text-[#19352e] md:grid md:grid-cols-[252px_minmax(0,1fr)]">
      <nav
        className="sticky top-0 z-10 flex h-auto items-center gap-3 overflow-x-auto bg-[#104b6b] px-3 py-2 text-[#f4fbfe] md:h-screen md:flex-col md:items-stretch md:gap-0 md:px-[17px] md:pb-[18px] md:pt-[25px]"
        aria-label="Menu utama"
      >
        <Link
          className="flex shrink-0 items-center gap-2 px-1.5 py-0 text-inherit no-underline md:gap-[11px] md:px-[7px] md:pb-[33px]"
          to={`/${role}`}
        >
          <span
            className="relative h-[35px] w-[35px] flex-none overflow-hidden rounded-[11px] bg-white md:h-[42px] md:w-[42px] md:rounded-[14px]"
            aria-hidden="true"
          >
            <img
              src={logo}
              alt=""
              className="absolute left-[-16px] top-[-11px] w-[67px] max-w-none md:left-[-19px] md:top-[-13px] md:w-[80px]"
            />
          </span>
          <span className="flex flex-col text-xs font-bold leading-tight tracking-[-0.04em] md:text-base">
            Royal PetCare
            <small className="hidden text-[10px] font-medium leading-tight tracking-[0.035em] text-[#b5d3df] md:block">
              Inventory workspace
            </small>
          </span>
        </Link>
        <span className="hidden px-3 pb-2.5 text-[10px] font-bold tracking-[0.13em] text-[#a4c8d6] md:block">
          {isAdmin ? 'MENU ADMIN' : 'MENU KARYAWAN'}
        </span>
        <div className="flex gap-1 md:grid md:gap-1.5">
          {menu.map(([path, label, icon]) => (
            <NavLink
              key={path}
              to={`/${role}/${path}`}
              end
              className={({ isActive }) =>
                `flex min-h-[38px] shrink-0 items-center gap-[7px] rounded-[9px] px-2.5 py-2 text-xs font-medium transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#75d5eb] md:min-h-[46px] md:gap-3 md:rounded-[11px] md:px-3 md:py-2.5 md:text-sm ${
                  isActive
                    ? 'bg-[#d8f2f8] font-bold text-[#105b7c] hover:bg-[#d8f2f8] hover:text-[#105b7c]'
                    : 'bg-transparent text-[#d0e3eb]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <svg
                    className="h-4 w-4 flex-none md:h-[19px] md:w-[19px]"
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d={icon}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>{label}</span>
                  {isActive && (
                    <span className="ml-auto hidden h-1.5 w-1.5 rounded-full bg-[#19a8ce] md:block" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="ml-auto mt-auto pt-0 md:ml-0 md:pt-4">
          <button
            type="button"
            onClick={onLogout}
            className="flex min-h-[38px] w-full items-center justify-center gap-2 rounded-[9px] border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-[#f4fbfe] transition hover:border-[#a43e32] hover:bg-[#a43e32] md:min-h-[42px] md:rounded-[11px]"
          >
            Keluar
          </button>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-[1420px] px-[13px] pb-[30px] pt-[17px] sm:px-[18px] sm:pb-9 sm:pt-5 md:px-[clamp(20px,4vw,56px)] md:pb-[50px] md:pt-[29px]">
        <div className="mb-6 flex min-h-[54px] items-center justify-between gap-3 border-b border-[#e4eae5] pb-4 md:mb-[31px] md:gap-[18px] md:pb-[19px]">
          <div>
            <span className="text-[10px] font-bold tracking-[0.12em] text-[#537386]">
              {isAdmin ? 'PANEL ADMIN' : 'RUANG KENDALI KARYAWAN'}
            </span>
            <p className="mt-[3px] text-[13px] font-semibold tracking-[-0.02em] text-[#174b66] sm:text-[15px]">
              {isAdmin ? 'Pantau stok, laporan & kelola karyawan' : 'Selamat datang, Sahabat PetCare'}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2.5 rounded-xl border border-[#e4eae5] bg-white px-2.5 py-2 sm:px-3">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                isAdmin
                  ? 'bg-[#d8f2f8] text-[#105b7c]'
                  : 'bg-[#e6f4ed] text-[#236b51]'
              }`}
              aria-hidden="true"
            >
              {profileInitial}
            </span>
            <span className="min-w-0">
              <span className="block max-w-[130px] truncate text-xs font-bold text-[#19352e] sm:max-w-[180px] sm:text-sm">
                {profileName}
              </span>
              <span className="block text-[10px] font-semibold text-[#537386]">
                {profileRoleLabel}
              </span>
            </span>
          </div>
        </div>

        {state === 'loading' && (
          <div
            className="mt-[45px] rounded-[15px] border border-[#e7ece8] bg-white p-7 text-center text-[#788984]"
            role="status"
          >
            Memuat data stok…
          </div>
        )}

        {state === 'error' && (
          <div
            className="mt-[45px] rounded-[15px] border border-[#e7ece8] bg-white p-7 text-center text-[#788984]"
            role="alert"
          >
            Data stok gagal dimuat. Muat ulang halaman lalu coba lagi.
            <p className="mt-4">
              <button
                className="rounded-lg bg-[#17735b] px-3.5 py-2.5 font-bold text-white transition hover:bg-[#124f40] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8cc5a4]"
                onClick={onReload}
              >
                Muat ulang data
              </button>
            </p>
          </div>
        )}

        {state === 'ok' && <Outlet />}
      </main>
    </div>
  )
}
