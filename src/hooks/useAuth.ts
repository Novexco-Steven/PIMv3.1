import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { User, Role, Permission } from '../types/user'

interface UseAuthReturn {
  user: User | null
  roles: Role[]
  permissions: Permission[]
  loading: boolean
  error: Error | null
  hasPermission: (resource: string, action: string) => boolean
  hasRole: (roleName: string) => boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchUserData = async (userId: string) => {
    try {
      // Get auth user data first
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError

      // Then fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (profileError) throw profileError

      // Then fetch user preferences
      const { data: preferencesData, error: preferencesError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (preferencesError) throw preferencesError

      // Finally fetch roles and permissions
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          role:roles (
            id,
            name,
            description,
            is_system,
            permissions:role_permissions (
              permission:permissions (*)
            )
          )
        `)
        .eq('user_id', userId)

      if (rolesError) throw rolesError

      // Extract roles and permissions
      const userRoles = rolesData.map(ur => ur.role)
      const userPermissions = rolesData.flatMap(ur => 
        ur.role.permissions.map(rp => rp.permission)
      )

      return {
        id: userId,
        email: authUser?.email || '',
        created_at: authUser?.created_at || '',
        profile: profileData || null,
        preferences: preferencesData || null,
        roles: userRoles,
        permissions: userPermissions
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      throw error
    }
  }

  useEffect(() => {
    // Check for existing session
    const initializeAuth = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError

        if (session?.user) {
          const userData = await fetchUserData(session.user.id)
          setUser(userData)
          setRoles(userData.roles)
          setPermissions(userData.permissions)
        } else {
          setUser(null)
          setRoles([])
          setPermissions([])
        }
      } catch (err) {
        console.error('Error initializing auth:', err)
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        setLoading(true)
        setError(null)

        if (event === 'SIGNED_IN' && session?.user) {
          const userData = await fetchUserData(session.user.id)
          setUser(userData)
          setRoles(userData.roles)
          setPermissions(userData.permissions)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setRoles([])
          setPermissions([])
        }
      } catch (err) {
        console.error('Error handling auth change:', err)
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    })

    // Cleanup subscription
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setError(null)
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    } catch (err) {
      console.error('Error signing in:', err)
      setError(err as Error)
      throw err
    }
  }

  const signOut = async () => {
    try {
      setError(null)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (err) {
      console.error('Error signing out:', err)
      setError(err as Error)
      throw err
    }
  }

  const hasPermission = (resource: string, action: string): boolean => {
    return permissions.some(p => p.resource === resource && p.action === action)
  }

  const hasRole = (roleName: string): boolean => {
    return roles.some(r => r.name === roleName)
  }

  return {
    user,
    roles,
    permissions,
    loading,
    error,
    hasPermission,
    hasRole,
    signIn,
    signOut
  }
}