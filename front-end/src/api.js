import Papa from 'papaparse'

// =====================================================================
// Semua data disimpan di browser (localStorage). Data stok awal diambil
// dari public/data/inventory_batches.csv. Nama fungsi sengaja dibuat
// sama seperti kontrak API, supaya halaman lain tidak perlu diubah.
// Untuk mengulang data dari awal: panggil resetDemoData() di console
// browser, atau hapus localStorage situs ini.
// =====================================================================

const PREFIX = 'royal-petcare-demo:'
const KEYS = {
  batches: `${PREFIX}batches`,
  suppliers: `${PREFIX}suppliers`,
  sales: `${PREFIX}sales`,
  karyawan: `${PREFIX}karyawan`,
}

const DEFAULT_SUPPLIERS = [
  {
    supplier_id: 1,
    name: 'PT Satwa Sejahtera',
    contact_person: 'Budi Santoso',
    phone: '081234567801',
    email: 'order@satwasejahtera.co.id',
    address: 'Jl. Merdeka No. 10, Bandung',
  },
  {
    supplier_id: 2,
    name: 'CV Pet Nutrisi Nusantara',
    contact_person: 'Sari Wulandari',
    phone: '081234567802',
    email: 'sales@petnutrisi.id',
    address: 'Jl. Raya Bogor Km 21, Jakarta Timur',
  },
  {
    supplier_id: 3,
    name: 'Apotek Hewan Medika',
    contact_person: 'drh. Andi Pratama',
    phone: '081234567803',
    email: 'medika@apotekhewan.id',
    address: 'Jl. Pahlawan No. 5, Subang',
  },
]

const DEFAULT_KARYAWAN = [
  {
    karyawan_id: 1,
    full_name: 'Admin Royal PetCare',
    username: 'admin',
    email: 'admin@royalpetcare.id',
    phone: '',
    role: 'admin',
    status: 'active',
    password: 'admin123',
  },
  {
    karyawan_id: 2,
    full_name: 'Karyawan Contoh',
    username: 'karyawan',
    email: 'karyawan@royalpetcare.id',
    phone: '',
    role: 'karyawan',
    status: 'active',
    password: 'karyawan123',
  },
]

// ---------------------------------------------------------------------
// Utilitas penyimpanan
// ---------------------------------------------------------------------

function read(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
  }
  return value
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function fail(message) {
  throw new Error(message)
}

function nextNumber(list, field) {
  return list.reduce((max, item) => Math.max(max, Number(item[field]) || 0), 0) + 1
}

function todayText() {
  const d = new Date()
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

export function resetDemoData() {
  Object.values(KEYS).forEach((key) => window.localStorage.removeItem(key))
}

if (typeof window !== 'undefined') {
  window.resetDemoData = resetDemoData
}

// ---------------------------------------------------------------------
// Tanggal & status kedaluwarsa
// ---------------------------------------------------------------------

function normalizeDate(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const text = String(value).trim()
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/)

  if (match) {
    const year = Number(match[1])
    const month = Number(match[2])
    const day = Number(match[3])

    const date = new Date(year, month - 1, day)

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      throw new Error('Tanggal kedaluwarsa tidak valid.')
    }

    return `${match[1]}-${match[2]}-${match[3]}`
  }

  const date = new Date(text)

  if (Number.isNaN(date.getTime())) {
    throw new Error('Tanggal kedaluwarsa tidak valid.')
  }

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function expiryInfo(expiryDate, stock) {
  const [y, m, d] = expiryDate.split('-').map(Number)
  const expiry = new Date(y, m - 1, d)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.round((expiry.getTime() - today.getTime()) / 86400000)

  const status =
    days < 0
      ? 'EXPIRED'
      : days <= 30
        ? 'WARNING_NEAR_EXPIRY'
        : days <= 60
          ? 'ATTENTION'
          : 'SAFE'

  return {
    days_until_expiry: days,
    status,
    priority_sale_flag: days >= 0 && days <= 30 && Number(stock) > 0,
  }
}

// ---------------------------------------------------------------------
// Batch / stok
// ---------------------------------------------------------------------

