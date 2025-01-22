import React from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { Specification } from '../../types/product'

interface ProductSpecificationsProps {
  specifications: Specification[]
  onAddSpecification: () => void
  onEditSpecification: (id: string) => void
  onRemoveSpecification: (id: string) => void
}

export function ProductSpecifications({ 
  specifications, 
  onAddSpecification,
  onEditSpecification,
  onRemoveSpecification 
}: ProductSpecificationsProps) {
  return (
    <div className="pt-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">Specifications</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add and manage product specifications.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddSpecification}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Specification
        </button>
      </div>

      <div className="space-y-6">
        {specifications.map(spec => (
          <div key={spec.id} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-medium text-gray-900">{spec.name}</h4>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => onEditSpecification(spec.id)}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveSpecification(spec.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-sm font-medium text-gray-500">Item</div>
              <div className="text-sm font-medium text-gray-500">Value</div>
              {spec.items.map((item, index) => (
                <React.Fragment key={item.id || index}>
                  <div className="text-sm text-gray-900">{item.name}</div>
                  <div className="text-sm text-gray-900">{item.value}</div>
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}