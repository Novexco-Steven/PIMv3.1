import React from 'react'
import { Plus, Truck, Edit, Trash2 } from 'lucide-react'
import { Supplier } from '../../types/product'

interface ProductSuppliersProps {
  suppliers: Supplier[]
  onAddSupplier: () => void
  onEditSupplier: (id: string) => void
  onRemoveSupplier: (id: string) => void
}

export function ProductSuppliers({
  suppliers,
  onAddSupplier,
  onEditSupplier,
  onRemoveSupplier
}: ProductSuppliersProps) {
  return (
    <div className="pt-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">Suppliers</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add and manage product suppliers.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddSupplier}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Supplier
        </button>
      </div>

      <div className="space-y-4">
        {suppliers.map(supplier => (
          <div key={supplier.id} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Truck className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <h4 className="text-base font-medium text-gray-900">
                    {supplier.name}
                    {supplier.is_default && (
                      <span className="ml-2 text-xs text-indigo-600">(Default)</span>
                    )}
                  </h4>
                  {supplier.supplier_sku && (
                    <p className="text-sm text-gray-500">SKU: {supplier.supplier_sku}</p>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => onEditSupplier(supplier.id)}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveSupplier(supplier.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}