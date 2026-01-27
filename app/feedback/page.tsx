import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Home as HomeIcon, UserPlus, Bell, User, FileText, AlertCircle } from 'lucide-react'
import Navbar from '@/components/Navbar'
import FeedbackForm from '@/components/FeedbackForm'
import UpdateLastSeen from '@/components/UpdateLastSeen'

export const dynamic = 'force-dynamic'

export default async function FeedbackPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, email')
    .eq('id', user.id)
    .single()
  
  const profileUsername = profile?.username || profile?.email.split('@')[0] || 'user'

  // Get unread notification count
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false)

  // Get user's feedback
  const { data: userFeedback } = await supabase
    .from('feedback')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ea580c'
      case 'reviewed': return '#2563eb'
      case 'resolved': return '#16a34a'
      case 'dismissed': return '#6b7280'
      default: return '#6b7280'
    }
  }

  return (
    <div className="min-h-screen">
      <UpdateLastSeen />
      {/* Header */}
      <header className="border-b border-black sticky top-0 z-50" style={{ backgroundColor: '#c4d5df' }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-4xl font-bold" style={{ color: '#894f69', fontSize: '54px' }}>
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
                  className="flex items-center gap-3 px-4 py-3 font-medium"
                  style={{ backgroundColor: 'rgba(137, 79, 105, 0.1)', color: '#894f69' }}
                >
                  <AlertCircle size={20} />
                  <span>Feedback</span>
                </Link>
                <div className="pt-4 border-t border-black">
                  <Link
                    href="/notifications"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition text-gray-900 relative"
                  >
                    <Bell size={20} />
                    <span>Notifications</span>
                    {count && count > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center border border-black">
                        {count > 9 ? '9+' : count}
                      </span>
                    )}
                  </Link>
                </div>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            <div className="border border-black shadow-lg p-6 mb-6" style={{ backgroundColor: '#c4d5df' }}>
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle size={24} style={{ color: '#894f69' }} />
                <h1 className="text-2xl font-bold" style={{ color: '#894f69' }}>Submit Feedback</h1>
              </div>
              <p className="text-gray-700 mb-4">
                Have a complaint, suggestion, or found a bug? Let us know! Your feedback helps us improve the platform.
              </p>
              <FeedbackForm />
            </div>

            {userFeedback && userFeedback.length > 0 && (
              <div className="border border-black shadow-lg p-6" style={{ backgroundColor: '#c4d5df' }}>
                <h2 className="text-xl font-bold mb-4" style={{ color: '#894f69' }}>Your Previous Feedback</h2>
                <div className="space-y-3">
                  {userFeedback.map((item) => (
                    <div
                      key={item.id}
                      className="border border-black p-4"
                      style={{ backgroundColor: '#e8f0f5' }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 text-xs font-bold text-white border border-black" style={{ backgroundColor: '#894f69' }}>
                          {item.type.toUpperCase().replace('_', ' ')}
                        </span>
                        <span
                          className="px-2 py-1 text-xs font-bold text-white border border-black"
                          style={{ backgroundColor: getStatusColor(item.status) }}
                        >
                          {item.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(item.created_at).toLocaleString()}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{item.subject}</h3>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.content}</p>
                      {item.admin_notes && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-black">
                          <p className="text-xs font-semibold text-gray-900 mb-1">Admin Response:</p>
                          <p className="text-xs text-gray-700 whitespace-pre-wrap">{item.admin_notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
