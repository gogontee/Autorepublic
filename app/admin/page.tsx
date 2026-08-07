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
  Home
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

type AdminSection = 
  | 'dashboard'
  | 'users'
  | 'vehicles'
  | 'vehiclelist'
  | 'ads'
  | 'mailbox'
  | 'reports'
  | 'notifications'

interface NavItem {
  id: AdminSection
  label: string
  icon: any
  badge?: number
}

export default function AdminPage() {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState(0)

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'vehicles', label: 'Vehicles', icon: Car },
    { id: 'vehiclelist', label: 'Vehicle List', icon: List },
    { id: 'ads', label: 'Ads', icon: Megaphone },
    { id: 'mailbox', label: 'Mailbox', icon: Mail },
    { id: 'reports', label: 'Reports', icon: Flag },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ]

  // Check auth and admin role
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push('/auth/login')
          return
        }

        // Check if user has admin role
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
        
        // Get unread notification count
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
  }, [router])

  const handleSignOut = async () => {
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
      default:
        return <DashboardOverview />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
      </div>
    )
  }

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
                {/* Notification Bell */}
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

                {/* User */}
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

                {/* Mobile Menu Toggle */}
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