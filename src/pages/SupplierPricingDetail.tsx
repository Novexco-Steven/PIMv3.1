import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface SupplierPrice {
  productId: string | null
  supplierId: string | null
  supplierSku: string
  cost: number
  msrp: number
  map: number
}

interface Product {
  id: string
  name: string
  sku: string
}

interface Supplier {
  id: string
  name: string
}

export function SupplierPricingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [price, setPrice] = useState<SupplierPrice>({
    productId: null,
    supplierId: null,
    supplierSku: '',
    cost: 0,
    msrp: 0,
    map: 0
  })
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, name, sku')
          .order('name')

        if (productsError) throw productsError
        setProducts(productsData)

        // Fetch suppliers
        const { data: suppliersData, error: suppliersError } = await supabase
          .from('suppliers')
          .select('id, name')
          .order('name')

        if (suppliersError) throw suppliersError
        setSuppliers(suppliersData)

        if (id === 'new') {
          setLoading(false)
          return
        }

        // Fetch price data
        const { data: priceData, error: priceError } = await supabase
          .from('product_suppliers')
          .select(`
            product_id,
            supplier_id,
            supplier_sku,
            cost,
            msrp,
            map
          `)
          .eq('id', id)
          .single()

        if (priceError) throw priceError

        setPrice({
          productId: priceData.product_id,
          supplierId: priceData.supplier_id,
          supplierSku: priceData.supplier_sku,
          cost: priceData.cost || 0,
          msrp: priceData.msrp || 0,
          map: priceData.map || 0
        })
      } catch (error) {
        console.error('Error fetching data:', error)
        navigate('/pricing/supplier')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!price.productId || !price.supplierId) return

    try {
      setSaving(true)

      const priceData = {
        product_id: price.productId,
        supplier_id: price.supplierId,
        supplier_sku: price.supplierSku,
        cost: price.cost,
        msrp: price.msrp,
        map: price.map
      }

      if (id === 'new') {
        const { error } = await supabase
          .from('product_suppliers')
          .insert([priceData])

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('product_suppliers')
          .update(priceData)
          .eq('id', id)

        if (error) throw error
      }

      navigate('/pricing/supplier')
    } catch (error) {
      console.error('Error saving supplier price:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/pricing/supplier')}
            className="mr-4 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            {id === 'new' ? 'New Supplier Price' : 'Edit Supplier Price'}
          </h1>
        </div>
        <button
          type="submit"
          form="price-form"
          disabled={saving}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <form id="price-form" onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200 p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="product" className="block text-sm font-medium text-gray-700">
                Product
              </label>
              <div className="mt-1">
                <select
                  id="product"
                  name="product"
                  required
                  value={price.productId || ''}
                  onChange={(e) => setPrice(prev => ({ ...prev, productId: e.target.value }))}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="">Select a product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="supplier" className="block text-sm font-medium text-gray-700">
                Supplier
              </label>
              <div className="mt-1">
                <select
                  id="supplier"
                  name="supplier"
                  required
                  value={price.supplierId || ''}
                  onChange={(e) => setPrice(prev => ({ ...prev, supplierId: e.target.value }))}
                  className="shadow-sm focus:ring-indigo-500 focus:border-in digo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="">Select a supplier</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="supplierSku" className="block text-sm font-medium text-gray-700">
                Supplier SKU
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="supplierSku"
                  id="supplierSku"
                  required
                  value={price.supplierSku}
                  onChange={(e) => setPrice(prev => ({ ...prev, supplierSku: e.target.value }))}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3">
              <div>
                <label htmlFor="cost" className="block text-sm font-medium text-gray-700">
                  Cost
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="cost"
                    id="cost"
                    min="0"
                    step="0.01"
                    required
                    value={price.cost}
                    onChange={(e) => setPrice(prev => ({ ...prev, cost: parseFloat(e.target.value) }))}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="msrp" className="block text-sm font-medium text-gray-700">
                  MSRP
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="msrp"
                    id="msrp"
                    min="0"
                    step="0.01"
                    required
                    value={price.msrp}
                    onChange={(e) => setPrice(prev => ({ ...prev, msrp: parseFloat(e.target.value) }))}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="map" className="block text-sm font-medium text-gray-700">
                  MAP
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="map"
                    id="map"
                    min="0"
                    step="0.01"
                    required
                    value={price.map}
                    onChange={(e) => setPrice(prev => ({ ...prev, map: parseFloat(e.target.value) }))}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SupplierPricingDetail