async function loadCsvBatches() {
  const res = await fetch(`${import.meta.env.BASE_URL}data/inventory_batches.csv`)
  if (!res.ok) fail('Data stok gagal dimuat.')
  const text = await res.text()

  const rows = Papa.parse(text, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  }).data

  return rows.map((r) => ({
    ...r,
    priority_sale_flag:
      r.priority_sale_flag === true ||
      r.priority_sale_flag === 'True',
  }))
}

export async function getBatches() {
  const saved = read(KEYS.batches, null)
  if (Array.isArray(saved)) return clone(saved)

  const batches = await loadCsvBatches()
  write(KEYS.batches, batches)
  return clone(batches)
}

function cleanBatchInput(batch) {
  const productName = String(batch.product_name || '').trim()
  const category = String(batch.category || '').trim()
  const stock = Number(batch.current_stock)
  const price = Number(batch.unit_price)
  const expiry = normalizeDate(batch.expiry_date)

  if (!productName) fail('Nama produk wajib diisi.')
  if (!Number.isInteger(stock) || stock < 0) fail('Jumlah stok tidak valid.')
  if (!Number.isFinite(price) || price < 0) fail('Harga tidak valid.')
  if (!expiry) fail('Tanggal kedaluwarsa wajib diisi.')

  return { productName, category, stock, price, expiry }
}

function supplierNameOf(supplierId, fallbackName) {
  if (supplierId === null || supplierId === undefined || supplierId === '') {
    return fallbackName || ''
  }
  const found = read(KEYS.suppliers, DEFAULT_SUPPLIERS).find(
    (s) => String(s.supplier_id) === String(supplierId)
  )
  return found?.name || fallbackName || ''
}

export async function createBatch(batch) {
  const batches = await getBatches()
  const { productName, category, stock, price, expiry } = cleanBatchInput(batch)

  const existingProduct = batches.find(
    (b) =>
      (batch.product_id && b.product_id === batch.product_id) ||
      b.product_name.toLowerCase() === productName.toLowerCase()
  )

  const productId =
    batch.product_id ||
    existingProduct?.product_id ||
    `PRD-${String(
      batches.reduce(
        (max, b) => Math.max(max, Number(String(b.product_id).replace(/\D/g, '')) || 0),
        0
      ) + 1
    ).padStart(3, '0')}`

  const batchNumber =
    batches.reduce(
      (max, b) => Math.max(max, Number(String(b.batch_id).replace(/\D/g, '')) || 0),
      0
    ) + 1

  const supplierId =
    batch.supplier_id === '' || batch.supplier_id == null ? null : Number(batch.supplier_id)

  const saved = {
    batch_id: `BTC-${String(batchNumber).padStart(5, '0')}`,
    product_id: productId,
    product_name: productName,
    category: category || existingProduct?.category || '',
    unit_price: price,
    batch_number: String(batch.batch_number || '').trim(),
    initial_stock: stock,
    quantity_sold: 0,
    current_stock: stock,
    entry_date: normalizeDate(batch.received_at) || todayText(),
    expiry_date: expiry,
    supplier_id: supplierId,
    supplier_name: supplierNameOf(supplierId, batch.supplier_name),
    ...expiryInfo(expiry, stock),
  }

  write(KEYS.batches, [saved, ...batches])
  return clone(saved)
}

export async function updateBatch(batchId, batch) {
  const batches = await getBatches()
  const index = batches.findIndex((b) => b.batch_id === batchId)
  if (index === -1) fail('Batch tidak ditemukan.')

  const { productName, category, stock, price, expiry } = cleanBatchInput(batch)
  const old = batches[index]
  const supplierId =
    batch.supplier_id === '' || batch.supplier_id == null ? null : Number(batch.supplier_id)

  const saved = {
    ...old,
    product_name: productName,
    category: category || old.category,
    unit_price: price,
    batch_number: String(batch.batch_number || old.batch_number || '').trim(),
    current_stock: stock,
    initial_stock: Math.max(Number(old.initial_stock) || 0, stock + (Number(old.quantity_sold) || 0)),
    expiry_date: expiry,
    supplier_id: supplierId,
    supplier_name: supplierNameOf(supplierId, batch.supplier_name || old.supplier_name),
    ...expiryInfo(expiry, stock),
  }

  batches[index] = saved
  write(KEYS.batches, batches)
  return clone(saved)
}

// ---------------------------------------------------------------------
// Supplier
// ---------------------------------------------------------------------

