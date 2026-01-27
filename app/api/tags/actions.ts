'use server'

import { createClient } from '@/utils/supabase/server'
import { parseMentions } from '@/utils/parseMentions'

/**
 * Process tags for a post
 * - Parses @mentions from content
 * - Finds user IDs for mentioned usernames
 * - Creates post_tags records
 * - Notifications are created automatically via database trigger
 */
export async function processPostTags(postId: string, content: string, postAuthorId: string) {
  const supabase = await createClient()
  
  // Parse mentions from content
  const mentionedUsernames = parseMentions(content)
  
  if (mentionedUsernames.length === 0) {
    return { success: true, taggedCount: 0 }
  }
  
  // Find user IDs for mentioned usernames
  // Note: usernames are stored in lowercase in the database
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username')
    .in('username', mentionedUsernames)
  
  if (profilesError) {
    console.error('Error fetching profiles for tags:', profilesError)
    // Check if it's a table/column error (migration not run)
    if (profilesError.message.includes('relation') || profilesError.message.includes('column')) {
      return { success: false, error: 'Database migration not run. Please run setup_tags.sql in Supabase.' }
    }
    return { success: false, error: profilesError.message }
  }
  
  if (!profiles || profiles.length === 0) {
    console.log('No profiles found for usernames:', mentionedUsernames)
    return { success: true, taggedCount: 0 }
  }
  
  // Filter out the post author (don't tag yourself)
  const taggedUserIds = profiles
    .filter(profile => profile.id !== postAuthorId && profile.username)
    .map(profile => profile.id)
  
  if (taggedUserIds.length === 0) {
    return { success: true, taggedCount: 0 }
  }
  
  // Create post_tags records
  const tagsToInsert = taggedUserIds.map(taggedUserId => ({
    post_id: postId,
    tagged_user_id: taggedUserId
  }))
  
  const { error: tagsError } = await supabase
    .from('post_tags')
    .insert(tagsToInsert)
  
  if (tagsError) {
    // Check if it's a table error (migration not run)
    if (tagsError.message.includes('relation') || tagsError.message.includes('does not exist')) {
      console.error('post_tags table does not exist. Please run setup_tags.sql migration.')
      return { success: false, error: 'Database migration not run. Please run setup_tags.sql in Supabase.' }
    }
    // If some tags already exist, that's okay (UNIQUE constraint)
    // Only log if it's a different error
    if (!tagsError.message.includes('duplicate') && !tagsError.message.includes('unique')) {
      console.error('Error creating post tags:', tagsError)
      return { success: false, error: tagsError.message }
    }
  }
  
  console.log(`Successfully created ${taggedUserIds.length} tag(s) for post ${postId}`)
  
  return { success: true, taggedCount: taggedUserIds.length }
}

/**
 * Update tags for a post (used when editing)
 * - Removes old tags
 * - Creates new tags based on current content
 */
export async function updatePostTags(postId: string, content: string, postAuthorId: string) {
  const supabase = await createClient()
  
  // First, delete all existing tags for this post
  const { error: deleteError } = await supabase
    .from('post_tags')
    .delete()
    .eq('post_id', postId)
  
  if (deleteError) {
    console.error('Error deleting old tags:', deleteError)
    // Continue anyway, try to create new tags
  }
  
  // Then process new tags
  return await processPostTags(postId, content, postAuthorId)
}

/**
 * Process tags for a comment/reply
 * - Parses @mentions from content
 * - Finds user IDs for mentioned usernames
 * - Creates comment_tags records
 * - Notifications are created automatically via database trigger
 */
export async function processCommentTags(commentId: string, content: string, commentAuthorId: string) {
  const supabase = await createClient()
  
  // Parse mentions from content
  const mentionedUsernames = parseMentions(content)
  
  if (mentionedUsernames.length === 0) {
    return { success: true, taggedCount: 0 }
  }
  
  // Find user IDs for mentioned usernames
  // Note: usernames are stored in lowercase in the database
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username')
    .in('username', mentionedUsernames)
  
  if (profilesError) {
    console.error('Error fetching profiles for comment tags:', profilesError)
    // Check if it's a table/column error (migration not run)
    if (profilesError.message.includes('relation') || profilesError.message.includes('column')) {
      return { success: false, error: 'Database migration not run. Please run setup_comment_tags.sql in Supabase.' }
    }
    return { success: false, error: profilesError.message }
  }
  
  if (!profiles || profiles.length === 0) {
    console.log('No profiles found for usernames:', mentionedUsernames)
    return { success: true, taggedCount: 0 }
  }
  
  // Filter out the comment author (don't tag yourself)
  const taggedUserIds = profiles
    .filter(profile => profile.id !== commentAuthorId && profile.username)
    .map(profile => profile.id)
  
  if (taggedUserIds.length === 0) {
    return { success: true, taggedCount: 0 }
  }
  
  // Create comment_tags records
  const tagsToInsert = taggedUserIds.map(taggedUserId => ({
    comment_id: commentId,
    tagged_user_id: taggedUserId
  }))
  
  const { error: tagsError } = await supabase
    .from('comment_tags')
    .insert(tagsToInsert)
  
  if (tagsError) {
    // Check if it's a table error (migration not run)
    if (tagsError.message.includes('relation') || tagsError.message.includes('does not exist')) {
      console.error('comment_tags table does not exist. Please run setup_comment_tags.sql migration.')
      return { success: false, error: 'Database migration not run. Please run setup_comment_tags.sql in Supabase.' }
    }
    // If some tags already exist, that's okay (UNIQUE constraint)
    // Only log if it's a different error
    if (!tagsError.message.includes('duplicate') && !tagsError.message.includes('unique')) {
      console.error('Error creating comment tags:', tagsError)
      return { success: false, error: tagsError.message }
    }
  }
  
  console.log(`Successfully created ${taggedUserIds.length} tag(s) for comment ${commentId}`)
  return { success: true, taggedCount: taggedUserIds.length }
}

