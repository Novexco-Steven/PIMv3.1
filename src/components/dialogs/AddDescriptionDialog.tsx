import React, { useState } from 'react'
import { X } from 'lucide-react'

interface AddDescriptionDialogProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (data: {
    type: 'Raw' | 'Main' | 'Sub' | 'Rich' | 'About'
    description: string
  }) => void
}

export function AddDescriptionDialog({ isOpen, onClose, onAdd }: AddDescriptionDialogProps) {
  const [formData, setFormData] = useState({
    type: 'Main' as 'Raw' | 'Main' | 'Sub' | 'Rich' | 'About',
    description: ''
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
          <h2 className="text-lg font-medium">Add Description</h2>
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
                type: e.target.value as 'Raw' | 'Main' | 'Sub' | 'Rich' | 'About'
              }))}
            >
              <option value="Main">Main</option>
              <option value="Sub">Sub</option>
              <option value="Rich">Rich</option>
              <option value="Raw">Raw</option>
              <option value="About">About</option>
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              required
              rows={5}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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