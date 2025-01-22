import { useState } from 'react'
import { useDataCache } from './useDataCache'
import { supabase } from '../lib/supabase'
import { UserActivityLog } from '../types/user'

interface PaginationState {
  page: number
  pageSize: number
  total: number
}

interface FilterState {
  action?: string
  resource?: string
  dateRange?: {
    from?: string
    to?: string
  }
}

export function useActivityLogs() {
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    total: 0
  })
  const [filters, setFilters] = useState<FilterState>({})
  const [searchTerm, setSearchTerm] = useState('')

  const { data: logs, loading, error, updateCache } = useDataCache<UserActivityLog[]>(
    'activity_logs',
    async () => {
      // First get total count
      const { count, error: countError } = await supabase
        .from('user_activity_logs')
        .select('id', { count: 'exact', head: true })

      if (countError) throw countError

      // Then fetch paginated data
      let query = supabase
        .from('user_activity_logs')
        .select(`
          id,
          user_id,
          action,
          resource,
          resource_id,
          details,
          ip_address,
          user_agent,
          created_at,
          user:auth.users!user_id (
            email,
            profile:user_profiles!inner(
              first_name,
              last_name
            )
          )
        `)
        .order('created_at', { ascending: false })
        .range(
          (pagination.page - 1) * pagination.pageSize,
          pagination.page * pagination.pageSize - 1
        )

      // Apply filters
      if (filters.action) {
        query = query.eq('action', filters.action)
      }
      if (filters.resource) {
        query = query.eq('resource', filters.resource)
      }
      if (filters.dateRange?.from) {
        query = query.gte('created_at', filters.dateRange.from)
      }
      if (filters.dateRange?.to) {
        query = query.lte('created_at', filters.dateRange.to)
      }

      // Apply search
      if (searchTerm) {
        query = query.or(
          `user.email.ilike.%${searchTerm}%,` +
          `user.profile.first_name.ilike.%${searchTerm}%,` +
          `user.profile.last_name.ilike.%${searchTerm}%,` +
          `resource.ilike.%${searchTerm}%`
        )
      }

      const { data, error } = await query
      if (error) throw error

      setPagination(prev => ({ ...prev, total: count || 0 }))
      return data
    },
    [pagination.page, pagination.pageSize, filters, searchTerm]
  )

  const setPage = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  const setPageSize = (pageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize, page: 1 }))
  }

  return {
    logs,
    loading,
    error,
    pagination,
    filters,
    searchTerm,
    setPage,
    setPageSize,
    setFilters,
    setSearchTerm,
    updateCache
  }
}