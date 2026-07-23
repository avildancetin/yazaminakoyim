import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Home as HomeIcon, UserPlus, Bell, User, FileText } from 'lucide-react'
import Navbar from '@/components/Navbar'
import FollowButton from '@/components/FollowButton'
import PostCard from '@/components/PostCard'
import CompactLogin from '@/components/CompactLogin'
import SignupForm from '@/components/SignupForm'
import ProfileContent from '@/components/ProfileContent'
import UpdateLastSeen from '@/components/UpdateLastSeen'
import { formatLastSeen } from '@/utils/formatLastSeen'
import { parseMentions } from '@/utils/parseMentions'
import { POST_SELECT_WITH_QUOTE, attachQuotedPostProfiles } from '@/utils/postSelect'

export const dynamic = 'force-dynamic'

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> | { username: string } }) {
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  // Await params if it's a Promise (Next.js 15+)
  const resolvedParams = await Promise.resolve(params)
  
  if (!resolvedParams?.username) {
    notFound()
  }
  
  // Get profile by username or email
  const decodedUsername = decodeURIComponent(resolvedParams.username).toLowerCase()
  
  // Try username first
  let { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', decodedUsername)
    .single()
  
  // If not found by username, try email
  if (profileError && profileError.code === 'PGRST116') {
    const { data: profileByEmail, error: emailError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', decodedUsername)
      .single()
    
    if (!emailError && profileByEmail) {
      profile = profileByEmail
      profileError = null
    } else {
      profileError = emailError
    }
  }

  if (profileError || !profile) {
    notFound()
  }

  // Get user's posts (fetch separately to avoid relationship issues)
  // Only fetch published posts (not drafts) - drafts are shown on /drafts page
  const { data: postsData, error: postsError } = await supabase
    .from('posts')
    .select(POST_SELECT_WITH_QUOTE)
    .eq('user_id', profile.id)
    .eq('draft', false)
    .eq('hidden', false)
    .order('created_at', { ascending: false })
    .limit(50)

  // Get posts where user is tagged from post_tags table
  const { data: taggedPostsData, error: taggedPostsError } = await supabase
    .from('post_tags')
    .select('post_id')
    .eq('tagged_user_id', profile.id)
    .limit(50)

  // Log error if post_tags table doesn't exist (migration not run)
  if (taggedPostsError) {
    if (taggedPostsError.message.includes('relation') || taggedPostsError.message.includes('does not exist')) {
      console.error('post_tags table does not exist. Please run setup_tags.sql migration in Supabase.')
    } else {
      console.error('Error fetching tagged posts:', taggedPostsError)
    }
  }

  // Also get posts where user is mentioned in content (for posts created before tagging feature)
  // This includes older posts that have @mentions but no entry in post_tags table
  const profileUsername = profile.username?.toLowerCase()
  let mentionedPostsData: any[] = []
  
  if (profileUsername) {
    // Search for posts containing @username in content
    // Exclude posts authored by the profile user (those go in "Posts" tab, not "Tagged")
    const { data: mentionedPosts, error: mentionedError } = await supabase
      .from('posts')
      .select(POST_SELECT_WITH_QUOTE)
      .neq('user_id', profile.id) // Don't include user's own posts
      .eq('draft', false)
      .eq('hidden', false)
      .ilike('content', `%@${profileUsername}%`) // Case-insensitive search for @username
      .order('created_at', { ascending: false })
      .limit(100) // Get more to filter for precision
    
    if (mentionedPosts && !mentionedError) {
      // Filter to only include posts that actually mention the user (to avoid false positives)
      // This handles cases where username might be a substring of another username
      mentionedPostsData = mentionedPosts.filter(post => {
        const mentions = parseMentions(post.content || '')
        return mentions.includes(profileUsername)
      }).slice(0, 50) // Limit to 50 after filtering
    }
  }

  // Combine post IDs from both sources
  const taggedPostIds = taggedPostsData?.map(t => t.post_id) || []
  const mentionedPostIds = mentionedPostsData.map(p => p.id)
  const allTaggedPostIds = [...new Set([...taggedPostIds, ...mentionedPostIds])] // Remove duplicates

  // Get the actual posts for tagged posts
  let taggedPosts: any[] = []
  if (allTaggedPostIds.length > 0) {
    const { data: taggedPostsFull, error: taggedPostsFullError } = await supabase
      .from('posts')
      .select(POST_SELECT_WITH_QUOTE)
      .in('id', allTaggedPostIds)
      .eq('draft', false)
      .eq('hidden', false)
      .order('created_at', { ascending: false })
      .limit(50)

    if (taggedPostsFull && !taggedPostsFullError) {
      // Fetch profiles for tagged posts
      const userIds = [...new Set(taggedPostsFull.map(p => p.user_id).filter(Boolean))]
      let profilesData: any[] = []
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email, username, avatar_url')
          .in('id', userIds)
        
        if (profiles) {
          profilesData = profiles
        }
      }

      // Manually attach profiles to tagged posts
      const taggedPostsWithProfiles = taggedPostsFull.map(post => ({
        ...post,
        profiles: profilesData.find(p => p.id === post.user_id) || {
          id: post.user_id,
          email: 'Unknown',
          username: null,
          avatar_url: null
        }
      }))
      taggedPosts = await attachQuotedPostProfiles(supabase, taggedPostsWithProfiles)
    }
  }

  // Manually attach profile to posts
  const postsWithProfiles = postsData?.map(post => ({
    ...post,
    profiles: {
      id: profile.id,
      email: profile.email,
      username: profile.username,
      avatar_url: profile.avatar_url
    }
  })) || []

  const posts = await attachQuotedPostProfiles(supabase, postsWithProfiles)

  // Get follow status if logged in
  let isFollowing = false
  if (currentUser && currentUser.id !== profile.id) {
    const { data: followData } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', currentUser.id)
      .eq('following_id', profile.id)
      .single()
    
    isFollowing = !!followData
  }

  // Get follower and following counts
  const { count: followersCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', profile.id)

  const { count: followingCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', profile.id)

  // Get unread notification count if logged in
  let unreadCount = 0
  let currentUserProfile = null
  if (currentUser) {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', currentUser.id)
      .eq('read', false)
    unreadCount = count || 0
    
    // Get current user's profile for navigation
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('username, email')
      .eq('id', currentUser.id)
      .single()
    currentUserProfile = userProfile
  }

  return (
    <div className="min-h-screen">
      {currentUser && <UpdateLastSeen />}
      {/* Header */}
      <header className="border-b border-black sticky top-0 z-50" style={{ backgroundColor: '#c4d5df' }}>
        <div className="max-w-7xl mx-auto px-4 py-2 sm:py-3 flex items-center justify-center sm:justify-between">
          <Link href="/" className="text-4xl font-bold" style={{ color: '#894f69', fontSize: 'clamp(28px, 8vw, 54px)' }}>
            yazamınakoyim
          </Link>
          <div className="hidden sm:block">
            {currentUser ? <Navbar /> : <CompactLogin />}
          </div>
        </div>
      </header>
      <div className="border-b border-black sm:hidden" style={{ backgroundColor: '#c4d5df' }}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          {currentUser ? <Navbar /> : <CompactLogin />}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {currentUser ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Sidebar */}
            <aside className="lg:col-span-1">
              <div className="border border-black shadow-lg p-6 sticky top-24" style={{ backgroundColor: '#c4d5df' }}>
                <nav className="space-y-2">
                  <Link
                    href="/"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition text-gray-900"
                  >
                    <HomeIcon size={20} />
                    <span>Home</span>
                  </Link>
                  <Link
                    href="/following"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition text-gray-900"
                  >
                    <UserPlus size={20} />
                    <span>Following</span>
                  </Link>
                  {currentUser && currentUserProfile && (
                    <Link
                      href={`/profile/${encodeURIComponent(currentUserProfile.username || currentUserProfile.email.split('@')[0])}`}
                      className={`flex items-center gap-3 px-4 py-3 transition ${
                        currentUser.id === profile.id 
                          ? 'font-medium' 
                          : 'hover:bg-gray-100 text-gray-900'
                      }`}
                      style={
                        currentUser.id === profile.id
                          ? { backgroundColor: 'rgba(137, 79, 105, 0.1)', color: '#894f69' }
                          : {}
                      }
                    >
                      <User size={20} />
                      <span>Profile</span>
                    </Link>
                  )}
                  {currentUser && (
                    <Link
                      href="/drafts"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition text-gray-900"
                    >
                      <FileText size={20} />
                      <span>Drafts</span>
                    </Link>
                  )}
                  <div className="pt-4 border-t border-black">
                    <Link
                      href="/notifications"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition text-gray-900 relative"
                    >
                      <Bell size={20} />
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center border border-black">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Link>
                  </div>
                </nav>
              </div>
            </aside>

            {/* Main Content */}
            <main className="lg:col-span-3">
              {/* Profile Header */}
              <div className="border border-black shadow-lg p-6 mb-6" style={{ backgroundColor: '#c4d5df' }}>
              <div className="flex items-start gap-6">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username || profile.email}
                    className="w-24 h-24 object-cover border border-black"
                  />
                ) : (
                  <div className="w-24 h-24 flex items-center justify-center text-3xl font-bold text-white border border-black" style={{ backgroundColor: '#894f69' }}>
                    {(profile.username || profile.email).charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-gray-900">
                          {profile.username || profile.email.split('@')[0]}
                        </h1>
                        {profile.username === 'admin' && (
                          <span className="px-2 py-1 text-xs font-bold text-white border border-black" style={{ backgroundColor: '#dc2626' }}>
                            ADMIN ACCOUNT
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatLastSeen(profile.last_seen)}
                      </p>
                    </div>
                    {currentUser && currentUser.id !== profile.id && (
                      <FollowButton 
                        userId={profile.id} 
                        currentUserId={currentUser.id}
                        initialIsFollowing={isFollowing}
                      />
                    )}
                  </div>
                  <div className="flex gap-6 mb-4">
                    <div>
                      <span className="font-semibold text-gray-900">{posts?.length || 0}</span>
                      <span className="text-gray-600 ml-1">posts</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">{followersCount || 0}</span>
                      <span className="text-gray-600 ml-1">followers</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">{followingCount || 0}</span>
                      <span className="text-gray-600 ml-1">following</span>
                    </div>
                  </div>
                  {profile.sen_kimsin_amk && (
                    <div className="mt-4 pt-4 border-t border-black">
                      <p className="text-gray-900" style={{ fontSize: '15px', whiteSpace: 'pre-wrap' }}>
                        {profile.sen_kimsin_amk}
                      </p>
                    </div>
                  )}
                  {profile.currently_reading && (
                    <div className={`mt-4 flex items-center gap-2 ${profile.sen_kimsin_amk ? '' : 'pt-4 border-t border-black'}`}>
                      <img 
                        src="/icons/currently-reading.png" 
                        alt="Currently reading" 
                        className="w-5 h-5 opacity-70"
                        style={{ filter: 'grayscale(20%)' }}
                      />
                      <p className="text-gray-900" style={{ fontSize: '15px' }}>
                        {profile.currently_reading}
                      </p>
                    </div>
                  )}
                </div>
                </div>
              </div>

              {/* Posts and Tagged */}
              <div>
                {postsError ? (
                  <div className="bg-red-50 border border-black text-red-700 px-4 py-3">
                    Error loading posts: {postsError.message}
                  </div>
                ) : (
                  <ProfileContent
                    posts={posts}
                    taggedPosts={taggedPosts}
                    currentUserId={currentUser?.id}
                    isFollowing={isFollowing}
                    showDeleteButton={currentUser?.id === profile.id}
                  />
                )}
              </div>
            </main>
        </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Side - Profile Content (2 columns) */}
            <div className="lg:col-span-2">
              {/* Profile Header */}
              <div className="border border-black shadow-lg p-6 mb-6" style={{ backgroundColor: '#c4d5df' }}>
                <div className="flex items-start gap-6">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.username || profile.email}
                      className="w-24 h-24 object-cover border border-black"
                    />
                  ) : (
                    <div className="w-24 h-24 flex items-center justify-center text-3xl font-bold text-white border border-black" style={{ backgroundColor: '#894f69' }}>
                      {(profile.username || profile.email).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-gray-900">
                          {profile.username || profile.email.split('@')[0]}
                        </h1>
                        {profile.username === 'admin' && (
                          <span className="px-2 py-1 text-xs font-bold text-white border border-black" style={{ backgroundColor: '#dc2626' }}>
                            ADMIN ACCOUNT
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-6 mb-4">
                      <div>
                        <span className="font-semibold text-gray-900">{posts?.length || 0}</span>
                        <span className="text-gray-600 ml-1">posts</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">{followersCount || 0}</span>
                        <span className="text-gray-600 ml-1">followers</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">{followingCount || 0}</span>
                        <span className="text-gray-600 ml-1">following</span>
                      </div>
                    </div>
                    {profile.sen_kimsin_amk && (
                      <div className="mt-4 pt-4 border-t border-black">
                        <p className="text-gray-900" style={{ fontSize: '15px', whiteSpace: 'pre-wrap' }}>
                          {profile.sen_kimsin_amk}
                        </p>
                      </div>
                    )}
                    {profile.currently_reading && (
                      <div className={`mt-4 flex items-center gap-2 ${profile.sen_kimsin_amk ? '' : 'pt-4 border-t border-black'}`}>
                        <img 
                          src="/icons/currently-reading.png" 
                          alt="Currently reading" 
                          className="w-5 h-5 opacity-70"
                          style={{ filter: 'grayscale(20%)' }}
                        />
                        <p className="text-gray-900" style={{ fontSize: '15px' }}>
                          {profile.currently_reading}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Posts and Tagged */}
              <div>
                {postsError ? (
                  <div className="bg-red-50 border border-black text-red-700 px-4 py-3">
                    Error loading posts: {postsError.message}
                  </div>
                ) : (
                  <ProfileContent
                    posts={posts}
                    taggedPosts={taggedPosts}
                    currentUserId={undefined}
                    isFollowing={isFollowing}
                    showDeleteButton={false}
                  />
                )}
              </div>
            </div>

            {/* Right Side - Signup Form (1 column) */}
            <div className="lg:col-span-1">
              <SignupForm />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

