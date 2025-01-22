import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Plus, 
  Search, 
  DollarSign,
  MoreVertical,
  ArrowUpDown,
  Edit,
  Trash2,
  Tag,
  Calendar,
  Package
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { SearchFilters } from '../components/search/SearchFilters'
import { SavedFilters } from '../components/search/SavedFilters'
import { SearchHistory } from '../components/search/SearchHistory'
import { useSearchHistory } from '../hooks/useSearchHistory'
import { useSavedFilters } from '../hooks/useSavedFilters'
import { useOptimisticList } from '../hooks/useOptimisticList'
import { useDataCache } from '../hooks/useDataCache'

interface PricingItem {
  id: string
  product: {
    name: string
    sku: string
  }
  category: {
    name: string
  }
  bestPrice: number
  activePromotions: number
  activePolicies: number
  updatedAt: string
}

function Pricing() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory()
  const { savedFilters, saveFilter, deleteFilter } = useSavedFilters()

  const {
    items: pricingItems,
    error,
    setItems: setPricingItems
  } = useOptimisticList<PricingItem>([])

  const { data: cachedPricingItems } = useDataCache<PricingItem[]>(
    'pricing_items',
    async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          sku,
          best_price,
          category:categories(name),
          promotions:promotion_inclusions(count),
          policies:policy_inclusions(count),
          updated_at
        `)
        .order('name')

      if (error) throw error

      return data.map(item => ({
        id: item.id,
        product: {
          name: item.name,
          sku: item.sku
        },
        category: item.category,
        bestPrice: item.best_price || 0,
        activePromotions: item.promotions?.[0]?.count || 0,
        activePolicies: item.policies?.[0]?.count || 0,
        updatedAt: new Date(item.updated_at).toLocaleDateString()
      }))
    },
    [searchTerm, filters]
  )

  useEffect(() => {
    if (cachedPricingItems) {
      setPricingItems(cachedPricingItems)
      setLoading(false)
    }
  }, [cachedPricingItems, setPricingItems])

  const filterOptions = [
    {
      id: 'hasPromotions',
      label: 'Has Promotions',
      type: 'boolean' as const
    },
    {
      id: 'hasPolicies',
      label: 'Has Policies',
      type: 'boolean' as const
    },
    {
      id: 'priceRange',
      label: 'Price Range',
      type: 'range' as const,
      min: 0,
      max: 1000
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Product Pricing</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => navigate('/pricing/policies')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Tag className="h-4 w-4 mr-2" />
            Policies
          </button>
          <button
            onClick={() => navigate('/pricing/promotions')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Promotions
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-6 space-y-6">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search products..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filters */}
        <SearchFilters
          filters={filters}
          filterOptions={filterOptions}
          onFilterChange={setFilters}
          onClearFilters={() => setFilters({})}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Saved Filters */}
          <SavedFilters
            savedFilters={savedFilters}
            onApplyFilter={(filters) => setFilters(filters)}
            onSaveFilter={saveFilter}
            onDeleteFilter={deleteFilter}
            currentFilters={filters}
          />

          {/* Search History */}
          <SearchHistory
            history={history}
            onApplySearch={(query, filters) => {
              setSearchTerm(query)
              setFilters(filters)
            }}
            onClearHistory={clearHistory}
            onRemoveHistoryItem={removeFromHistory}
          />
        </div>
      </div>

      {/* Pricing Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1 cursor-pointer">
                    <span>Product</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Best Price
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Active Promotions
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Active Policies
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pricingItems.map((item) => (
                <tr 
                  key={item.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/pricing/${item.id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <Package className="h-5 w-5 text-indigo-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{item.product.name}</div>
                        <div className="text-sm text-gray-500">SKU: {item.product.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.category?.name || 'Uncategorized'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                      {item.bestPrice.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {item.activePromotions} active
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {item.activePolicies} active
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.updatedAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        className="text-indigo-600 hover:text-indigo-900"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/pricing/${item.id}`)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        className="text-gray-400 hover:text-gray-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Handle more options
                        }}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Pricing