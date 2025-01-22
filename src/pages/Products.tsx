import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Plus, 
  Search, 
  Package,
  MoreVertical,
  ArrowUpDown,
  Edit,
  Trash2,
  Tags
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { SearchFilters } from '../components/search/SearchFilters'
import { SavedFilters } from '../components/search/SavedFilters'
import { SearchHistory } from '../components/search/SearchHistory'
import { useSearchHistory } from '../hooks/useSearchHistory'
import { useSavedFilters } from '../hooks/useSavedFilters'
import { useOptimisticList } from '../hooks/useOptimisticList'
import { useDataCache } from '../hooks/useDataCache'

interface Product {
  id: string
  name: string
  sku: string
  description: string
  category: {
    name: string
  }
  status: string
  updatedAt: string
}

function Products() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory()
  const { savedFilters, saveFilter, deleteFilter } = useSavedFilters()

  const {
    items: products,
    error,
    removeOptimistically,
    setItems: setProducts
  } = useOptimisticList<Product>([])

  const { data: cachedProducts, updateCache } = useDataCache<Product[]>(
    'products',
    async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          sku,
          name,
          description,
          status,
          updated_at,
          category:categories(name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data.map(product => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        description: product.description || '',
        category: product.category,
        status: product.status,
        updatedAt: new Date(product.updated_at).toLocaleDateString()
      }))
    },
    [searchTerm, filters]
  )

  useEffect(() => {
    if (cachedProducts) {
      setProducts(cachedProducts)
      setLoading(false)
    }
  }, [cachedProducts, setProducts])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      await removeOptimistically(id, async () => {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id)

        if (error) throw error
        updateCache(products.filter(p => p.id !== id))
      })
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  const filterOptions = [
    {
      id: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Draft', value: 'draft' },
        { label: 'Archived', value: 'archived' }
      ]
    },
    {
      id: 'hasCategory',
      label: 'Has Category',
      type: 'boolean' as const
    },
    {
      id: 'updatedAfter',
      label: 'Updated After',
      type: 'date' as const
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
        <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
        <button
          onClick={() => navigate('/products/new')}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
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

      {/* Products Table */}
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
                  Status
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
              {products.map((product) => (
                <tr 
                  key={product.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/products/${product.id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Package className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.category ? (
                      <div className="flex items-center text-sm text-gray-500">
                        <Tags className="h-4 w-4 mr-1 text-gray-400" />
                        {product.category.name}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">No category</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.status === 'active' ? 'bg-green-100 text-green-800' :
                      product.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.updatedAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        className="text-indigo-600 hover:text-indigo-900"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/products/${product.id}`)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-900"
                        onClick={(e) => handleDelete(product.id, e)}
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

export default Products