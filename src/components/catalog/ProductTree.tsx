import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Package, Search } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface Category {
  id: string
  name: string
  parent_id: string | null
  children?: Category[]
  products?: Product[]
}

interface Product {
  id: string
  name: string
  sku: string
  image_url?: string
}

export function ProductTree() {
  const [categories, setCategories] = useState<Category[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .order('name')

        if (categoriesError) throw categoriesError

        // Fetch products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select(`
            id,
            name,
            sku,
            category_id,
            assets (
              url,
              is_default
            )
          `)
          .order('name')

        if (productsError) throw productsError

        // Build category tree
        const categoryMap = new Map<string, Category>()
        categoriesData.forEach(category => {
          categoryMap.set(category.id, {
            ...category,
            children: [],
            products: []
          })
        })

        // Add products to categories
        productsData.forEach(product => {
          const category = categoryMap.get(product.category_id)
          if (category) {
            if (!category.products) {
              category.products = []
            }
            category.products.push({
              id: product.id,
              name: product.name,
              sku: product.sku,
              image_url: product.assets?.find(a => a.is_default)?.url
            })
          }
        })

        // Build tree structure
        const rootCategories: Category[] = []
        categoryMap.forEach(category => {
          if (category.parent_id) {
            const parent = categoryMap.get(category.parent_id)
            if (parent) {
              parent.children?.push(category)
            }
          } else {
            rootCategories.push(category)
          }
        })

        setCategories(rootCategories)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  const renderCategory = (category: Category) => {
    const isExpanded = expandedCategories.has(category.id)

    return (
      <div key={category.id} className="space-y-1">
        <button
          type="button"
          onClick={() => toggleCategory(category.id)}
          className="flex items-center w-full px-2 py-1 text-left text-sm hover:bg-gray-100 rounded-md"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-400 mr-1" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400 mr-1" />
          )}
          <span className="text-gray-900">{category.name}</span>
        </button>

        {isExpanded && (
          <div className="ml-4 space-y-1">
            {category.children?.map(child => renderCategory(child))}
            {category.products?.map(product => (
              <div
                key={product.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(
                    'application/json',
                    JSON.stringify({
                      type: 'product',
                      id: product.id,
                      name: product.name
                    })
                  )
                }}
                className="flex items-center px-2 py-1 text-sm hover:bg-gray-100 rounded-md cursor-move"
              >
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-6 w-6 object-cover rounded mr-2"
                  />
                ) : (
                  <Package className="h-5 w-5 text-gray-400 mr-2" />
                )}
                <div>
                  <div className="text-gray-900">{product.name}</div>
                  <div className="text-xs text-gray-500">{product.sku}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search products..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="p-4 max-h-[calc(100vh-16rem)] overflow-y-auto">
        {categories.map(category => renderCategory(category))}
      </div>
    </div>
  )
}