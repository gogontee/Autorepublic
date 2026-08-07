'use client'

import { Home, Car, Plus, User } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

interface NavItem {
  id: string
  icon: any
  label: string
  href: string
}

export default function BottomNav() {
  const pathname = usePathname() || '' // Provide fallback empty string
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUserId = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUserId(session.user.id)
        }
      } catch (error) {
        console.error('Error getting user:', error)
      } finally {
        setLoading(false)
      }
    }
    getUserId()
  }, [])

  // Handle profile click - if not logged in, go to login
  const handleProfileClick = (e: React.MouseEvent) => {
    if (!userId) {
      e.preventDefault()
      router.push('/auth/login')
    }
  }

  const navItems: NavItem[] = [
    { id: 'home', icon: Home, label: 'Home', href: '/' },
    { id: 'buy', icon: Car, label: 'Buy', href: '/vehicles' },
    { id: 'sell', icon: Plus, label: 'Sell', href: '/sell' },
    { 
      id: 'profile', 
      icon: User, 
      label: 'Profile', 
      href: userId ? `/dashboard/${userId}` : '/auth/login'
    },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-t border-white/5">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          // If it's the profile link and user is not logged in, use a div with onClick
          if (item.id === 'profile' && !userId && !loading) {
            return (
              <button
                key={item.id}
                onClick={() => router.push('/auth/login')}
                className={`flex flex-col items-center gap-0.5 transition-colors ${
                  isActive ? 'text-red-500' : 'text-white/40 hover:text-white/60'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px]">{item.label}</span>
              </button>
            )
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={item.id === 'profile' ? handleProfileClick : undefined}
              className={`flex flex-col items-center gap-0.5 transition-colors ${
                isActive ? 'text-red-500' : 'text-white/40 hover:text-white/60'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}