'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  ChevronDown, 
  ChevronUp,
  Car,
  MapPin,
  Palette,
  Settings,
  SlidersHorizontal,
  Gauge,
  CalendarDays,
  Search,
  Loader2,
  Check
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import LocationFilter from './LocationFilter'

export interface FilterState {
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

interface VehicleFilterProps {
  onFilterChange: (filters: FilterState) => void
  isOpen: boolean
  onClose: () => void
  selectedState?: string | null
  selectedCity?: string | null
  onStateChange?: (state: string | null) => void
  onCityChange?: (city: string | null) => void
}

// Cache for vehicle data
let vehicleDataCache: {
  brands: string[]
  models: { [brand: string]: string[] }
  trims: { [model: string]: string[] }
} | null = null

const colors = ['All', 'Black', 'White', 'Red', 'Blue', 'Silver', 'Gray', 'Green', 'Yellow', 'Orange', 'Brown', 'Gold']
const transmissions = ['All', 'Automatic', 'Manual', 'CVT', 'Dual-Clutch']
const years = ['All', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', '2014', '2013', '2012']

export default function VehicleFilter({ 
  onFilterChange, 
  isOpen, 
  onClose,
  selectedState,
  selectedCity,
  onStateChange,
  onCityChange
}: VehicleFilterProps) {
  const [filters, setFilters] = useState<FilterState>({
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

  const [expandedSections, setExpandedSections] = useState<string[]>(['brand'])
  const [brands, setBrands] = useState<string[]>(['All'])
  const [models, setModels] = useState<string[]>(['All'])
  const [trims, setTrims] = useState<string[]>(['All'])
  const [loadingBrands, setLoadingBrands] = useState(false)
  const [loadingModels, setLoadingModels] = useState(false)
  const [loadingTrims, setLoadingTrims] = useState(false)
  const [brandSearch, setBrandSearch] = useState('')
  const [modelSearch, setModelSearch] = useState('')
  const [trimSearch, setTrimSearch] = useState('')
  
  const filterRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Fetch vehicle data
  const fetchVehicleData = useCallback(async () => {
    if (vehicleDataCache) {
      setBrands(['All', ...vehicleDataCache.brands])
      return
    }

    setLoadingBrands(true)
    try {
      const { data, error } = await supabase
        .from('vehiclelist')
        .select('brand, model, trims')
        .order('brand', { ascending: true })
        .order('model', { ascending: true })

      if (error) throw error

      if (data) {
        const uniqueBrands = Array.from(new Set(data.map(item => item.brand))).sort()
        
        const modelsMap: { [brand: string]: string[] } = {}
        const trimsMap: { [model: string]: string[] } = {}
        
        data.forEach(item => {
          if (!modelsMap[item.brand]) {
            modelsMap[item.brand] = []
          }
          if (!modelsMap[item.brand].includes(item.model)) {
            modelsMap[item.brand].push(item.model)
          }
          
          if (item.trims && Array.isArray(item.trims) && item.trims.length > 0) {
            trimsMap[item.model] = item.trims
          }
        })

        Object.keys(modelsMap).forEach(brand => {
          modelsMap[brand].sort()
        })

        vehicleDataCache = {
          brands: uniqueBrands,
          models: modelsMap,
          trims: trimsMap
        }

        setBrands(['All', ...uniqueBrands])
      }
    } catch (error) {
      console.error('Error fetching vehicle data:', error)
    } finally {
      setLoadingBrands(false)
    }
  }, [])

  // Load data when filter opens
  useEffect(() => {
    if (isOpen) {
      fetchVehicleData()
    }
  }, [isOpen, fetchVehicleData])

  // Update models when brand changes
  useEffect(() => {
    if (filters.brand && vehicleDataCache) {
      const brandModels = vehicleDataCache.models[filters.brand] || []
      setModels(['All', ...brandModels])
    } else {
      if (vehicleDataCache) {
        const allModels = Object.values(vehicleDataCache.models).flat()
        const uniqueModels = Array.from(new Set(allModels)).sort()
        setModels(['All', ...uniqueModels])
      }
    }
  }, [filters.brand])

  // Update trims when model changes
  useEffect(() => {
    if (filters.model && vehicleDataCache) {
      const modelTrims = vehicleDataCache.trims[filters.model] || []
      setTrims(['All', ...modelTrims])
    } else {
      setTrims(['All'])
    }
  }, [filters.model])

  // Close filter on scroll
  useEffect(() => {
    if (!isOpen) return

    let scrollTimeout: NodeJS.Timeout
    let hasScrolled = false

    const handleScroll = () => {
      if (!hasScrolled) {
        hasScrolled = true
        onClose()
      }
    }

    scrollTimeout = setTimeout(() => {
      window.addEventListener('scroll', handleScroll, { passive: true, once: true })
    }, 100)

    return () => {
      clearTimeout(scrollTimeout)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [isOpen, onClose])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevent body scroll when filter is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const updateFilter = (key: keyof FilterState, value: string) => {
    const newValue = value === 'All' ? '' : value
    const newFilters = { ...filters, [key]: newValue }
    setFilters(newFilters)
    onFilterChange(newFilters)
    
    setTimeout(() => {
      setExpandedSections(prev => prev.filter(s => s !== key))
    }, 300)
  }

  const clearFilters = () => {
    const emptyFilters = {
      brand: '',
      model: '',
      trim: '',
      location: '',
      color: '',
      transmission: '',
      minPrice: '',
      maxPrice: '',
      year: ''
    }
    setFilters(emptyFilters)
    setBrandSearch('')
    setModelSearch('')
    setTrimSearch('')
    onFilterChange(emptyFilters)
    // Also clear location
    if (onStateChange) onStateChange(null)
    if (onCityChange) onCityChange(null)
  }

  const getActiveFilterCount = () => {
    let count = Object.values(filters).filter(v => v && v !== '').length
    if (selectedState) count++
    if (selectedCity) count++
    return count
  }

  const getFilteredOptions = useCallback((options: string[], search: string) => {
    return options.filter(opt => 
      opt.toLowerCase().includes((search || '').toLowerCase())
    )
  }, [])

  // Filter section component
  const FilterSection = useCallback(({ 
    title, 
    section, 
    options, 
    value, 
    onChange,
    icon: Icon,
    searchValue,
    onSearchChange,
    loading = false,
    autoClose = true
  }: any) => {
    const isExpanded = expandedSections.includes(section)
    const hasValue = value && value !== ''
    const filteredOptions = useMemo(() => 
      getFilteredOptions(options, searchValue),
      [options, searchValue, getFilteredOptions]
    )

    const handleOptionSelect = (option: string) => {
      onChange(option)
      if (autoClose) {
        setTimeout(() => {
          setExpandedSections(prev => prev.filter(s => s !== section))
        }, 200)
      }
    }

    return (
      <motion.div 
        className="border-b border-white/5 last:border-0"
        initial={false}
        animate={{ opacity: 1 }}
      >
        <button
          onClick={() => toggleSection(section)}
          className="w-full flex items-center justify-between py-3.5 text-left group hover:bg-white/5 px-3 rounded-lg transition-colors active:scale-[0.98]"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex-shrink-0">
              <Icon className="w-4 h-4 text-white/40 group-hover:text-white/60 transition-colors" />
            </div>
            <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors truncate">
              {title}
            </span>
            {hasValue && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-[10px] font-medium flex-shrink-0"
              >
                {value}
              </motion.span>
            )}
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="flex-shrink-0"
          >
            <ChevronDown className="w-4 h-4 text-white/40" />
          </motion.div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="pb-3 px-3">
                <motion.div 
                  className="relative mb-2"
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder={`Search ${title.toLowerCase()}...`}
                    value={searchValue || ''}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white/5 rounded-lg border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all"
                    onClick={(e) => e.stopPropagation()}
                  />
                </motion.div>

                <motion.div 
                  className="max-h-48 overflow-y-auto scrollbar-thin"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                >
                  {loading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                    </div>
                  ) : filteredOptions.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-6 text-xs text-white/30"
                    >
                      No {title.toLowerCase()} found
                    </motion.div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {filteredOptions.map((option: string, index: number) => {
                        const isSelected = value === option || (option === 'All' && value === '')
                        
                        return (
                          <motion.button
                            key={option}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: Math.min(index * 0.02, 0.3) }}
                            onClick={() => handleOptionSelect(option)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`
                              relative px-3 py-1.5 rounded-full text-[10px] font-medium transition-all duration-150
                              ${isSelected
                                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                                : 'bg-white/5 text-white/60 hover:bg-white/15 hover:text-white hover:border-white/20 border border-white/5'
                              }
                            `}
                          >
                            {option}
                            {isSelected && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center border-2 border-black"
                              >
                                <Check className="w-2.5 h-2.5 text-white" />
                              </motion.span>
                            )}
                          </motion.button>
                        )
                      })}
                    </div>
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }, [expandedSections, getFilteredOptions])

  // Location section using LocationFilter component
  const LocationSection = useCallback(() => {
    const isExpanded = expandedSections.includes('location')
    const hasValue = selectedState || selectedCity

    return (
      <motion.div 
        className="border-b border-white/5 last:border-0"
        initial={false}
        animate={{ opacity: 1 }}
      >
        <button
          onClick={() => toggleSection('location')}
          className="w-full flex items-center justify-between py-3.5 text-left group hover:bg-white/5 px-3 rounded-lg transition-colors active:scale-[0.98]"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex-shrink-0">
              <MapPin className="w-4 h-4 text-white/40 group-hover:text-white/60 transition-colors" />
            </div>
            <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors truncate">
              Location
            </span>
            {hasValue && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-[10px] font-medium flex-shrink-0"
              >
                {selectedCity || selectedState}
              </motion.span>
            )}
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="flex-shrink-0"
          >
            <ChevronDown className="w-4 h-4 text-white/40" />
          </motion.div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="pb-3 px-3">
                {/* Use the existing LocationFilter component */}
                <div className="py-2">
                  <LocationFilter
                    selectedState={selectedState || null}
                    selectedCity={selectedCity || null}
                    onStateChange={(state) => {
                      if (onStateChange) onStateChange(state)
                      // Auto close section after selection
                      setTimeout(() => {
                        setExpandedSections(prev => prev.filter(s => s !== 'location'))
                      }, 300)
                    }}
                    onCityChange={(city) => {
                      if (onCityChange) onCityChange(city)
                      // Auto close section after selection
                      setTimeout(() => {
                        setExpandedSections(prev => prev.filter(s => s !== 'location'))
                      }, 300)
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }, [expandedSections, selectedState, selectedCity, onStateChange, onCityChange])

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Filter Panel */}
          <motion.div
            ref={filterRef}
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 350, 
              damping: 30 
            }}
            className="fixed right-0 top-0 h-full w-full max-w-sm bg-[#0a0a0a] border-l border-white/10 z-50 shadow-2xl flex flex-col"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <motion.div 
                className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/10 rounded-xl">
                    <SlidersHorizontal className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">Filters</h3>
                    <p className="text-[10px] text-white/40">
                      {getActiveFilterCount()} active {getActiveFilterCount() === 1 ? 'filter' : 'filters'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getActiveFilterCount() > 0 && (
                    <button
                      onClick={clearFilters}
                      className="px-3 py-1.5 text-[10px] text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-white/60" />
                  </button>
                </div>
              </motion.div>

              {/* Filter Content */}
              <motion.div 
                className="flex-1 overflow-y-auto p-4 space-y-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                <FilterSection
                  title="Brand"
                  section="brand"
                  icon={Car}
                  options={brands}
                  value={filters.brand}
                  onChange={(value: string) => {
                    updateFilter('brand', value)
                    if (value === 'All') {
                      updateFilter('model', '')
                      updateFilter('trim', '')
                    }
                  }}
                  searchValue={brandSearch}
                  onSearchChange={setBrandSearch}
                  loading={loadingBrands}
                />

                <FilterSection
                  title="Model"
                  section="model"
                  icon={Gauge}
                  options={models}
                  value={filters.model}
                  onChange={(value: string) => {
                    updateFilter('model', value)
                    if (value === 'All') {
                      updateFilter('trim', '')
                    }
                  }}
                  searchValue={modelSearch}
                  onSearchChange={setModelSearch}
                  loading={loadingModels}
                />

                <FilterSection
                  title="Trim"
                  section="trim"
                  icon={Settings}
                  options={trims}
                  value={filters.trim}
                  onChange={(value: string) => updateFilter('trim', value)}
                  searchValue={trimSearch}
                  onSearchChange={setTrimSearch}
                  loading={loadingTrims}
                />

                {/* Location Section - uses LocationFilter component */}
                <LocationSection />

                <FilterSection
                  title="Color"
                  section="color"
                  icon={Palette}
                  options={colors}
                  value={filters.color}
                  onChange={(value: string) => updateFilter('color', value)}
                  searchValue=""
                  onSearchChange={() => {}}
                  autoClose={true}
                />

                <FilterSection
                  title="Transmission"
                  section="transmission"
                  icon={Settings}
                  options={transmissions}
                  value={filters.transmission}
                  onChange={(value: string) => updateFilter('transmission', value)}
                  searchValue=""
                  onSearchChange={() => {}}
                  autoClose={true}
                />

                <FilterSection
                  title="Year"
                  section="year"
                  icon={CalendarDays}
                  options={years}
                  value={filters.year}
                  onChange={(value: string) => updateFilter('year', value)}
                  searchValue=""
                  onSearchChange={() => {}}
                  autoClose={true}
                />

                {/* Price Range */}
                <motion.div 
                  className="border-b border-white/5 last:border-0"
                  initial={false}
                  animate={{ opacity: 1 }}
                >
                  <button
                    onClick={() => toggleSection('price')}
                    className="w-full flex items-center justify-between py-3.5 text-left group hover:bg-white/5 px-3 rounded-lg transition-colors active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex-shrink-0">
                        <span className="text-xl">💰</span>
                      </div>
                      <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors truncate">
                        Price Range
                      </span>
                      {(filters.minPrice || filters.maxPrice) && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-[10px] font-medium flex-shrink-0"
                        >
                          ${filters.minPrice || '0'} - ${filters.maxPrice || '∞'}
                        </motion.span>
                      )}
                    </div>
                    <motion.div
                      animate={{ rotate: expandedSections.includes('price') ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex-shrink-0"
                    >
                      <ChevronDown className="w-4 h-4 text-white/40" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {expandedSections.includes('price') && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="flex gap-3 pb-4 px-3">
                          <div className="flex-1">
                            <label className="text-[10px] text-white/40 block mb-1.5 font-medium">Min Price</label>
                            <input
                              type="number"
                              placeholder="$0"
                              value={filters.minPrice}
                              onChange={(e) => updateFilter('minPrice', e.target.value)}
                              className="w-full px-3 py-2.5 bg-white/5 rounded-xl border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-[10px] text-white/40 block mb-1.5 font-medium">Max Price</label>
                            <input
                              type="number"
                              placeholder="$500,000"
                              value={filters.maxPrice}
                              onChange={(e) => updateFilter('maxPrice', e.target.value)}
                              className="w-full px-3 py-2.5 bg-white/5 rounded-xl border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>

              {/* Footer */}
              <motion.div 
                className="flex-shrink-0 p-4 border-t border-white/10 bg-white/5"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <button
                  onClick={onClose}
                  className="w-full py-3.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl font-medium text-white transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-500/25"
                >
                  Apply Filters
                  {getActiveFilterCount() > 0 && (
                    <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
                      {getActiveFilterCount()}
                    </span>
                  )}
                </button>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}