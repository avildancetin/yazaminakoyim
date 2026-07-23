'use server'

import { createClient } from '@/utils/supabase/server'

/**
 * Check which usernames exist in the database
 * Returns a Set of valid usernames (lowercase)
 */
export async function checkUsernamesExist(usernames: string[]): Promise<Set<string>> {
  if (usernames.length === 0) {
    return new Set()
  }

  const supabase = await createClient()
  
  // Normalize usernames to lowercase
  const normalizedUsernames = usernames.map(u => u.toLowerCase())
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('username')
    .in('username', normalizedUsernames)
  
  if (error) {
    console.error('Error checking usernames:', error)
    return new Set()
  }
  
  // Return a Set of valid usernames (already lowercase from DB)
  return new Set((profiles || []).map(p => p.username?.toLowerCase()).filter(Boolean))
}

export interface UsernameSuggestion {
  id: string
  username: string
  avatar_url: string | null
}

/**
 * Search usernames by prefix, for @mention autocomplete
 */
export async function searchUsernames(query: string, limit = 6): Promise<UsernameSuggestion[]> {
  const trimmed = query.trim()
  if (!trimmed) {
    return []
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .not('username', 'is', null)
    .ilike('username', `${trimmed}%`)
    .order('username', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Error searching usernames:', error)
    return []
  }

  return (data || []) as UsernameSuggestion[]
}


