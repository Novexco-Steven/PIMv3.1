import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Plus, Trash2, Lock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Role, Permission } from '../types/user'
import { useAuth } from '../hooks/useAuth'
import { AuditTrail } from '../components/user/AuditTrail'

interface RoleWithPermissions extends Role {
  permissions: Permission[]
}

export function RoleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [role, setRole] = useState<RoleWithPermissions>({
    id: '',
    name: '',
    description: '',
    is_system: false,
    created_at: '',
    updated_at: '',
    permissions: []
  })
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null)

        // Check if user has permission to manage roles
        if (!hasPermission('roles', 'manage')) {
          navigate('/roles')
          return
        }

        // Fetch all available permissions
        const { data: permissionsData, error: permissionsError } = await supabase
          .from('permissions')
          .select('*')
          .order('name')

        if (permissionsError) throw permissionsError
        setAvailablePermissions(permissionsData)

        if (id === 'new') {
          setLoading(false)
          return
        }

        // Fetch role data
        const { data: roleData, error: roleError } = await supabase
          .from('roles')
          .select(`
            *,
            permissions:role_permissions(
              permission:permissions(*)
            )
          `)
          .eq('id', id)
          .single()

        if (roleError) throw roleError

        setRole({
          ...roleData,
          permissions: roleData.permissions.map((p: any) => p.permission)
        })
      } catch (error) {
        console.error('Error fetching data:', error)
        setError('Failed to load role data')
        navigate('/roles')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, navigate, hasPermission])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!role.name) return

    try {
      setSaving(true)
      setError(null)

      if (id === 'new') {
        // Create new role
        const { data: newRole, error: roleError } = await supabase
          .from('roles')
          .insert([{
            name: role.name,
            description: role.description,
            is_system: false
          }])
          .select()
          .single()

        if (roleError) throw roleError

        // Add permissions
        if (role.permissions.length > 0) {
          const { error: permissionsError } = await supabase
            .from('role_permissions')
            .insert(
              role.permissions.map(permission => ({
                role_id: newRole.id,
                permission_id: permission.id
              }))
            )

          if (permissionsError) throw permissionsError
        }
      } else {
        // Update role
        const { error: roleError } = await supabase
          .from('roles')
          .update({
            name: role.name,
            description: role.description
          })
          .eq('id', id)

        if (roleError) throw roleError

        // Update permissions
        const { error: deleteError } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role_id', id)

        if (deleteError) throw deleteError

        if (role.permissions.length > 0) {
          const { error: permissionsError } = await supabase
            .from('role_permissions')
            .insert(
              role.permissions.map(permission => ({
                role_id: id,
                permission_id: permission.id
              }))
            )

          if (permissionsError) throw permissionsError
        }
      }

      navigate('/roles')
    } catch (error) {
      console.error('Error saving role:', error)
      setError('Failed to save role')
    } finally {
      setSaving(false)
    }
  }

  const handleTogglePermission = (permission: Permission) => {
    if (role.is_system) return

    setRole(prev => {
      const hasPermission = prev.permissions.some(p => p.id === permission.id)
      return {
        ...prev,
        permissions: hasPermission
          ? prev.permissions.filter(p => p.id !== permission.id)
          : [...prev.permissions, permission]
      }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/roles')}
            className="mr-4 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            {id === 'new' ? 'New Role' : 'Edit Role'}
          </h1>
        </div>
        <button
          type="submit"
          form="role-form"
          disabled={saving || role.is_system}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Trash2 className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <form id="role-form" onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200 p-6">
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
                  disabled={role.is_system}
                  value={role.name}
                  onChange={(e) => setRole(prev => ({ ...prev, name: e.target.value }))}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md disabled:bg-gray-100"
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
                  disabled={role.is_system}
                  value={role.description || ''}
                  onChange={(e) => setRole(prev => ({ ...prev, description: e.target.value }))}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md disabled:bg-gray-100"
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900">Permissions</h3>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {availablePermissions.map((permission) => {
                  const isSelected = role.permissions.some(p => p.id === permission.id)
                  return (
                    <div
                      key={permission.id}
                      className={`relative rounded-lg border p-4 cursor-pointer ${
                        role.is_system ? 'opacity-75 cursor-not-allowed' : ''
                      } ${
                        isSelected
                          ? 'border-indigo-500 ring-2 ring-indigo-500'
                          : 'border-gray-300'
                      }`}
                      onClick={() => !role.is_system && handleTogglePermission(permission)}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <Lock className={`h-5 w-5 ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`} />
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-gray-900">{permission.name}</h4>
                          <p className="mt-1 text-sm text-gray-500">{permission.description}</p>
                          <div className="mt-2 flex items-center space-x-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {permission.resource}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {permission.action}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </form>
      </div>

      {id !== 'new' && (
        <div className="mt-8">
          <AuditTrail resourceType="roles" resourceId={id} />
        </div>
      )}
    </div>
  )
}