import React, { useState, useEffect } from 'react'
import { useOptimisticList } from '../../hooks/useOptimisticList'
import { useNavigate } from 'react-router-dom'
import { useDataCache } from '../../hooks/useDataCache'
import { supabase } from '../../lib/supabase'
import { useSavedFilters } from '../../hooks/useSavedFilters'

interface RoleWithPermissions {
  id: string
  name: string
  description: string
  is_system: boolean
  created_at: string
  updated_at: string
  permissions: Permission[]
  userCount: number
}

interface Permission {
  id: string
  name: string
  description: string
}

// ... existing imports remain the same ...

export function RoleList() {
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory()
  const { savedFilters, saveFilter, deleteFilter } = useSavedFilters()

  const {
    items: roles,
    error,
    removeOptimistically,
    setItems: setRoles
  } = useOptimisticList<RoleWithPermissions>([])

  const { data: cachedRoles, updateCache } = useDataCache<RoleWithPermissions[]>(
    'roles',
    async () => {
      const { data, error } = await supabase
        .from('roles')
        .select(`
          id,
          name,
          description,
          is_system,
          created_at,
          updated_at,
          permissions:role_permissions(
            permission:permissions(*)
          ),
          users:user_roles(count)
        `)
        .order('name')

      if (error) throw error

      return data.map(role => ({
        ...role,
        permissions: role.permissions.map((p: any) => p.permission),
        userCount: role.users?.[0]?.count || 0
      }))
    },
    [searchTerm, filters]
    [filters]

  useEffect(() => {
    if (cachedRoles) {
      setRoles(cachedRoles)
      setLoading(false)
    }
  }, [cachedRoles, setRoles])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this role?')) return

    try {
      await removeOptimistically(id, async () => {
        const { error } = await supabase
          .from('roles')
          .delete()
          .eq('id', id)

        if (error) throw error
        updateCache(roles.filter(r => r.id !== id))
      })
    } catch (error) {
      console.error('Error deleting role:', error)
    }
  }

  // ... rest of the component remains the same ...
}
function useSearchHistory(): { history: any; addToHistory: any; removeFromHistory: any; clearHistory: any } {
  const [history, setHistory] = useState<string[]>([])

  const addToHistory = (searchTerm: string) => {
    setHistory(prevHistory => [...prevHistory, searchTerm])
  }

  const removeFromHistory = (searchTerm: string) => {
    setHistory(prevHistory => prevHistory.filter(term => term !== searchTerm))
  }

  const clearHistory = () => {
    setHistory([])
  }

  return { history, addToHistory, removeFromHistory, clearHistory }
}

