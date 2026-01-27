-- ============================================
-- Fix Username and RLS Policies for Profiles
-- ============================================
-- Run this SQL in your Supabase SQL Editor

-- 1. Ensure users can update their own profiles (RLS Policy)
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 2. Ensure users can insert their own profile (if needed)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- 3. Ensure users can select their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- 4. Allow all authenticated users to view all profiles (for feed)
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
USING (auth.role() = 'authenticated');

-- 5. Update the trigger to also update username on conflict
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', NULL)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = COALESCE(EXCLUDED.username, profiles.username);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- OPTIONAL: Manually update existing profile username
-- ============================================
-- If you have an existing profile with NULL username, you can update it manually:
-- Replace 'your_username_here' with the actual username you want to set
-- Replace 'user_id_here' with the actual user ID from the profiles table

-- UPDATE public.profiles 
-- SET username = 'your_username_here'
-- WHERE id = 'user_id_here' AND username IS NULL;

