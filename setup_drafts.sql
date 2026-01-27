-- ============================================
-- Database Migration: Add Draft Support to Posts
-- ============================================
-- Run this SQL in your Supabase SQL Editor

-- 1. Add draft column to posts table
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS draft BOOLEAN DEFAULT false NOT NULL;

-- 2. Create index on draft and user_id for faster queries
CREATE INDEX IF NOT EXISTS posts_draft_user_id_idx ON public.posts(draft, user_id) WHERE draft = true;

-- 3. Update RLS Policy: Users can only view their own drafts
DROP POLICY IF EXISTS "Users can view all posts" ON public.posts;
CREATE POLICY "Users can view all posts"
ON public.posts
FOR SELECT
USING (
  -- Public posts (draft = false) are visible to everyone
  (draft = false) OR
  -- Drafts are only visible to their owner
  (draft = true AND auth.uid() = user_id)
);






