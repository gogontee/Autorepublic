// app/payment/callback/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function PaymentCallbackPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Check if searchParams exists
    if (!searchParams) {
      setStatus('error')
      setMessage('Invalid payment callback')
      return
    }

    const reference = searchParams.get('reference')
    const transactionId = searchParams.get('trxref')

    console.log('📝 Payment callback:', { reference, transactionId })

    if (!reference) {
      setStatus('error')
      setMessage('No payment reference found')
      return
    }

    // Get the user ID from localStorage
    const userId = localStorage.getItem('dashboardUserId')
    
    // ✅ SET ACTIVE TAB TO WALLET BEFORE REDIRECT
    localStorage.setItem('activeDashboardTab', 'wallet')
    
    console.log('💾 Set active tab to wallet for return')

    // Show success message
    setStatus('success')
    setMessage('Payment successful! Your wallet has been funded.')
    
    // Send message to parent window (if opened from popup)
    if (window.opener) {
      window.opener.postMessage({ 
        reference: reference,
        transactionId: transactionId || reference 
      }, window.location.origin)
    }
    
    // Redirect back to dashboard after 3 seconds
    setTimeout(() => {
      const dashboardPath = userId ? `/dashboard/${userId}` : '/dashboard'
      router.push(dashboardPath)
    }, 3000)

  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="bg-white/5 rounded-2xl p-8 max-w-md w-full border border-white/10 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Processing Payment</h2>
            <p className="text-white/40 text-sm">Please wait while we confirm your payment...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Payment Successful! 🎉</h2>
            <p className="text-white/60 text-sm">{message}</p>
            <p className="text-white/30 text-xs mt-4">Redirecting to wallet...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Payment Failed</h2>
            <p className="text-white/60 text-sm">{message}</p>
            <button
              onClick={() => {
                const savedUserId = localStorage.getItem('dashboardUserId')
                router.push(savedUserId ? `/dashboard/${savedUserId}` : '/dashboard')
              }}
              className="mt-6 px-6 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-white text-sm font-medium transition-colors"
            >
              Return to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  )
}