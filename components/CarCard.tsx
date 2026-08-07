'use client'

import { useState, useEffect, useRef } from 'react'
import { Heart, MapPin, Fuel, Gauge, Star, Tag, Crown, Sparkles, Flame, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

interface CarCardProps {
  car: {
    id: string | number
    title?: string
    name?: string
    year: number
    price: string | number
    mileage: string
    fuel_type?: string
    fuel?: string
    transmission: string
    image?: string
    cover_image?: string
    images?: string[]
    location: string
    condition?: string
    conditionLabel?: string
    brand?: string
    model?: string
    color?: string
    car_code?: string
    is_promoted?: boolean
    promotion_package?: string
  }
  index: number
}

export default function CarCard({ car, index }: CarCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [ratingData, setRatingData] = useState<{ average: number; count: number } | null>(null)
  const [loadingRating, setLoadingRating] = useState(true)
  const [ratingError, setRatingError] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Get the display name
  const displayName = car.title || car.name || `${car.brand || ''} ${car.model || ''}`.trim() || 'Vehicle'
  
  // Get all images
  const allImages = car.images && car.images.length > 0 
    ? car.images 
    : car.cover_image 
      ? [car.cover_image] 
      : car.image 
        ? [car.image] 
        : ['/api/placeholder/400/300']
  
  // Get the price
  const displayPrice = typeof car.price === 'number' ? `$${car.price.toLocaleString()}` : car.price
  
  // Get the fuel type
  const fuelType = car.fuel_type || car.fuel || 'N/A'
  
  // Get the condition label
  const conditionLabel = car.conditionLabel || (car.condition ? getConditionLabel(car.condition) : null)
  
  // Format location
  const displayLocation = car.location || 'Location Unknown'

  // Get promotion badge - All silver theme
  const getPromotionBadge = () => {
    if (!car.is_promoted || !car.promotion_package) return null
    
    // All badges use silver theme with different opacity levels
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
    
    return badges[car.promotion_package as keyof typeof badges] || null
  }

  const promotionBadge = getPromotionBadge()
  const isPromoted = car.is_promoted || false

  // Fetch rating stats for this vehicle
  useEffect(() => {
    const fetchRatingStats = async () => {
      if (!car.id) return

      try {
        setLoadingRating(true)
        setRatingError(false)
        
        // Query the vehicle_ratings table directly
        const { data: ratings, error: queryError } = await supabase
          .from('vehicle_ratings')
          .select('rating')
          .eq('vehicle_id', car.id)

        if (queryError) {
          console.error('Error fetching ratings:', queryError)
          setRatingError(true)
          setLoadingRating(false)
          return
        }

        if (ratings && ratings.length > 0) {
          const total = ratings.length
          const sum = ratings.reduce((acc, r) => acc + r.rating, 0)
          const avg = sum / total
          
          setRatingData({
            average: Math.round(avg * 10) / 10,
            count: total
          })
        } else {
          // No ratings found
          setRatingData({
            average: 0,
            count: 0
          })
        }
      } catch (error) {
        console.error('Error fetching rating stats:', error)
        setRatingError(true)
        setRatingData({
          average: 0,
          count: 0
        })
      } finally {
        setLoadingRating(false)
      }
    }

    fetchRatingStats()
  }, [car.id])

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

  // Handle mouse enter
  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  // Handle mouse leave
  const handleMouseLeave = () => {
    setIsHovered(false)
  }

  // Get current image
  const currentImage = allImages[currentImageIndex] || allImages[0] || '/api/placeholder/400/300'

  // Get rating display values
  const displayRating = ratingData?.average || 0
  const displayReviewCount = ratingData?.count || 0
  const hasRatings = displayReviewCount > 0 && displayRating > 0

  // Render star rating display - ONLY if there are ratings, without showing count
  const renderRatingStars = () => {
    // Don't show anything if loading or no ratings
    if (loadingRating) {
      return (
        <div className="flex items-center gap-1">
          <Loader2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin text-white/40" />
        </div>
      )
    }

    // Don't show anything if no ratings or error
    if (!hasRatings || ratingError) {
      return null
    }

    const fullStars = Math.floor(displayRating)
    const hasHalfStar = displayRating % 1 >= 0.5
    const stars = []

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <Star 
            key={i} 
            className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-yellow-500 text-yellow-500" 
          />
        )
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-500" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-yellow-500 text-yellow-500" />
            </div>
          </div>
        )
      } else {
        stars.push(
          <Star 
            key={i} 
            className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white/20" 
          />
        )
      }
    }

    return (
      <>
        <div className="flex items-center gap-0.5">
          {stars}
        </div>
        <span className="text-white/90 text-[9px] sm:text-xs ml-0.5">
          {displayRating.toFixed(1)}
        </span>
        {/* Review count removed - not showing on card */}
      </>
    )
  }

  return (
    <Link href={`/vehicles/${car.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          delay: index * 0.1,
          duration: isPromoted ? 0.6 : 0.4,
          ease: isPromoted ? [0.34, 1.56, 0.64, 1] : "easeOut",
          type: isPromoted ? "spring" : "tween",
          stiffness: isPromoted ? 100 : undefined,
          damping: isPromoted ? 12 : undefined
        }}
        className={`bg-white/5 rounded-xl sm:rounded-2xl overflow-hidden border transition-all hover:bg-white/10 cursor-pointer group ${
          isPromoted 
            ? 'border-white/20 hover:border-white/40 shadow-lg shadow-white/5' 
            : 'border-white/5 hover:border-white/10'
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="relative overflow-hidden">
          {/* Image Container with Smooth Transitions */}
          <div className="relative w-full h-32 sm:h-48">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImageIndex}
                src={currentImage}
                alt={displayName}
                className="w-full h-full object-cover absolute inset-0"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  transition: { 
                    duration: 0.6,
                    ease: "easeInOut"
                  }
                }}
                exit={{ 
                  opacity: 0, 
                  scale: 1.05,
                  transition: { 
                    duration: 0.4,
                    ease: "easeInOut"
                  }
                }}
              />
            </AnimatePresence>

            {/* Promotion Glow Effect - Subtle Silver */}
            {isPromoted && (
              <div className="absolute inset-0 pointer-events-none bg-white/5" />
            )}
          </div>

          {/* Promotion Badge - Silver Theme */}
          {promotionBadge && (
            <motion.div 
              className={`absolute top-2 sm:top-3 left-2 sm:left-3 z-10 flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[7px] sm:text-[10px] font-medium ${promotionBadge.color} border backdrop-blur-sm shadow-lg`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                delay: 0.2, 
                type: "spring", 
                stiffness: 200,
                damping: 15
              }}
            >
              <promotionBadge.icon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              {promotionBadge.label}
            </motion.div>
          )}

          {/* Like Button */}
          <button 
            className="absolute top-2 sm:top-3 right-2 sm:right-3 p-1.5 sm:p-2 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-colors z-10"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              // Handle like functionality
            }}
          >
            <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
          
          {/* Rating - ONLY show if there are ratings, without count */}
          {hasRatings && (
            <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 px-2 sm:px-3 py-0.5 sm:py-1 bg-black/50 backdrop-blur-sm rounded-full text-[9px] sm:text-xs flex items-center gap-0.5 sm:gap-1 z-10">
              {renderRatingStars()}
            </div>
          )}
          
          {/* Condition Badge */}
          {conditionLabel && (
            <div className="absolute top-2 sm:top-3 left-2 sm:left-3 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-xs font-medium text-white backdrop-blur-sm z-10">
              {conditionLabel === 'New' && (
                <span className="bg-green-500/80 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                  New
                </span>
              )}
              {conditionLabel === 'F-Used' && (
                <span className="bg-yellow-500/80 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                  F-Used
                </span>
              )}
              {conditionLabel === 'L-Used' && (
                <span className="bg-blue-500/80 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                  L-Used
                </span>
              )}
              {!['New', 'F-Used', 'L-Used'].includes(conditionLabel) && (
                <span className="bg-white/20 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                  {conditionLabel}
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="p-2.5 sm:p-4">
          <div className="flex items-start justify-between mb-1 sm:mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-xs sm:text-base font-semibold text-white/90 truncate group-hover:text-white transition-colors">
                {displayName}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[10px] sm:text-sm text-white/60">{car.year}</p>
                {car.car_code && (
                  <>
                    <span className="text-[8px] sm:text-[10px] text-white/20">•</span>
                    <div className="flex items-center gap-0.5">
                      <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-400" />
                      <p className="text-[8px] sm:text-[10px] font-mono text-red-400">{car.car_code}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
            <p className="text-sm sm:text-xl font-bold text-red-500 whitespace-nowrap ml-2">
              {displayPrice}
            </p>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 text-[9px] sm:text-sm text-white/60 flex-wrap">
            <span className="flex items-center gap-0.5 sm:gap-1">
              <Gauge className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              {car.mileage || 'N/A'}
            </span>
            <span className="flex items-center gap-0.5 sm:gap-1">
              <Fuel className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              {fuelType}
            </span>
            <span className="flex items-center gap-0.5 sm:gap-1">
              <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span className="truncate max-w-[60px] sm:max-w-none">{displayLocation}</span>
            </span>
          </div>

          {/* Promotion indicator line - Subtle Silver */}
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

// Helper function to get condition label
function getConditionLabel(condition: string): string {
  if (!condition) return 'Used'
  const cond = condition.toLowerCase()
  if (cond === 'brand new') return 'New'
  if (cond === 'foreign used') return 'F-Used'
  if (cond === 'local used') return 'L-Used'
  return condition.charAt(0).toUpperCase() + condition.slice(1)
}