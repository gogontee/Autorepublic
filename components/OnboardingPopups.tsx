'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Compass,
  Car,
  MapPin,
  Filter,
  Sparkles,
  Tag,
  Rocket,
  ArrowRight,
  UserPlus,
  Store,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

// ==========================================
// Storage keys
// ==========================================
const LS_FIRST_POPUP = 'ar_onboarding_browse_seen'
const SS_SECOND_POPUP = 'ar_onboarding_sell_seen'
const LS_LAST_SELL_PROMPT = 'ar_onboarding_sell_last'

// ==========================================
// Config
// ==========================================
const FIRST_DELAY_MS = 10_000
const SECOND_DELAY_MS = 30_000
const SELL_PROMPT_COOLDOWN_MS = 1000 * 60 * 60 * 24
const SELL_PROMPT_RANDOM_SKIP = 0.4

async function getAuthUser() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user || null
}

export default function OnboardingPopups() {
  const router = useRouter()

  const [showBrowse, setShowBrowse] = useState(false)
  const [showSell, setShowSell] = useState(false)
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null)

  // ==========================================
  // Mount: decide what to show
  // ==========================================
  useEffect(() => {
    if (typeof window === 'undefined') return

    const browseSeen = localStorage.getItem(LS_FIRST_POPUP) === 'true'
    let firstTimer: ReturnType<typeof setTimeout> | undefined

    if (!browseSeen) {
      firstTimer = setTimeout(() => setShowBrowse(true), FIRST_DELAY_MS)
    }

    const sessionSeen = sessionStorage.getItem(SS_SECOND_POPUP) === 'true'
    const lastShown = Number(localStorage.getItem(LS_LAST_SELL_PROMPT) || 0)
    const withinCooldown = Date.now() - lastShown < SELL_PROMPT_COOLDOWN_MS
    const skipRandomly = Math.random() < SELL_PROMPT_RANDOM_SKIP

    let secondTimer: ReturnType<typeof setTimeout> | undefined

    if (!sessionSeen && !withinCooldown && !skipRandomly) {
      secondTimer = setTimeout(async () => {
        const user = await getAuthUser()
        setIsAuthed(!!user)

        setShowBrowse((browseOpen) => {
          if (browseOpen) {
            setTimeout(() => setShowSell(true), 2000)
          } else {
            setShowSell(true)
          }
          return browseOpen
        })

        sessionStorage.setItem(SS_SECOND_POPUP, 'true')
        localStorage.setItem(LS_LAST_SELL_PROMPT, String(Date.now()))
      }, SECOND_DELAY_MS)
    }

    return () => {
      if (firstTimer) clearTimeout(firstTimer)
      if (secondTimer) clearTimeout(secondTimer)
    }
  }, [])

  // ==========================================
  // Handlers
  // ==========================================
  const dismissBrowse = () => {
    setShowBrowse(false)
    localStorage.setItem(LS_FIRST_POPUP, 'true')
  }

  const goExplore = () => {
    setShowBrowse(false)
    localStorage.setItem(LS_FIRST_POPUP, 'true')
    router.push('/vehicles')
  }

  const dismissSell = () => {
    setShowSell(false)
    sessionStorage.setItem(SS_SECOND_POPUP, 'true')
  }

  const goSell = () => {
    setShowSell(false)
    sessionStorage.setItem(SS_SECOND_POPUP, 'true')
    router.push(isAuthed ? '/sell' : '/auth/signup')
  }

  // ==========================================
  // Render
  // ==========================================
  return (
    <>
      {/* ============ POPUP 1: Browse ============ */}
      <AnimatePresence>
        {showBrowse && (
          <motion.div
            key="browse-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[80] flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm"
            onClick={dismissBrowse}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[340px] sm:max-w-[360px] bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
            >
              {/* Metallic red accent bar */}
              <div className="h-[3px] w-full bg-gradient-to-r from-red-700 via-red-500 to-red-300" />

              {/* Soft metallic glow */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-red-600/25 to-red-300/10 rounded-full blur-3xl pointer-events-none" />

              {/* Close */}
              <button
                onClick={dismissBrowse}
                className="absolute top-3 right-3 z-10 p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5 text-white/50" />
              </button>

              <div className="relative p-5">
                {/* Icon */}
                <div className="flex justify-center mb-3">
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 18 }}
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-700 via-red-500 to-red-300 flex items-center justify-center shadow-lg shadow-red-500/30"
                  >
                    <Compass className="w-6 h-6 text-white" />
                  </motion.div>
                </div>

                {/* Copy */}
                <div className="text-center mb-4">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-red-700/25 to-red-300/15 border border-red-500/25 text-red-300 text-[9px] font-medium uppercase tracking-wider mb-2">
                    <Sparkles className="w-2.5 h-2.5" />
                    Explore thousands of cars
                  </span>
                  <h2 className="text-base font-bold text-white mb-1.5">
                    Find your perfect ride
                  </h2>
                  <p className="text-[12px] text-white/55 leading-relaxed">
                    Browse verified vehicles from trusted sellers across Nigeria.
                    Filter by brand, location, price, and condition.
                  </p>
                </div>

                {/* Feature highlights */}
                <div className="space-y-1.5 mb-4">
                  <FeatureRow
                    icon={Car}
                    title="All kinds of vehicles"
                    subtitle="Cars, SUVs, trucks, buses & more"
                  />
                  <FeatureRow
                    icon={MapPin}
                    title="Filter by location"
                    subtitle="Find cars near you, in any state"
                  />
                  <FeatureRow
                    icon={Filter}
                    title="Smart filters"
                    subtitle="Brand, price, year, condition & category"
                  />
                </div>

                {/* Actions */}
                <div className="space-y-1.5">
                  <button
                    onClick={goExplore}
                    className="w-full py-2.5 bg-gradient-to-r from-red-700 via-red-500 to-red-600 hover:from-red-600 hover:via-red-500 hover:to-red-500 rounded-xl text-[13px] font-medium text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Explore Vehicles
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={dismissBrowse}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[11px] font-medium text-white/50 hover:text-white/80 transition-colors"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ POPUP 2: Sell ============ */}
      <AnimatePresence>
        {showSell && (
          <motion.div
            key="sell-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[80] flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm"
            onClick={dismissSell}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[340px] sm:max-w-[360px] bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
            >
              {/* Metallic red accent bar */}
              <div className="h-[3px] w-full bg-gradient-to-r from-red-700 via-red-500 to-red-300" />

              {/* Soft metallic glow */}
              <div className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-br from-red-600/25 to-red-300/10 rounded-full blur-3xl pointer-events-none" />

              {/* Close */}
              <button
                onClick={dismissSell}
                className="absolute top-3 right-3 z-10 p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5 text-white/50" />
              </button>

              <div className="relative p-5">
                {/* Icon */}
                <div className="flex justify-center mb-3">
                  <motion.div
                    initial={{ scale: 0, rotate: 20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 18 }}
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-700 via-red-500 to-red-300 flex items-center justify-center shadow-lg shadow-red-500/30"
                  >
                    <Store className="w-6 h-6 text-white" />
                  </motion.div>
                </div>

                {/* Copy */}
                <div className="text-center mb-4">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-red-700/25 to-red-300/15 border border-red-500/25 text-red-300 text-[9px] font-medium uppercase tracking-wider mb-2">
                    <Tag className="w-2.5 h-2.5" />
                    Sell in minutes
                  </span>
                  <h2 className="text-base font-bold text-white mb-1.5">
                    Got a vehicle to sell?
                  </h2>
                  <p className="text-[12px] text-white/55 leading-relaxed">
                    {isAuthed
                      ? 'List your vehicle in under 2 minutes with Quick Sell. Reach thousands of serious buyers today.'
                      : 'Create a free account to start listing your vehicles. Reach thousands of serious buyers on AutoRepublic.'}
                  </p>
                </div>

                {/* Feature highlights */}
                <div className="space-y-1.5 mb-4">
                  <FeatureRow
                    icon={Rocket}
                    title="Quick Sell"
                    subtitle="Post your listing in under 2 minutes"
                  />
                  <FeatureRow
                    icon={Sparkles}
                    title="Boost visibility"
                    subtitle="Promote to top of search results"
                  />
                  <FeatureRow
                    icon={Car}
                    title="Any vehicle"
                    subtitle="Cars, SUVs, trucks, buses, spare parts"
                  />
                </div>

                {/* Actions */}
                <div className="space-y-1.5">
                  <button
                    onClick={goSell}
                    className="w-full py-2.5 bg-gradient-to-r from-red-700 via-red-500 to-red-600 hover:from-emerald-600 hover:via-emerald-500 hover:to-emerald-500 rounded-xl text-[13px] font-medium text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 hover:shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isAuthed ? (
                      <>
                        <Rocket className="w-3.5 h-3.5" />
                        Start Selling
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        Create Free Account
                      </>
                    )}
                  </button>
                  <button
                    onClick={dismissSell}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[11px] font-medium text-white/50 hover:text-white/80 transition-colors"
                  >
                    No thanks
                  </button>
                </div>

                {!isAuthed && (
                  <p className="text-center text-[9px] text-white/25 mt-2.5">
                    Free to join · No listing fees
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ==========================================
// Feature row (compact)
// ==========================================
function FeatureRow({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: any
  title: string
  subtitle: string
}) {
  return (
    <div className="flex items-center gap-2.5 p-2 bg-white/[0.04] rounded-lg border border-white/5">
      <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-red-700/30 to-red-300/15 text-red-300">
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-white leading-tight">{title}</p>
        <p className="text-[9px] text-white/40 mt-0.5 leading-tight">{subtitle}</p>
      </div>
    </div>
  )
}