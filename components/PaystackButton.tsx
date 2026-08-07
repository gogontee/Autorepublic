// components/PaystackButton.tsx
'use client'

import { usePaystackPayment } from 'paystack-react'

interface PaystackButtonProps {
  email: string
  amount: number
  reference: string  // This is the transaction ID
  onSuccess: (reference: string) => void
  onClose: () => void
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

export default function PaystackButton({
  email,
  amount,
  reference,
  onSuccess,
  onClose,
  children,
  className,
  disabled
}: PaystackButtonProps) {
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || ''

  console.log('🔑 PaystackButton - reference:', reference) // Debug log

  const config = {
    reference: reference, // Use the transaction ID as reference
    email: email,
    amount: amount * 100,
    publicKey: publicKey,
    currency: 'NGN' as const,
  }

  const initializePayment = usePaystackPayment(config)

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

    if (!reference) {
      alert('Payment reference is missing. Please try again.')
      return
    }

    console.log('💳 Initializing payment with reference:', reference)

    initializePayment(
      (response: any) => {
        console.log('✅ Payment successful:', response)
        // The reference here should be the transaction ID
        onSuccess(response.reference || response.transref || reference)
      },
      () => {
        console.log('❌ Payment closed')
        onClose()
      }
    )
  }

  return (
    <button
      onClick={handlePayment}
      className={className}
      type="button"
      disabled={disabled || !reference}
    >
      {children}
    </button>
  )
}