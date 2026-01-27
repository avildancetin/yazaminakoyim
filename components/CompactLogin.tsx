'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { loginAction } from '@/app/auth/login/actions'

export default function CompactLogin() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const pathname = usePathname()

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setError(null)

    // Add current pathname to form data so we can redirect back after login
    formData.append('next', pathname || '/')

    try {
      const result = await loginAction(formData)
      if (result?.error) {
        setError(result.error)
      }
    } catch (err: any) {
      if (err.digest?.startsWith('NEXT_REDIRECT')) {
        return
      }
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="flex items-center gap-2">
          <input
            name="email"
            type="text"
            placeholder="Email or Username"
            required
            className="px-3 py-1.5 text-sm border border-black focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
            style={{ backgroundColor: '#c4d5df' }}
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            className="px-3 py-1.5 text-sm border border-black focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
            style={{ backgroundColor: '#c4d5df' }}
          />
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-1.5 font-semibold disabled:bg-gray-400 text-white border border-black transition"
        style={{ backgroundColor: loading ? '#9ca3af' : '#894f69', fontSize: '18px' }}
        onMouseEnter={(e) => {
          if (!loading) e.currentTarget.style.backgroundColor = '#9a5f79'
        }}
        onMouseLeave={(e) => {
          if (!loading) e.currentTarget.style.backgroundColor = '#894f69'
        }}
      >
        {loading ? '...' : 'Log In'}
      </button>
      {error && (
        <span className="text-xs text-red-500 max-w-[150px] truncate" title={error}>
          {error}
        </span>
      )}
    </form>
  )
}

