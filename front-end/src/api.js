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
    phone: '081234567801',
    email: 'order@satwasejahtera.co.id',
    address: 'Jl. Merdeka No. 10, Bandung',
  },
  {
    supplier_id: 2,
    name: 'CV Pet Nutrisi Nusantara',
    phone: '081234567802',
    email: 'sales@petnutrisi.id',
    address: 'Jl. Raya Bogor Km 21, Jakarta Timur',
  },
  {
    supplier_id: 3,
    name: 'Apotek Hewan Medika',
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
    role: 'admin',
    status: 'active',
    password: 'admin123',
  },
  {
    karyawan_id: 2,
    full_name: 'Karyawan Contoh',
    username: 'karyawan',
    email: 'karyawan@royalpetcare.id',
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
  } catch (error) {
    console.warn('Data gagal disimpan di browser:', error)
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
 // Supplier - menggunakan PostgreSQL melalui backend
 // ---------------------------------------------------------------------

const SUPPLIER_API = 'http://127.0.0.1:5000/api/suppliers';

async function supplierRequest(method = 'GET', data = null, id = '') {
  let response;

  try {
    response = await fetch(
      `${SUPPLIER_API}${id ? `/${id}` : ''}`,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        ...(data ? { body: JSON.stringify(data) } : {}),
      }
    );
  } catch {
    throw new Error(
      'Backend tidak dapat dihubungi. Pastikan server berjalan.'
    );
  }

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error('Respons dari server tidak valid.');
  }

  if (!response.ok) {
    throw new Error(
      result.message || 'Permintaan data supplier gagal.'
    );
  }

  return result;
}

// Mengambil semua supplier
export async function getSuppliers() {
  const result = await supplierRequest('GET');

  if (!Array.isArray(result)) {
    throw new Error('Format data supplier dari server tidak valid.');
  }

  return result;
}

// Menambahkan supplier
export async function createSupplier(supplier) {
  const name = String(supplier.name || '').trim();

  if (!name) {
    fail('Nama supplier wajib diisi.');
  }

  return await supplierRequest('POST', {
    name,
    contact_person: String(supplier.contact_person || '').trim(),
    phone: String(supplier.phone || '').trim(),
    email: String(supplier.email || '').trim(),
    address: String(supplier.address || '').trim(),
  });
}

// Memperbarui supplier
export async function updateSupplier(supplierId, supplier) {
  const name = String(supplier.name || '').trim();

  if (!name) {
    fail('Nama supplier wajib diisi.');
  }

  return await supplierRequest(
    'PATCH',
    {
      name,
      contact_person: supplier.contact_person,
      phone: String(supplier.phone || '').trim(),
      email: String(supplier.email || '').trim(),
      address: String(supplier.address || '').trim(),
    },
    supplierId
  );
}

// Menghapus supplier
export async function deleteSupplier(supplierId) {
  return await supplierRequest(
    'DELETE',
    null,
    supplierId
  );
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
// Akun karyawan & admin - menggunakan PostgreSQL melalui backend
// ---------------------------------------------------------------------

const KARYAWAN_API = 'http://127.0.0.1:5000/api/karyawan'

async function karyawanRequest(method = 'GET', data = null, id = '') {
  let response

  try {
    response = await fetch(
      `${KARYAWAN_API}${id ? `/${id}` : ''}`,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        ...(data ? { body: JSON.stringify(data) } : {}),
      }
    )
  } catch {
    throw new Error(
      'Backend tidak dapat dihubungi. Pastikan server berjalan.'
    )
  }

  let result

  try {
    result = await response.json()
  } catch {
    throw new Error('Respons dari server tidak valid.')
  }

  if (!response.ok) {
    throw new Error(
      result.message || 'Permintaan data karyawan gagal.'
    )
  }

  return result
}

// Menyesuaikan format data backend dengan frontend
function formatKaryawan(item) {
  return {
    ...item,
    karyawan_id: item.user_id ?? item.id,
    user_id: item.user_id ?? item.id,
    full_name: item.name || item.full_name || '',
    role: item.role === 'admin' ? 'admin' : 'karyawan',
    phone: item.phone || '',
    email: item.email || '',
    username: item.username || '',
  }
}

// Mengambil semua data karyawan
export async function getKaryawan() {
  const result = await karyawanRequest('GET')

  if (!Array.isArray(result)) {
    throw new Error('Format data karyawan dari server tidak valid.')
  }

  return result.map(formatKaryawan)
}

// Menambahkan akun karyawan atau admin
export async function createKaryawan(karyawan) {
  const fullName = String(
    karyawan.full_name || karyawan.name || ''
  ).trim()

  const username = String(karyawan.username || '').trim()
  const email = String(karyawan.email || '').trim()
  const password = String(karyawan.password || '')

  if (!fullName) fail('Nama lengkap wajib diisi.')
  if (!username) fail('Username wajib diisi.')
  if (!email) fail('Email wajib diisi.')
  if (password.length < 8) {
    fail('Password minimal 8 karakter.')
  }

  const result = await karyawanRequest('POST', {
    name: fullName,
    username,
    email,
    password,
    phone: String(karyawan.phone || '').trim(),
    role: karyawan.role === 'admin' ? 'admin' : 'employee',
    status: 'active',
  })

  return formatKaryawan(result)
}

// Memperbarui akun karyawan atau admin
export async function updateKaryawan(karyawanId, karyawan) {
  const fullName = String(
    karyawan.full_name || karyawan.name || ''
  ).trim()

  const username = String(karyawan.username || '').trim()
  const email = String(karyawan.email || '').trim()

  if (!fullName) fail('Nama lengkap wajib diisi.')
  if (!username) fail('Username wajib diisi.')
  if (!email) fail('Email wajib diisi.')

  const data = {
    name: fullName,
    username,
    email,
    phone: String(karyawan.phone || '').trim(),
    role: karyawan.role === 'admin' ? 'admin' : 'employee',
  }

  if (karyawan.status) {
    data.status = karyawan.status
  }

  if (karyawan.password) {
    data.password = String(karyawan.password)
  }

  const result = await karyawanRequest(
    'PATCH',
    data,
    karyawanId
  )

  return formatKaryawan(result)
}

// Menghapus akun karyawan atau admin
export async function deleteKaryawan(karyawanId) {
  return await karyawanRequest(
    'DELETE',
    null,
    karyawanId
  )
}


 // ---------------------------------------------------------------------
 // Login & pendaftaran
 // ---------------------------------------------------------------------

const AUTH_API = 'http://127.0.0.1:5000/api/auth'

async function authRequest(endpoint, data) {
  let response

  try {
    response = await fetch(`${AUTH_API}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
  } catch {
    throw new Error(
      'Backend tidak dapat dihubungi. Pastikan server berjalan.'
    )
  }

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message || 'Permintaan gagal diproses.'
    )
  }

  return result
}

export async function loginUser(credentials) {
  const identifier = String(
    credentials.username || credentials.email || ''
  ).trim()

  const password = String(credentials.password || '')

  if (!identifier || !password) {
    fail('Username/email dan password wajib diisi.')
  }

  const result = await authRequest('login', {
    email: identifier,
    username: identifier,
    password,
  })

  return result
}

export async function registerUser(data) {
  const result = await authRequest('register', {
    name: data.name || data.full_name || '',
    username: data.username || '',
    email: data.email || '',
    password: data.password || '',
  })

  return result
}
