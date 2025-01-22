import { useState } from 'react'
import { useOptimisticUpdate } from './useOptimisticUpdate'
import { supabase } from '../lib/supabase'
import { UserPreferences } from '../types/user'

export function useUserPreferences(userId: string) {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const { optimisticData, error, updateOptimistically } = useOptimisticUpdate<UserPreferences>()

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!preferences) return

    const updatedPreferences = { ...preferences, ...updates }

    await updateOptimistically(
      async () => {
        const { error } = await supabase
          .from('user_preferences')
          .update(updates)
          .eq('user_id', userId)

        if (error) throw error
      },
      updatedPreferences,
      () => setPreferences(preferences)
    )

    setPreferences(updatedPreferences)
  }

  const updateTheme = async (theme: 'light' | 'dark') => {
    await updatePreferences({ theme })
  }

  const updateLanguage = async (language: string) => {
    await updatePreferences({ language })
  }

  const updateTimezone = async (timezone: string | null) => {
    await updatePreferences({ timezone })
  }

  const updateNotifications = async (notifications: Record<string, any>) => {
    await updatePreferences({ notifications })
  }

  const updateDashboardLayout = async (layout: Record<string, any>) => {
    await updatePreferences({ dashboard_layout: layout })
  }

  return {
    preferences,
    error,
    setPreferences,
    updatePreferences,
    updateTheme,
    updateLanguage,
    updateTimezone,
    updateNotifications,
    updateDashboardLayout
  }
}