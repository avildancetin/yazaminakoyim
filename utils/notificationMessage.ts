// Shared between components/Notifications.tsx (in-app list) and
// app/api/push/notify/route.ts (push send), so the wording/routing for a
// notification only needs to be defined once.

export function getNotificationMessage(
  type: string,
  actorName: string,
  hasCommentId: boolean
): string {
  switch (type) {
    case 'follow':
      return `${actorName} started following you`
    case 'comment':
      return `${actorName} commented on your post`
    case 'reply':
      return `${actorName} replied to your comment`
    case 'reply_to_post':
      return `${actorName} replied to a comment under your post`
    case 'tag':
      return hasCommentId
        ? `${actorName} tagged you in a comment`
        : `${actorName} tagged you in a post`
    default:
      return `${actorName} interacted with your content`
  }
}

export function getNotificationLink(
  notification: { type: string; target_id: string | null },
  actorName: string
): string {
  if (notification.type === 'follow') {
    return `/profile/${encodeURIComponent(actorName)}`
  }
  if (
    (notification.type === 'comment' ||
      notification.type === 'reply' ||
      notification.type === 'reply_to_post' ||
      notification.type === 'tag') &&
    notification.target_id
  ) {
    return `/post/${notification.target_id}`
  }
  return '#'
}
