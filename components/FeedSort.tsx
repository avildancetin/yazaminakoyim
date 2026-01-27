'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { ArrowUpDown } from 'lucide-react'

type SortOption = 'all-newest' | 'all-oldest' | 'following-newest'

export default function FeedSort() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  
  // Get current sort from URL, default to 'all-newest'
  const urlSort = searchParams.get('sort') || 'all-newest'
  let currentSort: SortOption = 'all-newest'
  
  if (urlSort === 'all-oldest' || urlSort === 'following-newest') {
    currentSort = urlSort as SortOption
  } else if (urlSort === 'all' || urlSort === 'newest') {
    currentSort = 'all-newest'
  } else if (urlSort === 'oldest') {
    currentSort = 'all-oldest'
  } else if (urlSort === 'following') {
    currentSort = 'following-newest'
  }

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)
      
      // If user logs out while on 'following', redirect to default
      if (!user && currentSort === 'following-newest') {
        const params = new URLSearchParams(searchParams.toString())
        params.delete('sort')
        router.push(`/?${params.toString()}`)
      }
    }
    checkAuth()
  }, [currentSort, router, searchParams])

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sort = e.target.value as SortOption
    const params = new URLSearchParams(searchParams.toString())
    
    if (sort === 'all-newest') {
      params.delete('sort')
    } else {
      params.set('sort', sort)
    }
    
    const newUrl = params.toString() ? `/?${params.toString()}` : '/'
    // Use push instead of replace + refresh for better performance
    router.push(newUrl)
  }

  return (
    <div className="mb-6 border border-black p-4" style={{ backgroundColor: '#c4d5df' }}>
      <div className="flex items-center gap-3">
        <ArrowUpDown size={18} className="text-gray-900" />
        <label htmlFor="sort-select" className="text-lg font-semibold text-gray-900">
          Sort:
        </label>
        <select
          id="sort-select"
          value={currentSort}
          onChange={handleSortChange}
          className="px-3 py-2 border border-black bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ fontSize: '15px', minWidth: '200px' }}
        >
          <option value="all-newest">All (newest first)</option>
          <option value="all-oldest">All (oldest first)</option>
          {isLoggedIn && (
            <option value="following-newest">Following (newest first)</option>
          )}
        </select>
      </div>
    </div>
  )
}

