import FollowButton from './FollowButton'
import CommentsList from './CommentsList'
import DeletePostButton from './DeletePostButton'
import DraftActions from './DraftActions'
import PostContent from './PostContent'
import CopyPostLinkButton from './CopyPostLinkButton'
import SharePostButton from './SharePostButton'
import Link from 'next/link'
import { formatDateTime } from '@/utils/formatDateTime'

interface Post {
  id: string
  content: string
  media_url: string | null
  media_type: 'image' | 'video' | null
  created_at: string
  user_id: string
  profiles: {
    id: string
    email: string
    username: string | null
    avatar_url: string | null
  }
}

interface PostCardProps {
  post: Post & { draft?: boolean }
  currentUserId?: string
  isFollowing?: boolean
  showDeleteButton?: boolean
  isDraft?: boolean
}

export default function PostCard({ post, currentUserId, isFollowing = false, showDeleteButton = false, isDraft = false }: PostCardProps) {
  const isOwnPost = currentUserId && post.user_id === currentUserId

  return (
    <div className="border border-black shadow-sm mb-4" style={{ backgroundColor: '#c4d5df' }}>
      <div className="flex items-center justify-between p-2 border-b border-black" style={{ backgroundColor: '#7e9fb2', marginTop: '-1px', marginLeft: '-1px', marginRight: '-1px', borderLeft: '1px solid black', borderRight: '1px solid black', borderTop: '1px solid black' }}>
        <Link 
          href={`/profile/${encodeURIComponent(post.profiles.username || post.profiles.email.split('@')[0])}`}
          className="flex items-center gap-3 hover:opacity-80 transition"
        >
          {post.profiles.avatar_url ? (
            <img
              src={post.profiles.avatar_url}
              alt={post.profiles.username || post.profiles.email}
              className="w-10 h-10 object-cover border border-black cursor-pointer"
            />
          ) : (
            <div className="w-10 h-10 flex items-center justify-center text-sm font-semibold text-white border border-black cursor-pointer" style={{ backgroundColor: '#894f69' }}>
              {(post.profiles.username || post.profiles.email).charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900 cursor-pointer">
              {post.profiles.username || post.profiles.email.split('@')[0]}
            </p>
            <p className="text-xs text-gray-500">
              {formatDateTime(post.created_at)}
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {!isDraft && (
            <>
              <SharePostButton
                postId={post.id}
                content={post.content}
                hasMedia={post.media_type === 'image' && !!post.media_url}
              />
              <CopyPostLinkButton postId={post.id} />
            </>
          )}
          {isDraft && isOwnPost ? (
            <DraftActions draft={post} />
          ) : showDeleteButton && isOwnPost ? (
            <DeletePostButton postId={post.id} />
          ) : (
            <FollowButton 
              userId={post.profiles.id} 
              currentUserId={currentUserId}
              initialIsFollowing={isFollowing}
            />
          )}
        </div>
      </div>
      <div className="p-4 pt-3">
        <PostContent content={post.content} />
        {post.media_url && (
          <div className="overflow-hidden mb-3">
            {post.media_type === 'image' ? (
              <img
                src={post.media_url}
                alt="Post media"
                className="w-full h-auto max-h-96 object-contain"
              />
            ) : post.media_type === 'video' ? (
              <video
                src={post.media_url}
                controls
                className="w-full h-auto max-h-96"
              >
                Your browser does not support the video tag.
              </video>
            ) : null}
          </div>
        )}
        {!isDraft && <CommentsList postId={post.id} currentUserId={currentUserId} />}
      </div>
    </div>
  )
}

