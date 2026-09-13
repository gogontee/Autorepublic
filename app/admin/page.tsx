// app/admin/page.tsx
'use client'

import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Users,
  Car,
  Megaphone,
  Mail,
  Flag,
  Bell,
  List,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Shield,
  BarChart3,
  Home,
  BookOpen,
  Lock,
  Loader2,
  AlertCircle,
  KeyRound,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

// Import all admin components
import DashboardOverview from '@/components/admin/DashboardOverview'
import UsersManagement from '@/components/admin/Users'
import ListingManagement from '@/components/admin/Listing'
import VehicleListManagement from '@/components/admin/VehicleList'
import AdsManagement from '@/components/admin/AdsManagement'
import MailboxManagement from '@/components/admin/Mailbox'
import VehicleReportManagement from '@/components/admin/VehicleReport'
import NotificationManagement from '@/components/admin/Notification'
import BlogManagement from '@/components/admin/BlogManagement'

type AdminSection =
  | 'dashboard'
  | 'users'
  | 'vehicles'
  | 'vehiclelist'
  | 'ads'
  | 'mailbox'
  | 'reports'
  | 'notifications'
  | 'blog'

interface NavItem {
  id: AdminSection
  label: string
  icon: any
  badge?: number
}

const SESSION_KEY = 'admin_passcode_ok'

