'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Upload, X, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { processPostTags } from '@/app/api/tags/actions'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export default function CreatePostPage() {
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Check file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`)
      return
    }

    // Check file type
    const isImage = selectedFile.type.startsWith('image/')
    const isVideo = selectedFile.type.startsWith('video/')

    if (!isImage && !isVideo) {
      setError('Please upload an image or video file')
      return
    }

    setFile(selectedFile)
    setError(null)

    // Create preview
    if (isImage) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    } else {
      setPreview(URL.createObjectURL(selectedFile))
    }
  }

  const removeFile = () => {
    setFile(null)
    setPreview(null)
  }

  const handleSubmit = async (e: React.FormEvent, isDraft: boolean = false) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('You must be logged in to create a post')
      }

      // Validate: If no media, content must be at least 30 characters (only when publishing, not for drafts)
      if (!isDraft && !file && content.trim().length < 30) {
        setError('Posts without media must contain at least 30 characters')
        setLoading(false)
        return
      }

      let mediaUrl: string | null = null
      let mediaType: 'image' | 'video' | null = null

      // Upload file if present
      if (file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`
        const filePath = `media/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) throw uploadError

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('media')
          .getPublicUrl(filePath)

        mediaUrl = urlData.publicUrl
        mediaType = file.type.startsWith('image/') ? 'image' : 'video'
      }

      // Create post (as draft or published)
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
          content,
          media_url: mediaUrl,
          media_type: mediaType,
          user_id: user.id,
          draft: isDraft,
        })
        .select()
        .single()

      if (postError) throw postError

      // Process tags only if post is published (not draft)
      if (!isDraft && postData) {
        try {
          const tagResult = await processPostTags(postData.id, content, user.id)
          if (tagResult.error) {
            console.error('Tag processing error:', tagResult.error)
            // Don't fail the post creation if tagging fails
          }
        } catch (tagError) {
          console.error('Error processing tags:', tagError)
          // Don't fail the post creation if tagging fails
        }
      }

      if (isDraft) {
        router.push('/drafts')
      } else {
        router.push('/')
      }
    } catch (err: any) {
      setError(err.message || `Failed to ${isDraft ? 'save draft' : 'create post'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen">
      {/* Header with Back to Home button */}
      <header className="border-b border-white sticky top-0 z-50" style={{ backgroundColor: '#c4d5df' }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-1.5 text-gray-900 font-medium border border-white transition hover:opacity-80"
            style={{ backgroundColor: '#c4d5df', fontSize: '18px' }}
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Main container block */}
        <div className="border border-white shadow-lg p-6" style={{ backgroundColor: '#c4d5df' }}>
          <h1 className="text-2xl font-bold mb-6 text-gray-900">Create New Post</h1>
          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            <div>
              <label htmlFor="content" className="block text-sm font-medium mb-2 text-gray-900">
                What's on your mind?
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required={!file}
                rows={6}
                className="w-full px-4 py-2 border border-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900"
                style={{ backgroundColor: '#c4d5df' }}
                placeholder={file ? "Share your thoughts... (optional)" : "Share your thoughts... (at least 30 characters if no media)"}
              />
              {!file && (
                <p className="text-xs text-gray-600 mt-1">
                  {content.trim().length}/30 characters minimum
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900">
                Media (Optional - Image or Video)
              </label>
              {!file ? (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-white border-dashed cursor-pointer transition" style={{ backgroundColor: '#c4d5df' }}>
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-gray-600" />
                    <p className="mb-2 text-sm text-gray-700">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-600">Image or Video (MAX. 50MB)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                  />
                </label>
              ) : (
                <div className="relative">
                  {file.type.startsWith('image/') ? (
                    <img
                      src={preview!}
                      alt="Preview"
                      className="w-full h-auto max-h-96 object-contain border border-white"
                    />
                  ) : (
                    <video
                      src={preview!}
                      controls
                      className="w-full h-auto max-h-96 border border-white"
                    />
                  )}
                  <button
                    type="button"
                    onClick={removeFile}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 border border-white transition"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-white text-red-700 px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                onClick={(e) => handleSubmit(e, false)}
                className="flex-1 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 border border-white transition"
                style={{ backgroundColor: loading ? '#9ca3af' : '#894f69', fontSize: '18px' }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = '#9a5f79'
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = '#894f69'
                }}
              >
                {loading ? 'Posting...' : 'Post'}
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={loading}
                className="flex-1 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 border border-white transition"
                style={{ backgroundColor: loading ? '#9ca3af' : '#894f69', fontSize: '18px' }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = '#9a5f79'
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = '#894f69'
                }}
              >
                {loading ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/')}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 border border-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontSize: '18px' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}



