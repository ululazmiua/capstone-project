import { useCallback, useEffect, useState } from 'react'
import logo from '../Logo.jpg'
import {
  createBatch,
  createSale,
  createSupplier,
  deleteSupplier,
  getBatches,
  getSuppliers,
  isApiConfigured,
  updateBatch,
  updateSupplier,
} from './api.js'
import Ringkasan from './pages/Ringkasan.jsx'
import Batch from './pages/Batch.jsx'
import BarangMasuk from './pages/BarangMasuk.jsx'
import Penjualan from './pages/Penjualan.jsx'
import Suppliers from './pages/Suppliers.jsx'
import Admin from './pages/Admin.jsx'
import Login from './pages/Login.jsx'
import { createRegistrationRequest, getRegistrationRequests, reviewRegistrationRequest } from './registrationRequests.js'

const TABS = [
  ['penjualan', 'Penjualan', 'M4 19V5 M4 19h17 M8 15l4-4 3 2 6-7'],
  ['ringkasan', 'Ringkasan', 'M4 6h6v6H4z M14 6h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z'],
  ['batch', 'Stok & Batch', 'M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z M12 12l8-4.5 M12 12v9 M12 12 4 7.5'],
  ['barang-masuk', 'Barang Masuk', 'M12 5v14 M5 12h14 M4 4h16v16H4z'],
  ['supplier', 'Supplier', 'M3 20h18 M5 20V8l7-5 7 5v12 M9 20v-6h6v6 M8 9h.01 M16 9h.01'],
]

