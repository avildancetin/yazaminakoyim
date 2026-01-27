import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import AdminDeleteProfileButton from '@/components/admin/AdminDeleteProfileButton'
import AdminToggleAdminButton from '@/components/admin/AdminToggleAdminButton'
import { formatLastSeen } from '@/utils/formatLastSeen'

export const dynamic = 'force-dynamic'

export default async function AdminProfilesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }> | { q?: string }
}) {
  const supabase = await createClient()
  const resolvedParams = await Promise.resolve(searchParams)
  const searchQuery = resolvedParams?.q || ''

  // Build query
  let query = supabase
    .from('profiles')
    .select('id, username, email, avatar_url, is_admin, last_seen, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  if (searchQuery.trim()) {
    query = query.or(`username.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
  }

  const { data: profiles, error } = await query

  if (error) {
    return (
      <div className="border border-black shadow-lg p-6" style={{ backgroundColor: '#c4d5df' }}>
        <div className="bg-red-50 border border-black text-red-700 px-4 py-3">
          Error loading profiles: {error.message}
        </div>
      </div>
    )
  }

  return (
    <div className="border border-black shadow-lg p-6" style={{ backgroundColor: '#c4d5df' }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold" style={{ color: '#894f69' }}>Manage Profiles</h1>
        <form method="get" className="flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={searchQuery}
            placeholder="Search by username or email..."
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
        {profiles && profiles.length > 0 ? (
          profiles.map((profile) => (
            <div
              key={profile.id}
              className="border border-black p-4 flex items-center justify-between"
              style={{ backgroundColor: '#e8f0f5' }}
            >
              <div className="flex items-center gap-4 flex-1">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username || profile.email}
                    className="w-12 h-12 object-cover border border-black"
                  />
                ) : (
                  <div className="w-12 h-12 flex items-center justify-center text-lg font-semibold text-white border border-black" style={{ backgroundColor: '#894f69' }}>
                    {(profile.username || profile.email).charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/profile/${encodeURIComponent(profile.username || profile.email.split('@')[0])}`}
                      className="font-semibold text-gray-900 hover:underline"
                    >
                      {profile.username || profile.email.split('@')[0]}
                    </Link>
                    {profile.username === 'admin' && (
                      <span className="px-2 py-1 text-xs font-bold text-white border border-black" style={{ backgroundColor: '#dc2626' }}>
                        ADMIN ACCOUNT
                      </span>
                    )}
                    {profile.is_admin && profile.username !== 'admin' && (
                      <span className="px-2 py-1 text-xs font-bold text-white border border-black" style={{ backgroundColor: '#894f69' }}>
                        ADMIN
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{profile.email}</p>
                  <p className="text-xs text-gray-500">
                    {formatLastSeen(profile.last_seen)} • Joined {new Date(profile.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin-panel/profiles/${profile.id}`}
                  className="px-3 py-1 text-sm border border-black transition hover:bg-gray-200"
                  style={{ backgroundColor: '#c4d5df' }}
                >
                  View Details
                </Link>
                {profile.username !== 'admin' && (
                  <>
                    <AdminToggleAdminButton profileId={profile.id} isAdmin={profile.is_admin} />
                    <AdminDeleteProfileButton profileId={profile.id} />
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-600">
            <p>No profiles found</p>
          </div>
        )}
      </div>
    </div>
  )
}
