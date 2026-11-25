import Suppliers from '../Suppliers.jsx'
export default function AdminSupplier({
  suppliers,
  supplierState,
  supplierError,
  onReload,
  onSave,
  onDelete,
}) {
  return (
    <Suppliers
      title="Data Supplier"
      description="Lihat dan kelola informasi supplier yang terdaftar."
      suppliers={suppliers}
      supplierState={supplierState}
      supplierError={supplierError}
      onReload={onReload}
      onSave={onSave}
      onDelete={onDelete}
    />
  )
}
