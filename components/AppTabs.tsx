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
  Gavel,
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
  color: string // Added color property
}

const tabs: Tab[] = [
  { 
    id: 'main-market', 
    label: 'All Vehicles', 
    href: '/vehicles', 
    icon: LayoutGrid,
    description: 'Browse all vehicles',
    action: 'Browse all vehicles',
    color: 'from-red-500/20 to-red-600/10'
  },
  { 
    id: 'luxury', 
    label: 'Luxury', 
    href: '/luxury', 
    icon: Crown,
    description: 'Premium vehicles for excellence',
    action: 'Explore luxury cars',
    color: 'from-amber-500/20 to-amber-600/10'
  },
  { 
    id: 'evs', 
    label: 'EVs', 
    href: '/evs', 
    icon: Zap,
    description: 'Low/Zero emission electric vehicles',
    action: 'Discover EVs',
    color: 'from-green-500/20 to-green-600/10'
  },
  { 
    id: 'sports', 
    label: 'Sport Cars', 
    href: '/sports', 
    icon: Car,
    description: 'High-performance speed machines',
    action: 'View sports cars',
    color: 'from-blue-500/20 to-blue-600/10'
  },
  { 
    id: 'collections', 
    label: 'Our Collections', 
    href: '/collections', 
    icon: Sparkles,
    description: 'Curated exceptional vehicles',
    action: 'Browse collections',
    color: 'from-purple-500/20 to-purple-600/10'
  },
  { 
    id: 'distress', 
    label: 'Distress Sales', 
    href: '/distress', 
    icon: Gavel,
    description: 'Auction vehicles at special prices',
    action: '',
    color: 'from-red-500/20 to-red-600/10'
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

  // Get the gradient color for a tab
  const getTabColor = (tab: Tab, isActive: boolean, isMainMarket: boolean) => {
    if (isMainMarket) {
      return 'border-red-500 bg-red-500/10 shadow-lg shadow-red-500/20'
    }
    if (tab.id === 'distress') {
      return isActive 
        ? 'border-red-500 bg-red-500/10 shadow-lg shadow-red-500/20'
        : 'border-amber-500/80 bg-amber-500/10 shadow-lg shadow-amber-500/20'
    }
    if (isActive) {
      return 'border-red-500 bg-red-500/10 shadow-lg shadow-red-500/20'
    }
    return 'border-white/30 bg-white/5 hover:border-white/60 hover:bg-white/10'
  }

  // Get the icon color for a tab
  const getIconColor = (tab: Tab, isActive: boolean, isMainMarket: boolean) => {
    if (isMainMarket) return 'text-red-400'
    if (tab.id === 'distress') {
      return isActive ? 'text-red-400' : 'text-amber-400/80'
    }
    if (isActive) return 'text-red-400'
    return 'text-white/60 group-hover:text-white/80'
  }

  // Get the label color for a tab
  const getLabelColor = (tab: Tab, isActive: boolean, isMainMarket: boolean) => {
    if (isMainMarket) return 'text-white'
    if (tab.id === 'distress') {
      return isActive ? 'text-red-400' : 'text-amber-400/80'
    }
    if (isActive) return 'text-white'
    return 'text-white/60'
  }

  // Get the description text color
  const getDescriptionColor = (tab: Tab, isActive: boolean, isMainMarket: boolean) => {
    if (tab.id === 'distress') {
      return 'text-amber-400/60'
    }
    return 'text-white/40'
  }

  // Get the action text color
  const getActionColor = (tab: Tab, isActive: boolean, isMainMarket: boolean) => {
    if (tab.id === 'distress') {
      return 'text-amber-400/70'
    }
    return 'text-red-400/60'
  }

  // Get the border color for the description
  const getDescriptionBorder = (tab: Tab, isActive: boolean, isMainMarket: boolean) => {
    if (isMainMarket) return 'border-red-500 bg-red-500/5'
    if (tab.id === 'distress') {
      return isActive 
        ? 'border-red-500 bg-red-500/5'
        : 'border-amber-500/80 bg-amber-500/5'
    }
    if (isActive) return 'border-red-500 bg-red-500/5'
    return 'border-white/30 bg-white/5 hover:bg-white/10'
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
            <motion.div
              key={tab.id}
              className="relative flex flex-col cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleTabClick(tab)}
            >
              {/* Main button area - top part with gradient background */}
              <div
                className={`
                  relative flex flex-col items-center justify-center gap-1 p-2.5 rounded-t-xl
                  border-2 border-b-0 transition-all duration-300 w-full
                  ${getTabColor(tab, isActive, isMainMarket)}
                  ${!isMainMarket && !isActive ? `bg-gradient-to-br ${tab.color} bg-opacity-50` : ''}
                  ${isActive && tab.id !== 'main-market' ? 'bg-gradient-to-br from-red-500/20 via-red-500/10 to-transparent' : ''}
                `}
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

                {/* Pulsing glow for Distress Sales */}
                {tab.id === 'distress' && !isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-t-xl border-2 border-amber-500/20"
                    animate={{
                      scale: [1, 1.02, 1],
                      opacity: [0.2, 0.5, 0.2],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}

                {/* Background gradient glow for non-active tabs */}
                {!isMainMarket && !isActive && (
                  <div className={`absolute inset-0 rounded-t-xl bg-gradient-to-br ${tab.color} opacity-20`} />
                )}

                {/* Icon */}
                <Icon 
                  className={`w-5 h-5 transition-colors duration-300 ${getIconColor(tab, isActive, isMainMarket)} relative z-10`}
                />
                
                {/* Label */}
                <span 
                  className={`text-xs sm:text-sm font-medium transition-colors duration-300 text-center leading-tight relative z-10 ${getLabelColor(tab, isActive, isMainMarket)}`}
                >
                  {tab.label}
                </span>

                {/* Active indicator - colored glow */}
                {isActive && !isMainMarket && (
                  <motion.div
                    layoutId="activeTabGrid"
                    className={`absolute -bottom-px left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full shadow-lg ${
                      tab.id === 'distress'
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 shadow-amber-500/50'
                        : 'bg-gradient-to-r from-red-400 to-red-500 shadow-red-500/50'
                    }`}
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

                {/* Pulsing dot for Distress Sales */}
                {tab.id === 'distress' && !isActive && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500"
                    animate={{
                      scale: [1, 1.4, 1],
                      opacity: [0.4, 1, 0.4],
                    }}
                    transition={{
                      duration: 2,
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
                    <div className={`absolute inset-0 rounded-t-xl bg-gradient-to-br ${tab.color} opacity-30`} />
                  </motion.div>
                )}
              </div>

              {/* Description - with gradient border */}
              <div 
                className={`
                  px-2.5 py-2 rounded-b-xl border-2 border-t-0 transition-all duration-300
                  ${getDescriptionBorder(tab, isActive, isMainMarket)}
                  ${!isMainMarket && !isActive ? `bg-gradient-to-br ${tab.color} bg-opacity-30` : ''}
                  ${isActive && tab.id !== 'main-market' ? 'bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent' : ''}
                `}
              >
                {/* Description text */}
                <p className={`text-[9px] sm:text-[10px] text-center leading-tight ${getDescriptionColor(tab, isActive, isMainMarket)}`}>
                  {tab.description}
                </p>
                {/* Action text - only render if action is non-empty */}
                {tab.action && (
                  <p className={`text-[8px] sm:text-[9px] text-center mt-0.5 font-medium ${getActionColor(tab, isActive, isMainMarket)}`}>
                    {tab.action}
                  </p>
                )}
              </div>
            </motion.div>
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