'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  MapPin, 
  Fuel, 
  Gauge, 
  Calendar, 
  Car, 
  Phone,
  Mail,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  Loader2,
  Shield,
  Star,
  Share2,
  Heart,
  Tag,
  Info,
  CheckCircle,
  Clock,
  Hash,
  Palette,
  Gauge as GaugeIcon,
  Eye,
  User,
  AlertTriangle,
  Flag,
  ChevronDown,
  ChevronUp,
  Crown,
  Sparkles,
  Flame
} from 'lucide-react'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import BuyerNotice from '@/components/BuyerNotice'
import CarCard from '@/components/CarCard'
import Ads from '@/components/Ads'
import VehicleRating from '@/components/VehicleRating'
import RateVehicleButton from '@/components/RateVehicleButton'
import { supabase } from '@/lib/supabase/client'

interface Vehicle {
  id: string
  user_id: string
  title: string
  brand: string
  model: string
  year: number
  price: number
  mileage: string
  fuel_type: string
  transmission: string
  color: string
  interior_color: string
  engine_type: string
  vin: string
  car_code: string
  description: string
  condition: string
  category: string
  images: string[]
  cover_image: string
  status: string
  created_at: string
  updated_at: string
  trim: string
  city: string
  state: string
  country: string
  phone: string
  views?: number
  unavailable?: boolean
  Removed?: boolean
  report_counts?: number
  is_promoted?: boolean
  promotion_package?: string | null
}

interface SellerProfile {
  avatar_url: string | null
  first_name: string
  last_name: string
  full_name: string
}

// Promotion priority for sorting
const PROMOTION_PRIORITY = {
  premium: 3,
  medium: 2,
  basic: 1,
  none: 0
}

