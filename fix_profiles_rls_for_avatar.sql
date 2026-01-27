-- ============================================
-- Fix RLS Policies for Profile Updates (including avatar)
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- This ensures users can update their own profiles including avatar_url

-- 1. Drop existing update policy if it exists
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 2. Create comprehensive update policy that allows updating all profile fields
-- This policy allows users to update their own profile including avatar_url
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND
  -- Ensure user can only update their own profile
  id = auth.uid()
);

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

-- 5. Allow public to view profiles (for posts display)
DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;

CREATE POLICY "Public can view profiles"
ON public.profiles
FOR SELECT
USING (true);

-- 6. Ensure users can insert their own profile (if needed)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

