'use client'

import { useState, useEffect } from 'react'
import { followUser, unfollowUser } from '@/app/api/follow/actions'

interface FollowButtonProps {
  userId: string
  currentUserId?: string
  initialIsFollowing?: boolean
}

// Custom event type for follow state changes
type FollowStateChangeEvent = CustomEvent<{ userId: string; isFollowing: boolean }>

export default function FollowButton({ userId, currentUserId, initialIsFollowing = false }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [actionLoading, setActionLoading] = useState(false)

  // Listen for follow state changes from other FollowButton instances
  useEffect(() => {
    const handleFollowStateChange = (event: Event) => {
      const customEvent = event as FollowStateChangeEvent
      if (customEvent.detail.userId === userId) {
        setIsFollowing(customEvent.detail.isFollowing)
      }
    }

    window.addEventListener('followStateChange', handleFollowStateChange as EventListener)
    return () => {
      window.removeEventListener('followStateChange', handleFollowStateChange as EventListener)
    }
  }, [userId])

  // Dispatch event to notify other FollowButton instances
  const dispatchFollowStateChange = (isFollowing: boolean) => {
    const event = new CustomEvent('followStateChange', {
      detail: { userId, isFollowing }
    })
    window.dispatchEvent(event)
  }

  const handleFollow = async () => {
    if (!currentUserId) return

    setActionLoading(true)
    const result = await followUser(userId)
    if (result.success) {
      setIsFollowing(true)
      dispatchFollowStateChange(true)
    }
    setActionLoading(false)
  }

  const handleUnfollow = async () => {
    if (!currentUserId) return

    setActionLoading(true)
    const result = await unfollowUser(userId)
    if (result.success) {
      setIsFollowing(false)
      dispatchFollowStateChange(false)
    }
    setActionLoading(false)
  }

  // Don't show button if not logged in or viewing own profile
  if (!currentUserId || currentUserId === userId) {
    return null
  }

  return (
    <button
      onClick={isFollowing ? handleUnfollow : handleFollow}
      disabled={actionLoading}
      className={`px-3 py-1 font-medium border border-black transition disabled:opacity-50 disabled:cursor-not-allowed ${
        isFollowing
          ? 'bg-gray-200 hover:bg-gray-300 text-gray-800'
          : 'text-white'
      }`}
      style={!isFollowing ? { backgroundColor: '#894f69', fontSize: '18px' } : { fontSize: '18px' }}
          onMouseEnter={(e) => {
            if (!isFollowing) e.currentTarget.style.backgroundColor = '#9a5f79'
          }}
          onMouseLeave={(e) => {
            if (!isFollowing) e.currentTarget.style.backgroundColor = '#894f69'
          }}
    >
      {actionLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
    </button>
  )
}

