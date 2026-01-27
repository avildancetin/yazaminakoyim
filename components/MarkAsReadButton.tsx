'use client'

import { markNotificationRead } from './notificationActions'
import { useRouter } from 'next/navigation'

interface MarkAsReadButtonProps {
  notificationId: string
}

export default function MarkAsReadButton({ notificationId }: MarkAsReadButtonProps) {
  const router = useRouter()

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const result = await markNotificationRead(notificationId)
    if (result.success) {
      router.refresh()
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="border border-black hover:opacity-80 transition px-2 py-1"
      style={{ color: '#894f69', fontSize: '18px' }}
    >
      Mark as read
    </button>
  )
}

