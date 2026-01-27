'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { Upload, X, ArrowLeft, Save, Send } from 'lucide-react'
import Link from 'next/link'
import { updateDraftAction, publishDraftAction } from '@/app/api/drafts/actions'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export default function EditDraftPage() {
  const params = useParams()
  const draftId = params.draftId as string
  const router = useRouter()
  const supabase = createClient()
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [existingMediaUrl, setExistingMediaUrl] = useState<string | null>(null)
  const [existingMediaType, setExistingMediaType] = useState<'image' | 'video' | null>(null)
  const [removeMedia, setRemoveMedia] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDraft()
  }, [draftId])

  const loadDraft = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: draft, error: draftError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', draftId)
        .eq('user_id', user.id)
        .eq('draft', true)
        .single()

      if (draftError || !draft) {
        setError('Draft not found')
        setLoading(false)
        return
      }

      setContent(draft.content)
      if (draft.media_url) {
        setExistingMediaUrl(draft.media_url)
        setExistingMediaType(draft.media_type as 'image' | 'video' | null)
        setPreview(draft.media_url)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load draft')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`)
      return
    }

    const isImage = selectedFile.type.startsWith('image/')
    const isVideo = selectedFile.type.startsWith('video/')

    if (!isImage && !isVideo) {
      setError('Please upload an image or video file')
      return
    }

    setFile(selectedFile)
    setRemoveMedia(false) // Clear remove flag when uploading new file
    setError(null)

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
    // If there's a newly selected file, just remove it and show existing media (if not marked for removal)
    if (file) {
      setFile(null)
      if (removeMedia || !existingMediaUrl) {
        // If existing media was marked for removal or doesn't exist, clear preview
        setPreview(null)
      } else {
        // Otherwise show existing media
        setPreview(existingMediaUrl)
      }
    } else if (existingMediaUrl && !removeMedia) {
      // If there's existing media that hasn't been marked for removal, mark it for removal
      setRemoveMedia(true)
      setPreview(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent, shouldPublish: boolean = false) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('You must be logged in to update a draft')
      }

      let mediaUrl: string | null = existingMediaUrl
      let mediaType: 'image' | 'video' | null = existingMediaType

      // If user wants to remove media, set to null
      if (removeMedia) {
        mediaUrl = null
        mediaType = null
      } else if (file) {
        // Upload new file if present (this replaces existing media)
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

        const { data: urlData } = supabase.storage
          .from('media')
          .getPublicUrl(filePath)

        mediaUrl = urlData.publicUrl
        mediaType = file.type.startsWith('image/') ? 'image' : 'video'
      }

      // Update draft first
      const updateResult = await updateDraftAction(draftId, content, mediaUrl, mediaType)

      if (updateResult.error) {
        setError(updateResult.error)
        setSaving(false)
        return
      }

      // Update local state after successful save
      if (removeMedia) {
        setExistingMediaUrl(null)
        setExistingMediaType(null)
        setRemoveMedia(false)
      } else if (file) {
        // Update existing media URL to the new one
        setExistingMediaUrl(mediaUrl)
        setExistingMediaType(mediaType)
        setFile(null)
      }

      // If should publish, validate before publishing
      if (shouldPublish) {
        // Validate: If no media, content must be at least 30 characters
        if (!mediaUrl && content.trim().length < 30) {
          setError('Posts without media must contain at least 30 characters')
          setSaving(false)
          return
        }

        const publishResult = await publishDraftAction(draftId)
        if (publishResult.error) {
          setError(publishResult.error)
          setSaving(false)
          return
        }
        router.push('/')
      } else {
        router.push('/drafts')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update draft')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-white sticky top-0 z-50" style={{ backgroundColor: '#c4d5df' }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center">
          <Link
            href="/drafts"
            className="flex items-center gap-2 px-3 py-1.5 text-gray-900 font-medium border border-white transition hover:opacity-80"
            style={{ backgroundColor: '#c4d5df', fontSize: '18px' }}
          >
            <ArrowLeft size={16} />
            Back to Drafts
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="border border-white shadow-lg p-6" style={{ backgroundColor: '#c4d5df' }}>
          <h1 className="text-2xl font-bold mb-6 text-gray-900">Edit Draft</h1>
          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            <div>
              <label htmlFor="content" className="block text-sm font-medium mb-2 text-gray-900">
                What's on your mind?
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required={!preview}
                rows={6}
                className="w-full px-4 py-2 border border-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900"
                style={{ backgroundColor: '#c4d5df' }}
                placeholder={preview ? "Share your thoughts... (optional)" : "Share your thoughts... (at least 30 characters if no media)"}
              />
              {!preview && (
                <p className="text-xs text-gray-600 mt-1">
                  {content.trim().length}/30 characters minimum
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900">
                Media (Optional - Image or Video)
              </label>
              {!preview ? (
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
              ) : preview ? (
                <div className="relative">
                  {existingMediaType === 'image' || (file && file.type.startsWith('image/')) ? (
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-auto max-h-96 object-contain border border-white"
                    />
                  ) : (
                    <video
                      src={preview}
                      controls
                      className="w-full h-auto max-h-96 border border-white"
                    />
                  )}
                  <button
                    type="button"
                    onClick={removeFile}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 border border-white transition"
                    title={file ? "Remove new file" : "Remove media"}
                  >
                    <X size={20} />
                  </button>
                </div>
              ) : null}
            </div>

            {error && (
              <div className="bg-red-50 border border-white text-red-700 px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                onClick={(e) => handleSubmit(e, false)}
                className="flex-1 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 border border-white transition flex items-center justify-center gap-2"
                style={{ backgroundColor: saving ? '#9ca3af' : '#894f69', fontSize: '18px' }}
                onMouseEnter={(e) => {
                  if (!saving) e.currentTarget.style.backgroundColor = '#9a5f79'
                }}
                onMouseLeave={(e) => {
                  if (!saving) e.currentTarget.style.backgroundColor = '#894f69'
                }}
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={saving}
                className="flex-1 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 border border-white transition flex items-center justify-center gap-2"
                style={{ backgroundColor: saving ? '#9ca3af' : '#894f69', fontSize: '18px' }}
                onMouseEnter={(e) => {
                  if (!saving) e.currentTarget.style.backgroundColor = '#9a5f79'
                }}
                onMouseLeave={(e) => {
                  if (!saving) e.currentTarget.style.backgroundColor = '#894f69'
                }}
              >
                <Send size={16} />
                {saving ? 'Posting...' : 'Post'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/drafts')}
                disabled={saving}
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

