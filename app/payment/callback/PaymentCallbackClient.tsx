// app/payment/callback/PaymentCallbackClient.tsx

'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function PaymentCallbackClient() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  )
  const [message, setMessage] = useState(
    'Please wait while we confirm your payment...'
  )

  useEffect(() => {
    if (!searchParams) {
      setStatus('error')
      setMessage('Invalid payment callback')
      return
    }

    const reference = searchParams.get('reference')
    const transactionId = searchParams.get('trxref')

    console.log('📝 Payment callback:', {
      reference,
      transactionId,
    })

    if (!reference) {
      setStatus('error')
      setMessage('No payment reference found')
      return
    }

    const verifyPayment = async () => {
      try {
        console.log('📡 Sending payment for verification...')

        const response = await fetch('/api/paystack/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reference,
            transactionId: transactionId || reference,
          }),
        })

        const data = await response.json()

        console.log('📦 Verification response:', data)

        if (!response.ok || !data.success) {
          console.error('❌ Payment verification failed:', data)

          setStatus('error')
          setMessage(
            data.error ||
              'We could not verify your payment. Please contact support if money was deducted.'
          )
          return
        }

        console.log('✅ Payment successfully verified')

        const userId = localStorage.getItem('dashboardUserId')

        // Set dashboard to wallet tab when user returns
        localStorage.setItem('activeDashboardTab', 'wallet')

        // Show success
        setStatus('success')
        setMessage(
          'Payment successful! Your wallet has been funded.'
        )

        // Notify parent window if this page was opened as a popup
        if (window.opener) {
          window.opener.postMessage(
            {
              type: 'PAYMENT_VERIFIED',
              reference,
              transactionId: transactionId || reference,
            },
            window.location.origin
          )
        }

        // Redirect to dashboard after 3 seconds
        const timeout = setTimeout(() => {
          const dashboardPath = userId
            ? `/dashboard/${userId}`
            : '/dashboard'

          router.push(dashboardPath)
        }, 3000)

        return () => clearTimeout(timeout)
      } catch (error) {
        console.error('❌ Payment verification request failed:', error)

        setStatus('error')
        setMessage(
          'Unable to verify your payment. Please check your connection and try again.'
        )
      }
    }

    verifyPayment()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="text-center max-w-md w-full">

        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />

            <h2 className="text-xl font-bold text-white mb-2">
              Processing Payment
            </h2>

            <p className="text-white/60 text-sm">
              {message}
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />

            <h2 className="text-xl font-bold text-white mb-2">
              Payment Successful! 🎉
            </h2>

            <p className="text-white/60 text-sm">
              {message}
            </p>

            <p className="text-white/30 text-xs mt-4">
              Redirecting to wallet...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />

            <h2 className="text-xl font-bold text-white mb-2">
              Payment Verification Failed
            </h2>

            <p className="text-white/60 text-sm">
              {message}
            </p>

            <button
              onClick={() => {
                const savedUserId =
                  localStorage.getItem('dashboardUserId')

                router.push(
                  savedUserId
                    ? `/dashboard/${savedUserId}`
                    : '/dashboard'
                )
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