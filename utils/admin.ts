'use server'

import { createClient } from '@/utils/supabase/server'

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return false
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  return profile?.is_admin === true
}

/**
 * Require admin access - throws error if not admin
 */
export async function requireAdmin() {
  const admin = await isAdmin()
  if (!admin) {
    throw new Error('Admin access required')
  }
}
