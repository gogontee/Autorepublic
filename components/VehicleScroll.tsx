// components/VehicleScroll.tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tag } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

interface VehicleScrollProps {
  title?: string
  limit?: number
  category?: string
  condition?: string
  className?: string
}

interface Vehicle {
  id: string
  brand: string
  model: string
  price: number
  car_code: string
  cover_image: string
  images: string[]
  is_promoted?: boolean
  promotion_package?: string | null
}

// Internal Car Card Component - Only shows brand + model, price, and car code
function ScrollCarCard({ 
  vehicle, 
  index 
}: { 
  vehicle: Vehicle
  index: number 
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Get all images
  const allImages = vehicle.images && vehicle.images.length > 0 
    ? vehicle.images 
    : vehicle.cover_image 
      ? [vehicle.cover_image] 
      : ['/api/placeholder/400/300']
  
  // Get the price
  const displayPrice = typeof vehicle.price === 'number' 
    ? `₦${vehicle.price.toLocaleString()}` 
    : vehicle.price

  // Get promotion badge
  const getPromotionBadge = () => {
    if (!vehicle.is_promoted || !vehicle.promotion_package) return null
    
    const badges = {
      premium: { 
        label: 'Premium', 
        color: 'text-white bg-white/15 border-white/30'
      },
      medium: { 
        label: 'Featured', 
        color: 'text-white/90 bg-white/10 border-white/25'
      },
      basic: { 
        label: 'Boosted', 
        color: 'text-white/80 bg-white/8 border-white/20'
      }
    }
    
    return badges[vehicle.promotion_package as keyof typeof badges] || null
  }

  const promotionBadge = getPromotionBadge()
  const isPromoted = vehicle.is_promoted || false

  // Handle image transition on hover
  useEffect(() => {
    if (isHovered && allImages.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % allImages.length)
      }, 2500)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setCurrentImageIndex(0)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isHovered, allImages.length])

  const handleMouseEnter = () => setIsHovered(true)
  const handleMouseLeave = () => setIsHovered(false)

  const currentImage = allImages[currentImageIndex] || allImages[0] || '/api/placeholder/400/300'

  return (
    <Link href={`/vehicles/${vehicle.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          delay: index * 0.05,
          duration: isPromoted ? 0.6 : 0.4,
          ease: isPromoted ? [0.34, 1.56, 0.64, 1] : "easeOut",
          type: isPromoted ? "spring" : "tween",
          stiffness: isPromoted ? 100 : undefined,
          damping: isPromoted ? 12 : undefined
        }}
        className={`bg-white/5 rounded-xl overflow-hidden border transition-all hover:bg-white/10 cursor-pointer group ${
          isPromoted 
            ? 'border-white/20 hover:border-white/40 shadow-lg shadow-white/5' 
            : 'border-white/5 hover:border-white/10'
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="relative overflow-hidden">
          {/* Image */}
          <div className="relative w-full h-32 sm:h-40">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImageIndex}
                src={currentImage}
                alt={`${vehicle.brand} ${vehicle.model}`}
                className="w-full h-full object-cover absolute inset-0"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  transition: { duration: 0.6, ease: "easeInOut" }
                }}
                exit={{ 
                  opacity: 0, 
                  scale: 1.05,
                  transition: { duration: 0.4, ease: "easeInOut" }
                }}
              />
            </AnimatePresence>

            {isPromoted && (
              <div className="absolute inset-0 pointer-events-none bg-white/5" />
            )}
          </div>

          {/* Promotion Badge */}
          {promotionBadge && (
            <motion.div 
              className={`absolute top-2 left-2 z-10 flex items-center px-1.5 py-0.5 rounded-full text-[7px] font-medium ${promotionBadge.color} border backdrop-blur-sm shadow-lg`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            >
              {promotionBadge.label}
            </motion.div>
          )}
        </div>
        
        <div className="p-3">
          {/* Brand + Model */}
          <h3 className="text-sm font-semibold text-white truncate group-hover:text-red-400 transition-colors">
            {vehicle.brand} {vehicle.model}
          </h3>

          {/* Price */}
          <p className="text-base font-bold text-red-500 mt-0.5">
            {displayPrice}
          </p>

          {/* Car Code */}
          {vehicle.car_code && (
            <div className="flex items-center gap-1 mt-1 text-[10px] text-white/40">
              <Tag className="w-3 h-3" />
              <span>{vehicle.car_code}</span>
            </div>
          )}

          {/* Promotion indicator line */}
          {isPromoted && (
            <motion.div 
              className="mt-2 h-0.5 w-full rounded-full bg-gradient-to-r from-white/10 via-white/30 to-white/10"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ delay: 0.3, duration: 0.8 }}
            />
          )}
        </div>
      </motion.div>
    </Link>
  )
}

