import axios from 'axios'
import Papa from 'papaparse'

const API = import.meta.env.VITE_API_URL

export const isApiConfigured = Boolean(API)

function requireApi() {
  if (!API) {
    throw new Error('Permintaan belum dapat diproses. Silakan coba lagi.')
  }

  return API
}

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

export async function getBatches() {
  if (API) {
    const res = await axios.get(`${API}/api/v1/batches`, {
      timeout: 15000,
    })

    return res.data
  }

  const res = await axios.get(
    `${import.meta.env.BASE_URL}data/inventory_batches.csv`,
    {
      responseType: 'text',
    }
  )

  const rows = Papa.parse(res.data, {
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

export async function createBatch(batch) {
  const api = requireApi()

  const payload = {
    ...batch,
    current_stock: Number(batch.current_stock),
    unit_price: Number(batch.unit_price),
    supplier_id:
      batch.supplier_id === '' || batch.supplier_id == null
        ? null
        : Number(batch.supplier_id),
    expiry_date: normalizeDate(batch.expiry_date),
  }

  const res = await axios.post(
    `${api}/api/v1/batches`,
    payload,
    { timeout: 15000 }
  )

  return res.data
}

export async function updateBatch(batchId, batch) {
  const api = requireApi()

  const payload = {
    ...batch,
    current_stock: Number(batch.current_stock),
    unit_price: Number(batch.unit_price),
    supplier_id:
      batch.supplier_id === '' || batch.supplier_id == null
        ? null
        : Number(batch.supplier_id),
    expiry_date: normalizeDate(batch.expiry_date),
  }

  const res = await axios.patch(
    `${api}/api/v1/batches/${encodeURIComponent(batchId)}`,
    payload,
    { timeout: 15000 }
  )

  return res.data
}

export async function getSuppliers() {
  const api = requireApi()

  const res = await axios.get(`${api}/api/v1/suppliers`, {
    timeout: 15000,
  })

  return res.data
}

export async function createSupplier(supplier) {
  const api = requireApi()

  const res = await axios.post(
    `${api}/api/v1/suppliers`,
    supplier,
    { timeout: 15000 }
  )

  return res.data
}

export async function updateSupplier(supplierId, supplier) {
  const api = requireApi()

  const res = await axios.patch(
    `${api}/api/v1/suppliers/${encodeURIComponent(supplierId)}`,
    supplier,
    { timeout: 15000 }
  )

  return res.data
}

export async function deleteSupplier(supplierId) {
  const api = requireApi()

  const res = await axios.delete(
    `${api}/api/v1/suppliers/${encodeURIComponent(supplierId)}`,
    { timeout: 15000 }
  )

  return res.data
}

export async function createSale(sale) {
  const api = requireApi()

  const res = await axios.post(
    `${api}/api/v1/sales`,
    sale,
    { timeout: 15000 }
  )

  return res.data
}

export async function getSalesSummary() {
  requireApi()
  return {
    revenue: 0,
    gross_revenue: 0,
    transaction_count: 0,
  }
}

export async function getEmployees() {
  const api = requireApi()

  const res = await axios.get(`${api}/api/v1/employees`, {
    timeout: 15000,
  })

  return res.data
}

export async function createEmployee(employee) {
  const api = requireApi()
  const cleanName = (employee.name || employee.full_name || '').trim()

  const payload = {
    ...employee,
    name: cleanName,
    full_name: cleanName,
  }

  const res = await axios.post(
    `${api}/api/v1/employees`,
    payload,
    { timeout: 15000 }
  )

  return res.data
}

export async function updateEmployee(employeeId, employee) {
  const api = requireApi()
  const cleanName = (employee.name || employee.full_name || '').trim()

  const payload = {
    ...employee,
    name: cleanName,
    full_name: cleanName,
  }

  const res = await axios.patch(
    `${api}/api/v1/employees/${encodeURIComponent(employeeId)}`,
    payload,
    { timeout: 15000 }
  )

  return res.data
}

export async function deleteEmployee(employeeId) {
  const api = requireApi()

  const res = await axios.delete(
    `${api}/api/v1/employees/${encodeURIComponent(employeeId)}`,
    { timeout: 15000 }
  )

  return res.data
}

export async function loginUser(credentials) {
  const api = requireApi()
  const res = await axios.post(
    `${api}/api/v1/auth/login`,
    credentials,
    { timeout: 15000 }
  )
  return res.data
}

export async function registerUser(data) {
  const api = requireApi()
  const res = await axios.post(
    `${api}/api/v1/auth/register`,
    data,
    { timeout: 15000 }
  )
  return res.data
}