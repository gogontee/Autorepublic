'use client'

import { useState, useEffect } from 'react'
import { Star, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface RatingStats {
  average_rating: number
  total_ratings: number
  rating_distribution: Record<string, number>
}

interface VehicleRatingProps {
  vehicleId: string
  showLabel?: boolean
  className?: string
  starSize?: 'sm' | 'md' | 'lg'
  onRatingChange?: (stats: RatingStats) => void
}

export default function VehicleRating({ 
  vehicleId, 
  showLabel = true,
  className = '',
  starSize = 'md',
  onRatingChange 
}: VehicleRatingProps) {
  const [stats, setStats] = useState<RatingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const starSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  useEffect(() => {
    fetchRatingStats()
  }, [vehicleId])

  const fetchRatingStats = async () => {
    if (!vehicleId) return

    try {
      setLoading(true)
      setError('')
      
      // Direct query to get all ratings for this vehicle
      const { data: ratings, error: queryError } = await supabase
        .from('vehicle_ratings')
        .select('rating')
        .eq('vehicle_id', vehicleId)

      if (queryError) {
        console.error('Error fetching ratings:', queryError)
        setError('Failed to load ratings')
        setLoading(false)
        return
      }

      if (!ratings || ratings.length === 0) {
        setStats({
          average_rating: 0,
          total_ratings: 0,
          rating_distribution: {}
        })
        setLoading(false)
        return
      }

      const total = ratings.length
      const sum = ratings.reduce((acc, r) => acc + r.rating, 0)
      const avg = sum / total

      // Build distribution
      const distribution: Record<string, number> = {}
      ratings.forEach(r => {
        const key = r.rating.toString()
        distribution[key] = (distribution[key] || 0) + 1
      })

      const ratingStats = {
        average_rating: Math.round(avg * 10) / 10,
        total_ratings: total,
        rating_distribution: distribution
      }

      setStats(ratingStats)

      if (onRatingChange) {
        onRatingChange(ratingStats)
      }
    } catch (error) {
      console.error('Error fetching rating stats:', error)
      setError('Failed to load ratings')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Loader2 className={`${starSizes[starSize]} animate-spin text-white/40`} />
        <span className="text-xs text-white/40">Loading...</span>
      </div>
    )
  }

  if (error || !stats || stats.total_ratings === 0) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <span className="text-xs text-white/30">No ratings yet</span>
      </div>
    )
  }

  const { average_rating } = stats

  // Render stars
  const renderStars = () => {
    const stars = []
    const fullStars = Math.floor(average_rating)
    const hasHalfStar = average_rating % 1 >= 0.5

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <Star 
            key={i} 
            className={`${starSizes[starSize]} fill-yellow-400 text-yellow-400`} 
          />
        )
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <Star className={`${starSizes[starSize]} text-yellow-400`} />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className={`${starSizes[starSize]} fill-yellow-400 text-yellow-400`} />
            </div>
          </div>
        )
      } else {
        stars.push(
          <Star 
            key={i} 
            className={`${starSizes[starSize]} text-white/20`} 
          />
        )
      }
    }
    return stars
  }

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-0.5">
        {renderStars()}
      </div>
      {showLabel && average_rating > 0 && (
        <span className="text-xs sm:text-sm font-medium text-white/80">
          {average_rating.toFixed(1)}
        </span>
      )}
      {/* Review count removed - not showing on vehicle detail page */}
    </div>
  )
}