import { createClient } from "@/utils/supabase/server";
import Feed from "@/components/Feed";
import CompactLogin from "@/components/CompactLogin";
import SignupForm from "@/components/SignupForm";
import Navbar from "@/components/Navbar";
import FeedSort from "@/components/FeedSort";
import UpdateLastSeen from "@/components/UpdateLastSeen";
import Link from "next/link";
import { Suspense } from "react";
import { Home as HomeIcon, UserPlus, Bell, User, FileText, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home({ 
  searchParams 
}: { 
  searchParams?: Promise<{ sort?: string }> | { sort?: string }
}) {
  // Unwrap searchParams if it's a Promise (Next.js 15+)
  const resolvedSearchParams = searchParams && typeof searchParams === 'object' && 'then' in searchParams
    ? await searchParams
    : (searchParams as { sort?: string } | undefined)
  
  // Check if environment variables are set
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4" style={{ color: '#894f69' }}>Configuration Error</h1>
          <p className="text-gray-700">Supabase environment variables are not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your Vercel project settings.</p>
        </div>
      </main>
    )
  }

  let user = null;
  let unreadCount = 0;
  let profileUsername = 'user';
  
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;

    if (user) {
      // Get unread notification count
      try {
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('read', false)
        unreadCount = count || 0
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }

      // Get user's profile to get username
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, email')
          .eq('id', user.id)
          .single()
        
        profileUsername = profile?.username || profile?.email.split('@')[0] || 'user'
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    }
  } catch (error) {
    console.error('Error initializing Supabase:', error);
    // Continue without user - show public feed
  }

  if (user) {
    // Logged in - show dashboard layout
    return (
      <div className="min-h-screen">
        <UpdateLastSeen />
        {/* Header */}
        <header className="border-b border-black sticky top-0 z-50" style={{ backgroundColor: '#c4d5df' }}>
          <div className="max-w-7xl mx-auto px-4 py-2 sm:py-3 flex items-center justify-center sm:justify-between">
            <Link href="/" className="text-4xl font-bold" style={{ color: '#894f69', fontSize: 'clamp(28px, 8vw, 54px)' }}>
              yazamınakoyim
            </Link>
            <div className="hidden sm:block">
              <Navbar />
            </div>
          </div>
        </header>
        <div className="border-b border-black sm:hidden" style={{ backgroundColor: '#c4d5df' }}>
          <div className="max-w-7xl mx-auto px-4 py-3">
            <Navbar />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Sidebar */}
            <aside className="lg:col-span-1">
              <div className="border border-black shadow-lg p-6 sticky top-24" style={{ backgroundColor: '#c4d5df' }}>
                <nav className="space-y-2">
                  <Link
                    href="/"
                    className="flex items-center gap-3 px-4 py-3 font-medium"
                    style={{ backgroundColor: 'rgba(137, 79, 105, 0.1)', color: '#894f69' }}
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
                    href={`/profile/${encodeURIComponent(profileUsername)}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition text-gray-900"
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
                  <Link
                    href="/feedback"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition text-gray-900"
                  >
                    <AlertCircle size={20} />
                    <span>Feedback</span>
                  </Link>
                  <div className="pt-4 border-t">
                    <Link
                      href="/notifications"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition text-gray-900 relative"
                    >
                      <Bell size={20} />
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Link>
                  </div>
                </nav>
              </div>
            </aside>

            {/* Main Content - Feed */}
            <div className="lg:col-span-3">
              <Suspense fallback={<div className="mb-6 border border-black p-4" style={{ backgroundColor: '#c4d5df' }}>Loading sort options...</div>}>
                <FeedSort />
              </Suspense>
              <Suspense key={`feed-${resolvedSearchParams?.sort || 'all-newest'}`} fallback={<div className="text-center py-12">Loading posts...</div>}>
                <Feed searchParams={searchParams} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Not logged in - show public feed with login/signup
  return (
    <main className="min-h-screen">
      {/* Header with Login */}
      <header className="border-b border-black sticky top-0 z-50" style={{ backgroundColor: '#c4d5df' }}>
        <div className="max-w-7xl mx-auto px-4 py-2 sm:py-3 flex items-center justify-center sm:justify-between">
          <h1 className="text-4xl font-bold" style={{ color: '#894f69', fontSize: 'clamp(28px, 8vw, 54px)' }}>yazamınakoyim</h1>
          <div className="hidden sm:block">
            <CompactLogin />
          </div>
        </div>
      </header>
      <div className="border-b border-black sm:hidden" style={{ backgroundColor: '#c4d5df' }}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <CompactLogin />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Feed (2 columns on large screens) */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <Suspense fallback={<div className="mb-6 border border-black p-4" style={{ backgroundColor: '#c4d5df' }}>Loading sort options...</div>}>
              <FeedSort />
            </Suspense>
            <Suspense key={`feed-${resolvedSearchParams?.sort || 'all-newest'}`} fallback={<div className="text-center py-12">Loading posts...</div>}>
              <Feed searchParams={searchParams} />
            </Suspense>
          </div>

          {/* Right Side - Signup Form (1 column on large screens), shown first on mobile so it's not buried below the feed */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <SignupForm />
          </div>
        </div>
      </div>
    </main>
  );
}
