'use server'

import { createClient } from '@/utils/supabase/server'

/**
 * Update the last_seen timestamp for the current user
 * This should be called periodically when the user is active
 */
export async function updateLastSeen() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Update last_seen to current timestamp
  const { error } = await supabase
    .from('profiles')
    .update({ last_seen: new Date().toISOString() })
    .eq('id', user.id)

  if (error) {
    console.error('Error updating last_seen:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}