function loadSuppliers() {
  const saved = read(KEYS.suppliers, null)
  if (Array.isArray(saved)) return saved
  return write(KEYS.suppliers, clone(DEFAULT_SUPPLIERS))
}

function cleanSupplierInput(supplier) {
  const name = String(supplier.name || '').trim()
  if (!name) fail('Nama supplier wajib diisi.')
  return {
    name,
    contact_person: String(supplier.contact_person || '').trim(),
    phone: String(supplier.phone || '').trim(),
    email: String(supplier.email || '').trim(),
    address: String(supplier.address || '').trim(),
  }
}

export async function getSuppliers() {
  return clone(loadSuppliers())
}

export async function createSupplier(supplier) {
  const suppliers = loadSuppliers()
  const data = cleanSupplierInput(supplier)

  if (suppliers.some((s) => s.name.toLowerCase() === data.name.toLowerCase())) {
    fail('Supplier dengan nama ini sudah ada.')
  }

  const saved = { supplier_id: nextNumber(suppliers, 'supplier_id'), ...data }
  write(KEYS.suppliers, [...suppliers, saved])
  return clone(saved)
}

export async function updateSupplier(supplierId, supplier) {
  const suppliers = loadSuppliers()
  const index = suppliers.findIndex((s) => String(s.supplier_id) === String(supplierId))
  if (index === -1) fail('Supplier tidak ditemukan.')

  const saved = { ...suppliers[index], ...cleanSupplierInput({ ...suppliers[index], ...supplier }) }
  suppliers[index] = saved
  write(KEYS.suppliers, suppliers)
  return clone(saved)
}

export async function deleteSupplier(supplierId) {
  const suppliers = loadSuppliers()
  const remaining = suppliers.filter((s) => String(s.supplier_id) !== String(supplierId))
  if (remaining.length === suppliers.length) fail('Supplier tidak ditemukan.')
  write(KEYS.suppliers, remaining)
  return { message: 'Supplier berhasil dihapus.' }
}

// ---------------------------------------------------------------------
// Penjualan
// ---------------------------------------------------------------------

export async function createSale(sale) {
  const batches = await getBatches()
  const index = batches.findIndex((b) => b.batch_id === sale.batch_id)
  if (index === -1) fail('Batch tidak ditemukan.')

  const quantity = Number(sale.quantity)
  const batch = batches[index]

  if (!Number.isInteger(quantity) || quantity <= 0) fail('Jumlah terjual tidak valid.')
  if (quantity > Number(batch.current_stock)) fail('Jumlah melebihi stok yang tersedia.')

  batches[index] = {
    ...batch,
    current_stock: Number(batch.current_stock) - quantity,
    quantity_sold: (Number(batch.quantity_sold) || 0) + quantity,
  }
  write(KEYS.batches, batches)

  const sales = read(KEYS.sales, [])
  const saved = {
    sale_id: nextNumber(sales, 'sale_id'),
    batch_id: batch.batch_id,
    product_name: batch.product_name,
    quantity,
    unit_price: Number(batch.unit_price),
    total: quantity * Number(batch.unit_price),
    sold_at: normalizeDate(sale.sold_at) || todayText(),
  }
  write(KEYS.sales, [...sales, saved])
  return clone(saved)
}

export async function getSalesSummary(from, to) {
  const sales = read(KEYS.sales, []).filter(
    (s) => (!from || s.sold_at >= from) && (!to || s.sold_at <= to)
  )

  const revenue = sales.reduce((sum, s) => sum + Number(s.total || 0), 0)

  return {
    revenue,
    gross_revenue: revenue,
    transaction_count: sales.length,
    quantity_sold: sales.reduce((sum, s) => sum + Number(s.quantity || 0), 0),
  }
}

// ---------------------------------------------------------------------
// Akun karyawan & admin
// ---------------------------------------------------------------------

function loadKaryawan() {
  const saved = read(KEYS.karyawan, null)
  if (Array.isArray(saved)) return saved
  return write(KEYS.karyawan, clone(DEFAULT_KARYAWAN))
}

function withoutPassword(karyawan) {
  const { password, ...rest } = karyawan
  return clone(rest)
}

function sameText(a, b) {
  return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase()
}

