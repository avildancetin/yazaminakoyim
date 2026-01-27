-- ============================================
-- Database Migration: Add last_seen to profiles
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- This adds a last_seen timestamp column to track when users were last online

-- Add last_seen column to profiles table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'last_seen'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN last_seen TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Create index on last_seen for faster queries
CREATE INDEX IF NOT EXISTS profiles_last_seen_idx ON public.profiles(last_seen DESC);

-- Update existing profiles to have last_seen = NOW() if NULL
UPDATE public.profiles 
SET last_seen = NOW() 
WHERE last_seen IS NULL;


