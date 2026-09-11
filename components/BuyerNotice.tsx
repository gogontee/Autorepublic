'use client'

import { useState } from 'react'
import { Shield, AlertTriangle, CheckCircle, X } from 'lucide-react'
import Link from 'next/link'

interface BuyerNoticeProps {
  variant?: 'inline' | 'modal'
  onClose?: () => void
}

export default function BuyerNotice({ variant = 'inline', onClose }: BuyerNoticeProps) {
  const [dismissed, setDismissed] = useState(false)

  const handleDismiss = (e: React.SyntheticEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDismissed(true)
  }

  if (dismissed) return null

  if (variant === 'modal') {
    return (
      <div className="bg-gradient-to-br from-yellow-500/5 to-orange-500/5 rounded-2xl border border-yellow-500/20 p-6 max-w-md w-full relative">
        <div className="flex items-start justify-between mb-4 pr-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-xl flex-shrink-0">
              <Shield className="w-5 h-5 text-yellow-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">⚠️ Buyer Safety Notice</h3>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            onTouchEnd={handleDismiss}
            className="absolute top-3 right-3 z-20 p-2.5 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors"
            aria-label="Dismiss buyer notice"
            style={{ touchAction: 'manipulation' }}
          >
            <X
              className="w-4 h-4 text-white/60 pointer-events-none"
              style={{ pointerEvents: 'none' }}
            />
          </button>
        </div>

        <div className="space-y-2.5 text-xs text-white/70 leading-relaxed">
          <div className="flex items-start gap-2.5">
            <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
            <p><span className="text-white/80 font-medium">Inspect before you pay.</span> Always physically inspect the vehicle and ensure you are satisfied before making any payment.</p>
          </div>
          
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p><span className="text-white/80 font-medium">Never pay online</span> to a seller claiming to represent AutoRepublic. We do <span className="text-white/80 font-medium">not</span> collect payments on behalf of approved dealers.</p>
          </div>
          
          <div className="flex items-start gap-2.5">
            <Shield className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
            <p><span className="text-white/80 font-medium">Official promotions only.</span> Payments for AutoRepublic special offers or promotions will only be requested through <span className="text-white/80 font-medium">AutoRepublic's official contact channels</span>.</p>
          </div>
          
          <div className="flex items-start gap-2.5">
            <CheckCircle className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
            <p><span className="text-white/80 font-medium">When in doubt, verify first.</span> Contact AutoRepublic to confirm any payment request before sending money for a pre-order. Please read our <Link href="#" className="text-red-400 hover:text-red-300 transition-colors">Terms of Service</Link> and <Link href="#" className="text-red-400 hover:text-red-300 transition-colors">Buyer Protection Policy</Link> for more information.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-yellow-500/5 to-orange-500/5 rounded-2xl border border-yellow-500/20 p-4 sm:p-5 relative">
      {/* Mobile-only close button */}
      <button
        type="button"
        onClick={handleDismiss}
        onTouchEnd={handleDismiss}
        className="lg:hidden absolute top-2 right-2 z-20 p-2.5 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors"
        aria-label="Dismiss buyer notice"
        style={{ touchAction: 'manipulation' }}
      >
        <X
          className="w-4 h-4 text-white/60 pointer-events-none"
          style={{ pointerEvents: 'none' }}
        />
      </button>

      <div className="flex items-center gap-3 mb-3 pr-10 lg:pr-0">
        <div className="p-1.5 bg-yellow-500/20 rounded-lg flex-shrink-0">
          <Shield className="w-4 h-4 text-yellow-400" />
        </div>
        <h3 className="text-xs sm:text-sm font-semibold text-white">⚠️ Buyer Safety Notice</h3>
      </div>

      <div className="space-y-2 text-[10px] sm:text-xs text-white/70 leading-relaxed">
        <div className="flex items-start gap-2">
          <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
          <p><span className="text-white/80 font-medium">Inspect before you pay.</span> Always physically inspect the vehicle and ensure you are satisfied before making any payment.</p>
        </div>
        
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-3 h-3 text-yellow-400 flex-shrink-0 mt-0.5" />
          <p><span className="text-white/80 font-medium">Never pay online</span> to a seller claiming to represent AutoRepublic. We do <span className="text-white/80 font-medium">not</span> collect payments on behalf of approved dealers.</p>
        </div>
        
        <div className="flex items-start gap-2">
          <Shield className="w-3 h-3 text-blue-400 flex-shrink-0 mt-0.5" />
          <p><span className="text-white/80 font-medium">Official promotions only.</span> Payments for AutoRepublic special offers or promotions will only be requested through <span className="text-white/80 font-medium">AutoRepublic's official contact channels</span>.</p>
        </div>
        
        <div className="flex items-start gap-2">
          <CheckCircle className="w-3 h-3 text-blue-400 flex-shrink-0 mt-0.5" />
          <p><span className="text-white/80 font-medium">When in doubt, verify first.</span> Contact AutoRepublic to confirm any payment request before sending money for a pre-order. Please read our <Link href="#" className="text-red-400 hover:text-red-300 transition-colors">Terms of Service</Link> and <Link href="#" className="text-red-400 hover:text-red-300 transition-colors">Buyer Protection Policy</Link> for more information.</p>
        </div>
      </div>
    </div>
  )
}