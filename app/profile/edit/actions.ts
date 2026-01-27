'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfileAction(formData: FormData) {
  const username = formData.get('username') as string
  const senKimsinAmk = formData.get('senKimsinAmk') as string | null
  const currentlyReading = formData.get('currentlyReading') as string | null
  const avatarFile = formData.get('avatar') as File | null
  const currentAvatarUrl = formData.get('currentAvatarUrl') as string | null
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to update your profile' }
  }

  // Validate username
  if (username.length < 3) {
    return { error: 'Username must be at least 3 characters' }
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { error: 'Username can only contain letters, numbers, and underscores' }
  }

  // Check if username is taken by another user
  const { data: existingProfile, error: checkError } = await supabase
    .from('profiles')
    .select('username, id')
    .eq('username', username.toLowerCase().trim())
    .single()

  if (checkError && checkError.code !== 'PGRST116') {
    return { error: 'Error checking username availability' }
  }

  if (existingProfile && existingProfile.id !== user.id) {
    return { error: 'Username already taken' }
  }

  let avatarUrl = currentAvatarUrl

  // Upload avatar if provided
  if (avatarFile && avatarFile.size > 0) {
    const fileExt = avatarFile.name.split('.').pop()
    // Path should NOT include bucket name since we use .from('avatars')
    const filePath = `${user.id}/avatar.${fileExt}`

    // Delete old avatar if exists
    if (currentAvatarUrl) {
      try {
        // Extract path from URL: get the part after /avatars/
        const urlParts = currentAvatarUrl.split('/avatars/')
        if (urlParts.length > 1) {
          const oldPath = urlParts[1]
          await supabase.storage
            .from('avatars')
            .remove([oldPath])
        }
      } catch (err) {
        // Ignore errors when deleting old avatar
      }
    }

    // Upload new avatar
    console.log('Uploading avatar to path:', filePath, 'for user:', user.id)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, avatarFile, {
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      console.error('Upload error details:', {
        message: uploadError.message,
        error: uploadError,
        path: filePath,
        userId: user.id
      })
      return { error: `Failed to upload avatar: ${uploadError.message}` }
    }

    console.log('Upload successful:', uploadData)

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    avatarUrl = urlData.publicUrl
  }

  // Update profile
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      username: username.toLowerCase().trim(),
      sen_kimsin_amk: senKimsinAmk?.trim() || null,
      currently_reading: currentlyReading?.trim() || null,
      avatar_url: avatarUrl,
    })
    .eq('id', user.id)

  if (updateError) {
    return { error: `Failed to update profile: ${updateError.message}` }
  }

  revalidatePath('/profile/edit')
  revalidatePath('/')

  return { success: true }
}

export async function changePasswordAction(formData: FormData) {
  const currentPassword = formData.get('currentPassword') as string
  const newPassword = formData.get('newPassword') as string
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.email) {
    return { error: 'You must be logged in to change your password' }
  }

  // Verify current password by attempting to sign in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })

  if (signInError) {
    return { error: 'Current password is incorrect' }
  }

  // Update password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (updateError) {
    return { error: `Failed to change password: ${updateError.message}` }
  }

  return { success: true }
}

