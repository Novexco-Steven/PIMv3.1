import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface InventoryItem {
  productId: string | null
  supplierId: string | null
  supplierSku: string
  status: 'active' | 'inactive'
  availabilityStartDate: string
  availabilityEndDate: string
  supplierWarehouseCode: string
  quantity: number
  nextAvailabilityDate: string | null
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

interface WarehouseCode {
  code: string
}

export function InventoryDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [inventory, setInventory] = useState<InventoryItem>({
    productId: null,
    supplierId: null,
    supplierSku: '',
    status: 'active',
    availabilityStartDate: new Date().toISOString().split('T')[0],
    availabilityEndDate: '9999-12-31',
    supplierWarehouseCode: '',
    quantity: 0,
    nextAvailabilityDate: null
  })
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [warehouseCodes, setWarehouseCodes] = useState<WarehouseCode[]>([])

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

        // Fetch inventory data
        const { data: inventoryData, error: inventoryError } = await supabase
          .from('inventory')
          .select(`
            product_id,
            supplier_id,
            supplier_sku,
            status,
            availability_start_date,
            availability_end_date,
            supplier_warehouse_code,
            quantity,
            next_availability_date
          `)
          .eq('id', id)
          .single()

        if (inventoryError) throw inventoryError

        setInventory({
          productId: inventoryData.product_id,
          supplierId: inventoryData.supplier_id,
          supplierSku: inventoryData.supplier_sku,
          status: inventoryData.status,
          availabilityStartDate: new Date(inventoryData.availability_start_date).toISOString().split('T')[0],
          availabilityEndDate: new Date(inventoryData.availability_end_date).toISOString().split('T')[0],
          supplierWarehouseCode: inventoryData.supplier_warehouse_code,
          quantity: inventoryData.quantity,
          nextAvailabilityDate: inventoryData.next_availability_date
            ? new Date(inventoryData.next_availability_date).toISOString().split('T')[0]
            : null
        })

        // Fetch warehouse codes if supplier is selected
        if (inventoryData.supplier_id) {
          const { data: codesData, error: codesError } = await supabase
            .from('warehouse_codes')
            .select('supplier_warehouse_code')
            .eq('supplier_id', inventoryData.supplier_id)

          if (codesError) throw codesError
          setWarehouseCodes(codesData.map(code => ({ code: code.supplier_warehouse_code })))
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        navigate('/inventory')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, navigate])

  const handleSupplierChange = async (supplierId: string) => {
    try {
      setInventory(prev => ({ ...prev, supplierId }))

      // Fetch warehouse codes for selected supplier
      const { data: codesData, error: codesError } = await supabase
        .from('warehouse_codes')
        .select('supplier_warehouse_code')
        .eq('supplier_id', supplierId)

      if (codesError) throw codesError
      setWarehouseCodes(codesData.map(code => ({ code: code.supplier_warehouse_code })))
    } catch (error) {
      console.error('Error fetching warehouse codes:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inventory.productId || !inventory.supplierId || !inventory.supplierSku) return

    try {
      setSaving(true)

      const inventoryData = {
        product_id: inventory.productId,
        supplier_id: inventory.supplierId,
        supplier_sku: inventory.supplierSku,
        status: inventory.status,
        availability_start_date: inventory.availabilityStartDate,
        availability_end_date: inventory.availabilityEndDate,
        supplier_warehouse_code: inventory.supplierWarehouseCode,
        quantity: inventory.quantity,
        next_availability_date: inventory.nextAvailabilityDate,
        last_sync_date: new Date().toISOString()
      }

      if (id === 'new') {
        const { error } = await supabase
          .from('inventory')
          .insert([inventoryData])

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('inventory')
          .update(inventoryData)
          .eq('id', id)

        if (error) throw error
      }

      navigate('/inventory')
    } catch (error) {
      console.error('Error saving inventory:', error)
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
            onClick={() => navigate('/inventory')}
            className="mr-4 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            {id === 'new' ? 'New Inventory Item' : 'Edit Inventory Item'}
          </h1>
        </div>
        <button
          type="submit"
          form="inventory-form"
          disabled={saving}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <form id="inventory-form" onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200 p-6">
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
                  value={inventory.productId || ''}
                  onChange={(e) => setInventory(prev => ({ ...prev, productId: e.target.value }))}
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
                  value={inventory.supplierId || ''}
                  onChange={(e) => handleSupplierChange(e.target.value)}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
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
                  value={inventory.supplierSku}
                  onChange={(e) => setInventory(prev => ({ ...prev, supplierSku: e.target.value }))}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div>
              <label htmlFor="warehouseCode" className="block text-sm font-medium text-gray-700">
                Supplier Warehouse Code
              </label>
              <div className="mt-1">
                <select
                  id="warehouseCode"
                  name="warehouseCode"
                  required
                  value={inventory.supplierWarehouseCode}
                  onChange={(e) => setInventory(prev => ({ ...prev, supplierWarehouseCode: e.target.value }))}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="">Select a warehouse code</option>
                  {warehouseCodes.map((code, index) => (
                    <option key={index} value={code.code}>
                      {code.code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                Quantity
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  name="quantity"
                  id="quantity"
                  min="0"
                  required
                  value={inventory.quantity}
                  onChange={(e) => setInventory(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label htmlFor="availabilityStartDate" className="block text-sm font-medium text-gray-700">
                  Availability Start Date
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    name="availabilityStartDate"
                    id="availabilityStartDate"
                    required
                    value={inventory.availabilityStartDate}
                    onChange={(e) => setInventory(prev => ({ ...prev, availabilityStartDate: e.target.value }))}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="availabilityEndDate" className="block text-sm font-medium text-gray-700">
                  Availability End Date
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    name="availabilityEndDate"
                    id="availabilityEndDate"
                    required
                    value={inventory.availabilityEndDate}
                    onChange={(e) => setInventory(prev => ({ ...prev, availabilityEndDate: e.target.value }))}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="nextAvailabilityDate" className="block text-sm font-medium text-gray-700">
                Next Availability Date
              </label>
              <div className="mt-1">
                <input
                  type="date"
                  name="nextAvailabilityDate"
                  id="nextAvailabilityDate"
                  value={inventory.nextAvailabilityDate || ''}
                  onChange={(e) => setInventory(prev => ({ ...prev, nextAvailabilityDate: e.target.value || null }))}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <div className="mt-1">
                <select
                  id="status"
                  name="status"
                  value={inventory.status}
                  onChange={(e) => setInventory(prev => ({ 
                    ...prev, 
                    status: e.target.value as 'active' | 'inactive'
                  }))}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default InventoryDetail