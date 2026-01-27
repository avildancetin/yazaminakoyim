'use client'

import { useState } from 'react'
import { signupAction } from '@/app/auth/login/actions'

export default function SignupForm() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await signupAction(formData)
      if (result.error) {
        setError(result.error)
      } else if (result.success) {
        setSuccess(result.message || 'Check your email to confirm your account!')
        const form = document.querySelector('form') as HTMLFormElement
        if (form) form.reset()
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-black shadow-lg p-6 w-full max-w-md" style={{ backgroundColor: '#c4d5df' }}>
      <h2 className="text-3xl font-bold mb-2 text-gray-900">Create an account</h2>
      <p className="text-sm text-gray-600 mb-4">It's quick and easy.</p>
      
      <form action={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <input
            name="username"
            type="text"
            placeholder="Username"
            required
            minLength={3}
            pattern="[a-zA-Z0-9_]+"
            className="px-4 py-2 border border-black focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
            style={{ backgroundColor: '#c4d5df' }}
          />
        </div>
        
        <input
          name="email"
          type="email"
          placeholder="Email address"
          required
          className="w-full px-4 py-2 border border-black focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
          style={{ backgroundColor: '#c4d5df' }}
        />
        
        <input
          name="password"
          type="password"
          placeholder="New password"
          required
          minLength={6}
          className="w-full px-4 py-2 border border-black focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
          style={{ backgroundColor: '#c4d5df' }}
        />
        
        <input
          name="confirmPassword"
          type="password"
          placeholder="Confirm password"
          required
          minLength={6}
          className="w-full px-4 py-2 border border-black focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
          style={{ backgroundColor: '#c4d5df' }}
        />
        
        {error && (
          <div className="bg-red-50 border border-black text-red-700 px-4 py-2 text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-black text-green-700 px-4 py-2 text-sm">
            {success}
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="w-full disabled:bg-gray-400 text-white font-bold py-2 px-4 border border-black transition"
          style={{ backgroundColor: loading ? '#9ca3af' : '#894f69', fontSize: '18px' }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = '#9a5f79'
          }}
          onMouseLeave={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = '#894f69'
          }}
        >
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>
      </form>
    </div>
  )
}

