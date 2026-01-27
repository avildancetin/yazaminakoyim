import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import AdminDeleteCommentButton from '@/components/admin/AdminDeleteCommentButton'
import PostContent from '@/components/PostContent'

export const dynamic = 'force-dynamic'

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }> | { q?: string }
}) {
  const supabase = await createClient()
  const resolvedParams = await Promise.resolve(searchParams)
  const searchQuery = resolvedParams?.q || ''

  let query = supabase
    .from('comments')
    .select(`
      *,
      profiles:user_id (id, username, email, avatar_url)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (searchQuery.trim()) {
    query = query.ilike('content', `%${searchQuery}%`)
  }

  const { data: comments, error } = await query

  if (error) {
    return (
      <div className="border border-black shadow-lg p-6" style={{ backgroundColor: '#c4d5df' }}>
        <div className="bg-red-50 border border-black text-red-700 px-4 py-3">
          Error loading comments: {error.message}
        </div>
      </div>
    )
  }

  return (
    <div className="border border-black shadow-lg p-6" style={{ backgroundColor: '#c4d5df' }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold" style={{ color: '#894f69' }}>Manage Comments</h1>
        <form method="get" className="flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={searchQuery}
            placeholder="Search comments..."
            className="px-3 py-2 border border-black bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 text-white font-medium border border-black transition"
            style={{ backgroundColor: '#894f69', fontSize: '15px' }}
          >
            Search
          </button>
        </form>
      </div>

      <div className="space-y-4">
        {comments && comments.length > 0 ? (
          comments.map((comment: any) => {
            const profile = comment.profiles
            return (
              <div
                key={comment.id}
                className="border border-black p-4"
                style={{ backgroundColor: '#e8f0f5' }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3 flex-1">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.username || profile.email}
                        className="w-8 h-8 object-cover border border-black"
                      />
                    ) : (
                      <div className="w-8 h-8 flex items-center justify-center text-xs font-semibold text-white border border-black" style={{ backgroundColor: '#894f69' }}>
                        {(profile?.username || profile?.email || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin-panel/profiles/${comment.user_id}`}
                          className="font-semibold text-gray-900 hover:underline text-sm"
                        >
                          {profile?.username || profile?.email?.split('@')[0] || 'Unknown'}
                        </Link>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-1">
                        <PostContent content={comment.content} size="small" />
                      </div>
                      {comment.post_id && (
                        <Link
                          href={`/post/${comment.post_id}`}
                          className="text-xs text-gray-600 hover:underline mt-1 inline-block"
                        >
                          View post →
                        </Link>
                      )}
                    </div>
                  </div>
                  <AdminDeleteCommentButton commentId={comment.id} />
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center py-12 text-gray-600">
            <p>No comments found</p>
          </div>
        )}
      </div>
    </div>
  )
}
