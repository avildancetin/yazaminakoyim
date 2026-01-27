'use client'

import { useState } from 'react'
import PostCard from './PostCard'
import ProfileTabs from './ProfileTabs'

interface ProfileContentProps {
  posts: any[]
  taggedPosts: any[]
  currentUserId?: string
  isFollowing: boolean
  showDeleteButton: boolean
}

export default function ProfileContent({ 
  posts, 
  taggedPosts, 
  currentUserId, 
  isFollowing,
  showDeleteButton 
}: ProfileContentProps) {
  const [activeTab, setActiveTab] = useState<'posts' | 'tagged'>('posts')
  
  const displayPosts = activeTab === 'posts' ? posts : taggedPosts

  return (
    <>
      <ProfileTabs
        postsCount={posts.length}
        taggedCount={taggedPosts.length}
        onTabChange={setActiveTab}
        activeTab={activeTab}
      />
      
      {displayPosts.length === 0 ? (
        <div className="text-center py-12 text-gray-500 border border-black p-8" style={{ backgroundColor: '#c4d5df' }}>
          <p className="text-lg">
            {activeTab === 'posts' ? 'No posts yet.' : 'No tagged posts yet.'}
          </p>
        </div>
      ) : (
        <div>
          {displayPosts.map((post: any) => (
            <PostCard 
              key={post.id} 
              post={post} 
              currentUserId={currentUserId}
              isFollowing={isFollowing}
              showDeleteButton={showDeleteButton}
            />
          ))}
        </div>
      )}
    </>
  )
}