const ADMIN_TABS = [
  ['overview', 'Ringkasan', 'M4 6h6v6H4z M14 6h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z'],
  ['receipts', 'Barang Masuk', 'M12 5v14 M5 12h14 M4 4h16v16H4z'],
  ['suppliers', 'Data Supplier', 'M3 20h18 M5 20V8l7-5 7 5v12 M9 20v-6h6v6 M8 9h.01 M16 9h.01'],
  ['employees', 'Kelola Karyawan', 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75'],
]

export default function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname.replace(/\/+$/, '') || '/')
  const isAdminRoute = pathname === '/admin'
  const isLoginRoute = pathname === '/login'
  const [tab, setTab] = useState(() => isAdminRoute ? 'overview' : 'ringkasan')
  const [data, setData] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [state, setState] = useState('loading')
  const [supplierState, setSupplierState] = useState('loading')
  const [supplierError, setSupplierError] = useState('')
  const [pulled, setPulled] = useState(() => new Set())
  const [toast, setToast] = useState('')
  const [registrationRequests, setRegistrationRequests] = useState([])
  const [registrationError, setRegistrationError] = useState('')

  useEffect(() => {
    try {
      setRegistrationRequests(getRegistrationRequests())
    } catch {
      setRegistrationError('Data permintaan pendaftaran tidak dapat dibaca.')
    }
  }, [])

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname.replace(/\/+$/, '') || '/')
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (pathname === '/') {
      window.history.replaceState(null, '', '/login')
      setPathname('/login')
      return
    }
    if (pathname !== '/login' && pathname !== '/admin' && pathname !== '/karyawan') {
      window.history.replaceState(null, '', '/login')
      setPathname('/login')
      return
    }

    if (pathname === '/admin' || pathname === '/karyawan') {
      setTab(pathname === '/admin' ? 'overview' : 'ringkasan')
    }
  }, [pathname])

  const load = useCallback(() => {
    setState('loading')
    getBatches()
      .then((batches) => { setData(batches); setState('ok') })
      .catch(() => setState('error'))

    if (!isApiConfigured) {
      setSuppliers([])
      setSupplierState('disconnected')
      return
    }
    setSupplierState('loading')
    setSupplierError('')
    getSuppliers()
      .then((supplierList) => { setSuppliers(supplierList); setSupplierState('ok') })
      .catch((error) => {
        setSupplierError(error.response?.data?.message || 'Data supplier gagal dimuat.')
        setSupplierState('error')
      })
  }, [])
  useEffect(() => {
    if (pathname === '/admin' || pathname === '/karyawan') load()
  }, [pathname, load])

  const say = (m) => { setToast(m); setTimeout(() => setToast(''), 2200) }
  const pull = (b) => { setPulled((s) => new Set(s).add(b.batch_id)); say(`${b.product_name} (${b.batch_id}) ditandai sudah ditarik`) }

  const saveBatch = async (batch, existing) => {
    const saved = existing ? await updateBatch(existing.batch_id, batch) : await createBatch(batch)
    setData((current) => existing
      ? current.map((item) => item.batch_id === existing.batch_id ? saved : item)
      : [saved, ...current])
    say(existing ? 'Perubahan batch berhasil disimpan.' : 'Batch baru berhasil ditambahkan.')
  }

  const receiveGoods = async (receipt) => {
    const saved = await createBatch(receipt)
    setData((current) => [saved, ...current])
    say('Barang masuk berhasil dicatat.')
  }

  const recordSale = async (sale) => {
    await createSale(sale)
    setData((current) => current.map((batch) => (
      batch.batch_id === sale.batch_id
        ? {
            ...batch,
            current_stock: batch.current_stock - sale.quantity,
            quantity_sold: batch.quantity_sold + sale.quantity,
          }
        : batch
    )))
    say('Penjualan berhasil dicatat dan stok diperbarui.')
  }

  const saveSupplier = async (supplier, existing) => {
    const saved = existing
      ? await updateSupplier(existing.supplier_id, supplier)
      : await createSupplier(supplier)
    setSuppliers((current) => existing
      ? current.map((item) => item.supplier_id === existing.supplier_id ? saved : item)
      : [...current, saved])
    setSupplierState('ok')
    setSupplierError('')
    say(existing ? 'Perubahan supplier berhasil disimpan.' : 'Supplier berhasil ditambahkan.')
  }

  const removeSupplier = async (supplier) => {
    await deleteSupplier(supplier.supplier_id)
    setSuppliers((current) => current.filter((item) => item.supplier_id !== supplier.supplier_id))
    say('Supplier berhasil dihapus.')
  }

  const reloadSuppliers = () => {
    setSupplierState('loading')
    setSupplierError('')
    getSuppliers()
      .then((supplierList) => { setSuppliers(supplierList); setSupplierState('ok') })
      .catch((error) => {
        setSupplierError(error.response?.data?.message || 'Data supplier gagal dimuat.')
        setSupplierState('error')
      })
  }

  const registerEmployee = (details) => {
    const requests = createRegistrationRequest(details)
    setRegistrationRequests(requests)
    setRegistrationError('')
  }

  const reviewRegistration = (requestId, status) => {
    const requests = reviewRegistrationRequest(requestId, status)
    setRegistrationRequests(requests)
    setRegistrationError('')
  }

  const props = { data, pulled, pull, suppliers, onSaveBatch: saveBatch }
  const tabs = isAdminRoute ? ADMIN_TABS : TABS
  const profileName = isAdminRoute ? 'Admin' : 'Karyawan'
  const profileInitial = profileName.trim().charAt(0).toUpperCase()

  if (isLoginRoute) return <Login onRegister={registerEmployee} />

  return (
    <div className="min-h-screen bg-[#f5f7f4] text-[#19352e] md:grid md:grid-cols-[252px_minmax(0,1fr)]">
      <nav className="sticky top-0 z-10 flex h-auto items-center gap-3 overflow-x-auto bg-[#104b6b] px-3 py-2 text-[#f4fbfe] md:h-screen md:flex-col md:items-stretch md:gap-0 md:px-[17px] md:pb-[18px] md:pt-[25px]" aria-label="Menu utama">
        <a className="flex shrink-0 items-center gap-2 px-1.5 py-0 text-inherit no-underline md:gap-[11px] md:px-[7px] md:pb-[33px]" href={isAdminRoute ? '/admin' : '/karyawan'} onClick={(event) => { event.preventDefault(); setTab(isAdminRoute ? 'overview' : 'ringkasan') }}>
          <span className="relative h-[35px] w-[35px] flex-none overflow-hidden rounded-[11px] bg-white md:h-[42px] md:w-[42px] md:rounded-[14px]" aria-hidden="true">
            <img
              src={logo}
              alt=""
              className="absolute left-[-16px] top-[-11px] max-w-none w-[67px] md:left-[-19px] md:top-[-13px] md:w-[80px]"
            />
          </span>
          <span className="flex flex-col text-xs font-bold leading-tight tracking-[-0.04em] md:text-base">Royal PetCare<small className="hidden text-[10px] font-medium leading-tight tracking-[0.035em] text-[#b5d3df] md:block">Inventory workspace</small></span>
        </a>
        <span className="hidden px-3 pb-2.5 text-[10px] font-bold tracking-[0.13em] text-[#a4c8d6] md:block">MENU UTAMA</span>
        <div className="flex gap-1 md:grid md:gap-1.5">
          {tabs.map(([k, t, path]) => (
            <button key={k} aria-current={tab === k ? 'page' : undefined} onClick={() => setTab(k)}
              className={`flex min-h-[38px] shrink-0 items-center gap-[7px] rounded-[9px] px-2.5 py-2 text-xs font-medium transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#75d5eb] md:min-h-[46px] md:gap-3 md:rounded-[11px] md:px-3 md:py-2.5 md:text-sm ${tab === k ? 'bg-[#d8f2f8] font-bold text-[#105b7c] hover:bg-[#d8f2f8] hover:text-[#105b7c]' : 'bg-transparent text-[#d0e3eb]'}`}>
              <svg className="h-4 w-4 flex-none md:h-[19px] md:w-[19px]" aria-hidden="true" viewBox="0 0 24 24"><path d={path} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <span>{t}</span>
              {tab === k && <span className="ml-auto hidden h-1.5 w-1.5 rounded-full bg-[#19a8ce] md:block" />}
            </button>
          ))}
        </div>
      </nav>
      <main className="mx-auto w-full max-w-[1420px] px-[13px] pb-[30px] pt-[17px] sm:px-[18px] sm:pb-9 sm:pt-5 md:px-[clamp(20px,4vw,56px)] md:pb-[50px] md:pt-[29px]">
        <div className="mb-6 flex min-h-[54px] items-center justify-between gap-3 border-b border-[#e4eae5] pb-4 md:mb-[31px] md:gap-[18px] md:pb-[19px]">
          <div>
            <span className="text-[10px] font-bold tracking-[0.12em] text-[#537386]">{isAdminRoute ? 'PANEL ADMIN' : 'RUANG KENDALI TOKO'}</span>
            <p className="mt-[3px] text-[13px] font-semibold tracking-[-0.02em] text-[#174b66] sm:text-[15px]">{isAdminRoute ? 'Pantau stok & penjualan' : 'Selamat datang, Sahabat PetCare'}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2.5 rounded-xl border border-[#e4eae5] bg-white px-2.5 py-2 sm:px-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d8f2f8] text-sm font-bold text-[#105b7c]" aria-hidden="true">{profileInitial}</span>
            <span className="min-w-0">
              <span className="block max-w-[130px] truncate text-xs font-bold text-[#19352e] sm:max-w-[180px] sm:text-sm">{profileName}</span>
              <span className="block text-[10px] font-medium text-[#788984]">{isAdminRoute ? 'Admin' : 'Karyawan'}</span>
            </span>
          </div>
        </div>
        {state === 'loading' && <div className="mt-[45px] rounded-[15px] border border-[#e7ece8] bg-white p-7 text-center text-[#788984]" role="status">Memuat data stok…</div>}
        {state === 'error' && (
          <div className="mt-[45px] rounded-[15px] border border-[#e7ece8] bg-white p-7 text-center text-[#788984]" role="alert">
            Data stok gagal dimuat. Periksa koneksi internet atau alamat server, lalu coba lagi.
            <p className="mt-4"><button className="rounded-lg bg-[#17735b] px-3.5 py-2.5 font-bold text-white transition hover:bg-[#124f40] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8cc5a4]" onClick={load}>Muat ulang data</button></p>
          </div>
        )}
        {state === 'ok' && isAdminRoute && <Admin
          data={data}
          suppliers={suppliers}
          supplierState={supplierState}
          tab={tab}
          registrationRequests={registrationRequests}
          registrationError={registrationError}
          onReviewRegistration={reviewRegistration}
        />}
        {state === 'ok' && tab === 'ringkasan' && <Ringkasan {...props} />}
        {state === 'ok' && tab === 'batch' && <Batch {...props} />}
        {state === 'ok' && tab === 'barang-masuk' && (
          <BarangMasuk data={data} suppliers={suppliers} onSubmit={receiveGoods} onGoToSuppliers={() => setTab('supplier')} />
        )}
        {state === 'ok' && tab === 'penjualan' && <Penjualan {...props} onRecordSale={recordSale} />}
        {state === 'ok' && tab === 'supplier' && (
          <Suppliers
            suppliers={suppliers}
            onSave={saveSupplier}
            onDelete={removeSupplier}
            supplierState={supplierState}
            supplierError={supplierError}
            onReload={reloadSuppliers}
            batches={data}
          />
        )}
      </main>
      {toast && <div className="fixed bottom-6 left-1/2 z-20 max-w-[90vw] -translate-x-1/2 rounded-xl border border-white/10 bg-[#104b6b] px-[18px] py-3 text-[13px] font-semibold text-[#f4fbfe] shadow-xl" role="status">{toast}</div>}
    </div>
  )
}
