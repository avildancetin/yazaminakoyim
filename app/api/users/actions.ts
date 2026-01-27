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


