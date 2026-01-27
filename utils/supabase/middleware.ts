import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // CRITICAL: Copy all existing cookies from request to response FIRST
  // This ensures no cookies are lost
  request.cookies.getAll().forEach((cookie) => {
    supabaseResponse.cookies.set(cookie.name, cookie.value, {
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
  })

  // Check if environment variables are set
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If env vars are missing, return response without auth check
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables')
    return { response: supabaseResponse, user: null }
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            request.cookies.set(name, value)
            // Update response cookies with proper options
            supabaseResponse.cookies.set(name, value, {
              ...options,
              // Ensure cookies work on localhost
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
              httpOnly: options?.httpOnly ?? true,
            })
          },
          remove(name: string, options: any) {
            request.cookies.delete(name)
            supabaseResponse.cookies.delete({
              name,
              path: '/',
              ...options,
            })
          },
        },
      }
    )

    // Refresh the session - this may update cookies
    const { data: { user }, error } = await supabase.auth.getUser()
    
    // Only log errors that aren't expected (missing session is normal when not logged in)
    if (error && !error.message.includes('Auth session missing')) {
      console.error('Error getting user in middleware:', error.message)
    }

    return { response: supabaseResponse, user: user || null }
  } catch (error) {
    // If Supabase client creation fails, log error but don't crash
    console.error('Error in updateSession middleware:', error)
    return { response: supabaseResponse, user: null }
  }
}
