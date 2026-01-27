-- ============================================
-- Database Migration: Add hidden column to posts
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- This adds a hidden column to allow hiding posts without deleting them

-- Add hidden column to posts table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'hidden'
  ) THEN
    ALTER TABLE public.posts 
    ADD COLUMN hidden BOOLEAN DEFAULT FALSE NOT NULL;
  END IF;
END $$;

-- Create index on hidden for faster queries
CREATE INDEX IF NOT EXISTS posts_hidden_idx ON public.posts(hidden) WHERE hidden = TRUE;
