import React from 'react'
import { Lock } from 'lucide-react'
import { Permission } from '../../types/user'

interface UserPermissionsProps {
  permissions: Permission[]
}

export function UserPermissions({ permissions }: UserPermissionsProps) {
  // Group permissions by resource
  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = []
    }
    acc[permission.resource].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">User Permissions</h3>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {Object.entries(groupedPermissions).map(([resource, permissions]) => (
          <div key={resource} className="border-t border-gray-200 first:border-t-0">
            <div className="bg-gray-50 px-4 py-3">
              <h4 className="text-sm font-medium text-gray-900 uppercase">
                {resource}
              </h4>
            </div>
            <div className="px-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {permissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="relative rounded-lg border border-gray-300 bg-white px-4 py-3 shadow-sm flex items-start space-x-3"
                  >
                    <div className="flex-shrink-0">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {permission.name}
                      </p>
                      {permission.description && (
                        <p className="text-sm text-gray-500">
                          {permission.description}
                        </p>
                      )}
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {permission.action}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {Object.keys(groupedPermissions).length === 0 && (
          <div className="px-4 py-4 text-sm text-gray-500 text-center">
            No permissions available
          </div>
        )}
      </div>
    </div>
  )
}