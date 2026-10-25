import { useState } from 'react'

const inputClass = 'mt-1 w-full rounded-[10px] border border-[#dfe7e1] bg-white px-3 py-2.5 text-sm text-[#19352e] outline-none focus:border-[#7eae96] focus:shadow-[0_0_0_3px_rgba(23,115,91,0.1)]'
const blankSupplier = () => ({ name: '', contact_person: '', phone: '', email: '', address: '' })

function SupplierForm({ initial, saving, error, onClose, onSubmit }) {
  const [form, setForm] = useState(initial)
  const set = (key) => (event) => setForm((value) => ({ ...value, [key]: event.target.value }))

  const submit = (event) => {
    event.preventDefault()
    onSubmit({
      name: form.name.trim(),
      contact_person: form.contact_person.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
    })
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center overflow-y-auto bg-[#102d3d]/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose() }}>
      <section className="my-auto w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7" role="dialog" aria-modal="true" aria-labelledby="supplier-form-title">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 id="supplier-form-title" className="mb-1 text-lg font-bold text-[#19352e]">{initial.supplier_id ? 'Ubah data supplier' : 'Tambah supplier'}</h3>
            <p className="text-xs text-[#788984]">Simpan informasi kontak pemasok untuk membantu pencatatan barang masuk.</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="rounded-lg px-2 py-1 text-xl leading-none text-[#788984] hover:bg-[#f3f6f3] disabled:opacity-50" aria-label="Tutup form">×</button>
        </div>
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={submit}>
          <label className="text-xs font-semibold text-[#52685f] sm:col-span-2">
            Nama supplier / usaha *
            <input className={inputClass} value={form.name} onChange={set('name')} required maxLength={150} placeholder="Contoh: CV Aneka Pakan" />
          </label>
          <label className="text-xs font-semibold text-[#52685f]">
            Nama kontak
            <input className={inputClass} value={form.contact_person} onChange={set('contact_person')} maxLength={120} placeholder="Nama sales atau PIC" />
          </label>
          <label className="text-xs font-semibold text-[#52685f]">
            Nomor telepon
            <input className={inputClass} type="tel" value={form.phone} onChange={set('phone')} maxLength={40} placeholder="08xxxxxxxxxx" />
          </label>
          <label className="text-xs font-semibold text-[#52685f]">
            Email
            <input className={inputClass} type="email" value={form.email} onChange={set('email')} maxLength={150} placeholder="supplier@email.com" />
          </label>
          <label className="text-xs font-semibold text-[#52685f]">
            Alamat
            <input className={inputClass} value={form.address} onChange={set('address')} maxLength={250} placeholder="Alamat supplier" />
          </label>
          {error && <p className="rounded-lg bg-[#fbeae7] px-3 py-2.5 text-sm text-[#a43e32] sm:col-span-2" role="alert">{error}</p>}
          <div className="flex justify-end gap-2 pt-1 sm:col-span-2">
            <button type="button" onClick={onClose} disabled={saving} className="rounded-lg border border-[#dfe7e1] px-4 py-2.5 text-sm font-semibold text-[#486158] hover:bg-[#f4f8f4] disabled:opacity-50">Batal</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-[#104b6b] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0b3c56] disabled:cursor-wait disabled:opacity-60">{saving ? 'Menyimpan…' : initial.supplier_id ? 'Simpan perubahan' : 'Tambah supplier'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default function Suppliers({ suppliers, onSave, onDelete, supplierState, supplierError, onReload, batches }) {
  const [formInitial, setFormInitial] = useState(null)
  const [formError, setFormError] = useState('')
  const [pageError, setPageError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState('')

  const save = async (supplier) => {
    setSaving(true)
    setFormError('')
    try {
      const existing = formInitial.supplier_id ? formInitial : null
      await onSave(supplier, existing)
      setFormInitial(null)
    } catch (error) {
      setFormError(error.response?.data?.message || error.message || 'Supplier gagal disimpan. Coba lagi.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (supplier) => {
    if (!window.confirm(`Hapus supplier "${supplier.name}"?`)) return
    setDeleting(supplier.supplier_id)
    setPageError('')
    try {
      await onDelete(supplier)
    } catch (error) {
      setPageError(error.response?.data?.message || error.message || 'Supplier gagal dihapus. Coba lagi.')
    } finally {
      setDeleting('')
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-bold leading-tight tracking-[-0.04em] sm:text-[28px]">Supplier</h2>
          <p className="mb-[22px] mt-[7px] text-sm text-[#788984]">Kelola kontak pemasok dan hubungkan supplier saat mencatat batch barang.</p>
        </div>
        <button className="rounded-lg bg-[#104b6b] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#0b3c56] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#75d5eb]" onClick={() => { setFormError(''); setFormInitial(blankSupplier()) }}>+ Tambah supplier</button>
      </div>

      {supplierState === 'loading' && (
        <div className="mb-4 rounded-xl border border-[#dce8ee] bg-[#f2f8fb] px-4 py-3 text-sm text-[#37637a]" role="status">Memuat data supplier…</div>
      )}
      {supplierState === 'error' && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#f0d8d3] bg-[#fdf2ef] px-4 py-3 text-sm text-[#a43e32]" role="alert">
          <span>{supplierError}</span>
          <button className="rounded-lg border border-[#e8c6bf] bg-white px-3 py-1.5 text-xs font-bold text-[#914438] hover:bg-[#fff9f7]" onClick={onReload}>Coba lagi</button>
        </div>
      )}
      {pageError && <p className="mb-4 rounded-lg bg-[#fbeae7] px-3 py-2.5 text-sm text-[#a43e32]" role="alert">{pageError}</p>}

      <section className="overflow-x-auto rounded-[15px] border border-[#e7ece8] bg-white p-4 shadow-[0_4px_16px_rgba(29,56,44,0.025)] sm:p-5">
        {suppliers.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-[#788984]">
            {supplierState === 'loading' ? 'Data supplier sedang dimuat.' : supplierState === 'error' || supplierState === 'disconnected' ? 'Data supplier belum tersedia.' : 'Belum ada data supplier. Tambahkan supplier untuk menghubungkannya ke batch.'}
          </p>
        ) : (
          <table className="w-full min-w-[700px] border-collapse">
            <thead>
              <tr>
                {['Supplier', 'Kontak', 'Telepon', 'Email', 'Barang terkait', 'Aksi'].map((heading) => (
                  <th className="border-b border-[#e6ece7] px-2.5 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.07em] text-[#809089]" key={heading}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {suppliers.map((supplier) => {
                const batchCount = batches.filter((batch) => batch.supplier_id === supplier.supplier_id).length
                return (
                  <tr className="hover:bg-[#fafcf9]" key={supplier.supplier_id}>
                    <td className="border-b border-[#edf0ed] px-2.5 py-3 text-xs font-semibold">{supplier.name}<small className="mt-0.5 block text-xs font-normal text-[#788984]">{supplier.address || 'Alamat belum diisi'}</small></td>
                    <td className="border-b border-[#edf0ed] px-2.5 py-3 text-xs">{supplier.contact_person || '—'}</td>
                    <td className="border-b border-[#edf0ed] px-2.5 py-3 text-xs">{supplier.phone || '—'}</td>
                    <td className="border-b border-[#edf0ed] px-2.5 py-3 text-xs">{supplier.email || '—'}</td>
                    <td className="border-b border-[#edf0ed] px-2.5 py-3 text-xs">{batchCount} batch</td>
                    <td className="border-b border-[#edf0ed] px-2.5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="rounded-md border border-[#dfe7e1] px-2.5 py-1.5 text-xs font-semibold text-[#486158] hover:bg-[#f4f8f4]" onClick={() => { setFormError(''); setFormInitial({ ...blankSupplier(), ...supplier }) }}>Ubah</button>
                        <button disabled={deleting === supplier.supplier_id} className="rounded-md border border-[#f0d8d3] px-2.5 py-1.5 text-xs font-semibold text-[#a43e32] hover:bg-[#fdf0ed] disabled:opacity-50" onClick={() => remove(supplier)}>{deleting === supplier.supplier_id ? 'Menghapus…' : 'Hapus'}</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>

      {formInitial && (
        <SupplierForm
          initial={formInitial}
          saving={saving}
          error={formError}
          onClose={() => { if (!saving) setFormInitial(null) }}
          onSubmit={save}
        />
      )}
    </>
  )
}
