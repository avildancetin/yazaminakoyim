'use client'

import { useState } from 'react'
import { Link2, Check } from 'lucide-react'
import { copyToClipboard } from '@/utils/copyToClipboard'

interface CopyPostLinkButtonProps {
  postId: string
}

export default function CopyPostLinkButton({ postId }: CopyPostLinkButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const postUrl = `${window.location.origin}/post/${postId}`
    const success = await copyToClipboard(postUrl)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 hover:opacity-80 transition"
      title={copied ? 'Link copied!' : 'Copy post link'}
      style={{ color: copied ? '#10b981' : '#6b7280' }}
    >
      {copied ? <Check size={16} /> : <Link2 size={16} />}
    </button>
  )
}



