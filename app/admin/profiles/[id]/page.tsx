import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import AdminDeleteProfileButton from '@/components/admin/AdminDeleteProfileButton'
import AdminToggleAdminButton from '@/components/admin/AdminToggleAdminButton'
import { formatLastSeen } from '@/utils/formatLastSeen'
import PostCard from '@/components/PostCard'

export const dynamic = 'force-dynamic'

export default async function AdminProfileDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string }
}) {
  const supabase = await createClient()
  const resolvedParams = await Promise.resolve(params)
  const profileId = resolvedParams.id

  // Get profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single()

  if (profileError || !profile) {
    notFound()
  }

  // Get profile's posts
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', profileId)
    .eq('draft', false)
    .eq('hidden', false)
    .order('created_at', { ascending: false })
    .limit(20)

  // Get profile's drafts
  const { data: drafts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', profileId)
    .eq('draft', true)
    .order('created_at', { ascending: false })
    .limit(20)

  // Get followers
  const { data: followers } = await supabase
    .from('follows')
    .select(`
      follower_id,
      created_at,
      profiles:follower_id (id, username, email, avatar_url)
    `)
    .eq('following_id', profileId)
    .limit(50)

  // Get following
  const { data: following } = await supabase
    .from('follows')
    .select(`
      following_id,
      created_at,
      profiles:following_id (id, username, email, avatar_url)
    `)
    .eq('follower_id', profileId)
    .limit(50)

  // Get comments count
  const { count: commentsCount } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profileId)

  // Attach profile to posts
  const postsWithProfile = posts?.map(post => ({
    ...post,
    profiles: {
      id: profile.id,
      email: profile.email,
      username: profile.username,
      avatar_url: profile.avatar_url
    }
  })) || []

  const draftsWithProfile = drafts?.map(draft => ({
    ...draft,
    profiles: {
      id: profile.id,
      email: profile.email,
      username: profile.username,
      avatar_url: profile.avatar_url
    }
  })) || []

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="border border-black shadow-lg p-6" style={{ backgroundColor: '#c4d5df' }}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.username || profile.email}
                className="w-24 h-24 object-cover border border-black"
              />
            ) : (
              <div className="w-24 h-24 flex items-center justify-center text-3xl font-bold text-white border border-black" style={{ backgroundColor: '#894f69' }}>
                {(profile.username || profile.email).charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile.username || profile.email.split('@')[0]}
                </h1>
                {profile.is_admin && (
                  <span className="px-2 py-1 text-xs font-bold text-white border border-black" style={{ backgroundColor: '#894f69' }}>
                    ADMIN
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">{profile.email}</p>
              <p className="text-xs text-gray-500 mt-1">
                {formatLastSeen(profile.last_seen)} • Joined {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/profiles"
              className="px-3 py-1 text-sm border border-black transition hover:bg-gray-200"
              style={{ backgroundColor: '#c4d5df' }}
            >
              Back to Profiles
            </Link>
            <AdminToggleAdminButton profileId={profile.id} isAdmin={profile.is_admin} />
            <AdminDeleteProfileButton profileId={profile.id} />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-black">
          <div>
            <p className="text-sm text-gray-600">Posts</p>
            <p className="text-xl font-bold text-gray-900">{posts?.length || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Drafts</p>
            <p className="text-xl font-bold text-gray-900">{drafts?.length || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Comments</p>
            <p className="text-xl font-bold text-gray-900">{commentsCount || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Followers</p>
            <p className="text-xl font-bold text-gray-900">{followers?.length || 0}</p>
          </div>
        </div>
      </div>

      {/* Followers */}
      {followers && followers.length > 0 && (
        <div className="border border-black shadow-lg p-6" style={{ backgroundColor: '#c4d5df' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#894f69' }}>Followers ({followers.length})</h2>
          <div className="space-y-2">
            {followers.map((follow: any) => {
              const followerProfile = follow.profiles
              if (!followerProfile) return null
              return (
                <Link
                  key={follow.follower_id}
                  href={`/admin/profiles/${follow.follower_id}`}
                  className="flex items-center gap-3 p-2 border border-black hover:bg-gray-100 transition"
                >
                  {followerProfile.avatar_url ? (
                    <img
                      src={followerProfile.avatar_url}
                      alt={followerProfile.username || followerProfile.email}
                      className="w-8 h-8 object-cover border border-black"
                    />
                  ) : (
                    <div className="w-8 h-8 flex items-center justify-center text-xs font-semibold text-white border border-black" style={{ backgroundColor: '#894f69' }}>
                      {(followerProfile.username || followerProfile.email).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm text-gray-900">
                    {followerProfile.username || followerProfile.email.split('@')[0]}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Following */}
      {following && following.length > 0 && (
        <div className="border border-black shadow-lg p-6" style={{ backgroundColor: '#c4d5df' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#894f69' }}>Following ({following.length})</h2>
          <div className="space-y-2">
            {following.map((follow: any) => {
              const followingProfile = follow.profiles
              if (!followingProfile) return null
              return (
                <Link
                  key={follow.following_id}
                  href={`/admin/profiles/${follow.following_id}`}
                  className="flex items-center gap-3 p-2 border border-black hover:bg-gray-100 transition"
                >
                  {followingProfile.avatar_url ? (
                    <img
                      src={followingProfile.avatar_url}
                      alt={followingProfile.username || followingProfile.email}
                      className="w-8 h-8 object-cover border border-black"
                    />
                  ) : (
                    <div className="w-8 h-8 flex items-center justify-center text-xs font-semibold text-white border border-black" style={{ backgroundColor: '#894f69' }}>
                      {(followingProfile.username || followingProfile.email).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm text-gray-900">
                    {followingProfile.username || followingProfile.email.split('@')[0]}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Drafts */}
      {draftsWithProfile.length > 0 && (
        <div className="border border-black shadow-lg p-6" style={{ backgroundColor: '#c4d5df' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#894f69' }}>Drafts ({draftsWithProfile.length})</h2>
          <div className="space-y-4">
            {draftsWithProfile.map((draft: any) => (
              <PostCard
                key={draft.id}
                post={draft}
                currentUserId={undefined}
                isDraft={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Posts */}
      {postsWithProfile.length > 0 && (
        <div className="border border-black shadow-lg p-6" style={{ backgroundColor: '#c4d5df' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#894f69' }}>Posts ({postsWithProfile.length})</h2>
          <div className="space-y-4">
            {postsWithProfile.map((post: any) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={undefined}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
