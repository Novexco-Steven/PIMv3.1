import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface Product {
  id: string
  name: string
}

interface AddRelatedProductDialogProps {
  isOpen: boolean
  onClose: () => void
  currentProductId: string
  onAdd: (data: {
    related_product_id: string
    type: 'similar' | 'variant' | 'suggested'
    order: number
  }) => void
}

export function AddRelatedProductDialog({ 
  isOpen, 
  onClose, 
  currentProductId,
  onAdd 
}: AddRelatedProductDialogProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    related_product_id: '',
    type: 'similar' as const,
    order: 0
  })

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from('products')
          .select('id, name')
          .neq('id', currentProductId)
          .order('name')

        if (error) throw error

        setProducts(data || [])
      } catch (err) {
        console.error('Error fetching products:', err)
        setError('Failed to load products')
      } finally {
        setLoading(false)
      }
    }

    if (isOpen) {
      fetchProducts()
    }
  }, [isOpen, currentProductId])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd(formData)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-medium">Add Related Product</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-4 text-center">Loading products...</div>
        ) : error ? (
          <div className="p-4 text-center text-red-600">{error}</div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label htmlFor="product" className="block text-sm font-medium text-gray-700">
                Product
              </label>
              <select
                id="product"
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.related_product_id}
                onChange={(e) => setFormData(prev => ({ ...prev, related_product_id: e.target.value }))}
              >
                <option value="">Select a product</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Relationship Type
              </label>
              <select
                id="type"
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  type: e.target.value as 'similar' | 'variant' | 'suggested'
                }))}
              >
                <option value="similar">Similar Product</option>
                <option value="variant">Product Variant</option>
                <option value="suggested">Suggested Product</option>
              </select>
            </div>

            <div>
              <label htmlFor="order" className="block text-sm font-medium text-gray-700">
                Display Order
              </label>
              <input
                type="number"
                id="order"
                min="0"
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.order}
                onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) }))}
              />
            </div>

            <div className="mt-5 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
              >
                Add Relation
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}