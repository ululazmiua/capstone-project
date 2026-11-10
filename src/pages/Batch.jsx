import { useMemo, useState } from 'react'
import { ExpiryBar, Pill } from '../components.jsx'
import { rp } from '../util.js'

const fieldClass = 'mt-1 w-full rounded-[10px] border border-[#dfe7e1] bg-white px-3 py-2.5 text-sm text-[#19352e] outline-none focus:border-[#7eae96] focus:shadow-[0_0_0_3px_rgba(23,115,91,0.1)]'

const newBatch = () => ({
  product_name: '',
  category: '',
  batch_number: '',
  current_stock: '',
  unit_price: '',
  expiry_date: '',
  supplier_id: '',
})

function BatchForm({ initial, suppliers, saving, error, onClose, onSubmit }) {
  const [form, setForm] = useState(initial)
  const set = (key) => (event) => setForm((value) => ({ ...value, [key]: event.target.value }))

  const submit = (event) => {
    event.preventDefault()
    onSubmit({
      product_name: form.product_name.trim(),
      category: form.category.trim(),
      batch_number: form.batch_number.trim(),
      current_stock: Number(form.current_stock),
      unit_price: Number(form.unit_price),
      expiry_date: form.expiry_date,
      supplier_id: form.supplier_id || null,
    })
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center overflow-y-auto bg-[#102d3d]/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose() }}>
      <section className="my-auto w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7" role="dialog" aria-modal="true" aria-labelledby="batch-form-title">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 id="batch-form-title" className="mb-1 text-lg font-bold text-[#19352e]">{initial.batch_id ? 'Ubah data batch' : 'Tambah barang / batch'}</h3>
            <p className="text-xs text-[#788984]">Isi detail produk dan batch agar stok serta masa kedaluwarsa bisa dipantau.</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="rounded-lg px-2 py-1 text-xl leading-none text-[#788984] hover:bg-[#f3f6f3] disabled:opacity-50" aria-label="Tutup form">×</button>
        </div>
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={submit}>
          <label className="text-xs font-semibold text-[#52685f] sm:col-span-2">
            Nama produk *
            <input className={fieldClass} value={form.product_name} onChange={set('product_name')} required maxLength={150} placeholder="Contoh: Makanan kucing 1 kg" />
          </label>
          <label className="text-xs font-semibold text-[#52685f]">
            Kategori *
            <input className={fieldClass} value={form.category} onChange={set('category')} required maxLength={80} placeholder="Contoh: Makanan Kucing" />
          </label>
          <label className="text-xs font-semibold text-[#52685f]">
            Nomor batch / lot *
            <input className={fieldClass} value={form.batch_number} onChange={set('batch_number')} required maxLength={80} placeholder="Contoh: LOT-202610-001" />
          </label>
          <label className="text-xs font-semibold text-[#52685f]">
            Jumlah stok *
            <input className={fieldClass} type="number" min="0" step="1" value={form.current_stock} onChange={set('current_stock')} required />
          </label>
          <label className="text-xs font-semibold text-[#52685f]">
            Harga satuan (Rp) *
            <input className={fieldClass} type="number" min="0" step="1" value={form.unit_price} onChange={set('unit_price')} required />
          </label>
          <label className="text-xs font-semibold text-[#52685f]">
            Tanggal kedaluwarsa *
            <input className={fieldClass} type="date" value={form.expiry_date} onChange={set('expiry_date')} required />
          </label>
          <label className="text-xs font-semibold text-[#52685f]">
            Supplier
            <select className={fieldClass} value={form.supplier_id || ''} onChange={set('supplier_id')}>
              <option value="">Pilih supplier (opsional)</option>
              {suppliers.map((supplier) => (
                <option key={supplier.supplier_id} value={supplier.supplier_id}>{supplier.name}</option>
              ))}
            </select>
          </label>
          {error && <p className="rounded-lg bg-[#fbeae7] px-3 py-2.5 text-sm text-[#a43e32] sm:col-span-2" role="alert">{error}</p>}
          <div className="flex justify-end gap-2 pt-1 sm:col-span-2">
            <button type="button" onClick={onClose} disabled={saving} className="rounded-lg border border-[#dfe7e1] px-4 py-2.5 text-sm font-semibold text-[#486158] hover:bg-[#f4f8f4] disabled:opacity-50">Batal</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-[#104b6b] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0b3c56] disabled:cursor-wait disabled:opacity-60">{saving ? 'Menyimpan…' : initial.batch_id ? 'Simpan perubahan' : 'Tambah batch'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default function Batch({ data, pulled, suppliers, onSaveBatch }) {
  const [q, setQ] = useState('')
  const [st, setSt] = useState('all')
  const [cat, setCat] = useState('all')
  const [limit, setLimit] = useState(30)
  const [formInitial, setFormInitial] = useState(null)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const cats = useMemo(() => [...new Set(data.map((b) => b.category))].sort(), [data])
  const rows = useMemo(
    () => data
      .filter((b) => !pulled.has(b.batch_id))
      .filter((b) => (st === 'all' || b.status === st) && (cat === 'all' || b.category === cat))
      .filter((b) => b.product_name.toLowerCase().includes(q.toLowerCase()) || b.batch_id.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => a.days_until_expiry - b.days_until_expiry),
    [data, pulled, q, st, cat]
  )

  const submitBatch = async (batch) => {
    setSaving(true)
    setFormError('')
    try {
      const existing = formInitial.batch_id ? formInitial : null
      await onSaveBatch(batch, existing)
      setFormInitial(null)
    } catch (error) {
      setFormError(error.response?.data?.message || error.message || 'Batch gagal disimpan. Coba lagi.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-bold leading-tight tracking-[-0.04em] sm:text-[28px]">Stok dan batch</h2>
          <p className="mb-[22px] mt-[7px] text-sm text-[#788984]">{rows.length} batch cocok dengan filter. Diurutkan dari yang paling dekat kedaluwarsa (FEFO).</p>
        </div>
        <button className="rounded-lg bg-[#104b6b] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#0b3c56] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#75d5eb]" onClick={() => { setFormError(''); setFormInitial(newBatch()) }}>+ Tambah barang</button>
      </div>
      <div className="mb-3.5 flex flex-wrap gap-2">
        <input className="w-full min-w-0 rounded-[10px] border border-[#dfe7e1] bg-white px-3 py-2.5 text-[#19352e] outline-none transition placeholder:text-[#9aa7a1] focus:border-[#7eae96] focus:shadow-[0_0_0_3px_rgba(23,115,91,0.1)] sm:w-[300px]" type="search" placeholder="Cari produk atau ID batch" aria-label="Cari produk atau ID batch" value={q} onChange={(e) => { setQ(e.target.value); setLimit(30) }} />
        <select className="min-w-0 flex-1 rounded-[10px] border border-[#dfe7e1] bg-white px-3 py-2.5 text-[#19352e] outline-none focus:border-[#7eae96] sm:flex-none" aria-label="Filter status" value={st} onChange={(e) => { setSt(e.target.value); setLimit(30) }}>
          <option value="all">Semua status</option><option value="EXPIRED">Kedaluwarsa</option>
          <option value="WARNING_NEAR_EXPIRY">≤ 30 hari</option><option value="ATTENTION">31–60 hari</option><option value="SAFE">Aman</option>
        </select>
        <select className="min-w-0 flex-1 rounded-[10px] border border-[#dfe7e1] bg-white px-3 py-2.5 text-[#19352e] outline-none focus:border-[#7eae96] sm:flex-none" aria-label="Filter kategori" value={cat} onChange={(e) => { setCat(e.target.value); setLimit(30) }}>
          <option value="all">Semua kategori</option>{cats.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="mb-5 overflow-x-auto rounded-[15px] border border-[#e7ece8] bg-white px-3.5 pb-3.5 pt-2 shadow-[0_4px_16px_rgba(29,56,44,0.025)]">
        {rows.length === 0 ? <p className="px-5 py-7 text-center text-[#788984]">Tidak ada batch yang cocok. Ubah kata kunci atau filter.</p> : (
          <table className="w-full min-w-[820px] border-collapse">
            <thead><tr>
              <th className="border-b border-[#e6ece7] px-2.5 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.07em] text-[#809089]">Produk</th>
              <th className="border-b border-[#e6ece7] px-2.5 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.07em] text-[#809089]">Batch</th>
              <th className="border-b border-[#e6ece7] px-2.5 py-2.5 text-right text-[10px] font-bold uppercase tracking-[0.07em] text-[#809089]">Stok</th>
              <th className="border-b border-[#e6ece7] px-2.5 py-2.5 text-right text-[10px] font-bold uppercase tracking-[0.07em] text-[#809089]">Harga</th>
              <th className="w-[200px] border-b border-[#e6ece7] px-2.5 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.07em] text-[#809089]">Kedaluwarsa</th>
              <th className="border-b border-[#e6ece7] px-2.5 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.07em] text-[#809089]">Status</th>
              <th className="border-b border-[#e6ece7] px-2.5 py-2.5 text-right text-[10px] font-bold uppercase tracking-[0.07em] text-[#809089]">Aksi</th>
            </tr></thead>
            <tbody>
              {rows.slice(0, limit).map((b) => (
                <tr className="hover:bg-[#fafcf9]" key={b.batch_id}>
                  <td className="border-b border-[#edf0ed] px-2.5 py-3 align-middle text-xs"><b className="text-xs font-semibold">{b.product_name}</b><br /><small className="text-xs text-[#788984]">{b.category}</small></td>
                  <td className="border-b border-[#edf0ed] px-2.5 py-3 align-middle text-xs">{b.batch_id}<br /><small className="text-xs text-[#788984]">{b.batch_number}</small></td>
                  <td className="border-b border-[#edf0ed] px-2.5 py-3 text-right align-middle text-xs">{b.current_stock}</td><td className="border-b border-[#edf0ed] px-2.5 py-3 text-right align-middle text-xs">{rp(b.unit_price)}</td>
                  <td className="border-b border-[#edf0ed] px-2.5 py-3 align-middle"><ExpiryBar b={b} /></td><td className="border-b border-[#edf0ed] px-2.5 py-3 align-middle"><Pill status={b.status} /></td>
                  <td className="border-b border-[#edf0ed] px-2.5 py-3 text-right align-middle"><button className="rounded-md border border-[#dfe7e1] px-2.5 py-1.5 text-xs font-semibold text-[#486158] hover:bg-[#f4f8f4]" onClick={() => { setFormError(''); setFormInitial({ ...b, supplier_id: b.supplier_id ? String(b.supplier_id) : '' }) }}>Ubah</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {rows.length > limit && <p className="my-4 text-center"><button className="rounded-lg border border-[#dfe7e1] bg-white px-3.5 py-2.5 font-bold text-[#486158] hover:border-[#b9d2c2] hover:bg-[#f4f8f4]" onClick={() => setLimit(limit + 30)}>Tampilkan 30 lagi</button></p>}
      </div>
      {formInitial && (
        <BatchForm
          initial={formInitial}
          suppliers={suppliers}
          saving={saving}
          error={formError}
          onClose={() => { if (!saving) setFormInitial(null) }}
          onSubmit={submitBatch}
        />
      )}
    </>
  )
}
