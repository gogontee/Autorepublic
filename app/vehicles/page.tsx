'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Filter, Grid, List, ChevronDown, Loader2, AlertCircle, X, Sparkles, Crown, Star, Flame } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import VehicleCategory from '@/components/VehicleCategory'
import VehicleFilter from '@/components/VehicleFilter'
import CarCard from '@/components/CarCard'
import { supabase } from '@/lib/supabase/client'

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
  trim: string
  luxury?: boolean
  rating?: number
  reviews?: number
  location?: string
  conditionLabel?: string
  is_promoted?: boolean
  promotion_package?: string | null
  promotion_end_date?: string | null
  featured_until?: string | null
}

interface FilterState {
  brand: string
  model: string
  location: string
  color: string
  transmission: string
  minPrice: string
  maxPrice: string
  year: string
}

// Keys for localStorage
const STORAGE_KEYS = {
  SEARCH_HISTORY: 'vehicle_search_history',
  VIEW_MODE: 'vehicle_view_mode',
  SORT_BY: 'vehicle_sort_by'
}

const PAGE_SIZE = 30

// Promotion priority order
const PROMOTION_PRIORITY = {
  premium: 3,
  medium: 2,
  basic: 1,
  none: 0
}

export default function VehiclesPage() {
  const searchParams = useSearchParams()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [error, setError] = useState('')
  const [debugInfo, setDebugInfo] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{city: string, state: string, country: string} | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('newest')
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [promotedVehicles, setPromotedVehicles] = useState<Vehicle[]>([])
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    brand: '',
    model: '',
    location: '',
    color: '',
    transmission: '',
    minPrice: '',
    maxPrice: '',
    year: ''
  })

  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Load saved preferences from localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem(STORAGE_KEYS.VIEW_MODE)
    if (savedViewMode === 'list' || savedViewMode === 'grid') {
      setViewMode(savedViewMode)
    }

    const savedSort = localStorage.getItem(STORAGE_KEYS.SORT_BY)
    if (savedSort) {
      setSortBy(savedSort)
    }
  }, [])

  // Get search query from URL (from Header search)
  useEffect(() => {
    const search = searchParams?.get('search')
    if (search) {
      setSearchQuery(search)
      localStorage.setItem('vehicle_last_search', search)
    } else {
      const lastSearch = localStorage.getItem('vehicle_last_search')
      if (lastSearch) {
        setSearchQuery(lastSearch)
      }
    }
  }, [searchParams])

  // Save view mode to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VIEW_MODE, viewMode)
  }, [viewMode])

  // Save sort to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SORT_BY, sortBy)
  }, [sortBy])

  // Get user location from profile
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { data, error } = await supabase
            .from('users')
            .select('city, state, country')
            .eq('user_id', session.user.id)
            .single()

          if (!error && data) {
            setUserLocation({
              city: data.city || '',
              state: data.state || '',
              country: data.country || ''
            })
          }
        }
      } catch (err) {
        console.error('Error fetching user location:', err)
      }
    }

    getUserLocation()
  }, [])

  // Fetch vehicles from Supabase with pagination
  const fetchVehicles = useCallback(async (pageNum: number, append: boolean = true) => {
    try {
      if (pageNum === 0) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      setDebugInfo(`Fetching vehicles page ${pageNum + 1}...`)
      console.log(`🔍 Fetching vehicles page ${pageNum + 1}...`)

      const from = pageNum * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      // Fetch vehicles with promotion info
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
        setError(`Failed to load vehicles: ${error.message}`)
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

      // Transform data with promotion info
      const transformedData = data.map((vehicle: any) => {
        // Check if vehicle has an active promotion
        const activePromotion = vehicle.vehicle_promotions?.find(
          (p: any) => p.is_active === true && p.status === 'active'
        )

        return {
          ...vehicle,
          location: formatLocation(vehicle.city, vehicle.country),
          conditionLabel: getConditionLabel(vehicle.condition),
          is_promoted: !!activePromotion,
          promotion_package: activePromotion?.package_type || null,
          promotion_end_date: activePromotion?.end_date || null,
          featured_until: activePromotion?.end_date || null,
        }
      })

      if (append) {
        setVehicles(prev => [...prev, ...transformedData])
        setAllVehicles(prev => [...prev, ...transformedData])
      } else {
        setVehicles(transformedData)
        setAllVehicles(transformedData)
      }

      setHasMore(data.length === PAGE_SIZE)
      setLoading(false)
      setLoadingMore(false)
      setIsInitialLoad(false)

    } catch (err) {
      console.error('❌ Unexpected error:', err)
      setError('An unexpected error occurred')
      setDebugInfo(`Error: ${err}`)
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
    setVehicles([])
    setAllVehicles([])
    setPage(0)
    setHasMore(true)
    setIsInitialLoad(true)
    fetchVehicles(0, false)
  }, [searchQuery, selectedCategory, selectedCondition, activeFilters, sortBy, fetchVehicles])

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

  // Calculate location score for sorting
  const getLocationScore = (vehicle: Vehicle) => {
    if (!userLocation) return 0
    
    let score = 0
    const { city, state, country } = userLocation
    
    if (city && vehicle.city && vehicle.city.toLowerCase().includes(city.toLowerCase())) {
      score += 3
    }
    if (state && vehicle.state && vehicle.state.toLowerCase().includes(state.toLowerCase())) {
      score += 2
    }
    if (country && vehicle.country && vehicle.country.toLowerCase().includes(country.toLowerCase())) {
      score += 1
    }
    
    return score
  }

  // Check if vehicle matches search query
  const matchesSearch = (vehicle: Vehicle, query: string) => {
    if (!query) return true
    
    const searchLower = query.toLowerCase().trim()
    
    const searchFields = [
      vehicle.title,
      vehicle.brand,
      vehicle.model,
      vehicle.trim,
      vehicle.description,
      vehicle.category,
      vehicle.condition,
      vehicle.color,
      vehicle.interior_color,
      vehicle.engine_type,
      vehicle.car_code,
      vehicle.vin,
      `${vehicle.brand} ${vehicle.model}`,
      `${vehicle.year} ${vehicle.brand} ${vehicle.model}`
    ]
    
    return searchFields.some(field => 
      field && field.toLowerCase().includes(searchLower)
    )
  }

  // Get promotion priority score
  const getPromotionPriority = (vehicle: Vehicle) => {
    if (!vehicle.is_promoted || !vehicle.promotion_package) {
      return PROMOTION_PRIORITY.none
    }
    return PROMOTION_PRIORITY[vehicle.promotion_package as keyof typeof PROMOTION_PRIORITY] || 0
  }

  // Interleave promoted vehicles with non-promoted ones
  const interleaveVehicles = useCallback((filtered: Vehicle[]) => {
    // Separate promoted and non-promoted vehicles
    const promoted = filtered
      .filter(v => v.is_promoted && v.promotion_package)
      .sort((a, b) => {
        // Sort by priority: premium > medium > basic
        const priorityA = getPromotionPriority(a)
        const priorityB = getPromotionPriority(b)
        return priorityB - priorityA
      })

    const nonPromoted = filtered.filter(v => !v.is_promoted || !v.promotion_package)

    // If no promoted vehicles, return filtered as is
    if (promoted.length === 0) {
      return filtered
    }

    // Calculate how many promoted vehicles to show per batch
    // Premium: show more frequently, Medium: moderately, Basic: occasionally
    const result: Vehicle[] = []
    let promotedIndex = 0
    let nonPromotedIndex = 0

    // Define insertion patterns based on promotion type
    // Premium: show every 3-4 vehicles, Medium: every 5-6, Basic: every 8-10
    const getInsertionGap = (vehicle: Vehicle) => {
      const pkg = vehicle.promotion_package
      if (pkg === 'premium') return 2 // Show premium frequently
      if (pkg === 'medium') return 4
      if (pkg === 'basic') return 7
      return 5
    }

    let currentGap = 0
    let promotedBatch: Vehicle[] = []

    // Group promoted vehicles by package for better distribution
    const premiumVehicles = promoted.filter(v => v.promotion_package === 'premium')
    const mediumVehicles = promoted.filter(v => v.promotion_package === 'medium')
    const basicVehicles = promoted.filter(v => v.promotion_package === 'basic')

    // Create a distribution pool - premium gets more slots
    const distributionPool: Vehicle[] = []
    
    // Premium: add 3 times to pool for higher frequency
    premiumVehicles.forEach(v => {
      distributionPool.push(v, v, v)
    })
    
    // Medium: add 2 times
    mediumVehicles.forEach(v => {
      distributionPool.push(v, v)
    })
    
    // Basic: add 1 time
    basicVehicles.forEach(v => {
      distributionPool.push(v)
    })

    // Shuffle the distribution pool for randomness
    const shuffledPool = distributionPool.sort(() => Math.random() - 0.5)

    // Interleave with smart positioning
    let poolIndex = 0
    let counter = 0

    while (nonPromotedIndex < nonPromoted.length || poolIndex < shuffledPool.length) {
      // Add a promoted vehicle occasionally
      if (poolIndex < shuffledPool.length && (counter % getInsertionGap(shuffledPool[poolIndex]) === 0 || counter === 0)) {
        result.push(shuffledPool[poolIndex])
        poolIndex++
        counter = 0
      } else if (nonPromotedIndex < nonPromoted.length) {
        result.push(nonPromoted[nonPromotedIndex])
        nonPromotedIndex++
        counter++
      } else if (poolIndex < shuffledPool.length) {
        // If no more non-promoted, add remaining promoted
        result.push(shuffledPool[poolIndex])
        poolIndex++
      } else {
        break
      }
    }

    return result
  }, [])

  // Apply all filters and sorting with promotion interleaving
  const applyFilters = useCallback(() => {
    let filtered = [...allVehicles]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(vehicle => matchesSearch(vehicle, searchQuery))
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
      filtered = filtered.filter(car => 
        car.condition && car.condition.toLowerCase() === selectedCondition.toLowerCase()
      )
    }

    // Brand filter
    if (activeFilters.brand && activeFilters.brand !== '') {
      filtered = filtered.filter(car => 
        car.brand.toLowerCase().includes(activeFilters.brand.toLowerCase())
      )
    }

    // Model filter
    if (activeFilters.model && activeFilters.model !== '') {
      filtered = filtered.filter(car => 
        car.model.toLowerCase().includes(activeFilters.model.toLowerCase())
      )
    }

    // Location filter
    if (activeFilters.location && activeFilters.location !== '') {
      filtered = filtered.filter(car => 
        (car.city && car.city.toLowerCase().includes(activeFilters.location.toLowerCase())) ||
        (car.country && car.country.toLowerCase().includes(activeFilters.location.toLowerCase()))
      )
    }

    // Color filter
    if (activeFilters.color && activeFilters.color !== '') {
      filtered = filtered.filter(car => 
        car.color && car.color.toLowerCase().includes(activeFilters.color.toLowerCase())
      )
    }

    // Transmission filter
    if (activeFilters.transmission && activeFilters.transmission !== '') {
      filtered = filtered.filter(car => 
        car.transmission && car.transmission.toLowerCase().includes(activeFilters.transmission.toLowerCase())
      )
    }

    // Price filter
    if (activeFilters.minPrice && activeFilters.minPrice !== '') {
      const min = parseInt(activeFilters.minPrice)
      filtered = filtered.filter(car => car.price >= min)
    }

    if (activeFilters.maxPrice && activeFilters.maxPrice !== '') {
      const max = parseInt(activeFilters.maxPrice)
      filtered = filtered.filter(car => car.price <= max)
    }

    // Year filter
    if (activeFilters.year && activeFilters.year !== '') {
      filtered = filtered.filter(car => 
        car.year.toString() === activeFilters.year
      )
    }

    // Sort by location proximity first, then by selected sort
    filtered.sort((a, b) => {
      const scoreA = getLocationScore(a)
      const scoreB = getLocationScore(b)
      
      if (scoreA !== scoreB) {
        return scoreB - scoreA
      }
      
      switch (sortBy) {
        case 'newest':
          return b.year - a.year
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        case 'rating':
          const ratingA = a.rating || 0
          const ratingB = b.rating || 0
          return ratingB - ratingA
        default:
          return 0
      }
    })

    // Interleave promoted vehicles with non-promoted
    const interleaved = interleaveVehicles(filtered)
    setFilteredVehicles(interleaved)
  }, [allVehicles, searchQuery, selectedCategory, selectedCondition, activeFilters, sortBy, userLocation, interleaveVehicles])

  // Re-apply filters when any dependency changes
  useEffect(() => {
    if (allVehicles.length > 0) {
      applyFilters()
    }
  }, [allVehicles, selectedCategory, selectedCondition, activeFilters, sortBy, userLocation, searchQuery, applyFilters])

  // Handle filter changes from VehicleFilter component
  const handleFilterChange = (filters: FilterState) => {
    setActiveFilters(filters)
  }

  // Handle category selection
  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId)
  }

  // Handle condition selection
  const handleConditionSelect = (condition: string | null) => {
    setSelectedCondition(condition)
  }

  // Clear search
  const clearSearch = () => {
    setSearchQuery('')
    localStorage.removeItem('vehicle_last_search')
    window.history.replaceState({}, '', '/vehicles')
  }

  const getActiveFilterCount = () => {
    let count = Object.values(activeFilters).filter(v => v && v !== '').length
    if (selectedCategory && selectedCategory !== 'all') count++
    if (selectedCondition) count++
    if (searchQuery) count++
    return count
  }

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'grid' ? 'list' : 'grid')
  }

  const openFilter = () => {
    setIsFilterOpen(true)
  }

  // Get promotion badge details - SILVER THEME
  const getPromotionBadge = (vehicle: Vehicle) => {
    if (!vehicle.is_promoted || !vehicle.promotion_package) return null
    
    const packageMap = {
      premium: { 
        icon: Crown, 
        label: 'Premium', 
        color: 'text-white bg-white/15 border-white/30',
        glow: 'shadow-white/10'
      },
      medium: { 
        icon: Star, 
        label: 'Featured', 
        color: 'text-white/90 bg-white/10 border-white/25',
        glow: 'shadow-white/10'
      },
      basic: { 
        icon: Flame, 
        label: 'Boosted', 
        color: 'text-white/80 bg-white/8 border-white/20',
        glow: 'shadow-white/5'
      }
    }
    
    return packageMap[vehicle.promotion_package as keyof typeof packageMap] || null
  }

  // Loading state
  if (loading && isInitialLoad) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
          <span className="text-white/60 ml-3">Loading vehicles...</span>
        </div>
        <BottomNav />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-white/60">{error}</p>
            {debugInfo && (
              <p className="text-xs text-white/30 mt-2">Debug: {debugInfo}</p>
            )}
            <button 
              onClick={() => window.location.reload()}
              className="inline-block mt-4 px-6 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-medium text-white transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="pb-24 md:pb-6">
        {/* Sticky Category Bar - Now sticky with z-index */}
        <div className="sticky top-14 md:top-16 z-30 bg-black/95 backdrop-blur-md border-b border-white/5">
          <VehicleCategory 
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategorySelect}
            selectedCondition={selectedCondition}
            onSelectCondition={handleConditionSelect}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1 sm:py-2">
          {/* Search Query Display */}
          {searchQuery && (
            <div className="flex items-center gap-2 mb-3 px-3 py-1.5 bg-white/5 rounded-full w-fit">
              <span className="text-xs text-white/40">Search results for:</span>
              <span className="text-xs font-medium text-white">"{searchQuery}"</span>
              <button
                onClick={clearSearch}
                className="text-white/40 hover:text-white/60 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Sticky Filter Bar */}
          <div className="sticky top-[calc(14+56px)] md:top-[calc(16+64px)] z-20 bg-black/95 backdrop-blur-md -mx-4 px-4 py-1 sm:py-2 border-b border-white/5">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={openFilter}
                  className="flex items-center gap-1 px-2 py-0.5 bg-white/5 hover:bg-white/10 rounded-full text-[10px] font-medium text-white/80 transition-colors border border-white/5 hover:border-white/10"
                >
                  <Filter className="w-2.5 h-2.5" />
                  <span className="hidden sm:inline text-[10px]">Filters</span>
                  {getActiveFilterCount() > 0 && (
                    <span className="px-1 py-0.5 bg-red-500 text-white rounded-full text-[8px]">
                      {getActiveFilterCount()}
                    </span>
                  )}
                </button>
                {/* Vehicle count removed - no longer displayed */}
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <div className="relative">
                  <button
                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                    className="flex items-center gap-1 px-2 py-0.5 bg-white/5 hover:bg-white/10 rounded-full text-[10px] font-medium text-white/80 transition-colors border border-white/5 hover:border-white/10 whitespace-nowrap"
                  >
                    <span className="hidden xs:inline text-[10px]">Sort:</span>
                    {sortBy === 'newest' ? 'Newest' : 
                     sortBy === 'price-low' ? 'Price ↑' :
                     sortBy === 'price-high' ? 'Price ↓' :
                     'Rating'}
                    <ChevronDown className="w-2 h-2" />
                  </button>

                  {showSortDropdown && (
                    <div className="absolute right-0 mt-1 w-32 bg-black border border-white/10 rounded-xl shadow-xl z-10 overflow-hidden">
                      {[
                        { value: 'newest', label: 'Newest' },
                        { value: 'price-low', label: 'Price: Low to High' },
                        { value: 'price-high', label: 'Price: High to Low' },
                        { value: 'rating', label: 'Rating' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSortBy(option.value)
                            setShowSortDropdown(false)
                          }}
                          className={`w-full px-2.5 py-1.5 text-[10px] text-left hover:bg-white/5 transition-colors ${
                            sortBy === option.value ? 'text-red-500' : 'text-white/60'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={toggleViewMode}
                  className="md:hidden p-0.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/5 hover:border-white/10"
                  aria-label={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
                >
                  {viewMode === 'grid' ? (
                    <List className="w-3 h-3 text-white/60" />
                  ) : (
                    <Grid className="w-3 h-3 text-white/60" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {allVehicles.length === 0 && !loading ? (
            <div className="text-center py-12">
              <div className="text-white/40 text-sm mb-2">No vehicles available</div>
              {debugInfo && (
                <div className="text-xs text-white/30">{debugInfo}</div>
              )}
            </div>
          ) : (
            <>
              <div className={`
                grid gap-1.5 sm:gap-2 pt-2
                ${viewMode === 'grid' 
                  ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                  : 'grid-cols-1'
                }
              `}>
                {filteredVehicles.map((car, index) => {
                  const promotionBadge = getPromotionBadge(car)
                  const isPromoted = car.is_promoted && car.promotion_package
                  const delay = index * 0.05

                  return (
                    <motion.div
                      key={`${car.id}-${index}`}
                      initial={{ opacity: 0, y: isPromoted ? 30 : 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        delay: Math.min(delay, 0.5),
                        duration: isPromoted ? 0.6 : 0.4,
                        ease: isPromoted ? [0.34, 1.56, 0.64, 1] : "easeOut",
                        type: isPromoted ? "spring" : "tween",
                        stiffness: isPromoted ? 100 : undefined,
                        damping: isPromoted ? 12 : undefined
                      }}
                      className={isPromoted ? 'relative' : ''}
                    >
                      {isPromoted && promotionBadge && (
                        <motion.div 
                          className={`absolute -top-1 -left-1 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-medium ${promotionBadge.color} border shadow-lg ${promotionBadge.glow} backdrop-blur-sm`}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: Math.min(delay + 0.2, 0.7), type: "spring", stiffness: 200 }}
                        >
                          <promotionBadge.icon className="w-2.5 h-2.5" />
                          {promotionBadge.label}
                        </motion.div>
                      )}
                      
                      {isPromoted && (
                        <motion.div 
                          className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: Math.min(delay + 0.1, 0.6), duration: 0.5 }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
                          <div className="absolute inset-0 border rounded-xl border-white/10" />
                        </motion.div>
                      )}

                      <CarCard 
                        car={{
                          id: car.id,
                          title: car.title,
                          brand: car.brand,
                          model: car.model,
                          year: car.year,
                          price: car.price,
                          mileage: car.mileage || 'N/A',
                          fuel_type: car.fuel_type,
                          transmission: car.transmission,
                          cover_image: car.cover_image,
                          images: car.images,
                          location: car.location || formatLocation(car.city, car.country),
                          conditionLabel: car.conditionLabel || getConditionLabel(car.condition),
                          condition: car.condition,
                          car_code: car.car_code || undefined,
                          is_promoted: car.is_promoted || false,
                          promotion_package: car.promotion_package || undefined,
                        }} 
                        index={index} 
                      />
                    </motion.div>
                  )
                })}
              </div>

              {/* Load More Trigger */}
              {hasMore && !loading && filteredVehicles.length > 0 && (
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

              {filteredVehicles.length === 0 && allVehicles.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-white/40 text-sm">
                    {searchQuery 
                      ? `No vehicles found matching "${searchQuery}"`
                      : 'No vehicles found matching your criteria'
                    }
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <VehicleFilter
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onFilterChange={handleFilterChange}
      />

      <BottomNav />
    </div>
  )
}