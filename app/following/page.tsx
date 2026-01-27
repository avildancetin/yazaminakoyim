import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import FollowButton from '@/components/FollowButton'
import UpdateLastSeen from '@/components/UpdateLastSeen'
import { Home as HomeIcon, UserPlus, Bell, User, FileText } from 'lucide-react'
import Navbar from '@/components/Navbar'

export const dynamic = 'force-dynamic'

export default async function FollowingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get users that current user is following
  const { data: follows, error: followsError } = await supabase
    .from('follows')
    .select(`
      following_id,
      created_at,
      profiles:following_id (
        id,
        username,
        email,
        avatar_url
      )
    `)
    .eq('follower_id', user.id)
    .order('created_at', { ascending: false })

  if (followsError) {
    return (
            <div className="shadow-lg p-6" style={{ backgroundColor: '#c4d5df' }}>
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Following</h1>
        <div className="bg-red-50 border border-black text-red-700 px-4 py-3">
          Error loading following list: {followsError.message}
        </div>
      </div>
    )
  }

  const followingList = follows || []

  // Get unread notification count
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false)

  // Get user's profile to get username
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, email')
    .eq('id', user.id)
    .single()
  
  const profileUsername = profile?.username || profile?.email.split('@')[0] || 'user'

  return (
    <div className="min-h-screen">
      <UpdateLastSeen />
      {/* Header */}
      <header className="border-b border-black sticky top-0 z-50" style={{ backgroundColor: '#c4d5df' }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-4xl font-bold" style={{ color: '#894f69', fontSize: '54px' }}>
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
                  <HomeIcon size={20} />
                  <span>Home</span>
                </Link>
                <Link
                  href="/following"
                  className="flex items-center gap-3 px-4 py-3 font-medium"
                  style={{ backgroundColor: 'rgba(137, 79, 105, 0.1)', color: '#894f69' }}
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
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition text-gray-900 relative"
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
              <h1 className="text-2xl font-bold mb-6 text-gray-900">Following</h1>
      
      {followingList.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">You're not following anyone yet.</p>
          <p className="text-sm mt-2">Start following people to see their posts!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {followingList.map((follow: any) => {
            const profile = follow.profiles
            if (!profile) return null

            const displayName = profile.username || profile.email.split('@')[0]

            return (
              <div
                key={follow.following_id}
                className="flex items-center justify-between p-4 border border-black hover:bg-gray-50 transition"
              >
                <Link
                  href={`/profile/${encodeURIComponent(displayName)}`}
                  className="flex items-center gap-4 hover:opacity-80 transition"
                >
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={displayName}
                      className="w-12 h-12 object-cover border border-black"
                    />
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center text-lg font-semibold text-white border border-black" style={{ backgroundColor: '#894f69' }}>
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">
                      {displayName}
                    </p>
                    <p className="text-xs text-gray-500">
                      Following since {new Date(follow.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
                <FollowButton userId={profile.id} currentUserId={user.id} initialIsFollowing={true} />
              </div>
            )
          })}
        </div>
      )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

