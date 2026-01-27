import Link from 'next/link'
import { User } from 'lucide-react'
import FollowButton from './FollowButton'
import { formatLastSeen } from '@/utils/formatLastSeen'

interface UserCardProps {
  userProfile: {
    id: string
    email: string
    username: string | null
    avatar_url: string | null
    bio?: string | null
    last_seen?: string | null
  }
  currentUserId?: string
  isFollowing?: boolean
}

export default function UserCard({ userProfile, currentUserId, isFollowing = false }: UserCardProps) {
  const displayName = userProfile.username || userProfile.email.split('@')[0]
  const isOwnProfile = currentUserId && userProfile.id === currentUserId

  return (
    <div className="border border-black shadow-sm mb-4" style={{ backgroundColor: '#c4d5df', borderWidth: '1px', borderStyle: 'solid', borderColor: 'black' }}>
      <div className="flex items-center justify-between p-2" style={{ backgroundColor: '#7e9fb2', marginTop: '-1px', marginLeft: '-1px', marginRight: '-1px', borderLeft: '1px solid black', borderRight: '1px solid black', borderTop: '1px solid black' }}>
        <Link 
          href={`/profile/${encodeURIComponent(userProfile.username || userProfile.email.split('@')[0])}`}
          className="flex items-center gap-3 hover:opacity-80 transition"
        >
          {userProfile.avatar_url ? (
            <img
              src={userProfile.avatar_url}
              alt={displayName}
              className="w-10 h-10 object-cover border border-black cursor-pointer"
            />
          ) : (
            <div className="w-10 h-10 flex items-center justify-center text-sm font-semibold text-white border border-black cursor-pointer" style={{ backgroundColor: '#894f69' }}>
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold" style={{ color: '#000000', fontSize: '15px' }}>
                {displayName}
              </p>
              {userProfile.username === 'admin' && (
                <span className="px-1.5 py-0.5 text-xs font-bold text-white border border-black" style={{ backgroundColor: '#dc2626' }}>
                  ADMIN
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600">{formatLastSeen(userProfile.last_seen)}</p>
          </div>
        </Link>
        {!isOwnProfile && currentUserId && (
          <FollowButton 
            userId={userProfile.id} 
            currentUserId={currentUserId}
            initialIsFollowing={isFollowing}
          />
        )}
      </div>
      {userProfile.bio && (
        <div className="p-4 pt-3">
          <p className="text-sm" style={{ color: '#3D3D2A', fontSize: '15px' }}>{userProfile.bio}</p>
        </div>
      )}
    </div>
  )
}

