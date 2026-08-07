// app/payment/callback/page.tsx

import { Suspense } from 'react'
import PaymentCallbackClient from './PaymentCallbackClient'

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-black">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />

            <p className="text-white/60 text-sm">
              Processing Payment...
            </p>
          </div>
        </div>
      }
    >
      <PaymentCallbackClient />
    </Suspense>
  )
}
