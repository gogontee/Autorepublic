// app/dashboard/[id]/mywallet/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import MyWallet from '@/components/dashboard/MyWallet'
import { supabase } from '@/lib/supabase/client'

export default function DashboardMyWalletPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const [error, setError] = useState('')
  const [authorized, setAuthorized] = useState(false)

  // Get user ID from URL
  const userId = params?.id as string

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push('/auth/login')
          return
        }

        // Check if the user owns this dashboard
        if (session.user.id !== userId) {
          router.push(`/dashboard/${session.user.id}`)
          return
        }

        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', session.user.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile:', profileError)
          setError('Failed to load profile')
          setLoading(false)
          return
        }

        setUserData({
          user: session.user,
          profile: profile || null,
          session: session
        })
        setAuthorized(true)
        setLoading(false)
      } catch (err) {
        console.error('Auth error:', err)
        setError('An unexpected error occurred')
        setLoading(false)
      }
    }

    checkAuth()
  }, [userId, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
          <span className="text-white/60 ml-3">Loading your wallet...</span>
        </div>
        <BottomNav />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-white/60">{error}</p>
            <button
              onClick={() => router.push(`/dashboard/${userId}`)}
              className="mt-4 px-6 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-medium text-white transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  if (!authorized || !userData) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-white/60">You don't have access to this page</p>
            <button
              onClick={() => router.push('/auth/login')}
              className="mt-4 px-6 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-medium text-white transition-colors"
            >
              Log In
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="pb-24 md:pb-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Back Button */}
          <button
            onClick={() => router.push(`/dashboard/${userId}`)}
            className="flex items-center gap-2 text-white/40 hover:text-white/60 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Dashboard</span>
          </button>

          <MyWallet userData={userData} />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}