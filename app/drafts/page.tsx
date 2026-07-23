import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Home as HomeIcon, UserPlus, Bell, User, FileText } from 'lucide-react'
import Navbar from '@/components/Navbar'
import PostCard from '@/components/PostCard'
import { POST_SELECT_WITH_QUOTE, attachQuotedPostProfiles } from '@/utils/postSelect'

export const dynamic = 'force-dynamic'

export default async function DraftsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user's profile to get username
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, email')
    .eq('id', user.id)
    .single()
  
  const profileUsername = profile?.username || profile?.email.split('@')[0] || 'user'

  // Get user's drafts (fetch separately to avoid relationship issues)
  const { data: draftsData, error: draftsError } = await supabase
    .from('posts')
    .select(POST_SELECT_WITH_QUOTE)
    .eq('user_id', user.id)
    .eq('draft', true)
    .order('created_at', { ascending: false })

  // Get user's profile
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('id, email, username, avatar_url')
    .eq('id', user.id)
    .single()

  // Manually attach profile to drafts
  const draftsWithProfiles = draftsData?.map(draft => ({
    ...draft,
    profiles: userProfile || {
      id: user.id,
      email: 'Unknown',
      username: null,
      avatar_url: null
    }
  })) || []

  const drafts = await attachQuotedPostProfiles(supabase, draftsWithProfiles)

  // Get unread notification count
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-black sticky top-0 z-50" style={{ backgroundColor: '#c4d5df' }}>
        <div className="max-w-7xl mx-auto px-4 py-2 sm:py-3 flex items-center justify-center sm:justify-between">
          <Link href="/" className="text-4xl font-bold" style={{ color: '#894f69', fontSize: 'clamp(28px, 8vw, 54px)' }}>
            yazamınakoyim
          </Link>
          <div className="hidden sm:block">
            <Navbar />
          </div>
        </div>
      </header>
      <div className="border-b border-black sm:hidden" style={{ backgroundColor: '#c4d5df' }}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Navbar />
        </div>
      </div>

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
                  className="flex items-center gap-3 px-4 py-3 font-medium"
                  style={{ backgroundColor: 'rgba(137, 79, 105, 0.1)', color: '#894f69' }}
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
                    {count && count > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center border border-black">
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
            {draftsError ? (
              <div className="bg-red-50 border border-black text-red-700 px-4 py-3">
                Error loading drafts: {draftsError.message}
              </div>
            ) : !drafts || drafts.length === 0 ? (
              <div className="text-center py-12 text-gray-500 border border-black p-8" style={{ backgroundColor: '#c4d5df' }}>
                <p className="text-lg">No drafts yet.</p>
                <Link 
                  href="/post/create" 
                  className="text-blue-600 hover:underline mt-2 inline-block"
                  style={{ color: '#894f69' }}
                >
                  Create your first draft
                </Link>
              </div>
            ) : (
              <div>
                {drafts.map((draft: any) => (
                  <PostCard 
                    key={draft.id} 
                    post={draft} 
                    currentUserId={user.id}
                    isDraft={true}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

