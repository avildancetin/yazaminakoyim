// Shared Supabase select string for fetching a post plus its quoted post (if any).
// The `quoted_post:quoted_post_id` alias disambiguates the self-referencing FK.
//
// Deliberately does NOT embed the quoted post's author profile here -- this project's
// posts->profiles relationship isn't resolvable via PostgREST embeds (same reason every
// other post query in this codebase fetches profiles separately and merges manually).
// Use attachQuotedPostProfiles() below to fill that in.
export const POST_SELECT_WITH_QUOTE = `*, quoted_post:quoted_post_id ( id, content, media_url, media_type, created_at, user_id )`

interface MinimalProfile {
  id: string
  email: string
  username: string | null
  avatar_url: string | null
}

export async function attachQuotedPostProfiles<T extends { quoted_post?: any }>(
  supabase: any,
  posts: T[]
): Promise<T[]> {
  const quotedUserIds = [...new Set(posts.map((p) => p.quoted_post?.user_id).filter(Boolean))]
  if (quotedUserIds.length === 0) return posts

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, username, avatar_url')
    .in('id', quotedUserIds)

  const profileMap = new Map<string, MinimalProfile>(
    (profiles || []).map((p: MinimalProfile) => [p.id, p])
  )

  return posts.map((post) => {
    if (!post.quoted_post) return post
    return {
      ...post,
      quoted_post: {
        ...post.quoted_post,
        profiles: profileMap.get(post.quoted_post.user_id) || {
          id: post.quoted_post.user_id,
          email: 'Unknown',
          username: null,
          avatar_url: null,
        },
      },
    }
  })
}
