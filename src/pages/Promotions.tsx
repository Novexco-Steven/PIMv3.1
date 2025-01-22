import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Plus, 
  Search, 
  Tag,
  MoreVertical,
  ArrowUpDown,
  Edit,
  Trash2,
  Calendar,
  Package,
  Percent,
  DollarSign,
  Truck
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { SearchFilters } from '../components/search/SearchFilters'
import { SavedFilters } from '../components/search/SavedFilters'
import { SearchHistory } from '../components/search/SearchHistory'
import { useSearchHistory } from '../hooks/useSearchHistory'
import { useSavedFilters } from '../hooks/useSavedFilters'
import { useOptimisticList } from '../hooks/useOptimisticList'
import { useDataCache } from '../hooks/useDataCache'

interface Promotion {
  id: string
  name: string
  description: string
  type: string
  value: number | null
  startDate: string
  endDate: string
  status: string
  supplier: {
    name: string
  } | null
  isStackable: boolean
  productCount: number
  updatedAt: string
}

function Promotions() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory()
  const { savedFilters, saveFilter, deleteFilter } = useSavedFilters()

  const {
    items: promotions,
    error,
    removeOptimistically,
    setItems: setPromotions
  } = useOptimisticList<Promotion>([])

  const { data: cachedPromotions, updateCache } = useDataCache<Promotion[]>(
    'promotions',
    async () => {
      const { data, error } = await supabase
        .from('promotions')
        .select(`
          id,
          name,
          description,
          type,
          value,
          start_date,
          end_date,
          status,
          supplier:suppliers (name),
          is_stackable,
          updated_at,
          products:promotion_inclusions(count)
        `)
        .order('start_date', { ascending: false })

      if (error) throw error

      return data.map(promotion => ({
        id: promotion.id,
        name: promotion.name,
        description: promotion.description || '',
        type: promotion.type,
        value: promotion.value,
        startDate: new Date(promotion.start_date).toLocaleDateString(),
        endDate: new Date(promotion.end_date).toLocaleDateString(),
        status: promotion.status,
        supplier: promotion.supplier,
        isStackable: promotion.is_stackable,
        productCount: promotion.products?.[0]?.count || 0,
        updatedAt: new Date(promotion.updated_at).toLocaleDateString()
      }))
    },
    [searchTerm, filters]
  )

  useEffect(() => {
    if (cachedPromotions) {
      setPromotions(cachedPromotions)
      setLoading(false)
    }
  }, [cachedPromotions, setPromotions])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this promotion?')) return

    try {
      await removeOptimistically(id, async () => {
        const { error } = await supabase
          .from('promotions')
          .delete()
          .eq('id', id)

        if (error) throw error
        updateCache(promotions.filter(p => p.id !== id))
      })
    } catch (error) {
      console.error('Error deleting promotion:', error)
    }
  }

  const filterOptions = [
    {
      id: 'type',
      label: 'Type',
      type: 'select' as const,
      options: [
        { label: 'Manufacturer', value: 'manufacturer' },
        { label: 'Retail', value: 'retail' },
        { label: 'Liquidation', value: 'liquidation' },
        { label: 'Rebate', value: 'rebate' },
        { label: 'Shipping', value: 'shipping' },
        { label: 'Percentage', value: 'percentage' },
        { label: 'Amount', value: 'amount' },
        { label: 'BOGO', value: 'bogo' },
        { label: 'Multi-Buy', value: 'multi_buy' },
        { label: 'Free Shipping', value: 'free_shipping' },
        { label: 'Seasonal', value: 'seasonal' }
      ]
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'Scheduled', value: 'scheduled' }
      ]
    },
    {
      id: 'isStackable',
      label: 'Stackable',
      type: 'boolean' as const
    }
  ]

  const getPromotionIcon = (type: string) => {
    switch (type) {
      case 'percentage':
        return <Percent className="h-5 w-5 text-green-600" />
      case 'amount':
        return <DollarSign className="h-5 w-5 text-blue-600" />
      case 'shipping':
      case 'free_shipping':
        return <Truck className="h-5 w-5 text-purple-600" />
      default:
        return <Tag className="h-5 w-5 text-indigo-600" />
    }
  }

  const getPromotionValue = (promotion: Promotion) => {
    if (!promotion.value) return null

    switch (promotion.type) {
      case 'percentage':
        return `${promotion.value}% off`
      case 'amount':
        return `$${promotion.value} off`
      case 'bogo':
        return `Buy ${Math.floor(promotion.value)} Get 1 Free`
      case 'multi_buy':
        return `Buy ${Math.floor(promotion.value)} or more`
      default:
        return null
    }
  }

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
        <h1 className="text-2xl font-semibold text-gray-900">Promotions</h1>
        <button
          onClick={() => navigate('/pricing/promotions/new')}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Promotion
        </button>
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
            placeholder="Search promotions..."
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

      {/* Promotions Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1 cursor-pointer">
                    <span>Promotion</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Range
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Products
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
              {promotions.map((promotion) => (
                <tr 
                  key={promotion.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/pricing/promotions/${promotion.id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          {getPromotionIcon(promotion.type)}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{promotion.name}</div>
                        <div className="text-sm text-gray-500">{promotion.description}</div>
                        {promotion.supplier && (
                          <div className="text-xs text-gray-500">
                            Supplier: {promotion.supplier.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {promotion.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    {getPromotionValue(promotion) && (
                      <div className="text-sm text-gray-500">
                        {getPromotionValue(promotion)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                      <div>
                        <div>{promotion.startDate}</div>
                        <div>to {promotion.endDate}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      promotion.status === 'active' ? 'bg-green-100 text-green-800' :
                      promotion.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {promotion.status}
                    </span>
                    {promotion.isStackable && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Stackable
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Package className="h-4 w-4 mr-1 text-gray-400" />
                      {promotion.productCount} products
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {promotion.updatedAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        className="text-indigo-600 hover:text-indigo-900"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/pricing/promotions/${promotion.id}`)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-900"
                        onClick={(e) => handleDelete(promotion.id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
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

export default Promotions