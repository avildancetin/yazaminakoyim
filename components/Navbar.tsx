'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, Plus, User, Search } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function Navbar() {
  const router = useRouter()
  const supabase = createClient()
  const [searchQuery, setSearchQuery] = useState('')

  const handleLogout = async () => {
    await supabase.auth.signOut()
    // Navigate to home page (which shows login/signup when logged out)
    // router.push will automatically trigger a refresh
    router.push('/')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <form onSubmit={handleSearch} className="flex items-stretch">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search users or posts..."
          className="px-3 py-1.5 border border-black bg-white text-gray-900 focus:outline-none focus:ring-0"
          style={{ fontSize: '15px', width: '200px' }}
        />
        <button
          type="submit"
          className="flex items-center justify-center px-2 py-1.5 text-white font-medium border border-black border-l-0 transition"
          style={{ backgroundColor: '#894f69', fontSize: '15px' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#9a5f79'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#894f69'}
        >
          <Search size={16} />
        </button>
      </form>
      <Link
        href="/post/create"
        className="flex items-center gap-2 px-3 py-1.5 text-white font-medium border border-black transition"
        style={{ backgroundColor: '#894f69', fontSize: '18px' }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#9a5f79'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#894f69'}
      >
        <Plus size={16} />
        New Post
      </Link>
      <Link
        href="/profile/edit"
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium border border-black transition"
        style={{ fontSize: '18px' }}
      >
        <User size={16} />
        Edit Profile
      </Link>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium border border-black transition"
        style={{ fontSize: '18px' }}
      >
        <LogOut size={16} />
        Logout
      </button>
    </div>
  )
}



