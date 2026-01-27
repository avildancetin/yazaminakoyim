import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Home, UserPlus, Bell, User, FileText } from 'lucide-react'
import Navbar from '@/components/Navbar'
import PostCard from '@/components/PostCard'
import UserCard from '@/components/UserCard'
import SearchFilterButton from '@/components/SearchFilterButton'
import UpdateLastSeen from '@/components/UpdateLastSeen'

export const dynamic = 'force-dynamic'

export default async function SearchPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ q?: string; filter?: string }> | { q?: string; filter?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const resolvedParams = await Promise.resolve(searchParams)
  const query = resolvedParams?.q || ''
  const filter = resolvedParams?.filter || 'all' // 'all', 'users', 'posts'

  // Get user's profile for sidebar
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, email')
    .eq('id', user.id)
    .single()
  
  const profileUsername = profile?.username || profile?.email.split('@')[0] || 'user'

  // Get unread notification count
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false)

  let userResults: any[] = []
  let postResults: any[] = []

  if (query.trim() && query.trim().length >= 3) {
    const searchQuery = query.trim().toLowerCase()
    const searchTerm = `%${searchQuery}%`

    // Search users if filter is 'all' or 'users'
    if (filter === 'all' || filter === 'users') {
      // Use database-level filtering for better performance
      // Search both username and email fields
      const { data: profilesByUsername, error: usernameError } = await supabase
        .from('profiles')
        .select('id, email, username, avatar_url, last_seen')
        .ilike('username', searchTerm)
        .limit(20)

      const { data: profilesByEmail, error: emailError } = await supabase
        .from('profiles')
        .select('id, email, username, avatar_url, last_seen')
        .ilike('email', searchTerm)
        .limit(20)

      if (usernameError || emailError) {
        console.error('Error fetching profiles:', usernameError || emailError)
      }

      // Combine and deduplicate results
      const allMatchingProfiles = [
        ...(profilesByUsername || []),
        ...(profilesByEmail || [])
      ]

      // Remove duplicates by id
      const uniqueUsers = Array.from(
        new Map(allMatchingProfiles.map(user => [user.id, user])).values()
      )

      userResults = uniqueUsers.slice(0, 20)
    }

    // Search posts if filter is 'all' or 'posts'
    if (filter === 'all' || filter === 'posts') {
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('draft', false)
        .eq('hidden', false)
        .ilike('content', searchTerm)
        .order('created_at', { ascending: false })
        .limit(20)

      if (!postsError && postsData) {
        // Fetch profiles for posts
        const userIds = [...new Set(postsData.map(p => p.user_id).filter(Boolean))]
        
        let profilesData: any[] = []
        if (userIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, email, username, avatar_url, last_seen')
            .in('id', userIds)
          
          if (!profilesError && profiles) {
            profilesData = profiles
          }
        }

        // Batch fetch follow statuses
        let followStatuses: Record<string, boolean> = {}
        if (userIds.length > 0) {
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

        // Join posts with profiles
        postResults = postsData.map(post => ({
          ...post,
          profiles: profilesData.find(p => p.id === post.user_id) || { 
            id: post.user_id,
            email: 'Unknown', 
            username: null,
            avatar_url: null
          }
        }))
      }
    }
  }

  // Batch fetch follow statuses for users
  let userFollowStatuses: Record<string, boolean> = {}
  if (userResults.length > 0 && user) {
    const userIds = userResults.map(u => u.id)
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)
      .in('following_id', userIds)
    
    if (follows) {
      follows.forEach(follow => {
        userFollowStatuses[follow.following_id] = true
      })
    }
  }

  const hasResults = userResults.length > 0 || postResults.length > 0
  const showUsers = filter === 'all' || filter === 'users'
  const showPosts = filter === 'all' || filter === 'posts'

  return (
    <div className="min-h-screen">
      <UpdateLastSeen />
      {/* Header */}
      <header className="border-b border-black sticky top-0 z-50" style={{ backgroundColor: '#c4d5df' }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-4xl font-bold" style={{ color: '#894f69', fontSize: '36px' }}>
            yazamınakoyim
          </Link>
          <Navbar />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <aside className="lg:col-span-1">
            <div className="border border-black shadow-lg p-6 sticky top-24" style={{ backgroundColor: '#c4d5df' }}>
              <nav className="space-y-2">
                <Link
                  href="/"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition text-gray-900"
                >
                  <Home size={20} />
                  <span>Home</span>
                </Link>
                <Link
                  href="/following"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition text-gray-900"
                >
                  <UserPlus size={20} />
                  <span>Following</span>
                </Link>
                <Link
                  href={`/profile/${encodeURIComponent(profileUsername)}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition text-gray-900"
                >
                  <User size={20} />
                  <span>Profile</span>
                </Link>
                <Link
                  href="/drafts"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition text-gray-900"
                >
                  <FileText size={20} />
                  <span>Drafts</span>
                </Link>
                <div className="pt-4 border-t">
                  <Link
                    href="/notifications"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition text-gray-900"
                  >
                    <Bell size={20} />
                    <span>Notifications</span>
                    {count && count > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center">
                        {count > 9 ? '9+' : count}
                      </span>
                    )}
                  </Link>
                </div>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            <div className="border border-black shadow-lg p-6" style={{ backgroundColor: '#c4d5df' }}>
              <h1 className="text-2xl font-bold mb-4" style={{ color: '#894f69' }}>Search Results</h1>
              
              {query.trim() && query.trim().length >= 3 ? (
                <>
                  {/* Filter Buttons */}
                  <div className="flex gap-2 mb-6">
                    <SearchFilterButton
                      href={`/search?q=${encodeURIComponent(query)}&filter=users`}
                      isActive={filter === 'users'}
                    >
                      Filter by Users
                    </SearchFilterButton>
                    <SearchFilterButton
                      href={`/search?q=${encodeURIComponent(query)}&filter=posts`}
                      isActive={filter === 'posts'}
                    >
                      Filter by Posts
                    </SearchFilterButton>
                  </div>

                  {/* Results */}
                  {!hasResults ? (
                    <div className="text-center py-12 text-gray-600">
                      <p className="text-lg font-semibold">No results found for "{query}"</p>
                    </div>
                  ) : (
                    <>
                      {/* User Results */}
                      {showUsers && userResults.length > 0 && (
                        <div className="mb-8">
                          <h2 className="text-xl font-semibold mb-4" style={{ color: '#894f69' }}>
                            Users ({userResults.length})
                          </h2>
                          <div className="space-y-4">
                            {userResults.map((userProfile) => (
                              <UserCard
                                key={userProfile.id}
                                userProfile={userProfile}
                                currentUserId={user.id}
                                isFollowing={userFollowStatuses[userProfile.id] || false}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Post Results */}
                      {showPosts && postResults.length > 0 && (
                        <div>
                          <h2 className="text-xl font-semibold mb-4" style={{ color: '#894f69' }}>
                            Posts ({postResults.length})
                          </h2>
                          <div className="space-y-4">
                            {postResults.map((post) => (
                              <PostCard 
                                key={post.id} 
                                post={post as any} 
                                currentUserId={user.id}
                                isFollowing={false}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : query.trim() && query.trim().length < 3 ? (
                <div className="text-center py-12 text-gray-600">
                  <p className="text-lg font-semibold">Please enter at least 3 characters to search</p>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-600">
                  <p className="text-lg font-semibold">Enter a search query to find users or posts</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

