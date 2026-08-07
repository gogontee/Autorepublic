'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Filter, Grid, List, ChevronDown, Loader2, AlertCircle, X, Search, Menu, Car, Zap, LayoutGrid, Sparkles } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
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
  featured?: boolean
  location?: string
  conditionLabel?: string
  is_promoted?: boolean
  promotion_package?: string | null
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

// Category dropdown options - Luxury page (exclude luxury)
const categories = [
  { id: 'all', label: 'All Vehicles', href: '/vehicles', icon: LayoutGrid },
  { id: 'collections', label: 'AR Collections', href: '/collections', icon: Sparkles },
  { id: 'sports', label: 'Sports Cars', href: '/sports', icon: Car },
  { id: 'evs', label: 'EV Cars', href: '/evs', icon: Zap },
]

const conditionFilters = [
  { id: 'all', label: 'All' },
  { id: 'brand-new', label: 'Brand New' },
  { id: 'foreign-used', label: 'Foreign Used' },
  { id: 'local-used', label: 'Local Used' },
]

// Keys for localStorage
const STORAGE_KEYS = {
  VIEW_MODE: 'luxury_view_mode',
  SORT_BY: 'luxury_sort_by',
  CONDITION: 'luxury_condition'
}

function LuxuryContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [debugInfo, setDebugInfo] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('newest')
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
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

    const savedCondition = localStorage.getItem(STORAGE_KEYS.CONDITION)
    if (savedCondition) {
      setSelectedCondition(savedCondition)
    }
  }, [])

  // Get search query from URL
  useEffect(() => {
    const search = searchParams?.get('search')
    if (search) {
      setSearchQuery(search)
      localStorage.setItem('luxury_last_search', search)
    } else {
      const lastSearch = localStorage.getItem('luxury_last_search')
      if (lastSearch) {
        setSearchQuery(lastSearch)
      }
    }
  }, [searchParams])

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VIEW_MODE, viewMode)
  }, [viewMode])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SORT_BY, sortBy)
  }, [sortBy])

  useEffect(() => {
    if (selectedCondition) {
      localStorage.setItem(STORAGE_KEYS.CONDITION, selectedCondition)
    } else {
      localStorage.removeItem(STORAGE_KEYS.CONDITION)
    }
  }, [selectedCondition])

  // Fetch luxury vehicles from Supabase
  useEffect(() => {
    const fetchLuxuryVehicles = async () => {
      try {
        setDebugInfo('Fetching luxury vehicles...')
        console.log('🔍 Fetching luxury vehicles from Supabase...')

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
          .eq('luxury', true)
          .or('Removed.is.null,Removed.eq.false')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('❌ Error fetching luxury vehicles:', error)
          setError(`Failed to load luxury vehicles: ${error.message}`)
          setDebugInfo(`Error: ${error.message}`)
          setLoading(false)
          return
        }

        if (!data || data.length === 0) {
          setVehicles([])
          setFilteredVehicles([])
          setLoading(false)
          return
        }

        // Transform data with promotion info
        const transformedData = data.map((vehicle: any) => {
          const activePromotion = vehicle.vehicle_promotions?.find(
            (p: any) => p.is_active === true && p.status === 'active'
          )

          return {
            ...vehicle,
            location: formatLocation(vehicle.city, vehicle.country),
            conditionLabel: getConditionLabel(vehicle.condition),
            is_promoted: !!activePromotion,
            promotion_package: activePromotion?.package_type || null,
          }
        })

        setVehicles(transformedData)
        setFilteredVehicles(transformedData)
        setLoading(false)
      } catch (err) {
        console.error('❌ Unexpected error:', err)
        setError('An unexpected error occurred')
        setDebugInfo(`Error: ${err}`)
        setLoading(false)
      }
    }

    fetchLuxuryVehicles()
  }, [])

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

  // Apply all filters and sorting
  const applyFilters = () => {
    let filtered = [...vehicles]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(vehicle => matchesSearch(vehicle, searchQuery))
    }

    // Condition filter with priority sorting
    if (selectedCondition && selectedCondition !== 'all') {
      const conditionMap: { [key: string]: string } = {
        'brand-new': 'brand new',
        'foreign-used': 'foreign used',
        'local-used': 'local used'
      }
      const conditionValue = conditionMap[selectedCondition]
      
      filtered = filtered.filter(car => 
        car.condition && car.condition.toLowerCase() === conditionValue
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

    // Sorting with priority: featured first, then condition priority, then date
    filtered.sort((a, b) => {
      // Featured vehicles first
      if (a.featured && !b.featured) return -1
      if (!a.featured && b.featured) return 1
      
      // If condition filter is active, prioritize that condition
      if (selectedCondition && selectedCondition !== 'all') {
        const conditionMap: { [key: string]: string } = {
          'brand-new': 'brand new',
          'foreign-used': 'foreign used',
          'local-used': 'local used'
        }
        const conditionValue = conditionMap[selectedCondition]
        
        const aMatches = a.condition?.toLowerCase() === conditionValue
        const bMatches = b.condition?.toLowerCase() === conditionValue
        
        if (aMatches && !bMatches) return -1
        if (!aMatches && bMatches) return 1
      }
      
      switch (sortBy) {
        case 'newest':
          return b.year - a.year
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        case 'rating':
          return 0
        default:
          return 0
      }
    })

    setFilteredVehicles(filtered)
  }

  // Re-apply filters when any dependency changes
  useEffect(() => {
    if (vehicles.length > 0) {
      applyFilters()
    }
  }, [vehicles, selectedCondition, activeFilters, sortBy, searchQuery])

  // Handle filter changes
  const handleFilterChange = (filters: FilterState) => {
    setActiveFilters(filters)
  }

  // Handle condition selection
  const handleConditionSelect = (conditionId: string) => {
    setSelectedCondition(prev => prev === conditionId ? null : conditionId)
  }

  // Handle category navigation
  const handleCategoryNavigate = (href: string) => {
    setShowCategoryDropdown(false)
    router.push(href)
  }

  // Clear search
  const clearSearch = () => {
    setSearchQuery('')
    localStorage.removeItem('luxury_last_search')
  }

  const getActiveFilterCount = () => {
    let count = Object.values(activeFilters).filter(v => v && v !== '').length
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
          <span className="text-white/60 ml-3">Loading luxury vehicles...</span>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Page Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <span className="text-xl">👑</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Luxury Cars</h1>
              <p className="text-xs text-white/40">Premium vehicles curated for excellence</p>
            </div>
          </div>

          {/* Search Bar & Categories Dropdown & Condition Filters - All in one row */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            {/* Search Bar - Takes remaining space */}
            <div className="flex-1 relative">
              <div className="flex items-center bg-white/5 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 border border-white/10 focus-within:border-red-500/50 transition-colors">
                <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/40 mr-1.5 sm:mr-2 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search luxury vehicles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm text-white placeholder:text-white/30"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="text-white/40 hover:text-white/60 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Categories Dropdown - Fixed width */}
            <div className="sm:w-48 relative flex-shrink-0">
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="w-full flex items-center justify-between bg-white/5 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Menu className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/40" />
                  <span className="text-xs sm:text-sm text-white/80">Categories</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/40 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showCategoryDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setShowCategoryDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-full bg-black/95 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
                    {categories.map((category) => {
                      const Icon = category.icon
                      return (
                        <button
                          key={category.id}
                          onClick={() => handleCategoryNavigate(category.href)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                            <Icon className="w-4 h-4 text-white/40 group-hover:text-red-400 transition-colors" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                              {category.label}
                            </p>
                          </div>
                          <ChevronDown className="w-3 h-3 text-white/20 ml-auto -rotate-90" />
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Condition Filters - Visible on desktop only */}
            <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
              {conditionFilters.map((filter) => {
                const isActive = selectedCondition === filter.id
                return (
                  <button
                    key={filter.id}
                    onClick={() => handleConditionSelect(filter.id)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-medium transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                        : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60 border border-white/5'
                    }`}
                  >
                    {filter.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Condition Filters - Mobile only (below search bar) */}
          <div className="flex sm:hidden items-center gap-1.5 flex-wrap mb-4">
            {conditionFilters.map((filter) => {
              const isActive = selectedCondition === filter.id
              return (
                <button
                  key={filter.id}
                  onClick={() => handleConditionSelect(filter.id)}
                  className={`px-2.5 py-1 rounded-full text-[9px] font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                      : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60 border border-white/5'
                  }`}
                >
                  {filter.label}
                </button>
              )
            })}
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between gap-1 mb-3">
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

          {/* Vehicles Grid */}
          {vehicles.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👑</div>
              <div className="text-white/40 text-sm mb-2">No luxury vehicles available</div>
              {debugInfo && (
                <div className="text-xs text-white/30">{debugInfo}</div>
              )}
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/40 text-sm">
                {searchQuery 
                  ? `No luxury vehicles found matching "${searchQuery}"`
                  : 'No luxury vehicles found matching your criteria'
                }
              </p>
            </div>
          ) : (
            <div className={`
              grid gap-1.5 sm:gap-2
              ${viewMode === 'grid' 
                ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1'
              }
            `}>
              {filteredVehicles.map((car, index) => (
                <motion.div
                  key={car.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
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
              ))}
            </div>
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

// Main page component with Suspense boundary
export default function LuxuryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    }>
      <LuxuryContent />
    </Suspense>
  )
}