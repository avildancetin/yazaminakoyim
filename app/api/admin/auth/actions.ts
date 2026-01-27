'use server'

import { createClient } from '@/utils/supabase/server'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

const ADMIN_SESSION_COOKIE = 'admin_session'

/**
 * Admin login (separate from regular user auth)
 */
export async function adminLoginAction(username: string, password: string) {
  const supabase = await createClient()

  // Get admin credentials
  const { data: adminCreds, error: credsError } = await supabase
    .from('admin_credentials')
    .select('*')
    .eq('username', username)
    .single()

  if (credsError || !adminCreds) {
    return { success: false, error: 'Invalid username or password' }
  }

  // Verify password
  const isValid = await bcrypt.compare(password, adminCreds.password_hash)
  if (!isValid) {
    return { success: false, error: 'Invalid username or password' }
  }

  // Update last login
  await supabase
    .from('admin_credentials')
    .update({ last_login: new Date().toISOString() })
    .eq('id', adminCreds.id)

  // Set admin session cookie
  const cookieStore = await cookies()
  cookieStore.set(ADMIN_SESSION_COOKIE, adminCreds.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })

  return { success: true, username: adminCreds.username }
}

/**
 * Check if admin is authenticated
 */
export async function checkAdminAuth(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const adminSession = cookieStore.get(ADMIN_SESSION_COOKIE)
    
    if (!adminSession) {
      return false
    }

    // Verify session exists in database
    const supabase = await createClient()
    const { data } = await supabase
      .from('admin_credentials')
      .select('id')
      .eq('id', adminSession.value)
      .single()

    return !!data
  } catch (error) {
    return false
  }
}

/**
 * Admin logout
 */
export async function adminLogoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_SESSION_COOKIE)
  return { success: true }
}
