/**
 * Parse @mentions from text content
 * Returns an array of unique usernames (without the @ symbol)
 */
export function parseMentions(content: string): string[] {
  if (!content) return []
  
  // Match @username patterns
  // Username can contain letters, numbers, underscores, and must be at least 1 character
  // Stops at whitespace, punctuation, or end of string
  const mentionRegex = /@([a-zA-Z0-9_]+)/g
  const matches = content.matchAll(mentionRegex)
  
  const mentions: string[] = []
  for (const match of matches) {
    const username = match[1].toLowerCase().trim()
    if (username && !mentions.includes(username)) {
      mentions.push(username)
    }
  }
  
  return mentions
}



