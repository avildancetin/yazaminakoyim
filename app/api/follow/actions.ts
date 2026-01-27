'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function followUser(followingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to follow users' }
  }

  if (user.id === followingId) {
    return { error: 'You cannot follow yourself' }
  }

  // Check if already following
  const { data: existingFollow } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', followingId)
    .single()

  if (existingFollow) {
    return { error: 'You are already following this user' }
  }

  // Create follow
  const { error } = await supabase
    .from('follows')
    .insert({
      follower_id: user.id,
      following_id: followingId,
    })

  if (error) {
    return { error: `Failed to follow user: ${error.message}` }
  }

  revalidatePath('/')
  revalidatePath('/following')
  revalidatePath('/notifications')

  return { success: true }
}

export async function unfollowUser(followingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to unfollow users' }
  }

  // Delete follow
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', followingId)

  if (error) {
    return { error: `Failed to unfollow user: ${error.message}` }
  }

  revalidatePath('/')
  revalidatePath('/following')
  revalidatePath('/notifications')

  return { success: true }
}

export async function checkIfFollowing(followingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { isFollowing: false }
  }

  const { data } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', followingId)
    .single()

  return { isFollowing: !!data }
}