function VehicleDetailContent() {
  const params = useParams()
  const router = useRouter()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [similarVehicles, setSimilarVehicles] = useState<any[]>([])
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingSimilar, setLoadingSimilar] = useState(true)
  const [loadingSeller, setLoadingSeller] = useState(true)
  const [error, setError] = useState('')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showContactModal, setShowContactModal] = useState(false)
  const [showShareTooltip, setShowShareTooltip] = useState(false)
  const [isInGarage, setIsInGarage] = useState(false)
  const [garageLoading, setGarageLoading] = useState(false)
  
  // Report and unavailable states
  const [showUnavailableModal, setShowUnavailableModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [unavailableLoading, setUnavailableLoading] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  
  // Description expand/collapse state
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [descriptionRef, setDescriptionRef] = useState<HTMLDivElement | null>(null)
  const [needsExpand, setNeedsExpand] = useState(false)
  
  // Rating refresh state
  const [ratingKey, setRatingKey] = useState(0)
  const [hasRatings, setHasRatings] = useState<boolean | null>(null)
  
  // Use a ref to track if view has been counted
  const viewTrackedRef = useRef(false)
  const isTrackingRef = useRef(false)

  // Get current user
  const [currentUser, setCurrentUser] = useState<any>(null)

  const vehicleId = params?.id as string

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setCurrentUser(session.user)
      }
    }
    getCurrentUser()
  }, [])

  // Fetch vehicle data
  useEffect(() => {
    const fetchVehicle = async () => {
      if (!vehicleId) return

      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select(`
            *,
            vehicle_promotions!left (
              id,
              package_type,
              end_date,
              is_active,
              status
            )
          `)
          .eq('id', vehicleId)
          .single()

        if (error) {
          setError('Vehicle not found')
          setLoading(false)
          return
        }

        const activePromotion = data.vehicle_promotions?.find(
          (p: any) => p.is_active === true && p.status === 'active'
        )

        const vehicleWithPromotion = {
          ...data,
          is_promoted: !!activePromotion,
          promotion_package: activePromotion?.package_type || null
        }

        setVehicle(vehicleWithPromotion)
        setLoading(false)

        if (data) {
          fetchSimilarVehicles(data)
        }

        await checkIfInGarage()

        if (data?.user_id) {
          fetchSellerProfile(data.user_id)
        }

        await checkIfHasRatings()
      } catch (err) {
        console.error('Error fetching vehicle:', err)
        setError('An error occurred while fetching vehicle details')
        setLoading(false)
      }
    }

    fetchVehicle()
  }, [vehicleId])

  // Check if vehicle has ratings
  const checkIfHasRatings = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicle_ratings')
        .select('id', { count: 'exact' })
        .eq('vehicle_id', vehicleId)

      if (error) {
        console.error('Error checking ratings:', error)
        setHasRatings(false)
        return
      }

      setHasRatings(data && data.length > 0)
    } catch (error) {
      console.error('Error checking ratings:', error)
      setHasRatings(false)
    }
  }

  // Check if description needs expand button
  useEffect(() => {
    if (descriptionRef) {
      const contentHeight = descriptionRef.scrollHeight
      const maxHeight = 120
      setNeedsExpand(contentHeight > maxHeight)
    }
  }, [descriptionRef, vehicle?.description])

  // Fetch seller profile
  const fetchSellerProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('avatar_url, first_name, last_name')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('Error fetching seller profile:', error)
        setLoadingSeller(false)
        return
      }

      if (data) {
        setSellerProfile({
          avatar_url: data.avatar_url || null,
          first_name: data.first_name || 'User',
          last_name: data.last_name || '',
          full_name: `${data.first_name || 'User'} ${data.last_name || ''}`.trim()
        })
      }
      setLoadingSeller(false)
    } catch (err) {
      console.error('Error:', err)
      setLoadingSeller(false)
    }
  }

  // Check if vehicle is in user's garage
  const checkIfInGarage = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      const { data, error } = await supabase
        .from('garage')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('vehicle_id', vehicleId)
        .maybeSingle()

      if (!error && data) {
        setIsInGarage(true)
      }
    } catch (error) {
      console.error('Error checking garage:', error)
    }
  }

  // Handle add to garage
  const handleGarageToggle = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/auth/login')
        return
      }

      setGarageLoading(true)

      if (isInGarage) {
        const { error } = await supabase
          .from('garage')
          .delete()
          .eq('user_id', session.user.id)
          .eq('vehicle_id', vehicleId)

        if (error) {
          console.error('Error removing from garage:', error)
          alert('Failed to remove from garage')
          setGarageLoading(false)
          return
        }

        setIsInGarage(false)
        setGarageLoading(false)
        alert('Vehicle removed from your garage')
      } else {
        const { data: existing, error: checkError } = await supabase
          .from('garage')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('vehicle_id', vehicleId)
          .maybeSingle()

        if (checkError) {
          console.error('Error checking garage:', checkError)
          setGarageLoading(false)
          return
        }

        if (existing) {
          setIsInGarage(true)
          setGarageLoading(false)
          return
        }

        const { error: insertError } = await supabase
          .from('garage')
          .insert({
            user_id: session.user.id,
            vehicle_id: vehicleId
          })

        if (insertError) {
          console.error('Error adding to garage:', insertError)
          alert('Failed to add to garage. Please try again.')
          setGarageLoading(false)
          return
        }

        setIsInGarage(true)
        setGarageLoading(false)
        alert('Vehicle added to your garage! 🎉')
      }

    } catch (error) {
      console.error('Error:', error)
      alert('An unexpected error occurred')
      setGarageLoading(false)
    }
  }

  // Track view when vehicle loads - only once
  useEffect(() => {
    const trackView = async () => {
      if (viewTrackedRef.current || isTrackingRef.current || !vehicleId) {
        return
      }

      const userAgent = typeof window !== 'undefined' ? navigator.userAgent.toLowerCase() : ''
      const isBot = /bot|crawler|spider|crawling|googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebot|twitterbot/i.test(userAgent)
      
      if (isBot) {
        viewTrackedRef.current = true
        return
      }

      try {
        isTrackingRef.current = true
        
        const { data: existingView, error: checkError } = await supabase
          .from('vehicle_views')
          .select('id, viewed_at')
          .eq('vehicle_id', vehicleId)
          .gte('viewed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .limit(1)
          .maybeSingle()

        if (checkError) {
          console.error('Error checking existing view:', checkError)
        }

        if (existingView) {
          viewTrackedRef.current = true
          isTrackingRef.current = false
          return
        }

        const { error } = await supabase.rpc('increment_vehicle_views', { 
          vehicle_id: vehicleId 
        })

        if (error) {
          console.error('Error incrementing views:', error)
        } else {
          setVehicle(prev => prev ? { ...prev, views: (prev.views || 0) + 1 } : null)
          viewTrackedRef.current = true
        }
      } catch (error) {
        console.error('Error tracking view:', error)
      } finally {
        isTrackingRef.current = false
      }
    }

    if (vehicle && !viewTrackedRef.current) {
      const timer = setTimeout(() => {
        trackView()
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [vehicle, vehicleId])

  // Fetch similar vehicles with promotion priority
  const fetchSimilarVehicles = async (currentVehicle: Vehicle) => {
    try {
      setLoadingSimilar(true)

      let query = supabase
        .from('vehicles')
        .select(`
          *,
          vehicle_promotions!left (
            id,
            package_type,
            end_date,
            is_active,
            status
          )
        `)
        .eq('status', 'active')
        .neq('id', currentVehicle.id)
        .limit(12)

      if (currentVehicle.model) {
        query = query.eq('model', currentVehicle.model)
      } else if (currentVehicle.brand) {
        query = query.eq('brand', currentVehicle.brand)
      }

      let { data, error } = await query

      if (error) {
        console.error('Error fetching similar vehicles:', error)
        setLoadingSimilar(false)
        return
      }

      if (!data || data.length < 4) {
        const priceRange = currentVehicle.price * 0.3
        const minPrice = currentVehicle.price - priceRange
        const maxPrice = currentVehicle.price + priceRange
        const yearRange = 3

        const { data: fallbackData, error: fallbackError } = await supabase
          .from('vehicles')
          .select(`
            *,
            vehicle_promotions!left (
              id,
              package_type,
              end_date,
              is_active,
              status
            )
          `)
          .eq('status', 'active')
          .neq('id', currentVehicle.id)
          .or(`and(price.gte.${minPrice},price.lte.${maxPrice}),and(year.gte.${currentVehicle.year - yearRange},year.lte.${currentVehicle.year + yearRange})`)
          .limit(12)

        if (!fallbackError && fallbackData) {
          const existingIds = new Set(data?.map(v => v.id) || [])
          const combined = [...(data || []), ...(fallbackData || []).filter(v => !existingIds.has(v.id))]
          data = combined.slice(0, 12)
        }
      }

      if (!data || data.length < 4) {
        const { data: recentData, error: recentError } = await supabase
          .from('vehicles')
          .select(`
            *,
            vehicle_promotions!left (
              id,
              package_type,
              end_date,
              is_active,
              status
            )
          `)
          .eq('status', 'active')
          .neq('id', currentVehicle.id)
          .order('created_at', { ascending: false })
          .limit(12)

        if (!recentError && recentData) {
          const existingIds = new Set(data?.map(v => v.id) || [])
          const combined = [...(data || []), ...(recentData || []).filter(v => !existingIds.has(v.id))]
          data = combined.slice(0, 12)
        }
      }

      const transformedData = (data || []).map((vehicle: any) => {
        const activePromotion = vehicle.vehicle_promotions?.find(
          (p: any) => p.is_active === true && p.status === 'active'
        )

        return {
          ...vehicle,
          location: formatLocation(vehicle.city, vehicle.country),
          conditionLabel: getConditionLabel(vehicle.condition),
          is_promoted: !!activePromotion,
          promotion_package: activePromotion?.package_type || null,
          promotion_priority: activePromotion?.package_type 
            ? PROMOTION_PRIORITY[activePromotion.package_type as keyof typeof PROMOTION_PRIORITY] || 0
            : 0
        }
      })

      transformedData.sort((a, b) => {
        if (a.promotion_priority !== b.promotion_priority) {
          return b.promotion_priority - a.promotion_priority
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })

      const finalData = transformedData.slice(0, 8)
      setSimilarVehicles(finalData)
      setLoadingSimilar(false)
    } catch (err) {
      console.error('Error fetching similar vehicles:', err)
      setLoadingSimilar(false)
    }
  }

  // Format location
  const formatLocation = (city: string, country: string) => {
    if (!city && !country) return 'Location Unknown'
    
    let location = ''
    if (city) {
      const cityFirstWord = city.split(' ')[0]
      location += cityFirstWord
    }
    
    if (country) {
      const countryAbbr = country.slice(0, 2).toUpperCase()
      location += location ? `, ${countryAbbr}` : countryAbbr
    }
    
    return location || 'Location Unknown'
  }

  // Get condition label
  const getConditionLabel = (condition: string) => {
    if (!condition) return 'Used'
    const cond = condition.toLowerCase()
    if (cond === 'brand new') return 'New'
    if (cond === 'foreign used') return 'F-Used'
    if (cond === 'local used') return 'L-Used'
    return condition.charAt(0).toUpperCase() + condition.slice(1)
  }

  // Navigation functions for images
  const nextImage = () => {
    if (vehicle?.images) {
      setCurrentImageIndex((prev) => (prev + 1) % vehicle.images.length)
    }
  }

  const prevImage = () => {
    if (vehicle?.images) {
      setCurrentImageIndex((prev) => (prev - 1 + vehicle.images.length) % vehicle.images.length)
    }
  }

  // Handle share
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: vehicle?.title,
        text: `Check out this ${vehicle?.brand} ${vehicle?.model}`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      setShowShareTooltip(true)
      setTimeout(() => setShowShareTooltip(false), 2000)
    }
  }

  // Handle contact
  const handleContact = () => {
    setShowContactModal(true)
  }

  // Handle Mark as Unavailable
  const handleMarkUnavailable = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/auth/login')
        return
      }

      setUnavailableLoading(true)
      
      const { error } = await supabase
        .from('vehicles')
        .update({ unavailable: true })
        .eq('id', vehicleId)

      if (error) {
        console.error('Error marking vehicle as unavailable:', error)
        alert('Failed to mark vehicle as unavailable. Please try again.')
        setUnavailableLoading(false)
        return
      }

      setVehicle(prev => prev ? { ...prev, unavailable: true } : null)
      setShowUnavailableModal(false)
      setUnavailableLoading(false)
      setShowSuccessMessage(true)
      
      setTimeout(() => {
        setShowSuccessMessage(false)
      }, 5000)
    } catch (error) {
      console.error('Error:', error)
      alert('An unexpected error occurred')
      setUnavailableLoading(false)
    }
  }

  // Handle Report Abuse
  const handleReportAbuse = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/auth/login')
        return
      }

      if (!reportReason.trim()) {
        alert('Please provide a reason for reporting')
        return
      }

      setIsSubmitting(true)

      const { error } = await supabase
        .from('vehicle_reports')
        .insert({
          vehicle_id: vehicleId,
          reporter_id: session.user.id,
          reason: reportReason,
          description: reportDescription || null
        })

      if (error) {
        if (error.code === '23505') {
          alert('You have already reported this vehicle.')
        } else {
          console.error('Error reporting vehicle:', error)
          alert('Failed to submit report. Please try again.')
        }
        setIsSubmitting(false)
        return
      }

      setVehicle(prev => prev ? { ...prev, report_counts: (prev.report_counts || 0) + 1 } : null)
      setShowReportModal(false)
      setReportReason('')
      setReportDescription('')
      setIsSubmitting(false)
      alert('Thank you for your report. We will review it shortly.')
    } catch (error) {
      console.error('Error:', error)
      alert('An unexpected error occurred')
      setIsSubmitting(false)
    }
  }

  // Get all images
  const getImages = () => {
    if (!vehicle) return []
    if (vehicle.images && vehicle.images.length > 0) {
      return vehicle.images
    }
    return vehicle.cover_image ? [vehicle.cover_image] : ['/api/placeholder/800/600']
  }

  const images = getImages()

  // Get condition badge color
  const getConditionBadge = (condition: string) => {
    if (!condition) return { label: 'Used', color: 'bg-blue-500/80' }
    const cond = condition.toLowerCase()
    if (cond === 'brand new') return { label: 'Brand New', color: 'bg-green-500/80' }
    if (cond === 'foreign used') return { label: 'Foreign Used', color: 'bg-yellow-500/80' }
    if (cond === 'local used') return { label: 'Local Used', color: 'bg-blue-500/80' }
    return { label: condition, color: 'bg-gray-500/80' }
  }

  // Get seller initials
  const getSellerInitials = () => {
    if (sellerProfile?.first_name && sellerProfile?.last_name) {
      return `${sellerProfile.first_name[0]}${sellerProfile.last_name[0]}`.toUpperCase()
    }
    if (sellerProfile?.first_name) {
      return sellerProfile.first_name[0].toUpperCase()
    }
    return 'U'
  }

  // Get seller display name
  const getSellerDisplayName = () => {
    if (sellerProfile?.full_name) {
      return sellerProfile.full_name
    }
    if (sellerProfile?.first_name) {
      return sellerProfile.first_name
    }
    return 'User'
  }

  // Toggle description expand
  const toggleDescription = () => {
    setIsDescriptionExpanded(!isDescriptionExpanded)
  }

  // Refresh ratings
  const refreshRatings = async () => {
    setRatingKey(prev => prev + 1)
    await checkIfHasRatings()
  }

  // Check if current user is the vehicle owner
  const isOwner = currentUser?.id === vehicle?.user_id

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
          <span className="text-white/60 ml-3">Loading vehicle details...</span>
        </div>
        <BottomNav />
      </div>
    )
  }

  // Error state
  if (error || !vehicle) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-white/60">{error || 'Vehicle not found'}</p>
            <Link href="/vehicles" className="inline-block mt-4 px-6 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-medium text-white transition-colors">
              Browse Vehicles
            </Link>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  const conditionBadge = getConditionBadge(vehicle.condition)
  const isRemoved = vehicle.Removed === true
  const isUnavailable = vehicle.unavailable === true
  const isPromoted = vehicle.is_promoted || false
  const promotionPackage = vehicle.promotion_package

  // Get promotion badge info
  const getPromotionBadge = () => {
    if (!isPromoted || !promotionPackage) return null
    
    const badges = {
      premium: { 
        icon: Crown, 
        label: 'Premium', 
        color: 'text-white bg-white/15 border-white/30'
      },
      medium: { 
        icon: Sparkles, 
        label: 'Featured', 
        color: 'text-white/90 bg-white/10 border-white/25'
      },
      basic: { 
        icon: Flame, 
        label: 'Boosted', 
        color: 'text-white/80 bg-white/8 border-white/20'
      }
    }
    
    return badges[promotionPackage as keyof typeof badges] || null
  }

  const promotionBadge = getPromotionBadge()

  // Format description HTML
  const formattedDescription = vehicle.description 
    ? vehicle.description
        .replace(/<p>/g, '<p class="mb-2">')
        .replace(/<br\s*\/?>/g, '<br />')
    : 'No description available.'

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      {/* Ads Section - Below Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <Ads className="rounded-2xl overflow-hidden shadow-lg shadow-red-500/5" />
      </div>

      <main className="pb-24 md:pb-6">
        {/* Back Button */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 sm:gap-2 text-white/60 hover:text-white transition-colors group"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs sm:text-sm">Back</span>
          </button>
        </div>

        {/* Vehicle Details */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Left Column - Images & Buyer Notice */}
            <div>
              {/* Main Image */}
              <div className="relative bg-white/5 rounded-2xl overflow-hidden aspect-[4/3] border border-white/5">
                {isRemoved && (
                  <div className="absolute inset-0 bg-black/70 z-10 flex items-center justify-center">
                    <div className="text-center">
                      <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-3" />
                      <p className="text-white font-bold text-xl">Not Available</p>
                      <p className="text-white/60 text-sm">This vehicle is no longer available</p>
                    </div>
                  </div>
                )}
                <img
                  src={images[currentImageIndex]}
                  alt={vehicle.title}
                  className="w-full h-full object-cover"
                />
                
                {/* Promotion Badge on Image */}
                {isPromoted && promotionBadge && !isRemoved && (
                  <div className={`absolute top-4 left-4 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium ${promotionBadge.color} border backdrop-blur-sm shadow-lg`}>
                    <promotionBadge.icon className="w-3 h-3" />
                    {promotionBadge.label}
                  </div>
                )}
                
                {/* Image Counter */}
                {images.length > 1 && !isRemoved && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/70 backdrop-blur-sm rounded-full text-xs text-white/60">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                )}

                {/* Navigation Arrows */}
                {images.length > 1 && !isRemoved && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-black/50 backdrop-blur-sm hover:bg-black/70 rounded-full text-white transition-all hover:scale-110"
                    >
                      <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-black/50 backdrop-blur-sm hover:bg-black/70 rounded-full text-white transition-all hover:scale-110"
                    >
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </>
                )}

                {/* Condition Badge - Top Left (if no promotion) */}
                {!isPromoted && !isRemoved && (
                  <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium text-white backdrop-blur-sm ${conditionBadge.color}`}>
                    {conditionBadge.label}
                  </div>
                )}

                {/* Car Code Badge - Bottom Right */}
                {vehicle.car_code && !isRemoved && (
                  <div className="absolute bottom-4 right-4 px-3 py-1 bg-red-500/90 backdrop-blur-sm rounded-full text-xs font-medium text-white flex items-center gap-1.5 shadow-lg shadow-black/30">
                    <Tag className="w-3 h-3" />
                    {vehicle.car_code}
                  </div>
                )}

                {/* Share Button - Top Right */}
                {!isRemoved && (
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={handleShare}
                      className="p-2 bg-black/50 backdrop-blur-sm hover:bg-black/70 rounded-full text-white transition-all hover:scale-110 relative"
                    >
                      <Share2 className="w-4 h-4" />
                      {showShareTooltip && (
                        <span className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded whitespace-nowrap">
                          Link copied!
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && !isRemoved && (
                <div className="flex gap-1.5 sm:gap-2 mt-2 sm:mt-3 overflow-x-auto pb-1 scrollbar-hide">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentImageIndex 
                          ? 'border-red-500' 
                          : 'border-transparent hover:border-white/30'
                      }`}
                    >
                      <img src={img} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Buyer Notice - Desktop */}
              <div className="hidden lg:block mt-4">
                <BuyerNotice variant="inline" />
              </div>

              {/* Mark as Unavailable & Report Abuse - Desktop */}
              {!isRemoved && (
                <div className="hidden lg:flex gap-3 mt-4">
                  <button
                    onClick={() => setShowUnavailableModal(true)}
                    disabled={isUnavailable}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium text-white transition-all flex items-center justify-center gap-2 ${
                      isUnavailable
                        ? 'bg-yellow-500/30 cursor-not-allowed opacity-50'
                        : 'bg-yellow-500 hover:bg-yellow-600 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-yellow-500/25'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    {isUnavailable ? 'Unavailable' : 'Mark as Unavailable'}
                  </button>
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="flex-1 py-2.5 px-4 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-red-500/25 flex items-center justify-center gap-2"
                  >
                    <Flag className="w-4 h-4" />
                    Report Abuse
                  </button>
                </div>
              )}
            </div>

            {/* Right Column - Details */}
            <div>
              {/* Title & Price */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white leading-tight flex-1">
                  {vehicle.title}
                  {isRemoved && (
                    <span className="ml-2 text-xs font-medium text-red-500 bg-red-500/20 px-2 py-0.5 rounded-full">
                      Not Available
                    </span>
                  )}
                </h1>
                {!isRemoved && (
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-500 whitespace-nowrap">
                    ${vehicle.price.toLocaleString()}
                  </p>
                )}
              </div>

              {/* Brand & Model */}
              <div className="mb-2">
                <p className="text-xs sm:text-sm text-white/40">
                  {vehicle.brand} • {vehicle.model} • {vehicle.year}
                </p>
              </div>

              {/* Rating Section */}
              <div className="flex items-center justify-between mb-3 py-2 border-t border-b border-white/5">
                <VehicleRating 
                  key={ratingKey}
                  vehicleId={vehicleId} 
                  showLabel={true}
                  starSize="md"
                />
                
                {!isRemoved && !isUnavailable && (
                  <RateVehicleButton
                    vehicleId={vehicleId}
                    vehicleTitle={vehicle.title}
                    variant="compact"
                    onRatingUpdate={refreshRatings}
                  />
                )}
              </div>

              {/* Views & Report Count - Only visible to owner */}
              <div className="flex items-center gap-2 text-xs text-white/40 mb-3">
                <Eye className="w-3.5 h-3.5 text-red-500" />
                <span>{vehicle.views || 0} views</span>
                {isOwner && vehicle.report_counts && vehicle.report_counts > 0 && (
                  <span className="ml-2 flex items-center gap-1 text-yellow-500/60">
                    <Flag className="w-3 h-3" />
                    {vehicle.report_counts} reports
                  </span>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 p-3 sm:p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="text-center">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 mx-auto mb-1" />
                  <p className="text-[10px] sm:text-xs text-white/40">Year</p>
                  <p className="text-xs sm:text-sm font-medium text-white">{vehicle.year}</p>
                </div>
                <div className="text-center">
                  <Gauge className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 mx-auto mb-1" />
                  <p className="text-[10px] sm:text-xs text-white/40">Mileage</p>
                  <p className="text-xs sm:text-sm font-medium text-white">{vehicle.mileage || 'N/A'}</p>
                </div>
                <div className="text-center">
                  <Fuel className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 mx-auto mb-1" />
                  <p className="text-[10px] sm:text-xs text-white/40">Fuel</p>
                  <p className="text-xs sm:text-sm font-medium text-white capitalize">{vehicle.fuel_type || 'N/A'}</p>
                </div>
              </div>

              {/* More Specs */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6 p-3 sm:p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="text-center">
                  <Car className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 mx-auto mb-1" />
                  <p className="text-[10px] sm:text-xs text-white/40">Transmission</p>
                  <p className="text-[10px] sm:text-sm font-medium text-white capitalize truncate">{vehicle.transmission || 'N/A'}</p>
                </div>
                <div className="text-center">
                  <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 mx-auto mb-1" />
                  <p className="text-[10px] sm:text-xs text-white/40">Category</p>
                  <p className="text-[10px] sm:text-sm font-medium text-white capitalize truncate">{vehicle.category || 'N/A'}</p>
                </div>
                <div className="text-center">
                  <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 mx-auto mb-1" />
                  <p className="text-[10px] sm:text-xs text-white/40">Trim</p>
                  <p className="text-[10px] sm:text-sm font-medium text-white truncate">{vehicle.trim || 'N/A'}</p>
                </div>
              </div>

              {/* Vehicle Specifications */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
                {vehicle.engine_type && (
                  <div className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/5 hover:border-white/10 transition-all">
                    <div className="flex items-center gap-2 mb-1">
                      <GaugeIcon className="w-3.5 h-3.5 text-red-400" />
                      <p className="text-[10px] sm:text-xs text-white/40 font-medium">Engine</p>
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-white">{vehicle.engine_type}</p>
                  </div>
                )}
                
                {vehicle.vin && (
                  <div className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/5 hover:border-white/10 transition-all col-span-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Hash className="w-3.5 h-3.5 text-red-400" />
                      <p className="text-[10px] sm:text-xs text-white/40 font-medium">VIN</p>
                    </div>
                    <p className="text-[10px] sm:text-xs font-mono text-white/80 break-all">{vehicle.vin}</p>
                  </div>
                )}
              </div>

              {/* Color & Tag Row */}
              <div className="grid grid-cols-3 gap-2 mb-4 sm:mb-6">
                {vehicle.color && (
                  <div className="bg-white/5 rounded-xl p-2 sm:p-3 border border-white/5 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-0.5">
                      <div 
                        className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border border-white/10 flex-shrink-0"
                        style={{ backgroundColor: vehicle.color.toLowerCase() }}
                      />
                      <p className="text-[8px] sm:text-[10px] text-white/40 font-medium">Exterior</p>
                    </div>
                    <p className="text-[10px] sm:text-xs font-medium text-white truncate">{vehicle.color}</p>
                  </div>
                )}
                
                {vehicle.interior_color && (
                  <div className="bg-white/5 rounded-xl p-2 sm:p-3 border border-white/5 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-0.5">
                      <div 
                        className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border border-white/10 flex-shrink-0"
                        style={{ backgroundColor: vehicle.interior_color.toLowerCase() }}
                      />
                      <p className="text-[8px] sm:text-[10px] text-white/40 font-medium">Interior</p>
                    </div>
                    <p className="text-[10px] sm:text-xs font-medium text-white truncate">{vehicle.interior_color}</p>
                  </div>
                )}
                
                {vehicle.car_code && (
                  <div className="bg-white/5 rounded-xl p-2 sm:p-3 border border-white/5 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-0.5">
                      <Tag className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-400" />
                      <p className="text-[8px] sm:text-[10px] text-white/40 font-medium">Car Tag</p>
                    </div>
                    <p className="text-[10px] sm:text-xs font-mono text-red-400 truncate">{vehicle.car_code}</p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mb-4 sm:mb-6">
                <h3 className="text-xs sm:text-sm font-medium text-white/60 mb-1.5 sm:mb-2">Description</h3>
                <div className="relative">
                  <div 
                    ref={setDescriptionRef}
                    className={`text-xs sm:text-sm text-white/70 leading-relaxed prose prose-invert max-w-none [&_strong]:text-white [&_em]:text-white/80 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_blockquote]:border-l-2 [&_blockquote]:border-red-500 [&_blockquote]:pl-3 [&_blockquote]:text-white/60 [&_a]:text-red-400 [&_a]:hover:text-red-300 ${
                        !isDescriptionExpanded ? 'max-h-[120px] overflow-hidden' : ''
                      }`}
                    style={{ 
                      maskImage: !isDescriptionExpanded ? 'linear-gradient(to bottom, black 60%, transparent 100%)' : 'none',
                      WebkitMaskImage: !isDescriptionExpanded ? 'linear-gradient(to bottom, black 60%, transparent 100%)' : 'none'
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: formattedDescription
                    }}
                  />
                  
                  {vehicle?.description && vehicle.description.length > 100 && (
                    <button
                      onClick={toggleDescription}
                      className="mt-2 flex items-center gap-1 text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
                    >
                      {isDescriptionExpanded ? (
                        <>
                          Show Less
                          <ChevronUp className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          Read More
                          <ChevronDown className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Location */}
              {vehicle.city && !isRemoved && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-white/60 mb-4 sm:mb-6">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 flex-shrink-0" />
                  <span>{[vehicle.city, vehicle.state, vehicle.country].filter(Boolean).join(', ')}</span>
                </div>
              )}

              {/* Success Message */}
              {showSuccessMessage && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-400">Vehicle Marked as Unavailable!</p>
                      <p className="text-xs text-green-400/70 mt-0.5">
                        Our team will review this and update the listing status shortly.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mark as Unavailable & Report Abuse - MOBILE */}
              {!isRemoved && (
                <div className="lg:hidden flex flex-col gap-3 mt-4 mb-4">
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowUnavailableModal(true)}
                      disabled={isUnavailable}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium text-white transition-all flex items-center justify-center gap-2 ${
                        isUnavailable
                          ? 'bg-yellow-500/30 cursor-not-allowed opacity-50'
                          : 'bg-yellow-500 hover:bg-yellow-600 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-yellow-500/25'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4" />
                      {isUnavailable ? 'Unavailable' : 'Mark as Unavailable'}
                    </button>
                    <button
                      onClick={() => setShowReportModal(true)}
                      className="flex-1 py-2.5 px-4 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-red-500/25 flex items-center justify-center gap-2"
                    >
                      <Flag className="w-4 h-4" />
                      Report Abuse
                    </button>
                  </div>
                </div>
              )}

              {/* Add to Garage Button */}
              <button
                onClick={handleGarageToggle}
                disabled={garageLoading || isRemoved}
                className={`w-full py-3 sm:py-3.5 rounded-xl font-medium text-white transition-all flex items-center justify-center gap-2 text-sm sm:text-base shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                  isInGarage 
                    ? 'bg-green-600 hover:bg-green-700 shadow-green-500/25' 
                    : 'bg-red-500 hover:bg-red-600 shadow-red-500/25'
                }`}
              >
                {garageLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    {isInGarage ? 'Removing...' : 'Adding...'}
                  </>
                ) : isInGarage ? (
                  <>
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    In Your Garage
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                    Add to Garage
                  </>
                )}
              </button>

              <p className="text-[10px] sm:text-xs text-white/30 text-center mt-2">
                {isRemoved 
                  ? 'This vehicle is no longer available' 
                  : isUnavailable 
                    ? 'This vehicle is currently unavailable' 
                    : isInGarage 
                      ? 'This vehicle is in your garage for consideration' 
                      : 'Save this vehicle to your garage for later consideration'
                }
              </p>

              {/* Divider */}
              <div className="border-t border-white/5 my-4" />

              {/* Seller Info & Contact Button */}
              <div className="flex items-center gap-4">
                {/* Seller Avatar */}
                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center overflow-hidden border-2 border-red-500/30">
                    {sellerProfile?.avatar_url ? (
                      <img 
                        src={sellerProfile.avatar_url} 
                        alt={getSellerDisplayName()}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-red-500" />
                    )}
                  </div>
                  <span className="text-[10px] text-white/40 text-center truncate max-w-[60px]">
                    {getSellerDisplayName()}
                  </span>
                </div>

                {/* Contact Button */}
                <div className="flex-1">
                  <button
                    onClick={handleContact}
                    disabled={isRemoved}
                    className={`w-full py-3 sm:py-3.5 rounded-xl font-medium text-white transition-all flex items-center justify-center gap-2 text-sm sm:text-base shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                      isRemoved
                        ? 'bg-white/10 text-white/40 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 shadow-green-500/25'
                    }`}
                  >
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                    Contact Seller
                  </button>
                  <p className="text-[10px] sm:text-xs text-white/30 text-center mt-1">
                    Get in touch with the seller
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Vehicles Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pb-8">
          <h2 className="text-xl font-bold text-white mb-4">Similar Vehicles</h2>
          
          {loadingSimilar ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
              <span className="text-white/60 ml-2">Loading similar vehicles...</span>
            </div>
          ) : similarVehicles.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
              {similarVehicles.map((vehicle, index) => (
                <CarCard 
                  key={vehicle.id}
                  car={{
                    id: vehicle.id,
                    title: vehicle.title,
                    brand: vehicle.brand,
                    model: vehicle.model,
                    year: vehicle.year,
                    price: vehicle.price,
                    mileage: vehicle.mileage || 'N/A',
                    fuel_type: vehicle.fuel_type,
                    transmission: vehicle.transmission,
                    cover_image: vehicle.cover_image,
                    images: vehicle.images,
                    location: vehicle.location || formatLocation(vehicle.city, vehicle.country),
                    conditionLabel: vehicle.conditionLabel || getConditionLabel(vehicle.condition),
                    condition: vehicle.condition,
                    car_code: vehicle.car_code || undefined,
                    is_promoted: vehicle.is_promoted || false,
                    promotion_package: vehicle.promotion_package || undefined,
                  }}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-white/40">No similar vehicles found</p>
            </div>
          )}
        </div>
      </main>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-3 sm:p-4 lg:p-6 max-w-4xl w-full border border-white/10 shadow-2xl animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-sm sm:text-base lg:text-xl font-bold text-white">Contact Seller</h2>
              <button
                onClick={() => setShowContactModal(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
              <div className="lg:w-1/2">
                <div className="text-sm text-white/60 mb-3 hidden lg:block">
                  <p className="font-medium text-white/80">Before you proceed:</p>
                </div>
                <BuyerNotice variant="modal" onClose={() => {}} />
              </div>

              <div className="lg:w-1/2">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
                    <Phone className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-red-500" />
                  </div>
                  <p className="text-xs sm:text-sm text-white/60">
                    Connect with the seller directly
                  </p>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <a
                    href="tel:09161888244"
                    className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 hover:border-white/10"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm lg:text-base font-medium text-white">Call Seller</p>
                      <p className="text-[8px] sm:text-xs text-white/40">Direct call connection</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-white/30" />
                  </a>

                  <a
                    href="https://wa.me/2349161888244"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 hover:border-white/10"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm lg:text-base font-medium text-white">WhatsApp</p>
                      <p className="text-[8px] sm:text-xs text-white/40">Chat instantly</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-white/30" />
                  </a>

                  <a
                    href="mailto:info@autorepublic.com"
                    className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 hover:border-white/10"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm lg:text-base font-medium text-white">Email</p>
                      <p className="text-[8px] sm:text-xs text-white/40">Send a message</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-white/30" />
                  </a>
                </div>

                <div className="mt-4 p-2.5 sm:p-3 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[10px] sm:text-xs text-white/30 text-center">
                    Our team is available Monday - Friday, 9AM - 6PM
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile Buyer Notice */}
            <div className="lg:hidden mt-6 pt-6 border-t border-white/10">
              <BuyerNotice variant="modal" onClose={() => {}} />
            </div>
          </div>
        </div>
      )}

      {/* Mark as Unavailable Modal */}
      {showUnavailableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 max-w-md w-full border border-white/10 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Mark as Unavailable</h3>
              <button
                onClick={() => setShowUnavailableModal(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>
            
            <div className="text-center mb-6">
              <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
              <p className="text-white font-medium">Is this vehicle truly not available?</p>
              <p className="text-white/40 text-sm mt-1">
                This action will mark the vehicle as unavailable and our team will review it.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUnavailableModal(false)}
                className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkUnavailable}
                disabled={unavailableLoading}
                className="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-600 rounded-xl text-black font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {unavailableLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Mark as Unavailable'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Abuse Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 max-w-md w-full border border-white/10 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Report Abuse</h3>
              <button
                onClick={() => {
                  setShowReportModal(false)
                  setReportReason('')
                  setReportDescription('')
                }}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1.5">
                  Reason for reporting <span className="text-red-500">*</span>
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors"
                >
                  <option value="" className="text-gray-400">Select a reason...</option>
                  <option value="scam" className="text-white">Scam/Fraud</option>
                  <option value="fake" className="text-white">Fake Listing</option>
                  <option value="misleading" className="text-white">Misleading Information</option>
                  <option value="inappropriate" className="text-white">Inappropriate Content</option>
                  <option value="duplicate" className="text-white">Duplicate Listing</option>
                  <option value="other" className="text-white">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-1.5">
                  Description <span className="text-white/30 text-xs">(optional)</span>
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  rows={4}
                  placeholder="Please provide more details about your report..."
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors resize-none placeholder:text-white/30"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowReportModal(false)
                    setReportReason('')
                    setReportDescription('')
                  }}
                  className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReportAbuse}
                  disabled={isSubmitting || !reportReason}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Report'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}

// Main page component with Suspense boundary
export default function VehicleDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/60">Loading vehicle details...</div>
      </div>
    }>
      <VehicleDetailContent />
    </Suspense>
  )
}