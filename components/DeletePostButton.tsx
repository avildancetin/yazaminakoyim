'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deletePostAction } from '@/app/api/posts/actions'
import { Trash2 } from 'lucide-react'

interface DeletePostButtonProps {
  postId: string
  onDelete?: () => void
}

export default function DeletePostButton({ postId, onDelete }: DeletePostButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isHovered, setIsHovered] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await deletePostAction(postId)
      
      if (result.error) {
        setError(result.error)
        setLoading(false)
      } else {
        if (onDelete) {
          onDelete()
        } else {
          // Refresh the page to show updated data
          router.refresh()
        }
      }
    } catch (err) {
      setError('Failed to delete post')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end">
      <button
        onClick={handleDelete}
        disabled={loading}
        className="flex items-center justify-center w-8 h-8 border border-black disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        style={{ backgroundColor: loading ? '#9ca3af' : isHovered ? '#dc2626' : '#c4d5df' }}
        onMouseEnter={() => {
          if (!loading) setIsHovered(true)
        }}
        onMouseLeave={() => {
          if (!loading) setIsHovered(false)
        }}
        title={loading ? 'Deleting...' : 'Delete post'}
      >
        <Trash2 size={16} style={{ color: loading ? '#ffffff' : isHovered ? '#ffffff' : '#000000' }} />
      </button>
      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  )
}

