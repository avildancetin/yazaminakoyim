'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield } from 'lucide-react'
import { adminLoginAction } from '@/app/api/admin/auth/actions'

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await adminLoginAction(username, password)

    if (result.success) {
      // Store admin session
      sessionStorage.setItem('admin_authenticated', 'true')
      sessionStorage.setItem('admin_username', username)
      router.push('/admin-panel')
    } else {
      setError(result.error || 'Invalid credentials')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#c4d5df' }}>
      <div className="border border-black shadow-lg p-8 max-w-md w-full" style={{ backgroundColor: '#e8f0f5' }}>
        <div className="flex items-center gap-3 mb-6">
          <Shield size={32} style={{ color: '#894f69' }} />
          <h1 className="text-3xl font-bold" style={{ color: '#894f69' }}>Admin Login</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-2 text-gray-900">
              Admin Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-black bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin"
              required
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2 text-gray-900">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-black bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter admin password"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-black text-red-700 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 border border-black transition"
            style={{ backgroundColor: loading ? '#9ca3af' : '#894f69', fontSize: '18px' }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = '#9a5f79'
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = '#894f69'
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-black">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            ← Back to site
          </Link>
        </div>
      </div>
    </div>
  )
}