export default function AdminPage() {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState(0)

  // ==========================================
  // Passcode gate state
  // ==========================================
  const [passcodeVerified, setPasscodeVerified] = useState(false)
  const [passcodeChecking, setPasscodeChecking] = useState(true)
  const [passcodeInput, setPasscodeInput] = useState('')
  const [passcodeError, setPasscodeError] = useState('')
  const [passcodeSubmitting, setPasscodeSubmitting] = useState(false)

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'vehicles', label: 'Vehicles', icon: Car },
    { id: 'vehiclelist', label: 'Vehicle List', icon: List },
    { id: 'ads', label: 'Ads', icon: Megaphone },
    { id: 'mailbox', label: 'Mailbox', icon: Mail },
    { id: 'reports', label: 'Reports', icon: Flag },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'blog', label: 'Blog', icon: BookOpen },
  ]

  // ==========================================
  // Check sessionStorage for cached passcode verification
  // ==========================================
  useEffect(() => {
    if (typeof window === 'undefined') return
    const cached = sessionStorage.getItem(SESSION_KEY)
    if (cached === 'true') {
      setPasscodeVerified(true)
    }
    setPasscodeChecking(false)
  }, [])

  // ==========================================
  // Handle passcode submission
  // ==========================================
  const handlePasscodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasscodeError('')

    const entered = passcodeInput.trim()
    if (!entered) {
      setPasscodeError('Please enter the passcode')
      return
    }

    setPasscodeSubmitting(true)

    try {
            const { data, error } = await supabase
        .from('autorepublic')
        .select('code')
        .eq('id', '7021cd37-e0c8-4f9f-87e9-7ea7a5b44c25')
        .maybeSingle()

      if (error) {
        console.error('Passcode fetch error:', error)
        setPasscodeError('Could not verify passcode. Try again.')
        setPasscodeSubmitting(false)
        return
      }

      const expected = data?.code?.trim()

      if (!expected) {
        setPasscodeError('Passcode is not configured. Contact an admin.')
        setPasscodeSubmitting(false)
        return
      }

      if (entered !== expected) {
        setPasscodeError('Incorrect passcode')
        setPasscodeInput('')
        setPasscodeSubmitting(false)
        return
      }

      // Success
      sessionStorage.setItem(SESSION_KEY, 'true')
      setPasscodeVerified(true)
      setPasscodeInput('')
      setPasscodeError('')
    } catch (err) {
      console.error('Passcode error:', err)
      setPasscodeError('Something went wrong. Try again.')
    } finally {
      setPasscodeSubmitting(false)
    }
  }

  // ==========================================
  // Check auth and admin role (runs only after passcode verified)
  // ==========================================
  useEffect(() => {
    if (!passcodeVerified) return

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          router.push('/auth/login')
          return
        }

        const { data: profile, error } = await supabase
          .from('users')
          .select('role')
          .eq('user_id', session.user.id)
          .single()

        if (error || profile?.role !== 'admin') {
          router.push('/')
          return
        }

        setUser(session.user)

        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('is_read', false)

        if (count !== null) {
          setNotifications(count)
        }
      } catch (err) {
        console.error('Auth error:', err)
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router, passcodeVerified])

  const handleSignOut = async () => {
    sessionStorage.removeItem(SESSION_KEY)
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardOverview />
      case 'users':
        return <UsersManagement />
      case 'vehicles':
        return <ListingManagement />
      case 'vehiclelist':
        return <VehicleListManagement />
      case 'ads':
        return <AdsManagement />
      case 'mailbox':
        return <MailboxManagement />
      case 'reports':
        return <VehicleReportManagement />
      case 'notifications':
        return <NotificationManagement />
      case 'blog':
        return <BlogManagement />
      default:
        return <DashboardOverview />
    }
  }

  // ==========================================
  // 1) Checking sessionStorage cache
  // ==========================================
  if (passcodeChecking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
      </div>
    )
  }

  // ==========================================
  // 2) Passcode gate
  // ==========================================
  if (!passcodeVerified) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <Image
              src="/autorepublic.png"
              alt="Auto Republic"
              width={56}
              height={56}
              className="w-14 h-14 object-contain mb-3"
            />
            <h1 className="text-lg font-bold text-white">
              ADMIN <span className="text-red-500">ACCESS</span>
            </h1>
            <p className="text-xs text-white/40 mt-1">
              Enter the passcode to continue
            </p>
          </div>

          {/* Card */}
          <form
            onSubmit={handlePasscodeSubmit}
            className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-6 shadow-2xl"
          >
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/20 flex items-center justify-center">
                <Lock className="w-6 h-6 text-red-400" />
              </div>
            </div>

            <label className="block text-[10px] font-medium text-white/50 mb-1.5 uppercase tracking-wider">
              Passcode
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="password"
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                placeholder="Enter admin passcode"
                autoFocus
                autoComplete="off"
                disabled={passcodeSubmitting}
                className="w-full pl-10 pr-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-red-500/50 focus:bg-white/[0.07] transition-colors"
              />
            </div>

            {passcodeError && (
              <div className="mt-3 p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{passcodeError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={passcodeSubmitting || !passcodeInput.trim()}
              className="mt-4 w-full py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-medium text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 hover:scale-[1.02] active:scale-[0.98]"
            >
              {passcodeSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Verify Passcode
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[10px] text-white/20 mt-4">
            Passcode is required each time you open a new tab
          </p>
        </div>
      </div>
    )
  }

  // ==========================================
  // 3) Loading admin data (auth check pending)
  // ==========================================
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
      </div>
    )
  }

  // ==========================================
  // 4) Admin panel
  // ==========================================
  return (
    <div className="min-h-screen bg-black">
      {/* Top Navbar - Floating */}
      <div className="fixed top-4 left-4 right-4 z-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl px-4 py-2">
            <div className="flex items-center justify-between gap-4">
              {/* Logo */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Image
                  src="/autorepublic.png"
                  alt="Auto Republic"
                  width={28}
                  height={28}
                  className="w-6 h-6 md:w-7 md:h-7 object-contain"
                />
                <span className="text-sm font-bold text-white hidden sm:inline">
                  ADMIN <span className="text-red-500">PANEL</span>
                </span>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center overflow-x-auto">
                {navItems.map((item) => {
                  const isActive = activeSection === item.id
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveSection(item.id)
                        setIsMobileMenuOpen(false)
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                        isActive
                          ? 'bg-red-500/20 text-red-400'
                          : 'text-white/60 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {item.label}
                      {item.badge && item.badge > 0 && (
                        <span className="px-1.5 py-0.5 bg-red-500 text-white text-[8px] rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </nav>

              {/* Right Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    setActiveSection('notifications')
                    setIsMobileMenuOpen(false)
                  }}
                  className="relative p-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/60 hover:text-white"
                >
                  <Bell className="w-4 h-4" />
                  {notifications > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[8px] flex items-center justify-center text-white">
                      {notifications > 9 ? '9+' : notifications}
                    </span>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center overflow-hidden">
                    <span className="text-xs font-bold text-red-500">
                      {user?.email?.[0]?.toUpperCase() || 'A'}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/40 hover:text-red-400"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden p-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/60 hover:text-white"
                >
                  {isMobileMenuOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
              <div className="lg:hidden pt-2 border-t border-white/5 mt-2">
                <nav className="flex flex-col gap-0.5">
                  {navItems.map((item) => {
                    const isActive = activeSection === item.id
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveSection(item.id)
                          setIsMobileMenuOpen(false)
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-red-500/20 text-red-400'
                            : 'text-white/60 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                        {item.badge && item.badge > 0 && (
                          <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-[8px] rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    )
                  })}
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="pt-5 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}