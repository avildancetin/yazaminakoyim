'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateFeedbackStatusAction } from '@/app/api/admin/actions'

interface AdminFeedbackActionsProps {
  feedbackId: string
  currentStatus: string
}

export default function AdminFeedbackActions({ feedbackId, currentStatus }: AdminFeedbackActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState('')

  const handleStatusChange = async (status: 'pending' | 'reviewed' | 'resolved' | 'dismissed') => {
    setLoading(true)
    const result = await updateFeedbackStatusAction(feedbackId, status, notes || undefined)

    if (result.success) {
      router.refresh()
      setShowNotes(false)
      setNotes('')
    } else {
      alert(result.error || 'Failed to update feedback')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {showNotes ? (
        <div className="border border-black p-2 bg-white">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add admin notes..."
            className="w-full px-2 py-1 text-xs border border-black focus:outline-none"
            rows={3}
          />
          <div className="flex gap-1 mt-1">
            <button
              onClick={() => {
                setShowNotes(false)
                setNotes('')
              }}
              className="px-2 py-1 text-xs border border-black bg-gray-200 hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={() => handleStatusChange(currentStatus as any)}
              disabled={loading}
              className="px-2 py-1 text-xs border border-black text-white disabled:bg-gray-400"
              style={{ backgroundColor: '#894f69' }}
            >
              Save Notes
            </button>
          </div>
        </div>
      ) : (
        <>
          {currentStatus === 'pending' && (
            <>
              <button
                onClick={() => handleStatusChange('reviewed')}
                disabled={loading}
                className="px-2 py-1 text-xs border border-black text-white disabled:bg-gray-400"
                style={{ backgroundColor: '#2563eb' }}
              >
                Mark Reviewed
              </button>
              <button
                onClick={() => handleStatusChange('resolved')}
                disabled={loading}
                className="px-2 py-1 text-xs border border-black text-white disabled:bg-gray-400"
                style={{ backgroundColor: '#16a34a' }}
              >
                Resolve
              </button>
              <button
                onClick={() => handleStatusChange('dismissed')}
                disabled={loading}
                className="px-2 py-1 text-xs border border-black text-white disabled:bg-gray-400"
                style={{ backgroundColor: '#6b7280' }}
              >
                Dismiss
              </button>
            </>
          )}
          {currentStatus === 'reviewed' && (
            <>
              <button
                onClick={() => handleStatusChange('resolved')}
                disabled={loading}
                className="px-2 py-1 text-xs border border-black text-white disabled:bg-gray-400"
                style={{ backgroundColor: '#16a34a' }}
              >
                Resolve
              </button>
              <button
                onClick={() => handleStatusChange('dismissed')}
                disabled={loading}
                className="px-2 py-1 text-xs border border-black text-white disabled:bg-gray-400"
                style={{ backgroundColor: '#6b7280' }}
              >
                Dismiss
              </button>
            </>
          )}
          <button
            onClick={() => setShowNotes(true)}
            className="px-2 py-1 text-xs border border-black text-gray-900"
            style={{ backgroundColor: '#c4d5df' }}
          >
            Add Notes
          </button>
        </>
      )}
    </div>
  )
}
