'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Upload, X, Save } from 'lucide-react'
import { updateProfileAction, changePasswordAction } from './actions'
import Link from 'next/link'
import { Home as HomeIcon, UserPlus, Bell, User, FileText } from 'lucide-react'
import Navbar from '@/components/Navbar'

export default function EditProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profileUsername, setProfileUsername] = useState<string>('')
  
  // Form states
  const [username, setUsername] = useState('')
  const [senKimsinAmk, setSenKimsinAmk] = useState('')
  const [currentlyReading, setCurrentlyReading] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // Error states
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        router.push('/auth/login')
        return
      }

      setUser(currentUser)

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()

      if (profileError) {
        setError('Failed to load profile')
        return
      }

      setProfile(profileData)
      setUsername(profileData.username || '')
      setProfileUsername(profileData.username || profileData.email.split('@')[0] || 'user')
      setSenKimsinAmk(profileData.sen_kimsin_amk || '')
      setCurrentlyReading(profileData.currently_reading || '')
      if (profileData.avatar_url) {
        setAvatarPreview(profileData.avatar_url)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    setAvatarFile(file)
    setError(null)

    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(profile?.avatar_url || null)
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('username', username.trim())
      formData.append('senKimsinAmk', senKimsinAmk.trim())
      formData.append('currentlyReading', currentlyReading.trim())
      formData.append('currentAvatarUrl', profile?.avatar_url || '')
      if (avatarFile) {
        formData.append('avatar', avatarFile)
      }

      const result = await updateProfileAction(formData)

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess('Profile updated successfully!')
        setAvatarFile(null)
        // Reload profile to get updated data
        await loadProfile()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }

    try {
      const formData = new FormData()
      formData.append('currentPassword', currentPassword)
      formData.append('newPassword', newPassword)

      const result = await changePasswordAction(formData)

      if (result.error) {
        setPasswordError(result.error)
      } else {
        setPasswordSuccess('Password changed successfully!')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-black sticky top-0 z-50" style={{ backgroundColor: '#c4d5df' }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-4xl font-bold" style={{ color: '#894f69', fontSize: '36px' }}>
            yazamınakoyim
          </Link>
          <Navbar />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <aside className="lg:col-span-1">
            <div className="border border-black shadow-lg p-6 sticky top-24" style={{ backgroundColor: '#c4d5df' }}>
              <nav className="space-y-2">
                <Link
                  href="/"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition text-gray-900"
                >
                  <HomeIcon size={20} />
                  <span>Home</span>
                </Link>
                <Link
                  href="/following"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition text-gray-900"
                >
                  <UserPlus size={20} />
                  <span>Following</span>
                </Link>
                <Link
                  href={profileUsername ? `/profile/${encodeURIComponent(profileUsername)}` : '#'}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition text-gray-900"
                  onClick={(e) => {
                    if (!profileUsername) {
                      e.preventDefault()
                    }
                  }}
                >
                  <User size={20} />
                  <span>Profile</span>
                </Link>
                <Link
                  href="/drafts"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition text-gray-900"
                >
                  <FileText size={20} />
                  <span>Drafts</span>
                </Link>
                <div className="pt-4 border-t">
                  <Link
                    href="/notifications"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition text-gray-900 relative"
                  >
                    <Bell size={20} />
                    <span>Notifications</span>
                  </Link>
                </div>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            <div className="border border-black shadow-lg p-6" style={{ backgroundColor: '#c4d5df' }}>
          <h1 className="text-2xl font-bold mb-6 text-gray-900">Edit Profile</h1>

          {/* Profile Picture Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Profile Picture</h2>
            <div className="flex items-center gap-6">
              <div className="relative">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Profile"
                    className="w-32 h-32 object-cover border-4 border-black"
                  />
                ) : (
                  <div className="w-32 h-32 flex items-center justify-center text-white text-4xl font-bold" style={{ backgroundColor: '#894f69' }}>
                    {username.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                  </div>
                )}
                {avatarPreview && (
                  <button
                    onClick={removeAvatar}
                    className="absolute top-0 right-0 bg-red-500 text-white p-1 border border-black hover:bg-red-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <div>
                <label 
                  className="flex items-center gap-2 px-4 py-2 text-white border border-black cursor-pointer transition"
                  style={{ backgroundColor: '#894f69' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#9a5f79'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#894f69'}
                >
                  <Upload size={18} />
                  {avatarFile ? 'Change Picture' : 'Upload Picture'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF. Max 5MB</p>
              </div>
            </div>
          </div>

          {/* Username Section */}
          <form onSubmit={handleProfileUpdate} className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Username</h2>
            <div className="mb-4">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                pattern="[a-zA-Z0-9_]+"
                minLength={3}
                className="w-full px-4 py-2 border border-black focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
              <p className="text-xs text-gray-500 mt-1">
                Letters, numbers, and underscores only. Min 3 characters.
              </p>
            </div>

            {/* Sen Kimsin Amk Section */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Sen Kimsin Amk</h2>
              <textarea
                value={senKimsinAmk}
                onChange={(e) => setSenKimsinAmk(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
                maxLength={500}
                className="w-full px-4 py-2 border border-black focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                style={{ fontSize: '15px', resize: 'vertical' }}
              />
              <p className="text-xs text-gray-500 mt-1">
                {senKimsinAmk.length}/500 characters
              </p>
            </div>

            {/* Currently Reading Section */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Currently Reading:</h2>
              <input
                type="text"
                value={currentlyReading}
                onChange={(e) => setCurrentlyReading(e.target.value)}
                placeholder="What are you currently reading?"
                maxLength={100}
                className="w-full px-4 py-2 border border-black focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                style={{ fontSize: '15px' }}
              />
              <p className="text-xs text-gray-500 mt-1">
                {currentlyReading.length}/100 characters
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-black text-red-700 px-4 py-2 mb-4 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-black text-green-700 px-4 py-2 mb-4 text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 disabled:bg-gray-400 text-white border border-black transition"
              style={{ backgroundColor: saving ? '#9ca3af' : '#894f69' }}
              onMouseEnter={(e) => {
                if (!saving) e.currentTarget.style.backgroundColor = '#9a5f79'
              }}
              onMouseLeave={(e) => {
                if (!saving) e.currentTarget.style.backgroundColor = '#894f69'
              }}
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>

          {/* Password Change Section */}
          <div className="border-t pt-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Change Password</h2>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                  className="w-full px-4 py-2 border border-black focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border border-black focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border border-black focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              {passwordError && (
                <div className="bg-red-50 border border-black text-red-700 px-4 py-2 text-sm">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="bg-green-50 border border-black text-green-700 px-4 py-2 text-sm">
                  {passwordSuccess}
                </div>
              )}

              <button
                type="submit"
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white border border-black transition"
              >
                Change Password
              </button>
            </form>
          </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

