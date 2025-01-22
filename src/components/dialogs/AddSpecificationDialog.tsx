import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface Specification {
  id: string
  name: string
  items: {
    id: string
    name: string
  }[]
}

interface AddSpecificationDialogProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (data: {
    specification_id: string
    item_id: string
    value: string
  }) => void
}

export function AddSpecificationDialog({ isOpen, onClose, onAdd }: AddSpecificationDialogProps) {
  const [specifications, setSpecifications] = useState<Specification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSpec, setSelectedSpec] = useState<string>('')
  const [selectedItem, setSelectedItem] = useState<string>('')
  const [value, setValue] = useState('')

  useEffect(() => {
    const fetchSpecifications = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from('specifications')
          .select(`
            id,
            name,
            items:specification_items (
              id,
              name
            )
          `)
          .order('name')

        if (error) throw error

        setSpecifications(data || [])
      } catch (err) {
        console.error('Error fetching specifications:', err)
        setError('Failed to load specifications')
      } finally {
        setLoading(false)
      }
    }

    if (isOpen) {
      fetchSpecifications()
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd({
      specification_id: selectedSpec,
      item_id: selectedItem,
      value
    })
    onClose()
  }

  const selectedSpecification = specifications.find(s => s.id === selectedSpec)

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-medium">Add Specification</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-4 text-center">Loading specifications...</div>
        ) : error ? (
          <div className="p-4 text-center text-red-600">{error}</div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label htmlFor="specification" className="block text-sm font-medium text-gray-700">
                Specification
              </label>
              <select
                id="specification"
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={selectedSpec}
                onChange={(e) => {
                  setSelectedSpec(e.target.value)
                  setSelectedItem('')
                }}
              >
                <option value="">Select a specification</option>
                {specifications.map(spec => (
                  <option key={spec.id} value={spec.id}>
                    {spec.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedSpecification && (
              <div>
                <label htmlFor="item" className="block text-sm font-medium text-gray-700">
                  Item
                </label>
                <select
                  id="item"
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                >
                  <option value="">Select an item</option>
                  {selectedSpecification.items.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="value" className="block text-sm font-medium text-gray-700">
                Value
              </label>
              <input
                type="text"
                id="value"
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={value}
                onChange={(e) => setValue(e.target.value)}
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
                Add Specification
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}