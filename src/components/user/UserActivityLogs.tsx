import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface PaginationState {
  page: number
  pageSize: number
  total: number
}

export function UserActivityLogs() {
  // Previous state declarations remain the same...
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    total: 0
  })

  useEffect(() => {
    const fetchLogs = async () => {
      try {
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
        setLogs(data)
        setPagination(prev => ({ ...prev, total: count || 0 }))
      } catch (error) {
        console.error('Error fetching activity logs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [searchTerm, filters, pagination.page, pagination.pageSize])

  // Previous helper functions remain the same...

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handlePageSizeChange = (newSize: number) => {
    setPagination(prev => ({ ...prev, pageSize: newSize, page: 1 }))
  }

  // Previous JSX until the table remains the same...

      {/* Activity Logs Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            {/* Previous table head remains the same... */}
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                // Previous table row content remains the same...
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm text-gray-700">
                Show
                <select
                  value={pagination.pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="mx-2 rounded-md border-gray-300 py-1 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                >
                  {[10, 20, 30, 40, 50].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
                entries
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">
                  {Math.min((pagination.page - 1) * pagination.pageSize + 1, pagination.total)}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.pageSize, pagination.total)}
                </span>{' '}
                of{' '}
                <span className="font-medium">{pagination.total}</span>{' '}
                results
              </p>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                {Array.from(
                  { length: Math.ceil(pagination.total / pagination.pageSize) },
                  (_, i) => i + 1
                ).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      pageNum === pagination.page
                        ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
