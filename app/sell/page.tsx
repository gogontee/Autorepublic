'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, X, LogIn, UserPlus, ArrowLeft } from 'lucide-react'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import SellComponent from '@/components/dashboard/Sell'
import { supabase } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'

export default function SellPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          setShowAuthModal(true)
          setLoading(false)
          return
        }

        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', session.user.id)
          .single()

        setUserData({
          user: session.user,
          profile: profile,
          session: null
        })
        setLoading(false)
      } catch (error) {
        console.error('Auth error:', error)
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleLogin = () => {
    router.push('/auth/login')
  }

  const handleSignup = () => {
    router.push('/auth/signup')
  }

  const handleGoBack = () => {
    router.back()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
          <span className="text-white/60 ml-3">Loading...</span>
        </div>
        <BottomNav />
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <main className="pb-24 md:pb-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {/* Show a blurred/hidden version of the sell page behind modal */}
            <div className="opacity-20 pointer-events-none">
              <div className="bg-white/5 rounded-xl border border-white/5 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-white/60">Vehicle Images *</label>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} className="aspect-square rounded-lg bg-white/5 border border-white/10" />
                  ))}
                </div>
                <div className="h-6" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="h-10 bg-white/5 rounded-xl" />
                  <div className="h-10 bg-white/5 rounded-xl" />
                </div>
              </div>
            </div>

            {/* Auth Modal - Centered */}
            <AnimatePresence>
              {showAuthModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 300,
                      damping: 25,
                      opacity: { duration: 0.2 }
                    }}
                    className="relative bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 max-w-sm w-full border border-white/10 shadow-2xl"
                  >
                    {/* Close Button */}
                    <button
                      onClick={handleGoBack}
                      className="absolute top-3 right-3 p-1 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-white/40 hover:text-white/60 transition-colors" />
                    </button>

                    {/* Icon */}
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center">
                        <LogIn className="w-8 h-8 text-rose-400" />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-white text-center mb-2">
                      Login Required
                    </h3>
                    
                    {/* Description */}
                    <p className="text-sm text-white/60 text-center mb-1">
                      You need to be logged in to start selling on 
                      <span className="text-white font-medium block mt-1">Auto Republic</span>
                    </p>
                    
                    <p className="text-xs text-white/30 text-center mt-2 mb-5">
                      Don't have an account? Create one in seconds.
                    </p>

                    {/* Buttons */}
                    <div className="space-y-2.5">
                      <button
                        onClick={handleLogin}
                        className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 rounded-xl text-sm font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25"
                      >
                        <LogIn className="w-4 h-4" />
                        Login
                      </button>
                      
                      <button
                        onClick={handleSignup}
                        className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium text-white/80 hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        Create Account
                      </button>

                      <button
                        onClick={handleGoBack}
                        className="w-full py-2 bg-transparent hover:bg-white/5 rounded-xl text-xs font-medium text-white/40 hover:text-white/60 transition-all flex items-center justify-center gap-1.5"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        Go Back
                      </button>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 pt-3 border-t border-white/5">
                      <p className="text-[8px] text-white/20 text-center">
                        By continuing you agree to our Terms & Conditions
                      </p>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="pb-24 md:pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <SellComponent userData={userData} />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}