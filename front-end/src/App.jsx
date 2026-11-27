import { useCallback, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import {
  createBatch,
  createSale,
  createSupplier,
  deleteSupplier,
  getBatches,
  getSuppliers,
  updateBatch,
  updateSupplier,
} from './api.js'
import Ringkasan from './pages/Ringkasan.jsx'
import Batch from './pages/Batch.jsx'
import BarangMasuk from './pages/BarangMasuk.jsx'
import Penjualan from './pages/Penjualan.jsx'
import Suppliers from './pages/Suppliers.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register'
import AdminRingkasan from './pages/admin/Ringkasan.jsx'
import AdminBarangMasuk from './pages/admin/BarangMasuk.jsx'
import AdminSupplier from './pages/admin/Supplier.jsx'
import AdminKaryawan from './pages/admin/Karyawan.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import DashboardLayout from './layouts/DashboardLayout.jsx'

const SESSION_KEY = 'petcare_auth_session'

const KARYAWAN_MENU = [
  ['penjualan', 'Penjualan', 'M4 19V5 M4 19h17 M8 15l4-4 3 2 6-7'],
  ['ringkasan', 'Ringkasan', 'M4 6h6v6H4z M14 6h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z'],
  ['stok-batch', 'Stok & Batch', 'M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z M12 12l8-4.5 M12 12v9 M12 12 4 7.5'],
  ['barang-masuk', 'Barang Masuk', 'M12 5v14 M5 12h14 M4 4h16v16H4z'],
  ['supplier', 'Supplier', 'M3 20h18 M5 20V8l7-5 7 5v12 M9 20v-6h6v6 M8 9h.01 M16 9h.01'],
]

const ADMIN_MENU = [
  ['ringkasan', 'Ringkasan', 'M4 6h6v6H4z M14 6h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z'],
  ['barang-masuk', 'Barang Masuk', 'M12 5v14 M5 12h14 M4 4h16v16H4z'],
  ['supplier', 'Data Supplier', 'M3 20h18 M5 20V8l7-5 7 5v12 M9 20v-6h6v6 M8 9h.01 M16 9h.01'],
  ['karyawan', 'Kelola Karyawan', 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75'],
]

function loadSavedSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY) || localStorage.getItem('user')
    const session = raw ? JSON.parse(raw) : null
    // Abaikan sesi lama yang role-nya bukan 'admin' atau 'karyawan'.
    return session && (session.role === 'admin' || session.role === 'karyawan') ? session : null
  } catch {
    return null
  }
}

