import React from 'react'
import { Link } from 'react-router-dom'
import { Plus, Package } from 'lucide-react'

interface RelatedProduct {
  id: string
  name: string
  image_url: string | null
  type: 'similar' | 'variant' | 'suggested'
  order: number
}

interface RelatedProductsProps {
  products: RelatedProduct[]
  onAddRelation: () => void
}

export function RelatedProducts({ products, onAddRelation }: RelatedProductsProps) {
  // Group products by type
  const groupedProducts = products.reduce((acc, product) => {
    if (!acc[product.type]) {
      acc[product.type] = []
    }
    acc[product.type].push(product)
    return acc
  }, {} as Record<string, RelatedProduct[]>)

  const typeLabels = {
    similar: 'Similar Products',
    variant: 'Product Variants',
    suggested: 'Suggested Products'
  }

  return (
    <div className="pt-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">Related Products</h3>
          <p className="mt-1 text-sm text-gray-500">
            Manage product relationships and variants.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddRelation}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Related Product
        </button>
      </div>

      {Object.entries(groupedProducts).map(([type, products]) => (
        <div key={type} className="space-y-4">
          <h4 className="text-base font-medium text-gray-900">{typeLabels[type as keyof typeof typeLabels]}</h4>
          <div className="relative">
            <div className="flex overflow-x-auto pb-4 -mx-4 px-4 space-x-4 scrollbar-hide">
              {products.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  className="flex-none w-32"
                >
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-900 truncate">{product.name}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}