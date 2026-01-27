-- ============================================
-- Database Migration: Add Admin Role and Feedback System
-- ============================================
-- Run this SQL in your Supabase SQL Editor

-- 1. Add is_admin column to profiles table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN is_admin BOOLEAN DEFAULT FALSE NOT NULL;
  END IF;
END $$;

-- 2. Create feedback/reports table
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('complaint', 'suggestion', 'bug_report', 'other')),
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  related_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  related_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  related_comment_id UUID REFERENCES public.comments(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Create indexes for feedback table
CREATE INDEX IF NOT EXISTS feedback_user_id_idx ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS feedback_status_idx ON public.feedback(status);
CREATE INDEX IF NOT EXISTS feedback_type_idx ON public.feedback(type);
CREATE INDEX IF NOT EXISTS feedback_created_at_idx ON public.feedback(created_at DESC);

-- 4. Enable RLS for feedback table
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for feedback
-- Users can create feedback
DROP POLICY IF EXISTS "Users can create feedback" ON public.feedback;
CREATE POLICY "Users can create feedback"
ON public.feedback
FOR INSERT
WITH CHECK (true);

-- Users can view their own feedback
DROP POLICY IF EXISTS "Users can view own feedback" ON public.feedback;
CREATE POLICY "Users can view own feedback"
ON public.feedback
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all feedback
DROP POLICY IF EXISTS "Admins can view all feedback" ON public.feedback;
CREATE POLICY "Admins can view all feedback"
ON public.feedback
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = TRUE
  )
);

-- Admins can update feedback
DROP POLICY IF EXISTS "Admins can update feedback" ON public.feedback;
CREATE POLICY "Admins can update feedback"
ON public.feedback
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = TRUE
  )
);

-- 6. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for updated_at
DROP TRIGGER IF EXISTS update_feedback_updated_at_trigger ON public.feedback;
CREATE TRIGGER update_feedback_updated_at_trigger
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_updated_at();

-- 8. Create index on profiles.is_admin for faster admin checks
CREATE INDEX IF NOT EXISTS profiles_is_admin_idx ON public.profiles(is_admin) WHERE is_admin = TRUE;
