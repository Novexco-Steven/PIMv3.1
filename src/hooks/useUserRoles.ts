import { useState } from 'react'
import { useOptimisticUpdate } from './useOptimisticUpdate'
import { supabase } from '../lib/supabase'
import { Role } from '../types/user'

export function useUserRoles(userId: string) {
  const [roles, setRoles] = useState<Role[]>([])
  const { optimisticData, error, updateOptimistically } = useOptimisticUpdate<Role[]>()

  const addRole = async (roleId: string) => {
    const role = await supabase
      .from('roles')
      .select('*')
      .eq('id', roleId)
      .single()
      .then(({ data }) => data)

    if (!role) return

    const updatedRoles = [...roles, role]

    await updateOptimistically(
      async () => {
        const { error } = await supabase
          .from('user_roles')
          .insert([{
            user_id: userId,
            role_id: roleId
          }])

        if (error) throw error
      },
      updatedRoles,
      () => setRoles(roles)
    )

    setRoles(updatedRoles)
  }

  const removeRole = async (roleId: string) => {
    const updatedRoles = roles.filter(r => r.id !== roleId)

    await updateOptimistically(
      async () => {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role_id', roleId)

        if (error) throw error
      },
      updatedRoles,
      () => setRoles(roles)
    )

    setRoles(updatedRoles)
  }

  return {
    roles,
    error,
    setRoles,
    addRole,
    removeRole
  }
}