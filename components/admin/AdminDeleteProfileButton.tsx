'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteProfileAction } from '@/app/api/admin/actions'
import { Trash2 } from 'lucide-react'

interface AdminDeleteProfileButtonProps {
  profileId: string
}

export default function AdminDeleteProfileButton({ profileId }: AdminDeleteProfileButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this profile? This will delete all their posts, comments, and related data. This action cannot be undone.')) {
      return
    }

    setLoading(true)
    const result = await deleteProfileAction(profileId)

    if (result.success) {
      router.refresh()
    } else {
      alert(result.error || 'Failed to delete profile')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="px-3 py-1 text-sm border border-black text-white disabled:bg-gray-400 disabled:cursor-not-allowed transition"
      style={{ backgroundColor: loading ? '#9ca3af' : '#dc2626', fontSize: '15px' }}
      title="Delete profile"
    >
      <Trash2 size={14} className="inline mr-1" />
      Delete
    </button>
  )
}
