import { Plus, Trash2 } from 'lucide-react'

interface Description {
  id: string
  type: 'Raw' | 'Main' | 'Sub' | 'Rich' | 'About'
  description: string
}

interface ProductDescriptionsProps {
  descriptions: Description[]
  onAddDescription: () => void
  onRemoveDescription: (id: string) => void
}

export function ProductDescriptions({ 
  descriptions,
  onAddDescription,
  onRemoveDescription
}: ProductDescriptionsProps) {
  const typeOrder = ['Main', 'Sub', 'Rich', 'Raw', 'About']
  const sortedDescriptions = [...descriptions].sort(
    (a, b) => typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type)
  )

  return (
    <div className="pt-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">Descriptions</h3>
          <p className="mt-1 text-sm text-gray-500">
            Manage product descriptions by type
          </p>
        </div>
        <button
          type="button"
          onClick={onAddDescription}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Description
        </button>
      </div>

      <div className="space-y-4">
        {sortedDescriptions.map((desc) => (
          <div 
            key={desc.id}
            className="bg-white border border-gray-200 rounded-lg p-4"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-grow">
                <div className="flex items-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {desc.type}
                  </span>
                </div>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {desc.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRemoveDescription(desc.id)}
                className="ml-4 text-red-600 hover:text-red-900"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {descriptions.length === 0 && (
          <div className="text-center text-sm text-gray-500 py-4">
            No descriptions added yet
          </div>
        )}
      </div>
    </div>
  )
}