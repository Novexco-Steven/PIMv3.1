import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Globe } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Manufacturer {
  name: string
  description: string
  website: string | null
}

export default function ManufacturerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [manufacturer, setManufacturer] = useState<Manufacturer>({
    name: '',
    description: '',
    website: ''
  })

  useEffect(() => {
    const fetchData = async () => {
      if (id === 'new') {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('manufacturers')
          .select('name, description, website')
          .eq('id', id)
          .single()

        if (error) throw error

        setManufacturer({
          name: data.name || '',
          description: data.description || '',
          website: data.website || ''
        })
      } catch (error) {
        console.error('Error fetching manufacturer:', error)
        navigate('/manufacturers')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manufacturer.name) return

    try {
      setSaving(true)

      const manufacturerData = {
        name: manufacturer.name,
        description: manufacturer.description || null,
        website: manufacturer.website || null
      }

      if (id === 'new') {
        const { error } = await supabase
          .from('manufacturers')
          .insert([manufacturerData])

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('manufacturers')
          .update(manufacturerData)
          .eq('id', id)

        if (error) throw error
      }

      navigate('/manufacturers')
    } catch (error) {
      console.error('Error saving manufacturer:', error)
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
            onClick={() => navigate('/manufacturers')}
            className="mr-4 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            {id === 'new' ? 'New Manufacturer' : 'Edit Manufacturer'}
          </h1>
        </div>
        <button
          type="submit"
          form="manufacturer-form"
          disabled={saving}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <form id="manufacturer-form" onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200 p-6">
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
                  value={manufacturer.name}
                  onChange={(e) => setManufacturer(prev => ({ ...prev, name: e.target.value }))}
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
                  value={manufacturer.description}
                  onChange={(e) => setManufacturer(prev => ({ ...prev, description: e.target.value }))}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                Website
              </label>
              <div className="mt-1">
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="url"
                    name="website"
                    id="website"
                    value={manufacturer.website || ''}
                    onChange={(e) => setManufacturer(prev => ({ ...prev, website: e.target.value }))}
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    placeholder="https://example.com"
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