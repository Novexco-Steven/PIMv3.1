import React from 'react'
import { useAuth } from '../../hooks/useAuth'

interface RoleCheckProps {
  role: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleCheck({ 
  role, 
  children, 
  fallback = null 
}: RoleCheckProps) {
  const { hasRole } = useAuth()

  if (!hasRole(role)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}