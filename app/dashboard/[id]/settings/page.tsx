'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Car, LayoutDashboard, PlusCircle, User, Settings, LogOut, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import MyCart from '@/components/dashboard/MyCart'
import SellComponent from '@/components/dashboard/Sell'
import { motion, AnimatePresence } from 'framer-motion'

// Storage keys for form persistence
const SELL_FORM_STORAGE_KEY = 'sell_form_data'
const SELL_IMAGES_STORAGE_KEY = 'sell_form_images'

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'my-cart' | 'sell'>('overview')
  const [savedFormData, setSavedFormData] = useState<any>(null)
  const [savedImages, setSavedImages] = useState<any[]>([])
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Load saved form data and images from localStorage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(SELL_FORM_STORAGE_KEY)
      if (savedData) {
        const parsed = JSON.parse(savedData)
        setSavedFormData(parsed)
        console.log('✅ Restored saved form data:', parsed)
      }

      const savedImagesData = localStorage.getItem(SELL_IMAGES_STORAGE_KEY)
      if (savedImagesData) {
        const parsed = JSON.parse(savedImagesData)
        setSavedImages(parsed)
        console.log('✅ Restored saved images:', parsed.length, 'images')
      }
    } catch (error) {
      console.error('Error loading saved data:', error)
    }
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push('/auth/login')
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
          session: session
        })
        setLoading(false)
      } catch (error) {
        console.error('Auth error:', error)
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  // Handle form data change - save to localStorage
  const handleFormDataChange = (data: any) => {
    try {
      localStorage.setItem(SELL_FORM_STORAGE_KEY, JSON.stringify(data))
      console.log('💾 Saved form data:', data)
    } catch (error) {
      console.error('Error saving form data:', error)
    }
  }

  // Handle images change - save to localStorage
  const handleImagesChange = (images: any[]) => {
    try {
      const imagesData = images.map(img => ({
        id: img.id,
        preview: img.preview,
        isCover: img.isCover,
        fileName: img.file?.name || '',
        fileSize: img.file?.size || 0,
        fileType: img.file?.type || '',
      }))
      localStorage.setItem(SELL_IMAGES_STORAGE_KEY, JSON.stringify(imagesData))
      console.log('💾 Saved images:', imagesData.length, 'images')
    } catch (error) {
      console.error('Error saving images:', error)
    }
  }

  // Handle form submit - clear saved data
  const handleFormSubmit = () => {
    try {
      localStorage.removeItem(SELL_FORM_STORAGE_KEY)
      localStorage.removeItem(SELL_IMAGES_STORAGE_KEY)
      console.log('🗑️ Cleared saved form data after submission')
    } catch (error) {
      console.error('Error clearing form data:', error)
    }
  }

  // Handle success action - switch to My Cart tab
  const handleSuccessAction = () => {
    setActiveTab('my-cart')
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
          <span className="text-white/60 ml-3">Loading dashboard...</span>
        </div>
        <BottomNav />
      </div>
    )
  }

  if (!userData) {
    return null
  }

  const { user, profile } = userData

  // Navigation items
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'my-cart', label: 'My Cart', icon: Car },
    { id: 'sell', label: 'Sell', icon: PlusCircle },
  ]

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="pb-24 md:pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* User Info */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">
                Welcome back, {profile?.full_name || 'User'} 👋
              </h1>
              <p className="text-sm text-white/40 mt-0.5">
                Manage your vehicles and account
              </p>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all disabled:opacity-50"
            >
              {isLoggingOut ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 mb-6 bg-white/5 rounded-xl p-1 border border-white/5">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`
                    flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${isActive 
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/25' 
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              )
            })}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Stats Cards */}
                  <div className="bg-white/5 rounded-xl border border-white/5 p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-red-500/10 rounded-xl">
                        <Car className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">0</p>
                        <p className="text-xs text-white/40">Active Listings</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl border border-white/5 p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-yellow-500/10 rounded-xl">
                        <Car className="w-5 h-5 text-yellow-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">0</p>
                        <p className="text-xs text-white/40">Pending Listings</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl border border-white/5 p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-green-500/10 rounded-xl">
                        <Car className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">0</p>
                        <p className="text-xs text-white/40">Sold Listings</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'my-cart' && (
                <MyCart userData={userData} />
              )}

              {activeTab === 'sell' && (
                <SellComponent 
                  userData={userData}
                  savedFormData={savedFormData}
                  savedImages={savedImages}
                  onFormDataChange={handleFormDataChange}
                  onImagesChange={handleImagesChange}
                  onFormSubmit={handleFormSubmit}
                  onSuccessAction={handleSuccessAction}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}