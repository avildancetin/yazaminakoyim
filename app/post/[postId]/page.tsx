import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Home as HomeIcon, UserPlus, Bell, User, FileText } from 'lucide-react'
import Navbar from '@/components/Navbar'
import PostCard from '@/components/PostCard'
import CompactLogin from '@/components/CompactLogin'
import SignupForm from '@/components/SignupForm'

export const dynamic = 'force-dynamic'

export default async function PostPage({ params }: { params: Promise<{ postId: string }> | { postId: string } }) {
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  // Await params if it's a Promise (Next.js 15+)
  const resolvedParams = await Promise.resolve(params)

  if (!resolvedParams?.postId) {
    notFound()
  }

  // Get the post (fetch separately to avoid relationship issues)
  const { data: postData, error: postError } = await supabase
    .from('posts')
    .select('*')
    .eq('id', resolvedParams.postId)
    .eq('hidden', false)
    .single()

  if (postError || !postData) {
    notFound()
  }

  // Get the post author's profile
  const { data: profileData } = await supabase
    .from('profiles')
    .select('id, email, username, avatar_url')
    .eq('id', postData.user_id)
    .single()

  // Manually attach profile to post
  const post = {
    ...postData,
    profiles: profileData || {
      id: postData.user_id,
      email: 'Unknown',
      username: null,
      avatar_url: null
    }
  }

  // Get follow status if logged in
  let isFollowing = false
  if (currentUser && currentUser.id !== post.user_id) {
    const { data: followData } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', currentUser.id)
      .eq('following_id', post.user_id)
      .single()
    
    isFollowing = !!followData
  }

  // Get user's profile to get username for profile link
  let profileUsername = ''
  if (currentUser) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, email')
      .eq('id', currentUser.id)
      .single()
    profileUsername = profile?.username || profile?.email.split('@')[0] || ''
  }

  // Get unread notification count if logged in
  let unreadCount = 0
  if (currentUser) {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', currentUser.id)
      .eq('read', false)
    unreadCount = count || 0
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-black sticky top-0 z-50" style={{ backgroundColor: '#c4d5df' }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-4xl font-bold" style={{ color: '#894f69', fontSize: '54px' }}>
            yazamınakoyim
          </Link>
          {currentUser ? <Navbar /> : <CompactLogin />}
        </div>
      </header>

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
              <div className="max-w-3xl mx-auto">
                <PostCard 
                  post={post} 
                  currentUserId={currentUser?.id ?? undefined}
                  isFollowing={isFollowing}
                />
              </div>
            </main>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Side - Post Content (2 columns) */}
            <div className="lg:col-span-2">
              <div className="max-w-3xl mx-auto">
                <PostCard 
                  post={post} 
                  currentUserId={undefined}
                  isFollowing={isFollowing}
                />
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

