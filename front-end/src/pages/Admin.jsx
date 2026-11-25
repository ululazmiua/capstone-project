import AdminKaryawan from './admin/Karyawan.jsx'
import AdminRingkasan from './admin/Ringkasan.jsx'
import AdminBarangMasuk from './admin/BarangMasuk.jsx'
import AdminSupplier from './admin/Supplier.jsx'


const pageTitles = {
  receipts: [
    'Riwayat Barang Masuk',
    'Periksa penerimaan barang berdasarkan periode.',
  ],
  karyawan: [
    'Kelola Karyawan',
    'Atur akun dan role akses admin atau karyawan.',
  ],
}


export default function Admin({
  tab = 'overview',
  data = [],
  suppliers = [],
  supplierState = 'loading',
  supplierError = '',
  onSaveSupplier,
  onDeleteSupplier,
  onReloadSuppliers,
  registrationRequests = [],
  registrationError = '',
  onReviewRegistration,
  onDeleteRegistration,
}) {
  const title = pageTitles[tab]

  return (
    <>
      {title && (
        <div className="mb-[22px]">
          <h2 className="text-[22px] font-bold leading-tight tracking-[-0.04em] sm:text-[28px]">
            {title[0]}
          </h2>
          <p className="mt-[7px] text-sm text-[#788984]">{title[1]}</p>
        </div>
      )}

      {tab === 'overview' && <AdminRingkasan data={data} />}

      {tab === 'receipts' && <AdminBarangMasuk data={data} />}

      {tab === 'suppliers' && (
        <AdminSupplier
          suppliers={suppliers}
          supplierState={supplierState}
          supplierError={supplierError}
          onReload={onReloadSuppliers}
          onSave={onSaveSupplier}
          onDelete={onDeleteSupplier}
        />
      )}

      {tab === 'karyawan' && (
        <AdminKaryawan
          registrationRequests={registrationRequests}
          registrationError={registrationError}
          onReviewRegistration={onReviewRegistration}
          onDeleteRegistration={onDeleteRegistration}
        />
      )}
    </>
  )
}
