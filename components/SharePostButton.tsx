'use client'

import { useMemo, useState } from 'react'
import { Share2, Check } from 'lucide-react'
import { zipSync } from 'fflate'
import { copyToClipboard } from '@/utils/copyToClipboard'
import { splitContentIntoChunks, getPartLimits } from '@/utils/postShareChunks'

interface SharePostButtonProps {
  postId: string
  content: string
  hasMedia?: boolean
}

async function fetchImageFile(url: string, filename: string): Promise<File> {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to generate share image')
  const blob = await res.blob()
  return new File([blob], filename, { type: 'image/png' })
}

function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(objectUrl)
}

async function downloadAsZip(files: File[], zipName: string) {
  const entries: Record<string, Uint8Array> = {}
  for (const file of files) {
    entries[file.name] = new Uint8Array(await file.arrayBuffer())
  }
  const zipped = zipSync(entries)
  downloadBlob(new Blob([zipped], { type: 'application/zip' }), zipName)
}

export default function SharePostButton({ postId, content, hasMedia = false }: SharePostButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')
  const [hint, setHint] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const chunks = useMemo(() => {
    const { maxChars, maxLines } = getPartLimits(hasMedia)
    return splitContentIntoChunks(content, maxChars, maxLines)
  }, [content, hasMedia])
  const isLong = chunks.length > 1

  const finish = (message: string) => {
    setHint(message)
    setStatus('done')
    setTimeout(() => {
      setStatus('idle')
      setHint(null)
    }, 3000)
  }

  const shareFiles = async (files: File[]) => {
    const postUrl = `${window.location.origin}/post/${postId}`
    const preview = content.length > 200 ? content.slice(0, 200).trimEnd() + '…' : content

    if (navigator.canShare?.({ files })) {
      await navigator.share({ files, text: preview, url: postUrl })
      finish('Shared!')
    } else if (files.length === 1) {
      downloadBlob(files[0], files[0].name)
      await copyToClipboard(postUrl)
      finish('Image downloaded — link copied, paste both into your story!')
    } else {
      await downloadAsZip(files, 'post-images.zip')
      await copyToClipboard(postUrl)
      finish(`${files.length} images downloaded as a zip — link copied!`)
    }
  }

  const handlePreview = async () => {
    setMenuOpen(false)
    if (status === 'loading') return
    setStatus('loading')
    setHint(null)
    try {
      const file = await fetchImageFile(`/api/posts/${postId}/share-image`, 'post.png')
      await shareFiles([file])
    } catch (err: any) {
      if (err?.name !== 'AbortError') console.error('Share failed:', err)
      setStatus('idle')
    }
  }

  const handleFullText = async () => {
    setMenuOpen(false)
    if (status === 'loading') return
    setStatus('loading')
    setHint(null)
    try {
      const files = await Promise.all(
        chunks.map((_, i) =>
          fetchImageFile(`/api/posts/${postId}/share-image?part=${i + 1}`, `post-part-${i + 1}.png`)
        )
      )
      await shareFiles(files)
    } catch (err: any) {
      if (err?.name !== 'AbortError') console.error('Share failed:', err)
      setStatus('idle')
    }
  }

  const handleClick = () => {
    if (status === 'loading') return
    if (isLong) {
      setMenuOpen((open) => !open)
    } else {
      handlePreview()
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={status === 'loading'}
        className="p-1.5 hover:opacity-80 transition disabled:opacity-50"
        title={hint || 'Share post'}
        style={{ color: status === 'done' ? '#10b981' : '#6b7280' }}
      >
        {status === 'done' ? <Check size={16} /> : <Share2 size={16} />}
      </button>

      {menuOpen && (
        <div
          className="absolute right-0 top-full mt-1 z-10 border border-black shadow-lg flex flex-col"
          style={{ backgroundColor: '#c4d5df', minWidth: 180 }}
        >
          <button
            onClick={handlePreview}
            className="px-3 py-2 text-left text-sm hover:opacity-80 transition text-gray-900 border-b border-black"
          >
            Preview card (…)
          </button>
          <button
            onClick={handleFullText}
            className="px-3 py-2 text-left text-sm hover:opacity-80 transition text-gray-900"
          >
            Full text ({chunks.length} images)
          </button>
        </div>
      )}
    </div>
  )
}
