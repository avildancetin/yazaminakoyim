'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function PushNotificationToggle() {
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return
    }
    setSupported(true)

    navigator.serviceWorker.register('/sw.js').then(async (registration) => {
      const existing = await registration.pushManager.getSubscription()
      setSubscribed(!!existing)
    })
  }, [])

  const handleEnable = async () => {
    setLoading(true)
    setError(null)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setError('Notification permission was not granted')
        return
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!publicKey) {
        setError('Push notifications are not configured')
        return
      }

      const registration = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      const json = subscription.toJSON()
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      })

      if (!res.ok) {
        throw new Error('Failed to save subscription')
      }

      setSubscribed(true)
    } catch (err: any) {
      setError(err.message || 'Failed to enable notifications')
    } finally {
      setLoading(false)
    }
  }

  const handleDisable = async () => {
    setLoading(true)
    setError(null)
    try {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js')
      const subscription = await registration?.pushManager.getSubscription()

      if (subscription) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
        await subscription.unsubscribe()
      }

      setSubscribed(false)
    } catch (err: any) {
      setError(err.message || 'Failed to disable notifications')
    } finally {
      setLoading(false)
    }
  }

  if (!supported) return null

  return (
    <div className="mb-4 border border-black p-3" style={{ backgroundColor: '#e8f0f5' }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {subscribed ? (
            <Bell size={18} style={{ color: '#894f69' }} />
          ) : (
            <BellOff size={18} className="text-gray-500" />
          )}
          <span className="text-sm text-gray-900">
            {subscribed ? 'Push notifications enabled' : 'Get notified even when this tab is closed'}
          </span>
        </div>
        <button
          type="button"
          onClick={subscribed ? handleDisable : handleEnable}
          disabled={loading}
          className="px-3 py-1.5 text-sm border border-black hover:opacity-80 transition disabled:opacity-50 whitespace-nowrap"
          style={{
            backgroundColor: subscribed ? '#c4d5df' : '#894f69',
            color: subscribed ? '#111827' : 'white',
          }}
        >
          {loading ? '...' : subscribed ? 'Disable' : 'Enable notifications'}
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  )
}
