const STORAGE_KEY = 'royal-petcare-registration-requests'

export function getRegistrationRequests() {
  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (!saved) return []

  const requests = JSON.parse(saved)
  if (!Array.isArray(requests)) {
    throw new Error('Data permintaan pendaftaran tidak valid.')
  }
  return requests
}

function saveRequests(requests) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(requests))
  return requests
}

export function createRegistrationRequest(details) {
  const requests = getRegistrationRequests()
  const username = details.username.trim()
  const duplicate = requests.some((request) => (
    request.username.toLowerCase() === username.toLowerCase() &&
    request.status !== 'rejected'
  ))
  if (duplicate) {
    throw new Error('Username ini sudah pernah diajukan.')
  }

  const request = {
    request_id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    full_name: details.full_name.trim(),
    username,
    email: details.email.trim(),
    phone: details.phone.trim(),
    status: 'pending',
    requested_at: new Date().toISOString(),
  }
  return saveRequests([request, ...requests])
}

export function reviewRegistrationRequest(requestId, status) {
  if (status !== 'approved' && status !== 'rejected') {
    throw new Error('Status permintaan tidak valid.')
  }

  const requests = getRegistrationRequests()
  let found = false
  const updated = requests.map((request) => {
    if (request.request_id !== requestId) return request
    if (request.status !== 'pending') return request
    found = true
    return { ...request, status, reviewed_at: new Date().toISOString() }
  })
  if (!found) {
    throw new Error('Permintaan ini sudah ditinjau atau tidak ditemukan.')
  }
  return saveRequests(updated)
}
