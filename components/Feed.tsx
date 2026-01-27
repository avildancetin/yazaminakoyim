import { createClient } from '@/utils/supabase/server'
import PostCard from './PostCard'

export const dynamic = 'force-dynamic'

type SortOption = 'all-newest' | 'all-oldest' | 'following-newest'

interface FeedProps {
  searchParams?: Promise<{ sort?: string }> | { sort?: string }
}

export default async function Feed({ searchParams }: FeedProps = {}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Unwrap searchParams if it's a Promise (Next.js 15+)
  const resolvedSearchParams = searchParams && typeof searchParams === 'object' && 'then' in searchParams
    ? await searchParams
    : (searchParams as { sort?: string } | undefined)

  // Get sort option from URL, default to 'all-newest'
  const urlSort = resolvedSearchParams?.sort || undefined
  
  // Parse sort option - handle both new format and legacy format
  let sortOption: SortOption = 'all-newest'
  
  if (!urlSort || urlSort === 'all-newest' || urlSort === 'all' || urlSort === 'newest') {
    sortOption = 'all-newest'
  } else if (urlSort === 'all-oldest' || urlSort === 'oldest') {
    sortOption = 'all-oldest'
  } else if (urlSort === 'following-newest' || urlSort === 'following') {
    sortOption = 'following-newest'
  }
  
  // If user is not logged in and tries to use 'following', default to 'all-newest'
  if (sortOption === 'following-newest' && !user) {
    sortOption = 'all-newest'
  }
  
  const ascending = sortOption === 'all-oldest'
  const isFollowing = sortOption === 'following-newest'

  // Get following IDs if sorting by following
  let followingIds: string[] = []
  if (isFollowing && user) {
    const { data: follows, error: followsError } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)
    
    if (followsError) {
      // Only log if it's not a source map error
      const errorMsg = String(followsError).toLowerCase()
      if (!errorMsg.includes('source map') && !errorMsg.includes('sourcemap')) {
        console.error('Error fetching follows:', followsError)
      }
    }
    
    if (follows && Array.isArray(follows)) {
      followingIds = follows.map(f => f.following_id).filter(Boolean)
    }
  }

  // Build query
  let query = supabase
    .from('posts')
    .select('*')
    .eq('draft', false)
    .eq('hidden', false)

  // Filter by following if needed
  if (isFollowing) {
    if (!user) {
      // If not logged in, return empty result
      query = query.eq('id', '00000000-0000-0000-0000-000000000000')
    } else if (followingIds.length > 0) {
      // Only show posts from users being followed
      // Make sure we're filtering correctly
      query = query.in('user_id', followingIds)
    } else {
      // If user has no follows, return empty result by using impossible condition
      query = query.eq('id', '00000000-0000-0000-0000-000000000000')
    }
  }

  // Apply sorting and limit
  // Note: ascending = true means oldest first, ascending = false means newest first
  const { data: postsData, error: postsError } = await query
    .order('created_at', { ascending })
    .limit(50) // Increased limit for better results

  if (postsError) {
    // Only log real errors, not source map errors
    const errorMsg = String(postsError).toLowerCase()
    if (!errorMsg.includes('source map') && !errorMsg.includes('sourcemap')) {
      console.error('Feed error:', postsError)
    }
    return (
      <div className="bg-red-50 border border-black text-red-700 px-4 py-3">
        <p className="font-semibold">Error loading posts:</p>
        <p className="text-sm">{postsError.message}</p>
        <p className="text-xs mt-2 text-red-600">
          If you see "permission denied", make sure to run the SQL migration to allow public access to posts.
        </p>
      </div>
    )
  }

  if (!postsData || postsData.length === 0) {
    const emptyMessage = isFollowing
      ? "No posts from users you follow yet. Follow some users to see their posts here!"
      : "No posts yet."
    const emptySubMessage = isFollowing
      ? ""
      : "Be the first to share something!"
    
    return (
      <div className="text-center py-12 text-gray-600 shadow p-8 border border-black" style={{ backgroundColor: '#c4d5df' }}>
        <p className="text-lg font-semibold">{emptyMessage}</p>
        {emptySubMessage && <p className="text-sm mt-2">{emptySubMessage}</p>}
      </div>
    )
  }

  // Fetch profiles for all unique user_ids
  const userIds = [...new Set(postsData.map(p => p.user_id).filter(Boolean))]
  
  let profilesData: any[] = []
  if (userIds.length > 0) {
    const { data, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, username, avatar_url')
      .in('id', userIds)
    
    if (!profilesError && data) {
      profilesData = data
    }
  }

  // Batch fetch follow statuses if user is logged in
  let followStatuses: Record<string, boolean> = {}
  if (user && userIds.length > 0) {
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)
      .in('following_id', userIds)
    
    if (follows) {
      follows.forEach(follow => {
        followStatuses[follow.following_id] = true
      })
    }
  }

  // Join posts with profiles manually
  const posts = postsData.map(post => ({
    ...post,
    profiles: profilesData.find(p => p.id === post.user_id) || { 
      id: post.user_id,
      email: 'Unknown', 
      username: null,
      avatar_url: null
    }
  }))

  return (
    <div>
      {posts.map((post) => (
        <PostCard 
          key={post.id} 
          post={post as any} 
          currentUserId={user?.id}
          isFollowing={followStatuses[post.profiles.id] || false}
        />
      ))}
    </div>
  )
}

