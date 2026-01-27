'use client'

import { useEffect } from 'react'
import { updateLastSeen } from '@/app/api/users/updateLastSeen'

/**
 * Client component that updates the user's last_seen timestamp
 * when the component mounts and periodically while active
 */
export default function UpdateLastSeen() {
  useEffect(() => {
    // Update immediately on mount
    updateLastSeen()

    // Update every 5 minutes while the user is active
    const interval = setInterval(() => {
      updateLastSeen()
    }, 5 * 60 * 1000) // 5 minutes

    // Also update when the page becomes visible (user returns to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateLastSeen()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return null // This component doesn't render anything
}


