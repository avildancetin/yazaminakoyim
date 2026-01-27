'use client'

import { useState } from 'react'

interface ProfileTabsProps {
  postsCount: number
  taggedCount: number
  onTabChange: (tab: 'posts' | 'tagged') => void
  activeTab: 'posts' | 'tagged'
}

export default function ProfileTabs({ postsCount, taggedCount, onTabChange, activeTab }: ProfileTabsProps) {
  return (
    <div className="flex gap-3 mb-6">
      <button
        onClick={() => onTabChange('posts')}
        className="flex items-center gap-2 px-3 py-1.5 text-gray-800 font-medium border border-black transition"
        style={{ 
          fontSize: '18px',
          backgroundColor: '#c4d5df',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#b4c5cf'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#c4d5df'
        }}
      >
        Posts ({postsCount})
      </button>
      <button
        onClick={() => onTabChange('tagged')}
        className="flex items-center gap-2 px-3 py-1.5 text-gray-800 font-medium border border-black transition"
        style={{ 
          fontSize: '18px',
          backgroundColor: '#c4d5df',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#b4c5cf'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#c4d5df'
        }}
      >
        Tagged ({taggedCount})
      </button>
    </div>
  )
}

