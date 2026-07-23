'use client'

import { useEffect, useRef, useState } from 'react'
import { searchUsernames, UsernameSuggestion } from '@/app/api/users/actions'

interface MentionTextareaProps {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  rows?: number
  className?: string
  style?: React.CSSProperties
}

function getMentionQuery(value: string, cursorPos: number) {
  const uptoCursor = value.slice(0, cursorPos)
  const match = uptoCursor.match(/(?:^|\s)@([a-zA-Z0-9_]*)$/)
  if (!match) return null
  const start = uptoCursor.length - match[0].length + (match[0].startsWith('@') ? 0 : 1)
  return { start, query: match[1] }
}

export default function MentionTextarea({
  id,
  value,
  onChange,
  placeholder,
  required,
  rows = 3,
  className,
  style,
}: MentionTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [suggestions, setSuggestions] = useState<UsernameSuggestion[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [mentionStart, setMentionStart] = useState<number | null>(null)

  useEffect(() => {
    if (mentionStart === null) {
      setSuggestions([])
      return
    }

    const cursorPos = textareaRef.current?.selectionStart ?? value.length
    const mention = getMentionQuery(value, cursorPos)
    if (!mention || mention.start !== mentionStart) {
      setSuggestions([])
      return
    }

    const timeout = setTimeout(() => {
      searchUsernames(mention.query).then((results) => {
        setSuggestions(results)
        setActiveIndex(0)
      })
    }, 200)

    return () => clearTimeout(timeout)
  }, [value, mentionStart])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    const cursorPos = e.target.selectionStart
    const mention = getMentionQuery(newValue, cursorPos)
    setMentionStart(mention ? mention.start : null)
  }

  const handleSelect = (username: string) => {
    if (mentionStart === null || !textareaRef.current) return

    const cursorPos = textareaRef.current.selectionStart
    const before = value.slice(0, mentionStart)
    const after = value.slice(cursorPos)
    const newValue = `${before}@${username} ${after}`
    onChange(newValue)
    setMentionStart(null)
    setSuggestions([])

    requestAnimationFrame(() => {
      if (!textareaRef.current) return
      const newCursorPos = before.length + username.length + 2
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      handleSelect(suggestions[activeIndex].username)
    } else if (e.key === 'Escape') {
      setSuggestions([])
      setMentionStart(null)
    }
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setSuggestions([]), 150)}
        placeholder={placeholder}
        required={required}
        rows={rows}
        className={className}
        style={style}
      />
      {suggestions.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full mt-1 z-20 border border-black shadow-lg max-h-48 overflow-y-auto"
          style={{ backgroundColor: '#c4d5df' }}
        >
          {suggestions.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(s.username)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:opacity-80 transition"
              style={{ backgroundColor: i === activeIndex ? '#7e9fb2' : 'transparent' }}
            >
              {s.avatar_url ? (
                <img
                  src={s.avatar_url}
                  alt={s.username}
                  className="w-6 h-6 object-cover border border-black"
                />
              ) : (
                <div
                  className="w-6 h-6 flex items-center justify-center text-xs font-semibold text-white border border-black"
                  style={{ backgroundColor: '#894f69' }}
                >
                  {s.username.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-sm text-gray-900">{s.username}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
