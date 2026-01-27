-- ============================================
-- Database Migration: Create Admin Account
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- This creates a separate admin account independent of regular users

-- 1. Create admin_credentials table for separate admin login
CREATE TABLE IF NOT EXISTS public.admin_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, -- Stores bcrypt hash
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_login TIMESTAMPTZ
);

-- 2. Create admin profile that shows up as a user
-- First, create an auth user in Supabase Auth dashboard:
--   - Go to Authentication > Users > Add User
--   - Email: admin@yazamınakoyim.com
--   - Password: (set a secure password)
--   - Copy the User ID that gets created
-- Then run this (replace USER_ID_HERE with the actual user ID):
/*
INSERT INTO public.profiles (id, username, email, is_admin)
VALUES (
  'USER_ID_HERE', -- Replace with the auth user ID from Supabase Auth
  'admin',
  'admin@yazamınakoyim.com',
  TRUE
)
ON CONFLICT (id) DO UPDATE SET is_admin = TRUE, username = 'admin';
*/

-- 3. Generate password hash and insert admin credentials
-- Default password is 'admin123' - CHANGE THIS IMMEDIATELY!
-- To generate a new hash, run: node scripts/generate-admin-password.js yourpassword
-- Then update the hash below:

-- Password hash for 'admin123' (CHANGE THIS!)
-- Run: node scripts/generate-admin-password.js yournewpassword
-- Then update the hash below and run this SQL again
INSERT INTO public.admin_credentials (username, password_hash)
VALUES (
  'admin',
  '$2b$10$Qa1V3x67uRLyhZ22WSvab.YkGgrj9c95/KVJdakw5p7ejNiacQvJS' -- This is 'admin123' - CHANGE IT!
)
ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- 4. Enable RLS for admin_credentials
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policy: Allow reading admin credentials (for login verification)
DROP POLICY IF EXISTS "Allow admin credential reads" ON public.admin_credentials;
CREATE POLICY "Allow admin credential reads"
ON public.admin_credentials
FOR SELECT
USING (true);

-- 6. Create index
CREATE INDEX IF NOT EXISTS admin_credentials_username_idx ON public.admin_credentials(username);
