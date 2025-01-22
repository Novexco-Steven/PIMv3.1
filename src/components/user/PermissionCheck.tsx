import React from 'react'
import { useAuth } from '../../hooks/useAuth'

interface PermissionCheckProps {
  resource: string
  action: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PermissionCheck({ 
  resource, 
  action, 
  children, 
  fallback = null 
}: PermissionCheckProps) {
  const { hasPermission } = useAuth()

  if (!hasPermission(resource, action)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}