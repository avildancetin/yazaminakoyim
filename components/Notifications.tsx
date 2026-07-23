import { createClient } from '@/utils/supabase/server'
import NotificationItem from './NotificationItem'
import { getNotificationMessage, getNotificationLink } from '@/utils/notificationMessage'

function truncateSnippet(text: string, max = 80) {
  const clean = text.trim()
  if (clean.length <= max) return clean
  return clean.slice(0, max).trimEnd() + '…'
}

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
      ),
      comment:comment_id ( content ),
      post:target_id ( content )
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

        const message = getNotificationMessage(notification.type, actorName, !!notification.comment_id)
        const notificationLink = getNotificationLink(notification, actorName)

        const rawSnippet =
          notification.type === 'tag' && !notification.comment_id
            ? notification.post?.content
            : notification.comment?.content
        const snippet = rawSnippet ? truncateSnippet(rawSnippet) : null

        return (
          <NotificationItem
            key={notification.id}
            id={notification.id}
            href={notificationLink}
            isRead={notification.read}
            actorName={actorName}
            avatarUrl={actor.avatar_url}
            message={message}
            snippet={snippet}
            createdAt={notification.created_at}
          />
        )
      })}
    </div>
  )
}
