// components/AppTabs.tsx
'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutGrid, 
  Crown, 
  Zap, 
  Car, 
  Sparkles, 
  Clock,
  ChevronDown,
  Info
} from 'lucide-react'

interface Tab {
  id: string
  label: string
  href: string
  icon: any
  description: string
  action: string
}

const tabs: Tab[] = [
  { 
    id: 'main-market', 
    label: 'Main Market', 
    href: '/vehicles', 
    icon: LayoutGrid,
    description: 'Browse all vehicles',
    action: 'Browse all vehicles'
  },
  { 
    id: 'luxury', 
    label: 'Luxury', 
    href: '/luxury', 
    icon: Crown,
    description: 'Premium vehicles for excellence',
    action: 'Explore luxury cars'
  },
  { 
    id: 'evs', 
    label: 'EVs', 
    href: '/evs', 
    icon: Zap,
    description: 'Zero emission electric vehicles',
    action: 'Discover EVs'
  },
  { 
    id: 'sports', 
    label: 'Sport Cars', 
    href: '/sports', 
    icon: Car,
    description: 'High-performance speed machines',
    action: 'View sports cars'
  },
  { 
    id: 'collections', 
    label: 'Republic Collections', 
    href: '/collections', 
    icon: Sparkles,
    description: 'Curated exceptional vehicles',
    action: 'Browse collections'
  },
  { 
    id: 'preorder', 
    label: 'Pre Order', 
    href: '/preorder', 
    icon: Clock,
    description: 'Reserve upcoming vehicles',
    action: 'Pre order now'
  },
]

interface AppTabsProps {
  className?: string
}

export default function AppTabs({ className = '' }: AppTabsProps) {
  const pathname = usePathname() || ''
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<string | null>(null)

  // Set active tab based on pathname - Main Market is never active
  useEffect(() => {
    const currentTab = tabs.find(tab => 
      tab.id !== 'main-market' && 
      (pathname === tab.href || pathname.startsWith(tab.href + '/'))
    )
    if (currentTab) {
      setActiveTab(currentTab.id)
    } else {
      setActiveTab(null)
    }
  }, [pathname])

  const handleTabClick = (tab: Tab) => {
    if (tab.id === 'main-market') {
      router.push(tab.href)
      return
    }
    setActiveTab(tab.id)
    router.push(tab.href)
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Grid of 3 columns on mobile, 6 columns on larger screens */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {tabs.map((tab) => {
          const isMainMarket = tab.id === 'main-market'
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          
          return (
            <div
              key={tab.id}
              className="relative flex flex-col"
            >
              <motion.button
                onClick={() => handleTabClick(tab)}
                className={`
                  relative flex flex-col items-center justify-center gap-1 p-2.5 rounded-t-xl
                  border-2 border-b-0 transition-all duration-300 w-full
                  ${isMainMarket 
                    ? 'border-red-500 bg-red-500/10 shadow-lg shadow-red-500/20' 
                    : isActive 
                      ? 'border-red-500 bg-red-500/10 shadow-lg shadow-red-500/20' 
                      : 'border-white/30 bg-white/5 hover:border-white/60 hover:bg-white/10'
                  }
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Breathing animation for Main Market */}
                {isMainMarket && (
                  <motion.div
                    className="absolute inset-0 rounded-t-xl border-2 border-red-500/30"
                    animate={{
                      scale: [1, 1.03, 1],
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}

                {/* Icon */}
                <Icon 
                  className={`w-5 h-5 transition-colors duration-300 ${
                    isMainMarket || isActive ? 'text-red-400' : 'text-white/60 group-hover:text-white/80'
                  }`}
                />
                
                {/* Label */}
                <span 
                  className={`text-[10px] font-medium transition-colors duration-300 text-center leading-tight ${
                    isMainMarket || isActive ? 'text-white' : 'text-white/60'
                  }`}
                >
                  {tab.label}
                </span>

                {/* Active indicator - red glow (only for non-main-market tabs) */}
                {isActive && !isMainMarket && (
                  <motion.div
                    layoutId="activeTabGrid"
                    className="absolute -bottom-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-red-400 to-red-500 rounded-full shadow-lg shadow-red-500/50"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}

                {/* Pulsing dot for Main Market */}
                {isMainMarket && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.6, 1, 0.6],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}

                {/* Hover glow effect */}
                {!isMainMarket && !isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-t-xl opacity-0 group-hover:opacity-100"
                    initial={false}
                    whileHover={{
                      opacity: 1,
                      transition: { duration: 0.2 }
                    }}
                  >
                    <div className="absolute inset-0 bg-white/5 rounded-t-xl" />
                  </motion.div>
                )}
              </motion.button>

              {/* Description - Always visible below the button */}
              <div 
                className={`
                  px-2.5 py-2 rounded-b-xl border-2 border-t-0 transition-all duration-300
                  ${isMainMarket 
                    ? 'border-red-500 bg-red-500/5' 
                    : isActive 
                      ? 'border-red-500 bg-red-500/5' 
                      : 'border-white/30 bg-white/5'
                  }
                `}
              >
                <p className="text-[8px] text-white/40 text-center leading-tight">
                  {tab.description}
                </p>
                <p className="text-[7px] text-red-400/60 text-center mt-0.5 font-medium">
                  {tab.action}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom bar - subtle */}
      <motion.div
        className="mt-3 h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      />
    </div>
  )
}