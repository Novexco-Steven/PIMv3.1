import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Camera, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { AuditTrail } from '../components/user/AuditTrail'

interface UserProfile {
  id: string
  user_id: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  phone: string | null
  department: string | null
  position: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

function UserProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', id)
          .maybeSingle()

        if (error) throw error
        if (!data) {
          setError('Profile not found')
          return
        }

        setProfile(data)
      } catch (err) {
        console.error('Error fetching profile:', err)
        setError('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    try {
      setSaving(true)
      setError(null)

      const { error } = await supabase
        .from('user_profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          department: profile.department,
          position: profile.position,
          bio: profile.bio,
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
          resource: 'user_profile',
          resource_id: id,
          details: {
            event: 'profile_update',
            changes: {
              first_name: profile.first_name,
              last_name: profile.last_name,
              profile_updated: true
            }
          }
        })

    } catch (err) {
      console.error('Error saving profile:', err)
      setError('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    try {
      setSaving(true)
      setError(null)

      // Upload avatar to storage
      const fileExt = file.name.split('.').pop()
      const filePath = `avatars/${profile.user_id}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', id)

      if (updateError) throw updateError

      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null)
    } catch (err) {
      console.error('Error uploading avatar:', err)
      setError('Failed to upload avatar')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveAvatar = async () => {
    if (!profile?.avatar_url) return

    try {
      setSaving(true)
      setError(null)

      // Remove avatar from storage
      const filePath = profile.avatar_url.split('/').pop()
      if (filePath) {
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([filePath])

        if (deleteError) throw deleteError
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          avatar_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', id)

      if (updateError) throw updateError

      setProfile(prev => prev ? { ...prev, avatar_url: null } : null)
    } catch (err) {
      console.error('Error removing avatar:', err)
      setError('Failed to remove avatar')
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

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Profile not found</div>
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
            Edit Profile
          </h1>
        </div>
        <button
          type="submit"
          form="profile-form"
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
        <form id="profile-form" onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200 p-6">
          {/* Avatar Section */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Profile Photo
              </label>
              <div className="mt-4 flex items-center space-x-6">
                <div className="relative">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt=""
                      className="h-24 w-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
                      <Camera className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  {profile.avatar_url && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="absolute -top-2 -right-2 p-1 bg-red-100 rounded-full text-red-600 hover:text-red-900"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <label className="cursor-pointer">
                  <span className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    <Camera className="h-4 w-4 mr-2" />
                    Change Photo
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                  />
                </label>
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="first_name"
                    id="first_name"
                    value={profile.first_name || ''}
                    onChange={(e) => setProfile(prev => prev ? { ...prev, first_name: e.target.value } : null)}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="last_name"
                    id="last_name"
                    value={profile.last_name || ''}
                    onChange={(e) => setProfile(prev => prev ? { ...prev, last_name: e.target.value } : null)}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="mt-1">
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={profile.phone || ''}
                    onChange={(e) => setProfile(prev => prev ? { ...prev, phone: e.target.value } : null)}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <div className="mt-1">
                  <select
                    id="department"
                    name="department"
                    value={profile.department || ''}
                    onChange={(e) => setProfile(prev => prev ? { ...prev, department: e.target.value } : null)}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="">Select a department</option>
                    <option value="IT">IT</option>
                    <option value="Sales">Sales</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                  Position
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="position"
                    id="position"
                    value={profile.position || ''}
                    onChange={(e) => setProfile(prev => prev ? { ...prev, position: e.target.value } : null)}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                  Bio
                </label>
                <div className="mt-1">
                  <textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    value={profile.bio || ''}
                    onChange={(e) => setProfile(prev => prev ? { ...prev, bio: e.target.value } : null)}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Brief description for your profile.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>

      <div className="mt-8">
        <AuditTrail resourceType="user_profiles" resourceId={id || ''} />
      </div>
    </div>
  )
}

export default UserProfile