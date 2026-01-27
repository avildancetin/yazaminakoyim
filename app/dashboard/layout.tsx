import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Home, UserPlus, Bell, User, FileText } from 'lucide-react'
import Navbar from '@/components/Navbar'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

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
                    className="flex items-center gap-3 px-4 py-3 font-medium relative"
                    style={{ backgroundColor: 'rgba(137, 79, 105, 0.1)', color: '#894f69' }}
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
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

