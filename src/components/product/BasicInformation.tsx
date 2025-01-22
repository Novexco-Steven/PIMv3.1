import { Product } from '../../types/product'

interface BasicInformationProps {
  product: Product | null
  onChange: (product: Product | null) => void
}

export function BasicInformation({ product, onChange }: BasicInformationProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium leading-6 text-gray-900">Basic Information</h3>
      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
        <div className="sm:col-span-3">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="name"
              id="name"
              value={product?.name || ''}
              onChange={(e) => onChange(product ? { ...product, name: e.target.value } : null)}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div className="sm:col-span-3">
          <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
            SKU
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="sku"
              id="sku"
              value={product?.sku || ''}
              onChange={(e) => onChange(product ? { ...product, sku: e.target.value } : null)}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div className="sm:col-span-6">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <div className="mt-1">
            <textarea
              id="description"
              name="description"
              rows={3}
              value={product?.description || ''}
              onChange={(e) => onChange(product ? { ...product, description: e.target.value } : null)}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md"
            />
          </div>
        </div>
      </div>
    </div>
  )
}