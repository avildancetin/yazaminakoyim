'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import CommentForm from './CommentForm'
import { deleteCommentAction } from '@/app/api/comments/actions'
import PostContent from './PostContent'
import { Trash2 } from 'lucide-react'
import Link from 'next/link'
import { formatDateTime } from '@/utils/formatDateTime'

interface Comment {
  id: string
  post_id: string
  user_id: string
  parent_comment_id: string | null
  content: string
  created_at: string
  profiles: {
    id: string
    username: string | null
    email: string
    avatar_url: string | null
  }
  replies?: Comment[]
}

interface CommentsListProps {
  postId: string
  currentUserId?: string
}

export default function CommentsList({ postId, currentUserId }: CommentsListProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())
  const [showComments, setShowComments] = useState(false)
  const supabase = createClient()

  const fetchComments = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          email,
          avatar_url
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching comments:', error)
      setLoading(false)
      return
    }

    // Organize comments into tree structure
    const topLevelComments: Comment[] = []
    const repliesMap: { [key: string]: Comment[] } = {}

    data?.forEach((comment: any) => {
      const commentWithProfile: Comment = {
        ...comment,
        profiles: comment.profiles,
        replies: []
      }

      if (comment.parent_comment_id) {
        if (!repliesMap[comment.parent_comment_id]) {
          repliesMap[comment.parent_comment_id] = []
        }
        repliesMap[comment.parent_comment_id].push(commentWithProfile)
      } else {
        topLevelComments.push(commentWithProfile)
      }
    })

    // Attach replies to their parent comments
    const attachReplies = (comment: Comment): Comment => {
      const replies = repliesMap[comment.id] || []
      return {
        ...comment,
        replies: replies.map(attachReplies)
      }
    }

    setComments(topLevelComments.map(attachReplies))
    setLoading(false)
  }

  useEffect(() => {
    fetchComments()
  }, [postId])

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    const result = await deleteCommentAction(commentId)
    if (result.success) {
      fetchComments()
    } else {
      alert(result.error || 'Failed to delete comment')
    }
  }

  const toggleReplies = (commentId: string) => {
    const newExpanded = new Set(expandedReplies)
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId)
    } else {
      newExpanded.add(commentId)
    }
    setExpandedReplies(newExpanded)
  }

  const renderComment = (comment: Comment, depth: number = 0) => {
    const hasReplies = comment.replies && comment.replies.length > 0
    const isExpanded = expandedReplies.has(comment.id)
    const isOwner = currentUserId === comment.user_id

    return (
      <div key={comment.id} className={`mb-4 ${depth > 0 ? 'ml-8 border-l-2 border-black pl-4' : ''}`}>
        <div className="flex items-start gap-3">
          <Link 
            href={`/profile/${encodeURIComponent(comment.profiles.username || comment.profiles.email.split('@')[0])}`}
            className="hover:opacity-80 transition"
          >
            {comment.profiles.avatar_url ? (
              <img
                src={comment.profiles.avatar_url}
                alt={comment.profiles.username || comment.profiles.email}
                className="w-8 h-8 object-cover border border-black cursor-pointer"
              />
            ) : (
              <div className="w-8 h-8 flex items-center justify-center text-xs font-semibold text-white border border-black cursor-pointer" style={{ backgroundColor: '#894f69' }}>
                {(comment.profiles.username || comment.profiles.email).charAt(0).toUpperCase()}
              </div>
            )}
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Link 
                href={`/profile/${encodeURIComponent(comment.profiles.username || comment.profiles.email.split('@')[0])}`}
                className="font-semibold text-gray-900 text-sm cursor-pointer hover:opacity-80 transition"
              >
                {comment.profiles.username || comment.profiles.email.split('@')[0]}
              </Link>
              <span className="text-xs text-gray-500">
                {formatDateTime(comment.created_at)}
              </span>
              {isOwner && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="ml-auto text-red-600 hover:text-red-800"
                  title="Delete comment"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <PostContent content={comment.content} size="small" />
            
            {hasReplies && (
              <button
                onClick={() => toggleReplies(comment.id)}
                className="text-gray-600 hover:text-gray-800 mb-2"
                style={{ color: '#894f69', fontSize: '18px' }}
              >
                {isExpanded ? `Hide ${comment.replies!.length} ${comment.replies!.length === 1 ? 'reply' : 'replies'}` : `Show ${comment.replies!.length} ${comment.replies!.length === 1 ? 'reply' : 'replies'}`}
              </button>
            )}

            {isExpanded && hasReplies && (
              <div className="mt-2">
                {comment.replies!.map(reply => renderComment(reply, Math.min(depth + 1, 1)))}
              </div>
            )}

            <div className="mt-2">
              <CommentForm
                postId={postId}
                parentCommentId={comment.id}
                onSuccess={fetchComments}
                placeholder="Write a reply..."
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="text-sm text-gray-600 py-4">Loading comments...</div>
  }

  return (
    <div className="mt-4">
      <div className="mb-4">
        <CommentForm postId={postId} onSuccess={fetchComments} />
      </div>

      {!showComments ? (
        comments.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">No comments yet. Be the first to comment!</p>
        ) : (
          <button
            onClick={() => setShowComments(true)}
            className="text-gray-900 hover:opacity-80 transition font-medium"
            style={{ color: '#894f69', fontSize: '18px' }}
          >
            Show {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
          </button>
        )
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">
              {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
            </h3>
            <button
              onClick={() => setShowComments(false)}
              className="text-gray-600 hover:text-gray-800 text-sm"
              style={{ color: '#894f69', fontSize: '18px' }}
            >
              Hide comments
            </button>
          </div>

          {comments.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No comments yet. Be the first to comment!</p>
          ) : (
            <div>
              {comments.map(comment => renderComment(comment))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

