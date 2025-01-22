import React, { useState, useEffect } from 'react'
import { Shield, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Role } from '../../types/user'

interface UserRolesProps {
  userId: string
  onUpdate: () => void
}

export function UserRoles({ userId, onUpdate }: UserRolesProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userRoles, setUserRoles] = useState<Role[]>([])
  const [availableRoles, setAvailableRoles] = useState<Role[]>([])
  const [selectedRole, setSelectedRole] = useState<string>('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user's current roles
        const { data: userRolesData, error: userRolesError } = await supabase
          .from('user_roles')
          .select(`
            role:roles (
              id,
              name,
              description,
              is_system
            )
          `)
          .eq('user_id', userId)

        if (userRolesError) throw userRolesError

        // Fetch all available roles
        const { data: allRoles, error: rolesError } = await supabase
          .from('roles')
          .select('*')
          .order('name')

        if (rolesError) throw rolesError

        setUserRoles(userRolesData.map(ur => ur.role))
        setAvailableRoles(allRoles.filter(role => 
          !userRolesData.some(ur => ur.role.id === role.id)
        ))
      } catch (error) {
        console.error('Error fetching roles:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userId])

  const handleAddRole = async () => {
    if (!selectedRole) return

    try {
      setSaving(true)

      const { error } = await supabase
        .from('user_roles')
        .insert([{
          user_id: userId,
          role_id: selectedRole
        }])

      if (error) throw error

      // Update local state
      const addedRole = availableRoles.find(r => r.id === selectedRole)
      if (addedRole) {
        setUserRoles(prev => [...prev, addedRole])
        setAvailableRoles(prev => prev.filter(r => r.id !== selectedRole))
      }
      setSelectedRole('')
      onUpdate()
    } catch (error) {
      console.error('Error adding role:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveRole = async (roleId: string) => {
    try {
      setSaving(true)

      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role_id', roleId)

      if (error) throw error

      // Update local state
      const removedRole = userRoles.find(r => r.id === roleId)
      if (removedRole) {
        setUserRoles(prev => prev.filter(r => r.id !== roleId))
        setAvailableRoles(prev => [...prev, removedRole])
      }
      onUpdate()
    } catch (error) {
      console.error('Error removing role:', error)
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
        <h3 className="text-lg font-medium text-gray-900">User Roles</h3>
        <div className="flex items-center space-x-2">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">Select a role</option>
            {availableRoles.map(role => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAddRole}
            disabled={!selectedRole || saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Role
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {userRoles.map((role) => (
            <li key={role.id}>
              <div className="px-4 py-4 flex items-center sm:px-6">
                <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Shield className={`h-6 w-6 ${
                        role.is_system ? 'text-yellow-500' : 'text-indigo-500'
                      }`} />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {role.name}
                        {role.is_system && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            System
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        {role.description}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="ml-5 flex-shrink-0">
                  {!role.is_system && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRole(role.id)}
                      disabled={saving}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}

          {userRoles.length === 0 && (
            <li>
              <div className="px-4 py-4 text-sm text-gray-500 text-center">
                No roles assigned
              </div>
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}