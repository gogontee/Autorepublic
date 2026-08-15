'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Filter, Grid, List, ChevronDown, Loader2, AlertCircle, X, Crown, Star, Flame, Info } from 'lucide-react'
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
  lga: string
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
  trim: string
  location: string
  color: string
  transmission: string
  minPrice: string
  maxPrice: string
  year: string
}

// Cache for location data
let locationCache: { [state: string]: any[] } = {}

const STORAGE_KEYS = {
  VIEW_MODE: 'vehicle_view_mode',
  SORT_BY: 'vehicle_sort_by',
  FILTERS: 'vehicle_filters',
  SELECTED_STATE: 'vehicle_selected_state',
  SELECTED_CITY: 'vehicle_selected_city',
  SELECTED_CATEGORY: 'vehicle_selected_category',
  SELECTED_CONDITION: 'vehicle_selected_condition',
  SEARCH_QUERY: 'vehicle_search_query'
}

const PAGE_SIZE = 30

const PROMOTION_PRIORITY = {
  premium: 3,
  medium: 2,
  basic: 1,
  none: 0
}

function VehiclesContent() {
  const searchParams = useSearchParams()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const [error, setError] = useState('')
  const [debugInfo, setDebugInfo] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null)
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [selectedLGA, setSelectedLGA] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{city: string, state: string, country: string} | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('newest')
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    brand: '',
    model: '',
    trim: '',
    location: '',
    color: '',
    transmission: '',
    minPrice: '',
    maxPrice: '',
    year: ''
  })
  const [isFetching, setIsFetching] = useState(false)
  const [locationMessage, setLocationMessage] = useState<string | null>(null)
  const [locationInfo, setLocationInfo] = useState<{exactCity: boolean, lga: string | null, state: string | null} | null>(null)
  const [isRestoringState, setIsRestoringState] = useState(true)

  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Load saved preferences and filters on mount
  useEffect(() => {
    const savedViewMode = localStorage.getItem(STORAGE_KEYS.VIEW_MODE)
    if (savedViewMode === 'list' || savedViewMode === 'grid') {
      setViewMode(savedViewMode)
    }

    const savedSort = localStorage.getItem(STORAGE_KEYS.SORT_BY)
    if (savedSort) {
      setSortBy(savedSort)
    }

    // Load saved filters
    const savedFilters = localStorage.getItem(STORAGE_KEYS.FILTERS)
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters)
        setActiveFilters(parsed)
      } catch (e) {
        console.error('Error loading saved filters:', e)
      }
    }

    // Load saved location
    const savedState = localStorage.getItem(STORAGE_KEYS.SELECTED_STATE)
    if (savedState && savedState !== 'null') {
      setSelectedState(savedState)
    }

    const savedCity = localStorage.getItem(STORAGE_KEYS.SELECTED_CITY)
    if (savedCity && savedCity !== 'null') {
      setSelectedCity(savedCity)
    }

    const savedCategory = localStorage.getItem(STORAGE_KEYS.SELECTED_CATEGORY)
    if (savedCategory && savedCategory !== 'null') {
      setSelectedCategory(savedCategory)
    }

    const savedCondition = localStorage.getItem(STORAGE_KEYS.SELECTED_CONDITION)
    if (savedCondition && savedCondition !== 'null') {
      setSelectedCondition(savedCondition)
    }

    const savedSearch = localStorage.getItem(STORAGE_KEYS.SEARCH_QUERY)
    if (savedSearch) {
      setSearchQuery(savedSearch)
    }

    setIsRestoringState(false)
  }, [])

  // Get search query from URL (overrides saved search)
  useEffect(() => {
    const search = searchParams?.get('search')
    if (search) {
      setSearchQuery(search)
    }
  }, [searchParams])

  // Save filters whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FILTERS, JSON.stringify(activeFilters))
  }, [activeFilters])

  // Save location state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SELECTED_STATE, selectedState || 'null')
  }, [selectedState])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SELECTED_CITY, selectedCity || 'null')
  }, [selectedCity])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SELECTED_CATEGORY, selectedCategory || 'null')
  }, [selectedCategory])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SELECTED_CONDITION, selectedCondition || 'null')
  }, [selectedCondition])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SEARCH_QUERY, searchQuery || '')
  }, [searchQuery])

  // Save view mode and sort
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VIEW_MODE, viewMode)
  }, [viewMode])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SORT_BY, sortBy)
  }, [sortBy])

  // CRITICAL FIX: Trigger fetch when state is restored
  useEffect(() => {
    if (!isRestoringState && !initialLoadDone && !isFetching) {
      fetchVehicles(0, false)
    }
  }, [isRestoringState])

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

  // Get location data for a state
  const getLocationData = useCallback(async (state: string) => {
    if (locationCache[state]) {
      return locationCache[state]
    }

    try {
      const response = await fetch(`/api/locations/cities?state=${encodeURIComponent(state)}`)
      if (!response.ok) throw new Error('Failed to fetch location data')
      const data = await response.json()
      locationCache[state] = data.cities || []
      return locationCache[state]
    } catch (error) {
      console.error('Error fetching location data:', error)
      return []
    }
  }, [])

  // Find LGA for a city name from location data
  const findLGAForCity = useCallback((cityName: string, locationData: any[]) => {
    const cityObj = locationData.find((item: any) => 
      item.name && item.name.toLowerCase() === cityName.toLowerCase()
    )
    return cityObj?.lga || null
  }, [])

  // Get all cities in the same LGA
  const getCitiesInLGA = useCallback((lga: string, locationData: any[]) => {
    return locationData
      .filter((item: any) => item.lga === lga)
      .map((item: any) => item.name)
  }, [])

  // Build the Supabase query with location priority
  const buildQuery = useCallback(async (from: number, to: number) => {
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
        ),
        vehicle_ratings!left (
          rating
        )
      `, { count: 'exact' })
      .eq('status', 'active')
      .or('Removed.is.null,Removed.eq.false')

    // Apply state filter (always applied if selected)
    if (selectedState) {
      query = query.eq('state', selectedState)
    }

    // Handle city filter with priority: exact city -> LGA -> state
    if (selectedCity) {
      const locationData = await getLocationData(selectedState || '')
      const lga = findLGAForCity(selectedCity, locationData)
      
      if (lga) {
        const citiesInLGA = getCitiesInLGA(lga, locationData)
        
        query = query.or(
          `city.ilike.%${selectedCity}%,lga.eq.${lga},state.eq.${selectedState}`
        )
        
        setSelectedLGA(lga)
        setLocationInfo({
          exactCity: false,
          lga: lga,
          state: selectedState
        })
        
        if (citiesInLGA.length > 1) {
          setLocationMessage(`Showing vehicles in "${selectedCity}" and other locations in ${lga} LGA`)
        } else {
          setLocationMessage(`Showing vehicles in "${selectedCity}" (${lga} LGA)`)
        }
      } else {
        query = query.or(
          `city.ilike.%${selectedCity}%,state.eq.${selectedState}`
        )
        setSelectedLGA(null)
        setLocationInfo({
          exactCity: false,
          lga: null,
          state: selectedState
        })
        setLocationMessage(`Showing vehicles in "${selectedCity}" area`)
      }
    } else {
      setSelectedLGA(null)
      setLocationInfo(null)
      setLocationMessage(null)
    }

    // Apply condition filter
    if (selectedCondition) {
      query = query.eq('condition', selectedCondition)
    }

    // Apply category filter
    if (selectedCategory && selectedCategory !== 'all') {
      if (selectedCategory === 'luxury') {
        query = query.eq('luxury', true)
      } else {
        query = query.eq('category', selectedCategory)
      }
    }

    // Apply brand filter from VehicleFilter
    if (activeFilters.brand && activeFilters.brand !== '') {
      query = query.ilike('brand', `%${activeFilters.brand}%`)
    }

    // Apply model filter from VehicleFilter
    if (activeFilters.model && activeFilters.model !== '') {
      query = query.ilike('model', `%${activeFilters.model}%`)
    }

    // Apply trim filter from VehicleFilter
    if (activeFilters.trim && activeFilters.trim !== '') {
      query = query.ilike('trim', `%${activeFilters.trim}%`)
    }

    // Apply location filter from VehicleFilter
    if (activeFilters.location && activeFilters.location !== '') {
      query = query.or(
        `city.ilike.%${activeFilters.location}%,country.ilike.%${activeFilters.location}%`
      )
    }

    // Apply color filter from VehicleFilter
    if (activeFilters.color && activeFilters.color !== '') {
      query = query.ilike('color', `%${activeFilters.color}%`)
    }

    // Apply transmission filter from VehicleFilter
    if (activeFilters.transmission && activeFilters.transmission !== '') {
      query = query.ilike('transmission', `%${activeFilters.transmission}%`)
    }

    // Apply price filters
    if (activeFilters.minPrice && activeFilters.minPrice !== '') {
      const min = parseInt(activeFilters.minPrice)
      query = query.gte('price', min)
    }

    if (activeFilters.maxPrice && activeFilters.maxPrice !== '') {
      const max = parseInt(activeFilters.maxPrice)
      query = query.lte('price', max)
    }

    // Apply year filter
    if (activeFilters.year && activeFilters.year !== '') {
      query = query.eq('year', parseInt(activeFilters.year))
    }

    // Apply search query
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      query = query.or(
        `title.ilike.%${searchLower}%,brand.ilike.%${searchLower}%,model.ilike.%${searchLower}%,description.ilike.%${searchLower}%`
      )
    }

    // Apply sorting based on sortBy
    switch (sortBy) {
      case 'newest':
        query = query.order('created_at', { ascending: false })
        break
      case 'price-low':
        query = query.order('price', { ascending: true })
        break
      case 'price-high':
        query = query.order('price', { ascending: false })
        break
      case 'rating':
        query = query.order('created_at', { ascending: false })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    return query.range(from, to)
  }, [selectedState, selectedCity, selectedCondition, selectedCategory, searchQuery, sortBy, activeFilters, getLocationData, findLGAForCity, getCitiesInLGA])

  // Sort vehicles by promotion priority and rating
  const sortByPromotionPriority = useCallback((vehicles: Vehicle[]) => {
    return vehicles.sort((a, b) => {
      const priorityA = a.is_promoted ? 
        (a.promotion_package === 'premium' ? 3 : 
         a.promotion_package === 'medium' ? 2 : 
         a.promotion_package === 'basic' ? 1 : 0) : 0
      const priorityB = b.is_promoted ? 
        (b.promotion_package === 'premium' ? 3 : 
         b.promotion_package === 'medium' ? 2 : 
         b.promotion_package === 'basic' ? 1 : 0) : 0
      
      return priorityB - priorityA
    })
  }, [])

  // Sort vehicles by rating (highest first)
  const sortByRating = useCallback((vehicles: Vehicle[]) => {
    return vehicles.sort((a, b) => {
      const ratingA = a.rating || 0
      const ratingB = b.rating || 0
      return ratingB - ratingA
    })
  }, [])

  // Fetch vehicles
  const fetchVehicles = useCallback(async (pageNum: number, append: boolean = true) => {
    if (isFetching) return
    
    try {
      setIsFetching(true)
      
      if (pageNum === 0) {
        setLoading(true)
        setLocationMessage(null)
      } else {
        setLoadingMore(true)
      }

      const from = pageNum * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      const query = await buildQuery(from, to)
      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching vehicles:', error)
        setError(`Failed to load vehicles: ${error.message}`)
        setLoading(false)
        setLoadingMore(false)
        setIsFetching(false)
        return
      }

      if (!data || data.length === 0) {
        setHasMore(false)
        setLoading(false)
        setLoadingMore(false)
        setIsFetching(false)
        
        if (selectedCity && selectedState) {
          const locationData = await getLocationData(selectedState)
          const lga = findLGAForCity(selectedCity, locationData)
          
          if (lga) {
            setLocationMessage(`No vehicles found in "${selectedCity}" or ${lga} LGA. Showing all vehicles in ${selectedState}.`)
          } else {
            setLocationMessage(`No vehicles found in "${selectedCity}". Showing all vehicles in ${selectedState}.`)
          }
        }
        return
      }

      // Transform data with promotion info and ratings
      const transformedData = data.map((vehicle: any) => {
        const activePromotion = vehicle.vehicle_promotions?.find(
          (p: any) => p.is_active === true && p.status === 'active'
        )

        // Calculate average rating from vehicle_ratings
        let avgRating = 0
        if (vehicle.vehicle_ratings && vehicle.vehicle_ratings.length > 0) {
          const total = vehicle.vehicle_ratings.reduce((sum: number, r: any) => sum + (r.rating || 0), 0)
          avgRating = total / vehicle.vehicle_ratings.length
        }

        return {
          ...vehicle,
          location: formatLocation(vehicle.city, vehicle.country),
          conditionLabel: getConditionLabel(vehicle.condition),
          is_promoted: !!activePromotion,
          promotion_package: activePromotion?.package_type || null,
          promotion_end_date: activePromotion?.end_date || null,
          featured_until: activePromotion?.end_date || null,
          rating: avgRating || 0,
        }
      })

      // Apply sorting based on sortBy
      let sortedData = transformedData
      
      // First sort by promotion priority
      sortedData = sortByPromotionPriority(sortedData)
      
      // Then apply the selected sort
      if (sortBy === 'rating') {
        sortedData = sortByRating(sortedData)
      }

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
      setInitialLoadDone(true)
      setIsFetching(false)

    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred')
      setDebugInfo(`Error: ${err}`)
      setLoading(false)
      setLoadingMore(false)
      setIsFetching(false)
    }
  }, [buildQuery, isFetching, selectedCity, selectedState, getLocationData, findLGAForCity, sortByPromotionPriority, sortByRating, sortBy])

  // Initial load - only runs when not restoring state
  useEffect(() => {
    if (!isRestoringState && !initialLoadDone && !isFetching) {
      fetchVehicles(0, false)
    }
  }, [isRestoringState])

  // Fetch when filters change - but only after initial load
  useEffect(() => {
    if (!initialLoadDone || isRestoringState) return
    
    setVehicles([])
    setAllVehicles([])
    setFilteredVehicles([])
    setPage(0)
    setHasMore(true)
    fetchVehicles(0, false)
  }, [selectedState, selectedCity, selectedCategory, selectedCondition, searchQuery, sortBy, activeFilters])

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    if (loading || loadingMore || !hasMore || !initialLoadDone) return

    const options = {
      root: null,
      rootMargin: '200px',
      threshold: 0,
    }

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && hasMore && !loadingMore && !loading && !isFetching) {
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
  }, [loading, loadingMore, hasMore, initialLoadDone, page, fetchVehicles, isFetching])

  // Apply interleaving for promoted vehicles
  const interleaveVehicles = useCallback((filtered: Vehicle[]) => {
    const promoted = filtered.filter(v => v.is_promoted)
    const nonPromoted = filtered.filter(v => !v.is_promoted)

    if (promoted.length === 0) {
      return filtered
    }

    const premium = promoted.filter(v => v.promotion_package === 'premium')
    const medium = promoted.filter(v => v.promotion_package === 'medium')
    const basic = promoted.filter(v => v.promotion_package === 'basic')

    const result: Vehicle[] = []
    const distributionPool: Vehicle[] = []
    
    premium.forEach(v => distributionPool.push(v, v, v))
    medium.forEach(v => distributionPool.push(v, v))
    basic.forEach(v => distributionPool.push(v))

    let poolIndex = 0
    let nonPromotedIndex = 0

    while (nonPromotedIndex < nonPromoted.length || poolIndex < distributionPool.length) {
      if (poolIndex < distributionPool.length && (result.length % 3 === 0 || result.length === 0)) {
        result.push(distributionPool[poolIndex])
        poolIndex++
      } else if (nonPromotedIndex < nonPromoted.length) {
        result.push(nonPromoted[nonPromotedIndex])
        nonPromotedIndex++
      } else {
        result.push(distributionPool[poolIndex])
        poolIndex++
      }
    }

    return result
  }, [])

  // Apply interleaving to vehicles
  useEffect(() => {
    if (allVehicles.length === 0) {
      setFilteredVehicles([])
      return
    }

    const interleaved = interleaveVehicles(allVehicles)
    setFilteredVehicles(interleaved)
  }, [allVehicles, interleaveVehicles])

  // Handle filter changes from VehicleFilter
  const handleFilterChange = (filters: FilterState) => {
    console.log('Filter changed:', filters)
    setActiveFilters(filters)
  }

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId)
  }

  const handleConditionSelect = (condition: string | null) => {
    setSelectedCondition(condition)
  }

  const handleStateSelect = (state: string | null) => {
    setSelectedState(state)
    setLocationMessage(null)
    setSelectedLGA(null)
    setLocationInfo(null)
    if (state === null) {
      setSelectedCity(null)
      locationCache = {}
    }
  }

  const handleCitySelect = (city: string | null) => {
    setSelectedCity(city)
    setSelectedLGA(null)
    setLocationMessage(null)
    setLocationInfo(null)
  }

  const clearSearch = () => {
    setSearchQuery('')
    window.history.replaceState({}, '', '/vehicles')
  }

  const getActiveFilterCount = () => {
    let count = Object.values(activeFilters).filter(v => v && v !== '').length
    if (selectedCategory && selectedCategory !== 'all') count++
    if (selectedCondition) count++
    if (selectedState) count++
    if (selectedCity) count++
    if (searchQuery) count++
    return count
  }

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'grid' ? 'list' : 'grid')
  }

  const openFilter = () => {
    setIsFilterOpen(true)
  }

  // Get promotion badge
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
  if (!initialLoadDone && loading) {
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
  if (error && !initialLoadDone) {
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
        {/* Sticky Category Bar */}
        <div className="sticky top-14 md:top-16 z-30 bg-black/95 backdrop-blur-md border-b border-white/5">
          <VehicleCategory 
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategorySelect}
            selectedCondition={selectedCondition}
            onSelectCondition={handleConditionSelect}
            selectedState={selectedState}
            onSelectState={handleStateSelect}
            selectedCity={selectedCity}
            onSelectCity={handleCitySelect}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1 sm:py-2">
          {/* Location Message */}
          {locationMessage && (
            <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              <p className="text-[10px] text-blue-300">{locationMessage}</p>
            </div>
          )}

          {/* Active Filters Display */}
          {(selectedState || selectedCity || selectedCategory || selectedCondition || searchQuery || 
            Object.values(activeFilters).some(v => v && v !== '')) && (
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {selectedState && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-400 rounded-full text-[10px]">
                  📍 {selectedState}
                  <button onClick={() => handleStateSelect(null)} className="hover:text-red-300">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}
              {selectedCity && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-400 rounded-full text-[10px]">
                  🏙️ {selectedCity}
                  <button onClick={() => handleCitySelect(null)} className="hover:text-red-300">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}
              {selectedLGA && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full text-[10px]">
                  📌 {selectedLGA} LGA
                  <button onClick={() => {
                    setSelectedLGA(null)
                    setSelectedCity(null)
                  }} className="hover:text-blue-300">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}
              {selectedCategory && selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-400 rounded-full text-[10px]">
                  {selectedCategory}
                  <button onClick={() => handleCategorySelect(null)} className="hover:text-red-300">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}
              {selectedCondition && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-400 rounded-full text-[10px]">
                  {selectedCondition}
                  <button onClick={() => handleConditionSelect(null)} className="hover:text-red-300">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-400 rounded-full text-[10px]">
                  "{searchQuery}"
                  <button onClick={clearSearch} className="hover:text-red-300">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}
              {/* Show active filter badges from VehicleFilter */}
              {activeFilters.brand && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-400 rounded-full text-[10px]">
                  Brand: {activeFilters.brand}
                  <button onClick={() => setActiveFilters(prev => ({ ...prev, brand: '' }))} className="hover:text-red-300">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}
              {activeFilters.model && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-400 rounded-full text-[10px]">
                  Model: {activeFilters.model}
                  <button onClick={() => setActiveFilters(prev => ({ ...prev, model: '' }))} className="hover:text-red-300">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}
              {activeFilters.trim && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-400 rounded-full text-[10px]">
                  Trim: {activeFilters.trim}
                  <button onClick={() => setActiveFilters(prev => ({ ...prev, trim: '' }))} className="hover:text-red-300">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}
              {activeFilters.color && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-400 rounded-full text-[10px]">
                  Color: {activeFilters.color}
                  <button onClick={() => setActiveFilters(prev => ({ ...prev, color: '' }))} className="hover:text-red-300">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}
              {activeFilters.transmission && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-400 rounded-full text-[10px]">
                  Transmission: {activeFilters.transmission}
                  <button onClick={() => setActiveFilters(prev => ({ ...prev, transmission: '' }))} className="hover:text-red-300">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}
              {activeFilters.year && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-400 rounded-full text-[10px]">
                  Year: {activeFilters.year}
                  <button onClick={() => setActiveFilters(prev => ({ ...prev, year: '' }))} className="hover:text-red-300">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}
              {getActiveFilterCount() > 0 && (
                <button 
                  onClick={() => {
                    setSelectedState(null)
                    setSelectedCity(null)
                    setSelectedLGA(null)
                    setSelectedCategory(null)
                    setSelectedCondition(null)
                    setSearchQuery('')
                    setLocationMessage(null)
                    setLocationInfo(null)
                    setActiveFilters({
                      brand: '',
                      model: '',
                      trim: '',
                      location: '',
                      color: '',
                      transmission: '',
                      minPrice: '',
                      maxPrice: '',
                      year: ''
                    })
                    locationCache = {}
                  }}
                  className="text-[10px] text-red-400 hover:text-red-300"
                >
                  Clear All
                </button>
              )}
            </div>
          )}

          {/* Filter Bar */}
          <div className="sticky top-[calc(14+56px)] md:top-[calc(16+64px)] z-20 bg-black/95 backdrop-blur-md -mx-4 px-4 py-1 sm:py-2 border-b border-white/5">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={openFilter}
                  className="flex items-center gap-1 px-2 py-0.5 bg-white/5 hover:bg-white/10 rounded-full text-[10px] font-medium text-white/80 transition-colors border border-white/5 hover:border-white/10"
                >
                  <Filter className="w-2.5 h-2.5" />
                  <span className="text-[10px]">Filters</span>
                  {getActiveFilterCount() > 0 && (
                    <span className="px-1 py-0.5 bg-red-500 text-white rounded-full text-[8px]">
                      {getActiveFilterCount()}
                    </span>
                  )}
                </button>
                <span className="text-[10px] text-white/30 ml-2">
                  {loading ? 'Loading...' : `${filteredVehicles.length} vehicles`}
                </span>
                {loading && (
                  <Loader2 className="w-3 h-3 text-red-500 animate-spin ml-1" />
                )}
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
              <div className="text-white/40 text-sm mb-2">
                {selectedCity 
                  ? `No vehicles found in "${selectedCity}" area${selectedState ? `, ${selectedState}` : ''}`
                  : selectedState 
                    ? `No vehicles found in ${selectedState}` 
                    : 'No vehicles available'
                }
              </div>
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
                          rating: car.rating || 0,
                        }} 
                        index={index} 
                      />
                    </motion.div>
                  )
                })}
              </div>

              {/* Load More Trigger */}
              {hasMore && !loading && filteredVehicles.length > 0 && (
                <div ref={loadMoreRef} className="flex items-center justify-center py-8">
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

              {!hasMore && filteredVehicles.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-xs text-white/20">You've reached the end</p>
                </div>
              )}

              {filteredVehicles.length === 0 && allVehicles.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-white/40 text-sm">
                    No vehicles found matching your criteria
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
        selectedState={selectedState}
        selectedCity={selectedCity}
        onStateChange={handleStateSelect}
        onCityChange={handleCitySelect}
      />

      <BottomNav />
    </div>
  )
}

export default function VehiclesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/60">Loading vehicles...</div>
      </div>
    }>
      <VehiclesContent />
    </Suspense>
  )
}