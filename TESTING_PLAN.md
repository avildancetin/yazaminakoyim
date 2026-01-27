# Comprehensive Testing Plan for yazamınakoyim

## Table of Contents
1. [Pre-Testing Setup](#pre-testing-setup)
2. [Authentication Testing](#authentication-testing)
3. [Post Creation & Management](#post-creation--management)
4. [Drafts Feature](#drafts-feature)
5. [Comments & Replies](#comments--replies)
6. [Tagging Feature](#tagging-feature)
7. [Following System](#following-system)
8. [Notifications](#notifications)
9. [Profile Features](#profile-features)
10. [Search Functionality](#search-functionality)
11. [Feed Sorting](#feed-sorting)
12. [Navigation & UI](#navigation--ui)
13. [Edge Cases & Error Handling](#edge-cases--error-handling)

---

## Pre-Testing Setup

### Database Migrations
- [ ] Run `setup_tags.sql` in Supabase SQL Editor
- [ ] Run `setup_comment_tags.sql` in Supabase SQL Editor
- [ ] Verify `post_tags` table exists
- [ ] Verify `comment_tags` table exists
- [ ] Verify notifications table supports 'tag' type
- [ ] Check that all triggers are created

### Test Accounts
- [ ] Create at least 3 test accounts with different usernames
- [ ] Note down usernames: `testuser1`, `testuser2`, `testuser3`
- [ ] Ensure all accounts have confirmed emails

---

## Authentication Testing

### Login Functionality

- [x] **Test 1.1**: Login with email
  - Navigate to `/auth/login`
  - Enter valid email and password
  - Click "Login"
  - Expected: Redirects to home page, user is logged in

- [x] **Test 1.2**: Login with username
  - Navigate to `/auth/login`
  - Enter username (not email) and password
  - Click "Login"
  - Expected: Successfully logs in

- [x] **Test 1.3**: Login with invalid credentials
  - Enter wrong email/username or password
  - Click "Login"
  - Expected: Error message displayed, user not logged in

- [x] **Test 1.4**: Login from post page
  - Navigate to `/post/[somePostId]` while logged out
  - Use CompactLogin form in header
  - Enter credentials and login
  - Expected: Stays on same post page, now logged in

- [ ] **Test 1.5**: Login page background
  - Navigate to `/auth/login`
  - Expected: Background shows `background.jpg` image
  - Expected: Login form is visible on top of background

### Signup Functionality
- [x] **Test 2.1**: Signup with valid data
  - Navigate to `/auth/login`
  - Click "Sign Up" toggle
  - Enter username (3+ chars, alphanumeric + underscore)
  - Enter email
  - Enter password (6+ chars)
  - Enter matching confirm password
  - Click "Sign Up"
  - Expected: Success message, email confirmation required

- [x] **Test 2.2**: Signup with invalid username
  - Try username with special characters (except underscore)
  - Try username less than 3 characters
  - Expected: Validation error displayed

- [x] **Test 2.3**: Signup with mismatched passwords
  - Enter different password and confirm password
  - Expected: Error message "Passwords do not match"

- [x] **Test 2.4**: Signup with existing username
  - Try to signup with username that already exists
  - Expected: Error "Username already taken"

### Logout Functionality
- [x] **Test 3.1**: Logout from home page
  - While logged in on home page
  - Click "Logout" button in top navbar
  - Expected: Immediately navigates to home page, shows login/signup form

- [x] **Test 3.2**: Logout from edit profile page
  - Navigate to `/profile/edit`
  - Click "Logout" button
  - Expected: Immediately navigates to home page, logged out

- [x] **Test 3.3**: Logout from post page
  - Navigate to any post page
  - Click "Logout"
  - Expected: Navigates to home page, logged out

- [x] **Test 3.4**: Logout from any page
  - Test logout from: profile page, notifications, drafts, search
  - Expected: All navigate to home page after logout

---

## Post Creation & Management

### Creating Posts
- [x] **Test 4.1**: Create text-only post
  - Navigate to `/post/create`
  - Enter text content
  - Click "Post" button
  - Expected: Post created, redirected to home, post appears in feed

- [x] **Test 4.2**: Create post with image
  - Navigate to `/post/create`
  - Enter text content
  - Upload an image file (< 50MB)
  - Click "Post"
  - Expected: Post created with image displayed

- [x] **Test 4.3**: Create post with video
  - Navigate to `/post/create`
  - Enter text content
  - Upload a video file (< 50MB)
  - Click "Post"
  - Expected: Post created with video player

- [x] **Test 4.4**: Create post with @mentions
  - Create post with `@testuser2` in content
  - Click "Post"
  - Expected: Post created, @testuser2 is styled in color #894f6e
  - Expected: @testuser2 is clickable and links to their profile

- [ ] **Test 4.5**: File size validation
  - Try to upload file > 50MB
  - Expected: Error message displayed

- [x] **Test 4.6**: Invalid file type
  - Try to upload non-image/non-video file
  - Expected: Won't be displayed while choosing the file

### Viewing Posts
- [x] **Test 5.1**: View post on home feed
  - Navigate to home page
  - Expected: All published posts visible
  - Expected: Post author, content, media, timestamp displayed

- [x] **Test 5.2**: View individual post page
  - Click on a post or navigate to `/post/[postId]`
  - Expected: Full post displayed
  - Expected: If logged in, sidebar visible
  - Expected: If logged out, signup form visible

- [x] **Test 5.3**: Copy post link
  - On any post, click the link icon button (top right)
  - Expected: Link copied to clipboard
  - Expected: Button shows checkmark briefly
  - Paste link in new tab
  - Expected: Navigates to that post page

### Deleting Posts
- [x] **Test 6.1**: Delete own post from profile
  - Navigate to own profile
  - Find a post
  - Click delete button
  - Confirm deletion
  - Expected: Post deleted, removed from profile

- [x] **Test 6.2**: Cannot delete others' posts
  - Navigate to another user's profile
  - Expected: No delete button visible on their posts

---

## Drafts Feature

### Saving Drafts
- [x] **Test 7.1**: Save post as draft
  - Navigate to `/post/create`
  - Enter content (with or without media)
  - Click "Save as Draft" button (middle button)
  - Expected: Draft saved, redirected to `/drafts` page

- [x] **Test 7.2**: Draft not visible in feed
  - Create a draft
  - Navigate to home page
  - Expected: Draft does not appear in feed

- [x] **Test 7.3**: Only own drafts visible
  - Login as testuser1
  - Create a draft
  - Logout and login as testuser2
  - Navigate to `/drafts`
  - Expected: testuser1's draft not visible

### Editing Drafts
- [x] **Test 8.1**: Edit draft content
  - Navigate to `/drafts`
  - Click "Edit" on a draft
  - Modify content
  - Click "Save Changes"
  - Expected: Draft updated, redirected to drafts page

- [x] **Test 8.2**: Edit draft media
  - Edit a draft
  - Upload new image/video
  - Save changes
  - Expected: New media replaces old media

- [x] **Test 8.3**: Publish draft
  - Edit a draft
  - Click "Post" button
  - Expected: Draft published, appears in feed
  - Expected: If draft has @mentions, tags are processed

- [x] **Test 8.4**: Delete draft
  - Navigate to drafts page
  - Click "Delete" on a draft
  - Confirm deletion
  - Expected: Draft deleted, removed from list

---

## Comments & Replies

### Creating Comments
- [x] **Test 9.1**: Create top-level comment
  - View a post
  - Click "Show comments"
  - Enter comment text
  - Submit comment
  - Expected: Comment appears below post

- [x] **Test 9.2**: Create comment with @mention
  - Create comment with `@testuser2` in text
  - Submit comment
  - Expected: @testuser2 styled in #894f6e, clickable
  - Expected: testuser2 receives tag notification

- [x] **Test 9.3**: Comment notifications
  - As testuser1, comment on testuser2's post
  - Login as testuser2
  - Check notifications
  - Expected: Notification "testuser1 commented on your post"

### Creating Replies
- [x] **Test 10.1**: Reply to comment
  - View a post with comments
  - Click reply on a comment
  - Enter reply text
  - Submit
  - Expected: Reply appears nested under comment

- [x] **Test 10.2**: Reply with @mention
  - Reply to a comment with `@testuser3` in text
  - Expected: @testuser3 styled and clickable
  - Expected: testuser3 receives tag notification

- [x] **Test 10.3**: Reply notifications
  - As testuser1, reply to testuser2's comment
  - Login as testuser2
  - Check notifications
  - Expected: Notification "testuser1 replied to your comment"

### Viewing Comments
- [x] **Test 11.1**: View comments on post
  - Navigate to any post
  - Click "Show comments"
  - Expected: All comments displayed with author, timestamp

- [x] **Test 11.2**: Nested replies display
  - View post with replies
  - Click "Show X replies"
  - Expected: Replies displayed in nested format

- [x] **Test 11.3**: @mentions in comments clickable
  - View comments with @mentions
  - Click on @username
  - Expected: Navigates to that user's profile

### Deleting Comments
- [x] **Test 12.1**: Delete own comment
  - Find own comment
  - Click delete (trash icon)
  - Confirm
  - Expected: Comment deleted

- [x] **Test 12.2**: Cannot delete others' comments
  - View another user's comment
  - Expected: No delete button visible

---

## Tagging Feature

### Post Tagging
- [x] **Test 13.1**: Tag user in post
  - Create post with `@testuser2` in content
  - Publish post
  - Login as testuser2
  - Check notifications
  - Expected: Notification "testuser1 tagged you in a post"

- [x] **Test 13.2**: Tagged post appears in "Tagged" tab
  - As testuser2, navigate to own profile
  - Click "Tagged" tab
  - Expected: Post where testuser2 was tagged appears

- [x] **Test 13.3**: Multiple tags in one post
  - Create post with `@testuser2 @testuser3`
  - Expected: Both users receive notifications
  - Expected: Both @mentions styled and clickable

- [x] **Test 13.4**: Tag yourself (should not notify)
  - Create post with own username `@testuser1`
  - Expected: No notification created
  - Expected: @mention still styled and clickable

- [x] **Test 13.5**: Tag non-existent user
  - Create post with `@nonexistentuser123`
  - Expected: @mention styled and clickable (but user doesn't exist)
  - Expected: No notification created

### Comment/Reply Tagging
- [x] **Test 14.1**: Tag user in comment
  - Comment on post with `@testuser2` in comment text
  - Login as testuser2
  - Check notifications
  - Expected: Notification "testuser1 tagged you in a comment"

- [x] **Test 14.2**: Tag user in reply
  - Reply to comment with `@testuser3` in reply text
  - Login as testuser3
  - Check notifications
  - Expected: Notification "testuser1 tagged you in a comment"

- [x] **Test 14.3**: Comment tags don't appear in "Tagged" tab
  - As testuser2, check "Tagged" tab on profile
  - Expected: Only posts appear, not comments

### Tag Display
- [x] **Test 15.1**: @mentions styled correctly
  - View post/comment with @mentions
  - Expected: @mentions in color #894f6e
  - Expected: @mentions are clickable links

- [x] **Test 15.2**: Click @mention navigates to profile
  - Click on any @username
  - Expected: Navigates to that user's profile page

---

## Following System

### Following Users
- [x] **Test 16.1**: Follow user from post
  - View post from user you don't follow
  - Click "Follow" button
  - Expected: Button changes to "Following"
  - Expected: User receives follow notification

- [x] **Test 16.2**: Follow user from profile
  - Navigate to another user's profile
  - Click "Follow" button
  - Expected: Button changes to "Following"

- [x] **Test 16.3**: Follow user from search results
  - Search for a user
  - Click "Follow" on user card
  - Expected: Button updates

### Unfollowing Users
- [x] **Test 17.1**: Unfollow user
  - On a user you follow, click "Following" button
  - Expected: Button changes to "Follow"
  - Expected: User removed from following list

### Following Feed
- [x] **Test 18.1**: "Following" sort option
  - Navigate to home
  - Select "Following (newest first)" from sort dropdown
  - Expected: Only posts from followed users appear

- [x] **Test 18.2**: Following filter when not following anyone
  - As new user with no follows
  - Select "Following" sort
  - Expected: Empty message displayed

- [x] **Test 18.3**: Following filter excludes non-followed users
  - Follow testuser2 only
  - Select "Following" sort
  - Expected: Only testuser2's posts appear, not testuser3's

### Follow Notifications
- [x] **Test 19.1**: Receive follow notification
  - As testuser2, have testuser1 follow you
  - Check notifications
  - Expected: Notification "testuser1 started following you"

---

## Notifications

### Notification Types
- [x] **Test 20.1**: Follow notification
  - Have someone follow you
  - Check notifications page
  - Expected: Follow notification appears

- [x] **Test 20.2**: Comment notification
  - Have someone comment on your post
  - Check notifications
  - Expected: Comment notification appears

- [x] **Test 20.3**: Reply notification
  - Have someone reply to your comment
  - Check notifications
  - Expected: Reply notification appears

- [x] **Test 20.4**: Post tag notification
  - Be tagged in a post
  - Check notifications
  - Expected: "tagged you in a post" notification

- [x] **Test 20.5**: Comment tag notification
  - Be tagged in a comment
  - Check notifications
  - Expected: "tagged you in a comment" notification

### Notification Actions
- [x] **Test 21.1**: Mark notification as read
  - Click on a notification
  - Expected: Notification marked as read (visual change)

- [x] **Test 21.2**: Notification links work
  - Click follow notification
  - Expected: Navigates to follower's profile
  - Click comment/reply/tag notification
  - Expected: Navigates to post page

- [x] **Test 21.3**: Unread count badge
  - Have unread notifications
  - Check sidebar "Notifications" link
  - Expected: Red badge shows unread count

---

## Profile Features

### Viewing Profiles
- [x] **Test 22.1**: View own profile
  - Navigate to own profile
  - Expected: All own posts visible
  - Expected: "Posts" and "Tagged" tabs visible
  - Expected: Follow button not visible

- [x] **Test 22.2**: View other user's profile
  - Navigate to another user's profile
  - Expected: Their posts visible
  - Expected: Follow/Following button visible
  - Expected: Follower/following counts displayed

- [x] **Test 22.3**: Profile information display
  - View profile with "sen kimsin amk" field filled
  - Expected: Bio text displayed
  - View profile with "currently reading" field filled
  - Expected: Book icon and text displayed

### Profile Tabs
- [x] **Test 23.1**: "Posts" tab
  - Navigate to profile
  - Click "Posts" button
  - Expected: User's own posts displayed
  - Expected: Button styled with #c4d5df background

- [x] **Test 23.2**: "Tagged" tab
  - Navigate to profile
  - Click "Tagged" button
  - Expected: Posts where user was tagged displayed
  - Expected: Only posts, not comments

- [x] **Test 23.3**: Tab counts correct
  - Check "Posts (X)" count
  - Expected: Matches actual number of posts
  - Check "Tagged (X)" count
  - Expected: Matches actual number of tagged posts

### Editing Profile
- [x] **Test 24.1**: Edit username
  - Navigate to `/profile/edit`
  - Change username
  - Save
  - Expected: Username updated on profile

- [x] **Test 24.2**: Edit avatar
  - Upload new avatar image
  - Save
  - Expected: New avatar displayed everywhere

- [x] **Test 24.3**: Edit "sen kimsin amk"
  - Add/edit bio text
  - Save
  - Expected: Bio appears on profile page

- [x] **Test 24.4**: Edit "currently reading"
  - Add/edit currently reading text
  - Save
  - Expected: Book icon and text appear on profile

- [x] **Test 24.5**: Character limits
  - Try to enter > 200 chars in "currently reading"
  - Expected: Character counter shows, prevents over-limit

- [x] **Test 24.6**: Navigation from edit profile
  - Click "Profile" in sidebar from edit page
  - Expected: Navigates to actual profile, not edit page

---

## Search Functionality

### User Search
- [ ] **Test 25.1**: Search by full username
  - Enter full username in search bar
  - Click search or press Enter
  - Select "Filter by Users"
  - Expected: User appears in results

- [x] **Test 25.2**: Search by partial username
  - Enter partial username (min 3 chars, e.g., "ben" for "benseninanonim")
  - Select "Filter by Users"
  - Expected: Matching users appear

- [ ] **Test 25.3**: Search by email
  - Enter email address
  - Select "Filter by Users"
  - Expected: User with that email appears

- [ ] **Test 25.4**: User card display
  - View user search results
  - Expected: Users displayed in card format
  - Expected: Avatar, username (black), email visible
  - Expected: Follow button visible (if not own profile)

### Post Search
- [ ] **Test 26.1**: Search by post content
  - Enter text that appears in a post
  - Select "Filter by Posts"
  - Expected: Posts containing that text appear

- [ ] **Test 26.2**: Search results display
  - View post search results
  - Expected: Posts displayed with author, content, media

### Search Navigation
- [ ] **Test 27.1**: Search from home page
  - On home page, enter search query
  - Submit search
  - Expected: Navigates to `/search` page
  - Expected: No sidebar button appears as "clicked"

- [ ] **Test 27.2**: Search filter buttons
  - On search results page
  - Click "Filter by Users"
  - Expected: Only users shown
  - Click "Filter by Posts"
  - Expected: Only posts shown

---

## Feed Sorting

### Sort Options
- [ ] **Test 28.1**: "All (newest first)" - default
  - Navigate to home
  - Expected: All posts, newest on top

- [ ] **Test 28.2**: "All (oldest first)"
  - Select "All (oldest first)" from dropdown
  - Expected: All posts, oldest on top
  - Expected: URL updates with sort parameter

- [ ] **Test 28.3**: "Following (newest first)"
  - Select "Following (newest first)"
  - Expected: Only posts from followed users
  - Expected: Newest first
  - Expected: Only visible if logged in

- [ ] **Test 28.4**: Sort persists on refresh
  - Select a sort option
  - Refresh page
  - Expected: Same sort option still selected

### Sort Functionality
- [ ] **Test 29.1**: Sort actually changes posts order
  - Note first post in "newest first"
  - Switch to "oldest first"
  - Expected: Different post appears first

- [ ] **Test 29.2**: Following filter works correctly
  - Follow testuser2 only
  - Select "Following" sort
  - Expected: Only testuser2's posts appear
  - Expected: testuser3's posts do NOT appear

---

## Navigation & UI

### Sidebar Navigation
- [ ] **Test 30.1**: Home button active state
  - Navigate to home page
  - Expected: "Home" button appears as clicked/active

- [ ] **Test 30.2**: Profile button active state
  - Navigate to own profile
  - Expected: "Profile" button appears as clicked/active

- [ ] **Test 30.3**: No active state on edit profile
  - Navigate to `/profile/edit`
  - Expected: No sidebar button appears as clicked

- [ ] **Test 30.4**: Sidebar links work from all pages
  - From edit profile page, click each sidebar link
  - Expected: All navigate correctly
  - From notifications page, click each link
  - Expected: All navigate correctly

- [ ] **Test 30.5**: Drafts link visible
  - Check sidebar on all pages (home, profile, notifications, etc.)
  - Expected: "Drafts" link always visible when logged in

### Top Navigation
- [ ] **Test 31.1**: Navbar buttons
  - Check top navbar
  - Expected: Search bar, "New Post", "Edit Profile", "Logout" visible

- [ ] **Test 31.2**: Search bar functionality
  - Enter query in search bar
  - Click search button or press Enter
  - Expected: Navigates to search results

### Page Layouts
- [ ] **Test 32.1**: Logged in layout
  - While logged in, check all pages
  - Expected: Sidebar visible, top navbar visible

- [ ] **Test 32.2**: Logged out layout
  - While logged out, check pages
  - Expected: CompactLogin in header, signup form on home

- [ ] **Test 32.3**: Post page layout
  - View post page while logged in
  - Expected: Sidebar visible, post displayed
  - View post page while logged out
  - Expected: Post + signup form visible

### UI Elements
- [ ] **Test 33.1**: Color scheme consistency
  - Check all pages
  - Expected: Background #c4d5df, buttons #894f69, etc.

- [ ] **Test 33.2**: Font sizes
  - Check text throughout site
  - Expected: All text readable (15px), title larger (54px)

- [ ] **Test 33.3**: Button styles
  - Check "Posts" and "Tagged" buttons on profile
  - Expected: Styled like navbar buttons, #c4d5df background

- [ ] **Test 33.4**: Border consistency
  - Check UserCard borders
  - Expected: All borders same thickness (1px)

---

## Edge Cases & Error Handling

### Invalid Data
- [ ] **Test 34.1**: Invalid post ID
  - Navigate to `/post/invalid-id-12345`
  - Expected: 404 page or error message

- [ ] **Test 34.2**: Invalid username in URL
  - Navigate to `/profile/nonexistentuser12345`
  - Expected: 404 page or error message

- [ ] **Test 34.3**: Empty post content
  - Try to create post with no content
  - Expected: Validation error, post not created

### Concurrent Actions
- [ ] **Test 35.1**: Multiple tabs logout
  - Open site in two tabs
  - Logout in one tab
  - Expected: Other tab also reflects logout state

- [ ] **Test 35.2**: Rapid button clicks
  - Rapidly click "Follow" button multiple times
  - Expected: No duplicate follows created

### Performance
- [ ] **Test 36.1**: Large feed loading
  - Create 50+ posts
  - Load home page
  - Expected: Page loads reasonably fast

- [ ] **Test 36.2**: Many comments
  - Post with 20+ comments
  - Load post page
  - Expected: Comments load and display correctly

### Browser Compatibility
- [ ] **Test 37.1**: Copy link functionality
  - Test copy post link in different browsers
  - Expected: Works in Chrome, Firefox, Edge

- [ ] **Test 37.2**: File upload
  - Test image/video upload in different browsers
  - Expected: Works across browsers

---

## Regression Testing Checklist

After any changes, verify these critical paths still work:

- [ ] User can login and logout
- [ ] User can create and view posts
- [ ] User can create drafts and publish them
- [ ] User can comment and reply
- [ ] Tagging works in posts, comments, and replies
- [ ] Notifications are created correctly
- [ ] Profile "Posts" and "Tagged" tabs work
- [ ] Search finds users and posts
- [ ] Feed sorting works correctly
- [ ] Navigation works from all pages
- [ ] @mentions are styled and clickable
- [ ] Copy post link works

---

## Notes for Testers

- **Test Data**: Create realistic test data (posts with various content, multiple users, etc.)
- **Browser Console**: Check for errors in browser console during testing
- **Network Tab**: Monitor network requests for failed API calls
- **Mobile View**: Test responsive design on different screen sizes
- **Database**: Verify data is correctly stored in Supabase after actions

---

## Known Issues to Watch For

- Source map errors in console (should be suppressed)
- Slow logout from certain pages (should be fixed)
- Tag notifications may take a moment to appear (database trigger delay)

---

**Last Updated**: [Current Date]
**Version**: 1.0

