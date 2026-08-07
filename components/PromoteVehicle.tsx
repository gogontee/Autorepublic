// components/PromoteVehicle.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  Zap, 
  Star, 
  Sparkles, 
  Clock, 
  TrendingUp, 
  Wallet, 
  AlertCircle,
  Loader2,
  CheckCircle,
  Info,
  Crown,
  Flame,
  Gem,
  ArrowUpRight,
  Calendar,
  Shield,
  Gift
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface PromoteVehicleProps {
  vehicleId: string
  vehicleTitle: string
  vehicleCode?: string
  onClose: () => void
  onSuccess: () => void
  userData?: {
    user: any
    profile: any
    session: any
  }
  onOpenWallet?: () => void
}

interface Package {
  id: string
  name: string
  price: number
  duration: number
  description: string
  features: string[]
  icon: any
  color: string
  badge?: string
}

interface ExistingPromotion {
  id: string
  package_type: string
  end_date: string
  duration_days: number
  price: number
}

const packages: Package[] = [
  {
    id: 'basic',
    name: 'Basic Boost',
    price: 4000,
    duration: 7,
    description: 'Quick visibility boost',
    features: [
      'Random display on vehicle page',
      '7 days promotion',
      'Basic visibility',
    ],
    icon: Flame,
    color: 'blue',
  },
  {
    id: 'medium',
    name: 'Featured Plus',
    price: 25000,
    duration: 15,
    description: 'Featured listing exposure',
    features: [
      'Featured vehicles section',
      '15 days promotion',
      'Higher visibility',
      'Priority listing',
    ],
    icon: Star,
    color: 'yellow',
    badge: 'Popular',
  },
  {
    id: 'premium',
    name: 'Premium Elite',
    price: 40000,
    duration: 30,
    description: 'Maximum exposure & priority',
    features: [
      'Top of vehicle page',
      'Featured page placement',
      'Top search results',
      '30 days promotion',
      'Highest priority',
    ],
    icon: Crown,
    color: 'red',
    badge: 'Best Value',
  },
]

