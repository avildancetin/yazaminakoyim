import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import AdminDeletePostButton from '@/components/admin/AdminDeletePostButton'
import PostCard from '@/components/PostCard'

export const dynamic = 'force-dynamic'

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }> | { q?: string; filter?: string }
}) {
  const supabase = await createClient()
  const resolvedParams = await Promise.resolve(searchParams)
  const searchQuery = resolvedParams?.q || ''
  const filter = resolvedParams?.filter || 'all'

  let query = supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (filter === 'published') {
    query = query.eq('draft', false).eq('hidden', false)
  } else if (filter === 'hidden') {
    query = query.eq('hidden', true)
  } else if (filter === 'drafts') {
    query = query.eq('draft', true)
  }

  if (searchQuery.trim()) {
    query = query.ilike('content', `%${searchQuery}%`)
  }

  const { data: posts, error } = await query

  if (error) {
    return (
      <div className="border border-black shadow-lg p-6" style={{ backgroundColor: '#c4d5df' }}>
        <div className="bg-red-50 border border-black text-red-700 px-4 py-3">
          Error loading posts: {error.message}
        </div>
      </div>
    )
  }

  const userIds = [...new Set(posts?.map(p => p.user_id).filter(Boolean) || [])]
  let profilesData: any[] = []
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, username, avatar_url')
      .in('id', userIds)
    
    if (profiles) {
      profilesData = profiles
    }
  }

  const postsWithProfiles = posts?.map(post => ({
    ...post,
    profiles: profilesData.find(p => p.id === post.user_id) || {
      id: post.user_id,
      email: 'Unknown',
      username: null,
      avatar_url: null
    }
  })) || []

  return (
    <div className="border border-black shadow-lg p-6" style={{ backgroundColor: '#c4d5df' }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold" style={{ color: '#894f69' }}>Manage Posts</h1>
        <div className="flex gap-2">
          <form method="get" className="flex gap-2">
            <input
              type="text"
              name="q"
              defaultValue={searchQuery}
              placeholder="Search posts..."
              className="px-3 py-2 border border-black bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              name="filter"
              defaultValue={filter}
              className="px-3 py-2 border border-black bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Posts</option>
              <option value="published">Published</option>
              <option value="hidden">Hidden</option>
              <option value="drafts">Drafts</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2 text-white font-medium border border-black transition"
              style={{ backgroundColor: '#894f69', fontSize: '15px' }}
            >
              Filter
            </button>
          </form>
        </div>
      </div>

      <div className="space-y-4">
        {postsWithProfiles.length > 0 ? (
          postsWithProfiles.map((post: any) => (
            <div key={post.id} className="border border-black p-4" style={{ backgroundColor: '#e8f0f5' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin-panel/profiles/${post.user_id}`}
                    className="text-sm font-semibold text-gray-900 hover:underline"
                  >
                    {post.profiles.username || post.profiles.email.split('@')[0]}
                  </Link>
                  {post.draft && (
                    <span className="px-2 py-1 text-xs font-bold text-white border border-black" style={{ backgroundColor: '#9ca3af' }}>
                      DRAFT
                    </span>
                  )}
                  {post.hidden && (
                    <span className="px-2 py-1 text-xs font-bold text-white border border-black" style={{ backgroundColor: '#dc2626' }}>
                      HIDDEN
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {new Date(post.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/post/${post.id}`}
                    className="px-3 py-1 text-sm border border-black transition hover:bg-gray-200"
                    style={{ backgroundColor: '#c4d5df' }}
                  >
                    View
                  </Link>
                  <AdminDeletePostButton postId={post.id} />
                </div>
              </div>
              <PostCard post={post} currentUserId={undefined} isDraft={post.draft} />
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-600">
            <p>No posts found</p>
          </div>
        )}
      </div>
    </div>
  )
}
