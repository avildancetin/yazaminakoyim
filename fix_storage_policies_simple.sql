-- ============================================
-- Simple Storage Policies for Avatars (More Permissive for Testing)
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- This creates simpler policies that should definitely work

-- Drop ALL existing policies for avatars bucket
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;

-- 1. Allow authenticated users to upload ANY file to avatars bucket
-- (We'll restrict by path in the application code)
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- 2. Allow authenticated users to update files in avatars bucket
CREATE POLICY "Authenticated users can update avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- 3. Allow authenticated users to delete files in avatars bucket
CREATE POLICY "Authenticated users can delete avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- 4. Allow public to view avatars
CREATE POLICY "Public can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');









