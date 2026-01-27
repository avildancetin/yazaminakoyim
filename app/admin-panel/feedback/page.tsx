import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import AdminFeedbackActions from '@/components/admin/AdminFeedbackActions'

export const dynamic = 'force-dynamic'

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }> | { status?: string }
}) {
  const supabase = await createClient()
  const resolvedParams = await Promise.resolve(searchParams)
  const statusFilter = resolvedParams?.status || 'all'

  let query = supabase
    .from('feedback')
    .select(`
      *,
      profiles:user_id (id, username, email),
      related_user:related_user_id (id, username, email),
      related_post:related_post_id (id, content),
      related_comment:related_comment_id (id, content)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data: feedback, error } = await query

  if (error) {
    return (
      <div className="border border-black shadow-lg p-6" style={{ backgroundColor: '#c4d5df' }}>
        <div className="bg-red-50 border border-black text-red-700 px-4 py-3">
          Error loading feedback: {error.message}
        </div>
      </div>
    )
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'complaint': return '#dc2626'
      case 'suggestion': return '#2563eb'
      case 'bug_report': return '#ea580c'
      default: return '#6b7280'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ea580c'
      case 'reviewed': return '#2563eb'
      case 'resolved': return '#16a34a'
      case 'dismissed': return '#6b7280'
      default: return '#6b7280'
    }
  }

  return (
    <div className="border border-black shadow-lg p-6" style={{ backgroundColor: '#c4d5df' }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold" style={{ color: '#894f69' }}>Feedback & Reports</h1>
        <div className="flex gap-2">
          <Link
            href="/admin-panel/feedback?status=pending"
            className={`px-3 py-1 text-sm border border-black transition ${
              statusFilter === 'pending' ? 'text-white' : 'text-gray-900'
            }`}
            style={{ 
              backgroundColor: statusFilter === 'pending' ? '#894f69' : '#c4d5df'
            }}
          >
            Pending
          </Link>
          <Link
            href="/admin-panel/feedback?status=reviewed"
            className={`px-3 py-1 text-sm border border-black transition ${
              statusFilter === 'reviewed' ? 'text-white' : 'text-gray-900'
            }`}
            style={{ 
              backgroundColor: statusFilter === 'reviewed' ? '#894f69' : '#c4d5df'
            }}
          >
            Reviewed
          </Link>
          <Link
            href="/admin-panel/feedback?status=resolved"
            className={`px-3 py-1 text-sm border border-black transition ${
              statusFilter === 'resolved' ? 'text-white' : 'text-gray-900'
            }`}
            style={{ 
              backgroundColor: statusFilter === 'resolved' ? '#894f69' : '#c4d5df'
            }}
          >
            Resolved
          </Link>
          <Link
            href="/admin-panel/feedback"
            className={`px-3 py-1 text-sm border border-black transition ${
              statusFilter === 'all' ? 'text-white' : 'text-gray-900'
            }`}
            style={{ 
              backgroundColor: statusFilter === 'all' ? '#894f69' : '#c4d5df'
            }}
          >
            All
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {feedback && feedback.length > 0 ? (
          feedback.map((item: any) => (
            <div
              key={item.id}
              className="border border-black p-4"
              style={{ backgroundColor: '#e8f0f5' }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="px-2 py-1 text-xs font-bold text-white border border-black"
                      style={{ backgroundColor: getTypeColor(item.type) }}
                    >
                      {item.type.toUpperCase().replace('_', ' ')}
                    </span>
                    <span
                      className="px-2 py-1 text-xs font-bold text-white border border-black"
                      style={{ backgroundColor: getStatusColor(item.status) }}
                    >
                      {item.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{item.subject}</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">{item.content}</p>
                  
                  <div className="text-xs text-gray-600 space-y-1">
                    {item.profiles && (
                      <p>
                        From: <Link href={`/admin-panel/profiles/${item.profiles.id}`} className="hover:underline">
                          {item.profiles.username || item.profiles.email}
                        </Link>
                      </p>
                    )}
                    {item.related_user && (
                      <p>
                        Related User: <Link href={`/admin-panel/profiles/${item.related_user.id}`} className="hover:underline">
                          {item.related_user.username || item.related_user.email}
                        </Link>
                      </p>
                    )}
                    {item.related_post && (
                      <p>
                        Related Post: <Link href={`/post/${item.related_post.id}`} className="hover:underline">
                          View post
                        </Link>
                      </p>
                    )}
                    {item.related_comment && (
                      <p>
                        Related Comment: <Link href={`/post/${item.related_post?.id || '#'}`} className="hover:underline">
                          View comment
                        </Link>
                      </p>
                    )}
                  </div>

                  {item.admin_notes && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-black">
                      <p className="text-xs font-semibold text-gray-900 mb-1">Admin Notes:</p>
                      <p className="text-xs text-gray-700 whitespace-pre-wrap">{item.admin_notes}</p>
                    </div>
                  )}
                </div>
                <AdminFeedbackActions feedbackId={item.id} currentStatus={item.status} />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-600">
            <p>No feedback found</p>
          </div>
        )}
      </div>
    </div>
  )
}
