import { Plus, Star, StarOff, X } from 'lucide-react'
import { Asset } from '../../types/product'

interface ProductImagesProps {
  assets: Asset[]
  onAddImage: () => void
  onSetDefault: (assetId: string) => void
  onRemove: (assetId: string) => void
}

export function ProductImages({ assets, onAddImage, onSetDefault, onRemove }: ProductImagesProps) {
  return (
    <div className="pt-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">Images</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add and manage product images.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddImage}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Image
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {assets.map(asset => (
          <div key={asset.id} className="relative group">
            <div className="aspect-w-4 aspect-h-3 rounded-lg overflow-hidden bg-gray-100">
              <img
                src={asset.url}
                alt={asset.alt_tag}
                className="object-cover w-full h-full"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity" />
            </div>
            <div className="absolute top-2 right-2 flex space-x-2">
              <button
                type="button"
                onClick={() => onSetDefault(asset.id)}
                className={`p-1 rounded-full ${
                  asset.is_default
                    ? 'bg-yellow-400 text-white'
                    : 'bg-white text-gray-400 hover:text-yellow-400'
                }`}
              >
                {asset.is_default ? (
                  <Star className="h-5 w-5" />
                ) : (
                  <StarOff className="h-5 w-5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => onRemove(asset.id)}
                className="p-1 bg-white rounded-full text-red-600 hover:text-red-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-sm font-medium text-gray-900">{asset.usage_type}</p>
              <p className="text-sm text-gray-500">{asset.alt_tag}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}