import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import LoginForm from './LoginForm'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If user is already logged in, redirect to home
  // (Middleware also handles this, but this is a backup)
  if (user) {
    redirect('/')
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        backgroundImage: 'url(/background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold mb-8 text-center" style={{ color: '#894f69', fontSize: '54px' }}>yazamınakoyim</h1>
        <LoginForm />
      </div>
    </div>
  )
}
