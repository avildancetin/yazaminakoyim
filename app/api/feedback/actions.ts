'use server'

import { createClient } from '@/utils/supabase/server'

/**
 * Submit feedback/report
 */
export async function submitFeedbackAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const type = formData.get('type') as string
  const subject = formData.get('subject') as string
  const content = formData.get('content') as string
  const relatedUserId = formData.get('related_user_id') as string | null
  const relatedPostId = formData.get('related_post_id') as string | null
  const relatedCommentId = formData.get('related_comment_id') as string | null

  if (!type || !subject || !content) {
    return { success: false, error: 'All fields are required' }
  }

  const feedbackData: any = {
    type,
    subject,
    content,
    user_id: user?.id || null,
    related_user_id: relatedUserId || null,
    related_post_id: relatedPostId || null,
    related_comment_id: relatedCommentId || null,
    status: 'pending'
  }

  const { error } = await supabase
    .from('feedback')
    .insert(feedbackData)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
