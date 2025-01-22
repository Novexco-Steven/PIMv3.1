import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Supplier {
  name: string
  description: string
}

export default function SupplierDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [supplier, setSupplier] = useState<Supplier>({
    name: '',
    description: ''
  })

  useEffect(() => {
    const fetchData = async () => {
      if (id === 'new') {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('suppliers')
          .select('name, description')
          .eq('id', id)
          .single()

        if (error) throw error

        setSupplier(data)
      } catch (error) {
        console.error('Error fetching supplier:', error)
        navigate('/suppliers')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supplier.name) return

    try {
      setSaving(true)

      if (id === 'new') {
        const { error } = await supabase
          .from('suppliers')
          .insert([{
            name: supplier.name,
            description: supplier.description || null
          }])

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('suppliers')
          .update({
            name: supplier.name,
            description: supplier.description || null
          })
          .eq('id', id)

        if (error) throw error
      }

      navigate('/suppliers')
    } catch (error) {
      console.error('Error saving supplier:', error)
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
            onClick={() => navigate('/suppliers')}
            className="mr-4 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            {id === 'new' ? 'New Supplier' : 'Edit Supplier'}
          </h1>
        </div>
        <button
          type="submit"
          form="supplier-form"
          disabled={saving}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <form id="supplier-form" onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200 p-6">
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
                  value={supplier.name}
                  onChange={(e) => setSupplier(prev => ({ ...prev, name: e.target.value }))}
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
                  value={supplier.description || ''}
                  onChange={(e) => setSupplier(prev => ({ ...prev, description: e.target.value }))}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}