'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { processPostTags } from '@/app/api/tags/actions'

export async function publishDraftAction(draftId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to publish drafts' }
  }

  // Verify ownership
  const { data: draft, error: fetchError } = await supabase
    .from('posts')
    .select('user_id, draft')
    .eq('id', draftId)
    .single()

  if (fetchError || !draft) {
    return { error: 'Draft not found' }
  }

  if (draft.user_id !== user.id) {
    return { error: 'You can only publish your own drafts' }
  }

  if (!draft.draft) {
    return { error: 'This post is already published' }
  }

  // Get draft content and media before publishing
  const { data: draftData, error: fetchDraftError } = await supabase
    .from('posts')
    .select('content, media_url')
    .eq('id', draftId)
    .single()

  if (fetchDraftError || !draftData) {
    return { error: 'Failed to fetch draft content' }
  }

  // Validate: If no media, content must be at least 30 characters
  if (!draftData.media_url && (!draftData.content || draftData.content.trim().length < 30)) {
    return { error: 'Posts without media must contain at least 30 characters' }
  }

  // Publish draft (set draft = false)
  const { error: updateError } = await supabase
    .from('posts')
    .update({ draft: false })
    .eq('id', draftId)

  if (updateError) {
    console.error('Error publishing draft:', updateError)
    return { error: updateError.message }
  }

  // Process tags when publishing
  await processPostTags(draftId, draftData.content, user.id)

  revalidatePath('/')
  revalidatePath('/drafts')
  
  return { success: true }
}

export async function updateDraftAction(draftId: string, content: string, mediaUrl: string | null, mediaType: 'image' | 'video' | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to update drafts' }
  }

  // Verify ownership
  const { data: draft, error: fetchError } = await supabase
    .from('posts')
    .select('user_id, draft')
    .eq('id', draftId)
    .single()

  if (fetchError || !draft) {
    return { error: 'Draft not found' }
  }

  if (draft.user_id !== user.id) {
    return { error: 'You can only update your own drafts' }
  }

  if (!draft.draft) {
    return { error: 'This post is already published' }
  }

  // Update draft
  const { error: updateError } = await supabase
    .from('posts')
    .update({ 
      content,
      media_url: mediaUrl,
      media_type: mediaType
    })
    .eq('id', draftId)

  if (updateError) {
    console.error('Error updating draft:', updateError)
    return { error: updateError.message }
  }

  revalidatePath('/drafts')
  
  return { success: true }
}






