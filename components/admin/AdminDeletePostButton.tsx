'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deletePostAction } from '@/app/api/admin/actions'
import { Trash2 } from 'lucide-react'

interface AdminDeletePostButtonProps {
  postId: string
}

export default function AdminDeletePostButton({ postId }: AdminDeletePostButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post? This will also delete all comments. This action cannot be undone.')) {
      return
    }

    setLoading(true)
    const result = await deletePostAction(postId)

    if (result.success) {
      router.refresh()
    } else {
      alert(result.error || 'Failed to delete post')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="px-3 py-1 text-sm border border-black text-white disabled:bg-gray-400 disabled:cursor-not-allowed transition"
      style={{ backgroundColor: loading ? '#9ca3af' : '#dc2626', fontSize: '15px' }}
      title="Delete post"
    >
      <Trash2 size={14} className="inline mr-1" />
      Delete
    </button>
  )
}
