-- ============================================
-- Setup Storage Policies for Avatars Bucket
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- This allows authenticated users to upload and manage their own avatars
-- IMPORTANT: Delete existing policies first if they exist

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;

-- 1. Allow authenticated users to upload avatars to their own folder
-- Path format in storage: {user_id}/avatar.{ext} (bucket name is not in the path)
CREATE POLICY "Users can upload own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- 2. Allow authenticated users to update their own avatars
CREATE POLICY "Users can update own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- 3. Allow authenticated users to delete their own avatars
CREATE POLICY "Users can delete own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- 4. Allow public to view avatars (for displaying in posts)
CREATE POLICY "Public can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

