import React from 'react'
import { Plus, Trash2, Edit } from 'lucide-react'

interface SEO {
  id: string
  title: string
  description: string
  keywords: string
}

interface ProductSEOProps {
  seo: SEO | null
  onAddSEO: () => void
  onEditSEO: () => void
  onRemoveSEO: (id: string) => void
}

export function ProductSEO({ 
  seo,
  onAddSEO,
  onEditSEO,
  onRemoveSEO
}: ProductSEOProps) {
  return (
    <div className="pt-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">SEO</h3>
          <p className="mt-1 text-sm text-gray-500">
            Manage search engine optimization settings
          </p>
        </div>
        {!seo && (
          <button
            type="button"
            onClick={onAddSEO}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add SEO
          </button>
        )}
      </div>

      {seo ? (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-4 flex-grow">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Title</h4>
                <p className="mt-1 text-sm text-gray-900">{seo.title}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Description</h4>
                <p className="mt-1 text-sm text-gray-900">{seo.description}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Keywords</h4>
                <div className="mt-1 flex flex-wrap gap-2">
                  {seo.keywords.split(',').map((keyword, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {keyword.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex space-x-2 ml-4">
              <button
                type="button"
                onClick={onEditSEO}
                className="text-indigo-600 hover:text-indigo-900"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onRemoveSEO(seo.id)}
                className="text-red-600 hover:text-red-900"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-sm text-gray-500 py-4">
          No SEO settings added yet
        </div>
      )}
    </div>
  )
}