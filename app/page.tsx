'use client'

import { useState, useEffect } from 'react'
import LayoutWrapper from '@/components/LayoutWrapper'
import HeroSection from '@/components/HeroSection'
import VehicleScroll from '@/components/VehicleScroll'
import AppTabs from '@/components/AppTabs'
import { supabase } from '@/lib/supabase/client'
import { Loader2, AlertCircle } from 'lucide-react'

interface Vehicle {
  id: string
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
  city: string
  state: string
  country: string
  featured: boolean
  luxury?: boolean
  Removed?: boolean
  sold?: boolean
  unavailable?: boolean
  location?: string
  conditionLabel?: string
  is_promoted?: boolean
  promotion_package?: string | null
}

export default function HomePage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch featured vehicles count or just check if any exist
  useEffect(() => {
    const checkVehicles = async () => {
      try {
        const { count, error } = await supabase
          .from('vehicles')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
          .or('Removed.is.null,Removed.eq.false')

        if (error) {
          console.error('Error checking vehicles:', error)
          setError('Failed to load vehicles')
        }
        setLoading(false)
      } catch (err) {
        console.error('Error:', err)
        setError('An unexpected error occurred')
        setLoading(false)
      }
    }

    checkVehicles()
  }, [])

  // Loading state
  if (loading) {
    return (
      <LayoutWrapper>
        <HeroSection />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
          <span className="text-white/60 ml-3">Loading vehicles...</span>
        </div>
      </LayoutWrapper>
    )
  }

  // Error state
  if (error) {
    return (
      <LayoutWrapper>
        <HeroSection />
        <div className="text-center py-20">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-white/60">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="inline-block mt-4 px-6 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-medium text-white transition-colors"
          >
            Try Again
          </button>
        </div>
      </LayoutWrapper>
    )
  }

  return (
    <LayoutWrapper>
      {/* Hero Section */}
      <HeroSection />

      {/* Featured Vehicles - Auto-scrolling rows */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <VehicleScroll 
          title="⭐ Featured Vehicles" 
          limit={20}
          className="py-4"
        />
      </div>

      {/* App Tabs - Navigation for vehicle categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AppTabs className="mb-4" />
      </div>
    </LayoutWrapper>
  )
}