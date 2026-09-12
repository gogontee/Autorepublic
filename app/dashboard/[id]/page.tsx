// app/dashboard/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  Store, 
  Wallet, 
  ShoppingCart, 
  Settings, 
  Car, 
  LogOut,
  Menu,
  X,
  AlertCircle,
  Loader2,
  Home,
  Megaphone,
  BarChart3,
  ChevronDown,
  Pointer,
  Sparkles
} from 'lucide-react'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import { supabase } from '@/lib/supabase/client'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

// Import all dashboard components
import DashboardOverview from '@/components/dashboard/DashboardOverview'
import MyStore from '@/components/dashboard/MyStore'
import MyWallet from '@/components/dashboard/MyWallet'
import MyCart from '@/components/dashboard/MyCart'
import ProfileSettings from '@/components/dashboard/ProfileSettings'
import Sell from '@/components/dashboard/Sell'

type DashboardSection = 'overview' | 'sell' | 'my-store' | 'wallet' | 'garage' | 'settings'

interface NavItem {
  id: DashboardSection
  label: string
  icon: any
}

interface AdsSubItem {
  id: string
  label: string
  icon: any
  href: string
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'sell', label: 'Sell', icon: Car },
  { id: 'my-store', label: 'My Listings', icon: Store },
  { id: 'wallet', label: 'My Wallet', icon: Wallet },
  { id: 'garage', label: 'My Garage', icon: ShoppingCart },
  { id: 'settings', label: 'Profile Settings', icon: Settings },
]

const adsSubItems: AdsSubItem[] = [
  { id: 'run-ads', label: 'Run Ads', icon: Megaphone, href: '/ads' },
  { id: 'ads-status', label: 'Ads Status', icon: BarChart3, href: '/ads/status' },
]

// Storage key for dashboard tab
const DASHBOARD_TAB_KEY = 'dashboardActiveTab'
const ONBOARDING_SHOWN_KEY = 'dashboard_onboarding_shown'

// Valid dashboard tabs (also used by the URL ?tab= reader)
const VALID_TABS: DashboardSection[] = [
  'overview', 'sell', 'my-store', 'wallet', 'garage', 'settings'
]

