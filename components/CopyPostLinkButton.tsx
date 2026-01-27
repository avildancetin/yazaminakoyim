'use client'

import { useState } from 'react'
import { Link2, Check } from 'lucide-react'

interface CopyPostLinkButtonProps {
  postId: string
}

export default function CopyPostLinkButton({ postId }: CopyPostLinkButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const postUrl = `${window.location.origin}/post/${postId}`
    
    try {
      await navigator.clipboard.writeText(postUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = postUrl
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr)
      }
      document.body.removeChild(textArea)
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



