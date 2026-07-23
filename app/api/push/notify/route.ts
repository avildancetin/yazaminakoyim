import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { getNotificationMessage, getNotificationLink } from '@/utils/notificationMessage'

export const runtime = 'nodejs'

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Webhook target for Supabase Database Webhooks on notifications INSERT.
// Not a user-facing route -- authenticated via a shared secret header, not a session.
export async function POST(request: Request) {
  const secret = request.headers.get('x-webhook-secret')
  if (!process.env.PUSH_WEBHOOK_SECRET || secret !== process.env.PUSH_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const record = body.record

  if (!record) {
    return NextResponse.json({ error: 'No record in payload' }, { status: 400 })
  }

  const supabase = getAdminClient()

  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', record.user_id)

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ success: true, sent: 0 })
  }

  const { data: actor } = await supabase
    .from('profiles')
    .select('username, email')
    .eq('id', record.actor_id)
    .single()

  const actorName = actor?.username || actor?.email?.split('@')[0] || 'Someone'
  const message = getNotificationMessage(record.type, actorName, !!record.comment_id)
  const link = getNotificationLink(record, actorName)

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  const payload = JSON.stringify({
    title: 'yazamınakoyim',
    body: message,
    url: link,
  })

  let sent = 0
  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
        sent++
      } catch (err: any) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        } else {
          console.error('Push send failed:', err.message)
        }
      }
    })
  )

  return NextResponse.json({ success: true, sent })
}
