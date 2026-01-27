'use client'

import { useState } from 'react'
import { submitFeedbackAction } from '@/app/api/feedback/actions'
import { AlertCircle } from 'lucide-react'

interface FeedbackFormProps {
  relatedUserId?: string
  relatedPostId?: string
  relatedCommentId?: string
  onSuccess?: () => void
}

export default function FeedbackForm({ 
  relatedUserId, 
  relatedPostId, 
  relatedCommentId,
  onSuccess 
}: FeedbackFormProps) {
  const [type, setType] = useState<'complaint' | 'suggestion' | 'bug_report' | 'other'>('complaint')
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData()
    formData.append('type', type)
    formData.append('subject', subject)
    formData.append('content', content)
    if (relatedUserId) formData.append('related_user_id', relatedUserId)
    if (relatedPostId) formData.append('related_post_id', relatedPostId)
    if (relatedCommentId) formData.append('related_comment_id', relatedCommentId)

    const result = await submitFeedbackAction(formData)

    if (result.success) {
      setSuccess(true)
      setSubject('')
      setContent('')
      if (onSuccess) {
        setTimeout(() => {
          onSuccess()
        }, 1500)
      }
    } else {
      setError(result.error || 'Failed to submit feedback')
    }

    setLoading(false)
  }

  return (
    <div className="border border-black p-6" style={{ backgroundColor: '#c4d5df' }}>
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle size={20} style={{ color: '#894f69' }} />
        <h3 className="text-lg font-semibold text-gray-900">Submit Feedback</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="type" className="block text-sm font-medium mb-2 text-gray-900">
            Type
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="w-full px-3 py-2 border border-black bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="complaint">Complaint</option>
            <option value="suggestion">Suggestion</option>
            <option value="bug_report">Bug Report</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium mb-2 text-gray-900">
            Subject
          </label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-2 border border-black bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Brief description..."
            required
            maxLength={200}
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium mb-2 text-gray-900">
            Details
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 border border-black bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={5}
            placeholder="Please provide details..."
            required
            maxLength={2000}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-black text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-black text-green-700 px-4 py-3 text-sm">
            Thank you! Your feedback has been submitted and will be reviewed by an admin.
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 border border-black transition"
          style={{ backgroundColor: loading ? '#9ca3af' : '#894f69', fontSize: '18px' }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = '#9a5f79'
          }}
          onMouseLeave={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = '#894f69'
          }}
        >
          {loading ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  )
}
