import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Warehouse {
  name: string
  description: string
  address: string
  supplierId: string | null
  dropshipOnly: boolean
  status: 'active' | 'inactive'
  servicingAreas: string[]
  warehouseCodes: {
    id: string
    code: string
  }[]
}

interface Supplier {
  id: string
  name: string
}

interface ServicingArea {
  id: string
  country: string
  stateProvince: string | null
  postalCode: string | null
}

export function WarehouseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [warehouse, setWarehouse] = useState<Warehouse>({
    name: '',
    description: '',
    address: '',
    supplierId: null,
    dropshipOnly: false,
    status: 'active',
    servicingAreas: [],
    warehouseCodes: []
  })
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [availableAreas, setAvailableAreas] = useState<ServicingArea[]>([])
  const [newWarehouseCode, setNewWarehouseCode] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch suppliers
        const { data: suppliersData, error: suppliersError } = await supabase
          .from('suppliers')
          .select('id, name')
          .order('name')

        if (suppliersError) throw suppliersError
        setSuppliers(suppliersData)

        // Fetch servicing areas
        const { data: areasData, error: areasError } = await supabase
          .from('servicing_areas')
          .select('id, country, state_province, postal_code')
          .order('country')
          .order('state_province')
          .order('postal_code')

        if (areasError) throw areasError
        setAvailableAreas(areasData)

        if (id === 'new') {
          setLoading(false)
          return
        }

        // Fetch warehouse data
        const { data: warehouseData, error: warehouseError } = await supabase
          .from('warehouses')
          .select(`
            name,
            description,
            address,
            supplier_id,
            dropship_only,
            status,
            warehouse_codes (id, supplier_warehouse_code),
            warehouse_servicing_areas (servicing_area_id)
          `)
          .eq('id', id)
          .single()

        if (warehouseError) throw warehouseError

        setWarehouse({
          name: warehouseData.name,
          description: warehouseData.description || '',
          address: warehouseData.address,
          supplierId: warehouseData.supplier_id,
          dropshipOnly: warehouseData.dropship_only,
          status: warehouseData.status,
          servicingAreas: warehouseData.warehouse_servicing_areas.map(
            (wsa: any) => wsa.servicing_area_id
          ),
          warehouseCodes: warehouseData.warehouse_codes.map((wc: any) => ({
            id: wc.id,
            code: wc.supplier_warehouse_code
          }))
        })
      } catch (error) {
        console.error('Error fetching data:', error)
        navigate('/warehouses')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!warehouse.name || !warehouse.address || !warehouse.supplierId) return

    try {
      setSaving(true)

      const warehouseData = {
        name: warehouse.name,
        description: warehouse.description,
        address: warehouse.address,
        supplier_id: warehouse.supplierId,
        dropship_only: warehouse.dropshipOnly,
        status: warehouse.status
      }

      if (id === 'new') {
        // Create warehouse
        const { data: newWarehouse, error: warehouseError } = await supabase
          .from('warehouses')
          .insert([warehouseData])
          .select()
          .single()

        if (warehouseError) throw warehouseError

        // Add servicing areas
        if (warehouse.servicingAreas.length > 0) {
          const { error: areasError } = await supabase
            .from('warehouse_servicing_areas')
            .insert(
              warehouse.servicingAreas.map(areaId => ({
                warehouse_id: newWarehouse.id,
                servicing_area_id: areaId
              }))
            )

          if (areasError) throw areasError
        }

        // Add warehouse codes
        if (warehouse.warehouseCodes.length > 0) {
          const { error: codesError } = await supabase
            .from('warehouse_codes')
            .insert(
              warehouse.warehouseCodes.map(code => ({
                warehouse_id: newWarehouse.id,
                supplier_warehouse_code: code.code
              }))
            )

          if (codesError) throw codesError
        }
      } else {
        // Update warehouse
        const { error: warehouseError } = await supabase
          .from('warehouses')
          .update(warehouseData)
          .eq('id', id)

        if (warehouseError) throw warehouseError

        // Update servicing areas
        const { error: deleteAreasError } = await supabase
          .from('warehouse_servicing_areas')
          .delete()
          .eq('warehouse_id', id)

        if (deleteAreasError) throw deleteAreasError

        if (warehouse.servicingAreas.length > 0) {
          const { error: areasError } = await supabase
            .from('warehouse_servicing_areas')
            .insert(
              warehouse.servicingAreas.map(areaId => ({
                warehouse_id: id,
                servicing_area_id: areaId
              }))
            )

          if (areasError) throw areasError
        }

        // Update warehouse codes
        const { error: deleteCodesError } = await supabase
          .from('warehouse_codes')
          .delete()
          .eq('warehouse_id', id)

        if (deleteCodesError) throw deleteCodesError

        if (warehouse.warehouseCodes.length > 0) {
          const { error: codesError } = await supabase
            .from('warehouse_codes')
            .insert(
              warehouse.warehouseCodes.map(code => ({
                warehouse_id: id,
                supplier_warehouse_code: code.code
              }))
            )

          if (codesError) throw codesError
        }
      }

      navigate('/warehouses')
    } catch (error) {
      console.error('Error saving warehouse:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleAddWarehouseCode = () => {
    if (!newWarehouseCode) return

    setWarehouse(prev => ({
      ...prev,
      warehouseCodes: [
        ...prev.warehouseCodes,
        { id: Date.now().toString(), code: newWarehouseCode }
      ]
    }))
    setNewWarehouseCode('')
  }

  const handleRemoveWarehouseCode = (codeId: string) => {
    setWarehouse(prev => ({
      ...prev,
      warehouseCodes: prev.warehouseCodes.filter(code => code.id !== codeId)
    }))
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/warehouses')}
            className="mr-4 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            {id === 'new' ? 'New Warehouse' : 'Edit Warehouse'}
          </h1>
        </div>
        <button
          type="submit"
          form="warehouse-form"
          disabled={saving}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <form id="warehouse-form" onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200 p-6">
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
                  value={warehouse.name}
                  onChange={(e) => setWarehouse(prev => ({ ...prev, name: e.target.value }))}
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
                  value={warehouse.description}
                  onChange={(e) => setWarehouse(prev => ({ ...prev, description: e.target.value }))}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <div className="mt-1">
                <textarea
                  id="address"
                  name="address"
                  rows={3}
                  required
                  value={warehouse.address}
                  onChange={(e) => setWarehouse(prev => ({ ...prev, address: e.target.value }))}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                />
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
                  value={warehouse.supplierId || ''}
                  onChange={(e) => setWarehouse(prev => ({ ...prev, supplierId: e.target.value }))}
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
              <label htmlFor="servicingAreas" className="block text-sm font-medium text-gray-700">
                Servicing Areas
              </label>
              <div className="mt-1">
                <select
                  id="servicingAreas"
                  name="servicingAreas"
                  multiple
                  value={warehouse.servicingAreas}
                  onChange={(e) => {
                    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value)
                    setWarehouse(prev => ({ ...prev, servicingAreas: selectedOptions }))
                  }}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  size={5}
                >
                  {availableAreas.map(area => (
                    <option key={area.id} value={area.id}>
                      {area.country} - {area.state_province || 'All States'} - {area.postal_code || 'All Areas'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Supplier Warehouse Codes
              </label>
              <div className="mt-2 space-y-2">
                {warehouse.warehouseCodes.map(code => (
                  <div key={code.id} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={code.code}
                      readOnly
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md bg-gray-50"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveWarehouseCode(code.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newWarehouseCode}
                    onChange={(e) => setNewWarehouseCode(e.target.value)}
                    placeholder="Enter warehouse code"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                  <button
                    type="button"
                    onClick={handleAddWarehouseCode}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="dropshipOnly"
                    name="dropshipOnly"
                    type="checkbox"
                    checked={warehouse.dropshipOnly}
                    onChange={(e) => setWarehouse(prev => ({ ...prev, dropshipOnly: e.target.checked }))}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="dropshipOnly" className="font-medium text-gray-700">
                    Dropship Only
                  </label>
                  <p className="text-gray-500">This warehouse only handles dropship orders</p>
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
                    value={warehouse.status}
                    onChange={(e) => setWarehouse(prev => ({ 
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
          </div>
        </form>
      </div>
    </div>
  )
}

export default WarehouseDetail