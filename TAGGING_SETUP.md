# Tagging Feature Setup Guide

## Step 1: Run Database Migration

**IMPORTANT**: You must run the database migration before the tagging feature will work!

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the entire contents of `setup_tags.sql`
4. Click **Run** to execute the migration

This will create:
- `post_tags` table to store tags
- Update `notifications` table to support 'tag' type
- Create database trigger to automatically create notifications when users are tagged

## Step 2: Verify Migration

After running the migration, verify it worked by running this query in Supabase SQL Editor:

```sql
-- Check if post_tags table exists
SELECT * FROM public.post_tags LIMIT 1;

-- Check if notifications support 'tag' type
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'notifications_type_check';
```

## Step 3: Test the Feature

1. **Create a post with a tag:**
   - Write a post with `@username` in the content (e.g., "Hey @john, check this out!")
   - Make sure the username exists and matches exactly (case-insensitive)
   - Publish the post (not save as draft)

2. **Check notifications:**
   - The tagged user should receive a notification
   - Go to their notifications page to verify

3. **Check profile:**
   - Visit the tagged user's profile
   - You should see "Posts" and "Tagged" tabs
   - Click "Tagged" tab to see posts where they were tagged

## Troubleshooting

### Tags not working?

1. **Check browser console** for errors
2. **Verify migration was run:**
   - Check if `post_tags` table exists in Supabase
   - Check if notifications table supports 'tag' type

3. **Check username matching:**
   - Usernames are case-insensitive
   - Make sure the username in the post matches exactly (e.g., `@john` matches username "john")
   - The username must exist in the `profiles` table

4. **Check server logs:**
   - Look for errors in the browser console
   - Check Supabase logs for database errors

### Profile tabs not showing?

- Make sure the database migration was run
- Check browser console for errors
- Verify the profile page is loading correctly

### Notifications not appearing?

- Check if the database trigger was created
- Verify the `post_tags` record was created
- Check notifications table for 'tag' type entries

## Common Issues

**Error: "relation 'post_tags' does not exist"**
- Solution: Run the `setup_tags.sql` migration

**Error: "constraint notifications_type_check"**
- Solution: The migration should handle this, but if it fails, manually update the constraint

**Tags not being created**
- Check if usernames match exactly (case-insensitive)
- Verify users exist in the profiles table
- Check browser console for errors



