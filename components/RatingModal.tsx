'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Star, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface RatingModalProps {
  isOpen: boolean
  onClose: () => void
  vehicleId: string
  vehicleTitle: string
  onRatingSubmitted?: (rating: number, review: string) => void
}

export default function RatingModal({ 
  isOpen, 
  onClose, 
  vehicleId, 
  vehicleTitle,
  onRatingSubmitted 
}: RatingModalProps) {
  const [selectedRating, setSelectedRating] = useState<number>(0)
  const [hoveredRating, setHoveredRating] = useState<number>(0)
  const [review, setReview] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [userRating, setUserRating] = useState<{ rating: number; review: string } | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check authentication and existing rating
  useEffect(() => {
    const checkAuthAndRating = async () => {
      if (!isOpen || !vehicleId) return

      try {
        const { data: { session } } = await supabase.auth.getSession()
        setIsAuthenticated(!!session)
        setAuthChecked(true)

        if (session?.user) {
          // Check if user already rated this vehicle
          const { data, error } = await supabase
            .from('vehicle_ratings')
            .select('rating, review')
            .eq('vehicle_id', vehicleId)
            .eq('user_id', session.user.id)
            .maybeSingle()

          if (!error && data) {
            setUserRating({
              rating: data.rating,
              review: data.review || ''
            })
            setSelectedRating(data.rating)
            setReview(data.review || '')
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error)
      }
    }

    checkAuthAndRating()
  }, [isOpen, vehicleId])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedRating(0)
      setHoveredRating(0)
      setReview('')
      setError('')
      setSuccess(false)
    }
  }, [isOpen])

  const handleSubmit = async () => {
    if (selectedRating === 0) {
      setError('Please select a rating')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        setError('Please sign in to rate this vehicle')
        setLoading(false)
        return
      }

      // Check if rating exists
      const { data: existing, error: checkError } = await supabase
        .from('vehicle_ratings')
        .select('id')
        .eq('vehicle_id', vehicleId)
        .eq('user_id', session.user.id)
        .maybeSingle()

      let result

      if (existing) {
        // Update existing rating
        result = await supabase
          .from('vehicle_ratings')
          .update({
            rating: selectedRating,
            review: review.trim() || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
      } else {
        // Insert new rating
        result = await supabase
          .from('vehicle_ratings')
          .insert({
            vehicle_id: vehicleId,
            user_id: session.user.id,
            rating: selectedRating,
            review: review.trim() || null
          })
      }

      if (result.error) {
        throw result.error
      }

      setSuccess(true)
      if (onRatingSubmitted) {
        onRatingSubmitted(selectedRating, review)
      }

      // Close modal after success
      setTimeout(() => {
        onClose()
      }, 2000)

    } catch (error: any) {
      console.error('Error submitting rating:', error)
      setError(error.message || 'Failed to submit rating. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const renderStars = () => {
    const stars = []
    const rating = hoveredRating || selectedRating

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          onClick={() => setSelectedRating(i)}
          onMouseEnter={() => setHoveredRating(i)}
          onMouseLeave={() => setHoveredRating(0)}
          className="focus:outline-none transition-transform hover:scale-110"
          disabled={loading || success}
        >
          <Star
            className={`w-8 h-8 sm:w-10 sm:h-10 transition-colors ${
              i <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-white/20 hover:text-white/40'
            }`}
          />
        </button>
      )
    }
    return stars
  }

  const ratingLabels = [
    '',
    'Terrible',
    'Poor',
    'Average',
    'Good',
    'Excellent'
  ]

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 max-w-md w-full border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Rate This Vehicle</h3>
                <p className="text-sm text-white/40 mt-0.5 truncate max-w-[200px] sm:max-w-[300px]">
                  {vehicleTitle}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                disabled={loading}
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <p className="text-sm text-green-400">
                  {userRating ? 'Rating updated successfully!' : 'Thank you for your rating!'}
                </p>
              </motion.div>
            )}

            {/* Not Authenticated */}
            {authChecked && !isAuthenticated && !success && (
              <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <p className="text-sm text-yellow-400">
                  Please sign in to rate this vehicle.
                </p>
                <button
                  onClick={() => {
                    onClose()
                    // You can redirect to login or show login modal here
                    window.location.href = '/auth/login'
                  }}
                  className="mt-2 px-4 py-1.5 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-sm font-medium text-black transition-colors"
                >
                  Sign In
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && !success && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Rating Content */}
            {!success && isAuthenticated && (
              <>
                {/* Stars */}
                <div className="flex justify-center gap-1 mb-3">
                  {renderStars()}
                </div>

                {/* Rating Label */}
                {selectedRating > 0 && (
                  <p className="text-center text-sm font-medium text-white/60 mb-4">
                    {ratingLabels[selectedRating]}
                  </p>
                )}

                {/* Review Textarea */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-white/60 mb-1.5">
                    Write a review <span className="text-white/30 text-xs">(optional)</span>
                  </label>
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    rows={4}
                    placeholder="Share your experience with this vehicle..."
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors resize-none placeholder:text-white/30 disabled:opacity-50"
                    disabled={loading}
                  />
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={loading || selectedRating === 0}
                  className="w-full py-3 bg-red-500 hover:bg-red-600 disabled:bg-white/10 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : userRating ? (
                    'Update Rating'
                  ) : (
                    'Submit Rating'
                  )}
                </button>

                {/* Existing Rating Info */}
                {userRating && (
                  <p className="text-xs text-white/30 text-center mt-3">
                    You previously rated this vehicle {userRating.rating} stars
                  </p>
                )}
              </>
            )}

            {/* Rating Statistics (optional) */}
            {!success && !loading && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <p className="text-xs text-white/30 text-center">
                  Your rating helps other buyers make informed decisions
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}