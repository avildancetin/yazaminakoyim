'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function loginAction(formData: FormData) {
  const emailOrUsername = formData.get('email') as string
  const password = formData.get('password') as string
  const next = formData.get('next') as string | null

  console.log('Login attempt for:', emailOrUsername)

  if (!emailOrUsername || !password) {
    return { error: 'Email/Username and password are required' }
  }

  const supabase = await createClient()

  // Check if input is email or username
  let email = emailOrUsername
  const isEmail = emailOrUsername.includes('@')
  
  if (!isEmail) {
    // It's a username, find the email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', emailOrUsername.toLowerCase().trim())
      .single()
    
    if (profileError || !profile) {
      return { error: 'Invalid username or password' }
    }
    
    email = profile.email
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Login error:', error.message)
    return { error: error.message }
  }

  // Check if user needs to confirm email
  if (data.user && !data.session) {
    return { error: 'Please check your email and confirm your account before logging in.' }
  }

  if (!data.session) {
    console.error('Login failed: No session created')
    return { error: 'Login failed: No session created. Please try again.' }
  }

  console.log('Login successful for:', email, 'Session:', !!data.session)

  // Determine redirect URL
  const redirectUrl = next && next.startsWith('/') ? next : '/'
  
  // Revalidate both the current path and the redirect path to ensure fresh data
  revalidatePath('/', 'layout')
  if (redirectUrl !== '/') {
    revalidatePath(redirectUrl, 'page')
  }
  
  // Redirect to the 'next' URL if provided, otherwise redirect to home
  redirect(redirectUrl)
}

export async function signupAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string
  const confirmPassword = formData.get('confirmPassword') as string

  // Validation
  if (!username?.trim()) {
    return { error: 'Username is required' }
  }

  if (username.length < 3) {
    return { error: 'Username must be at least 3 characters' }
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { error: 'Username can only contain letters, numbers, and underscores' }
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match' }
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters' }
  }

  const supabase = await createClient()

  // Check if username exists
  const { data: existingUser, error: checkError } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username.toLowerCase().trim())
    .single()

  if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
    return { error: 'Error checking username availability' }
  }

  if (existingUser) {
    return { error: 'Username already taken' }
  }

  // Sign up with username in metadata
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username.toLowerCase().trim(),
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  // Update profile with username after signup
  if (data.user) {
    // Wait a moment for the trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Try to update the profile with username
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ username: username.toLowerCase().trim() })
      .eq('id', data.user.id)

    if (profileError) {
      console.error('Error updating profile:', profileError)
      // If update fails, try to insert (in case trigger didn't run)
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: email,
          username: username.toLowerCase().trim(),
        })
      
      if (insertError) {
        console.error('Error inserting profile:', insertError)
        return { error: 'Failed to create profile. Please contact support.' }
      }
    }
  }

  return { success: true, message: 'Check your email to confirm your account!' }
}
