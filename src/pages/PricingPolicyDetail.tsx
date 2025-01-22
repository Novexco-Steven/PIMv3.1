import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { DualListSelector } from '../components/common/DualListSelector'

interface Policy {
  name: string
  description: string
  startDate: string
  endDate: string
  status: 'active' | 'inactive' | 'scheduled'
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

export default function PricingPolicyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [policy, setPolicy] = useState<Policy>({
    name: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'scheduled',
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

        // Fetch policy data
        const { data: policyData, error: policyError } = await supabase
          .from('pricing_policies')
          .select(`
            name,
            description,
            start_date,
            end_date,
            status,
            inclusions:policy_inclusions(
              product_id,
              category_id
            ),
            exclusions:policy_exclusions(
              product_id,
              category_id
            )
          `)
          .eq('id', id)
          .single()

        if (policyError) throw policyError

        setPolicy({
          name: policyData.name,
          description: policyData.description || '',
          startDate: new Date(policyData.start_date).toISOString().split('T')[0],
          endDate: new Date(policyData.end_date).toISOString().split('T')[0],
          status: policyData.status,
          includedProducts: policyData.inclusions
            .filter((i: any) => i.product_id)
            .map((i: any) => i.product_id),
          excludedProducts: policyData.exclusions
            .filter((e: any) => e.product_id)
            .map((e: any) => e.product_id),
          includedCategories: policyData.inclusions
            .filter((i: any) => i.category_id)
            .map((i: any) => i.category_id),
          excludedCategories: policyData.exclusions
            .filter((e: any) => e.category_id)
            .map((e: any) => e.category_id)
        })
      } catch (error) {
        console.error('Error fetching data:', error)
        navigate('/pricing/policies')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!policy.name) return

    try {
      setSaving(true)

      const policyData = {
        name: policy.name,
        description: policy.description,
        start_date: policy.startDate,
        end_date: policy.endDate,
        status: policy.status
      }

      if (id === 'new') {
        // Create policy
        const { data: newPolicy, error: policyError } = await supabase
          .from('pricing_policies')
          .insert([policyData])
          .select()
          .single()

        if (policyError) throw policyError

        // Add inclusions
        if (policy.includedProducts.length > 0) {
          const { error: productInclusionsError } = await supabase
            .from('policy_inclusions')
            .insert(
              policy.includedProducts.map(productId => ({
                policy_id: newPolicy.id,
                product_id: productId
              }))
            )

          if (productInclusionsError) throw productInclusionsError
        }

        if (policy.includedCategories.length > 0) {
          const { error: categoryInclusionsError } = await supabase
            .from('policy_inclusions')
            .insert(
              policy.includedCategories.map(categoryId => ({
                policy_id: newPolicy.id,
                category_id: categoryId
              }))
            )

          if (categoryInclusionsError) throw categoryInclusionsError
        }

        // Add exclusions
        if (policy.excludedProducts.length > 0) {
          const { error: productExclusionsError } = await supabase
            .from('policy_exclusions')
            .insert(
              policy.excludedProducts.map(productId => ({
                policy_id: newPolicy.id,
                product_id: productId
              }))
            )

          if (productExclusionsError) throw productExclusionsError
        }

        if (policy.excludedCategories.length > 0) {
          const { error: categoryExclusionsError } = await supabase
            .from('policy_exclusions')
            .insert(
              policy.excludedCategories.map(categoryId => ({
                policy_id: newPolicy.id,
                category_id: categoryId
              }))
            )

          if (categoryExclusionsError) throw categoryExclusionsError
        }
      } else {
        // Update policy
        const { error: policyError } = await supabase
          .from('pricing_policies')
          .update(policyData)
          .eq('id', id)

        if (policyError) throw policyError

        // Update inclusions
        const { error: deleteInclusionsError } = await supabase
          .from('policy_inclusions')
          .delete()
          .eq('policy_id', id)

        if (deleteInclusionsError) throw deleteInclusionsError

        if (policy.includedProducts.length > 0) {
          const { error: productInclusionsError } = await supabase
            .from('policy_inclusions')
            .insert(
              policy.includedProducts.map(productId => ({
                policy_id: id,
                product_id: productId
              }))
            )

          if (productInclusionsError) throw productInclusionsError
        }

        if (policy.includedCategories.length > 0) {
          const { error: categoryInclusionsError } = await supabase
            .from('policy_inclusions')
            .insert(
              policy.includedCategories.map(categoryId => ({
                policy_id: id,
                category_id: categoryId
              }))
            )

          if (categoryInclusionsError) throw categoryInclusionsError
        }

        // Update exclusions
        const { error: deleteExclusionsError } = await supabase
          .from('policy_exclusions')
          .delete()
          .eq('policy_id', id)

        if (deleteExclusionsError) throw deleteExclusionsError

        if (policy.excludedProducts.length > 0) {
          const { error: productExclusionsError } = await supabase
            .from('policy_exclusions')
            .insert(
              policy.excludedProducts.map(productId => ({
                policy_id: id,
                product_id: productId
              }))
            )

          if (productExclusionsError) throw productExclusionsError
        }

        if (policy.excludedCategories.length > 0) {
          const { error: categoryExclusionsError } = await supabase
            .from('policy_exclusions')
            .insert(
              policy.excludedCategories.map(categoryId => ({
                policy_id: id,
                category_id: categoryId
              }))
            )

          if (categoryExclusionsError) throw categoryExclusionsError
        }
      }

      navigate('/pricing/policies')
    } catch (error) {
      console.error('Error saving policy:', error)
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
            onClick={() => navigate('/pricing/policies')}
            className="mr-4 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            {id === 'new' ? 'New Pricing Policy' : 'Edit Pricing Policy'}
          </h1>
        </div>
        <button
          type="submit"
          form="policy-form"
          disabled={saving}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <form id="policy-form" onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200 p-6">
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
                  value={policy.name}
                  onChange={(e) => setPolicy(prev => ({ ...prev, name: e.target.value }))}
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
                  value={policy.description}
                  onChange={(e) => setPolicy(prev => ({ ...prev, description: e.target.value }))}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                />
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
                    value={policy.startDate}
                    onChange={(e) => setPolicy(prev => ({ ...prev, startDate: e.target.value }))}
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
                    value={policy.endDate}
                    onChange={(e) => setPolicy(prev => ({ ...prev, endDate: e.target.value }))}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
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
                  value={policy.status}
                  onChange={(e) => setPolicy(prev => ({ 
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

            <div className="grid grid-cols-1 gap-y-6 gap-x-4">
              <div>
                <DualListSelector
                  title="Included Products"
                  items={items}
                  selectedIds={policy.includedProducts}
                  onChange={(selectedIds) => setPolicy(prev => ({ ...prev, includedProducts: selectedIds }))}
                  onlyCategories={false}
                />
              </div>

              <div>
                <DualListSelector
                  title="Excluded Products"
                  items={items}
                  selectedIds={policy.excludedProducts}
                  onChange={(selectedIds) => setPolicy(prev => ({ ...prev, excludedProducts: selectedIds }))}
                  onlyCategories={false}
                />
              </div>

              <div>
                <DualListSelector
                  title="Included Categories"
                  items={items}
                  selectedIds={policy.includedCategories}
                  onChange={(selectedIds) => setPolicy(prev => ({ ...prev, includedCategories: selectedIds }))}
                  onlyCategories={true}
                />
              </div>

              <div>
                <DualListSelector
                  title="Excluded Categories"
                  items={items}
                  selectedIds={policy.excludedCategories}
                  onChange={(selectedIds) => setPolicy(prev => ({ ...prev, excludedCategories: selectedIds }))}
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