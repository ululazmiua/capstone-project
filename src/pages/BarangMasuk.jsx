import { useMemo, useState } from 'react'
const controlClass = 'mt-1 w-full rounded-[10px] border border-[#dfe7e1] bg-white px-3 py-2.5 text-sm text-[#19352e] outline-none focus:border-[#7eae96] focus:shadow-[0_0_0_3px_rgba(23,115,91,0.1)]'
const today = () => new Date().toISOString().slice(0, 10)

function newReceipt() {
  return {
    product_id: '',
    product_name: '',
    category: '',
    batch_number: '',
    current_stock: '',
    unit_price: '',
    expiry_date: '',
    received_at: today(),
    supplier_id: '',
    supplier_name: '',
  }
}

export default function BarangMasuk({ data, suppliers, onSubmit, onGoToSuppliers }) {
  const products = useMemo(() => {
    const unique = new Map()
    data.forEach((batch) => {
      if (!unique.has(String(batch.product_id))) {
        unique.set(String(batch.product_id), {
          product_id: batch.product_id,
          product_name: batch.product_name,
          category: batch.category,
          unit_price: batch.unit_price,
        })
      }
    })
    return [...unique.values()].sort((a, b) => a.product_name.localeCompare(b.product_name, 'id'))
  }, [data])

  const [form, setForm] = useState(newReceipt)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [productMode, setProductMode] = useState('existing')
  const isNewProduct = productMode === 'new'
  const selectedProduct = products.find((product) => String(product.product_id) === form.product_id)

  const set = (key) => (event) => {
    const value = event.target.value
    setForm((current) => {
      const updated = { ...current, [key]: value }
      if (key === 'product_id') {
        const product = products.find((item) => String(item.product_id) === value)
        updated.product_name = product?.product_name || ''
        updated.category = product?.category || ''
        updated.unit_price = product?.unit_price ?? ''
      }
      if (key === 'supplier_id') {
        updated.supplier_name = suppliers.find((supplier) => String(supplier.supplier_id) === value)?.name || ''
      }
      return updated
    })
  }

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage(null)
    const product = isNewProduct ? null : selectedProduct

    try {
      await onSubmit({
        product_id: product?.product_id || null,
        product_name: (isNewProduct ? form.product_name : product?.product_name || '').trim(),
        category: (isNewProduct ? form.category : product?.category || '').trim(),
        batch_number: form.batch_number.trim(),
        current_stock: Number(form.current_stock),
        unit_price: Number(form.unit_price),
        expiry_date: form.expiry_date,
        received_at: form.received_at,
        supplier_id: form.supplier_id,
      })
      setForm(newReceipt())
      setProductMode('existing')
      setMessage({ type: 'success', text: 'Barang masuk berhasil dicatat dan ditambahkan ke daftar batch.' })
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || error.message || 'Barang masuk gagal dicatat. Periksa data lalu coba lagi.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-[22px] font-bold leading-tight tracking-[-0.04em] sm:text-[28px]">Barang masuk</h2>
        <p className="mb-0 mt-[7px] text-sm text-[#788984]">Catat stok yang baru diterima. Setiap tanggal kedaluwarsa atau nomor batch berbeda perlu dicatat sebagai batch tersendiri.</p>
      </div>

      <section className="max-w-4xl rounded-[15px] border border-[#e7ece8] bg-white p-5 shadow-[0_4px_16px_rgba(29,56,44,0.025)] sm:p-7">
        <div className="mb-6 flex items-start gap-3">
          <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-[#e7f5fa] text-[#14799c]">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          <div>
            <h3 className="mb-1 text-base font-bold">Catat penerimaan stok</h3>
            <p className="text-xs text-[#788984]">Produk yang belum terdaftar juga bisa ditambahkan langsung saat mencatat barang masuk.</p>
          </div>
        </div>

        <form onSubmit={submit} className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
          <label className="text-xs font-semibold text-[#52685f] sm:col-span-2">
            Cara memasukkan produk *
            <span className="mt-1.5 grid grid-cols-2 gap-2">
              <button
                type="button"
                aria-pressed={!isNewProduct}
                onClick={() => {
                  setProductMode('existing')
                  setForm((current) => ({ ...current, product_id: '', product_name: '', category: '', unit_price: '' }))
                }}
                className={`rounded-lg border px-3 py-2.5 text-left text-xs font-semibold transition ${!isNewProduct ? 'border-[#14799c] bg-[#e7f5fa] text-[#105b7c]' : 'border-[#dfe7e1] bg-white text-[#61736a] hover:bg-[#f5f8f6]'}`}
              >
                Produk terdaftar
              </button>
              <button
                type="button"
                aria-pressed={isNewProduct}
                onClick={() => {
                  setProductMode('new')
                  setForm((current) => ({ ...current, product_id: '', product_name: '', category: '', unit_price: '' }))
                }}
                className={`rounded-lg border px-3 py-2.5 text-left text-xs font-semibold transition ${isNewProduct ? 'border-[#14799c] bg-[#e7f5fa] text-[#105b7c]' : 'border-[#dfe7e1] bg-white text-[#61736a] hover:bg-[#f5f8f6]'}`}
              >
                + Produk baru
              </button>
            </span>
          </label>

          {!isNewProduct && (
            <label className="text-xs font-semibold text-[#52685f] sm:col-span-2">
              Pilih nama produk *
              <select className={controlClass} value={form.product_id} onChange={set('product_id')} required>
                <option value="" disabled>{products.length ? 'Pilih produk dari daftar' : 'Belum ada produk terdaftar'}</option>
                {products.map((product) => (
                  <option key={product.product_id} value={String(product.product_id)}>{product.product_name} · {product.category}</option>
                ))}
              </select>
              {!products.length && <span className="mt-1 block font-normal text-[#788984]">Belum ada produk terdaftar. Pilih “Produk baru” untuk mencatat produk pertama.</span>}
            </label>
          )}

          {isNewProduct && (
            <>
              <label className="text-xs font-semibold text-[#52685f]">
                Nama produk *
                <input className={controlClass} value={form.product_name} onChange={set('product_name')} required maxLength={150} placeholder="Contoh: Makanan kucing 1 kg" />
              </label>
              <label className="text-xs font-semibold text-[#52685f]">
                Kategori *
                <input className={controlClass} value={form.category} onChange={set('category')} required maxLength={80} placeholder="Contoh: Makanan Kucing" />
              </label>
            </>
          )}
          {selectedProduct && (
            <div className="rounded-lg bg-[#f5f8f6] px-3 py-2.5 text-xs text-[#61736a] sm:col-span-2">
              Produk dipilih: <b className="text-[#19352e]">{selectedProduct.product_name}</b> · {selectedProduct.category}
            </div>
          )}

          <label className="text-xs font-semibold text-[#52685f]">
            Nomor batch / lot *
            <input className={controlClass} value={form.batch_number} onChange={set('batch_number')} required maxLength={80} placeholder="Contoh: LOT-202610-001" />
          </label>
          <label className="text-xs font-semibold text-[#52685f]">
            Jumlah barang masuk *
            <input className={controlClass} type="number" min="1" step="1" value={form.current_stock} onChange={set('current_stock')} required placeholder="Contoh: 24" />
          </label>
          <label className="text-xs font-semibold text-[#52685f]">
            Harga satuan (Rp) *
            <input className={controlClass} type="number" min="0" step="1" value={form.unit_price} onChange={set('unit_price')} required placeholder="Contoh: 25000" />
            {selectedProduct && form.unit_price && <span className="mt-1 block font-normal text-[#788984]">Harga dari data produk terakhir. Sesuaikan jika berbeda.</span>}
          </label>
          <label className="text-xs font-semibold text-[#52685f]">
            Tanggal barang diterima *
            <input className={controlClass} type="date" value={form.received_at} onChange={set('received_at')} required />
          </label>
          <label className="text-xs font-semibold text-[#52685f]">
            Tanggal kedaluwarsa *
            <input className={controlClass} type="date" min={form.received_at} value={form.expiry_date} onChange={set('expiry_date')} required />
          </label>
          <div className="text-xs font-semibold text-[#52685f]">
            <label htmlFor="receipt-supplier">Supplier *</label>
            <select id="receipt-supplier" className={controlClass} value={form.supplier_id} onChange={set('supplier_id')} required>
              <option value="" disabled>Pilih supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.supplier_id} value={String(supplier.supplier_id)}>{supplier.name}</option>
              ))}
            </select>
            {suppliers.length === 0 && (
              <span className="mt-1.5 flex flex-wrap items-center gap-1 font-normal text-[#788984]">
                Belum ada supplier di daftar.
                <button type="button" onClick={onGoToSuppliers} className="font-semibold text-[#14799c] underline underline-offset-2 hover:text-[#105b7c]">
                  Tambahkan di menu Supplier
                </button>
              </span>
            )}
          </div>

          {message && (
            <p className={`rounded-lg px-3 py-2.5 text-sm sm:col-span-2 ${message.type === 'success' ? 'bg-[#e6f4ed] text-[#236b51]' : 'bg-[#fbeae7] text-[#a43e32]'}`} role={message.type === 'success' ? 'status' : 'alert'}>
              {message.text}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#edf0ed] pt-4 sm:col-span-2">
            <p className="text-xs text-[#788984]">Produk dan batch baru akan dicatat untuk pemantauan stok dan kedaluwarsa.</p>
            <button type="submit" disabled={saving} className="rounded-lg bg-[#104b6b] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#0b3c56] disabled:cursor-wait disabled:opacity-60">
              {saving ? 'Mencatat barang…' : 'Catat barang masuk'}
            </button>
          </div>
        </form>
      </section>

    </>
  )
}
