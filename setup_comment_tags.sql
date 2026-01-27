-- ============================================
-- Database Migration: Add Tagging to Comments
-- ============================================
-- Run this SQL in your Supabase SQL Editor

-- 1. Create comment_tags table to store which users are tagged in which comments
CREATE TABLE IF NOT EXISTS public.comment_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  tagged_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(comment_id, tagged_user_id) -- Prevent duplicate tags
);

-- 2. Create indexes for comment_tags
CREATE INDEX IF NOT EXISTS comment_tags_comment_id_idx ON public.comment_tags(comment_id);
CREATE INDEX IF NOT EXISTS comment_tags_tagged_user_id_idx ON public.comment_tags(tagged_user_id);

-- 3. Enable RLS for comment_tags
ALTER TABLE public.comment_tags ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for comment_tags
-- Everyone can view tags (to see who is tagged in comments)
DROP POLICY IF EXISTS "Everyone can view comment tags" ON public.comment_tags;
CREATE POLICY "Everyone can view comment tags"
ON public.comment_tags
FOR SELECT
USING (true);

-- Users can create tags (when creating/editing comments)
DROP POLICY IF EXISTS "Users can create comment tags" ON public.comment_tags;
CREATE POLICY "Users can create comment tags"
ON public.comment_tags
FOR INSERT
WITH CHECK (true);

-- Users can delete tags (when editing comments)
DROP POLICY IF EXISTS "Users can delete comment tags" ON public.comment_tags;
CREATE POLICY "Users can delete comment tags"
ON public.comment_tags
FOR DELETE
USING (true);

-- 5. Function to create tag notification for comments
CREATE OR REPLACE FUNCTION public.create_comment_tag_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_id_val UUID;
  comment_author_id UUID;
BEGIN
  -- Get the comment author and post_id
  SELECT user_id, post_id INTO comment_author_id, post_id_val
  FROM public.comments
  WHERE id = NEW.comment_id;
  
  -- Don't notify if user is tagging themselves
  IF NEW.tagged_user_id != comment_author_id THEN
    INSERT INTO public.notifications (user_id, type, actor_id, target_id, comment_id)
    VALUES (
      NEW.tagged_user_id, 
      'tag', 
      comment_author_id, 
      post_id_val,
      NEW.comment_id
    )
    ON CONFLICT DO NOTHING; -- Prevent duplicate notifications
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger to create notification when a user is tagged in a comment
DROP TRIGGER IF EXISTS on_comment_tag_create_notification ON public.comment_tags;
CREATE TRIGGER on_comment_tag_create_notification
  AFTER INSERT ON public.comment_tags
  FOR EACH ROW
  EXECUTE FUNCTION public.create_comment_tag_notification();

-- ============================================
-- Verify the setup
-- ============================================
-- You can test with:
-- SELECT * FROM public.comment_tags ORDER BY created_at DESC;
-- SELECT * FROM public.notifications WHERE type = 'tag' AND comment_id IS NOT NULL ORDER BY created_at DESC;

