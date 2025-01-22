import { Filter } from 'lucide-react'

interface FilterOption {
  id: string
  label: string
  value: string | number | boolean
  type: 'text' | 'number' | 'boolean' | 'select'
  options?: { label: string; value: string }[]
}

interface SearchFiltersProps {
  filters: Record<string, string | number | boolean>
  filterOptions: FilterOption[]
  onFilterChange: (filters: Record<string, string | number | boolean>) => void
  onClearFilters: () => void
}

export function SearchFilters({
  filters,
  filterOptions,
  onFilterChange,
  onClearFilters
}: SearchFiltersProps) {
  const handleFilterChange = (id: string, value: string | number | boolean) => {
    onFilterChange({
      ...filters,
      [id]: value
    })
  }

  const activeFiltersCount = Object.keys(filters).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
          {activeFiltersCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              {activeFiltersCount}
            </span>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={onClearFilters}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filterOptions.map((option) => (
          <div key={option.id}>
            <label htmlFor={option.id} className="block text-sm font-medium text-gray-700">
              {option.label}
            </label>
            <div className="mt-1">
              {option.type === 'select' ? (
                <select
                  id={option.id}
                  value={String(filters[option.id]) || ''}
                  onChange={(e) => handleFilterChange(option.id, e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">All</option>
                  {option.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : option.type === 'boolean' ? (
                <select
                  id={option.id}
                  value={filters[option.id]?.toString() || ''}
                  onChange={(e) => handleFilterChange(option.id, e.target.value === 'true')}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">All</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              ) : option.type === 'number' ? (
                <input
                  type="number"
                  id={option.id}
                  value={String(filters[option.id]) || ''}
                  onChange={(e) => handleFilterChange(option.id, e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              ) : (
                <input
                  type="text"
                  id={option.id}
                  value={String(filters[option.id]) || ''}
                  onChange={(e) => handleFilterChange(option.id, e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}