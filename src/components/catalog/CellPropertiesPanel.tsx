import React, { useState, useEffect } from 'react'
import { Trash2, Edit } from 'lucide-react'
import { EditCustomContentDialog } from '../dialogs/EditCustomContentDialog'

interface Cell {
  id: string
  rowIndex: number
  columnIndex: number
  rowSpan: number
  columnSpan: number
  height?: number
  width?: number
  contentType: 'Product' | 'Custom'
  productId?: string
  customContent?: string
}

interface CellPropertiesPanelProps {
  cell: Cell | null
  onUpdate: (cell: Cell) => void
  onDelete: () => void
}

export function CellPropertiesPanel({ cell, onUpdate, onDelete }: CellPropertiesPanelProps) {
  const [formData, setFormData] = useState<Cell | null>(null)
  const [showEditor, setShowEditor] = useState(false)

  useEffect(() => {
    setFormData(cell)
  }, [cell])

  if (!cell || !formData) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-500 text-center">
          Select a cell to edit its properties
        </p>
      </div>
    )
  }

  const handleChange = (field: keyof Cell, value: any) => {
    const updatedCell = { ...formData, [field]: value }
    setFormData(updatedCell)
    onUpdate(updatedCell)
  }

  const handleSaveContent = (content: string) => {
    const updatedCell = { ...formData, customContent: content }
    setFormData(updatedCell)
    onUpdate(updatedCell)
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Cell Properties</h3>
            <button
              type="button"
              onClick={onDelete}
              className="text-red-600 hover:text-red-900"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Position
            </label>
            <div className="mt-1 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500">Row</label>
                <input
                  type="number"
                  value={formData.rowIndex + 1}
                  disabled
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Column</label>
                <input
                  type="number"
                  value={formData.columnIndex + 1}
                  disabled
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm bg-gray-50"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Span
            </label>
            <div className="mt-1 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500">Rows</label>
                <input
                  type="number"
                  min="1"
                  value={formData.rowSpan}
                  onChange={(e) => handleChange('rowSpan', parseInt(e.target.value))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Columns</label>
                <input
                  type="number"
                  min="1"
                  value={formData.columnSpan}
                  onChange={(e) => handleChange('columnSpan', parseInt(e.target.value))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Size
            </label>
            <div className="mt-1 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500">Height (px)</label>
                <input
                  type="number"
                  value={formData.height || ''}
                  onChange={(e) => handleChange('height', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Width (px)</label>
                <input
                  type="number"
                  value={formData.width || ''}
                  onChange={(e) => handleChange('width', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Content
            </label>
            <div className="mt-1">
              <select
                value={formData.contentType}
                onChange={(e) => handleChange('contentType', e.target.value as 'Product' | 'Custom')}
                className="block w-full border-gray-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Product">Product</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
          </div>

          {formData.contentType === 'Custom' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Custom Content
                </label>
                <button
                  type="button"
                  onClick={() => setShowEditor(true)}
                  className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </button>
              </div>
              <div 
                className="mt-1 p-3 border border-gray-200 rounded-md bg-gray-50 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: formData.customContent || '' }}
              />
            </div>
          )}
        </div>
      </div>

      <EditCustomContentDialog
        isOpen={showEditor}
        onClose={() => setShowEditor(false)}
        onSave={handleSaveContent}
        initialContent={formData.customContent}
      />
    </>
  )
}