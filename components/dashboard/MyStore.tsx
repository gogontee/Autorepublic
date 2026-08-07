'use client'

import { useState, useEffect } from 'react'
import { 
  Store, 
  Plus, 
  Edit as EditIcon, 
  Trash2, 
  Eye, 
  AlertCircle,
  Loader2,
  LayoutGrid,
  List,
  X,
  Zap,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import EditVehicle from './Edit'
import Sell from './Sell'
import PromoteVehicle from '@/components/PromoteVehicle'
import FundWallet from '@/components/ads/FundWallet'

interface MyStoreProps {
  userData?: {
    user: any
    profile: any
    session: any
  }
}

interface StoreItem {
  id: string
  title: string
  price: string
  image: string
  status: 'active' | 'pending' | 'sold'
  views: number
  created_at: string
  removed?: boolean
  car_code?: string
  is_promoted?: boolean
  promotion_package?: string | null
  promotion_end_date?: string | null
  featured_until?: string | null
}

interface PromotionStatus {
  isActive: boolean
  packageType: string | null
  endDate: string | null
  isLoading: boolean
}

const statusColors = {
  active: 'bg-green-500/20 text-green-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
  sold: 'bg-gray-500/20 text-gray-400',
}

export default function MyStore({ userData }: MyStoreProps) {
  const { user, profile } = userData || {}
  const router = useRouter()
  const [items, setItems] = useState<StoreItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null)
  const [showSellModal, setShowSellModal] = useState(false)
  const [showPromoteModal, setShowPromoteModal] = useState(false)
  const [showFundWallet, setShowFundWallet] = useState(false)
  const [selectedVehicleForPromotion, setSelectedVehicleForPromotion] = useState<StoreItem | null>(null)
  const [promotionStatuses, setPromotionStatuses] = useState<Record<string, PromotionStatus>>({})
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    sold: 0
  })

  // Fetch user's listings with promotion status
  useEffect(() => {
    const fetchListings = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        // Fetch vehicles
        const { data: vehiclesData, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (vehiclesError) {
          console.error('Error fetching listings:', vehiclesError)
          setError('Failed to load your listings')
          setLoading(false)
          return
        }

        if (vehiclesData) {
          // Fetch promotions for all vehicles
          const vehicleIds = vehiclesData.map((v: any) => v.id)
          
          let promotionsData: any[] = []
          if (vehicleIds.length > 0) {
            const { data, error: promoError } = await supabase
              .from('vehicle_promotions')
              .select('*')
              .in('vehicle_id', vehicleIds)
              .eq('status', 'active')
              .eq('is_active', true)

            if (!promoError) {
              promotionsData = data || []
            }
          }

          // Build promotion status map
          const statusMap: Record<string, PromotionStatus> = {}
          vehiclesData.forEach((vehicle: any) => {
            const promotion = promotionsData.find(p => p.vehicle_id === vehicle.id)
            statusMap[vehicle.id] = {
              isActive: !!promotion,
              packageType: promotion?.package_type || null,
              endDate: promotion?.end_date || null,
              isLoading: false
            }
          })
          setPromotionStatuses(statusMap)

          // Format items
          const formattedItems: StoreItem[] = vehiclesData.map((item: any) => ({
            id: item.id,
            title: item.title || `${item.brand} ${item.model}`,
            price: `₦${item.price?.toLocaleString() || '0'}`,
            image: item.images?.[0] || '/api/placeholder/200/150',
            status: item.status || 'active',
            views: item.views || 0,
            created_at: item.created_at,
            removed: item.removed || false,
            car_code: item.car_code,
            is_promoted: item.is_promoted || false,
            promotion_package: item.promotion_package,
            promotion_end_date: item.promotion_end_date,
            featured_until: item.featured_until,
          }))

          setItems(formattedItems)

          // Calculate stats
          const total = formattedItems.length
          const active = formattedItems.filter(i => i.status === 'active' && !i.removed).length
          const pending = formattedItems.filter(i => i.status === 'pending' && !i.removed).length
          const sold = formattedItems.filter(i => i.status === 'sold' && !i.removed).length

          setStats({ total, active, pending, sold })
        }
      } catch (err) {
        console.error('Error:', err)
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchListings()
  }, [user])

  // Handle delete listing
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return

    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id)

      if (error) {
        console.error('Error deleting listing:', error)
        alert('Failed to delete listing')
        return
      }

      // Remove from local state
      setItems(prev => prev.filter(item => item.id !== id))
      
      // Update stats
      const updatedItems = items.filter(item => item.id !== id)
      const total = updatedItems.length
      const active = updatedItems.filter(i => i.status === 'active' && !i.removed).length
      const pending = updatedItems.filter(i => i.status === 'pending' && !i.removed).length
      const sold = updatedItems.filter(i => i.status === 'sold' && !i.removed).length
      setStats({ total, active, pending, sold })

    } catch (err) {
      console.error('Error:', err)
      alert('An unexpected error occurred')
    }
  }

  // Handle edit listing
  const handleEdit = (id: string) => {
    setEditingVehicleId(id)
  }

  // Handle view listing
  const handleView = (id: string) => {
    router.push(`/vehicles/${id}`)
  }

  // Handle promote vehicle
  const handlePromote = (item: StoreItem) => {
    setSelectedVehicleForPromotion(item)
    setShowPromoteModal(true)
  }

  // Handle promotion success
  const handlePromotionSuccess = () => {
    setShowPromoteModal(false)
    // Refresh the page to reload listings
    window.location.reload()
  }

  // Handle opening wallet from promotion modal
  const handleOpenWallet = () => {
    setShowPromoteModal(false)
    setShowFundWallet(true)
  }

  // Handle fund wallet success
  const handleFundSuccess = () => {
    setShowFundWallet(false)
    // Refresh the page to reload listings and wallet balance
    window.location.reload()
  }

  // Navigate to sell page
  const goToSell = () => {
    router.push('/dashboard/sell')
  }

  // Handle return to store from edit
  const handleReturnToStore = () => {
    // Set flag in localStorage to tell dashboard to switch to store tab
    localStorage.setItem('returnToStore', 'true')
    // Close the edit modal
    setEditingVehicleId(null)
    // Refresh the page to reload listings
    window.location.reload()
  }

  // Handle sell success
  const handleSellSuccess = () => {
    setShowSellModal(false)
    // Refresh the page to reload listings
    window.location.reload()
  }

  // Get promotion icon color based on status
  const getPromotionIconColor = (item: StoreItem) => {
    const status = promotionStatuses[item.id]
    
    // If vehicle is pending, show orange (faint)
    if (item.status === 'pending') {
      return 'text-orange-400/70 hover:text-orange-400'
    }
    
    // If promoted and active, show green (faint)
    if (status?.isActive) {
      return 'text-green-400/70 hover:text-green-400'
    }
    
    // Default - same as other icons (white/40)
    return 'text-white/40 hover:text-white/60'
  }

  // Get promotion tooltip text
  const getPromotionTooltip = (item: StoreItem) => {
    const status = promotionStatuses[item.id]
    
    if (item.status === 'pending') {
      return 'Promotion pending approval'
    }
    
    if (status?.isActive) {
      const endDate = status.endDate ? new Date(status.endDate) : null
      const daysLeft = endDate ? Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0
      return `Active promotion (${status.packageType || 'Promoted'}) - ${daysLeft} days remaining`
    }
    
    return 'Promote this vehicle'
  }

  // If no user is logged in
  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-white/40">Please log in to view your store</p>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto mb-4" />
        <p className="text-white/40">Loading your listings...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Edit Modal */}
      {editingVehicleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-4 sm:p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Edit Vehicle Listing</h2>
              <button
                onClick={() => setEditingVehicleId(null)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>
            <EditVehicle 
              vehicleId={editingVehicleId} 
              onClose={() => setEditingVehicleId(null)}
              onSuccess={() => {
                // Refresh the list
                window.location.reload()
              }}
              onReturnToStore={handleReturnToStore}
            />
          </div>
        </div>
      )}

      {/* Sell Modal */}
      {showSellModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-4 sm:p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">List Your Vehicle</h2>
              <button
                onClick={() => setShowSellModal(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>
            <Sell 
              userData={userData}
            />
          </div>
        </div>
      )}

      {/* Promote Vehicle Modal */}
      {showPromoteModal && selectedVehicleForPromotion && (
        <PromoteVehicle
          vehicleId={selectedVehicleForPromotion.id}
          vehicleTitle={selectedVehicleForPromotion.title}
          vehicleCode={selectedVehicleForPromotion.car_code}
          onClose={() => {
            setShowPromoteModal(false)
            setSelectedVehicleForPromotion(null)
          }}
          onSuccess={handlePromotionSuccess}
          userData={userData}
          onOpenWallet={handleOpenWallet}
        />
      )}

{/* Fund Wallet Modal */}
{showFundWallet && (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
    <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-4 sm:p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl animate-in zoom-in duration-300">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Fund Your Wallet</h2>
        <button
          onClick={() => setShowFundWallet(false)}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-white/60" />
        </button>
      </div>
      <FundWallet 
        userData={userData}
        onClose={() => setShowFundWallet(false)}
        onSuccess={handleFundSuccess}
      />
    </div>
  </div>
)}
      {/* Store Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <p className="text-sm text-white/40">Manage your vehicle listings</p>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex bg-white/5 rounded-xl p-0.5 border border-white/5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-red-500/20 text-red-400' 
                  : 'text-white/40 hover:text-white/60'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-red-500/20 text-red-400' 
                  : 'text-white/40 hover:text-white/60'
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={goToSell}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-500 hover:bg-red-600 rounded-xl text-xs font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            Add New
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Store Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
          <p className="text-[10px] text-white/40">Total Listings</p>
          <p className="text-lg font-bold text-white mt-0.5">{stats.total}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
          <p className="text-[10px] text-white/40">Active</p>
          <p className="text-lg font-bold text-green-400 mt-0.5">{stats.active}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
          <p className="text-[10px] text-white/40">Pending</p>
          <p className="text-lg font-bold text-yellow-400 mt-0.5">{stats.pending}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
          <p className="text-[10px] text-white/40">Sold</p>
          <p className="text-lg font-bold text-gray-400 mt-0.5">{stats.sold}</p>
        </div>
      </div>

      {/* Store Items */}
      {items.length === 0 ? (
        <div className="bg-white/5 rounded-xl border border-white/5 text-center py-12">
          <Store className="w-12 h-12 text-white/20 mx-auto mb-2" />
          <p className="text-white/40 text-sm">No listings yet</p>
          <button
            onClick={() => setShowSellModal(true)}
            className="mt-2 text-xs text-red-500 hover:text-red-400 transition-colors"
          >
            List your first vehicle
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        // Grid View - 3 columns on desktop, 2 on mobile
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {items.map((item) => {
            const promotionStatus = promotionStatuses[item.id]
            const isPromoted = promotionStatus?.isActive || false
            const packageType = promotionStatus?.packageType
            const isPending = item.status === 'pending'
            
            return (
              <div
                key={item.id}
                className="bg-white/5 rounded-xl border border-white/5 overflow-hidden hover:border-white/10 transition-all group"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] bg-black/50 overflow-hidden cursor-pointer" onClick={() => handleView(item.id)}>
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {item.removed && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="px-3 py-1 bg-red-500/90 text-white text-xs font-medium rounded-full">
                        Not Available
                      </span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {/* Promotion Badge */}
                    {isPromoted && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/20 text-green-400 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        {packageType === 'premium' ? 'Premium' : 
                         packageType === 'medium' ? 'Featured' : 
                         'Promoted'}
                      </span>
                    )}
                    {isPending && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-500/20 text-orange-400 flex items-center gap-1">
                        <AlertCircle className="w-2.5 h-2.5" />
                        Pending
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[item.status]}`}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-3">
                  <h3 className="text-sm font-medium text-white truncate">
                    {item.car_code && <span className="text-red-400 mr-1">#{item.car_code}</span>}
                    {item.title}
                  </h3>
                  <p className="text-base font-bold text-red-500 mt-1">{item.price}</p>
                  
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-1 text-xs text-white/40">
                      <Eye className="w-3 h-3" />
                      {item.views}
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleView(item.id)}
                        className="p-1 hover:bg-white/10 rounded-lg transition-colors" 
                        title="View"
                      >
                        <Eye className="w-3.5 h-3.5 text-white/40 hover:text-white/60" />
                      </button>
                      <button 
                        onClick={() => handlePromote(item)}
                        className={`p-1 hover:bg-yellow-500/10 rounded-lg transition-colors relative group`}
                        title={getPromotionTooltip(item)}
                      >
                        <Zap className={`w-3.5 h-3.5 ${getPromotionIconColor(item)}`} />
                        {isPromoted && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        )}
                        {isPending && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-full animate-pulse"></span>
                        )}
                      </button>
                      <button 
                        onClick={() => handleEdit(item.id)}
                        className="p-1 hover:bg-white/10 rounded-lg transition-colors" 
                        title="Edit"
                      >
                        <EditIcon className="w-3.5 h-3.5 text-white/40 hover:text-white/60" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-1 hover:bg-red-500/10 rounded-lg transition-colors" 
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        // List View
        <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-12 gap-3 p-3 border-b border-white/5 text-[10px] text-white/40 font-medium">
            <div className="col-span-6 sm:col-span-4">Vehicle</div>
            <div className="hidden sm:block sm:col-span-2">Status</div>
            <div className="col-span-3 sm:col-span-2">Price</div>
            <div className="col-span-2 sm:col-span-2">Views</div>
            <div className="col-span-1 sm:col-span-2 text-right">Actions</div>
          </div>

          {items.map((item) => {
            const promotionStatus = promotionStatuses[item.id]
            const isPromoted = promotionStatus?.isActive || false
            const packageType = promotionStatus?.packageType
            const isPending = item.status === 'pending'
            
            return (
              <div key={item.id} className="grid grid-cols-12 gap-3 p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors items-center">
                {/* Vehicle Info */}
                <div className="col-span-6 sm:col-span-4 flex items-center gap-2 cursor-pointer" onClick={() => handleView(item.id)}>
                  <div className="relative w-10 h-10 rounded-lg bg-white/5 flex-shrink-0 overflow-hidden">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    {item.removed && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-[8px] text-white font-medium">N/A</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate">
                      {item.car_code && <span className="text-red-400 mr-1">#{item.car_code}</span>}
                      {item.title}
                    </p>
                    <p className="text-[10px] text-white/40">
                      {new Date(item.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="hidden sm:block sm:col-span-2">
                  <div className="flex flex-wrap gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[item.status]}`}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                    {isPromoted && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/20 text-green-400 flex items-center gap-1">
                        <Sparkles className="w-2 h-2" />
                        {packageType === 'premium' ? 'Premium' : 
                         packageType === 'medium' ? 'Featured' : 
                         'Promoted'}
                      </span>
                    )}
                    {isPending && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-500/20 text-orange-400">
                        Pending
                      </span>
                    )}
                    {item.removed && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/20 text-red-400">
                        Not Available
                      </span>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="col-span-3 sm:col-span-2">
                  <p className="text-xs font-semibold text-red-500">{item.price}</p>
                </div>

                {/* Views */}
                <div className="col-span-2 sm:col-span-2 flex items-center gap-1">
                  <Eye className="w-3 h-3 text-white/40" />
                  <span className="text-xs text-white/60">{item.views}</span>
                </div>

                {/* Actions */}
                <div className="col-span-1 sm:col-span-2 flex items-center justify-end gap-1">
                  <button 
                    onClick={() => handleView(item.id)}
                    className="p-1 hover:bg-white/10 rounded-lg transition-colors" 
                    title="View"
                  >
                    <Eye className="w-3.5 h-3.5 text-white/40 hover:text-white/60" />
                  </button>
                  <button 
                    onClick={() => handlePromote(item)}
                    className={`p-1 hover:bg-yellow-500/10 rounded-lg transition-colors relative group`}
                    title={getPromotionTooltip(item)}
                  >
                    <Zap className={`w-3.5 h-3.5 ${getPromotionIconColor(item)}`} />
                    {isPromoted && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    )}
                    {isPending && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-full animate-pulse"></span>
                    )}
                  </button>
                  <button 
                    onClick={() => handleEdit(item.id)}
                    className="p-1 hover:bg-white/10 rounded-lg transition-colors" 
                    title="Edit"
                  >
                    <EditIcon className="w-3.5 h-3.5 text-white/40 hover:text-white/60" />
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-1 hover:bg-red-500/10 rounded-lg transition-colors" 
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-500" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}