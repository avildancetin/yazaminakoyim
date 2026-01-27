-- ============================================
-- Database Migration: Add username to profiles
-- ============================================
-- Run this SQL in your Supabase SQL Editor

-- Add username column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Create index for faster username lookups
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);

-- Update the trigger function to include username
-- The username will be set via the application after signup
-- This trigger creates the profile, and the app updates it with username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', NULL)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add constraint to ensure username is not empty if provided
ALTER TABLE public.profiles 
ADD CONSTRAINT username_not_empty 
CHECK (username IS NULL OR LENGTH(TRIM(username)) > 0);

