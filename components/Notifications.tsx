import { createClient } from '@/utils/supabase/server'
import NotificationItem from './NotificationItem'

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
          case 'reply_to_post':
            message = `${actorName} replied to a comment under your post`
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
        } else if (
          notification.type === 'comment' ||
          notification.type === 'reply' ||
          notification.type === 'reply_to_post' ||
          notification.type === 'tag'
        ) {
          // Navigate to the post (comments are shown on the post page)
          if (notification.target_id) {
            notificationLink = `/post/${notification.target_id}`
          }
        }

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