function assertUnique(daftarKaryawan, data, ignoreId) {
  daftarKaryawan.forEach((e) => {
    if (ignoreId !== undefined && String(e.karyawan_id) === String(ignoreId)) return
    if (data.username && sameText(e.username, data.username)) fail('Username sudah dipakai.')
    if (data.email && sameText(e.email, data.email)) fail('Email sudah dipakai.')
  })
}

export async function getKaryawan() {
  return loadKaryawan().map(withoutPassword)
}

export async function createKaryawan(karyawan) {
  const daftarKaryawan = loadKaryawan()
  const fullName = String(karyawan.full_name || karyawan.name || '').trim()
  const username = String(karyawan.username || '').trim()
  const password = String(karyawan.password || '')

  if (!fullName) fail('Nama lengkap wajib diisi.')
  if (!username) fail('Username wajib diisi.')
  if (password.length < 6) fail('Password minimal 6 karakter.')

  const data = {
    full_name: fullName,
    username,
    email: String(karyawan.email || '').trim(),
    phone: String(karyawan.phone || '').trim(),
    role: karyawan.role === 'admin' ? 'admin' : 'karyawan',
    status: 'active',
    password,
  }
  assertUnique(daftarKaryawan, data)

  const saved = { karyawan_id: nextNumber(daftarKaryawan, 'karyawan_id'), ...data }
  write(KEYS.karyawan, [saved, ...daftarKaryawan])
  return withoutPassword(saved)
}

export async function updateKaryawan(karyawanId, karyawan) {
  const daftarKaryawan = loadKaryawan()
  const index = daftarKaryawan.findIndex((e) => String(e.karyawan_id) === String(karyawanId))
  if (index === -1) fail('Akun tidak ditemukan.')

  const old = daftarKaryawan[index]
  const data = {
    full_name: String(karyawan.full_name || karyawan.name || old.full_name).trim(),
    username: String(karyawan.username || old.username).trim(),
    email: String(karyawan.email ?? old.email ?? '').trim(),
    phone: String(karyawan.phone ?? old.phone ?? '').trim(),
    role: karyawan.role === 'admin' ? 'admin' : karyawan.role ? 'karyawan' : old.role,
    status: karyawan.status === 'inactive' ? 'inactive' : karyawan.status ? 'active' : old.status,
  }
  assertUnique(daftarKaryawan, data, karyawanId)

  const saved = {
    ...old,
    ...data,
    password: karyawan.password ? String(karyawan.password) : old.password,
  }
  daftarKaryawan[index] = saved
  write(KEYS.karyawan, daftarKaryawan)
  return withoutPassword(saved)
}

export async function deleteKaryawan(karyawanId) {
  const daftarKaryawan = loadKaryawan()
  const target = daftarKaryawan.find((e) => String(e.karyawan_id) === String(karyawanId))
  if (!target) fail('Akun tidak ditemukan.')

  const otherAdmins = daftarKaryawan.filter(
    (e) => e.role === 'admin' && String(e.karyawan_id) !== String(karyawanId)
  )
  if (target.role === 'admin' && otherAdmins.length === 0) {
    fail('Admin terakhir tidak bisa dihapus.')
  }

  write(
    KEYS.karyawan,
    daftarKaryawan.filter((e) => String(e.karyawan_id) !== String(karyawanId))
  )
  return { message: 'Akun berhasil dihapus.' }
}

// ---------------------------------------------------------------------
// Login & pendaftaran
// ---------------------------------------------------------------------

export async function loginUser(credentials) {
  const identifier = String(credentials.username || credentials.email || '').trim()
  const password = String(credentials.password || '')

  const account = loadKaryawan().find(
    (e) => sameText(e.username, identifier) || (e.email && sameText(e.email, identifier))
  )

  if (!account || account.password !== password) {
    fail('Email/username atau password salah.')
  }
  if (account.status === 'inactive') {
    fail('Akun ini sedang dinonaktifkan. Hubungi Admin.')
  }

  return { user: withoutPassword(account) }
}

export async function registerUser(data) {
  const daftarKaryawan = loadKaryawan()
  assertUnique(daftarKaryawan, {
    username: String(data.username || '').trim(),
    email: String(data.email || '').trim(),
  })

  return {
    message: 'Pendaftaran berhasil dikirim. Silakan tunggu persetujuan Admin sebelum masuk.',
  }
}
