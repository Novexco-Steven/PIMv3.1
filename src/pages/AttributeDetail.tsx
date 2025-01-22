import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Attribute {
  id: string
  name: string
  type: string
  required: boolean
  options: string[]
}

const ATTRIBUTE_TYPES = [
  'text',
  'number',
  'boolean',
  'date',
  'select',
  'multiselect'
]

export default function AttributeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [attribute, setAttribute] = useState<Attribute>({
    id: '',
    name: '',
    type: 'text',
    required: false,
    options: []
  })

  useEffect(() => {
    const fetchData = async () => {
      if (id === 'new') {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('attributes')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error

        setAttribute({
          ...data,
          options: data.options || []
        })
      } catch (error) {
        console.error('Error fetching attribute:', error)
        navigate('/attributes')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, navigate])

  const handleAddOption = () => {
    setAttribute(prev => ({
      ...prev,
      options: [...prev.options, '']
    }))
  }

  const handleRemoveOption = (index: number) => {
    setAttribute(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }))
  }

  const handleOptionChange = (index: number, value: string) => {
    setAttribute(prev => ({
      ...prev,
      options: prev.options.map((option, i) => 
        i === index ? value : option
      )
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!attribute.name) return

    try {
      setSaving(true)

      const attributeData = {
        name: attribute.name,
        type: attribute.type,
        required: attribute.required,
        options: ['select', 'multiselect'].includes(attribute.type) ? attribute.options : null
      }

      if (id === 'new') {
        const { error } = await supabase
          .from('attributes')
          .insert([attributeData])

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('attributes')
          .update(attributeData)
          .eq('id', id)

        if (error) throw error
      }

      navigate('/attributes')
    } catch (error) {
      console.error('Error saving attribute:', error)
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
            onClick={() => navigate('/attributes')}
            className="mr-4 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            {id === 'new' ? 'New Attribute' : 'Edit Attribute'}
          </h1>
        </div>
        <button
          type="submit"
          form="attribute-form"
          disabled={saving}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <form id="attribute-form" onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200 p-6">
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
                  value={attribute.name}
                  onChange={(e) => setAttribute(prev => ({ ...prev, name: e.target.value }))}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
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
                  value={attribute.type}
                  onChange={(e) => setAttribute(prev => ({ ...prev, type: e.target.value }))}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                >
                  {ATTRIBUTE_TYPES.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="relative flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="required"
                  name="required"
                  type="checkbox"
                  checked={attribute.required}
                  onChange={(e) => setAttribute(prev => ({ ...prev, required: e.target.checked }))}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="required" className="font-medium text-gray-700">
                  Required
                </label>
                <p className="text-gray-500">Make this attribute mandatory for all products</p>
              </div>
            </div>

            {(attribute.type === 'select' || attribute.type === 'multiselect') && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Options</h3>
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Option
                  </button>
                </div>

                <div className="space-y-4">
                  {attribute.options.map((option, index) => (
                    <div key={index} className="flex gap-4 items-start">
                      <div className="flex-1">
                        <input
                          type="text"
                          required
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="Option value"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}