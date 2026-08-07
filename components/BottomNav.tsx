'use client'

import { Home, Car, Plus, User } from 'lucide-react'
import { usePathname } from 'next/navigation'
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
  const pathname = usePathname()
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const getUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUserId(session.user.id)
      }
    }
    getUserId()
  }, [])

  const navItems: NavItem[] = [
    { id: 'home', icon: Home, label: 'Home', href: '/' },
    { id: 'buy', icon: Car, label: 'Buy', href: '/vehicles' },
    { id: 'sell', icon: Plus, label: 'Sell', href: '/sell' },
    { id: 'profile', icon: User, label: 'Profile', href: userId ? `/dashboard/${userId}` : '/auth/login' },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-t border-white/5">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <Link
              key={item.id}
              href={item.href}
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