// components/dashboard/MyWallet.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  AlertCircle,
  Loader2,
  X,
  CheckCircle,
  Zap,
  Sparkles,
  Clock,
  ArrowRight,
  Filter,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import PaystackButton from '@/components/PaystackButton'
import { motion, AnimatePresence } from 'framer-motion'

interface MyWalletProps {
  userData?: {
    user: any
    profile: any
    session: any
  }
}

interface Transaction {
  id: string
  type: 'credit' | 'debit'
  description: string
  amount: number
  date: string
  status: 'completed' | 'pending' | 'failed'
}

interface WalletData {
  id: string
  user_id: string
  balance: number
  total_earnings: number
  total_withdrawn: number
  created_at: string
  updated_at: string
}

type FilterType = 'all' | 'credit' | 'debit'

const statusBadgeColors = {
  completed: 'bg-emerald-500/20 text-emerald-400',
  pending: 'bg-amber-500/20 text-amber-400',
  failed: 'bg-rose-500/20 text-rose-400',
}

export default function MyWallet({ userData }: MyWalletProps) {
  const { user, profile } = userData || {}
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  
  // Fund wallet states
  const [showFundModal, setShowFundModal] = useState(false)
  const [fundAmount, setFundAmount] = useState('')
  const [fundError, setFundError] = useState('')
  const [fundSuccess, setFundSuccess] = useState(false)
  const [transactionRef, setTransactionRef] = useState('')
  const [isInitializing, setIsInitializing] = useState(false)
  const [showPaystackButton, setShowPaystackButton] = useState(false)

  // Transaction container ref for scroll
  const transactionsContainerRef = useRef<HTMLDivElement>(null)

  // Fetch wallet data
  useEffect(() => {
    const fetchWalletData = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const { data: walletData, error: walletError } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (walletError && walletError.code !== 'PGRST116') {
          console.error('Error fetching wallet:', walletError)
          setError('Failed to load wallet data')
        }

        if (!walletData && !walletError) {
          const { data: newWallet, error: createError } = await supabase
            .from('wallets')
            .insert({
              user_id: user.id,
              balance: 0,
              total_earnings: 0,
              total_withdrawn: 0
            })
            .select()
            .single()

          if (createError) {
            console.error('Error creating wallet:', createError)
          } else if (newWallet) {
            setWallet(newWallet)
          }
        } else if (walletData) {
          setWallet(walletData)
        }

        // Fetch transactions (limit 50 for better experience)
        const { data: transactionData, error: transactionError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)

        if (transactionError) {
          console.error('Error fetching transactions:', transactionError)
        }

        if (transactionData && transactionData.length > 0) {
          const formattedTransactions: Transaction[] = transactionData.map((t: any) => ({
            id: t.id,
            type: t.type as 'credit' | 'debit',
            description: t.description || (t.type === 'credit' ? 'Deposit' : 'Withdrawal'),
            amount: t.amount,
            date: new Date(t.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            }),
            status: t.status || 'completed'
          }))
          setTransactions(formattedTransactions)
          setFilteredTransactions(formattedTransactions)
        }

        setLoading(false)
      } catch (err) {
        console.error('Error:', err)
        setError('Failed to load wallet data')
        setLoading(false)
      }
    }

    fetchWalletData()
  }, [user])

  // Filter transactions
  useEffect(() => {
    if (filter === 'all') {
      setFilteredTransactions(transactions)
    } else {
      setFilteredTransactions(transactions.filter(tx => tx.type === filter))
    }
  }, [filter, transactions])

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

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

      console.log('📡 Response status:', response.status)
      const data = await response.json()
      console.log('📦 Verification response:', data)

      if (response.ok && data.success) {
        setFundSuccess(true)
        setIsInitializing(false)
        setShowPaystackButton(false)
        
        setTimeout(() => {
          window.location.reload()
        }, 2000)
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

  const handlePaymentClose = () => {
    console.log('❌ Payment closed by user')
    setIsInitializing(false)
    setShowPaystackButton(false)
    setFundError('Payment was cancelled')
  }

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

    if (user?.id) {
      localStorage.setItem('dashboardUserId', user.id)
      console.log('💾 Stored user ID in localStorage:', user.id)
    }

    setIsInitializing(true)
    setFundError('')
    setShowPaystackButton(false)

    try {
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          wallet_id: wallet?.id,
          type: 'credit',
          amount: amount,
          description: 'Wallet funding via Paystack',
          status: 'pending'
        })
        .select()
        .single()

      if (txError) {
        console.error('❌ Error creating transaction:', txError)
        throw new Error('Failed to initialize transaction')
      }

      console.log('📝 Transaction created:', transaction.id)
      
      setTransactionRef(transaction.id)
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      setIsInitializing(false)
      setShowPaystackButton(true)

    } catch (err: any) {
      console.error('❌ Payment error:', err)
      setFundError(err.message || 'Failed to initialize payment')
      setIsInitializing(false)
      setShowPaystackButton(false)
    }
  }

  const closeModal = () => {
    setShowFundModal(false)
    setFundAmount('')
    setFundError('')
    setIsInitializing(false)
    setFundSuccess(false)
    setTransactionRef('')
    setShowPaystackButton(false)
  }

  // Get filter counts
  const creditCount = transactions.filter(tx => tx.type === 'credit').length
  const debitCount = transactions.filter(tx => tx.type === 'debit').length

  // Check if transactions need scrolling (more than 7)
  const needsScroll = filteredTransactions.length > 7

  if (!user) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-5 h-5 text-rose-500" />
        </div>
        <p className="text-white/40 text-xs">Please log in to view your wallet</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-5 h-5 text-rose-500 animate-spin mx-auto mb-3" />
        <p className="text-white/40 text-xs">Loading your wallet...</p>
      </div>
    )
  }

  const balance = wallet?.balance || 0
  const totalEarnings = wallet?.total_earnings || 0
  const totalWithdrawn = wallet?.total_withdrawn || 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-white flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-rose-400" />
            My Wallet
          </h1>
          <p className="text-[10px] text-white/40 mt-0.5">Manage your earnings & transactions</p>
        </div>
        <button 
          onClick={() => setShowFundModal(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 rounded-lg text-[10px] font-medium text-white transition-all active:scale-[0.95]"
        >
          <Plus className="w-3 h-3" />
          Add Funds
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-[10px] flex items-center gap-1.5">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Balance Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-rose-500/20 via-rose-600/10 to-transparent rounded-xl p-4 border border-rose-500/20">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-rose-400/5 rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-1.5 mb-1">
            <Wallet className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-[10px] text-white/60">Available Balance</span>
          </div>
          <p className="text-xl font-bold text-white tracking-tight">{formatCurrency(balance)}</p>
          <div className="flex items-center gap-3 mt-2.5">
            <button className="flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] text-white/60 transition-colors">
              <ArrowUpRight className="w-2.5 h-2.5" />
              Withdraw
            </button>
            <span className="text-[8px] text-white/20 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-amber-400/50" />
              <span>{balance > 0 ? 'Funded' : 'Pending'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white/5 rounded-lg p-2.5 border border-white/5">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />
            </div>
            <span className="text-[8px] text-white/40">Inflow</span>
          </div>
          <p className="text-xs font-bold text-emerald-400 mt-0.5">{formatCurrency(totalEarnings)}</p>
        </div>
        <div className="bg-white/5 rounded-lg p-2.5 border border-white/5">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-lg bg-rose-500/10 flex items-center justify-center">
              <TrendingDown className="w-2.5 h-2.5 text-rose-400" />
            </div>
            <span className="text-[8px] text-white/40">Outflow</span>
          </div>
          <p className="text-xs font-bold text-rose-400 mt-0.5">{formatCurrency(totalWithdrawn)}</p>
        </div>
      </div>

      {/* Transactions */}
      <div>
        {/* Filter Header */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[10px] font-medium text-white/60">Recent Transactions</h3>
          <div className="flex items-center gap-1.5">
            {/* Filter Buttons */}
            <button
              onClick={() => setFilter('all')}
              className={`px-2 py-0.5 rounded-lg text-[8px] font-medium transition-all ${
                filter === 'all'
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-white/40 hover:bg-white/10'
              }`}
            >
              All ({transactions.length})
            </button>
            <button
              onClick={() => setFilter('credit')}
              className={`px-2 py-0.5 rounded-lg text-[8px] font-medium transition-all flex items-center gap-0.5 ${
                filter === 'credit'
                  ? 'bg-emerald-500/30 text-emerald-400'
                  : 'bg-white/5 text-white/40 hover:bg-white/10'
              }`}
            >
              <ArrowDown className="w-2.5 h-2.5" />
              In ({creditCount})
            </button>
            <button
              onClick={() => setFilter('debit')}
              className={`px-2 py-0.5 rounded-lg text-[8px] font-medium transition-all flex items-center gap-0.5 ${
                filter === 'debit'
                  ? 'bg-rose-500/30 text-rose-400'
                  : 'bg-white/5 text-white/40 hover:bg-white/10'
              }`}
            >
              <ArrowUp className="w-2.5 h-2.5" />
              Out ({debitCount})
            </button>
          </div>
        </div>
        
        {/* Transactions Container with Scroll */}
        <div 
          ref={transactionsContainerRef}
          className={`bg-white/5 rounded-xl border border-white/5 overflow-y-auto ${
            needsScroll ? 'max-h-64' : ''
          }`}
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.1) transparent'
          }}
        >
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-2">
                <Filter className="w-3 h-3 text-white/20" />
              </div>
              <p className="text-[10px] text-white/40">
                {filter === 'all' 
                  ? 'No transactions yet' 
                  : filter === 'credit' 
                    ? 'No inflow transactions' 
                    : 'No outflow transactions'}
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredTransactions.map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: Math.min(index * 0.05, 0.5) }}
                  className={`flex items-center justify-between p-2.5 ${
                    index !== filteredTransactions.length - 1 ? 'border-b border-white/5' : ''
                  } hover:bg-white/5 transition-colors`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      transaction.type === 'credit' ? 'bg-emerald-500/20' : 'bg-rose-500/20'
                    }`}>
                      {transaction.type === 'credit' ? (
                        <ArrowDownLeft className="w-2.5 h-2.5 text-emerald-400" />
                      ) : (
                        <ArrowUpRight className="w-2.5 h-2.5 text-rose-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium text-white truncate">{transaction.description}</p>
                      <p className="text-[8px] text-white/30">{transaction.date}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className={`text-[10px] font-semibold ${
                      transaction.type === 'credit' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                    <span className={`text-[7px] px-1.5 py-0.5 rounded-full ${statusBadgeColors[transaction.status]}`}>
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
        
        {/* Scroll indicator */}
        {needsScroll && filteredTransactions.length > 0 && (
          <div className="flex items-center justify-center gap-1 mt-1.5 text-[8px] text-white/20">
            <Clock className="w-2.5 h-2.5" />
            <span>Scroll for more transactions</span>
          </div>
        )}
      </div>

      {/* Fund Wallet Modal */}
      {showFundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-5 max-w-sm w-full border border-white/10 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">Fund Your Wallet</h3>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                disabled={isInitializing}
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {fundSuccess ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">Payment Successful! 🎉</h4>
                <p className="text-[10px] text-white/60">Wallet funded successfully</p>
                <p className="text-[8px] text-white/30 mt-2">Redirecting...</p>
              </div>
            ) : (
              <>
                <div className="mb-3">
                  <label className="block text-[10px] font-medium text-white/60 mb-1">
                    Amount (₦)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 font-medium text-xs">
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
                      className="w-full pl-7 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-rose-500/50 transition-colors"
                      min="100"
                      step="100"
                      disabled={isInitializing}
                    />
                  </div>
                  <p className="text-[8px] text-white/30 mt-1">Minimum: ₦100</p>
                </div>

                {fundError && (
                  <div className="mb-3 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-[10px] flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    {fundError}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={closeModal}
                    disabled={isInitializing}
                    className="flex-1 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] text-white font-medium transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  
                  {!showPaystackButton ? (
                    <button
                      onClick={handleFundWallet}
                      disabled={!fundAmount || parseFloat(fundAmount) < 100 || isInitializing}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium text-white transition-colors flex items-center justify-center gap-1.5 ${
                        !fundAmount || parseFloat(fundAmount) < 100 || isInitializing
                          ? 'bg-white/10 text-white/40 cursor-not-allowed'
                          : 'bg-rose-500 hover:bg-rose-600'
                      }`}
                    >
                      {isInitializing ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
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
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-[10px] font-medium text-white transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CreditCard className="w-3 h-3" />
                      Pay Now
                    </PaystackButton>
                  )}
                </div>

                {showPaystackButton && (
                  <p className="text-[8px] text-white/30 text-center mt-2">
                    Click "Pay Now" to complete your payment
                  </p>
                )}

                <div className="mt-3 p-2 bg-white/5 rounded-lg border border-white/5">
                  <p className="text-[8px] text-white/30 text-center flex items-center justify-center gap-1">
                    <span>🔒</span> Secured by Paystack
                  </p>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}