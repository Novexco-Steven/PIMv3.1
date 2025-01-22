import React, { useState } from 'react'
import { X } from 'lucide-react'

interface AddFeatureBenefitDialogProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (data: {
    type: 'Feature' | 'Benefit'
    value: string
    order: number
  }) => void
}

export function AddFeatureBenefitDialog({ isOpen, onClose, onAdd }: AddFeatureBenefitDialogProps) {
  const [formData, setFormData] = useState({
    type: 'Feature' as 'Feature' | 'Benefit',
    value: '',
    order: 0
  })

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
          <h2 className="text-lg font-medium">Add Feature/Benefit</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              Type
            </label>
            <select
              id="type"
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                type: e.target.value as 'Feature' | 'Benefit'
              }))}
            >
              <option value="Feature">Feature</option>
              <option value="Benefit">Benefit</option>
            </select>
          </div>

          <div>
            <label htmlFor="value" className="block text-sm font-medium text-gray-700">
              Value
            </label>
            <input
              type="text"
              id="value"
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={formData.value}
              onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
            />
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
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}