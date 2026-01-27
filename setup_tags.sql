-- ============================================
-- Database Migration: Add Tagging Feature
-- ============================================
-- Run this SQL in your Supabase SQL Editor

-- 1. Create post_tags table to store which users are tagged in which posts
CREATE TABLE IF NOT EXISTS public.post_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  tagged_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(post_id, tagged_user_id) -- Prevent duplicate tags
);

-- 2. Create indexes for post_tags
CREATE INDEX IF NOT EXISTS post_tags_post_id_idx ON public.post_tags(post_id);
CREATE INDEX IF NOT EXISTS post_tags_tagged_user_id_idx ON public.post_tags(tagged_user_id);

-- 3. Enable RLS for post_tags
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for post_tags
-- Everyone can view tags (to see who is tagged in posts)
DROP POLICY IF EXISTS "Everyone can view post tags" ON public.post_tags;
CREATE POLICY "Everyone can view post tags"
ON public.post_tags
FOR SELECT
USING (true);

-- Users can create tags (when creating/editing posts)
DROP POLICY IF EXISTS "Users can create post tags" ON public.post_tags;
CREATE POLICY "Users can create post tags"
ON public.post_tags
FOR INSERT
WITH CHECK (true);

-- Users can delete tags (when editing posts)
DROP POLICY IF EXISTS "Users can delete post tags" ON public.post_tags;
CREATE POLICY "Users can delete post tags"
ON public.post_tags
FOR DELETE
USING (true);

-- 5. Update notifications table to support 'tag' type
DO $$ 
BEGIN
  -- Drop the existing constraint if it exists
  ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
  
  -- Add new constraint with tag type
  ALTER TABLE public.notifications 
  ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('follow', 'like', 'comment', 'reply', 'tag'));
END $$;

-- 6. Function to create tag notification
CREATE OR REPLACE FUNCTION public.create_tag_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Don't notify if user is tagging themselves
  IF NEW.tagged_user_id != (SELECT user_id FROM public.posts WHERE id = NEW.post_id) THEN
    INSERT INTO public.notifications (user_id, type, actor_id, target_id)
    VALUES (NEW.tagged_user_id, 'tag', (SELECT user_id FROM public.posts WHERE id = NEW.post_id), NEW.post_id)
    ON CONFLICT DO NOTHING; -- Prevent duplicate notifications
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Trigger to create notification when a user is tagged
DROP TRIGGER IF EXISTS on_tag_create_notification ON public.post_tags;
CREATE TRIGGER on_tag_create_notification
  AFTER INSERT ON public.post_tags
  FOR EACH ROW
  EXECUTE FUNCTION public.create_tag_notification();

-- ============================================
-- Verify the setup
-- ============================================
-- You can test with:
-- SELECT * FROM public.post_tags ORDER BY created_at DESC;
-- SELECT * FROM public.notifications WHERE type = 'tag' ORDER BY created_at DESC;



