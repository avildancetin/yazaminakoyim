// Pinned so server-rendered timestamps (posts, notifications) and client-rendered
// ones (comments) always agree, regardless of which timezone the rendering
// environment happens to be in.
const TIME_ZONE = 'Europe/Istanbul'

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-US', {
    timeZone: TIME_ZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
