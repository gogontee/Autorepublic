// components/ads/FundWallet.tsx
'use client'

import { useState } from 'react'
import { X, Wallet, Loader2, AlertCircle, CheckCircle, CreditCard } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import PaystackButton from '@/components/PaystackButton'

interface FundWalletProps {
  userData?: {  // Make this optional
    user: any
    profile: any
    session: any
  }
  onClose: () => void
  onSuccess: () => void
}

export default function FundWallet({ userData, onClose, onSuccess }: FundWalletProps) {
  const { user, profile } = userData || {}
  const [fundAmount, setFundAmount] = useState('')
  const [fundError, setFundError] = useState('')
  const [isInitializing, setIsInitializing] = useState(false)
  const [transactionRef, setTransactionRef] = useState('')
  const [showPaystackButton, setShowPaystackButton] = useState(false)
  const [fundSuccess, setFundSuccess] = useState(false)

  // If no user is logged in
  if (!user) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-white/40">Please log in to fund your wallet</p>
        <button
          onClick={onClose}
          className="mt-4 px-6 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-medium text-white transition-colors"
        >
          Close
        </button>
      </div>
    )
  }

  // Handle payment success
  const handlePaymentSuccess = async (reference: string) => {
    try {
      console.log('✅ Payment success, verifying...', { reference, transactionRef })
      
      const response = await fetch('/api/paystack/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          reference, 
          transactionId: transactionRef 
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setFundSuccess(true)
        setIsInitializing(false)
        setShowPaystackButton(false)
        
        setTimeout(() => {
          onSuccess()
        }, 1500)
      } else {
        setFundError(data.error || 'Payment verification failed. Please contact support.')
        setIsInitializing(false)
        setShowPaystackButton(false)
      }
    } catch (err) {
      console.error('❌ Verification error:', err)
      setFundError('Failed to verify payment. Please contact support.')
      setIsInitializing(false)
      setShowPaystackButton(false)
    }
  }

  // Handle payment close
  const handlePaymentClose = () => {
    console.log('❌ Payment closed by user')
    setIsInitializing(false)
    setShowPaystackButton(false)
    setFundError('Payment was cancelled')
  }

  // Handle fund wallet
  const handleFundWallet = async () => {
    const amount = parseFloat(fundAmount)
    
    if (!amount || amount < 100) {
      setFundError('Minimum amount is ₦100')
      return
    }

    if (!user?.email) {
      setFundError('Please ensure your email is set in your profile')
      return
    }

    setIsInitializing(true)
    setFundError('')
    setShowPaystackButton(false)

    try {
      // Get wallet ID
      const { data: walletData } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', user.id)
        .single()

      // Create a transaction record
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          wallet_id: walletData?.id,
          type: 'credit',
          amount: amount,
          description: 'Wallet funding via Paystack',
          status: 'pending'
        })
        .select()
        .single()

      if (txError) {
        console.error('Error creating transaction:', txError)
        throw new Error('Failed to initialize transaction')
      }

      setTransactionRef(transaction.id)
      setIsInitializing(false)
      setShowPaystackButton(true)

    } catch (err: any) {
      console.error('Payment error:', err)
      setFundError(err.message || 'Failed to initialize payment')
      setIsInitializing(false)
      setShowPaystackButton(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 max-w-md w-full border border-white/10 shadow-2xl animate-in zoom-in duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-bold text-white">Fund Your Wallet</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            disabled={isInitializing}
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {fundSuccess ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Payment Successful! 🎉</h4>
            <p className="text-sm text-white/60">
              Your wallet has been funded successfully.
            </p>
            <p className="text-xs text-white/40 mt-2">
              Redirecting...
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-white/60 mb-1.5">
                Amount (₦)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 font-medium">
                  ₦
                </span>
                <input
                  type="number"
                  value={fundAmount}
                  onChange={(e) => {
                    setFundAmount(e.target.value)
                    setFundError('')
                    setShowPaystackButton(false)
                  }}
                  placeholder="Enter amount"
                  className="w-full pl-7 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                  min="100"
                  step="100"
                  disabled={isInitializing}
                />
              </div>
              <p className="text-xs text-white/30 mt-1.5">Minimum amount: ₦100</p>
            </div>

            {fundError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {fundError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isInitializing}
                className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              
              {!showPaystackButton ? (
                <button
                  onClick={handleFundWallet}
                  disabled={!fundAmount || parseFloat(fundAmount) < 100 || isInitializing}
                  className={`flex-1 py-2.5 rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-2 ${
                    !fundAmount || parseFloat(fundAmount) < 100 || isInitializing
                      ? 'bg-white/10 text-white/40 cursor-not-allowed'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {isInitializing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Fund Now'
                  )}
                </button>
              ) : (
                <PaystackButton
                  email={user?.email || ''}
                  amount={parseFloat(fundAmount)}
                  reference={transactionRef}
                  onSuccess={handlePaymentSuccess}
                  onClose={handlePaymentClose}
                  className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  Pay Now
                </PaystackButton>
              )}
            </div>

            {showPaystackButton && (
              <p className="text-xs text-white/30 text-center mt-2">
                Click "Pay Now" to complete your payment with Paystack
              </p>
            )}

            <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/5">
              <p className="text-xs text-white/30 text-center">
                🔒 Secured by Paystack. Your payment is safe and encrypted.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}