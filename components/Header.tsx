'use client'

import { Bell, Menu, Search, User, X, LogOut, LayoutDashboard, Settings, ChevronDown, Info, Mail, Shield, HelpCircle } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'
import NotificationModal from '@/components/NotificationModal'
import { getUnreadCount, subscribeToNotifications } from '@/lib/notifications'

export default function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isInfoMenuOpen, setIsInfoMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const pathname = usePathname()
  const router = useRouter()
  const userMenuRef = useRef<HTMLDivElement>(null)
  const infoMenuRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const mobileSearchInputRef = useRef<HTMLInputElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/vehicles', label: 'Vehicles' },
    { href: '/sell', label: 'Sell' },
    { href: '/finance', label: 'Finance' },
    { href: '/compare', label: 'Compare' },
  ]

  const infoLinks = [
    { href: '/about', label: 'About', icon: Info },
    { href: '/contact', label: 'Contact', icon: Mail },
    { href: '/support', label: 'Help & Support', icon: HelpCircle },
    { href: '/legals', label: 'Legal', icon: Shield },
  ]

  // Get user session and profile
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          setUser(session.user)
          
          // Fetch user profile
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', session.user.id)
            .single()
          
          if (!error) {
            setUserProfile(data)
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        // Refetch profile on auth change
        const fetchProfile = async () => {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', session.user.id)
            .single()
          if (!error) {
            setUserProfile(data)
          }
        }
        fetchProfile()
      } else {
        setUser(null)
        setUserProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Get unread notification count
  useEffect(() => {
    if (user) {
      // Get initial unread count
      getUnreadCount(user.id).then(setUnreadCount)
      
      // Subscribe to new notifications
      const channel = subscribeToNotifications(user.id, (notification) => {
        if (!notification.is_read) {
          setUnreadCount(prev => prev + 1)
        }
      })
      
      return () => {
        channel.unsubscribe()
      }
    }
  }, [user])

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
      if (infoMenuRef.current && !infoMenuRef.current.contains(event.target as Node)) {
        setIsInfoMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => {
        if (window.innerWidth < 768) {
          mobileSearchInputRef.current?.focus()
        } else {
          searchInputRef.current?.focus()
        }
      }, 100)
    }
  }, [isSearchOpen])

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/vehicles?search=${encodeURIComponent(searchQuery.trim())}`)
      setIsSearchOpen(false)
      setSearchQuery('')
    }
  }

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setIsSearching(e.target.value.length > 0)
  }

  // Handle search clear
  const clearSearch = () => {
    setSearchQuery('')
    setIsSearching(false)
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  // Handle sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setIsUserMenuOpen(false)
    setIsMobileMenuOpen(false)
    router.push('/auth/login')
    router.refresh()
  }

  // Navigate to dashboard
  const goToDashboard = () => {
    if (user) {
      router.push(`/dashboard/${user.id}`)
      setIsUserMenuOpen(false)
      setIsMobileMenuOpen(false)
    }
  }

  // Get user initials for fallback
  const getUserInitials = () => {
    if (userProfile?.first_name && userProfile?.last_name) {
      return `${userProfile.first_name[0]}${userProfile.last_name[0]}`.toUpperCase()
    }
    if (user?.email) {
      return user.email[0].toUpperCase()
    }
    return 'U'
  }

  // Get display name
  const getDisplayName = () => {
    if (userProfile?.first_name && userProfile?.last_name) {
      return `${userProfile.first_name} ${userProfile.last_name}`
    }
    if (user?.email) {
      return user.email.split('@')[0]
    }
    return 'User'
  }

  const toggleInfoMenu = () => {
    setIsInfoMenuOpen(!isInfoMenuOpen)
  }

  return (
    <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity">
            <Image
              src="/autorepublic.png"
              alt="Auto Republic"
              width={28}
              height={28}
              className="w-6 h-6 md:w-7 md:h-7 object-contain"
            />
            <h1 className="text-base md:text-xl font-bold tracking-tight">
              AUTO <span className="text-red-500">REPUBLIC</span>
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive 
                      ? 'text-white' 
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Search - Desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center bg-white/5 rounded-full px-3 py-1.5 border border-white/10 focus-within:border-red-500/50 transition-colors">
              <Search className="w-3.5 h-3.5 text-white/40" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search cars..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="bg-transparent border-none outline-none text-sm text-white placeholder:text-white/40 w-40 ml-2"
              />
              {isSearching && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="text-white/40 hover:text-white/60 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Mobile Search Toggle */}
            <button 
              className="md:hidden text-white/60 hover:text-white transition-colors"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              aria-label="Toggle search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Notifications - Only visible to auth users */}
            {!loading && user && (
              <button 
                onClick={() => setIsNotificationOpen(true)}
                className="relative text-white/60 hover:text-white transition-colors" 
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4 md:w-5 md:h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 md:w-4 md:h-4 bg-red-500 rounded-full text-[8px] md:text-[10px] flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}
            
            {/* Mobile User Avatar - Visible on mobile */}
            {!loading && user && (
              <div className="md:hidden">
                <Link 
                  href={`/dashboard/${user.id}`}
                  className="block"
                >
                  <div className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center overflow-hidden border border-white/10 hover:border-red-500/30 transition-colors">
                    {userProfile?.avatar_url ? (
                      <img 
                        src={userProfile.avatar_url} 
                        alt={getDisplayName()}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] font-bold text-red-500">
                        {getUserInitials()}
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden text-white/60 hover:text-white transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>

            {/* Desktop Auth Buttons / Info Menu */}
            <div className="hidden md:flex items-center gap-2">
              {!loading && !user ? (
                // Non-auth user - show Sign In, Join Now, and Info dropdown
                <>
                  <Link href="/auth/login" className="px-3 py-1.5 text-sm font-medium text-white/80 hover:text-white transition-colors">
                    Sign In
                  </Link>
                  <Link href="/auth/signup" className="px-4 py-1.5 bg-red-500 hover:bg-red-600 rounded-full text-sm font-medium text-white transition-colors hover:scale-105">
                    Join Now
                  </Link>
                  
                  {/* Info Dropdown for Non-Auth Users */}
                  <div className="relative" ref={infoMenuRef}>
                    <button
                      onClick={toggleInfoMenu}
                      className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
                      aria-label="Information menu"
                    >
                      <Info className="w-5 h-5" />
                    </button>

                    {isInfoMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                        <div className="py-1">
                          {infoLinks.map((link) => {
                            const Icon = link.icon
                            return (
                              <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsInfoMenuOpen(false)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors"
                              >
                                <Icon className="w-4 h-4" />
                                {link.label}
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : !loading && user ? (
                // Auth user - show user circle with dropdown
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 px-2 py-1 hover:bg-white/10 rounded-full transition-colors"
                    aria-label="User menu"
                  >
                    {/* User Avatar */}
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center overflow-hidden border border-white/10">
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
                    <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center overflow-hidden">
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
                            <p className="text-xs text-white/40 truncate">
                              {user?.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <button
                          onClick={goToDashboard}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Dashboard
                        </button>
                        <button
                          onClick={() => {
                            router.push(`/dashboard/${user.id}/settings`)
                            setIsUserMenuOpen(false)
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          Profile Settings
                        </button>
                        
                        <div className="border-t border-white/5 my-1" />
                        
                        {/* About, Contact, Support, Legal links */}
                        <Link
                          href="/about"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          <Info className="w-4 h-4" />
                          About
                        </Link>
                        <Link
                          href="/contact"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                          Contact
                        </Link>
                        <Link
                          href="/support"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          <HelpCircle className="w-4 h-4" />
                          Help & Support
                        </Link>
                        <Link
                          href="/legals"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          <Shield className="w-4 h-4" />
                          Legal
                        </Link>
                        
                        <div className="border-t border-white/5 my-1" />
                        
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Loading state
                <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Bar - Only visible when search is open */}
        {isSearchOpen && (
          <form onSubmit={handleSearch} className="md:hidden py-2 border-t border-white/5">
            <div className="flex items-center bg-white/5 rounded-full px-3 py-1.5 border border-white/10 focus-within:border-red-500/50 transition-colors">
              <Search className="w-3.5 h-3.5 text-white/40" />
              <input
                ref={mobileSearchInputRef}
                type="text"
                placeholder="Search cars..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="bg-transparent border-none outline-none text-sm text-white placeholder:text-white/40 w-full ml-2"
                autoFocus
              />
              {isSearching && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="text-white/40 hover:text-white/60 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>
        )}

        {/* Mobile Menu - Scrollable */}
        {isMobileMenuOpen && (
          <div 
            ref={mobileMenuRef}
            className="md:hidden py-2 border-t border-white/5 max-h-[calc(100vh-120px)] overflow-y-auto overscroll-contain"
          >
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive 
                        ? 'bg-white/10 text-white' 
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
              <div className="border-t border-white/5 my-1" />
              
              {/* About, Contact, Support, Legal in mobile menu */}
              <Link
                href="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white rounded-lg transition-colors"
              >
                About
              </Link>
              <Link
                href="/contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white rounded-lg transition-colors"
              >
                Contact
              </Link>
              <Link
                href="/support"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white rounded-lg transition-colors"
              >
                Help & Support
              </Link>
              <Link
                href="/legals"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white rounded-lg transition-colors"
              >
                Legal
              </Link>
              
              <div className="border-t border-white/5 my-1" />
              
              {!user ? (
                // Non-auth user
                <>
                  <Link 
                    href="/auth/login" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-3 py-2 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white rounded-lg transition-colors text-left"
                  >
                    Sign In
                  </Link>
                  <Link 
                    href="/auth/signup" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-3 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-sm font-medium text-white transition-colors text-center"
                  >
                    Join Now
                  </Link>
                </>
              ) : (
                // Auth user
                <>
                  <Link 
                    href={`/dashboard/${user.id}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-3 py-2 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white rounded-lg transition-colors text-left"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href={`/dashboard/${user.id}/settings`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-3 py-2 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white rounded-lg transition-colors text-left"
                  >
                    Profile Settings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-left"
                  >
                    Sign Out
                  </button>
                </>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        userId={user?.id || ''}
      />
    </header>
  )
}