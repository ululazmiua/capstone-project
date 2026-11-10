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

export async function getBatches() {
  if (API) {
    const res = await axios.get(`${API}/api/v1/batches`, { timeout: 15000 })
    return res.data
  }
  const res = await axios.get(`${import.meta.env.BASE_URL}data/inventory_batches.csv`, { responseType: 'text' })
  const rows = Papa.parse(res.data, { header: true, dynamicTyping: true, skipEmptyLines: true }).data
  return rows.map((r) => ({ ...r, priority_sale_flag: r.priority_sale_flag === true || r.priority_sale_flag === 'True' }))
}

export async function createBatch(batch) {
  const api = requireApi()
  const res = await axios.post(`${api}/api/v1/batches`, batch, { timeout: 15000 })
  return res.data
}

export async function updateBatch(batchId, batch) {
  const api = requireApi()
  const res = await axios.patch(`${api}/api/v1/batches/${encodeURIComponent(batchId)}`, batch, { timeout: 15000 })
  return res.data
}

export async function getSuppliers() {
  const api = requireApi()
  const res = await axios.get(`${api}/api/v1/suppliers`, { timeout: 15000 })
  return res.data
}

export async function createSupplier(supplier) {
  const api = requireApi()
  const res = await axios.post(`${api}/api/v1/suppliers`, supplier, { timeout: 15000 })
  return res.data
}

export async function updateSupplier(supplierId, supplier) {
  const api = requireApi()
  const res = await axios.patch(`${api}/api/v1/suppliers/${encodeURIComponent(supplierId)}`, supplier, { timeout: 15000 })
  return res.data
}

export async function deleteSupplier(supplierId) {
  const api = requireApi()
  const res = await axios.delete(`${api}/api/v1/suppliers/${encodeURIComponent(supplierId)}`, { timeout: 15000 })
  return res.data
}

export async function createSale(sale) {
  const api = requireApi()
  const res = await axios.post(`${api}/api/v1/sales`, sale, { timeout: 15000 })
  return res.data
}

export async function getSalesSummary(from, to) {
  const api = requireApi()
  const res = await axios.get(`${api}/api/v1/admin/sales-summary`, {
    params: { from, to },
    timeout: 15000,
  })
  return res.data
}

export async function getEmployees() {
  const api = requireApi()
  const res = await axios.get(`${api}/api/v1/employees`, { timeout: 15000 })
  return res.data
}

export async function createEmployee(employee) {
  const api = requireApi()
  const res = await axios.post(`${api}/api/v1/employees`, employee, { timeout: 15000 })
  return res.data
}

export async function updateEmployee(employeeId, employee) {
  const api = requireApi()
  const res = await axios.patch(`${api}/api/v1/employees/${encodeURIComponent(employeeId)}`, employee, { timeout: 15000 })
  return res.data
}

export async function deleteEmployee(employeeId) {
  const api = requireApi()
  const res = await axios.delete(`${api}/api/v1/employees/${encodeURIComponent(employeeId)}`, { timeout: 15000 })
  return res.data
}
