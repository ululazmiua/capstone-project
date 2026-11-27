import { useMemo, useState } from 'react'
import { CATEGORIES, fmtDate, rp } from '../util.js'

const controlClass =
  'mt-1 w-full rounded-[10px] border border-[#dfe7e1] bg-white px-3 py-2.5 text-sm text-[#19352e] outline-none focus:border-[#7eae96] focus:shadow-[0_0_0_3px_rgba(23,115,91,0.1)]'
const PAGE_SIZE = 20

const today = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getSupplierId = (supplier) =>
  supplier.id ?? supplier.supplier_id

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

// Form pop-up untuk mencatat barang masuk
function ReceiptForm({
  products,
  suppliers,
  initialMode,
  onClose,
  onSubmit,
  onGoToSuppliers,
}) {
  const [form, setForm] = useState(newReceipt)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [productQuery, setProductQuery] = useState('')

  const isNewProduct = initialMode === 'new'

  const selectedProduct = products.find(
    (product) => String(product.product_id) === form.product_id
  )

  const set = (key) => (event) => {
    const value = event.target.value

    setForm((current) => {
      const updated = { ...current, [key]: value }

      if (key === 'supplier_id') {
        const supplier = suppliers.find(
          (item) => String(getSupplierId(item)) === value
        )

        updated.supplier_name = supplier?.name || ''
      }

      return updated
    })
  }


  const findProduct = (text) => {
    const keyword = text.trim().toLowerCase()
    if (!keyword) return null

    return (
      products.find((item) => item.label.toLowerCase() === keyword) ||
      products.find((item) => item.product_name.toLowerCase() === keyword) ||
      null
    )
  }

  const typeProduct = (event) => {
    const value = event.target.value
    const product = findProduct(value)

    setProductQuery(value)
    setMessage(null)
    setForm((current) => ({
      ...current,
      product_id: product ? String(product.product_id) : '',
      product_name: product?.product_name || '',
      category: product?.category || '',
      unit_price: product ? product.unit_price ?? '' : current.unit_price,
    }))
  }

  const productNotFound =
    !isNewProduct && productQuery.trim() !== '' && !selectedProduct

  const submit = async (event) => {
    event.preventDefault()

    if (saving) return

    const product = isNewProduct ? null : selectedProduct
    const productName = (
      isNewProduct ? form.product_name : product?.product_name || ''
    ).trim()
    const category = (
      isNewProduct ? form.category : product?.category || ''
    ).trim()
    const stock = Number(form.current_stock)
    const price = Number(form.unit_price)
    const supplierId = form.supplier_id
      ? Number(form.supplier_id)
      : null

    if (!isNewProduct && !product) {
      setMessage(
        'Pilih produk dari daftar saran. Jika produknya belum ada, tutup form ini lalu klik “+ Produk baru”.'
      )
      return
    }

    if (!productName || !category) {
      setMessage('Nama produk dan kategori wajib diisi.')
      return
    }

    if (
      !form.current_stock ||
      !Number.isInteger(stock) ||
      stock < 1
    ) {
      setMessage('Jumlah barang masuk harus berupa bilangan bulat minimal 1.')
      return
    }

    if (
      form.unit_price === '' ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      setMessage('Harga satuan harus berupa angka nol atau lebih.')
      return
    }

    if (!form.batch_number.trim()) {
      setMessage('Nomor batch wajib diisi.')
      return
    }

    if (!form.received_at || !form.expiry_date) {
      setMessage('Tanggal barang diterima dan kedaluwarsa wajib diisi.')
      return
    }

    if (form.expiry_date < form.received_at) {
      setMessage('Tanggal kedaluwarsa tidak boleh sebelum tanggal penerimaan.')
      return
    }

    if (!form.supplier_id || !Number.isInteger(supplierId)) {
      setMessage('Pilih supplier yang valid terlebih dahulu.')
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      await onSubmit({
        product_id: product?.product_id ?? null,
        product_name: productName,
        category,
        batch_number: form.batch_number.trim(),
        current_stock: stock,
        unit_price: price,
        expiry_date: form.expiry_date,
        received_at: form.received_at,
        supplier_id: supplierId,
        supplier_name: form.supplier_name,
      })

      onClose()
    } catch (error) {
      setMessage(
        error.message ||
          'Barang masuk gagal dicatat. Periksa data lalu coba lagi.'
      )
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center overflow-y-auto bg-[#102d3d]/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose()
      }}
    >
      <section
        className="my-auto w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
        role="dialog"
        aria-modal="true"
        aria-labelledby="receipt-form-title"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h3
              id="receipt-form-title"
              className="mb-1 text-lg font-bold text-[#19352e]"
            >
              {isNewProduct
                ? 'Barang masuk · Produk baru'
                : 'Barang masuk · Produk terdaftar'}
            </h3>
            <p className="text-xs text-[#788984]">
              {isNewProduct
                ? 'Untuk produk yang belum pernah tercatat. Isi nama dan kategori produknya.'
                : 'Untuk produk yang sudah ada di daftar. Ketik atau pilih nama produknya.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg px-2 py-1 text-xl leading-none text-[#788984] hover:bg-[#f3f6f3] disabled:opacity-50"
            aria-label="Tutup form"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={submit}
          className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2"
        >
          {!isNewProduct && (
            <label className="text-xs font-semibold text-[#52685f] sm:col-span-2">
              Nama produk *
              <input
                className={controlClass}
                type="text"
                list="receipt-product-options"
                value={productQuery}
                onChange={typeProduct}
                required
                autoComplete="off"
                disabled={!products.length}
                placeholder={
                  products.length
                    ? 'Ketik atau pilih nama produk'
                    : 'Belum ada produk terdaftar'
                }
              />
              <datalist id="receipt-product-options">
                {products.map((product) => (
                  <option key={String(product.product_id)} value={product.label}>
                    {product.category}
                  </option>
                ))}
              </datalist>

              {productNotFound && (
                <span className="mt-1 block font-normal text-[#a76b1e]">
                  Produk belum cocok dengan daftar. Pilih dari saran yang
                  muncul; jika produknya belum ada, tutup form ini lalu klik
                  “+ Produk baru”.
                </span>
              )}

              {!products.length && (
                <span className="mt-1 block font-normal text-[#788984]">
                  Belum ada produk terdaftar. Pilih “Produk baru” untuk
                  mencatat produk pertama.
                </span>
              )}
            </label>
          )}

          {isNewProduct && (
            <>
              <label className="text-xs font-semibold text-[#52685f]">
                Nama produk *
                <input
                  className={controlClass}
                  value={form.product_name}
                  onChange={set('product_name')}
                  required
                  maxLength={150}
                  placeholder="Contoh: Pakan hewan 1 kg"
                />
              </label>

              <label className="text-xs font-semibold text-[#52685f]">
                Kategori *
                <select
                  className={controlClass}
                  value={form.category}
                  onChange={set('category')}
                  required
                >
                  <option value="">Pilih kategori</option>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}

          {selectedProduct && !isNewProduct && (
            <div className="rounded-lg bg-[#f5f8f6] px-3 py-2.5 text-xs text-[#61736a] sm:col-span-2">
              Produk dipilih:{' '}
              <b className="text-[#19352e]">
                {selectedProduct.product_name}
              </b>{' '}
              · {selectedProduct.category}
            </div>
          )}

          <label className="text-xs font-semibold text-[#52685f]">
            Nomor batch / lot *
            <input
              className={controlClass}
              value={form.batch_number}
              onChange={set('batch_number')}
              required
              maxLength={80}
              placeholder="Contoh: MEO-202602-736"
            />
          </label>

          <label className="text-xs font-semibold text-[#52685f]">
            Jumlah barang masuk *
            <input
              className={controlClass}
              type="number"
              min="1"
              step="1"
              value={form.current_stock}
              onChange={set('current_stock')}
              required
              placeholder="Contoh: 24"
            />
          </label>

          <label className="text-xs font-semibold text-[#52685f]">
            Harga satuan (Rp) *
            <input
              className={controlClass}
              type="number"
              min="0"
              step="1"
              value={form.unit_price}
              onChange={set('unit_price')}
              required
              placeholder="Contoh: 25000"
            />
            {selectedProduct && form.unit_price !== '' && (
              <span className="mt-1 block font-normal text-[#788984]">
                Harga dari data produk terakhir. Sesuaikan jika berbeda.
              </span>
            )}
          </label>

          <label className="text-xs font-semibold text-[#52685f]">
            Tanggal barang diterima *
            <input
              className={controlClass}
              type="date"
              value={form.received_at}
              onChange={set('received_at')}
              required
            />
          </label>

          <label className="text-xs font-semibold text-[#52685f]">
            Tanggal kedaluwarsa *
            <input
              className={controlClass}
              type="date"
              min={form.received_at}
              value={form.expiry_date}
              onChange={set('expiry_date')}
              required
            />
          </label>

          <div className="text-xs font-semibold text-[#52685f]">
            <label htmlFor="receipt-supplier">Supplier *</label>
            <select
              id="receipt-supplier"
              className={controlClass}
              value={form.supplier_id}
              onChange={set('supplier_id')}
              required
            >
              <option value="" disabled>
                Pilih supplier
              </option>

              {suppliers.map((supplier) => {
                const supplierId = getSupplierId(supplier)

                return (
                  <option
                    key={String(supplierId ?? supplier.name)}
                    value={String(supplierId ?? '')}
                    disabled={supplierId == null}
                  >
                    {supplier.name}
                  </option>
                )
              })}
            </select>

            {suppliers.length === 0 && (
              <span className="mt-1.5 flex flex-wrap items-center gap-1 font-normal text-[#788984]">
                Belum ada supplier di daftar.
                <button
                  type="button"
                  onClick={onGoToSuppliers}
                  className="font-semibold text-[#14799c] underline underline-offset-2 hover:text-[#105b7c]"
                >
                  Tambahkan di menu Supplier
                </button>
              </span>
            )}
          </div>

          {message && (
            <p
              className="rounded-lg bg-[#fbeae7] px-3 py-2.5 text-sm text-[#a43e32] sm:col-span-2"
              role="alert"
            >
              {message}
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-[#edf0ed] pt-4 sm:col-span-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-[#dfe7e1] px-4 py-2.5 text-sm font-semibold text-[#486158] disabled:opacity-50"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={saving || (!isNewProduct && products.length === 0)}
              className="rounded-lg bg-[#104b6b] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#0b3c56] disabled:cursor-wait disabled:opacity-60"
            >
              {saving ? 'Mencatat barang…' : 'Catat barang masuk'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default function BarangMasuk({
  data = [],
  suppliers = [],
  onSubmit,
  onGoToSuppliers,
}) {
  const [formMode, setFormMode] = useState(null)
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(PAGE_SIZE)

  const products = useMemo(() => {
    const unique = new Map()

    data.forEach((batch) => {
      if (
        batch.product_id != null &&
        !unique.has(String(batch.product_id))
      ) {
        unique.set(String(batch.product_id), {
          product_id: batch.product_id,
          product_name: batch.product_name || '',
          category: batch.category || '',
          unit_price: batch.unit_price ?? '',
        })
      }
    })

    const list = [...unique.values()].sort((a, b) =>
      a.product_name.localeCompare(b.product_name, 'id')
    )

    const nameCounts = new Map()
    list.forEach(({ product_name }) =>
      nameCounts.set(product_name, (nameCounts.get(product_name) || 0) + 1)
    )

    return list.map((product) => ({
      ...product,
      label:
        nameCounts.get(product.product_name) > 1
          ? `${product.product_name} · ${product.product_id}`
          : product.product_name,
    }))
  }, [data])

  const history = useMemo(() => {
    const keyword = query.trim().toLowerCase()

    return data
      .filter((batch) => {
        if (!keyword) return true

        return [
          batch.product_name,
          batch.category,
          batch.batch_number,
          batch.batch_id,
          batch.supplier_name,
        ].some((value) =>
          String(value || '').toLowerCase().includes(keyword)
        )
      })
      .sort(
        (a, b) =>
          String(b.entry_date || '').localeCompare(String(a.entry_date || '')) ||
          String(b.batch_id || '').localeCompare(String(a.batch_id || ''))
      )
  }, [data, query])

  const totalUnits = history.reduce(
    (total, batch) => total + Number(batch.initial_stock || 0),
    0
  )

  const visibleRows = history.slice(0, limit)

  const headings = [
    'Tanggal masuk',
    'Produk',
    'No. batch',
    'Jumlah masuk',
    'Harga satuan',
    'Supplier',
    'Kedaluwarsa',
  ]

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-bold leading-tight tracking-[-0.04em] sm:text-[28px]">
            Barang masuk
          </h2>
          <p className="mb-[22px] mt-[7px] text-sm text-[#788984]">
            Riwayat penerimaan stok. Catat barang yang baru diterima lewat
            tombol di samping.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-[#104b6b] bg-white px-4 py-2.5 text-sm font-bold text-[#104b6b] hover:bg-[#f2f8fb]"
            onClick={() => setFormMode('new')}
          >
            + Produk baru
          </button>

          <button
            type="button"
            className="rounded-lg bg-[#104b6b] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0b3c56]"
            onClick={() => setFormMode('existing')}
          >
            + Produk terdaftar
          </button>
        </div>
      </div>

      <section className="rounded-[15px] border border-[#e7ece8] bg-white p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-bold">Riwayat barang masuk</h3>
            <p className="mt-1 text-xs text-[#788984]">
              {history.length.toLocaleString('id-ID')} batch ·{' '}
              {totalUnits.toLocaleString('id-ID')} unit
            </p>
          </div>

          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setLimit(PAGE_SIZE)
            }}
            placeholder="Cari produk, batch, atau supplier"
            className="w-full rounded-[10px] border border-[#dfe7e1] bg-white px-3 py-2 text-sm text-[#19352e] outline-none focus:border-[#7eae96] sm:w-72"
            aria-label="Cari riwayat barang masuk"
          />
        </div>

        {history.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-[#788984]">
            {query.trim()
              ? 'Tidak ada barang masuk yang cocok dengan pencarian.'
              : 'Belum ada riwayat barang masuk. Klik tombol di atas untuk mencatat.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse">
              <thead>
                <tr>
                  {headings.map((heading) => (
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
                {visibleRows.map((batch) => (
                  <tr className="hover:bg-[#fafcf9]" key={batch.batch_id}>
                    <td className="border-b border-[#edf0ed] px-2.5 py-3 text-xs">
                      {batch.entry_date ? fmtDate(batch.entry_date) : '—'}
                    </td>

                    <td className="border-b border-[#edf0ed] px-2.5 py-3 text-xs">
                      <b className="block font-semibold text-[#19352e]">
                        {batch.product_name}
                      </b>
                      <span className="text-[11px] text-[#788984]">
                        {batch.category || '—'}
                      </span>
                    </td>

                    <td className="border-b border-[#edf0ed] px-2.5 py-3 text-xs">
                      {batch.batch_number || batch.batch_id}
                    </td>

                    <td className="border-b border-[#edf0ed] px-2.5 py-3 text-xs">
                      {Number(batch.initial_stock || 0).toLocaleString('id-ID')}
                    </td>

                    <td className="border-b border-[#edf0ed] px-2.5 py-3 text-xs">
                      {rp(batch.unit_price || 0)}
                    </td>

                    <td className="border-b border-[#edf0ed] px-2.5 py-3 text-xs">
                      {batch.supplier_name || '—'}
                    </td>

                    <td className="border-b border-[#edf0ed] px-2.5 py-3 text-xs">
                      {batch.expiry_date ? fmtDate(batch.expiry_date) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
              <p className="text-xs text-[#788984]">
                Menampilkan {visibleRows.length.toLocaleString('id-ID')} dari{' '}
                {history.length.toLocaleString('id-ID')} batch
              </p>

              {visibleRows.length < history.length && (
                <button
                  type="button"
                  onClick={() => setLimit((current) => current + PAGE_SIZE)}
                  className="rounded-lg border border-[#dfe7e1] px-3.5 py-2 text-xs font-semibold text-[#486158] hover:bg-[#f4f8f4]"
                >
                  Tampilkan lebih banyak
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {formMode && (
        <ReceiptForm
          products={products}
          suppliers={suppliers}
          initialMode={formMode}
          onClose={() => setFormMode(null)}
          onSubmit={onSubmit}
          onGoToSuppliers={() => {
            setFormMode(null)
            onGoToSuppliers?.()
          }}
        />
      )}
    </>
  )
}
