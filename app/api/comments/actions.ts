'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { processCommentTags } from '@/app/api/tags/actions'

export async function createCommentAction(formData: FormData) {
  const postId = formData.get('postId') as string
  const content = formData.get('content') as string
  const parentCommentId = formData.get('parentCommentId') as string | null

  if (!postId || !content?.trim()) {
    return { error: 'Post ID and content are required' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to comment' }
  }

  // Insert comment
  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      user_id: user.id,
      parent_comment_id: parentCommentId || null,
      content: content.trim(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating comment:', error)
    return { error: error.message }
  }

  // Process tags in comment/reply
  if (data) {
    try {
      await processCommentTags(data.id, content.trim(), user.id)
    } catch (tagError) {
      console.error('Error processing comment tags:', tagError)
      // Don't fail comment creation if tagging fails
    }
  }

  revalidatePath('/')
  return { success: true, comment: data }
}

export async function deleteCommentAction(commentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to delete comments' }
  }

  // Verify ownership
  const { data: comment, error: fetchError } = await supabase
    .from('comments')
    .select('user_id')
    .eq('id', commentId)
    .single()

  if (fetchError || !comment) {
    return { error: 'Comment not found' }
  }

  if (comment.user_id !== user.id) {
    return { error: 'You can only delete your own comments' }
  }

  // Delete comment (cascade will handle replies)
  const { error: deleteError } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)

  if (deleteError) {
    console.error('Error deleting comment:', deleteError)
    return { error: deleteError.message }
  }

  revalidatePath('/')
  return { success: true }
}









