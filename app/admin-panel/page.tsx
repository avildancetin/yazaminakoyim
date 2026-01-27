import { redirect } from 'next/navigation'
import { checkAdminAuth } from '@/app/api/admin/auth/actions'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Users, FileText, MessageSquare, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminPanelDashboard() {
  // Check admin authentication
  const isAuthenticated = await checkAdminAuth()
  if (!isAuthenticated) {
    redirect('/admin-login')
  }

  const supabase = await createClient()

  // Get statistics
  const { count: profilesCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  const { count: postsCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('draft', false)
    .eq('hidden', false)

  const { count: commentsCount } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })

  const { count: pendingFeedbackCount } = await supabase
    .from('feedback')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  const { count: draftsCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('draft', true)

  const { count: hiddenPostsCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('hidden', true)

  return (
    <div className="border border-black shadow-lg p-6" style={{ backgroundColor: '#c4d5df' }}>
      <h1 className="text-3xl font-bold mb-6" style={{ color: '#894f69' }}>Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Link
          href="/admin-panel/profiles"
          className="border border-black p-6 hover:bg-gray-50 transition"
          style={{ backgroundColor: '#c4d5df' }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Users size={24} style={{ color: '#894f69' }} />
            <h2 className="text-xl font-semibold text-gray-900">Profiles</h2>
          </div>
          <p className="text-3xl font-bold text-gray-900">{profilesCount || 0}</p>
          <p className="text-sm text-gray-600 mt-1">Total users</p>
        </Link>

        <Link
          href="/admin-panel/posts"
          className="border border-black p-6 hover:bg-gray-50 transition"
          style={{ backgroundColor: '#c4d5df' }}
        >
          <div className="flex items-center gap-3 mb-2">
            <FileText size={24} style={{ color: '#894f69' }} />
            <h2 className="text-xl font-semibold text-gray-900">Posts</h2>
          </div>
          <p className="text-3xl font-bold text-gray-900">{postsCount || 0}</p>
          <p className="text-sm text-gray-600 mt-1">Published posts</p>
          {hiddenPostsCount && hiddenPostsCount > 0 && (
            <p className="text-xs text-orange-600 mt-1">{hiddenPostsCount} hidden</p>
          )}
        </Link>

        <Link
          href="/admin-panel/comments"
          className="border border-black p-6 hover:bg-gray-50 transition"
          style={{ backgroundColor: '#c4d5df' }}
        >
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare size={24} style={{ color: '#894f69' }} />
            <h2 className="text-xl font-semibold text-gray-900">Comments</h2>
          </div>
          <p className="text-3xl font-bold text-gray-900">{commentsCount || 0}</p>
          <p className="text-sm text-gray-600 mt-1">Total comments</p>
        </Link>

        <Link
          href="/admin-panel/feedback"
          className="border border-black p-6 hover:bg-gray-50 transition"
          style={{ backgroundColor: '#c4d5df' }}
        >
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle size={24} style={{ color: '#894f69' }} />
            <h2 className="text-xl font-semibold text-gray-900">Feedback</h2>
          </div>
          <p className="text-3xl font-bold text-gray-900">{pendingFeedbackCount || 0}</p>
          <p className="text-sm text-gray-600 mt-1">Pending feedback</p>
        </Link>

        <div className="border border-black p-6" style={{ backgroundColor: '#c4d5df' }}>
          <div className="flex items-center gap-3 mb-2">
            <FileText size={24} style={{ color: '#894f69' }} />
            <h2 className="text-xl font-semibold text-gray-900">Drafts</h2>
          </div>
          <p className="text-3xl font-bold text-gray-900">{draftsCount || 0}</p>
          <p className="text-sm text-gray-600 mt-1">Unpublished drafts</p>
        </div>
      </div>
    </div>
  )
}
