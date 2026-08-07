'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Plus, 
  X, 
  Trash2, 
  ChevronDown,
  ChevronUp,
  Car,
  Gauge,
  Fuel,
  Calendar,
  Settings,
  Palette,
  Hash,
  Tag,
  Shield,
  Star,
  MapPin,
  Eye,
  ArrowRight,
  AlertCircle,
  Loader2,
  Maximize2,
  Minimize2,
  TrendingUp,
  TrendingDown,
  Zap,
  Award,
  Users,
  Heart
} from 'lucide-react'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

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
  car_code: string
  condition: string
  category: string
  images: string[]
  cover_image: string
  city: string
  state: string
  country: string
  views?: number
  rating?: number
  reviews?: number
}

interface CompareItem extends Vehicle {
  selected: boolean
}

// Compare categories for better organization
const compareGroups = [
  {
    id: 'basic',
    label: 'Basic Info',
    icon: Car,
    fields: [
      { key: 'brand', label: 'Brand' },
      { key: 'model', label: 'Model' },
      { key: 'year', label: 'Year' },
      { key: 'price', label: 'Price' },
      { key: 'car_code', label: 'Car Code' },
    ]
  },
  {
    id: 'specs',
    label: 'Specifications',
    icon: Gauge,
    fields: [
      { key: 'engine_type', label: 'Engine' },
      { key: 'transmission', label: 'Transmission' },
      { key: 'fuel_type', label: 'Fuel Type' },
      { key: 'mileage', label: 'Mileage' },
    ]
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: Palette,
    fields: [
      { key: 'color', label: 'Exterior Color' },
      { key: 'interior_color', label: 'Interior Color' },
      { key: 'condition', label: 'Condition' },
      { key: 'category', label: 'Category' },
    ]
  },
  {
    id: 'location',
    label: 'Location & Stats',
    icon: MapPin,
    fields: [
      { key: 'city', label: 'City' },
      { key: 'state', label: 'State' },
      { key: 'country', label: 'Country' },
      { key: 'views', label: 'Views' },
    ]
  }
]

