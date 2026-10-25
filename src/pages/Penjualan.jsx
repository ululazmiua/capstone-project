import { useMemo, useState } from 'react'
import { ExpiryBar } from '../components.jsx'

const controlClass = 'mt-1 w-full rounded-[10px] border border-[#dfe7e1] bg-white px-3 py-2.5 text-sm text-[#19352e] outline-none focus:border-[#7eae96] focus:shadow-[0_0_0_3px_rgba(23,115,91,0.1)]'

function localDate() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

function SaleForm({ data, onSubmit }) {
  const [productQuery, setProductQuery] = useState('')
  const [batchQuery, setBatchQuery] = useState('')
  const [quantity, setQuantity] = useState('')
  const [soldAt, setSoldAt] = useState(localDate)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  const availableBatches = useMemo(
    () => data
      .filter((batch) => batch.current_stock > 0 && batch.status !== 'EXPIRED')
      .sort((a, b) => a.product_name.localeCompare(b.product_name, 'id') || a.days_until_expiry - b.days_until_expiry),
    [data]
  )
  const productOptions = useMemo(() => {
    const products = new Map()
    availableBatches.forEach((item) => {
      const key = item.product_id || item.product_name
      if (!products.has(key)) {
        products.set(key, { key, name: item.product_name, productId: item.product_id })
      }
    })
    const productList = [...products.values()]
    const nameCounts = new Map()
    productList.forEach(({ name }) => nameCounts.set(name, (nameCounts.get(name) || 0) + 1))
    return productList.map((product) => ({
      ...product,
      label: nameCounts.get(product.name) > 1 ? `${product.name} · ${product.productId}` : product.name,
    }))
  }, [availableBatches])
  const selectedProduct = productOptions.find((product) => product.label === productQuery)
  const productBatches = selectedProduct
    ? availableBatches.filter((item) => (item.product_id || item.product_name) === selectedProduct.key)
    : []
  const batchOptions = productBatches.map((item) => ({
    batch: item,
    label: item.batch_id,
  }))
  const batch = batchOptions.find((option) => option.label === batchQuery)?.batch

  const submit = async (event) => {
    event.preventDefault()
    const units = Number(quantity)
    if (!selectedProduct || !batch || !Number.isInteger(units) || units < 1 || units > batch.current_stock) {
      setMessage({ type: 'error', text: 'Pilih produk dan batch, lalu masukkan jumlah yang tersedia.' })
      return
    }

    setSaving(true)
    setMessage(null)
    try {
      await onSubmit({ batch_id: batch.batch_id, quantity: units, sold_at: soldAt })
      setProductQuery('')
      setBatchQuery('')
      setQuantity('')
      setSoldAt(localDate())
      setMessage({ type: 'success', text: `${units} unit ${batch.product_name} berhasil dicatat sebagai penjualan.` })
    } catch {
      setMessage({ type: 'error', text: 'Penjualan gagal dicatat. Periksa data lalu coba lagi.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mb-5 rounded-[15px] border border-[#e7ece8] bg-white px-[15px] py-[17px] shadow-[0_4px_16px_rgba(29,56,44,0.025)] sm:px-[22px] sm:py-[21px]">
      <div className="mb-5">
        <h3 className="mb-1 text-[15px] font-bold tracking-[-0.015em]">Catat barang terjual</h3>
        <p className="text-xs text-[#788984]">Pilih batch agar jumlah stok dan ringkasan penjualan ikut diperbarui.</p>
      </div>
      {availableBatches.length === 0 ? (
        <p className="rounded-lg bg-[#f5f8f6] px-3 py-3 text-sm text-[#788984]" role="status">Tidak ada batch tersedia untuk dicatat sebagai penjualan.</p>
      ) : (
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-semibold text-[#52685f] sm:col-span-2">
            Nama produk *
            <input
              className={controlClass}
              type="text"
              list="sale-product-options"
              value={productQuery}
              onChange={(event) => { setProductQuery(event.target.value); setBatchQuery(''); setQuantity(''); setMessage(null) }}
              required
              autoComplete="off"
              placeholder="Ketik nama produk"
            />
            <datalist id="sale-product-options">
              {productOptions.map((product) => (
                <option key={product.key} value={product.label} />
              ))}
            </datalist>
          </label>
          <label className="text-xs font-semibold text-[#52685f] sm:col-span-2">
            Batch *
            <input
              className={controlClass}
              type="text"
              list="sale-batch-options"
              value={batchQuery}
              onChange={(event) => { setBatchQuery(event.target.value); setQuantity(''); setMessage(null) }}
              required
              autoComplete="off"
              disabled={!selectedProduct}
              placeholder={selectedProduct ? 'Ketik atau pilih batch' : 'Pilih produk terlebih dahulu'}
            />
            <datalist id="sale-batch-options">
              {batchOptions.map(({ batch: item, label }) => (
                <option key={item.batch_id} value={label} />
              ))}
            </datalist>
          </label>
          <label className="text-xs font-semibold text-[#52685f]">
            Stok tersedia
            <input
              className={`${controlClass} bg-[#f5f8f6] text-[#52685f]`}
              type="text"
              value={batch ? `${batch.current_stock} unit` : ''}
              readOnly
              placeholder="Pilih batch"
              aria-label="Stok tersedia pada batch terpilih"
            />
          </label>
          <label className="text-xs font-semibold text-[#52685f]">
            Jumlah terjual *
            <input className={controlClass} type="number" min="1" max={batch?.current_stock || undefined} step="1" value={quantity} onChange={(event) => { setQuantity(event.target.value); setMessage(null) }} required placeholder={batch ? `Maks. ${batch.current_stock}` : 'Pilih batch dulu'} />
          </label>
          <label className="text-xs font-semibold text-[#52685f]">
            Tanggal penjualan *
            <input className={controlClass} type="date" value={soldAt} onChange={(event) => { setSoldAt(event.target.value); setMessage(null) }} required />
          </label>
          {message && (
            <p className={`rounded-lg px-3 py-2.5 text-sm sm:col-span-2 lg:col-span-4 ${message.type === 'success' ? 'bg-[#e6f4ed] text-[#236b51]' : 'bg-[#fbeae7] text-[#a43e32]'}`} role={message.type === 'success' ? 'status' : 'alert'}>
              {message.text}
            </p>
          )}
          <div className="flex justify-end border-t border-[#edf0ed] pt-4 sm:col-span-2 lg:col-span-4">
            <button type="submit" disabled={saving || !batch} className="rounded-lg bg-[#104b6b] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#0b3c56] disabled:cursor-wait disabled:opacity-60">
              {saving ? 'Mencatat penjualan…' : 'Catat penjualan'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}

export default function Penjualan({ data, onRecordSale }) {
  const prod = useMemo(() => {
    const m = {}
    data.forEach((b) => {
      const p = (m[b.product_id] ||= { name: b.product_name, sold: 0, stock: 0 })
      p.sold += b.quantity_sold; p.stock += b.current_stock
    })
    return Object.values(m).sort((a, b) => b.sold - a.sold)
  }, [data])
  const max = Math.max(...prod.map((p) => p.sold), 1)
  const flagged = data.filter((b) => b.priority_sale_flag && b.current_stock > 0).sort((a, b) => a.days_until_expiry - b.days_until_expiry)
  const rank = (p, c) => (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(55px,1fr)_auto] items-center gap-2 border-t border-[#edf0ed] py-2.5 text-[11px] text-[#52685f] sm:grid-cols-[minmax(0,1.15fr)_minmax(80px,2fr)_auto] sm:gap-3 sm:text-xs" key={p.name}>
      <span>{p.name}</span><div className="h-[7px] overflow-hidden rounded-full bg-[#edf1ed]"><i className={`block h-full rounded-full ${c === 'low' ? 'bg-[#d3a14e]' : 'bg-[#17735b]'}`} style={{ width: Math.max(3, (p.sold / max) * 100) + '%' }} /></div><b className="font-bold">{p.sold}</b>
    </div>
  )
  return (
    <>
      <h2 className="text-[22px] font-bold leading-tight tracking-[-0.04em] sm:text-[28px]">Penjualan</h2>
      <p className="mb-[22px] mt-[7px] text-sm text-[#788984]">Total unit terjual per produk dari seluruh batch.</p>
      <SaleForm data={data} onSubmit={onRecordSale} />
      <div className="grid grid-cols-1 gap-0 lg:grid-cols-2 lg:gap-[18px]">
        <section className="mb-5 rounded-[15px] border border-[#e7ece8] bg-white px-[15px] py-[17px] shadow-[0_4px_16px_rgba(29,56,44,0.025)] sm:px-[22px] sm:py-[21px]"><h3 className="mb-[15px] text-[15px] font-bold tracking-[-0.015em]">Produk terlaris</h3>{prod.slice(0, 6).map((p) => rank(p, ''))}
          <p className="mt-[13px] text-xs text-[#788984]">Pertimbangkan menambah stok produk ini.</p></section>
        <section className="mb-5 rounded-[15px] border border-[#e7ece8] bg-white px-[15px] py-[17px] shadow-[0_4px_16px_rgba(29,56,44,0.025)] sm:px-[22px] sm:py-[21px]"><h3 className="mb-[15px] text-[15px] font-bold tracking-[-0.015em]">Kurang diminati</h3>{prod.slice(-6).reverse().map((p) => rank(p, 'low'))}
          <p className="mt-[13px] text-xs text-[#788984]">Tahan pembelian ulang sampai stok yang ada terjual.</p></section>
      </div>
      <section className="mb-5 rounded-[15px] border border-[#e7ece8] bg-white px-[15px] py-[17px] shadow-[0_4px_16px_rgba(29,56,44,0.025)] sm:px-[22px] sm:py-[21px]">
        <h3 className="mb-[15px] text-[15px] font-bold tracking-[-0.015em]">Rekomendasi prioritas jual dari model ({flagged.length} batch)</h3>
        <p className="mb-0 mt-0 text-xs text-[#788984]">Sementara berasal dari kolom <code className="rounded bg-[#f3f6f3] px-1 py-0.5">priority_sale_flag</code> di data. Nanti diganti hasil prediksi dari tim AI lewat API.</p>
        {flagged.slice(0, 10).map((b) => (
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2.5 border-t border-[#edf0ed] py-3.5 sm:grid-cols-[minmax(0,1.15fr)_minmax(170px,1.7fr)_auto] sm:gap-[18px]" key={b.batch_id}>
            <div><b className="mb-0.5 block text-[13px] font-semibold">{b.product_name}</b><small className="block text-xs text-[#788984]">{b.batch_id} · stok {b.current_stock}</small></div>
            <ExpiryBar b={b} /><span className="inline-flex whitespace-nowrap rounded-full bg-[#fff2dc] px-2.5 py-[5px] text-[11px] font-bold leading-tight text-[#a76b1e]">Beri diskon</span>
          </div>
        ))}
      </section>
    </>
  )
}
