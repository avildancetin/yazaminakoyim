'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deletePostAction } from '@/app/api/posts/actions'
import { publishDraftAction, updateDraftAction } from '@/app/api/drafts/actions'
import { Trash2, Edit, Send } from 'lucide-react'

interface DraftActionsProps {
  draft: {
    id: string
    content: string
    media_url: string | null
    media_type: 'image' | 'video' | null
  }
  onUpdate?: () => void
}

export default function DraftActions({ draft, onUpdate }: DraftActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [action, setAction] = useState<'delete' | 'publish' | null>(null)
  const [isDeleteHovered, setIsDeleteHovered] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    setAction('delete')
    setError(null)

    try {
      const result = await deletePostAction(draft.id)
      
      if (result.error) {
        setError(result.error)
        setLoading(false)
        setAction(null)
      } else {
        if (onUpdate) {
          onUpdate()
        } else {
          router.refresh()
        }
      }
    } catch (err) {
      setError('Failed to delete draft')
      setLoading(false)
      setAction(null)
    }
  }

  const handlePublish = async () => {
    setLoading(true)
    setAction('publish')
    setError(null)

    try {
      const result = await publishDraftAction(draft.id)
      
      if (result.error) {
        setError(result.error)
        setLoading(false)
        setAction(null)
      } else {
        router.push('/')
      }
    } catch (err) {
      setError('Failed to publish draft')
      setLoading(false)
      setAction(null)
    }
  }

  const handleEdit = () => {
    router.push(`/drafts/${draft.id}/edit`)
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <button
          onClick={handleEdit}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 border border-black text-white disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          style={{ backgroundColor: loading ? '#9ca3af' : '#894f69', fontSize: '18px' }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = '#9a5f79'
          }}
          onMouseLeave={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = '#894f69'
          }}
        >
          <Edit size={16} />
          <span>Edit</span>
        </button>
        <button
          onClick={handlePublish}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 border border-black text-white disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          style={{ backgroundColor: loading ? '#9ca3af' : '#894f69', fontSize: '18px' }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = '#9a5f79'
          }}
          onMouseLeave={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = '#894f69'
          }}
        >
          <Send size={16} />
          <span>{loading && action === 'publish' ? 'Publishing...' : 'Post'}</span>
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="flex items-center justify-center w-8 h-8 border border-black disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          style={{ backgroundColor: loading ? '#9ca3af' : isDeleteHovered ? '#dc2626' : '#c4d5df' }}
          onMouseEnter={() => {
            if (!loading) setIsDeleteHovered(true)
          }}
          onMouseLeave={() => {
            if (!loading) setIsDeleteHovered(false)
          }}
          title={loading && action === 'delete' ? 'Deleting...' : 'Delete draft'}
        >
          <Trash2 size={16} style={{ color: loading ? '#ffffff' : isDeleteHovered ? '#ffffff' : '#000000' }} />
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}

