import Link from 'next/link'

export interface QuotedPostData {
  id: string
  content: string
  media_url: string | null
  media_type: 'image' | 'video' | null
  created_at: string
  user_id: string
  profiles: {
    id: string
    username: string | null
    email: string
    avatar_url: string | null
  }
}

interface QuotedPostPreviewProps {
  post?: QuotedPostData | null
}

function truncate(text: string, max = 200) {
  if (!text) return ''
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text
}

export default function QuotedPostPreview({ post }: QuotedPostPreviewProps) {
  if (!post) return null

  const displayName = post.profiles?.username || post.profiles?.email?.split('@')[0] || 'Unknown'

  return (
    <Link
      href={`/post/${post.id}`}
      className="block border border-black mb-3 p-3 hover:opacity-90 transition"
      style={{ backgroundColor: '#e8f0f5' }}
    >
      <div className="flex items-center gap-2 mb-1">
        {post.profiles?.avatar_url ? (
          <img
            src={post.profiles.avatar_url}
            alt={displayName}
            className="w-6 h-6 object-cover border border-black"
          />
        ) : (
          <div
            className="w-6 h-6 flex items-center justify-center text-xs font-semibold text-white border border-black"
            style={{ backgroundColor: '#894f69' }}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="font-semibold text-sm text-gray-900">{displayName}</span>
      </div>
      {post.content && (
        <p className="text-sm text-gray-800 whitespace-pre-wrap">{truncate(post.content)}</p>
      )}
      {post.media_url && post.media_type === 'image' && (
        <img
          src={post.media_url}
          alt="Quoted post media"
          className="mt-2 max-h-48 w-full object-contain border border-black"
        />
      )}
      {post.media_url && post.media_type === 'video' && (
        <video src={post.media_url} className="mt-2 max-h-48 w-full border border-black" muted />
      )}
    </Link>
  )
}
