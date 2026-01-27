'use client'

import { useState } from 'react'
import { loginAction, signupAction } from './actions'

export default function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (isSignUp) {
        const result = await signupAction(formData)
        if (result.error) {
          setError(result.error)
        } else if (result.success) {
          setSuccess(result.message || 'Check your email to confirm your account!')
          setIsSignUp(false)
          // Reset form
          const form = document.querySelector('form') as HTMLFormElement
          if (form) form.reset()
        }
      } else {
        // loginAction will call redirect() on success
        // redirect() throws NEXT_REDIRECT internally - Next.js handles this automatically
        const result = await loginAction(formData)
        if (result?.error) {
          setError(result.error)
        }
        // If no error, redirect() was called and Next.js will handle the navigation
      }
    } catch (err: any) {
      // redirect() throws NEXT_REDIRECT - Next.js handles this automatically
      // Only catch actual errors, not redirects
      if (err.digest?.startsWith('NEXT_REDIRECT')) {
        // Let Next.js handle the redirect
        return
      }
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 border border-black" style={{ backgroundColor: '#c4d5df' }}>
      <h2 className="text-2xl font-semibold mb-6 text-gray-900">
        {isSignUp ? 'Sign Up' : 'Login'}
      </h2>
      <form action={handleSubmit} className="space-y-4">
        {isSignUp && (
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-2 text-gray-900">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required={isSignUp}
              minLength={3}
              pattern="[a-zA-Z0-9_]+"
              className="w-full px-4 py-2 bg-white border border-black focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="username"
            />
            <p className="text-xs text-gray-600 mt-1">
              Letters, numbers, and underscores only. Min 3 characters.
            </p>
          </div>
        )}
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-900">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full px-4 py-2 bg-white border border-black focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2 text-gray-900">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="w-full px-4 py-2 bg-white border border-black focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="••••••••"
          />
        </div>
        {isSignUp && (
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2 text-gray-900">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required={isSignUp}
              minLength={6}
              className="w-full px-4 py-2 bg-white border border-black focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="••••••••"
            />
          </div>
        )}
        {error && (
          <div className="bg-red-100 border border-black text-red-800 px-4 py-3 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-black text-green-800 px-4 py-3 text-sm">
            {success}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 border border-black transition"
          style={{ backgroundColor: loading ? '#9ca3af' : '#894f69', fontSize: '18px' }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#9a5f79'
          }}
          onMouseLeave={(e) => {
            if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#894f69'
          }}
        >
          {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Login'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-700">
        {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp)
            setError(null)
            setSuccess(null)
          }}
          className="text-gray-900 hover:opacity-80 underline font-medium"
          style={{ color: '#894f69' }}
        >
          {isSignUp ? 'Login' : 'Sign Up'}
        </button>
      </p>
    </div>
  )
}

