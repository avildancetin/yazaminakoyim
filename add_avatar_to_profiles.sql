-- ============================================
-- Add avatar_url column to profiles table
-- ============================================
-- Run this SQL in your Supabase SQL Editor

-- Add avatar_url column if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ============================================
-- Create avatars storage bucket (run in Storage section)
-- ============================================
-- Go to Storage > Create Bucket
-- Name: avatars
-- Public: Yes
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/gif, image/webp









