import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import MarkAsReadButton from './MarkAsReadButton'

export default async function Notifications() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get all notifications for current user
  const { data: notifications, error } = await supabase
    .from('notifications')
    .select(`
      *,
      actor:actor_id (
        id,
        username,
        email,
        avatar_url
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return (
      <div className="bg-red-50 border border-black text-red-700 px-4 py-3">
        Error loading notifications: {error.message}
      </div>
    )
  }

  if (!notifications || notifications.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No notifications yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification: any) => {
        const actor = notification.actor
        if (!actor) return null

        const actorName = actor.username || actor.email.split('@')[0]
        const isRead = notification.read

        let message = ''
        switch (notification.type) {
          case 'follow':
            message = `${actorName} started following you`
            break
          case 'comment':
            message = `${actorName} commented on your post`
            break
          case 'reply':
            message = `${actorName} replied to your comment`
            break
          case 'tag':
            // Check if it's a comment tag or post tag
            if (notification.comment_id) {
              message = `${actorName} tagged you in a comment`
            } else {
              message = `${actorName} tagged you in a post`
            }
            break
          default:
            message = `${actorName} interacted with your content`
        }

        // Determine the link based on notification type
        let notificationLink = '#'
        if (notification.type === 'follow') {
          // Navigate to the follower's profile
          notificationLink = `/profile/${encodeURIComponent(actorName)}`
        } else if (notification.type === 'comment' || notification.type === 'reply' || notification.type === 'tag') {
          // Navigate to the post (comments are shown on the post page)
          if (notification.target_id) {
            notificationLink = `/post/${notification.target_id}`
          }
        }

        return (
          <Link
            key={notification.id}
            href={notificationLink}
            className={`block p-4 border transition hover:opacity-90 ${
              isRead
                ? 'border-black'
                : 'border-black'
            }`}
            style={{ 
              backgroundColor: isRead ? '#c4d5df' : 'rgba(196, 213, 223, 0.8)' 
            }}
          >
            <div className="flex items-start gap-3">
              {actor.avatar_url ? (
                <img
                  src={actor.avatar_url}
                  alt={actorName}
                  className="w-10 h-10 object-cover border border-black"
                />
              ) : (
                <div className="w-10 h-10 flex items-center justify-center text-sm font-semibold text-white border border-black" style={{ backgroundColor: '#894f69' }}>
                  {actorName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <p className={`${isRead ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>
                  {message}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </div>
              {!isRead && (
                <div className="flex-shrink-0">
                  <MarkAsReadButton notificationId={notification.id} />
                </div>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}