export default function PromoteVehicle({ 
  vehicleId, 
  vehicleTitle,
  vehicleCode,
  onClose, 
  onSuccess,
  userData,
  onOpenWallet
}: PromoteVehicleProps) {
  const { user } = userData || {}
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedPackage, setSelectedPackage] = useState<Package>(packages[2])
  const [walletBalance, setWalletBalance] = useState(0)
  const [walletId, setWalletId] = useState<string | null>(null)
  const [loadingWallet, setLoadingWallet] = useState(true)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [success, setSuccess] = useState(false)
  const [promotionDetails, setPromotionDetails] = useState<any>(null)
  const [existingPromotion, setExistingPromotion] = useState<ExistingPromotion | null>(null)
  const [loadingPromotion, setLoadingPromotion] = useState(true)
  const [showInsufficientPopup, setShowInsufficientPopup] = useState(false)
  const [actionType, setActionType] = useState<'new' | 'extend' | 'upgrade'>('new')
  const [showExtendUpgradeModal, setShowExtendUpgradeModal] = useState(false)

  // Fetch existing promotion and wallet
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoadingWallet(false)
        setLoadingPromotion(false)
        return
      }

      try {
        // Fetch wallet
        const { data: walletData, error: walletError } = await supabase
          .from('wallets')
          .select('id, balance')
          .eq('user_id', user.id)
          .single()

        if (walletError) {
          console.error('Error fetching wallet:', walletError)
        } else if (walletData) {
          setWalletBalance(walletData.balance)
          setWalletId(walletData.id)
        }

        // Fetch existing promotion
        const { data: promoData, error: promoError } = await supabase
          .from('vehicle_promotions')
          .select('*')
          .eq('vehicle_id', vehicleId)
          .eq('status', 'active')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (promoError && promoError.code !== 'PGRST116') {
          console.error('Error fetching promotion:', promoError)
        } else if (promoData) {
          setExistingPromotion({
            id: promoData.id,
            package_type: promoData.package_type,
            end_date: promoData.end_date,
            duration_days: promoData.duration_days,
            price: promoData.price
          })
        }

      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoadingWallet(false)
        setLoadingPromotion(false)
      }
    }

    fetchData()
  }, [user, vehicleId])

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Get package by id
  const getPackageById = (id: string) => {
    return packages.find(p => p.id === id) || packages[0]
  }

  // Check if vehicle is already promoted
  const isPromoted = existingPromotion !== null

  // Get the current package details
  const currentPackage = isPromoted ? getPackageById(existingPromotion.package_type) : null
  const isPremium = isPromoted && existingPromotion.package_type === 'premium'

  // Handle package selection
  const handlePackageSelect = (pkg: Package) => {
    // If already promoted, check if upgrading
    if (isPromoted && currentPackage) {
      const currentPkgIndex = packages.findIndex(p => p.id === currentPackage.id)
      const newPkgIndex = packages.findIndex(p => p.id === pkg.id)
      
      // Can't downgrade
      if (newPkgIndex < currentPkgIndex) {
        setError(`You cannot downgrade from ${currentPackage.name}. You can only extend or upgrade.`)
        return
      }
      
      // If same package, it's an extension
      if (newPkgIndex === currentPkgIndex) {
        setActionType('extend')
      } else {
        // Upgrading
        setActionType('upgrade')
        setError('') // Clear any previous error
      }
    } else {
      setActionType('new')
    }
    
    setSelectedPackage(pkg)
    setError('')
  }

  // Handle promotion purchase
  const handlePurchase = async () => {
    if (!user) {
      setError('Please log in to promote your vehicle')
      return
    }

    if (!walletId) {
      setError('Wallet not found. Please contact support.')
      return
    }

    // Check if vehicle is already promoted
    if (isPromoted && currentPackage) {
      const currentPkgIndex = packages.findIndex(p => p.id === currentPackage.id)
      const newPkgIndex = packages.findIndex(p => p.id === selectedPackage.id)
      
      // Can't downgrade
      if (newPkgIndex < currentPkgIndex) {
        setError(`You cannot downgrade from ${currentPackage.name}. You can only extend or upgrade.`)
        return
      }
      
      // If same package, extension
      if (newPkgIndex === currentPkgIndex) {
        setActionType('extend')
      } else {
        setActionType('upgrade')
      }
    } else {
      setActionType('new')
    }

    // Check wallet balance
    if (walletBalance < selectedPackage.price) {
      setShowInsufficientPopup(true)
      return
    }

    setShowConfirmation(true)
  }

  // Confirm and process promotion
  const handleConfirmPromotion = async () => {
    setLoading(true)
    setError('')

    try {
      let endDate = new Date()
      
      // Calculate end date based on action type
      if (actionType === 'extend' && existingPromotion) {
        // Extend from existing end date
        endDate = new Date(existingPromotion.end_date)
        endDate.setDate(endDate.getDate() + selectedPackage.duration)
      } else {
        // New promotion or upgrade - start from now
        const startDate = new Date()
        endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + selectedPackage.duration)
      }

      // 1. Create transaction record
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          wallet_id: walletId,
          type: 'debit',
          amount: selectedPackage.price,
          description: `Vehicle ${actionType === 'extend' ? 'extension' : actionType === 'upgrade' ? 'upgrade' : 'promotion'} - ${selectedPackage.name} for "${vehicleTitle}"`,
          status: 'completed',
          reference: `PROMO-${Date.now()}-${vehicleId.slice(0, 8)}`
        })

      if (txError) {
        throw new Error(`Failed to record transaction: ${txError.message}`)
      }

      // 2. Update wallet balance
      const newBalance = walletBalance - selectedPackage.price
      const { error: walletError } = await supabase
        .from('wallets')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', walletId)

      if (walletError) {
        throw new Error(`Failed to update wallet: ${walletError.message}`)
      }

      // 3. Handle promotion record
      if (actionType === 'extend' && existingPromotion) {
        // Update existing promotion
        const { error: updateError } = await supabase
          .from('vehicle_promotions')
          .update({
            end_date: endDate.toISOString(),
            duration_days: existingPromotion.duration_days + selectedPackage.duration,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPromotion.id)

        if (updateError) {
          throw new Error(`Failed to update promotion: ${updateError.message}`)
        }
      } else {
        // Create new promotion record (for new or upgrade)
        // For upgrade, we first deactivate old one, then create new
        if (actionType === 'upgrade' && existingPromotion) {
          // Deactivate old promotion
          await supabase
            .from('vehicle_promotions')
            .update({
              status: 'expired',
              is_active: false,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingPromotion.id)
        }

        // Create new promotion
        const { error: promoError } = await supabase
          .from('vehicle_promotions')
          .insert({
            vehicle_id: vehicleId,
            user_id: user.id,
            package_type: selectedPackage.id,
            price: selectedPackage.price,
            duration_days: selectedPackage.duration,
            start_date: new Date().toISOString(),
            end_date: endDate.toISOString(),
            status: 'active',
            is_active: true,
          })

        if (promoError) {
          throw new Error(`Failed to create promotion: ${promoError.message}`)
        }
      }

      // 4. Update vehicle record with promotion info
      const updateData: any = {
        is_promoted: true,
        promotion_package: selectedPackage.id,
        promotion_end_date: endDate.toISOString(),
        updated_at: new Date().toISOString()
      }

      // Add featured_until for medium and premium packages
      if (selectedPackage.id === 'medium' || selectedPackage.id === 'premium') {
        updateData.featured_until = endDate.toISOString()
      }

      const { error: vehicleError } = await supabase
        .from('vehicles')
        .update(updateData)
        .eq('id', vehicleId)

      if (vehicleError) {
        throw new Error(`Failed to update vehicle: ${vehicleError.message}`)
      }

      // 5. Send notification
      const actionMessage = actionType === 'extend' ? 'extended' : 
                           actionType === 'upgrade' ? 'upgraded to' : 'activated'
      
      await sendNotification({
        userId: user.id,
        title: `Promotion ${actionMessage === 'extended' ? 'Extended' : actionMessage === 'upgraded to' ? 'Upgraded' : 'Activated'}! 🚀`,
        message: `${formatCurrency(selectedPackage.price)} has been deducted from your wallet for ${selectedPackage.name} promotion on "${vehicleTitle}". Your vehicle will be promoted for ${selectedPackage.duration} more days.`,
        type: 'promotion',
        data: {
          vehicleId,
          package: selectedPackage.id,
          duration: selectedPackage.duration,
          amount: selectedPackage.price,
          action: actionType
        }
      })

      // Update local balance
      setWalletBalance(newBalance)
      setPromotionDetails({
        package: selectedPackage,
        startDate: new Date(),
        endDate: endDate,
        amount: selectedPackage.price,
        action: actionType
      })
      setSuccess(true)
      setShowConfirmation(false)

      // Call onSuccess callback after a delay
      setTimeout(() => {
        onSuccess()
      }, 2000)

    } catch (err: any) {
      console.error('Error processing promotion:', err)
      setError(err.message || 'An unexpected error occurred')
      setShowConfirmation(false)
    } finally {
      setLoading(false)
    }
  }

  // Send notification function
  const sendNotification = async (notification: any) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: notification.userId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          data: notification.data,
          read: false,
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error sending notification:', error)
      }
    } catch (err) {
      console.error('Error:', err)
    }
  }

  // Handle top up - opens the FundWallet modal via onOpenWallet callback
  const handleTopUp = () => {
    setShowInsufficientPopup(false)
    // Close the promotion modal
    onClose()
    // Open the FundWallet modal through the parent component
    if (onOpenWallet) {
      onOpenWallet()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl animate-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              Promote Your Vehicle
            </h2>
            <p className="text-xs text-white/40 mt-1">Boost visibility and attract more buyers</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Vehicle Title with Code */}
        <div className="bg-white/5 rounded-xl p-3 mb-4 border border-white/5">
          <p className="text-xs text-white/40">Vehicle</p>
          <p className="text-sm font-medium text-white truncate">
            {vehicleCode && <span className="text-red-400 mr-2">#{vehicleCode}</span>}
            {vehicleTitle}
          </p>
        </div>

        {/* Existing Promotion Status */}
        {isPromoted && currentPackage && (
          <div className="bg-gradient-to-br from-blue-500/10 via-blue-600/5 to-transparent rounded-xl p-3 border border-blue-500/20 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-white/60">Current Promotion</span>
              </div>
              <span className="text-sm font-semibold text-blue-400">
                {currentPackage.name}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1 text-xs text-white/40">
              <span>Expires: {new Date(existingPromotion.end_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}</span>
              <span>{isPremium ? '⭐ Premium' : 'Upgrade available'}</span>
            </div>
            {isPremium && (
              <div className="mt-1 text-[10px] text-green-400/60">
                ✨ You have the highest package. You can extend your promotion.
              </div>
            )}
          </div>
        )}

        {/* Wallet Balance */}
        <div className="bg-gradient-to-br from-red-500/10 via-red-600/5 to-transparent rounded-xl p-3 border border-red-500/20 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-red-400" />
              <span className="text-sm text-white/60">Wallet Balance</span>
            </div>
            <span className="text-lg font-bold text-white">{formatCurrency(walletBalance)}</span>
          </div>
          {loadingWallet && (
            <div className="flex items-center gap-2 mt-1">
              <Loader2 className="w-3 h-3 text-white/40 animate-spin" />
              <span className="text-xs text-white/40">Loading balance...</span>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Action Type Indicator */}
        {isPromoted && currentPackage && (
          <div className="mb-3 text-xs text-white/40 flex items-center gap-2">
            <Gift className="w-3.5 h-3.5 text-yellow-400" />
            <span>
              {isPremium 
                ? 'You can extend your Premium promotion' 
                : 'Upgrade or extend your current promotion'}
            </span>
          </div>
        )}

        {/* Packages */}
        <div className="space-y-3 mb-4">
          <h3 className="text-sm font-medium text-white/60">Select Promotion Package</h3>
          
          <div className="grid grid-cols-1 gap-3">
            {packages.map((pkg) => {
              const isSelected = selectedPackage.id === pkg.id
              const Icon = pkg.icon
              const hasEnoughBalance = walletBalance >= pkg.price
              const isDisabled = isPromoted && currentPackage && 
                packages.findIndex(p => p.id === pkg.id) < packages.findIndex(p => p.id === currentPackage.id)

              return (
                <button
                  key={pkg.id}
                  onClick={() => handlePackageSelect(pkg)}
                  disabled={!!isDisabled}
                  className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? `border-${pkg.color}-500 bg-${pkg.color}-500/10 shadow-lg shadow-${pkg.color}-500/20`
                      : isDisabled
                        ? 'border-white/5 bg-white/5 opacity-40 cursor-not-allowed'
                        : hasEnoughBalance
                          ? 'border-white/10 bg-white/5 hover:border-white/20'
                          : 'border-white/5 bg-white/5 opacity-60 hover:border-red-500/30'
                  }`}
                >
                  {pkg.badge && (
                    <div className={`absolute -top-2 -right-2 px-2 py-0.5 bg-${pkg.color}-500 rounded-full text-[8px] font-medium text-white uppercase tracking-wider`}>
                      {pkg.badge}
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl bg-${pkg.color}-500/10`}>
                      <Icon className={`w-5 h-5 text-${pkg.color}-400`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-white/80'}`}>
                            {pkg.name}
                            {isDisabled && <span className="ml-2 text-[10px] text-white/30">(Downgrade not allowed)</span>}
                          </h4>
                          <p className="text-xs text-white/40">{pkg.description}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${isSelected ? `text-${pkg.color}-500` : 'text-white'}`}>
                            {formatCurrency(pkg.price)}
                          </p>
                          <p className="text-[10px] text-white/30">{pkg.duration} days</p>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {pkg.features.map((feature, index) => (
                          <span key={index} className="text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Package Comparison */}
        <div className="bg-white/5 rounded-xl p-3 border border-white/5 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs text-white/60">Package Benefits</span>
          </div>
          <div className="space-y-1.5 text-xs text-white/40">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 flex-shrink-0" />
              <span><span className="text-white/60">Basic:</span> Random display on vehicle page for 7 days</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1 flex-shrink-0" />
              <span><span className="text-white/60">Featured Plus:</span> Featured vehicles section for 15 days</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1 flex-shrink-0" />
              <span><span className="text-white/60">Premium Elite:</span> Top of page, featured placement & top search results for 30 days</span>
            </div>
          </div>
        </div>

        {/* Purchase Button */}
        <button
          onClick={handlePurchase}
          disabled={loading || loadingWallet || loadingPromotion || !user}
          className={`w-full py-3 rounded-xl font-medium text-white transition-all flex items-center justify-center gap-2 ${
            loading || loadingWallet || loadingPromotion || !user
              ? 'bg-white/10 text-white/40 cursor-not-allowed'
              : `bg-${selectedPackage.color}-500 hover:bg-${selectedPackage.color}-600 hover:scale-[1.02] active:scale-[0.98] shadow-${selectedPackage.color}-500/25`
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : loadingPromotion ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking promotion status...
            </>
          ) : !user ? (
            <>
              <AlertCircle className="w-4 h-4" />
              Please Log In
            </>
          ) : isPromoted && currentPackage ? (
            <>
              <ArrowUpRight className="w-4 h-4" />
              {isPremium 
                ? `Extend ${currentPackage.name} - ${formatCurrency(selectedPackage.price)}` 
                : `Upgrade to ${selectedPackage.name} - ${formatCurrency(selectedPackage.price)}`}
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Promote Now - {formatCurrency(selectedPackage.price)}
            </>
          )}
        </button>

        <p className="text-center text-[10px] text-white/20 mt-2">
          No refunds on promotions. Promotion persists until vehicle is sold.
        </p>

        {/* Insufficient Balance Popup */}
        {showInsufficientPopup && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 max-w-md w-full border border-white/10 shadow-2xl animate-in zoom-in duration-300">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Insufficient Balance</h3>
                <p className="text-sm text-white/60 mb-2">
                  Your wallet balance is too low to promote this vehicle.
                </p>
                <p className="text-sm text-white/60 mb-4">
                  You need <span className="text-yellow-400 font-semibold">{formatCurrency(selectedPackage.price)}</span> but you have <span className="text-red-400 font-semibold">{formatCurrency(walletBalance)}</span>
                </p>
                <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/5">
                  <p className="text-xs text-white/40">
                    You need an additional <span className="text-yellow-400 font-semibold">{formatCurrency(selectedPackage.price - walletBalance)}</span> to proceed
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleTopUp}
                    className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <Wallet className="w-4 h-4" />
                    Top Up Now
                  </button>
                  <button
                    onClick={() => {
                      setShowInsufficientPopup(false)
                      setError('')
                    }}
                    className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium text-white/60 transition-all hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 max-w-md w-full border border-white/10 shadow-2xl animate-in zoom-in duration-300">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-yellow-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {actionType === 'extend' ? 'Extend Promotion' : 
                   actionType === 'upgrade' ? 'Upgrade Promotion' : 
                   'Confirm Promotion'}
                </h3>
                <p className="text-sm text-white/60 mb-4">
                  {actionType === 'extend' ? (
                    <>You are extending the promotion for <span className="text-white font-semibold">"{vehicleTitle}"</span> with the <span className="text-white font-semibold">{selectedPackage.name}</span> package.</>
                  ) : actionType === 'upgrade' ? (
                    <>You are upgrading the promotion for <span className="text-white font-semibold">"{vehicleTitle}"</span> from <span className="text-yellow-400 font-semibold">{currentPackage?.name}</span> to <span className="text-white font-semibold">{selectedPackage.name}</span>.</>
                  ) : (
                    <>You are about to promote <span className="text-white font-semibold">"{vehicleTitle}"</span> with the <span className="text-white font-semibold">{selectedPackage.name}</span> package.</>
                  )}
                </p>
                
                <div className="bg-white/5 rounded-xl p-4 mb-4 text-left space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Action</span>
                    <span className="text-white font-medium capitalize">{actionType}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Package</span>
                    <span className="text-white font-medium">{selectedPackage.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Duration</span>
                    <span className="text-white font-medium">{selectedPackage.duration} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Amount</span>
                    <span className="text-red-500 font-bold">{formatCurrency(selectedPackage.price)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Wallet Balance</span>
                    <span className="text-white font-medium">{formatCurrency(walletBalance)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-white/5">
                    <span className="text-white/40">New Balance</span>
                    <span className="text-green-400 font-bold">{formatCurrency(walletBalance - selectedPackage.price)}</span>
                  </div>
                </div>
                
                <p className="text-xs text-yellow-400/60 mb-4">
                  ⚠️ This promotion cannot be cancelled. No refunds will be issued.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowConfirmation(false)}
                    className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium text-white/60 transition-all hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmPromotion}
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Confirm & Pay'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {success && promotionDetails && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 max-w-md w-full border border-white/10 shadow-2xl animate-in zoom-in duration-300">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {promotionDetails.action === 'extend' ? 'Promotion Extended! 📈' : 
                   promotionDetails.action === 'upgrade' ? 'Promotion Upgraded! ⭐' : 
                   'Promotion Activated! 🚀'}
                </h3>
                <p className="text-sm text-white/60 mb-4">
                  {promotionDetails.action === 'extend' ? (
                    <>Your vehicle promotion has been extended for {promotionDetails.package.duration} more days.</>
                  ) : promotionDetails.action === 'upgrade' ? (
                    <>Your vehicle has been upgraded to the {promotionDetails.package.name} package.</>
                  ) : (
                    <>Your vehicle is now promoted with the {promotionDetails.package.name} package.</>
                  )}
                </p>
                
                <div className="bg-white/5 rounded-xl p-4 mb-4 text-left space-y-1.5">
                  <p className="text-xs text-white/40">Promotion Details</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Package</span>
                    <span className="text-white font-medium">{promotionDetails.package.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Duration</span>
                    <span className="text-white font-medium">{promotionDetails.package.duration} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Amount Paid</span>
                    <span className="text-red-500 font-bold">{formatCurrency(promotionDetails.amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Valid Until</span>
                    <span className="text-white font-medium">
                      {promotionDetails.endDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
                
                <p className="text-xs text-white/40 mb-4">
                  Your vehicle will be visible to more buyers. Check back to track performance!
                </p>
                
                <button
                  onClick={onClose}
                  className="w-full px-4 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}