'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { checkAdminAuth } from './auth/actions'

async function requireAdmin() {
  const isAdmin = await checkAdminAuth()
  if (!isAdmin) {
    throw new Error('Admin access required')
  }
}

/**
 * Delete a profile (admin only)
 */
export async function deleteProfileAction(profileId: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', profileId)

  if (error) {
    return { success: false, error: error.message }
  }

  // Revalidate relevant paths
  revalidatePath('/')
  revalidatePath('/following')
  revalidatePath('/admin/profiles')

  return { success: true }
}

/**
 * Delete a post (admin only)
 */
export async function deletePostAction(postId: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)

  if (error) {
    return { success: false, error: error.message }
  }

  // Revalidate relevant paths
  revalidatePath('/')
  revalidatePath('/following')
  revalidatePath('/profile', 'layout')
  revalidatePath('/admin/posts')

  return { success: true }
}

/**
 * Delete a comment (admin only)
 */
export async function deleteCommentAction(commentId: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)

  if (error) {
    return { success: false, error: error.message }
  }

  // Revalidate relevant paths
  revalidatePath('/')
  revalidatePath('/admin/comments')

  return { success: true }
}

/**
 * Toggle admin status (admin only)
 */
export async function toggleAdminAction(profileId: string, isAdmin: boolean) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from('profiles')
    .update({ is_admin: isAdmin })
    .eq('id', profileId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Update feedback status (admin only)
 */
export async function updateFeedbackStatusAction(
  feedbackId: string,
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed',
  adminNotes?: string
) {
  await requireAdmin()
  const supabase = await createClient()

  const updateData: any = { status }
  if (adminNotes !== undefined) {
    updateData.admin_notes = adminNotes
  }

  const { error } = await supabase
    .from('feedback')
    .update(updateData)
    .eq('id', feedbackId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
