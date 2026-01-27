'use client'

import Link from 'next/link'

interface SearchFilterButtonProps {
  href: string
  isActive: boolean
  children: React.ReactNode
}

export default function SearchFilterButton({ href, isActive, children }: SearchFilterButtonProps) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 border border-black transition ${
        isActive ? 'text-white' : 'text-gray-900'
      }`}
      style={{
        backgroundColor: isActive ? '#894f69' : '#c4d5df',
        fontSize: '15px'
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = '#a4ac86'
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = '#c4d5df'
        }
      }}
    >
      {children}
    </Link>
  )
}



