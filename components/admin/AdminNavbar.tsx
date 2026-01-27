'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield } from 'lucide-react'
import { adminLogoutAction } from '@/app/api/admin/auth/actions'

export default function AdminNavbar() {
  const router = useRouter()

  const handleLogout = async () => {
    await adminLogoutAction()
    sessionStorage.removeItem('admin_authenticated')
    sessionStorage.removeItem('admin_username')
    router.push('/admin-login')
  }

  return (
    <header className="border-b border-black sticky top-0 z-50" style={{ backgroundColor: '#c4d5df' }}>
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/admin-panel" className="flex items-center gap-2">
          <Shield size={24} style={{ color: '#894f69' }} />
          <span className="text-2xl font-bold" style={{ color: '#894f69' }}>Admin Panel</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-700">
            Logged in as <strong>admin</strong>
          </span>
          <button
            onClick={handleLogout}
            className="px-3 py-1 text-sm border border-black bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium transition"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
