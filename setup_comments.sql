-- ============================================
-- Database Migration: Setup Comments System
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- This creates the comments table with support for nested replies

-- 1. Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE, -- For nested replies
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Create indexes for faster queries
CREATE INDEX IF NOT EXISTS comments_post_id_idx ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS comments_parent_comment_id_idx ON public.comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS comments_created_at_idx ON public.comments(created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if they exist
DROP POLICY IF EXISTS "Everyone can view all comments" ON public.comments;
DROP POLICY IF EXISTS "Users can create own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;

-- 5. RLS Policy: Everyone can view all comments
CREATE POLICY "Everyone can view all comments"
ON public.comments
FOR SELECT
USING (true);

-- 6. RLS Policy: Users can create their own comments
CREATE POLICY "Users can create own comments"
ON public.comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 7. RLS Policy: Users can update their own comments
CREATE POLICY "Users can update own comments"
ON public.comments
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 8. RLS Policy: Users can delete their own comments
CREATE POLICY "Users can delete own comments"
ON public.comments
FOR DELETE
USING (auth.uid() = user_id);

-- 9. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_comments_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_comments_updated_at ON public.comments;
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_comments_updated_at_column();

-- 11. Update notifications table to support comment and reply types
-- First, check if we need to alter the type constraint
DO $$ 
BEGIN
  -- Drop the existing constraint if it exists
  ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
  
  -- Add new constraint with comment and reply types
  ALTER TABLE public.notifications 
  ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('follow', 'like', 'comment', 'reply'));
END $$;

-- 12. Add comment_id column to notifications for reply notifications
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;

-- 13. Create index for comment_id
CREATE INDEX IF NOT EXISTS notifications_comment_id_idx ON public.notifications(comment_id);

-- 14. Function to create comment notification (when someone comments on a post)
CREATE OR REPLACE FUNCTION public.create_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
BEGIN
  -- Get the post owner's user_id
  SELECT user_id INTO post_owner_id
  FROM public.posts
  WHERE id = NEW.post_id;
  
  -- Don't notify if user is commenting on their own post
  IF post_owner_id != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, actor_id, target_id, comment_id)
    VALUES (post_owner_id, 'comment', NEW.user_id, NEW.post_id, NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Function to create reply notification (when someone replies to a comment)
CREATE OR REPLACE FUNCTION public.create_reply_notification()
RETURNS TRIGGER AS $$
DECLARE
  parent_comment_user_id UUID;
  post_owner_id UUID;
BEGIN
  -- Only process if this is a reply (has parent_comment_id)
  IF NEW.parent_comment_id IS NOT NULL THEN
    -- Get the user who wrote the parent comment
    SELECT user_id INTO parent_comment_user_id
    FROM public.comments
    WHERE id = NEW.parent_comment_id;
    
    -- Get the post owner
    SELECT user_id INTO post_owner_id
    FROM public.posts
    WHERE id = NEW.post_id;
    
    -- Notify the parent comment author (if not replying to own comment)
    IF parent_comment_user_id != NEW.user_id THEN
      INSERT INTO public.notifications (user_id, type, actor_id, target_id, comment_id)
      VALUES (parent_comment_user_id, 'reply', NEW.user_id, NEW.post_id, NEW.id);
    END IF;
    
    -- Also notify the post owner if they're different from commenter and parent commenter
    IF post_owner_id != NEW.user_id AND post_owner_id != parent_comment_user_id THEN
      -- Check if notification already exists (avoid duplicates)
      IF NOT EXISTS (
        SELECT 1 FROM public.notifications
        WHERE user_id = post_owner_id
        AND type = 'reply'
        AND actor_id = NEW.user_id
        AND target_id = NEW.post_id
        AND comment_id = NEW.id
      ) THEN
        INSERT INTO public.notifications (user_id, type, actor_id, target_id, comment_id)
        VALUES (post_owner_id, 'reply', NEW.user_id, NEW.post_id, NEW.id);
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Trigger to create notification on comment
DROP TRIGGER IF EXISTS on_comment_create_notification ON public.comments;
CREATE TRIGGER on_comment_create_notification
  AFTER INSERT ON public.comments
  FOR EACH ROW
  WHEN (NEW.parent_comment_id IS NULL) -- Only for top-level comments
  EXECUTE FUNCTION public.create_comment_notification();

-- 17. Trigger to create notification on reply
DROP TRIGGER IF EXISTS on_reply_create_notification ON public.comments;
CREATE TRIGGER on_reply_create_notification
  AFTER INSERT ON public.comments
  FOR EACH ROW
  WHEN (NEW.parent_comment_id IS NOT NULL) -- Only for replies
  EXECUTE FUNCTION public.create_reply_notification();

-- ============================================
-- Verify the setup
-- ============================================
-- You can test with:
-- SELECT * FROM public.comments ORDER BY created_at DESC;
-- SELECT * FROM public.notifications WHERE type IN ('comment', 'reply') ORDER BY created_at DESC;









