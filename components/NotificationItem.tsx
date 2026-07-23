'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { markNotificationRead } from './notificationActions'
import { formatDateTime } from '@/utils/formatDateTime'
import MarkAsReadButton from './MarkAsReadButton'

interface NotificationItemProps {
  id: string
  href: string
  isRead: boolean
  actorName: string
  avatarUrl: string | null
  message: string
  snippet?: string | null
  createdAt: string
}

export default function NotificationItem({
  id,
  href,
  isRead,
  actorName,
  avatarUrl,
  message,
  snippet,
  createdAt,
}: NotificationItemProps) {
  const router = useRouter()

  const handleClick = () => {
    if (!isRead) {
      markNotificationRead(id).then(() => router.refresh())
    }
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      className="block p-4 border border-black transition hover:opacity-90"
      style={{ backgroundColor: isRead ? '#c4d5df' : 'rgba(196, 213, 223, 0.8)' }}
    >
      <div className="flex items-start gap-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={actorName}
            className="w-10 h-10 object-cover border border-black"
          />
        ) : (
          <div
            className="w-10 h-10 flex items-center justify-center text-sm font-semibold text-white border border-black"
            style={{ backgroundColor: '#894f69' }}
          >
            {actorName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <p className={isRead ? 'text-gray-700' : 'text-gray-900 font-medium'}>{message}</p>
          {snippet && (
            <p className="text-sm text-gray-600 mt-0.5 italic">&quot;{snippet}&quot;</p>
          )}
          <p className="text-xs text-gray-500 mt-1">{formatDateTime(createdAt)}</p>
        </div>
        {!isRead && (
          <div className="flex-shrink-0">
            <MarkAsReadButton notificationId={id} />
          </div>
        )}
      </div>
    </Link>
  )
}
