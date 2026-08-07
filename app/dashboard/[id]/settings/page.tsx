'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import ProfileSettings from '@/components/dashboard/ProfileSettings'
import { supabase } from '@/lib/supabase/client'

export default function DashboardSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  // Get user ID from URL
  const userId = params?.id as string

  // Check authentication and authorization
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get the current session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error || !session) {
          console.log('No session found, redirecting to login')
          router.replace('/auth/login')
          setLoading(false)
          return
        }

        setUser(session.user)
        setSession(session)

        // Check if the user owns this dashboard
        if (session.user.id !== userId) {
          console.log('User does not own this dashboard, redirecting to their own')
          router.replace(`/dashboard/${session.user.id}`)
          setLoading(false)
          return
        }

        setAuthorized(true)
        setLoading(false)
      } catch (error) {
        console.error('Auth check error:', error)
        router.replace('/auth/login')
        setLoading(false)
      }
    }

    checkAuth()
  }, [userId, router])

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user || !authorized) {
        return
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching user profile:', error)
        } else {
          setUserProfile(data)
        }
      } catch (err) {
        console.error('Error:', err)
      }
    }

    fetchUserProfile()
  }, [user, authorized])

  // Handle back to dashboard
  const goBackToDashboard = () => {
    router.push(`/dashboard/${userId}`)
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
          <span className="text-white/60 ml-3">Loading settings...</span>
        </div>
        <BottomNav />
      </div>
    )
  }

  // If not authorized, don't render anything (will redirect)
  if (!authorized) {
    return null
  }

  // Prepare user data for ProfileSettings component
  const userData = {
    user: user,
    profile: userProfile,
    session: session
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="pb-24 md:pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Back Button */}
          <button
            onClick={goBackToDashboard}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm">Back to Dashboard</span>
          </button>

          {/* Profile Settings */}
          <ProfileSettings userData={userData} />
        </div>
      </main>

      <BottomNav />
    </div>
  )
}