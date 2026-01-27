'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toggleAdminAction } from '@/app/api/admin/actions'
import { Shield } from 'lucide-react'

interface AdminToggleAdminButtonProps {
  profileId: string
  isAdmin: boolean
}

export default function AdminToggleAdminButton({ profileId, isAdmin }: AdminToggleAdminButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    const action = isAdmin ? 'remove admin privileges' : 'grant admin privileges'
    if (!confirm(`Are you sure you want to ${action}?`)) {
      return
    }

    setLoading(true)
    const result = await toggleAdminAction(profileId, !isAdmin)

    if (result.success) {
      router.refresh()
    } else {
      alert(result.error || 'Failed to update admin status')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`px-3 py-1 text-sm border border-black disabled:bg-gray-400 disabled:cursor-not-allowed transition ${
        isAdmin ? 'text-white' : 'text-gray-900'
      }`}
      style={{ 
        backgroundColor: loading ? '#9ca3af' : isAdmin ? '#894f69' : '#c4d5df',
        fontSize: '15px'
      }}
      title={isAdmin ? 'Remove admin privileges' : 'Grant admin privileges'}
    >
      <Shield size={14} className="inline mr-1" />
      {isAdmin ? 'Remove Admin' : 'Make Admin'}
    </button>
  )
}
