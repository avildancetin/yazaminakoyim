-- ============================================
-- Update RLS Policy: Allow Everyone to View Posts
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- This allows unauthenticated users to view posts

-- Drop the old policy that only allowed authenticated users
DROP POLICY IF EXISTS "Users can view all posts" ON public.posts;

-- Create new policy that allows everyone to view posts
CREATE POLICY "Everyone can view all posts"
ON public.posts
FOR SELECT
USING (true);









