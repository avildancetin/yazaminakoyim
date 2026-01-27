# Setup Instructions for Username Feature

## Step 1: Run Database Migration

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run the SQL code from `database_migration.sql`:

```sql
-- Add username column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Create index for faster username lookups
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);

-- Update the trigger function to include username
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
```

## Step 2: Configure Supabase Auth Redirect URL

1. Go to **Authentication** → **URL Configuration** in Supabase Dashboard
2. Add these **Redirect URLs**:
   - `http://localhost:/auth/callback`
   - `http://localhost:3001/auth/callback` (if using port 3001)
   - Your production URL: `https://yourdomain.com/auth/callback`

## Step 3: Test the Application

1. Start your dev server: `npm run dev`
2. Try signing up with:
   - A unique username (3+ characters, letters/numbers/underscores only)
   - Email
   - Password (6+ characters)
   - Confirm password (must match)
3. Check your email and confirm the account
4. Log in - you should be redirected to the home page
5. Create a post and verify your username appears instead of email

## Features Added

✅ Username field in signup form
✅ Username uniqueness validation
✅ Password confirmation field
✅ Username validation (min 3 chars, alphanumeric + underscore only)
✅ Login navigation fix (uses window.location.href for proper redirect)
✅ Email confirmation callback handler
✅ Username display in posts (shows @username instead of email)

## Troubleshooting

- **Username already taken**: The system checks for existing usernames before signup
- **Login not redirecting**: Make sure the callback route is configured in Supabase
- **Username not showing**: Verify the database migration ran successfully
















