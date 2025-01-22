import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface Manufacturer {
  id: string
  name: string
}

interface AddManufacturerDialogProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (data: {
    manufacturer_id: string
    manufacturer_sku: string
    etilize_id: string
  }) => void
}

export function AddManufacturerDialog({ isOpen, onClose, onAdd }: AddManufacturerDialogProps) {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    manufacturer_id: '',
    manufacturer_sku: '',
    etilize_id: ''
  })

  useEffect(() => {
    const fetchManufacturers = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from('manufacturers')
          .select('id, name')
          .order('name')

        if (error) throw error

        setManufacturers(data || [])
      } catch (err) {
        console.error('Error fetching manufacturers:', err)
        setError('Failed to load manufacturers')
      } finally {
        setLoading(false)
      }
    }

    if (isOpen) {
      fetchManufacturers()
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
          <h2 className="text-lg font-medium">Add Manufacturer</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-4 text-center">Loading manufacturers...</div>
        ) : error ? (
          <div className="p-4 text-center text-red-600">{error}</div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700">
                Manufacturer
              </label>
              <select
                id="manufacturer"
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.manufacturer_id}
                onChange={(e) => setFormData(prev => ({ ...prev, manufacturer_id: e.target.value }))}
              >
                <option value="">Select a manufacturer</option>
                {manufacturers.map(manufacturer => (
                  <option key={manufacturer.id} value={manufacturer.id}>
                    {manufacturer.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="manufacturer_sku" className="block text-sm font-medium text-gray-700">
                Manufacturer SKU
              </label>
              <input
                type="text"
                id="manufacturer_sku"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.manufacturer_sku}
                onChange={(e) => setFormData(prev => ({ ...prev, manufacturer_sku: e.target.value }))}
              />
            </div>

            <div>
              <label htmlFor="etilize_id" className="block text-sm font-medium text-gray-700">
                Etilize ID
              </label>
              <input
                type="text"
                id="etilize_id"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.etilize_id}
                onChange={(e) => setFormData(prev => ({ ...prev, etilize_id: e.target.value }))}
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
                Add Manufacturer
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}