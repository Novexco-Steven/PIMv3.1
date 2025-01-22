import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Moon, Sun, Globe } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { AuditTrail } from '../components/user/AuditTrail'

interface UserPreferences {
  id: string
  user_id: string
  theme: 'light' | 'dark'
  language: string
  timezone: string | null
  notifications: Record<string, boolean>
  dashboard_layout: Record<string, boolean>
  created_at: string
  updated_at: string
}

function UserPreferences() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', id)
          .maybeSingle()

        if (error) throw error
        if (!data) {
          setError('Preferences not found')
          return
        }

        setPreferences(data)
      } catch (err) {
        console.error('Error fetching preferences:', err)
        setError('Failed to load preferences')
      } finally {
        setLoading(false)
      }
    }

    fetchPreferences()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!preferences) return

    try {
      setSaving(true)
      setError(null)

      const { error } = await supabase
        .from('user_preferences')
        .update({
          theme: preferences.theme,
          language: preferences.language,
          timezone: preferences.timezone,
          notifications: preferences.notifications,
          dashboard_layout: preferences.dashboard_layout,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', id)

      if (error) throw error

      // Log the update
      await supabase
        .from('user_activity_logs')
        .insert({
          user_id: user?.id,
          action: 'UPDATE',
          resource: 'user_preferences',
          resource_id: id,
          details: {
            event: 'preferences_update',
            changes: {
              theme: preferences.theme,
              language: preferences.language,
              preferences_updated: true
            }
          }
        })

    } catch (err) {
      console.error('Error saving preferences:', err)
      setError('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    )
  }

  if (!preferences) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Preferences not found</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            User Preferences
          </h1>
        </div>
        <button
          type="submit"
          form="preferences-form"
          disabled={saving}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <form id="preferences-form" onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200 p-6">
          <div className="space-y-6">
            {/* Theme Selection */}
            <div>
              <label className="text-base font-medium text-gray-900">Theme</label>
              <p className="text-sm text-gray-500">Choose your preferred theme.</p>
              <div className="mt-4 space-x-4">
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={() => setPreferences(prev => prev ? { ...prev, theme: 'light' } : null)}
                    className={`relative rounded-lg border p-4 flex items-center space-x-3 ${
                      preferences.theme === 'light'
                        ? 'border-indigo-500 ring-2 ring-indigo-500'
                        : 'border-gray-300'
                    }`}
                  >
                    <Sun className={`h-6 w-6 ${
                      preferences.theme === 'light' ? 'text-indigo-600' : 'text-gray-400'
                    }`} />
                    <span className="text-sm font-medium text-gray-900">Light</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreferences(prev => prev ? { ...prev, theme: 'dark' } : null)}
                    className={`relative rounded-lg border p-4 flex items-center space-x-3 ${
                      preferences.theme === 'dark'
                        ? 'border-indigo-500 ring-2 ring-indigo-500'
                        : 'border-gray-300'
                    }`}
                  >
                    <Moon className={`h-6 w-6 ${
                      preferences.theme === 'dark' ? 'text-indigo-600' : 'text-gray-400'
                    }`} />
                    <span className="text-sm font-medium text-gray-900">Dark</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Language Selection */}
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                Language
              </label>
              <div className="mt-1">
                <select
                  id="language"
                  name="language"
                  value={preferences.language}
                  onChange={(e) => setPreferences(prev => prev ? { ...prev, language: e.target.value } : null)}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="pt">Portuguese</option>
                </select>
              </div>
            </div>

            {/* Timezone Selection */}
            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                Timezone
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="timezone"
                  name="timezone"
                  value={preferences.timezone || ''}
                  onChange={(e) => setPreferences(prev => prev ? { ...prev, timezone: e.target.value } : null)}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="">Select a timezone</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                </select>
              </div>
            </div>

            {/* Notification Preferences */}
            <div>
              <label className="text-base font-medium text-gray-900">Notifications</label>
              <p className="text-sm text-gray-500">Choose what notifications you want to receive.</p>
              <div className="mt-4 space-y-4">
                {[
                  { key: 'product_updates', label: 'Product Updates' },
                  { key: 'task_assignments', label: 'Task Assignments' },
                  { key: 'mentions', label: 'Mentions' },
                  { key: 'system_alerts', label: 'System Alerts' }
                ].map(({ key, label }) => (
                  <div key={key} className="relative flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id={key}
                        name={key}
                        type="checkbox"
                        checked={preferences.notifications[key] || false}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev!,
                          notifications: {
                            ...prev!.notifications,
                            [key]: e.target.checked
                          }
                        }))}
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor={key} className="font-medium text-gray-700">
                        {label}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dashboard Layout */}
            <div>
              <label className="text-base font-medium text-gray-900">Dashboard Layout</label>
              <p className="text-sm text-gray-500">Customize your dashboard view.</p>
              <div className="mt-4 space-y-4">
                {[
                  { key: 'show_quick_actions', label: 'Show Quick Actions' },
                  { key: 'show_recent_activity', label: 'Show Recent Activity' },
                  { key: 'show_statistics', label: 'Show Statistics' },
                  { key: 'show_notifications', label: 'Show Notifications Panel' }
                ].map(({ key, label }) => (
                  <div key={key} className="relative flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id={key}
                        name={key}
                        type="checkbox"
                        checked={preferences.dashboard_layout[key] || false}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev!,
                          dashboard_layout: {
                            ...prev!.dashboard_layout,
                            [key]: e.target.checked
                          }
                        }))}
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor={key} className="font-medium text-gray-700">
                        {label}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </form>
      </div>

      <div className="mt-8">
        <AuditTrail resourceType="user_preferences" resourceId={id} />
      </div>
    </div>
  )
}

export default UserPreferences