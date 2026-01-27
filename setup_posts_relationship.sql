-- ============================================
-- Database Migration: Setup Posts Table and Relationship
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- This creates the posts table and establishes the relationship with profiles

-- 1. Create posts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 1a. Add foreign key constraint with explicit name (if table already exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'posts_user_id_fkey'
  ) THEN
    ALTER TABLE public.posts 
    ADD CONSTRAINT posts_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.profiles(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS posts_user_id_idx ON public.posts(user_id);

-- 3. Create index on created_at for ordering
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON public.posts(created_at DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all posts" ON public.posts;
DROP POLICY IF EXISTS "Users can create own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;

-- 6. RLS Policy: Everyone can view all posts (public access)
CREATE POLICY "Everyone can view all posts"
ON public.posts
FOR SELECT
USING (true);

-- 7. RLS Policy: Users can create their own posts
CREATE POLICY "Users can create own posts"
ON public.posts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 8. RLS Policy: Users can update their own posts
CREATE POLICY "Users can update own posts"
ON public.posts
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 9. RLS Policy: Users can delete their own posts
CREATE POLICY "Users can delete own posts"
ON public.posts
FOR DELETE
USING (auth.uid() = user_id);

-- 10. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts;
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- IMPORTANT: Refresh Supabase Schema Cache
-- ============================================
-- After running this migration, you may need to refresh Supabase's schema cache
-- Go to: Settings > API > Refresh Schema Cache (or wait a few minutes)
-- This allows Supabase to detect the new foreign key relationship

-- ============================================
-- Verify the relationship
-- ============================================
-- You can run this query to verify the relationship works:
-- SELECT 
--   p.id,
--   p.content,
--   p.created_at,
--   pr.email,
--   pr.username
-- FROM public.posts p
-- JOIN public.profiles pr ON p.user_id = pr.id
-- ORDER BY p.created_at DESC;

