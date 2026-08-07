'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import CarCard from '@/components/CarCard'
import LayoutWrapper from '@/components/LayoutWrapper'
import HeroSection from '@/components/HeroSection'
import VehicleCategory from '@/components/VehicleCategory'
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

// Helper categories for the page
const categories = [
  { id: 'all', name: 'All' },
  { id: 'sedan', name: 'Sedan' },
  { id: 'suv', name: 'SUV' },
  { id: 'sports', name: 'Sports' },
  { id: 'luxury', name: 'Luxury' },
  { id: 'electric', name: 'Electric' },
  { id: 'van', name: 'Van' },
  { id: 'trailer', name: 'Trailer' },
  { id: 'truck', name: 'Truck' },
  { id: 'coupe', name: 'Coupe' },
  { id: 'convertible', name: 'Convertible' },
]

const PAGE_SIZE = 30

export default function HomePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([])
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Fetch vehicles from Supabase with pagination
  const fetchVehicles = useCallback(async (pageNum: number, append: boolean = true) => {
    try {
      if (pageNum === 0) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      console.log(`🔍 Fetching vehicles page ${pageNum + 1}...`)

      const from = pageNum * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

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
        .eq('status', 'active')
        .or('Removed.is.null,Removed.eq.false')
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) {
        console.error('❌ Error fetching vehicles:', error)
        setError('Failed to load vehicles')
        setLoading(false)
        setLoadingMore(false)
        return
      }

      console.log(`✅ Found ${data?.length || 0} vehicles (page ${pageNum + 1})`)

      if (!data || data.length === 0) {
        setHasMore(false)
        setLoading(false)
        setLoadingMore(false)
        return
      }

      // Transform data for CarCard compatibility
      const transformedData = data.map((vehicle: any) => {
        const activePromotion = vehicle.vehicle_promotions?.find(
          (p: any) => p.is_active === true && p.status === 'active'
        )

        return {
          ...vehicle,
          // Remove hardcoded rating/reviews - CarCard will fetch dynamically
          location: formatLocation(vehicle.city, vehicle.country),
          conditionLabel: getConditionLabel(vehicle.condition),
          is_promoted: !!activePromotion,
          promotion_package: activePromotion?.package_type || null,
        }
      })

      // Sort: featured first, then by created_at
      const sortedData = transformedData.sort((a, b) => {
        if (a.featured && !b.featured) return -1
        if (!a.featured && b.featured) return 1
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })

      if (append) {
        setVehicles(prev => [...prev, ...sortedData])
        setAllVehicles(prev => [...prev, ...sortedData])
      } else {
        setVehicles(sortedData)
        setAllVehicles(sortedData)
      }

      setHasMore(data.length === PAGE_SIZE)
      setLoading(false)
      setLoadingMore(false)
      setIsInitialLoad(false)

    } catch (err) {
      console.error('❌ Unexpected error:', err)
      setError('An unexpected error occurred')
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchVehicles(0, false)
  }, [fetchVehicles])

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    if (loading || loadingMore || !hasMore || isInitialLoad) return

    const options = {
      root: null,
      rootMargin: '200px',
      threshold: 0,
    }

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
          setPage(prev => prev + 1)
          fetchVehicles(page + 1, true)
        }
      })
    }, options)

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [loading, loadingMore, hasMore, isInitialLoad, page, fetchVehicles])

  // Reset pagination when filters change
  useEffect(() => {
    // Reset everything when filters change
    setVehicles([])
    setAllVehicles([])
    setPage(0)
    setHasMore(true)
    setIsInitialLoad(true)
    fetchVehicles(0, false)
  }, [searchQuery, selectedCategory, selectedCondition, fetchVehicles])

  // Format location: first word of city + first 2 letters of country
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

  // Filter vehicles based on search, category, and condition (client-side filtering)
  useEffect(() => {
    let filtered = [...allVehicles]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(vehicle =>
        vehicle.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Category filter - including luxury special handling
    if (selectedCategory && selectedCategory !== 'all') {
      if (selectedCategory === 'luxury') {
        filtered = filtered.filter(car => car.luxury === true)
      } else {
        filtered = filtered.filter(car => car.category === selectedCategory)
      }
    }

    // Condition filter
    if (selectedCondition) {
      filtered = filtered.filter(vehicle =>
        vehicle.condition && vehicle.condition.toLowerCase() === selectedCondition.toLowerCase()
      )
    }

    // Sort: featured first, then by created_at
    filtered.sort((a, b) => {
      if (a.featured && !b.featured) return -1
      if (!a.featured && b.featured) return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    setFilteredVehicles(filtered)
  }, [searchQuery, selectedCategory, selectedCondition, allVehicles])

  // Handle category selection
  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId)
  }

  // Handle condition selection
  const handleConditionSelect = (condition: string | null) => {
    setSelectedCondition(condition)
  }

  // Loading state
  if (loading && isInitialLoad) {
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

      {/* Vehicle Categories - Now with condition filtering */}
      <VehicleCategory 
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategorySelect}
        selectedCondition={selectedCondition}
        onSelectCondition={handleConditionSelect}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Vehicles Grid */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {selectedCategory && selectedCategory !== 'all'
              ? `${categories.find(c => c.id === selectedCategory)?.name} Cars` 
              : 'Featured Cars'}
          </h2>
          <button 
            onClick={() => window.location.href = '/vehicles'}
            className="text-sm text-red-500 font-medium hover:text-red-400 transition-colors"
          >
            See All
          </button>
        </div>

        {filteredVehicles.length === 0 && !loading ? (
          <div className="text-center py-12">
            <p className="text-white/40">
              {selectedCategory && selectedCategory !== 'all'
                ? `No ${categories.find(c => c.id === selectedCategory)?.name} vehicles found`
                : 'No vehicles available'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredVehicles.map((vehicle, index) => (
                <motion.div
                  key={`${vehicle.id}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: Math.min(index * 0.05, 0.5),
                    duration: 0.4,
                    ease: "easeOut"
                  }}
                >
                  <CarCard 
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
                      // rating and reviews are removed - CarCard fetches dynamically
                    }} 
                    index={index} 
                  />
                </motion.div>
              ))}
            </div>

            {/* Load More Trigger */}
            {hasMore && !loading && (
              <div 
                ref={loadMoreRef}
                className="flex items-center justify-center py-8"
              >
                {loadingMore ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                    <span className="text-sm text-white/40">Loading more vehicles...</span>
                  </div>
                ) : (
                  <span className="text-xs text-white/20">Scroll for more</span>
                )}
              </div>
            )}

            {/* End of results */}
            {!hasMore && filteredVehicles.length > 0 && (
              <div className="text-center py-8">
                <p className="text-xs text-white/20">You've reached the end</p>
              </div>
            )}
          </>
        )}
      </div>
    </LayoutWrapper>
  )
}