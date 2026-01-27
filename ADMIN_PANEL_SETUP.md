# Admin Panel Setup Guide

## Overview
A comprehensive admin panel has been created with the following features:
- Profile management (view, delete, grant/revoke admin privileges)
- Post management (view, delete, filter by status)
- Comment management (view, delete)
- Feedback/Report system for users to submit complaints, suggestions, and bug reports
- Admin dashboard with statistics

## Setup Instructions

### 1. Run Database Migration
Run the SQL migration file `setup_admin.sql` in your Supabase SQL Editor. This will:
- Add `is_admin` column to profiles table
- Create `feedback` table for user reports/complaints
- Set up RLS policies for admin access

### 2. Grant Admin Access
To make a user an admin, run this SQL in Supabase:

```sql
UPDATE public.profiles 
SET is_admin = TRUE 
WHERE id = 'USER_ID_HERE';
```

Or use the admin panel once you have one admin user set up.

### 3. Access Admin Panel
- Navigate to `/admin` (only accessible to admins)
- The admin panel includes:
  - **Dashboard** (`/admin`) - Overview statistics
  - **Profiles** (`/admin/profiles`) - Manage all user profiles
  - **Posts** (`/admin/posts`) - Manage all posts
  - **Comments** (`/admin/comments`) - Manage all comments
  - **Feedback** (`/admin/feedback`) - Review user feedback/reports

## Features

### Profile Management
- View all profiles with search functionality
- View detailed profile information including:
  - Posts and drafts
  - Followers and following
  - Comments count
- Delete profiles (cascades to all related data)
- Grant/revoke admin privileges

### Post Management
- View all posts with filtering:
  - All posts
  - Published posts
  - Hidden posts
  - Drafts
- Search posts by content
- Delete posts (cascades to comments)

### Comment Management
- View all comments with search
- See comment author and related post
- Delete comments

### Feedback System
Users can submit feedback at `/feedback` with types:
- **Complaint** - Report problematic behavior
- **Suggestion** - Suggest improvements
- **Bug Report** - Report technical issues
- **Other** - General feedback

Feedback can be linked to:
- Specific users (for complaints about behavior)
- Specific posts
- Specific comments

Admin can:
- View all feedback with status filtering
- Update feedback status (pending → reviewed → resolved/dismissed)
- Add admin notes/responses
- See related content (user, post, comment)

## User Feedback Page
Users can access the feedback page at `/feedback` from the sidebar navigation. They can:
- Submit new feedback
- View their previous feedback submissions
- See admin responses/notes

## Security
- All admin routes are protected by `requireAdmin()` check
- RLS policies ensure only admins can access admin functions
- Non-admin users are redirected if they try to access admin routes

## API Actions
All admin actions are in `app/api/admin/actions.ts`:
- `deleteProfileAction` - Delete a user profile
- `deletePostAction` - Delete a post
- `deleteCommentAction` - Delete a comment
- `toggleAdminAction` - Grant/revoke admin status
- `updateFeedbackStatusAction` - Update feedback status and notes
