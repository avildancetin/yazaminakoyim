'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { checkUsernamesExist } from '@/app/api/users/actions'

interface PostContentProps {
  content: string
  size?: 'normal' | 'small'
}

export default function PostContent({ content, size = 'normal' }: PostContentProps) {
  const [validUsernames, setValidUsernames] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Parse all mentions from content
    const mentionRegex = /@([a-zA-Z0-9_]+)/g
    const mentions: string[] = []
    let match

    while ((match = mentionRegex.exec(content)) !== null) {
      const username = match[1].toLowerCase()
      if (!mentions.includes(username)) {
        mentions.push(username)
      }
    }

    // Check which usernames exist
    if (mentions.length > 0) {
      checkUsernamesExist(mentions).then(valid => {
        setValidUsernames(valid)
      })
    }
  }, [content])

  if (!content) return null

  // Split content by @mentions and create clickable links
  const parts: (string | { type: 'mention'; username: string; text: string; isValid: boolean })[] = []
  let lastIndex = 0
  const mentionRegex = /@([a-zA-Z0-9_]+)/g
  let match

  while ((match = mentionRegex.exec(content)) !== null) {
    // Add text before the mention
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index))
    }
    
    // Add the mention
    const username = match[1].toLowerCase()
    const isValid = validUsernames.has(username)
    parts.push({
      type: 'mention',
      username,
      text: match[0], // Includes the @ symbol
      isValid
    })
    
    lastIndex = match.index + match[0].length
  }
  
  // Add remaining text after last mention
  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex))
  }

  const textSizeClass = size === 'small' ? 'text-sm' : ''
  const marginClass = size === 'small' ? 'mb-2' : 'mb-3'

  // If no mentions found, just return the content as-is
  if (parts.length === 0) {
    return <p className={`${marginClass} whitespace-pre-wrap text-gray-900 ${textSizeClass}`}>{content}</p>
  }

  // Show content immediately, even while loading (mentions will be plain text until loaded)
  return (
    <p className={`${marginClass} whitespace-pre-wrap text-gray-900 ${textSizeClass}`}>
      {parts.map((part, index) => {
        if (typeof part === 'string') {
          return <span key={index}>{part}</span>
        } else {
          // Only make @mentions clickable and styled if the user exists
          if (part.isValid) {
            return (
              <Link
                key={index}
                href={`/profile/${encodeURIComponent(part.username)}`}
                className="hover:underline"
                style={{ color: '#894f6e' }}
              >
                {part.text}
              </Link>
            )
          } else {
            // Non-existent users: render as plain text (no styling, no link)
            return <span key={index}>{part.text}</span>
          }
        }
      })}
    </p>
  )
}

