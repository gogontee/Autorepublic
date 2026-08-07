'use client'

import { useState } from 'react'
import { Star, Loader2 } from 'lucide-react'
import RatingModal from './RatingModal'

interface RateVehicleButtonProps {
  vehicleId: string
  vehicleTitle: string
  className?: string
  variant?: 'full' | 'compact' | 'icon'
  onRatingUpdate?: () => void
}

export default function RateVehicleButton({ 
  vehicleId, 
  vehicleTitle,
  className = '',
  variant = 'full',
  onRatingUpdate 
}: RateVehicleButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleRatingSubmitted = async (rating: number, review: string) => {
    if (onRatingUpdate) {
      onRatingUpdate()
    }
  }

  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={handleOpenModal}
          className={`p-2 hover:bg-white/10 rounded-full transition-colors ${className}`}
          aria-label="Rate this vehicle"
        >
          <Star className="w-5 h-5 text-white/60 hover:text-yellow-400 transition-colors" />
        </button>
        
        <RatingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          vehicleId={vehicleId}
          vehicleTitle={vehicleTitle}
          onRatingSubmitted={handleRatingSubmitted}
        />
      </>
    )
  }

  if (variant === 'compact') {
    return (
      <>
        <button
          onClick={handleOpenModal}
          className={`flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-full text-xs font-medium text-white/80 transition-colors border border-white/5 hover:border-white/10 ${className}`}
        >
          <Star className="w-3.5 h-3.5" />
          Rate
        </button>
        
        <RatingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          vehicleId={vehicleId}
          vehicleTitle={vehicleTitle}
          onRatingSubmitted={handleRatingSubmitted}
        />
      </>
    )
  }

  return (
    <>
      <button
        onClick={handleOpenModal}
        className={`flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium text-white transition-colors border border-white/5 hover:border-white/10 ${className}`}
      >
        <Star className="w-4 h-4" />
        Rate This Vehicle
      </button>
      
      <RatingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        vehicleId={vehicleId}
        vehicleTitle={vehicleTitle}
        onRatingSubmitted={handleRatingSubmitted}
      />
    </>
  )
}