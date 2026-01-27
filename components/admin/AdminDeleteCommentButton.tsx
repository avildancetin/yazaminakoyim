'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteCommentAction } from '@/app/api/admin/actions'
import { Trash2 } from 'lucide-react'

interface AdminDeleteCommentButtonProps {
  commentId: string
}

export default function AdminDeleteCommentButton({ commentId }: AdminDeleteCommentButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    const result = await deleteCommentAction(commentId)

    if (result.success) {
      router.refresh()
    } else {
      alert(result.error || 'Failed to delete comment')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="px-3 py-1 text-sm border border-black text-white disabled:bg-gray-400 disabled:cursor-not-allowed transition"
      style={{ backgroundColor: loading ? '#9ca3af' : '#dc2626', fontSize: '15px' }}
      title="Delete comment"
    >
      <Trash2 size={14} className="inline mr-1" />
      Delete
    </button>
  )
}
