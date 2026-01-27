'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deletePostAction(postId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to delete posts' }
  }

  // Verify ownership
  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', postId)
    .single()

  if (fetchError || !post) {
    return { error: 'Post not found' }
  }

  if (post.user_id !== user.id) {
    return { error: 'You can only delete your own posts' }
  }

  // Delete post (cascade will handle comments)
  const { error: deleteError } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)

  if (deleteError) {
    console.error('Error deleting post:', deleteError)
    return { error: deleteError.message }
  }

  // Revalidate relevant paths
  revalidatePath('/')
  revalidatePath('/following')
  revalidatePath('/profile', 'layout') // Revalidate all profile pages

  return { success: true }
}

