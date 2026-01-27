'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AlertCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export default function FeedbackFloatingButton() {
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        setIsLoggedIn(!!user)
      } catch {
        setIsLoggedIn(false)
      }
    }

    checkAuth()
  }, [])

  // Hide on feedback page or when not logged in
  if (!isLoggedIn || pathname === '/feedback') {
    return null
  }

  return (
    <Link
      href="/feedback"
      className="fixed bottom-4 left-4 z-50 group"
      aria-label="Give feedback"
    >
      <div
        className="flex items-center gap-2 px-4 py-2 border border-black shadow-lg bg-[#c4d5df] text-gray-900 group-hover:bg-[#e8f0f5] transition"
      >
        <AlertCircle size={18} style={{ color: '#894f69' }} />
        <span className="font-semibold" style={{ color: '#894f69' }}>
          Feedback
        </span>
      </div>
    </Link>
  )
}
