/**
 * Format last seen timestamp into human-readable text
 * and indicate if the user is currently online.
 *
 * Rules:
 * - If no last_seen: "Last online unknown"
 * - If last activity < 2 minutes ago: "Online now"
 * - Otherwise: "Last online X ago"
 */
export function formatLastSeen(lastSeen: string | Date | null | undefined): string {
  if (!lastSeen) {
    return 'Last online unknown'
  }

  const now = new Date()
  const lastSeenDate = typeof lastSeen === 'string' ? new Date(lastSeen) : lastSeen
  const timestamp = lastSeenDate.getTime()

  // Guard against invalid dates
  if (Number.isNaN(timestamp)) {
    return 'Last online unknown'
  }

  const diffMs = now.getTime() - timestamp
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  // If the timestamp is in the future (client clock behind server), don't
  // permanently show "Online now" – clamp negative diffs to "just now".
  if (diffSeconds < 0) {
    return 'Last online just now'
  }

  // Treat users as "online" if active in the last 60 seconds
  if (diffSeconds <= 60) {
    return 'Online now'
  } else if (diffMinutes < 60) {
    return `Last online ${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`
  } else if (diffHours < 24) {
    return `Last online ${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
  } else if (diffDays < 7) {
    return `Last online ${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`
  } else if (diffWeeks < 4) {
    return `Last online ${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`
  } else if (diffMonths < 12) {
    return `Last online ${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`
  } else {
    return `Last online ${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`
  }
}


