# Admin Panel - Complete Setup

## ✅ What's Been Created

### Separate Admin Authentication System
- **Admin Login Page**: `/admin-login` - Separate login page with username/password
- **Admin Panel**: `/admin-panel` - Protected admin dashboard
- **Admin Account**: Username "admin" - Shows up as a user but clearly marked

### Admin Features
- ✅ View and manage all profiles (with search)
- ✅ View profile details (posts, drafts, followers, following, comments)
- ✅ Delete profiles (except admin account)
- ✅ Grant/revoke admin privileges to users
- ✅ View and manage all posts (with filtering)
- ✅ Delete posts
- ✅ View and manage all comments
- ✅ Delete comments
- ✅ Review user feedback/reports
- ✅ Update feedback status and add admin notes

### User Feedback System
- **User Feedback Page**: `/feedback` - Users can submit complaints, suggestions, bug reports
- **Admin Feedback Management**: `/admin-panel/feedback` - Review and respond to feedback

## 🚀 Setup Steps

### 1. Install Dependencies
```bash
npm install bcryptjs @types/bcryptjs
```

### 2. Run Database Migrations

**In Supabase SQL Editor, run in order:**

1. **`setup_admin.sql`** - Creates admin role and feedback table
2. **`setup_admin_account.sql`** - Creates admin credentials table

### 3. Create Admin Auth User

1. Go to **Supabase Dashboard > Authentication > Users**
2. Click **"Add User"**
3. Set:
   - Email: `admin@yazamınakoyim.com`
   - Password: (choose a secure password)
   - Auto Confirm: Yes
4. **Copy the User ID** that gets created

### 4. Create Admin Profile

Run this SQL (replace `USER_ID_HERE` with the User ID from step 3):

```sql
INSERT INTO public.profiles (id, username, email, is_admin)
VALUES (
  'USER_ID_HERE',
  'admin',
  'admin@yazamınakoyim.com',
  TRUE
)
ON CONFLICT (id) DO UPDATE SET is_admin = TRUE, username = 'admin';
```

### 5. Set Admin Login Password

**Default password is 'admin123' - CHANGE THIS!**

1. Generate a new password hash:
   ```bash
   node scripts/generate-admin-password.js yournewpassword
   ```

2. Update in Supabase:
   ```sql
   UPDATE public.admin_credentials 
   SET password_hash = 'GENERATED_HASH_HERE' 
   WHERE username = 'admin';
   ```

## 🔐 Accessing Admin Panel

1. Navigate to: **`/admin-login`**
2. Login with:
   - Username: `admin`
   - Password: (the password you set in step 5)
3. You'll be redirected to `/admin-panel`

## 👤 Admin Account Visibility

The admin account:
- ✅ Appears in user searches and lists
- ✅ Has a profile page at `/profile/admin`
- ✅ Is clearly marked with **"ADMIN ACCOUNT"** badge (red)
- ✅ Cannot be deleted through admin panel
- ✅ Cannot have admin privileges revoked
- ✅ Shows up like a regular user but is clearly identifiable

## 📋 Admin Panel Routes

- `/admin-login` - Admin login page
- `/admin-panel` - Dashboard with statistics
- `/admin-panel/profiles` - Manage all profiles
- `/admin-panel/profiles/[id]` - View profile details
- `/admin-panel/posts` - Manage all posts
- `/admin-panel/comments` - Manage all comments
- `/admin-panel/feedback` - Review user feedback

## 🔒 Security Features

- Separate authentication system (independent of regular users)
- HTTP-only cookies for admin session
- Middleware protection on all admin routes
- Admin account cannot be deleted
- Password hashed with bcrypt

## 📝 Notes

- The admin account uses username "admin" and will show up in user lists
- It's clearly marked with a red "ADMIN ACCOUNT" badge
- Users can see the admin profile but know it's the admin account
- Admin login is completely separate from regular user login
