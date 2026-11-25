
import { useState } from 'react'

const inputClass =
  'mt-1 w-full rounded-[10px] border border-[#dfe7e1] bg-white px-3 py-2.5 text-sm text-[#19352e] outline-none focus:border-[#7eae96]'

const blankSupplier = () => ({
  id: null,
  name: '',
  email: '',
  phone: '',
  address: '',
})

function SupplierForm({ initial, saving, error, onClose, onSubmit }) {
  const [form, setForm] = useState(initial)

  const set = (key) => (event) =>
    setForm((value) => ({ ...value, [key]: event.target.value }))

  const submit = (event) => {
    event.preventDefault()

    onSubmit({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
    })
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center overflow-y-auto bg-[#102d3d]/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose()
      }}
    >
      <section
        className="my-auto w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
        role="dialog"
        aria-modal="true"
        aria-labelledby="supplier-form-title"
      >
        <h3
          id="supplier-form-title"
          className="mb-1 text-lg font-bold text-[#19352e]"
        >
          {initial.id ? 'Ubah data supplier' : 'Tambah supplier'}
        </h3>

        <p className="mb-5 text-xs text-[#788984]">
          Kelola informasi pemasok untuk pencatatan barang masuk.
        </p>

        <form className="grid grid-cols-1 gap-4" onSubmit={submit}>
          <label
            htmlFor="supplier-name"
            className="text-xs font-semibold text-[#52685f]"
          >
            Nama supplier / usaha *
            <input
              id="supplier-name"
              name="name"
              className={inputClass}
              value={form.name}
              onChange={set('name')}
              required
              maxLength={150}
              placeholder="Contoh: CV Aneka Pakan"
            />
          </label>

          <label
            htmlFor="supplier-email"
            className="text-xs font-semibold text-[#52685f]"
          >
            Email
            <input
              id="supplier-email"
              name="email"
              type="email"
              className={inputClass}
              value={form.email || ''}
              onChange={set('email')}
              maxLength={150}
              placeholder="supplier@email.com"
            />
          </label>

          <label
            htmlFor="supplier-phone"
            className="text-xs font-semibold text-[#52685f]"
          >
            Nomor telepon
            <input
              id="supplier-phone"
              name="phone"
              className={inputClass}
              type="tel"
              value={form.phone}
              onChange={set('phone')}
              maxLength={40}
              placeholder="08xxxxxxxxxx"
            />
          </label>

          <label
            htmlFor="supplier-address"
            className="text-xs font-semibold text-[#52685f]"
          >
            Alamat
            <textarea
              id="supplier-address"
              name="address"
              className={inputClass}
              value={form.address}
              onChange={set('address')}
              maxLength={1000}
              rows={3}
              placeholder="Alamat supplier"
            />
          </label>

          {error && (
            <p
              className="rounded-lg bg-[#fbeae7] px-3 py-2.5 text-sm text-[#a43e32]"
              role="alert"
            >
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-[#dfe7e1] px-4 py-2.5 text-sm font-semibold text-[#486158]"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#104b6b] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {saving
                ? 'Menyimpan…'
                : initial.id
                  ? 'Simpan perubahan'
                  : 'Tambah supplier'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default function Suppliers({
  title = 'Supplier',
  description = 'Kelola pemasok dan informasi supplier.',
  suppliers = [],
  onSave,
  onDelete,
  supplierState,
  supplierError,
  onReload,
}) {
  const [formInitial, setFormInitial] = useState(null)
  const [formError, setFormError] = useState('')
  const [pageError, setPageError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const save = async (supplier) => {
    setSaving(true)
    setFormError('')

    try {
      const existing = formInitial.id ? formInitial : null

      await onSave(supplier, existing)

      setFormInitial(null)
    } catch (error) {
      setFormError(
        error.message ||
          'Supplier gagal disimpan. Coba lagi.'
      )
    } finally {
      setSaving(false)
    }
  }

  const remove = async (supplier) => {
    if (!window.confirm(`Hapus supplier "${supplier.name}"?`)) return

    const supplierId = supplier.id ?? supplier.supplier_id

    setDeleting(supplierId)
    setPageError('')

    try {
      await onDelete(supplier)
    } catch (error) {
      setPageError(
        error.message ||
          'Supplier gagal dihapus. Coba lagi.'
      )
    } finally {
      setDeleting(null)
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-bold sm:text-[28px]">
            {title}
          </h2>
          <p className="mb-[22px] mt-[7px] text-sm text-[#788984]">
            {description}
          </p>
        </div>

        <button
          type="button"
          className="rounded-lg bg-[#104b6b] px-4 py-2.5 text-sm font-bold text-white"
          onClick={() => {
            setFormError('')
            setFormInitial(blankSupplier())
          }}
        >
          + Tambah supplier
        </button>
      </div>

      {supplierState === 'loading' && (
        <p className="mb-4 rounded-xl bg-[#f2f8fb] px-4 py-3 text-sm">
          Memuat data supplier…
        </p>
      )}

      {supplierState === 'error' && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#fdf2ef] px-4 py-3 text-sm text-[#a43e32]">
          <span>{supplierError}</span>
          <button
            type="button"
            className="rounded-lg border bg-white px-3 py-1.5 text-xs font-bold"
            onClick={onReload}
          >
            Coba lagi
          </button>
        </div>
      )}

      {pageError && (
        <p
          className="mb-4 rounded-lg bg-[#fbeae7] px-3 py-2.5 text-sm text-[#a43e32]"
          role="alert"
        >
          {pageError}
        </p>
      )}

      <section className="overflow-x-auto rounded-[15px] border border-[#e7ece8] bg-white p-4 sm:p-5">
        {suppliers.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-[#788984]">
            {supplierState === 'loading'
              ? 'Data supplier sedang dimuat.'
              : supplierState === 'error' ||
                  supplierState === 'disconnected'
                ? 'Data supplier belum tersedia.'
                : 'Belum ada supplier. Klik Tambah supplier untuk memulai.'}
          </p>
        ) : (
          <table className="w-full min-w-[650px] border-collapse">
            <thead>
              <tr>
                {[
                  'Nama supplier',
                  'Email',
                  'Telepon',
                  'Alamat',
                  'Aksi',
                ].map((heading) => (
                  <th
                    key={heading}
                    className="border-b border-[#e6ece7] px-2.5 py-2.5 text-left text-[10px] font-bold uppercase text-[#809089]"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {suppliers.map((supplier) => {
                const supplierId = supplier.id ?? supplier.supplier_id

                return (
                  <tr
                    className="hover:bg-[#fafcf9]"
                    key={supplierId}
                  >
                    <td className="border-b border-[#edf0ed] px-2.5 py-3 text-xs font-semibold">
                      {supplier.name}
                    </td>

                    <td className="border-b border-[#edf0ed] px-2.5 py-3 text-xs">
                      {supplier.email || '—'}
                    </td>

                    <td className="border-b border-[#edf0ed] px-2.5 py-3 text-xs">
                      {supplier.phone || '—'}
                    </td>

                    <td className="border-b border-[#edf0ed] px-2.5 py-3 text-xs">
                      {supplier.address || '—'}
                    </td>

                    <td className="border-b border-[#edf0ed] px-2.5 py-3">
                      <div className="flex justify-start gap-2">
                        <button
                          type="button"
                          className="rounded-md border border-[#dfe7e1] px-2.5 py-1.5 text-xs font-semibold"
                          onClick={() => {
                            setFormError('')
                            setFormInitial({
                              ...blankSupplier(),
                              ...supplier,
                              id: supplierId,
                            })
                          }}
                        >
                          Ubah
                        </button>

                        <button
                          type="button"
                          disabled={deleting === supplierId}
                          className="rounded-md border border-[#f0d8d3] px-2.5 py-1.5 text-xs font-semibold text-[#a43e32] disabled:opacity-50"
                          onClick={() =>
                            remove({ ...supplier, id: supplierId })
                          }
                        >
                          {deleting === supplierId
                            ? 'Menghapus…'
                            : 'Hapus'}
                        </button>
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
          onClose={() => {
            if (!saving) setFormInitial(null)
          }}
          onSubmit={save}
        />
      )}
    </>
  )
}