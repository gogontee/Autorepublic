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
const LS_FIRST_POPUP = 'ar_onboarding_browse_seen'         // permanent (once ever)
const SS_SECOND_POPUP = 'ar_onboarding_sell_seen'          // per session
const LS_LAST_SELL_PROMPT = 'ar_onboarding_sell_last'      // to throttle across sessions

// ==========================================
// Config
// ==========================================
const FIRST_DELAY_MS = 10_000       // 10 seconds
const SECOND_DELAY_MS = 30_000      // 30 seconds
const SELL_PROMPT_COOLDOWN_MS = 1000 * 60 * 60 * 24 // don't nag more than once/day
const SELL_PROMPT_RANDOM_SKIP = 0.4 // 40% chance to skip even when eligible

// ==========================================
// Helper: check if user is authenticated
// ==========================================
async function getAuthUser() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user || null
}

export default function OnboardingPopups() {
  const router = useRouter()

  // Which popup is currently visible
  const [showBrowse, setShowBrowse] = useState(false)
  const [showSell, setShowSell] = useState(false)

  // Auth state for the sell popup
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null)

  // ==========================================
  // Mount: decide what to show
  // ==========================================
  useEffect(() => {
    if (typeof window === 'undefined') return

    // ---------- First popup (browse) ----------
    const browseSeen = localStorage.getItem(LS_FIRST_POPUP) === 'true'
    let firstTimer: ReturnType<typeof setTimeout> | undefined

    if (!browseSeen) {
      firstTimer = setTimeout(() => {
        setShowBrowse(true)
      }, FIRST_DELAY_MS)
    }

    // ---------- Second popup (sell) ----------
    // Rules:
    //  - Must not already be showing this session
    //  - Must not have been shown within cooldown window
    //  - Random 40% skip even when eligible → "sometimes it should not"
    const sessionSeen = sessionStorage.getItem(SS_SECOND_POPUP) === 'true'
    const lastShown = Number(localStorage.getItem(LS_LAST_SELL_PROMPT) || 0)
    const withinCooldown = Date.now() - lastShown < SELL_PROMPT_COOLDOWN_MS
    const skipRandomly = Math.random() < SELL_PROMPT_RANDOM_SKIP

    let secondTimer: ReturnType<typeof setTimeout> | undefined

    if (!sessionSeen && !withinCooldown && !skipRandomly) {
      secondTimer = setTimeout(async () => {
        const user = await getAuthUser()
        setIsAuthed(!!user)

        // Only show if the browse popup isn't currently open
        // (we check via functional setter — if user dismissed browse fast, we're fine)
        setShowBrowse((browseOpen) => {
          if (browseOpen) {
            // Defer a bit if browse is still open
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
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[80] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
            onClick={dismissBrowse}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm sm:max-w-md bg-gradient-to-br from-gray-900 to-black rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
            >
              {/* Gradient glow */}
              <div className="absolute -top-24 -right-24 w-56 h-56 bg-red-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Close */}
              <button
                onClick={dismissBrowse}
                className="absolute top-3 right-3 z-10 p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4 text-white/50" />
              </button>

              <div className="relative p-6 sm:p-7">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 18 }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30"
                  >
                    <Compass className="w-8 h-8 text-white" />
                  </motion.div>
                </div>

                {/* Copy */}
                <div className="text-center mb-5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/25 text-red-400 text-[10px] font-medium uppercase tracking-wider mb-3">
                    <Sparkles className="w-3 h-3" />
                    Explore thousands of cars
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-white mb-2">
                    Find your perfect ride
                  </h2>
                  <p className="text-sm text-white/60 leading-relaxed">
                    Browse verified vehicles from trusted sellers across Nigeria.
                    Filter by brand, location, price, and condition to find
                    exactly what you're looking for.
                  </p>
                </div>

                {/* Feature highlights */}
                <div className="space-y-2 mb-5">
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
                <div className="space-y-2">
                  <button
                    onClick={goExplore}
                    className="w-full py-3 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-medium text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Explore Vehicles
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={dismissBrowse}
                    className="w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-medium text-white/50 hover:text-white/80 transition-colors"
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
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[80] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
            onClick={dismissSell}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm sm:max-w-md bg-gradient-to-br from-gray-900 to-black rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
            >
              {/* Gradient glow */}
              <div className="absolute -top-24 -left-24 w-56 h-56 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-56 h-56 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Close */}
              <button
                onClick={dismissSell}
                className="absolute top-3 right-3 z-10 p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4 text-white/50" />
              </button>

              <div className="relative p-6 sm:p-7">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <motion.div
                    initial={{ scale: 0, rotate: 20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 18 }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30"
                  >
                    <Store className="w-8 h-8 text-white" />
                  </motion.div>
                </div>

                {/* Copy */}
                <div className="text-center mb-5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[10px] font-medium uppercase tracking-wider mb-3">
                    <Tag className="w-3 h-3" />
                    Sell in minutes
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-white mb-2">
                    Got a vehicle to sell?
                  </h2>
                  <p className="text-sm text-white/60 leading-relaxed">
                    {isAuthed
                      ? 'List your vehicle in under 2 minutes with Quick Sell. Reach thousands of serious buyers today.'
                      : 'Create a free account to start listing your vehicles. Reach thousands of serious buyers on AutoRepublic.'}
                  </p>
                </div>

                {/* Feature highlights */}
                <div className="space-y-2 mb-5">
                  <FeatureRow
                    icon={Rocket}
                    title="Quick Sell"
                    subtitle="Post your listing in under 2 minutes"
                    tone="emerald"
                  />
                  <FeatureRow
                    icon={Sparkles}
                    title="Boost visibility"
                    subtitle="Promote to top of search results"
                    tone="emerald"
                  />
                  <FeatureRow
                    icon={Car}
                    title="Any vehicle"
                    subtitle="Cars, SUVs, trucks, buses, spare parts"
                    tone="emerald"
                  />
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={goSell}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-sm font-medium text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isAuthed ? (
                      <>
                        <Rocket className="w-4 h-4" />
                        Start Selling
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Create Free Account
                      </>
                    )}
                  </button>
                  <button
                    onClick={dismissSell}
                    className="w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-medium text-white/50 hover:text-white/80 transition-colors"
                  >
                    No thanks
                  </button>
                </div>

                {!isAuthed && (
                  <p className="text-center text-[10px] text-white/30 mt-3">
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
// Small reusable row for feature bullets
// ==========================================
function FeatureRow({
  icon: Icon,
  title,
  subtitle,
  tone = 'red',
}: {
  icon: any
  title: string
  subtitle: string
  tone?: 'red' | 'emerald'
}) {
  const toneClasses =
    tone === 'emerald'
      ? 'bg-emerald-500/15 text-emerald-400'
      : 'bg-red-500/15 text-red-400'

  return (
    <div className="flex items-start gap-3 p-2.5 bg-white/5 rounded-xl border border-white/5">
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${toneClasses}`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-white">{title}</p>
        <p className="text-[10px] text-white/40 mt-0.5">{subtitle}</p>
      </div>
    </div>
  )
}