export default function DashboardPage() {
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isAdsDropdownOpen, setIsAdsDropdownOpen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Get user ID from URL
  const userId = params?.id as string

  // Check authentication and authorization
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error || !session) {
          console.log('No session found, redirecting to login')
          router.replace('/auth/login')
          setLoading(false)
          return
        }

        setUser(session.user)
        setSession(session)

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

  // ✅ RESTORE ACTIVE TAB — priority: URL ?tab= > payment return > localStorage > default
  useEffect(() => {
    if (typeof window === 'undefined') return

    // 1. URL query param wins (used by router.push(`/dashboard/${user.id}?tab=settings`))
    const url = new URL(window.location.href)
    const tabFromUrl = url.searchParams.get('tab')

    if (tabFromUrl && VALID_TABS.includes(tabFromUrl as DashboardSection)) {
      console.log('📌 Setting active tab from URL:', tabFromUrl)
      setActiveSection(tabFromUrl as DashboardSection)
      // Persist it so a page reload keeps the same tab
      localStorage.setItem(DASHBOARD_TAB_KEY, tabFromUrl)
      // Clean the URL so it doesn't stick around
      url.searchParams.delete('tab')
      window.history.replaceState({}, '', url.toString())
      setIsInitialLoad(false)
      return
    }

    // 2. Payment return flag (set by payment success handler)
    const paymentTab = localStorage.getItem('activeDashboardTab')
    if (paymentTab && VALID_TABS.includes(paymentTab as DashboardSection)) {
      console.log('📌 Setting active tab from payment return:', paymentTab)
      setActiveSection(paymentTab as DashboardSection)
      localStorage.removeItem('activeDashboardTab')
      setIsInitialLoad(false)
      return
    }

    // 3. Last saved tab
    const savedTab = localStorage.getItem(DASHBOARD_TAB_KEY)
    if (savedTab && VALID_TABS.includes(savedTab as DashboardSection)) {
      console.log('📌 Restoring saved tab from localStorage:', savedTab)
      setActiveSection(savedTab as DashboardSection)
    } else {
      console.log('📌 No saved tab found, using default: overview')
      setActiveSection('overview')
    }
    setIsInitialLoad(false)
  }, [])

  // ✅ WATCH FOR ?tab= CHANGES WHEN THE COMPONENT IS ALREADY MOUNTED
  // This handles the case where the user is already on the dashboard
  // and something pushes a new ?tab= to the same route.
  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkUrlTab = () => {
      const url = new URL(window.location.href)
      const tabFromUrl = url.searchParams.get('tab')
      if (tabFromUrl && VALID_TABS.includes(tabFromUrl as DashboardSection)) {
        console.log('📌 URL tab changed to:', tabFromUrl)
        setActiveSection(tabFromUrl as DashboardSection)
        localStorage.setItem(DASHBOARD_TAB_KEY, tabFromUrl)
        url.searchParams.delete('tab')
        window.history.replaceState({}, '', url.toString())
      }
    }

    // Listen for popstate (back/forward) and pushState/replaceState
    window.addEventListener('popstate', checkUrlTab)

    // Monkey-patch history.pushState to detect Next.js router.push
    const originalPushState = window.history.pushState
    const originalReplaceState = window.history.replaceState
    window.history.pushState = function (...args) {
      originalPushState.apply(this, args)
      checkUrlTab()
    }
    window.history.replaceState = function (...args) {
      originalReplaceState.apply(this, args)
      checkUrlTab()
    }

    // Also run once on mount in case the URL already has ?tab=
    checkUrlTab()

    return () => {
      window.removeEventListener('popstate', checkUrlTab)
      window.history.pushState = originalPushState
      window.history.replaceState = originalReplaceState
    }
  }, [])

  // ✅ SAVE ACTIVE TAB TO LOCALSTORAGE WHENEVER IT CHANGES
  useEffect(() => {
    if (isInitialLoad) return
    console.log('💾 Saving active tab to localStorage:', activeSection)
    localStorage.setItem(DASHBOARD_TAB_KEY, activeSection)
  }, [activeSection, isInitialLoad])

  // Check for return to store flag from Edit component
  useEffect(() => {
    const returnToStore = localStorage.getItem('returnToStore')
    if (returnToStore === 'true') {
      localStorage.removeItem('returnToStore')
      setActiveSection('my-store')
    }
  }, [])

  // Check if onboarding should be shown
  useEffect(() => {
    if (!loading && authorized) {
      const hasSeenOnboarding = localStorage.getItem(ONBOARDING_SHOWN_KEY)
      if (!hasSeenOnboarding && window.innerWidth < 768) {
        setShowOnboarding(true)
      }
    }
  }, [loading, authorized])

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user || !authorized) return

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

  const handleSectionChange = (sectionId: DashboardSection) => {
    setActiveSection(sectionId)
    setIsMobileMenuOpen(false)
  }

  const handleSignOut = async () => {
    localStorage.removeItem(DASHBOARD_TAB_KEY)
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
    if (showOnboarding) {
      handleDismissOnboarding()
    }
  }

  const toggleAdsDropdown = () => {
    setIsAdsDropdownOpen(!isAdsDropdownOpen)
  }

  const handleDismissOnboarding = () => {
    setShowOnboarding(false)
    localStorage.setItem(ONBOARDING_SHOWN_KEY, 'true')
  }

  const userData = {
    user: user,
    profile: userProfile,
    session: session
  }

  const getUserInitials = () => {
    if (userProfile?.first_name && userProfile?.last_name) {
      return `${userProfile.first_name[0]}${userProfile.last_name[0]}`.toUpperCase()
    }
    if (user?.email) {
      return user.email[0].toUpperCase()
    }
    return 'U'
  }

  const getDisplayName = () => {
    if (userProfile?.first_name && userProfile?.last_name) {
      return `${userProfile.first_name} ${userProfile.last_name}`
    }
    if (user?.email) {
      return user.email.split('@')[0]
    }
    return 'User'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
          <span className="text-white/60 ml-3">Loading your dashboard...</span>
        </div>
        <BottomNav />
      </div>
    )
  }

  if (!authorized) {
    return null
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <DashboardOverview userData={userData} />
      case 'sell':
        return <Sell userData={userData} />
      case 'my-store':
        return <MyStore userData={userData} />
      case 'wallet':
        return <MyWallet userData={userData} />
      case 'garage':
        return <MyCart userData={userData} />
      case 'settings':
        return <ProfileSettings userData={userData} />
      default:
        return <DashboardOverview userData={userData} />
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <div className="pb-24 md:pb-6">
        {/* Mobile Menu Button - Fixed position */}
        <div className="md:hidden fixed top-16 left-4 z-50">
          <button
            onClick={toggleMobileMenu}
            className="p-2 bg-black/80 backdrop-blur-sm border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
          
          {/* Onboarding Indicator - Floating pointer on the menu button */}
          <AnimatePresence>
            {showOnboarding && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 pointer-events-none flex items-center justify-center"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.25, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                  className="absolute inset-0 rounded-xl border-2 border-red-500 pointer-events-none"
                />

                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="absolute -right-6 top-1/2 -translate-y-1/2"
                >
                  <Pointer className="w-4 h-4 text-red-500 -rotate-90 drop-shadow" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="absolute left-full ml-8 top-1/2 -translate-y-1/2 pointer-events-auto flex items-start gap-1.5"
                >
                  <div className="bg-black/90 backdrop-blur-sm border border-white/10 rounded-md px-2 py-1 shadow-lg">
                    <p className="text-[10px] leading-tight text-white/80 whitespace-nowrap">
                      Click here to open side menu
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDismissOnboarding()
                    }}
                    className="p-0.5 bg-black/60 hover:bg-black/80 border border-white/10 rounded-full text-white/50 hover:text-white/80 transition-colors flex-shrink-0 mt-0.5"
                    aria-label="Dismiss tip"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex flex-col w-64 min-h-screen bg-black/50 border-r border-white/5 fixed left-0 top-0">
          <div className="flex items-center px-6 h-16 border-b border-white/5">
            <span className="text-lg font-bold text-white">Dashboard</span>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = activeSection === item.id
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => handleSectionChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              )
            })}
            
            {/* Ads Dropdown */}
            <div className="mt-1">
              <button
                onClick={toggleAdsDropdown}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                  isAdsDropdownOpen
                    ? 'bg-white/5 text-white'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Megaphone className="w-4 h-4" />
                  <span>Ads</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${isAdsDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isAdsDropdownOpen && (
                <div className="ml-6 mt-1 space-y-1">
                  {adsSubItems.map((subItem) => {
                    const Icon = subItem.icon
                    return (
                      <button
                        key={subItem.id}
                        onClick={() => {
                          router.push(subItem.href)
                          setIsAdsDropdownOpen(false)
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition-colors text-left"
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {subItem.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </nav>

          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/10">
                {userProfile?.avatar_url ? (
                  <img 
                    src={userProfile.avatar_url} 
                    alt={getDisplayName()}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-bold text-red-500">
                    {getUserInitials()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {getDisplayName()}
                </p>
                <p className="text-xs text-white/40 truncate">{user?.email}</p>
              </div>
            </div>
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <aside className={`
          md:hidden fixed top-0 left-0 bottom-0 w-72 bg-black/95 backdrop-blur-xl border-r border-white/5 z-40 transition-transform duration-300
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex items-center justify-between px-4 h-16 border-b border-white/5">
            <span className="text-lg font-bold text-white">Dashboard</span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = activeSection === item.id
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    handleSectionChange(item.id)
                    setIsMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              )
            })}
            
            <div className="mt-1">
              <button
                onClick={toggleAdsDropdown}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                  isAdsDropdownOpen
                    ? 'bg-white/5 text-white'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Megaphone className="w-4 h-4" />
                  <span>Ads</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${isAdsDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isAdsDropdownOpen && (
                <div className="ml-6 mt-1 space-y-1">
                  {adsSubItems.map((subItem) => {
                    const Icon = subItem.icon
                    return (
                      <button
                        key={subItem.id}
                        onClick={() => {
                          router.push(subItem.href)
                          setIsAdsDropdownOpen(false)
                          setIsMobileMenuOpen(false)
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition-colors text-left"
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {subItem.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-white/5 my-2 pt-2">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/10">
                  {userProfile?.avatar_url ? (
                    <img 
                      src={userProfile.avatar_url} 
                      alt={getDisplayName()}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-bold text-red-500">
                      {getUserInitials()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {getDisplayName()}
                  </p>
                  <p className="text-xs text-white/40 truncate">{user?.email}</p>
                </div>
              </div>
              <button 
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-64 min-h-screen">
          <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  )
}