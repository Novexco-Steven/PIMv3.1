import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search, 
  History,
  ArrowUpDown,
  Users,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { SearchFilters } from '../components/search/SearchFilters'
import { SavedFilters } from '../components/search/SavedFilters'
import { SearchHistory } from '../components/search/SearchHistory'
import { useSearchHistory } from '../hooks/useSearchHistory'
import { useSavedFilters } from '../hooks/useSavedFilters'

interface ActivityLog {
  id: string
  user_id: string
  action: string
  resource: string
  resource_id: string | null
  details: Record<string, any>
  ip_address: string | null
  user_agent: string | null
  created_at: string
  user_email: string
  user_first_name: string
  user_last_name: string
}

function ActivityLogs() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())
  const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory()
  const { savedFilters, saveFilter, deleteFilter } = useSavedFilters()

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase.rpc('get_activity_logs', {
          p_limit: 100,
          p_offset: 0
        })

        if (error) throw error
        setLogs(data)
      } catch (err) {
        console.error('Error fetching activity logs:', err)
        setError('Failed to load activity logs')
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [searchTerm, filters])

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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">Error</h3>
              <p className="mt-1 text-sm text-gray-500">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <History className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-medium text-gray-900">Activity Logs</h2>
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
            placeholder="Search activity logs..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filters */}
        <SearchFilters
          filters={filters}
          filterOptions={[
            {
              id: 'action',
              label: 'Action',
              type: 'select',
              options: [
                { label: 'Create', value: 'INSERT' },
                { label: 'Update', value: 'UPDATE' },
                { label: 'Delete', value: 'DELETE' }
              ]
            },
            {
              id: 'resource',
              label: 'Resource',
              type: 'select',
              options: [
                { label: 'Products', value: 'products' },
                { label: 'Categories', value: 'categories' },
                { label: 'Users', value: 'users' },
                { label: 'Roles', value: 'roles' }
              ]
            }
          ]}
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
                      {log.user_first_name} {log.user_last_name}
                    </h3>
                    <p className="text-sm text-gray-500">{log.user_email}</p>
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">No activity logs</h3>
            <p className="mt-1 text-sm text-gray-500">
              No activities have been recorded yet.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ActivityLogs