import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Category {
  name: string
  description: string
  parent_id: string | null
}

export default function CategoryDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [category, setCategory] = useState<Category>({
    name: '',
    description: '',
    parent_id: null
  })
  const [parentCategories, setParentCategories] = useState<Array<{ id: string, name: string }>>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch parent categories
        const { data: categories, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name')
          .order('name')

        if (categoriesError) throw categoriesError
        setParentCategories(categories || [])

        if (id === 'new') {
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('categories')
          .select('name, description, parent_id')
          .eq('id', id)
          .single()

        if (error) throw error
        setCategory(data)
      } catch (error) {
        console.error('Error fetching data:', error)
        navigate('/categories')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!category.name) return

    try {
      setSaving(true)

      if (id === 'new') {
        const { error } = await supabase
          .from('categories')
          .insert([{
            name: category.name,
            description: category.description,
            parent_id: category.parent_id || null
          }])

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('categories')
          .update({
            name: category.name,
            description: category.description,
            parent_id: category.parent_id || null
          })
          .eq('id', id)

        if (error) throw error
      }

      navigate('/categories')
    } catch (error) {
      console.error('Error saving category:', error)
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
            onClick={() => navigate('/categories')}
            className="mr-4 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            {id === 'new' ? 'New Category' : 'Edit Category'}
          </h1>
        </div>
        <button
          type="submit"
          form="category-form"
          disabled={saving}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <form id="category-form" onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200 p-6">
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
                  value={category.name}
                  onChange={(e) => setCategory(prev => ({ ...prev, name: e.target.value }))}
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
                  value={category.description || ''}
                  onChange={(e) => setCategory(prev => ({ ...prev, description: e.target.value }))}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div>
              <label htmlFor="parent_id" className="block text-sm font-medium text-gray-700">
                Parent Category
              </label>
              <div className="mt-1">
                <select
                  id="parent_id"
                  name="parent_id"
                  value={category.parent_id || ''}
                  onChange={(e) => setCategory(prev => ({ ...prev, parent_id: e.target.value || null }))}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="">None</option>
                  {parentCategories
                    .filter(pc => pc.id !== id) // Prevent self-reference
                    .map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))
                  }
                </select>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}