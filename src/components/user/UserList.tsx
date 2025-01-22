import React, { useState, useEffect } from 'react'
import { useOptimisticList } from '../../hooks/useOptimisticList'
import { useDataCache } from '../../hooks/useDataCache'
import { supabase } from '../../lib/supabase'

// ... existing imports remain the same ...

export function UserList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory()
  const { savedFilters, saveFilter, deleteFilter } = useSavedFilters()

  const {
    items: users,
    error,
    removeOptimistically,
    setItems: setUsers
  } = useOptimisticList<User>([])

  const { data: cachedUsers, updateCache } = useDataCache<User[]>(
    'users',
    async () => {
      const { data, error } = await supabase
        .from('auth.users')
        .select(`
          id,
          email,
          created_at,
          profile:user_profiles!inner(*),
          preferences:user_preferences!inner(*),
          roles:user_roles!inner(
            id,
            role:roles!inner(
              id,
              name,
              description,
              is_system
            )
          )
        `)

      if (error) throw error
      return data
    },
    [searchTerm, filters]
  )

  useEffect(() => {
    if (cachedUsers) {
      setUsers(cachedUsers)
      setLoading(false)
    }
  }, [cachedUsers, setUsers])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      await removeOptimistically(id, async () => {
        const { error } = await supabase.auth.admin.deleteUser(id)
        if (error) throw error
        updateCache(users.filter(u => u.id !== id))
      })
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  // ... rest of the component remains the same ...
}