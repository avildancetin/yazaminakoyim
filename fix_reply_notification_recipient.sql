-- ============================================
-- Fix: reply notifications misattribute the comment
-- ============================================
-- Run this SQL in your Supabase SQL Editor.
--
-- Scenario: person 1 posts, person 2 comments, person 3 replies to person 2's
-- comment. Previously both person 2 (the actual parent-comment author) and
-- person 1 (the post owner, cc'd so they know about activity on their post)
-- got a 'reply' notification, which always renders as "X replied to your
-- comment" -- wrong for person 1, since it's person 2's comment, not theirs.
--
-- Fix: give the post-owner cc notification its own type so it can render
-- "X replied to a comment under your post" instead.

DO $$
BEGIN
  ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

  ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('follow', 'like', 'comment', 'reply', 'reply_to_post', 'tag'));
END $$;

CREATE OR REPLACE FUNCTION public.create_reply_notification()
RETURNS TRIGGER AS $$
DECLARE
  parent_comment_user_id UUID;
  post_owner_id UUID;
BEGIN
  IF NEW.parent_comment_id IS NOT NULL THEN
    SELECT user_id INTO parent_comment_user_id
    FROM public.comments
    WHERE id = NEW.parent_comment_id;

    SELECT user_id INTO post_owner_id
    FROM public.posts
    WHERE id = NEW.post_id;

    -- Notify the parent comment author (if not replying to own comment)
    IF parent_comment_user_id != NEW.user_id THEN
      INSERT INTO public.notifications (user_id, type, actor_id, target_id, comment_id)
      VALUES (parent_comment_user_id, 'reply', NEW.user_id, NEW.post_id, NEW.id);
    END IF;

    -- Also notify the post owner if they're different from both the replier
    -- and the parent comment's author -- as a distinct type, since it's not
    -- their comment being replied to.
    IF post_owner_id != NEW.user_id AND post_owner_id != parent_comment_user_id THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.notifications
        WHERE user_id = post_owner_id
        AND type = 'reply_to_post'
        AND actor_id = NEW.user_id
        AND target_id = NEW.post_id
        AND comment_id = NEW.id
      ) THEN
        INSERT INTO public.notifications (user_id, type, actor_id, target_id, comment_id)
        VALUES (post_owner_id, 'reply_to_post', NEW.user_id, NEW.post_id, NEW.id);
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