export default function App() {
  const navigate = useNavigate()
  const [authUser, setAuthUser] = useState(loadSavedSession)

  const [data, setData] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [state, setState] = useState('loading')
  const [supplierState, setSupplierState] = useState('loading')
  const [supplierError, setSupplierError] = useState('')
  const [pulled, setPulled] = useState(() => new Set())
  const [toast, setToast] = useState('')

  const handleLoginSuccess = useCallback(
    (account) => {
      const normalizedRole = account?.role === 'admin' ? 'admin' : 'karyawan'
      const sessionData = {
        ...account,
        role: normalizedRole,
      }
      setAuthUser(sessionData)
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData))
        localStorage.setItem('user', JSON.stringify(sessionData))
      } catch {
        // abaikan jika storage penuh
      }
      navigate(normalizedRole === 'admin' ? '/admin' : '/karyawan', { replace: true })
    },
    [navigate]
  )

  const handleLogout = useCallback(() => {
    setAuthUser(null)
    try {
      localStorage.removeItem(SESSION_KEY)
      localStorage.removeItem('user')
    } catch {
      // abaikan
    }
    navigate('/login', { replace: true })
  }, [navigate])

  const load = useCallback(() => {
    setState('loading')
    getBatches()
      .then((batches) => {
        setData(batches)
        setState('ok')
      })
      .catch(() => setState('error'))

    setSupplierState('loading')
    setSupplierError('')
    getSuppliers()
      .then((supplierList) => {
        setSuppliers(supplierList)
        setSupplierState('ok')
      })
      .catch((error) => {
        setSupplierError(error.message || 'Data supplier gagal dimuat.')
        setSupplierState('error')
      })
  }, [])

  useEffect(() => {
    if (authUser) {
      load()
    }
  }, [authUser, load])

  useEffect(() => {
    try {
      localStorage.removeItem('royal-petcare-registration-requests')
      localStorage.removeItem('petcare_dismissed_registrations')
      const legacyKeys = []

      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index)
        if (key && key.startsWith('royal-petcare-demo:')) {
          legacyKeys.push(key)
        }
      }

      legacyKeys.forEach((key) => localStorage.removeItem(key))
    } catch (error) {
      console.warn('Pembersihan data lama gagal:', error)
    }
  }, [])

  const say = (m) => {
    setToast(m)
    setTimeout(() => setToast(''), 2200)
  }

  const supplierNameOf = (supplierId) => {
    if (supplierId === null || supplierId === undefined || supplierId === '') {
      return ''
    }

    return suppliers.find(
      (item) => String(item.id ?? item.supplier_id) === String(supplierId)
    )?.name || ''
  }

  const pull = (b) => {
    setPulled((s) => new Set(s).add(b.batch_id))
    say(`${b.product_name} (${b.batch_id}) ditandai sudah ditarik`)
  }

  const saveBatch = async (batch, existing) => {
    const batchWithSupplier = {
      ...batch,
      supplier_name: supplierNameOf(batch.supplier_id),
    }
    const saved = existing
      ? await updateBatch(existing.batch_id, batchWithSupplier)
      : await createBatch(batchWithSupplier)
    setData((current) =>
      existing
        ? current.map((item) => (item.batch_id === existing.batch_id ? saved : item))
        : [saved, ...current]
    )
    say(existing ? 'Perubahan batch berhasil disimpan.' : 'Batch baru berhasil ditambahkan.')
  }

  const receiveGoods = async (receipt) => {
    const receiptWithSupplier = {
      ...receipt,
      supplier_name: supplierNameOf(receipt.supplier_id),
    }
    const saved = await createBatch(receiptWithSupplier)
    setData((current) => [saved, ...current])
    say('Barang masuk berhasil dicatat.')
  }

  const recordSale = async (sale) => {
    await createSale(sale)
    setData((current) =>
      current.map((batch) =>
        batch.batch_id === sale.batch_id
          ? {
              ...batch,
              current_stock: batch.current_stock - sale.quantity,
              quantity_sold: batch.quantity_sold + sale.quantity,
            }
          : batch
      )
    )
    say('Penjualan berhasil dicatat dan stok diperbarui.')
  }

  const saveSupplier = async (supplier, existing) => {
    const supplierId = existing?.id ?? existing?.supplier_id
    const saved = existing
      ? await updateSupplier(supplierId, supplier)
      : await createSupplier(supplier)

    setSuppliers((current) =>
      existing
        ? current.map((item) =>
            String(item.id ?? item.supplier_id) === String(supplierId) ? saved : item
          )
        : [...current, saved]
    )

    setSupplierState('ok')
    setSupplierError('')
    say(existing ? 'Perubahan supplier berhasil disimpan.' : 'Supplier berhasil ditambahkan.')
  }

  const removeSupplier = async (supplier) => {
    const supplierId = supplier.id ?? supplier.supplier_id
    await deleteSupplier(supplierId)

    setSuppliers((current) =>
      current.filter((item) => String(item.id ?? item.supplier_id) !== String(supplierId))
    )

    say('Supplier berhasil dihapus.')
  }

  const reloadSuppliers = () => {
    setSupplierState('loading')
    setSupplierError('')
    getSuppliers()
      .then((supplierList) => {
        setSuppliers(supplierList)
        setSupplierState('ok')
      })
      .catch((error) => {
        setSupplierError(error.message || 'Data supplier gagal dimuat.')
        setSupplierState('error')
      })
  }

  const props = { data, pulled, pull, suppliers, onSaveBatch: saveBatch }

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route
          path="/login"
          element={
            authUser ? (
              <Navigate to={authUser.role === 'admin' ? '/admin' : '/karyawan'} replace />
            ) : (
              <Login
                onLogin={handleLoginSuccess}
                onRegisterClick={() => navigate('/register')}
              />
            )
          }
        />
        <Route
          path="/register"
          element={
            <Register
              onBackToLogin={() => navigate('/login')}
            />
          }
        />
        <Route
          path="/admin"
          element={<ProtectedRoute user={authUser} role="admin" />}
        >
          <Route
            element={
              <DashboardLayout
                role="admin"
                user={authUser}
                menu={ADMIN_MENU}
                onLogout={handleLogout}
                state={state}
                onReload={load}
              />
            }
          >
            <Route index element={<Navigate to="ringkasan" replace />} />
            <Route path="ringkasan" element={<AdminRingkasan data={data} />} />
            <Route path="barang-masuk" element={<AdminBarangMasuk data={data} />} />
            <Route
              path="supplier"
              element={
                <AdminSupplier
                  suppliers={suppliers}
                  supplierState={supplierState}
                  supplierError={supplierError}
                  onReload={reloadSuppliers}
                  onSave={saveSupplier}
                  onDelete={removeSupplier}
                />
              }
            />
            <Route path="karyawan" element={<AdminKaryawan />} />
            <Route path="*" element={<Navigate to="ringkasan" replace />} />
          </Route>
        </Route>
        <Route
          path="/karyawan"
          element={<ProtectedRoute user={authUser} role="karyawan" />}
        >
          <Route
            element={
              <DashboardLayout
                role="karyawan"
                user={authUser}
                menu={KARYAWAN_MENU}
                onLogout={handleLogout}
                state={state}
                onReload={load}
              />
            }
          >
            <Route index element={<Navigate to="ringkasan" replace />} />
            <Route path="penjualan" element={<Penjualan {...props} onRecordSale={recordSale} />} />
            <Route path="ringkasan" element={<Ringkasan {...props} />} />
            <Route path="stok-batch" element={<Batch {...props} />} />
            <Route
              path="barang-masuk"
              element={
                <BarangMasuk
                  data={data}
                  suppliers={suppliers}
                  onSubmit={receiveGoods}
                  onGoToSuppliers={() => navigate('/karyawan/supplier')}
                />
              }
            />
            <Route
              path="supplier"
              element={
                <Suppliers
                  suppliers={suppliers}
                  onSave={saveSupplier}
                  onDelete={removeSupplier}
                  supplierState={supplierState}
                  supplierError={supplierError}
                  onReload={reloadSuppliers}
                  batches={data}
                />
              }
            />
            <Route path="*" element={<Navigate to="ringkasan" replace />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 z-20 max-w-[90vw] -translate-x-1/2 rounded-xl border border-white/10 bg-[#104b6b] px-[18px] py-3 text-[13px] font-semibold text-[#f4fbfe] shadow-xl"
          role="status"
        >
          {toast}
        </div>
      )}
    </>
  )
}