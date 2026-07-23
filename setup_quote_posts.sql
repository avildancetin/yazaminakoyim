-- ============================================
-- Setup Quote Posts
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- Lets a post optionally quote another post (retweet-with-comment style)

ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS quoted_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS posts_quoted_post_id_idx ON public.posts(quoted_post_id);

-- ============================================
-- IMPORTANT: Refresh Supabase Schema Cache
-- ============================================
-- After running this migration, refresh Supabase's schema cache
-- (Settings > API > Refresh Schema Cache, or wait a few minutes)
-- so PostgREST recognizes the new quoted_post_id foreign key and
-- embedded selects like `quoted_post:quoted_post_id(...)` work.
