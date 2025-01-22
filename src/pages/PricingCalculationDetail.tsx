import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface PricingCalculation {
  name: string
  description: string
  type: 'min_price_percentage' | 'cost_plus_percentage' | 'cost_plus_amount'
  value: number
  productId: string | null
  supplierId: string | null
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

export function PricingCalculationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [calculation, setCalculation] = useState<PricingCalculation>({
    name: '',
    description: '',
    type: 'min_price_percentage',
    value: 0,
    productId: null,
    supplierId: null
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

        // Fetch calculation data
        const { data: calculationData, error: calculationError } = await supabase
          .from('pricing_calculations')
          .select(`
            name,
            description,
            type,
            value,
            product_id,
            supplier_id
          `)
          .eq('id', id)
          .single()

        if (calculationError) throw calculationError

        setCalculation({
          name: calculationData.name,
          description: calculationData.description || '',
          type: calculationData.type,
          value: calculationData.value,
          productId: calculationData.product_id,
          supplierId: calculationData.supplier_id
        })
      } catch (error) {
        console.error('Error fetching data:', error)
        navigate('/pricing/calculations')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!calculation.name) return

    try {
      setSaving(true)

      const calculationData = {
        name: calculation.name,
        description: calculation.description,
        type: calculation.type,
        value: calculation.value,
        product_id: calculation.productId,
        supplier_id: calculation.supplierId
      }

      if (id === 'new') {
        const { error } = await supabase
          .from('pricing_calculations')
          .insert([calculationData])

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('pricing_calculations')
          .update(calculationData)
          .eq('id', id)

        if (error) throw error
      }

      navigate('/pricing/calculations')
    } catch (error) {
      console.error('Error saving calculation:', error)
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
            onClick={() => navigate('/pricing/calculations')}
            className="mr-4 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            {id === 'new' ? 'New Calculation' : 'Edit Calculation'}
          </h1>
        </div>
        <button
          type="submit"
          form="calculation-form"
          disabled={saving}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <form id="calculation-form" onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200 p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  value={calculation.name}
                  onChange={(e) => setCalculation(prev => ({ ...prev, name: e.target.value }))}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <div className="mt-1">
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={calculation.description}
                  onChange={(e) => setCalculation(prev => ({ ...prev, description: e.target.value }))}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Type
              </label>
              <div className="mt-1">
                <select
                  id="type"
                  name="type"
                  required
                  value={calculation.type}
                  onChange={(e) => setCalculation(prev => ({ 
                    ...prev, 
                    type: e.target.value as PricingCalculation['type']
                  }))}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="min_price_percentage">Minimum Price Percentage</option>
                  <option value="cost_plus_percentage">Cost Plus Percentage</option>
                  <option value="cost_plus_amount">Cost Plus Amount</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="value" className="block text-sm font-medium text-gray-700">
                Value
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  name="value"
                  id="value"
                  min="0"
                  step={calculation.type === 'cost_plus_amount' ? '0.01' : '0.1'}
                  required
                  value={calculation.value}
                  onChange={(e) => setCalculation(prev => ({ ...prev, value: parseFloat(e.target.value) }))}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
                <p className="mt-1 text-sm text-gray-500">
                  {calculation.type === 'cost_plus_amount' ? 'Amount in dollars' : 'Percentage value'}
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="product" className="block text-sm font-medium text-gray-700">
                Product (Optional)
              </label>
              <div className="mt-1">
                <select
                  id="product"
                  name="product"
                  value={calculation.productId || ''}
                  onChange={(e) => setCalculation(prev => ({ ...prev, productId: e.target.value || null }))}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="">All Products</option>
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
                Supplier (Optional)
              </label>
              <div className="mt-1">
                <select
                  id="supplier"
                  name="supplier"
                  value={calculation.supplierId || ''}
                  onChange={(e) => setCalculation(prev => ({ ...prev, supplierId: e.target.value || null }))}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="">All Suppliers</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PricingCalculationDetail