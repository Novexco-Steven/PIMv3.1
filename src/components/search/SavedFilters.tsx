import React, { useState } from 'react'
import { Bookmark, Plus, Trash2 } from 'lucide-react'

interface SavedFilter {
  id: string
  name: string
  filters: Record<string, any>
}

interface SavedFiltersProps {
  savedFilters: SavedFilter[]
  onApplyFilter: (filters: Record<string, any>) => void
  onSaveFilter: (name: string, filters: Record<string, any>) => void
  onDeleteFilter: (id: string) => void
  currentFilters: Record<string, any>
}

export function SavedFilters({
  savedFilters,
  onApplyFilter,
  onSaveFilter,
  onDeleteFilter,
  currentFilters
}: SavedFiltersProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [filterName, setFilterName] = useState('')

  const handleSave = () => {
    if (!filterName.trim()) return
    onSaveFilter(filterName, currentFilters)
    setFilterName('')
    setShowSaveDialog(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bookmark className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Saved Filters</span>
        </div>
        <button
          type="button"
          onClick={() => setShowSaveDialog(true)}
          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
        >
          <Plus className="h-4 w-4 mr-1" />
          Save Current
        </button>
      </div>

      <div className="space-y-2">
        {savedFilters.map((filter) => (
          <div
            key={filter.id}
            className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md"
          >
            <button
              type="button"
              onClick={() => onApplyFilter(filter.filters)}
              className="text-sm text-gray-900 hover:text-indigo-600"
            >
              {filter.name}
            </button>
            <button
              type="button"
              onClick={() => onDeleteFilter(filter.id)}
              className="text-gray-400 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}

        {savedFilters.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-2">
            No saved filters yet
          </p>
        )}
      </div>

      {showSaveDialog && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Save Filter</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="filterName" className="block text-sm font-medium text-gray-700">
                  Filter Name
                </label>
                <input
                  type="text"
                  id="filterName"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowSaveDialog(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
                >
                  Save Filter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}