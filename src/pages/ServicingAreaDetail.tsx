import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface ServicingArea {
  country: string
  stateProvince: string | null
  postalCode: string | null
}

export function ServicingAreaDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [area, setArea] = useState<ServicingArea>({
    country: 'US',
    stateProvince: null,
    postalCode: null
  })

  useEffect(() => {
    const fetchData = async () => {
      if (id === 'new') {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('servicing_areas')
          .select('country, state_province, postal_code')
          .eq('id', id)
          .single()

        if (error) throw error

        setArea({
          country: data.country,
          stateProvince: data.state_province,
          postalCode: data.postal_code
        })
      } catch (error) {
        console.error('Error fetching servicing area:', error)
        navigate('/servicing-areas')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!area.country) return

    try {
      setSaving(true)

      const areaData = {
        country: area.country,
        state_province: area.stateProvince || null,
        postal_code: area.postalCode || null
      }

      if (id === 'new') {
        const { error } = await supabase
          .from('servicing_areas')
          .insert([areaData])

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('servicing_areas')
          .update(areaData)
          .eq('id', id)

        if (error) throw error
      }

      navigate('/servicing-areas')
    } catch (error) {
      console.error('Error saving servicing area:', error)
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
            onClick={() => navigate('/servicing-areas')}
            className="mr-4 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            {id === 'new' ? 'New Servicing Area' : 'Edit Servicing Area'}
          </h1>
        </div>
        <button
          type="submit"
          form="area-form"
          disabled={saving}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <form id="area-form" onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200 p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                Country
              </label>
              <div className="mt-1">
                <select
                  id="country"
                  name="country"
                  required
                  value={area.country}
                  onChange={(e) => setArea(prev => ({ ...prev, country: e.target.value }))}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="stateProvince" className="block text-sm font-medium text-gray-700">
                State/Province
              </label>
              <div className="mt-1">
                <select
                  id="stateProvince"
                  name="stateProvince"
                  value={area.stateProvince || ''}
                  onChange={(e) => setArea(prev => ({ ...prev, stateProvince: e.target.value || null }))}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="">All States/Provinces</option>
                  {area.country === 'US' ? (
                    <>
                      <option value="AL">Alabama</option>
                      <option value="AK">Alaska</option>
                      <option value="AZ">Arizona</option>
                      <option value="AR">Arkansas</option>
                      <option value="CA">California</option>
                      {/* Add all US states */}
                    </>
                  ) : (
                    <>
                      <option value="AB">Alberta</option>
                      <option value="BC">British Columbia</option>
                      <option value="MB">Manitoba</option>
                      <option value="NB">New Brunswick</option>
                      <option value="NL">Newfoundland and Labrador</option>
                      <option value="NS">Nova Scotia</option>
                      <option value="ON">Ontario</option>
                      <option value="PE">Prince Edward Island</option>
                      <option value="QC">Quebec</option>
                      <option value="SK">Saskatchewan</option>
                      <option value="NT">Northwest Territories</option>
                      <option value="NU">Nunavut</option>
                      <option value="YT">Yukon</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                {area.country === 'US' ? 'ZIP Code' : 'Postal Code'}
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="postalCode"
                  id="postalCode"
                  value={area.postalCode || ''}
                  onChange={(e) => setArea(prev => ({ ...prev, postalCode: e.target.value || null }))}
                  placeholder={area.country === 'US' ? '12345 or 12345-6789' : 'A1A 1A1'}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Leave blank to include all {area.country === 'US' ? 'ZIP' : 'postal'} codes
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ServicingAreaDetail