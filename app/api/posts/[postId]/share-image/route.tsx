import { ImageResponse } from 'next/og'
import { createClient } from '@/utils/supabase/server'
import { splitContentIntoChunks, getPartLimits, PART_FONT_SIZE } from '@/utils/postShareChunks'

export const runtime = 'edge'

const WIDTH = 1080
const HEIGHT = 1350
const MEDIA_WIDTH = 872
const MEDIA_HEIGHT = 400

const PREVIEW_BANDS = [
  { maxChars: 150, maxLines: 8, fontSize: 64 },
  { maxChars: 280, maxLines: 10, fontSize: 56 },
  { maxChars: 450, maxLines: 12, fontSize: 44 },
  { maxChars: 650, maxLines: 14, fontSize: 36 },
  { maxChars: 900, maxLines: 16, fontSize: 30 },
]

// Smaller budget when a post image also needs room on the same card.
const PREVIEW_BANDS_WITH_MEDIA = [
  { maxChars: 80, maxLines: 3, fontSize: 56 },
  { maxChars: 160, maxLines: 5, fontSize: 44 },
  { maxChars: 260, maxLines: 7, fontSize: 36 },
  { maxChars: 350, maxLines: 9, fontSize: 30 },
]

function pickPreviewBand(len: number, hasMedia: boolean) {
  const bands = hasMedia ? PREVIEW_BANDS_WITH_MEDIA : PREVIEW_BANDS
  return bands.find((band) => len <= band.maxChars) ?? bands[bands.length - 1]
}

function truncate(text: string, maxChars: number, maxLines: number) {
  let truncated = text
  let didTruncate = false

  if (truncated.length > maxChars) {
    truncated = truncated.slice(0, maxChars).trimEnd()
    didTruncate = true
  }

  const lines = truncated.split('\n')
  if (lines.length > maxLines) {
    truncated = lines.slice(0, maxLines).join('\n')
    didTruncate = true
  }

  return didTruncate ? truncated + '…' : truncated
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params
  const { searchParams } = new URL(request.url)
  const partParam = searchParams.get('part')

  const supabase = await createClient()

  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .eq('hidden', false)
    .single()

  if (postError || !post) {
    return new Response('Not found', { status: 404 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, email')
    .eq('id', post.user_id)
    .single()

  const displayName = profile?.username || profile?.email?.split('@')[0] || 'Unknown'
  const initial = displayName.charAt(0).toUpperCase()
  const date = new Date(post.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const hasMedia = post.media_type === 'image' && !!post.media_url
  const showMedia = hasMedia

  let content: string
  let fontSize: number
  let footerText = 'yazamınakoyim'

  if (partParam) {
    const { maxChars, maxLines } = getPartLimits(hasMedia)
    const chunks = splitContentIntoChunks(post.content || '', maxChars, maxLines)
    const partIndex = parseInt(partParam, 10) - 1

    if (Number.isNaN(partIndex) || partIndex < 0 || partIndex >= chunks.length) {
      return new Response('Part not found', { status: 404 })
    }

    content = truncate(chunks[partIndex], maxChars, maxLines)
    fontSize = PART_FONT_SIZE
    footerText = `yazamınakoyim · Part ${partIndex + 1}/${chunks.length}`
  } else {
    const band = pickPreviewBand((post.content || '').length, hasMedia)
    content = truncate(post.content || '', band.maxChars, band.maxLines)
    fontSize = band.fontSize
  }

  const [fontData, bgBuffer] = await Promise.all([
    fetch(new URL('../../../../../public/fonts/VT323-Regular.ttf', import.meta.url)).then((res) =>
      res.arrayBuffer()
    ),
    fetch(new URL('../../../../../public/background.jpg', import.meta.url)).then((res) =>
      res.arrayBuffer()
    ),
  ])
  const bgDataUri = `data:image/jpeg;base64,${Buffer.from(bgBuffer).toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          padding: 56,
          backgroundImage: `url(${bgDataUri})`,
          backgroundSize: '100% 100%',
          fontFamily: 'VT323',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            backgroundColor: '#c4d5df',
            border: '4px solid black',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              padding: '40px 48px',
              backgroundColor: '#7e9fb2',
              borderBottom: '4px solid black',
            }}
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                width={96}
                height={96}
                style={{
                  borderRadius: 9999,
                  objectFit: 'cover',
                  border: '2px solid black',
                }}
              />
            ) : (
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 9999,
                  backgroundColor: '#894f69',
                  color: 'white',
                  fontSize: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid black',
                }}
              >
                {initial}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', fontSize: 48, color: '#111827' }}>
                {displayName}
              </div>
              <div style={{ display: 'flex', fontSize: 28, color: '#374151' }}>
                {date}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              minHeight: 0,
              overflow: 'hidden',
              padding: '56px 48px',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize,
                color: '#111827',
                lineHeight: 1.4,
                whiteSpace: 'pre-wrap',
              }}
            >
              {content}
            </div>
            {showMedia && (
              <img
                src={post.media_url}
                width={MEDIA_WIDTH}
                height={MEDIA_HEIGHT}
                style={{
                  marginTop: 32,
                  objectFit: 'contain',
                  border: '4px solid black',
                }}
              />
            )}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '32px',
              borderTop: '4px solid black',
            }}
          >
            <div style={{ display: 'flex', fontSize: 36, color: '#894f69' }}>
              {footerText}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [{ name: 'VT323', data: fontData, style: 'normal', weight: 400 }],
    }
  )
}
