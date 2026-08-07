// components/admin/Listing.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2,
  Car,
  Calendar,
  Clock,
  TrendingUp,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  MapPin,
  DollarSign,
  Fuel,
  Gauge,
  Settings,
  Trash2,
  Check,
  X,
  Star,
  Zap,
  Users,
  Eye as EyeIcon,
  Edit,
  MoreVertical
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'

interface Vehicle {
  id: string
  user_id: string
  title: string
  brand: string
  model: string
  year: number
  price: number
  mileage: string | null
  fuel_type: string | null
  transmission: string | null
  color: string | null
  description: string | null
  condition: string | null
  category: string | null
  images: string[] | null
  status: string | null
  created_at: string
  updated_at: string
  trim: string | null
  cover_image: string | null
  city: string | null
  state: string | null
  country: string | null
  phone: string | null
  vin: string | null
  engine_type: string | null
  interior_color: string | null
  car_code: string | null
  featured: boolean | null
  sold: boolean | null
  views: number | null
  unavailable: boolean | null
  report_counts: number | null
  Removed: boolean | null
  luxury: boolean | null
}

interface UserProfile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
}

type FilterType = 'all' | 'active' | 'pending' | 'sold' | 'featured' | 'luxury' | 'unavailable' | 'removed'

export default function ListingManagement() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [users, setUsers] = useState<Record<string, UserProfile>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedVehicle, setExpandedVehicle] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    sold: 0,
    featured: 0,
    luxury: 0
  })

  // Fetch vehicles and users
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch all vehicles
        const { data: vehiclesData, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('*')
          .order('created_at', { ascending: false })

        if (vehiclesError) throw vehiclesError

        setVehicles(vehiclesData || [])

        // Fetch user profiles
        const userIds = [...new Set(vehiclesData?.map(v => v.user_id) || [])]
        if (userIds.length > 0) {
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('user_id, email, first_name, last_name, avatar_url')
            .in('user_id', userIds)

          if (!usersError && usersData) {
            const userMap: Record<string, UserProfile> = {}
            usersData.forEach((user: any) => {
              userMap[user.user_id] = {
                id: user.user_id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                avatar_url: user.avatar_url
              }
            })
            setUsers(userMap)
          }
        }

        // Calculate stats
        calculateStats(vehiclesData || [])
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load vehicles')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const calculateStats = (vehiclesData: Vehicle[]) => {
    const active = vehiclesData.filter(v => v.status === 'active' && !v.sold && !v.unavailable && !v.Removed).length
    const pending = vehiclesData.filter(v => v.status === 'pending').length
    const sold = vehiclesData.filter(v => v.sold === true).length
    const featured = vehiclesData.filter(v => v.featured === true).length
    const luxury = vehiclesData.filter(v => v.luxury === true).length

    setStats({
      total: vehiclesData.length,
      active,
      pending,
      sold,
      featured,
      luxury
    })
  }

  const getVehicleStatus = (vehicle: Vehicle) => {
    if (vehicle.Removed) {
      return { label: 'Removed', color: 'text-red-400 bg-red-500/20', icon: XCircle }
    }
    if (vehicle.sold) {
      return { label: 'Sold', color: 'text-purple-400 bg-purple-500/20', icon: CheckCircle }
    }
    if (vehicle.unavailable) {
      return { label: 'Unavailable', color: 'text-gray-400 bg-gray-500/20', icon: XCircle }
    }
    if (vehicle.status === 'pending') {
      return { label: 'Pending', color: 'text-orange-400 bg-orange-500/20', icon: AlertCircle }
    }
    if (vehicle.status === 'active') {
      return { label: 'Active', color: 'text-green-400 bg-green-500/20', icon: CheckCircle }
    }
    return { label: 'Unknown', color: 'text-gray-400 bg-gray-500/20', icon: AlertCircle }
  }

  const handleToggleSold = async (vehicleId: string, sold: boolean) => {
    setActionLoading(vehicleId)
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ sold, updated_at: new Date().toISOString() })
        .eq('id', vehicleId)

      if (error) throw error

      // Refresh data
      const { data: updatedVehicles } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false })

      setVehicles(updatedVehicles || [])
      calculateStats(updatedVehicles || [])
    } catch (err) {
      console.error('Error updating vehicle:', err)
      alert('Failed to update vehicle')
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleFeatured = async (vehicleId: string, featured: boolean) => {
    setActionLoading(vehicleId)
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ featured, updated_at: new Date().toISOString() })
        .eq('id', vehicleId)

      if (error) throw error

      // Refresh data
      const { data: updatedVehicles } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false })

      setVehicles(updatedVehicles || [])
      calculateStats(updatedVehicles || [])
    } catch (err) {
      console.error('Error updating vehicle:', err)
      alert('Failed to update vehicle')
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleLuxury = async (vehicleId: string, luxury: boolean) => {
    setActionLoading(vehicleId)
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ luxury, updated_at: new Date().toISOString() })
        .eq('id', vehicleId)

      if (error) throw error

      // Refresh data
      const { data: updatedVehicles } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false })

      setVehicles(updatedVehicles || [])
      calculateStats(updatedVehicles || [])
    } catch (err) {
      console.error('Error updating vehicle:', err)
      alert('Failed to update vehicle')
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleUnavailable = async (vehicleId: string, unavailable: boolean) => {
    setActionLoading(vehicleId)
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ unavailable, updated_at: new Date().toISOString() })
        .eq('id', vehicleId)

      if (error) throw error

      // Refresh data
      const { data: updatedVehicles } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false })

      setVehicles(updatedVehicles || [])
      calculateStats(updatedVehicles || [])
    } catch (err) {
      console.error('Error updating vehicle:', err)
      alert('Failed to update vehicle')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (vehicleId: string) => {
    if (!confirm('Are you sure you want to permanently delete this vehicle?')) return

    setActionLoading(vehicleId)
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId)

      if (error) throw error

      const { data: updatedVehicles } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false })

      setVehicles(updatedVehicles || [])
      calculateStats(updatedVehicles || [])
    } catch (err) {
      console.error('Error deleting vehicle:', err)
      alert('Failed to delete vehicle')
    } finally {
      setActionLoading(null)
    }
  }

  const getFilteredVehicles = () => {
    let filtered = [...vehicles]

    // Apply filter
    if (filter !== 'all') {
      filtered = filtered.filter(v => {
        switch (filter) {
          case 'active': return v.status === 'active' && !v.sold && !v.unavailable && !v.Removed
          case 'pending': return v.status === 'pending'
          case 'sold': return v.sold === true
          case 'featured': return v.featured === true
          case 'luxury': return v.luxury === true
          case 'unavailable': return v.unavailable === true
          case 'removed': return v.Removed === true
          default: return true
        }
      })
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(v => {
        const user = users[v.user_id]
        const userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase() : ''
        return v.title?.toLowerCase().includes(query) ||
          v.brand?.toLowerCase().includes(query) ||
          v.model?.toLowerCase().includes(query) ||
          `${v.brand} ${v.model}`.toLowerCase().includes(query) ||
          v.car_code?.toLowerCase().includes(query) ||
          userName.includes(query) ||
          user?.email?.toLowerCase().includes(query)
      })
    }

    return filtered
  }

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const filteredVehicles = getFilteredVehicles()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        <span className="text-white/60 ml-3">Loading vehicles...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-white/60">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Car className="w-5 h-5 text-red-400" />
            Vehicle Management
          </h2>
          <p className="text-sm text-white/40">Manage and moderate vehicle listings</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white/60 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 sm:gap-3">
        <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-red-500/20 transition-all">
          <p className="text-[10px] text-white/40">Total</p>
          <p className="text-lg font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-green-500/20 transition-all">
          <p className="text-[10px] text-white/40">Active</p>
          <p className="text-lg font-bold text-green-400">{stats.active}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-orange-500/20 transition-all">
          <p className="text-[10px] text-white/40">Pending</p>
          <p className="text-lg font-bold text-orange-400">{stats.pending}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-purple-500/20 transition-all">
          <p className="text-[10px] text-white/40">Sold</p>
          <p className="text-lg font-bold text-purple-400">{stats.sold}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-yellow-500/20 transition-all">
          <p className="text-[10px] text-white/40">Featured</p>
          <p className="text-lg font-bold text-yellow-400">{stats.featured}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-pink-500/20 transition-all">
          <p className="text-[10px] text-white/40">Luxury</p>
          <p className="text-lg font-bold text-pink-400">{stats.luxury}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide flex-1">
          {(['all', 'active', 'pending', 'sold', 'featured', 'luxury', 'unavailable', 'removed'] as FilterType[]).map((tab) => {
            const isActive = filter === tab
            const count = tab === 'all' ? stats.total :
              tab === 'active' ? stats.active :
              tab === 'pending' ? stats.pending :
              tab === 'sold' ? stats.sold :
              tab === 'featured' ? stats.featured :
              tab === 'luxury' ? stats.luxury :
              tab === 'unavailable' ? vehicles.filter(v => v.unavailable).length :
              tab === 'removed' ? vehicles.filter(v => v.Removed).length :
              0

            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span className="ml-1.5 text-[8px] opacity-60">({count})</span>
              </button>
            )
          })}
        </div>

        <div className="relative flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vehicles..."
            className="w-full sm:w-48 pl-9 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Vehicles List */}
      {filteredVehicles.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-xl border border-white/5">
          <Car className="w-12 h-12 text-white/20 mx-auto mb-2" />
          <p className="text-white/40 text-sm">No vehicles found</p>
          <p className="text-white/20 text-xs mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredVehicles.map((vehicle) => {
            const status = getVehicleStatus(vehicle)
            const StatusIcon = status.icon
            const user = users[vehicle.user_id]
            const isExpanded = expandedVehicle === vehicle.id
            const isActionLoading = actionLoading === vehicle.id
            const coverImage = vehicle.cover_image || vehicle.images?.[0] || null

            return (
              <div
                key={vehicle.id}
                className="bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all overflow-hidden group"
              >
                {/* Main Row */}
                <div className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Image Preview */}
                    <div className="flex-shrink-0 w-full sm:w-24 h-20 rounded-lg overflow-hidden bg-black/50 border border-white/5 relative cursor-pointer" onClick={() => setExpandedVehicle(isExpanded ? null : vehicle.id)}>
                      {coverImage ? (
                        <img
                          src={coverImage}
                          alt={vehicle.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/5">
                          <Car className="w-8 h-8 text-white/20" />
                        </div>
                      )}
                      {vehicle.featured && (
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-yellow-500/90 text-white text-[8px] font-medium rounded flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-white" />
                          Featured
                        </div>
                      )}
                      {vehicle.luxury && (
                        <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-pink-500/90 text-white text-[8px] font-medium rounded">
                          Luxury
                        </div>
                      )}
                    </div>

                    {/* Vehicle Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${status.color}`}>
                              <StatusIcon className="w-3 h-3 inline mr-1" />
                              {status.label}
                            </span>
                            {vehicle.car_code && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-white/60 font-mono">
                                #{vehicle.car_code}
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-medium text-white mt-1 truncate">
                            {vehicle.title || `${vehicle.brand} ${vehicle.model}`}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-white/40">
                            <span>{vehicle.year}</span>
                            <span>•</span>
                            <span className="text-red-400 font-semibold">{formatCurrency(vehicle.price)}</span>
                            {vehicle.mileage && (
                              <>
                                <span>•</span>
                                <span>{vehicle.mileage}</span>
                              </>
                            )}
                            {vehicle.transmission && (
                              <>
                                <span>•</span>
                                <span>{vehicle.transmission}</span>
                              </>
                            )}
                            {vehicle.fuel_type && (
                              <>
                                <span>•</span>
                                <span>{vehicle.fuel_type}</span>
                              </>
                            )}
                          </div>
                          {vehicle.city && (
                            <div className="flex items-center gap-1 text-[10px] text-white/30 mt-0.5">
                              <MapPin className="w-2.5 h-2.5" />
                              <span>{vehicle.city}{vehicle.state ? `, ${vehicle.state}` : ''}</span>
                            </div>
                          )}
                        </div>

                        {/* User Info */}
                        {user && (
                          <div className="flex-shrink-0 flex items-center gap-2 bg-white/5 rounded-lg px-2 py-1">
                            <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center overflow-hidden">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt={user.first_name || ''} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[8px] font-bold text-red-500">
                                  {(user.first_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="text-left">
                              <p className="text-[10px] font-medium text-white/80 truncate max-w-[100px]">
                                {user.first_name || user.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'User'}
                              </p>
                              <p className="text-[8px] text-white/30 truncate max-w-[100px]">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Stats & Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-white/5">
                        <div className="flex items-center gap-3 text-[10px] text-white/40">
                          <div className="flex items-center gap-1">
                            <EyeIcon className="w-3 h-3" />
                            <span>{vehicle.views || 0}</span>
                          </div>
                          {vehicle.report_counts && vehicle.report_counts > 0 && (
                            <div className="flex items-center gap-1 text-red-400">
                              <AlertCircle className="w-3 h-3" />
                              <span>{vehicle.report_counts} reports</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-white/20">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(vehicle.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Toggle Sold */}
                          <button
                            onClick={() => handleToggleSold(vehicle.id, !vehicle.sold)}
                            disabled={isActionLoading}
                            className={`p-1 rounded-lg transition-all hover:scale-110 active:scale-95 disabled:opacity-50 ${
                              vehicle.sold
                                ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                                : 'text-white/30 hover:bg-white/10 hover:text-white/60'
                            }`}
                            title={vehicle.sold ? 'Mark as unsold' : 'Mark as sold'}
                          >
                            {isActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          </button>

                          {/* Toggle Featured */}
                          <button
                            onClick={() => handleToggleFeatured(vehicle.id, !vehicle.featured)}
                            disabled={isActionLoading}
                            className={`p-1 rounded-lg transition-all hover:scale-110 active:scale-95 disabled:opacity-50 ${
                              vehicle.featured
                                ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                                : 'text-white/30 hover:bg-white/10 hover:text-white/60'
                            }`}
                            title={vehicle.featured ? 'Remove featured' : 'Make featured'}
                          >
                            <Star className={`w-3.5 h-3.5 ${vehicle.featured ? 'fill-yellow-400' : ''}`} />
                          </button>

                          {/* Toggle Luxury */}
                          <button
                            onClick={() => handleToggleLuxury(vehicle.id, !vehicle.luxury)}
                            disabled={isActionLoading}
                            className={`p-1 rounded-lg transition-all hover:scale-110 active:scale-95 disabled:opacity-50 ${
                              vehicle.luxury
                                ? 'bg-pink-500/20 text-pink-400 hover:bg-pink-500/30'
                                : 'text-white/30 hover:bg-white/10 hover:text-white/60'
                            }`}
                            title={vehicle.luxury ? 'Remove luxury' : 'Mark as luxury'}
                          >
                            <Zap className={`w-3.5 h-3.5 ${vehicle.luxury ? 'fill-pink-400' : ''}`} />
                          </button>

                          {/* Toggle Unavailable */}
                          <button
                            onClick={() => handleToggleUnavailable(vehicle.id, !vehicle.unavailable)}
                            disabled={isActionLoading}
                            className={`p-1 rounded-lg transition-all hover:scale-110 active:scale-95 disabled:opacity-50 ${
                              vehicle.unavailable
                                ? 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                                : 'text-white/30 hover:bg-white/10 hover:text-white/60'
                            }`}
                            title={vehicle.unavailable ? 'Make available' : 'Mark as unavailable'}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>

                          {/* Expand */}
                          <button
                            onClick={() => setExpandedVehicle(isExpanded ? null : vehicle.id)}
                            className="p-1 rounded-lg text-white/30 hover:bg-white/10 hover:text-white/60 transition-all"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(vehicle.id)}
                            disabled={isActionLoading}
                            className="p-1 rounded-lg text-white/20 hover:bg-red-500/10 hover:text-red-400 transition-all disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-white/5">
                    <div className="pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <p className="text-white/40 mb-1">Vehicle ID</p>
                        <p className="text-white/80 font-mono text-[10px]">{vehicle.id}</p>
                      </div>
                      <div>
                        <p className="text-white/40 mb-1">User ID</p>
                        <p className="text-white/80 font-mono text-[10px]">{vehicle.user_id}</p>
                      </div>
                      <div>
                        <p className="text-white/40 mb-1">Car Code</p>
                        <p className="text-white/80 font-mono">{vehicle.car_code || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-white/40 mb-1">VIN</p>
                        <p className="text-white/80 font-mono text-[10px]">{vehicle.vin || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-white/40 mb-1">Engine</p>
                        <p className="text-white/80">{vehicle.engine_type || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-white/40 mb-1">Transmission</p>
                        <p className="text-white/80">{vehicle.transmission || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-white/40 mb-1">Color</p>
                        <p className="text-white/80">{vehicle.color || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-white/40 mb-1">Interior Color</p>
                        <p className="text-white/80">{vehicle.interior_color || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-white/40 mb-1">Phone</p>
                        <p className="text-white/80">{vehicle.phone || 'N/A'}</p>
                      </div>
                      <div className="col-span-3">
                        <p className="text-white/40 mb-1">Description</p>
                        <p className="text-white/60 text-[10px] leading-relaxed">{vehicle.description || 'No description provided'}</p>
                      </div>
                      {vehicle.images && vehicle.images.length > 0 && (
                        <div className="col-span-3">
                          <p className="text-white/40 mb-1">Images ({vehicle.images.length})</p>
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {vehicle.images.slice(0, 5).map((img, idx) => (
                              <img key={idx} src={img} alt={`Vehicle ${idx + 1}`} className="w-16 h-16 rounded-lg object-cover border border-white/5" />
                            ))}
                            {vehicle.images.length > 5 && (
                              <div className="w-16 h-16 rounded-lg bg-white/5 flex items-center justify-center text-[10px] text-white/40 border border-white/5">
                                +{vehicle.images.length - 5}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}