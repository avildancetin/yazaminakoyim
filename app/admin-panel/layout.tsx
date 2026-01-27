import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Home, Users, FileText, MessageSquare, AlertCircle, Shield } from 'lucide-react'
import AdminNavbar from '@/components/admin/AdminNavbar'
import { createClient } from '@/utils/supabase/server'
import { checkAdminAuth } from '@/app/api/admin/auth/actions'

export const dynamic = 'force-dynamic'

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check admin authentication
  const isAuthenticated = await checkAdminAuth()
  if (!isAuthenticated) {
    redirect('/admin-login')
  }

  const supabase = await createClient()

  // Get pending feedback count
  const { count: pendingFeedbackCount } = await supabase
    .from('feedback')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  return (
    <div className="min-h-screen">
      <AdminNavbar />
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
                  href="/admin-panel"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition text-gray-900"
                >
                  <Home size={20} />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/admin-panel/profiles"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition text-gray-900"
                >
                  <Users size={20} />
                  <span>Profiles</span>
                </Link>
                <Link
                  href="/admin-panel/posts"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition text-gray-900"
                >
                  <FileText size={20} />
                  <span>Posts</span>
                </Link>
                <Link
                  href="/admin-panel/comments"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition text-gray-900"
                >
                  <MessageSquare size={20} />
                  <span>Comments</span>
                </Link>
                <Link
                  href="/admin-panel/feedback"
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
