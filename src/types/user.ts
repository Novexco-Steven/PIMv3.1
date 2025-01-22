// User management types
export interface UserProfile {
  id: string
  user_id: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  phone: string | null
  department: string | null
  position: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

export interface UserPreferences {
  id: string
  user_id: string
  theme: 'light' | 'dark'
  language: string
  timezone: string | null
  notifications: Record<string, any>
  dashboard_layout: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Role {
  id: string
  name: string
  description: string | null
  is_system: boolean
  created_at: string
  updated_at: string
}

export interface Permission {
  id: string
  name: string
  description: string | null
  resource: string
  action: string
  created_at: string
}

export interface UserRole {
  id: string
  user_id: string
  role_id: string
  role: Role
  created_at: string
}

export interface UserActivityLog {
  id: string
  user_id: string
  action: string
  resource: string
  resource_id: string | null
  details: Record<string, any>
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface User {
  id: string
  email: string
  created_at: string
  profile: UserProfile
  preferences: UserPreferences
  roles: UserRole[]
}