export default function ResearchPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [compareList, setCompareList] = useState<Vehicle[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCompare, setShowCompare] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['basic', 'specs', 'appearance', 'location'])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid')
  const [sortBy, setSortBy] = useState('newest')
  const [highlightDifferences, setHighlightDifferences] = useState(true)

  // Categories for filtering
  const categories = ['All', 'Sedan', 'SUV', 'Sports', 'Luxury', 'Electric', 'Truck', 'Van', 'Coupe', 'Convertible']

  // Sort options
  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' },
  ]

  // Fetch vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) {
          setError('Failed to load vehicles')
          setLoading(false)
          return
        }

        // Add some sample ratings for demo
        const vehiclesWithRating = (data || []).map(v => ({
          ...v,
          rating: 4 + Math.random() * 1,
          reviews: Math.floor(Math.random() * 200) + 20,
        }))

        setVehicles(vehiclesWithRating)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching vehicles:', err)
        setError('An unexpected error occurred')
        setLoading(false)
      }
    }

    fetchVehicles()
  }, [])

  // Filter vehicles
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = searchQuery === '' || 
      vehicle.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.car_code?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = !selectedCategory || selectedCategory === 'All' || vehicle.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  // Sort vehicles
  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return b.year - a.year
      case 'price-low':
        return a.price - b.price
      case 'price-high':
        return b.price - a.price
      case 'popular':
        return (b.views || 0) - (a.views || 0)
      default:
        return 0
    }
  })

  // Add to compare list
  const addToCompare = (vehicle: Vehicle) => {
    if (compareList.length >= 4) {
      alert('You can compare up to 4 vehicles at a time')
      return
    }
    if (!compareList.find(v => v.id === vehicle.id)) {
      setCompareList([...compareList, vehicle])
      if (compareList.length === 0) {
        setShowCompare(true)
      }
    }
  }

  // Remove from compare list
  const removeFromCompare = (id: string) => {
    setCompareList(compareList.filter(v => v.id !== id))
    if (compareList.length <= 1) {
      setShowCompare(false)
    }
  }

  // Clear compare list
  const clearCompare = () => {
    setCompareList([])
    setShowCompare(false)
  }

  // Toggle expanded group
  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    )
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`
  }

  // Get condition badge
  const getConditionBadge = (condition: string) => {
    const cond = condition?.toLowerCase() || ''
    if (cond === 'brand new') return { label: 'New', color: 'bg-green-500/80', textColor: 'text-green-400' }
    if (cond === 'foreign used') return { label: 'F-Used', color: 'bg-yellow-500/80', textColor: 'text-yellow-400' }
    if (cond === 'local used') return { label: 'L-Used', color: 'bg-blue-500/80', textColor: 'text-blue-400' }
    return { label: 'Used', color: 'bg-gray-500/80', textColor: 'text-gray-400' }
  }

  // Get value display
  const getValueDisplay = (vehicle: Vehicle, key: string) => {
    const value = vehicle[key as keyof Vehicle]
    if (value === undefined || value === null || value === '') return '—'
    
    if (key === 'price') return formatCurrency(value as number)
    if (key === 'condition') {
      const badge = getConditionBadge(value as string)
      return badge.label
    }
    if (key === 'color' || key === 'interior_color') {
      return (
        <div className="flex items-center gap-2 justify-center">
          <div 
            className="w-4 h-4 rounded-full border border-white/10 flex-shrink-0"
            style={{ backgroundColor: (value as string).toLowerCase() }}
          />
          <span>{value}</span>
        </div>
      )
    }
    return value
  }

  // Check if a value is different across all vehicles
  const isDifferent = (key: string) => {
    if (compareList.length < 2) return false
    const values = compareList.map(v => v[key as keyof Vehicle])
    const firstValue = values[0]
    return !values.every(v => v === firstValue)
  }

  // Loading state
  if (loading) {
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

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="pt-14 md:pt-16 pb-24 md:pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Research & Compare</h1>
              <p className="text-sm text-white/40 mt-1">
                Compare vehicles side by side to make the best decision
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Compare Badge */}
              {compareList.length > 0 && (
                <button
                  onClick={() => setShowCompare(!showCompare)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    showCompare 
                      ? 'bg-red-500 text-white' 
                      : 'bg-white/5 text-white/80 hover:bg-white/10'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    Compare
                    <span className="px-1.5 py-0.5 bg-red-500/30 rounded-full text-xs">
                      {compareList.length}/4
                    </span>
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showCompare ? 'rotate-180' : ''}`} />
                </button>
              )}
              
              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'grid' ? 'bg-red-500 text-white' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('compact')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'compact' ? 'bg-red-500 text-white' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Compare Section - Full width with better layout */}
          <AnimatePresence>
            {showCompare && compareList.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-6 overflow-hidden"
              >
                <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-2xl border border-white/10 p-4 sm:p-6">
                  {/* Compare Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold text-white">Comparison</h2>
                      <span className="text-xs text-white/40">
                        {compareList.length} of 4 vehicles
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setHighlightDifferences(!highlightDifferences)}
                        className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                          highlightDifferences 
                            ? 'bg-red-500/20 text-red-400' 
                            : 'bg-white/5 text-white/40'
                        }`}
                      >
                        {highlightDifferences ? 'Highlighting Differences' : 'Show Differences'}
                      </button>
                      <button
                        onClick={clearCompare}
                        className="text-sm text-red-400 hover:text-red-300 transition-colors"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  {/* Compare Grid */}
                  <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                      {/* Vehicle Headers */}
                      <div className="grid grid-cols-5 gap-4 mb-4">
                        <div className="col-span-1" />
                        {compareList.map((vehicle) => (
                          <div key={vehicle.id} className="col-span-1">
                            <div className="relative group text-center">
                              <button
                                onClick={() => removeFromCompare(vehicle.id)}
                                className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                              >
                                <X className="w-3 h-3 text-white" />
                              </button>
                              <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-white/5 mb-2">
                                <img 
                                  src={vehicle.cover_image || vehicle.images?.[0] || '/api/placeholder/400/300'}
                                  alt={vehicle.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <p className="font-medium text-white text-sm truncate">
                                {vehicle.title || `${vehicle.brand} ${vehicle.model}`}
                              </p>
                              <p className="text-xs text-white/40">{vehicle.year}</p>
                              <p className="text-lg font-bold text-red-500">
                                {formatCurrency(vehicle.price)}
                              </p>
                              {vehicle.rating && (
                                <div className="flex items-center justify-center gap-1 text-xs text-white/60 mt-1">
                                  <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                  <span>{vehicle.rating.toFixed(1)}</span>
                                  <span className="text-white/40">({vehicle.reviews || 0})</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Compare Fields by Group */}
                      {compareGroups.map((group) => {
                        const isExpanded = expandedGroups.includes(group.id)
                        const Icon = group.icon
                        
                        return (
                          <div key={group.id} className="border-t border-white/5">
                            <button
                              onClick={() => toggleGroup(group.id)}
                              className="w-full flex items-center justify-between py-3 text-left"
                            >
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4 text-white/40" />
                                <span className="text-sm font-medium text-white/60">{group.label}</span>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-white/40" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-white/40" />
                              )}
                            </button>
                            
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  {group.fields.map((field) => {
                                    const isDiff = highlightDifferences && isDifferent(field.key)
                                    
                                    return (
                                      <div 
                                        key={field.key} 
                                        className={`grid grid-cols-5 gap-4 py-2.5 border-t border-white/5 ${
                                          isDiff ? 'bg-yellow-500/5' : ''
                                        }`}
                                      >
                                        <div className="col-span-1 flex items-center">
                                          <span className={`text-xs ${
                                            isDiff ? 'text-yellow-400 font-medium' : 'text-white/40'
                                          }`}>
                                            {field.label}
                                            {isDiff && (
                                              <span className="ml-1 text-[10px] text-yellow-400">⬤</span>
                                            )}
                                          </span>
                                        </div>
                                        {compareList.map((vehicle) => (
                                          <div key={`${vehicle.id}-${field.key}`} className="col-span-1 flex items-center justify-center">
                                            <span className={`text-xs ${
                                              isDiff ? 'text-white font-medium' : 'text-white/80'
                                            }`}>
                                              {getValueDisplay(vehicle, field.key)}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )
                                  })}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search vehicles by name, brand, or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat === 'All' ? null : cat)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                    (cat === 'All' && !selectedCategory) || selectedCategory === cat
                      ? 'bg-red-500 text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors appearance-none"
            >
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-black">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle Grid */}
          {sortedVehicles.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/40">No vehicles found matching your criteria</p>
            </div>
          ) : (
            <div className={`
              grid gap-3 sm:gap-4
              ${viewMode === 'grid' 
                ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              }
            `}>
              {sortedVehicles.map((vehicle, index) => {
                const isInCompare = compareList.some(v => v.id === vehicle.id)
                const conditionBadge = getConditionBadge(vehicle.condition)
                
                return (
                  <motion.div
                    key={vehicle.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-white/5 rounded-xl overflow-hidden border transition-all group ${
                      isInCompare 
                        ? 'border-red-500/50 bg-red-500/5' 
                        : 'border-white/5 hover:border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={vehicle.cover_image || vehicle.images?.[0] || '/api/placeholder/400/300'}
                        alt={vehicle.title}
                        className="w-full h-32 sm:h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium text-white ${conditionBadge.color}`}>
                        {conditionBadge.label}
                      </div>
                      {vehicle.car_code && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 backdrop-blur-sm rounded-full text-[10px] font-mono text-red-400">
                          {vehicle.car_code}
                        </div>
                      )}
                      {isInCompare && (
                        <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center">
                          <span className="px-3 py-1 bg-red-500/90 rounded-full text-xs font-medium text-white">
                            In Comparison
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-semibold text-white truncate">
                        {vehicle.title || `${vehicle.brand} ${vehicle.model}`}
                      </h3>
                      <p className="text-xs text-white/40">{vehicle.year} • {vehicle.brand}</p>
                      <p className="text-lg font-bold text-red-500 mt-1">
                        {formatCurrency(vehicle.price)}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-white/40 mt-2">
                        <span className="flex items-center gap-0.5">
                          <Gauge className="w-3 h-3" />
                          {vehicle.mileage || '—'}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Fuel className="w-3 h-3" />
                          {vehicle.fuel_type || '—'}
                        </span>
                        {vehicle.rating && (
                          <span className="flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                            {vehicle.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Link
                          href={`/vehicles/${vehicle.id}`}
                          className="flex-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium text-white/80 transition-colors text-center"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={() => isInCompare ? removeFromCompare(vehicle.id) : addToCompare(vehicle)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 min-w-[80px] ${
                            isInCompare 
                              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                              : 'bg-red-500 hover:bg-red-600 text-white'
                          }`}
                        >
                          {isInCompare ? (
                            <>
                              <X className="w-3 h-3" />
                              Remove
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3" />
                              Compare
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Results Count */}
          <div className="mt-4 text-center">
            <p className="text-xs text-white/30">
              Showing {sortedVehicles.length} of {vehicles.length} vehicles
            </p>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}