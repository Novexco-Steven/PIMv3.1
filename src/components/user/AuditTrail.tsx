import React, { useState, useEffect } from 'react'
import { 
  History,
  Search,
  ArrowUpDown,
  Users,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { UserActivityLog } from '../../types/user'
import { SearchFilters } from '../search/SearchFilters'
import { SavedFilters } from '../search/SavedFilters'
import { SearchHistory } from '../search/SearchHistory'
import { useSearchHistory } from '../../hooks/useSearchHistory'
import { useSavedFilters } from '../../hooks/useSavedFilters'

interface AuditTrailProps {
  resourceType: string
  resourceId: string
}

export function AuditTrail({ resourceType, resourceId }: AuditTrailProps) {
  const [logs, setLogs] = useState<UserActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())
  const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory()
  const { savedFilters, saveFilter, deleteFilter } = useSavedFilters()

  const filterOptions = [
    {
      id: 'action',
      label: 'Action',
      type: 'select' as const,
      options: [
        { label: 'Create', value: 'INSERT' },
        { label: 'Update', value: 'UPDATE' },
        { label: 'Delete', value: 'DELETE' }
      ]
    },
    {
      id: 'dateRange',
      label: 'Date Range',
      type: 'daterange' as const
    }
  ]

  useEffect(() => {
    const fetchLogs = async () => {
      try {
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
          .eq('resource', resourceType)
          .eq('resource_id', resourceId)
          .order('created_at', { ascending: false })

        // Apply filters
        if (filters.action) {
          query = query.eq('action', filters.action)
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
            `user.profile.last_name.ilike.%${searchTerm}%`
          )
        }

        const { data, error } = await query

        if (error) throw error
        setLogs(data)
      } catch (error) {
        console.error('Error fetching audit trail:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [resourceType, resourceId, searchTerm, filters])

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    addToHistory(term, filters)
  }

  const toggleLogExpansion = (logId: string) => {
    setExpandedLogs(prev => {
      const next = new Set(prev)
      if (next.has(logId)) {
        next.delete(logId)
      } else {
        next.add(logId)
      }
      return next
    })
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT':
        return 'bg-green-100 text-green-800'
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800'
      case 'DELETE':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <History className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-medium text-gray-900">Audit Trail</h2>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-6 space-y-6">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search audit trail..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {/* Filters */}
        <SearchFilters
          filters={filters}
          filterOptions={filterOptions}
          onFilterChange={setFilters}
          onClearFilters={() => setFilters({})}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SavedFilters
            savedFilters={savedFilters}
            onApplyFilter={(filters) => setFilters(filters)}
            onSaveFilter={saveFilter}
            onDeleteFilter={deleteFilter}
            currentFilters={filters}
          />

          <SearchHistory
            history={history}
            onApplySearch={(query, filters) => {
              setSearchTerm(query)
              setFilters(filters)
            }}
            onClearHistory={clearHistory}
            onRemoveHistoryItem={removeFromHistory}
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
        {logs.map((log) => (
          <div key={log.id} className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <Users className="h-5 w-5 text-gray-500" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {log.user?.profile.first_name} {log.user?.profile.last_name}
                    </h3>
                    <p className="text-sm text-gray-500">{log.user?.email}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <button
                    onClick={() => toggleLogExpansion(log.id)}
                    className="flex items-center text-sm text-gray-500 hover:text-gray-900"
                  >
                    {expandedLogs.has(log.id) ? (
                      <ChevronUp className="h-4 w-4 mr-1" />
                    ) : (
                      <ChevronDown className="h-4 w-4 mr-1" />
                    )}
                    {expandedLogs.has(log.id) ? 'Hide Details' : 'Show Details'}
                  </button>
                  {expandedLogs.has(log.id) && (
                    <div className="mt-2 bg-gray-50 rounded-lg p-4">
                      <pre className="whitespace-pre-wrap font-mono text-xs text-gray-600">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                      <div className="mt-2 text-xs text-gray-500">
                        <div>IP Address: {log.ip_address}</div>
                        <div>User Agent: {log.user_agent}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {logs.length === 0 && (
          <div className="p-6 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No audit trail</h3>
            <p className="mt-1 text-sm text-gray-500">
              No changes have been recorded for this {resourceType}.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}