import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface Supplier {
  id: string
  name: string
}

interface AddSupplierDialogProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (data: {
    supplier_id: string
    supplier_sku: string
  }) => void
}

export function AddSupplierDialog({ isOpen, onClose, onAdd }: AddSupplierDialogProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    supplier_id: '',
    supplier_sku: ''
  })

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from('suppliers')
          .select('id, name')
          .order('name')

        if (error) throw error

        setSuppliers(data || [])
      } catch (err) {
        console.error('Error fetching suppliers:', err)
        setError('Failed to load suppliers')
      } finally {
        setLoading(false)
      }
    }

    if (isOpen) {
      fetchSuppliers()
    }
  }, [isOpen])

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
          <h2 className="text-lg font-medium">Add Supplier</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-4 text-center">Loading suppliers...</div>
        ) : error ? (
          <div className="p-4 text-center text-red-600">{error}</div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label htmlFor="supplier" className="block text-sm font-medium text-gray-700">
                Supplier
              </label>
              <select
                id="supplier"
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.supplier_id}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier_id: e.target.value }))}
              >
                <option value="">Select a supplier</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="supplier_sku" className="block text-sm font-medium text-gray-700">
                Supplier SKU
              </label>
              <input
                type="text"
                id="supplier_sku"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.supplier_sku}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier_sku: e.target.value }))}
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
                Add Supplier
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}