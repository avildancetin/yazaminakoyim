# Admin Panel Setup Guide

## Overview
The admin panel uses a **separate authentication system** independent of regular users. The admin account:
- Has username "admin" and appears as a user in the system
- Is clearly marked with "ADMIN ACCOUNT" badge
- Can be accessed via `/admin-login` with separate credentials
- Cannot be deleted or modified by other admins

## Setup Instructions

### Step 1: Run Database Migrations

1. **Run `setup_admin.sql`** in Supabase SQL Editor (if not already run)
   - This creates the `is_admin` column and `feedback` table

2. **Run `setup_admin_account.sql`** in Supabase SQL Editor
   - This creates the `admin_credentials` table for separate admin login

### Step 2: Create Admin Auth User

1. Go to **Supabase Dashboard > Authentication > Users**
2. Click **"Add User"** or **"Create User"**
3. Set:
   - **Email**: `admin@yazamınakoyim.com` (or your preferred email)
   - **Password**: Set a secure password (you'll use this for the profile)
   - **Auto Confirm User**: Yes
4. **Copy the User ID** that gets created

### Step 3: Create Admin Profile

Run this SQL in Supabase, replacing `USER_ID_HERE` with the User ID from Step 2:

```sql
INSERT INTO public.profiles (id, username, email, is_admin)
VALUES (
  'USER_ID_HERE', -- Replace with the auth user ID
  'admin',
  'admin@yazamınakoyim.com',
  TRUE
)
ON CONFLICT (id) DO UPDATE SET is_admin = TRUE, username = 'admin';
```

### Step 4: Set Admin Login Password

The default password in `setup_admin_account.sql` is **'admin123'**. 

**IMPORTANT: Change this immediately!**

1. Generate a new password hash:
   ```bash
   node scripts/generate-admin-password.js yournewpassword
   ```

2. Update the password in Supabase:
   ```sql
   UPDATE public.admin_credentials 
   SET password_hash = 'GENERATED_HASH_HERE' 
   WHERE username = 'admin';
   ```

## Accessing Admin Panel

1. Navigate to `/admin-login`
2. Enter:
   - **Username**: `admin`
   - **Password**: (the password you set in Step 4)
3. You'll be redirected to `/admin-panel`

## Admin Account Visibility

The admin account:
- ✅ Shows up in user searches and lists
- ✅ Has a profile page at `/profile/admin`
- ✅ Is clearly marked with "ADMIN ACCOUNT" badge (red)
- ✅ Cannot be deleted or have admin privileges revoked
- ✅ Cannot be followed by other users (optional - can be added)

## Admin Panel Features

- **Dashboard** (`/admin-panel`) - Statistics overview
- **Profiles** (`/admin-panel/profiles`) - Manage all users
- **Posts** (`/admin-panel/posts`) - Manage all posts
- **Comments** (`/admin-panel/comments`) - Manage all comments  
- **Feedback** (`/admin-panel/feedback`) - Review user feedback/reports

## Security Notes

- Admin login is completely separate from regular user authentication
- Admin session is stored in HTTP-only cookies
- Admin routes are protected by middleware
- The admin account profile cannot be deleted through the UI
- Change the default password immediately after setup!
