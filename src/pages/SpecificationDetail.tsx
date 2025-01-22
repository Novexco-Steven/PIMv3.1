import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { SpecificationItem } from '../types/product'

interface Specification {
  id: string
  name: string
  items: SpecificationItem[]
}

export default function SpecificationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [specification, setSpecification] = useState<Specification>({
    id: '',
    name: '',
    items: []
  })

  useEffect(() => {
    const fetchData = async () => {
      if (id === 'new') {
        setLoading(false)
        return
      }

      try {
        const { data: specData, error: specError } = await supabase
          .from('specifications')
          .select('*')
          .eq('id', id)
          .single()

        if (specError) throw specError

        const { data: itemsData, error: itemsError } = await supabase
          .from('specification_items')
          .select('*')
          .eq('specification_id', id)
          .order('order')

        if (itemsError) throw itemsError

        setSpecification({
          ...specData,
          items: itemsData || []
        })
      } catch (error) {
        console.error('Error fetching specification:', error)
        navigate('/specifications')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, navigate])

  const handleAddItem = () => {
    setSpecification(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: '',
          name: '',
          order: prev.items.length
        }
      ]
    }))
  }

  const handleRemoveItem = (index: number) => {
    setSpecification(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const handleItemChange = (index: number, name: string) => {
    setSpecification(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, name } : item
      )
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!specification.name) return

    try {
      setSaving(true)

      if (id === 'new') {
        // Create new specification
        const { data: specData, error: specError } = await supabase
          .from('specifications')
          .insert([{ name: specification.name }])
          .select()
          .single()

        if (specError) throw specError

        // Create items
        if (specification.items.length > 0) {
          const { error: itemsError } = await supabase
            .from('specification_items')
            .insert(
              specification.items.map(item => ({
                name: item.name,
                order: item.order,
                specification_id: specData.id
              }))
            )

          if (itemsError) throw itemsError
        }
      } else {
        // Update specification
        const { error: specError } = await supabase
          .from('specifications')
          .update({ name: specification.name })
          .eq('id', id)

        if (specError) throw specError

        // Delete existing items
        const { error: deleteError } = await supabase
          .from('specification_items')
          .delete()
          .eq('specification_id', id)

        if (deleteError) throw deleteError

        // Create new items
        if (specification.items.length > 0) {
          const { error: itemsError } = await supabase
            .from('specification_items')
            .insert(
              specification.items.map(item => ({
                name: item.name,
                order: item.order,
                specification_id: id
              }))
            )

          if (itemsError) throw itemsError
        }
      }

      navigate('/specifications')
    } catch (error) {
      console.error('Error saving specification:', error)
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
            onClick={() => navigate('/specifications')}
            className="mr-4 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            {id === 'new' ? 'New Specification' : 'Edit Specification'}
          </h1>
        </div>
        <button
          type="submit"
          form="specification-form"
          disabled={saving}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <form id="specification-form" onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200 p-6">
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
                  value={specification.name}
                  onChange={(e) => setSpecification(prev => ({ ...prev, name: e.target.value }))}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Items</h3>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </button>
              </div>

              <div className="space-y-4">
                {specification.items.map((item, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Name
                      </label>
                      <input
                        type="text"
                        required
                        value={item.name}
                        onChange={(e) => handleItemChange(index, e.target.value)}
                        className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="mt-6 text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}