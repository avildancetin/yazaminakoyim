import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Notifications from '@/components/Notifications'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="border border-black shadow-lg p-6" style={{ backgroundColor: '#c4d5df' }}>
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Notifications</h1>
      <Notifications />
    </div>
  )
}

