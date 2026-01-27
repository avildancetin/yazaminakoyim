import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Home, Users, FileText, MessageSquare, AlertCircle, Shield } from 'lucide-react'
import { isAdmin } from '@/utils/admin'
import Navbar from '@/components/Navbar'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check if user is admin
  const admin = await isAdmin()
  if (!admin) {
    redirect('/')
  }

  // Get user's profile
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

  // Get pending feedback count
  const { count: pendingFeedbackCount } = await supabase
    .from('feedback')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

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
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Admin Sidebar */}
          <aside className="lg:col-span-1">
            <div className="border border-black shadow-lg p-6 sticky top-24" style={{ backgroundColor: '#c4d5df' }}>
              <div className="mb-4 pb-4 border-b border-black">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={20} style={{ color: '#894f69' }} />
                  <h2 className="text-lg font-bold" style={{ color: '#894f69' }}>Admin Panel</h2>
                </div>
              </div>
              <nav className="space-y-2">
                <Link
                  href="/admin"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition text-gray-900"
                >
                  <Home size={20} />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/admin/profiles"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition text-gray-900"
                >
                  <Users size={20} />
                  <span>Profiles</span>
                </Link>
                <Link
                  href="/admin/posts"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition text-gray-900"
                >
                  <FileText size={20} />
                  <span>Posts</span>
                </Link>
                <Link
                  href="/admin/comments"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition text-gray-900"
                >
                  <MessageSquare size={20} />
                  <span>Comments</span>
                </Link>
                <Link
                  href="/admin/feedback"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition text-gray-900 relative"
                >
                  <AlertCircle size={20} />
                  <span>Feedback</span>
                  {pendingFeedbackCount && pendingFeedbackCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center border border-black">
                      {pendingFeedbackCount > 9 ? '9+' : pendingFeedbackCount}
                    </span>
                  )}
                </Link>
                <div className="pt-4 border-t border-black">
                  <Link
                    href="/"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition text-gray-900"
                  >
                    <Home size={20} />
                    <span>Back to Site</span>
                  </Link>
                </div>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-4">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
