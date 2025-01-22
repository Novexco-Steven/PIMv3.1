import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { DualListSelector } from '../components/common/DualListSelector'

interface Promotion {
  name: string
  description: string
  type: string
  value: number | null
  startDate: string
  endDate: string
  status: 'active' | 'inactive' | 'scheduled'
  supplierId: string | null
  isStackable: boolean
  includedProducts: string[]
  excludedProducts: string[]
  includedCategories: string[]
  excludedCategories: string[]
}

interface Item {
  id: string
  name: string
  parentId?: string | null
  type: 'category' | 'product'
  sku?: string
}

export default function PromotionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [promotion, setPromotion] = useState<Promotion>({
    name: '',
    description: '',
    type: 'percentage',
    value: null,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'scheduled',
    supplierId: null,
    isStackable: false,
    includedProducts: [],
    excludedProducts: [],
    includedCategories: [],
    excludedCategories: []
  })
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products and categories
        const [productsResult, categoriesResult] = await Promise.all([
          supabase
            .from('products')
            .select('id, name, sku, category_id'),
          supabase
            .from('categories')
            .select('id, name, parent_id')
        ])

        if (productsResult.error) throw productsResult.error
        if (categoriesResult.error) throw categoriesResult.error

        const allItems: Item[] = [
          ...categoriesResult.data.map(cat => ({
            id: cat.id,
            name: cat.name,
            parentId: cat.parent_id,
            type: 'category' as const
          })),
          ...productsResult.data.map(prod => ({
            id: prod.id,
            name: prod.name,
            parentId: prod.category_id,
            type: 'product' as const,
            sku: prod.sku
          }))
        ]

        setItems(allItems)

        if (id === 'new') {
          setLoading(false)
          return
        }

        // Fetch promotion data
        const { data: promotionData, error: promotionError } = await supabase
          .from('promotions')
          .select(`
            name,
            description,
            type,
            value,
            start_date,
            end_date,
            status,
            supplier_id,
            is_stackable,
            inclusions:promotion_inclusions(
              product_id,
              category_id
            ),
            exclusions:promotion_exclusions(
              product_id,
              category_id
            )
          `)
          .eq('id', id)
          .single()

        if (promotionError) throw promotionError

        setPromotion({
          name: promotionData.name,
          description: promotionData.description || '',
          type: promotionData.type,
          value: promotionData.value,
          startDate: new Date(promotionData.start_date).toISOString().split('T')[0],
          endDate: new Date(promotionData.end_date).toISOString().split('T')[0],
          status: promotionData.status,
          supplierId: promotionData.supplier_id,
          isStackable: promotionData.is_stackable,
          includedProducts: promotionData.inclusions
            .filter((i: any) => i.product_id)
            .map((i: any) => i.product_id),
          excludedProducts: promotionData.exclusions
            .filter((e: any) => e.product_id)
            .map((e: any) => e.product_id),
          includedCategories: promotionData.inclusions
            .filter((i: any) => i.category_id)
            .map((i: any) => i.category_id),
          excludedCategories: promotionData.exclusions
            .filter((e: any) => e.category_id)
            .map((e: any) => e.category_id)
        })
      } catch (error) {
        console.error('Error fetching data:', error)
        navigate('/pricing/promotions')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!promotion.name) return

    try {
      setSaving(true)

      const promotionData = {
        name: promotion.name,
        description: promotion.description,
        type: promotion.type,
        value: promotion.value,
        start_date: promotion.startDate,
        end_date: promotion.endDate,
        status: promotion.status,
        supplier_id: promotion.supplierId,
        is_stackable: promotion.isStackable
      }

      if (id === 'new') {
        // Create promotion
        const { data: newPromotion, error: promotionError } = await supabase
          .from('promotions')
          .insert([promotionData])
          .select()
          .single()

        if (promotionError) throw promotionError

        // Add inclusions
        if (promotion.includedProducts.length > 0) {
          const { error: productInclusionsError } = await supabase
            .from('promotion_inclusions')
            .insert(
              promotion.includedProducts.map(productId => ({
                promotion_id: newPromotion.id,
                product_id: productId
              }))
            )

          if (productInclusionsError) throw productInclusionsError
        }

        if (promotion.includedCategories.length > 0) {
          const { error: categoryInclusionsError } = await supabase
            .from('promotion_inclusions')
            .insert(
              promotion.includedCategories.map(categoryId => ({
                promotion_id: newPromotion.id,
                category_id: categoryId
              }))
            )

          if (categoryInclusionsError) throw categoryInclusionsError
        }

        // Add exclusions
        if (promotion.excludedProducts.length > 0) {
          const { error: productExclusionsError } = await supabase
            .from('promotion_exclusions')
            .insert(
              promotion.excludedProducts.map(productId => ({
                promotion_id: newPromotion.id,
                product_id: productId
              }))
            )

          if (productExclusionsError) throw productExclusionsError
        }

        if (promotion.excludedCategories.length > 0) {
          const { error: categoryExclusionsError } = await supabase
            .from('promotion_exclusions')
            .insert(
              promotion.excludedCategories.map(categoryId => ({
                promotion_id: newPromotion.id,
                category_id: categoryId
              }))
            )

          if (categoryExclusionsError) throw categoryExclusionsError
        }
      } else {
        // Update promotion
        const { error: promotionError } = await supabase
          .from('promotions')
          .update(promotionData)
          .eq('id', id)

        if (promotionError) throw promotionError

        // Update inclusions
        const { error: deleteInclusionsError } = await supabase
          .from('promotion_inclusions')
          .delete()
          .eq('promotion_id', id)

        if (deleteInclusionsError) throw deleteInclusionsError

        if (promotion.includedProducts.length > 0) {
          const { error: productInclusionsError } = await supabase
            .from('promotion_inclusions')
            .insert(
              promotion.includedProducts.map(productId => ({
                promotion_id: id,
                product_id: productId
              }))
            )

          if (productInclusionsError) throw productInclusionsError
        }

        if (promotion.includedCategories.length > 0) {
          const { error: categoryInclusionsError } = await supabase
            .from('promotion_inclusions')
            .insert(
              promotion.includedCategories.map(categoryId => ({
                promotion_id: id,
                category_id: categoryId
              }))
            )

          if (categoryInclusionsError) throw categoryInclusionsError
        }

        // Update exclusions
        const { error: deleteExclusionsError } = await supabase
          .from('promotion_exclusions')
          .delete()
          .eq('promotion_id', id)

        if (deleteExclusionsError) throw deleteExclusionsError

        if (promotion.excludedProducts.length > 0) {
          const { error: productExclusionsError } = await supabase
            .from('promotion_exclusions')
            .insert(
              promotion.excludedProducts.map(productId => ({
                promotion_id: id,
                product_id: productId
              }))
            )

          if (productExclusionsError) throw productExclusionsError
        }

        if (promotion.excludedCategories.length > 0) {
          const { error: categoryExclusionsError } = await supabase
            .from('promotion_exclusions')
            .insert(
              promotion.excludedCategories.map(categoryId => ({
                promotion_id: id,
                category_id: categoryId
              }))
            )

          if (categoryExclusionsError) throw categoryExclusionsError
        }
      }

      navigate('/pricing/promotions')
    } catch (error) {
      console.error('Error saving promotion:', error)
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
            onClick={() => navigate('/pricing/promotions')}
            className="mr-4 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            {id === 'new' ? 'New Promotion' : 'Edit Promotion'}
          </h1>
        </div>
        <button
          type="submit"
          form="promotion-form"
          disabled={saving}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <form id="promotion-form" onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200 p-6">
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
                  value={promotion.name}
                  onChange={(e) => setPromotion(prev => ({ ...prev, name: e.target.value }))}
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
                  value={promotion.description}
                  onChange={(e) => setPromotion(prev => ({ ...prev, description: e.target.value }))}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Type
                </label>
                <div className="mt-1">
                  <select
                    id="type"
                    name="type"
                    required
                    value={promotion.type}
                    onChange={(e) => setPromotion(prev => ({ ...prev, type: e.target.value }))}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="manufacturer">Manufacturer</option>
                    <option value="retail">Retail</option>
                    <option value="liquidation">Liquidation</option>
                    <option value="rebate">Rebate</option>
                    <option value="shipping">Shipping</option>
                    <option value="percentage">Percentage</option>
                    <option value="amount">Amount</option>
                    <option value="bogo">Buy One Get One</option>
                    <option value="multi_buy">Multi-Buy</option>
                    <option value="free_shipping">Free Shipping</option>
                    <option value="seasonal">Seasonal</option>
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
                    step={promotion.type === 'percentage' ? '0.01' : '1'}
                    value={promotion.value || ''}
                    onChange={(e) => setPromotion(prev => ({ 
                      ...prev, 
                      value: e.target.value ? parseFloat(e.target.value) : null
                    }))}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    name="startDate"
                    id="startDate"
                    required
                    value={promotion.startDate}
                    onChange={(e) => setPromotion(prev => ({ ...prev, startDate: e.target.value }))}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    name="endDate"
                    id="endDate"
                    required
                    value={promotion.endDate}
                    onChange={(e) => setPromotion(prev => ({ ...prev, endDate: e.target.value }))}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="isStackable"
                    name="isStackable"
                    type="checkbox"
                    checked={promotion.isStackable}
                    onChange={(e) => setPromotion(prev => ({ ...prev, isStackable: e.target.checked }))}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="isStackable" className="font-medium text-gray-700">
                    Stackable
                  </label>
                  <p className="text-gray-500">Allow this promotion to be combined with others</p>
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
                    value={promotion.status}
                    onChange={(e) => setPromotion(prev => ({ 
                      ...prev, 
                      status: e.target.value as 'active' | 'inactive' | 'scheduled'
                    }))}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-y-6">
              <div>
                <DualListSelector
                  title="Included Products"
                  items={items}
                  selectedIds={promotion.includedProducts}
                  onChange={(selectedIds) => setPromotion(prev => ({ ...prev, includedProducts: selectedIds }))}
                  onlyCategories={false}
                />
              </div>

              <div>
                <DualListSelector
                  title="Excluded Products"
                  items={items}
                  selectedIds={promotion.excludedProducts}
                  onChange={(selectedIds) => setPromotion(prev => ({ ...prev, excludedProducts: selectedIds }))}
                  onlyCategories={false}
                />
              </div>

              <div>
                <DualListSelector
                  title="Included Categories"
                  items={items}
                  selectedIds={promotion.includedCategories}
                  onChange={(selectedIds) => setPromotion(prev => ({ ...prev, includedCategories: selectedIds }))}
                  onlyCategories={true}
                />
              </div>

              <div>
                <DualListSelector
                  title="Excluded Categories"
                  items={items}
                  selectedIds={promotion.excludedCategories}
                  onChange={(selectedIds) => setPromotion(prev => ({ ...prev, excludedCategories: selectedIds }))}
                  onlyCategories={true}
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}