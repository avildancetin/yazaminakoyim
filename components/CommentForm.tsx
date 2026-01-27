'use client'

import { useState } from 'react'
import { createCommentAction } from '@/app/api/comments/actions'

interface CommentFormProps {
  postId: string
  parentCommentId?: string
  onSuccess?: () => void
  placeholder?: string
}

export default function CommentForm({ 
  postId, 
  parentCommentId, 
  onSuccess,
  placeholder = 'Write a comment...' 
}: CommentFormProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('postId', postId)
    formData.append('content', content)
    if (parentCommentId) {
      formData.append('parentCommentId', parentCommentId)
    }

    const result = await createCommentAction(formData)

    if (result.error) {
      setError(result.error)
    } else {
      setContent('')
      if (onSuccess) {
        onSuccess()
      }
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        required
        rows={2}
        className="w-full px-3 py-2 border border-black focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none text-gray-900"
        style={{ backgroundColor: '#c4d5df' }}
      />
      {error && (
        <div className="bg-red-50 border border-black text-red-700 px-3 py-2 text-sm">
          {error}
        </div>
      )}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="px-4 py-1.5 font-medium border border-black transition disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ 
            backgroundColor: loading || !content.trim() ? '#9ca3af' : '#894f69',
            color: 'white',
            fontSize: '18px'
          }}
        >
          {loading ? 'Posting...' : parentCommentId ? 'Reply' : 'Comment'}
        </button>
      </div>
    </form>
  )
}