// Main VehicleScroll Component
export default function VehicleScroll({ 
  title = 'Featured Vehicles', 
  limit = 20,
  category,
  condition,
  className = ''
}: VehicleScrollProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isTopRowPaused, setIsTopRowPaused] = useState(false)
  const [isBottomRowPaused, setIsBottomRowPaused] = useState(false)
  const [lastInteractionTime, setLastInteractionTime] = useState(Date.now())
  
  const topRowRef = useRef<HTMLDivElement>(null)
  const bottomRowRef = useRef<HTMLDivElement>(null)
  const topRowAnimationRef = useRef<number | null>(null)
  const bottomRowAnimationRef = useRef<number | null>(null)
  const topRowSpeedRef = useRef(0.5)
  const bottomRowSpeedRef = useRef(0.5)
  const autoResumeTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch vehicles - Only get the fields we need
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true)
        
        let query = supabase
          .from('vehicles')
          .select(`
            id,
            brand,
            model,
            price,
            car_code,
            cover_image,
            images,
            is_promoted,
            promotion_package,
            vehicle_promotions!left (
              id,
              package_type,
              end_date,
              is_active,
              status
            )
          `)
          .eq('status', 'active')
          .or('Removed.is.null,Removed.eq.false')
          .limit(limit || 20)

        if (category) query = query.eq('category', category)
        if (condition) query = query.eq('condition', condition)

        const { data, error } = await query

        if (error) {
          console.error('Error fetching vehicles:', error)
          setError('Failed to load vehicles')
          setLoading(false)
          return
        }

        if (data) {
          const transformedData = data.map((vehicle: any) => {
            const activePromotion = vehicle.vehicle_promotions?.find(
              (p: any) => p.is_active === true && p.status === 'active'
            )

            return {
              id: vehicle.id,
              brand: vehicle.brand,
              model: vehicle.model,
              price: vehicle.price,
              car_code: vehicle.car_code,
              cover_image: vehicle.cover_image,
              images: vehicle.images,
              is_promoted: !!activePromotion,
              promotion_package: activePromotion?.package_type || null,
            }
          })

          // Sort: promoted first, then by creation date
          transformedData.sort((a: any, b: any) => {
            if (a.is_promoted && !b.is_promoted) return -1
            if (!a.is_promoted && b.is_promoted) return 1
            return 0
          })

          // Duplicate vehicles for infinite scroll effect
          const duplicatedData = [...transformedData]
          while (duplicatedData.length < 8) {
            duplicatedData.push(...transformedData.slice(0, Math.min(8, transformedData.length)))
          }
          
          setVehicles(duplicatedData)
        }

        setLoading(false)
      } catch (err) {
        console.error('Error:', err)
        setError('An unexpected error occurred')
        setLoading(false)
      }
    }

    fetchVehicles()
  }, [category, condition, limit])

  // Auto-resume after 5 seconds
  const handleInteraction = () => {
    setLastInteractionTime(Date.now())
    
    if (autoResumeTimerRef.current) {
      clearTimeout(autoResumeTimerRef.current)
    }
    
    autoResumeTimerRef.current = setTimeout(() => {
      if (isTopRowPaused) {
        setIsTopRowPaused(false)
        startTopRowScroll()
      }
      if (isBottomRowPaused) {
        setIsBottomRowPaused(false)
        startBottomRowScroll()
      }
    }, 5000)
  }

  // Top row auto-scroll
  const startTopRowScroll = useCallback(() => {
    if (topRowAnimationRef.current) {
      cancelAnimationFrame(topRowAnimationRef.current)
    }

    const animateTopRow = () => {
      if (isTopRowPaused) {
        topRowAnimationRef.current = requestAnimationFrame(animateTopRow)
        return
      }

      if (topRowRef.current) {
        const scrollWidth = topRowRef.current.scrollWidth / 3
        topRowRef.current.scrollLeft += topRowSpeedRef.current
        
        if (topRowRef.current.scrollLeft >= scrollWidth * 2) {
          topRowRef.current.scrollLeft = scrollWidth
        }
      }

      topRowAnimationRef.current = requestAnimationFrame(animateTopRow)
    }

    topRowAnimationRef.current = requestAnimationFrame(animateTopRow)
  }, [isTopRowPaused])

  // Bottom row auto-scroll
  const startBottomRowScroll = useCallback(() => {
    if (bottomRowAnimationRef.current) {
      cancelAnimationFrame(bottomRowAnimationRef.current)
    }

    const animateBottomRow = () => {
      if (isBottomRowPaused) {
        bottomRowAnimationRef.current = requestAnimationFrame(animateBottomRow)
        return
      }

      if (bottomRowRef.current) {
        const scrollWidth = bottomRowRef.current.scrollWidth / 3
        bottomRowRef.current.scrollLeft -= bottomRowSpeedRef.current
        
        if (bottomRowRef.current.scrollLeft <= 0) {
          bottomRowRef.current.scrollLeft = scrollWidth
        }
      }

      bottomRowAnimationRef.current = requestAnimationFrame(animateBottomRow)
    }

    bottomRowAnimationRef.current = requestAnimationFrame(animateBottomRow)
  }, [isBottomRowPaused])

  // Start both rows
  useEffect(() => {
    const timer = setTimeout(() => {
      startTopRowScroll()
      startBottomRowScroll()
    }, 500)

    return () => {
      clearTimeout(timer)
      if (topRowAnimationRef.current) cancelAnimationFrame(topRowAnimationRef.current)
      if (bottomRowAnimationRef.current) cancelAnimationFrame(bottomRowAnimationRef.current)
      if (autoResumeTimerRef.current) clearTimeout(autoResumeTimerRef.current)
    }
  }, [startTopRowScroll, startBottomRowScroll])

  // Row handlers
  const handleTopRowMouseEnter = () => {
    setIsTopRowPaused(true)
    handleInteraction()
  }

  const handleTopRowMouseLeave = () => handleInteraction()
  const handleBottomRowMouseEnter = () => {
    setIsBottomRowPaused(true)
    handleInteraction()
  }
  const handleBottomRowMouseLeave = () => handleInteraction()

  const handleTopRowDragStart = () => {
    setIsTopRowPaused(true)
    handleInteraction()
  }
  const handleTopRowDragEnd = () => handleInteraction()
  const handleBottomRowDragStart = () => {
    setIsBottomRowPaused(true)
    handleInteraction()
  }
  const handleBottomRowDragEnd = () => handleInteraction()

  const scrollTopRow = (direction: 'left' | 'right') => {
    if (topRowRef.current) {
      const scrollAmount = 300
      topRowRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
    setIsTopRowPaused(true)
    handleInteraction()
  }

  const scrollBottomRow = (direction: 'left' | 'right') => {
    if (bottomRowRef.current) {
      const scrollAmount = 300
      bottomRowRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
    setIsBottomRowPaused(true)
    handleInteraction()
  }

  // Loading state
  if (loading) {
    return (
      <div className={`py-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">{title}</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  // Error state
  if (error || vehicles.length === 0) {
    return (
      <div className={`py-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">{title}</h2>
        </div>
        <div className="text-center py-8 text-white/40">
          {error || 'No vehicles available'}
        </div>
      </div>
    )
  }

  const halfIndex = Math.ceil(vehicles.length / 2)
  const topRowVehicles = vehicles.slice(0, halfIndex)
  const bottomRowVehicles = vehicles.slice(halfIndex)
  const duplicatedTopVehicles = [...topRowVehicles, ...topRowVehicles, ...topRowVehicles]
  const duplicatedBottomVehicles = [...bottomRowVehicles, ...bottomRowVehicles, ...bottomRowVehicles]

  return (
    <div className={`py-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-4">
        <h2 className="text-lg sm:text-xl font-bold text-white">{title}</h2>
      </div>

      {/* Top Row */}
      <div 
        className="relative group mb-2"
        onMouseEnter={handleTopRowMouseEnter}
        onMouseLeave={handleTopRowMouseLeave}
      >
        <div 
          ref={topRowRef}
          className="overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onMouseDown={handleTopRowDragStart}
          onMouseUp={handleTopRowDragEnd}
          onTouchStart={handleTopRowDragStart}
          onTouchEnd={handleTopRowDragEnd}
        >
          <div className="flex gap-2 w-max">
            {duplicatedTopVehicles.map((vehicle, index) => (
              <div 
                key={`top-${vehicle.id}-${index}`}
                className="w-[160px] sm:w-[180px] md:w-[200px] lg:w-[220px] flex-shrink-0"
              >
                <ScrollCarCard vehicle={vehicle} index={index} />
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => scrollTopRow('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 p-1.5 bg-black/70 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/90 text-white"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => scrollTopRow('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 bg-black/70 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/90 text-white"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Row */}
      <div 
        className="relative group"
        onMouseEnter={handleBottomRowMouseEnter}
        onMouseLeave={handleBottomRowMouseLeave}
      >
        <div 
          ref={bottomRowRef}
          className="overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onMouseDown={handleBottomRowDragStart}
          onMouseUp={handleBottomRowDragEnd}
          onTouchStart={handleBottomRowDragStart}
          onTouchEnd={handleBottomRowDragEnd}
        >
          <div className="flex gap-2 w-max">
            {duplicatedBottomVehicles.map((vehicle, index) => (
              <div 
                key={`bottom-${vehicle.id}-${index}`}
                className="w-[160px] sm:w-[180px] md:w-[200px] lg:w-[220px] flex-shrink-0"
              >
                <ScrollCarCard vehicle={vehicle} index={index} />
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => scrollBottomRow('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 p-1.5 bg-black/70 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/90 text-white"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => scrollBottomRow('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 bg-black/70 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/90 text-white"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Missing imports
import { ChevronLeft, ChevronRight } from 'lucide-react'