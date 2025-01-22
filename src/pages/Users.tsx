import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Plus, 
  Search, 
  Users as UsersIcon,
  MoreVertical,
  ArrowUpDown,
  Edit,
  Trash2,
  Mail,
  AlertTriangle
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { SearchFilters } from '../components/search/SearchFilters'
import { SavedFilters } from '../components/search/SavedFilters'
import { SearchHistory } from '../components/search/SearchHistory'
import { useSearchHistory } from '../hooks/useSearchHistory'
import { useSavedFilters } from '../hooks/useSavedFilters'
import { useOptimisticList } from '../hooks/useOptimisticList'
import { useDataCache } from '../hooks/useDataCache'
import { useAuth } from '../hooks/useAuth'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  lastLogin: string
}

export default function Users() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { hasRole, session } = useAuth()
  const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory()
  const { savedFilters, saveFilter, deleteFilter } = useSavedFilters()

  const {
    items: users,
    error: optimisticError,
    removeOptimistically,
    setItems: setUsers
  } = useOptimisticList<User>([])

  const { data: cachedUsers, updateCache } = useDataCache<User[]>(
    'users',
    async () => {
      try {
        if (!session) {
          throw new Error('Please sign in to access this page.')
        }

        if (!hasRole('admin')) {
          throw new Error('You do not have permission to view users. Please contact your administrator.')
        }

        // Get all users from profiles and roles
        const { data: profiles, error: profileError } = await supabase
          .from('user_profiles')
          .select(`
            user_id,
            first_name,
            last_name,
            user:auth.users!user_id (
              email,
              created_at,
              last_sign_in_at
            ),
            roles:user_roles (
              role:roles (
                name
              )
            )
          `)

        if (profileError) throw profileError

        return profiles.map(profile => ({
          id: profile.user_id,
          email: profile.user.email || '',
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          role: profile.roles?.[0]?.role?.name || 'No Role',
          lastLogin: profile.user.last_sign_in_at ? 
            new Date(profile.user.last_sign_in_at).toLocaleDateString() : 
            new Date(profile.user.created_at).toLocaleDateString()
        }))
      } catch (err) {
        const error = err as Error
        setError(error.message)
        return []
      }
    },
    [searchTerm, filters, session]
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
        const { error } = await supabase
          .from('user_profiles')
          .delete()
          .eq('user_id', id)

        if (error) throw error
        updateCache(users.filter(u => u.id !== id))
      })
    } catch (error) {
      setError('Failed to delete user. Please try again.')
    }
  }

  const filterOptions = [
    {
      id: 'role',
      label: 'Role',
      type: 'select' as const,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Manager', value: 'manager' },
        { label: 'Editor', value: 'editor' },
        { label: 'Viewer', value: 'viewer' }
      ]
    },
    {
      id: 'hasProfile',
      label: 'Has Profile',
      type: 'boolean' as const
    },
    {
      id: 'lastLoginAfter',
      label: 'Last Login After',
      type: 'date' as const
    }
  ]

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
              <h3 className="mt-2 text-lg font-medium text-gray-900">Access Error</h3>
              <p className="mt-1 text-sm text-gray-500">
                {error}
              </p>
              <button
                onClick={() => navigate('/')}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Return to Dashboard
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
        <button
          onClick={() => navigate('/users/new')}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </button>
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
            placeholder="Search users..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
          {/* Saved Filters */}
          <SavedFilters
            savedFilters={savedFilters}
            onApplyFilter={(filters) => setFilters(filters)}
            onSaveFilter={saveFilter}
            onDeleteFilter={deleteFilter}
            currentFilters={filters}
          />

          {/* Search History */}
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

      {/* Users Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1 cursor-pointer">
                    <span>User</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr 
                  key={user.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/users/${user.id}/profile`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <UsersIcon className="h-5 w-5 text-gray-500" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Mail className="h-4 w-4 mr-1 text-gray-400" />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-red-100 text-red-800' :
                      user.role === 'manager' ? 'bg-yellow-100 text-yellow-800' :
                      user.role === 'editor' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        className="text-indigo-600 hover:text-indigo-900"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/users/${user.id}/profile`)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-900"
                        onClick={(e) => handleDelete(user.id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button 
                        className="text-gray-400 hover:text-gray-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Handle more options
                        }}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}