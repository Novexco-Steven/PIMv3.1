import { useState } from 'react'
import { useOptimisticUpdate } from './useOptimisticUpdate'
import { supabase } from '../lib/supabase'
import { UserProfile } from '../types/user'

export function useUserProfile(userId: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const { optimisticData, error, updateOptimistically } = useOptimisticUpdate<UserProfile>()

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) return

    const updatedProfile = { ...profile, ...updates }

    await updateOptimistically(
      async () => {
        const { error } = await supabase
          .from('user_profiles')
          .update(updates)
          .eq('user_id', userId)

        if (error) throw error
      },
      updatedProfile,
      () => setProfile(profile)
    )

    setProfile(updatedProfile)
  }

  const updateAvatar = async (file: File) => {
    if (!profile) return

    try {
      // Upload avatar to storage
      const fileExt = file.name.split('.').pop()
      const filePath = `avatars/${userId}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update profile with new avatar URL
      await updateProfile({ avatar_url: publicUrl })
    } catch (error) {
      console.error('Error uploading avatar:', error)
      throw error
    }
  }

  const removeAvatar = async () => {
    if (!profile?.avatar_url) return

    try {
      // Remove avatar from storage
      const filePath = profile.avatar_url.split('/').pop()
      if (filePath) {
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([filePath])

        if (deleteError) throw deleteError
      }

      // Update profile
      await updateProfile({ avatar_url: null })
    } catch (error) {
      console.error('Error removing avatar:', error)
      throw error
    }
  }

  return {
    profile,
    error,
    setProfile,
    updateProfile,
    updateAvatar,
    removeAvatar
  }
}