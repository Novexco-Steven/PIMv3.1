import { Plus, Building2, Edit, Trash2 } from 'lucide-react'
import { Manufacturer } from '../../types/product'

interface ProductManufacturersProps {
  manufacturers: Manufacturer[]
  onAddManufacturer: () => void
  onEditManufacturer: (id: string) => void
  onRemoveManufacturer: (id: string) => void
}

export function ProductManufacturers({
  manufacturers,
  onAddManufacturer,
  onEditManufacturer,
  onRemoveManufacturer
}: ProductManufacturersProps) {
  return (
    <div className="pt-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">Manufacturers</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add and manage product manufacturers.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddManufacturer}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Manufacturer
        </button>
      </div>

      <div className="space-y-4">
        {manufacturers.map(manufacturer => (
          <div key={manufacturer.id} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Building2 className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <h4 className="text-base font-medium text-gray-900">
                    {manufacturer.name}
                    {manufacturer.is_default && (
                      <span className="ml-2 text-xs text-indigo-600">(Default)</span>
                    )}
                  </h4>
                  {manufacturer.manufacturer_sku && (
                    <p className="text-sm text-gray-500">SKU: {manufacturer.manufacturer_sku}</p>
                  )}
                  {manufacturer.etilize_id && (
                    <p className="text-sm text-gray-500">Etilize ID: {manufacturer.etilize_id}</p>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => onEditManufacturer(manufacturer.id)}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveManufacturer(manufacturer.id)}
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