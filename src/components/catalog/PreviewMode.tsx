import React, { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface Product {
  id: string
  name: string
  sku: string
  description: string
  price: number
  image_url?: string
}

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
  product?: Product
}

interface Page {
  id: string
  pageNumber: number
  columnCount: number
  rowCount: number
  cells: Cell[]
}

interface PreviewModeProps {
  pages: Page[]
  currentPage: number
  onClose: () => void
}

export function PreviewMode({ pages, currentPage, onClose }: PreviewModeProps) {
  const [loadedPages, setLoadedPages] = useState<Page[]>(pages)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previewPage, setPreviewPage] = useState(currentPage)
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set())

  useEffect(() => {
    const loadProductData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const productIds = pages.flatMap(page => 
          page.cells
            .filter(cell => cell.contentType === 'Product' && cell.productId)
            .map(cell => cell.productId)
        )

        if (productIds.length === 0) {
          setLoadedPages(pages)
          return
        }

        const { data: products, error } = await supabase
          .from('products')
          .select(`
            id,
            name,
            sku,
            description,
            price,
            assets (
              url,
              is_default
            )
          `)
          .in('id', productIds)

        if (error) throw error

        const productMap = new Map(products.map(product => [
          product.id,
          {
            ...product,
            image_url: product.assets?.find(a => a.is_default)?.url
          }
        ]))

        const updatedPages = pages.map(page => ({
          ...page,
          cells: page.cells.map(cell => ({
            ...cell,
            product: cell.productId ? productMap.get(cell.productId) : undefined
          }))
        }))

        setLoadedPages(updatedPages)
      } catch (error) {
        console.error('Error loading product data:', error)
        setError('Failed to load product data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadProductData()
  }, [pages])

  const handleImageLoad = (productId: string) => {
    setLoadingImages(prev => {
      const next = new Set(prev)
      next.delete(productId)
      return next
    })
  }

  const handleImageError = (productId: string) => {
    setLoadingImages(prev => {
      const next = new Set(prev)
      next.delete(productId)
      return next
    })
  }

  const currentPageData = loadedPages.find(p => p.pageNumber === previewPage)

  if (!currentPageData) {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <p className="text-red-600">Page not found</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-medium">Preview - Page {previewPage}</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPreviewPage(prev => Math.max(1, prev - 1))}
                disabled={previewPage === 1}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm text-gray-600">
                {previewPage} / {pages.length}
              </span>
              <button
                onClick={() => setPreviewPage(prev => Math.min(pages.length, prev + 1))}
                disabled={previewPage === pages.length}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading preview...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Retry
              </button>
            </div>
          ) : (
            <div 
              className="grid gap-4 bg-white border-2 border-gray-200 p-8 rounded-lg"
              style={{
                gridTemplateColumns: `repeat(${currentPageData.columnCount}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${currentPageData.rowCount}, minmax(100px, auto))`
              }}
            >
              {currentPageData.cells.map((cell) => (
                <div
                  key={cell.id}
                  className="bg-gray-50 rounded-lg overflow-hidden"
                  style={{
                    gridRow: `${cell.rowIndex + 1} / span ${cell.rowSpan}`,
                    gridColumn: `${cell.columnIndex + 1} / span ${cell.columnSpan}`,
                    height: cell.height,
                    width: cell.width
                  }}
                >
                  {cell.contentType === 'Product' && cell.product ? (
                    <div className="h-full w-full p-4">
                      {cell.product.image_url && (
                        <div className="aspect-square mb-4 relative">
                          {loadingImages.has(cell.product.id) && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            </div>
                          )}
                          <img
                            src={cell.product.image_url}
                            alt={cell.product.name}
                            className="w-full h-full object-cover rounded-lg"
                            onLoad={() => handleImageLoad(cell.product.id)}
                            onError={() => handleImageError(cell.product.id)}
                          />
                        </div>
                      )}
                      <h3 className="text-sm font-medium text-gray-900">
                        {cell.product.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        SKU: {cell.product.sku}
                      </p>
                      {cell.product.price && (
                        <p className="mt-1 text-sm font-medium text-gray-900">
                          ${cell.product.price.toFixed(2)}
                        </p>
                      )}
                      <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                        {cell.product.description}
                      </p>
                    </div>
                  ) : (
                    <div className="h-full w-full p-4">
                      <div 
                        className="prose prose-sm"
                        dangerouslySetInnerHTML={{ 
                          __html: cell.customContent || 'Custom Content'
                        }} 
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}