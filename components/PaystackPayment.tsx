// components/PaystackPayment.tsx
'use client'

import { usePaystackPayment } from 'paystack-react'

interface PaystackPaymentProps {
  email: string
  amount: number
  onSuccess: (reference: string) => void
  onClose: () => void
  className?: string
  children: React.ReactNode
  transactionRef?: string
}

export default function PaystackPayment({ 
  email, 
  amount, 
  onSuccess, 
  onClose,
  className,
  children,
  transactionRef
}: PaystackPaymentProps) {
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || ''

  const config = {
    reference: transactionRef || `ref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    email: email,
    amount: amount * 100, // Paystack expects amount in kobo
    publicKey: publicKey,
    currency: 'NGN' as const, // Use 'as const' to satisfy the Currency type
  }

  const initializePayment = usePaystackPayment(config)

  const handleSuccess = (response: any) => {
    console.log('✅ Payment successful:', response)
    onSuccess(response.reference || response.transref)
  }

  const handleClose = () => {
    console.log('❌ Payment closed')
    onClose()
  }

  const handlePayment = () => {
    if (!email) {
      alert('Please ensure your email is set in your profile')
      return
    }

    if (!amount || amount < 100) {
      alert('Minimum amount is ₦100')
      return
    }

    if (!publicKey) {
      alert('Payment system is not configured. Please contact support.')
      return
    }

    initializePayment(handleSuccess, handleClose)
  }

  return (
    <button
      onClick={handlePayment}
      className={className}
      type="button"
    >
      {children}
    </button>
  )
}