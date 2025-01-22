import { useState } from 'react'
import { Plus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'

interface FeatureBenefit {
  id: string
  type: 'Feature' | 'Benefit'
  value: string
  order: number
}

interface ProductFeaturesBenefitsProps {
  featuresBenefits: FeatureBenefit[]
  onAddFeatureBenefit: () => void
  onRemoveFeatureBenefit: (id: string) => void
}

export function ProductFeaturesBenefits({ 
  featuresBenefits,
  onAddFeatureBenefit,
  onRemoveFeatureBenefit
}: ProductFeaturesBenefitsProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    Features: true,
    Benefits: true
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const groupedItems = featuresBenefits.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = []
    }
    acc[item.type].push(item)
    return acc
  }, {} as Record<string, FeatureBenefit[]>)

  // Sort items by order within each group
  Object.keys(groupedItems).forEach(type => {
    groupedItems[type].sort((a, b) => a.order - b.order)
  })

  return (
    <div className="pt-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">Features & Benefits</h3>
          <p className="mt-1 text-sm text-gray-500">
            Manage product features and benefits
          </p>
        </div>
        <button
          type="button"
          onClick={onAddFeatureBenefit}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Feature/Benefit
        </button>
      </div>

      <div className="space-y-4">
        {['Feature', 'Benefit'].map(type => (
          <div key={type} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <button
              type="button"
              className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100"
              onClick={() => toggleSection(type)}
            >
              <span className="text-sm font-medium text-gray-900">{type}s</span>
              {expandedSections[type] ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>

            {expandedSections[type] && groupedItems[type]?.length > 0 && (
              <div className="p-4 space-y-2">
                {groupedItems[type].map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md"
                  >
                    <span className="text-sm text-gray-900">{item.value}</span>
                    <button
                      type="button"
                      onClick={() => onRemoveFeatureBenefit(item.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {expandedSections[type] && (!groupedItems[type] || groupedItems[type].length === 0) && (
              <div className="p-4 text-center text-sm text-gray-500">
                No {type.toLowerCase()}s added yet
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}