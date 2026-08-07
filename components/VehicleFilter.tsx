'use client'

import { useState, useEffect, useRef } from 'react'
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
  CalendarDays
} from 'lucide-react'

export interface FilterState {
  brand: string
  model: string
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
}

const brands = ['All', 'Porsche', 'Mercedes-Benz', 'BMW', 'Tesla', 'Audi', 'Lamborghini', 'Ferrari', 'Lexus', 'Volvo']
const models = ['All', '911', 'AMG GT', 'M8', 'Model S', 'RS e-tron GT', 'Huracán', 'Aventador', 'F8', 'LC 500', 'XC90']
const locations = ['All', 'Miami, FL', 'Los Angeles, CA', 'New York, NY', 'San Francisco, CA', 'Chicago, IL', 'Dallas, TX']
const colors = ['All', 'Black', 'White', 'Red', 'Blue', 'Silver', 'Gray', 'Green', 'Yellow']
const transmissions = ['All', 'Automatic', 'Manual', 'CVT', 'Dual-Clutch']
const years = ['All', '2024', '2023', '2022', '2021', '2020', '2019', '2018']

export default function VehicleFilter({ onFilterChange, isOpen, onClose }: VehicleFilterProps) {
  const [filters, setFilters] = useState<FilterState>({
    brand: '',
    model: '',
    location: '',
    color: '',
    transmission: '',
    minPrice: '',
    maxPrice: '',
    year: ''
  })

  const [expandedSections, setExpandedSections] = useState<string[]>(['brand'])
  const filterRef = useRef<HTMLDivElement>(null)

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

    // Small delay to prevent immediate close on page load
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
    // If value is 'All', set it to empty string (clear filter)
    const newValue = value === 'All' ? '' : value
    const newFilters = { ...filters, [key]: newValue }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    const emptyFilters = {
      brand: '',
      model: '',
      location: '',
      color: '',
      transmission: '',
      minPrice: '',
      maxPrice: '',
      year: ''
    }
    setFilters(emptyFilters)
    onFilterChange(emptyFilters)
  }

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(v => v && v !== '').length
  }

  const FilterSection = ({ 
    title, 
    section, 
    options, 
    value, 
    onChange,
    icon: Icon 
  }: any) => {
    const isExpanded = expandedSections.includes(section)
    const hasValue = value && value !== ''

    return (
      <div className="border-b border-white/5 last:border-0">
        <button
          onClick={() => toggleSection(section)}
          className="w-full flex items-center justify-between py-3 text-left group hover:bg-white/5 px-3 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-3">
            <Icon className="w-4 h-4 text-white/40 group-hover:text-white/60 transition-colors" />
            <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
              {title}
            </span>
            {hasValue && (
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-[10px] font-medium">
                {value}
              </span>
            )}
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
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-2 pb-3 px-3">
                {options.map((option: string) => {
                  const isSelected = value === option || (option === 'All' && value === '')
                  
                  return (
                    <button
                      key={option}
                      onClick={() => onChange(option)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                          : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80 border border-white/5'
                      }`}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <AnimatePresence>
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
              stiffness: 300, 
              damping: 30 
            }}
            className="fixed right-0 top-0 h-full w-full max-w-sm bg-black border-l border-white/10 z-50 shadow-2xl flex flex-col pb-20 sm:pb-0"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/10 rounded-xl">
                    <SlidersHorizontal className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Filters</h3>
                    <p className="text-xs text-white/40">
                      {getActiveFilterCount()} active filters
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getActiveFilterCount() > 0 && (
                    <button
                      onClick={clearFilters}
                      className="px-3 py-1.5 text-xs text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
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
              </div>

              {/* Filter Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                <FilterSection
                  title="Brand"
                  section="brand"
                  icon={Car}
                  options={brands}
                  value={filters.brand}
                  onChange={(value: string) => updateFilter('brand', value)}
                />

                <FilterSection
                  title="Model"
                  section="model"
                  icon={Gauge}
                  options={models}
                  value={filters.model}
                  onChange={(value: string) => updateFilter('model', value)}
                />

                <FilterSection
                  title="Location"
                  section="location"
                  icon={MapPin}
                  options={locations}
                  value={filters.location}
                  onChange={(value: string) => updateFilter('location', value)}
                />

                <FilterSection
                  title="Color"
                  section="color"
                  icon={Palette}
                  options={colors}
                  value={filters.color}
                  onChange={(value: string) => updateFilter('color', value)}
                />

                <FilterSection
                  title="Transmission"
                  section="transmission"
                  icon={Settings}
                  options={transmissions}
                  value={filters.transmission}
                  onChange={(value: string) => updateFilter('transmission', value)}
                />

                <FilterSection
                  title="Year"
                  section="year"
                  icon={CalendarDays}
                  options={years}
                  value={filters.year}
                  onChange={(value: string) => updateFilter('year', value)}
                />

                {/* Price Range */}
                <div className="border-b border-white/5 last:border-0">
                  <button
                    onClick={() => toggleSection('price')}
                    className="w-full flex items-center justify-between py-3 text-left group hover:bg-white/5 px-3 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">💰</span>
                      <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                        Price Range
                      </span>
                      {(filters.minPrice || filters.maxPrice) && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-[10px] font-medium">
                          ${filters.minPrice || '0'} - ${filters.maxPrice || '∞'}
                        </span>
                      )}
                    </div>
                    {expandedSections.includes('price') ? (
                      <ChevronUp className="w-4 h-4 text-white/40" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-white/40" />
                    )}
                  </button>

                  <AnimatePresence>
                    {expandedSections.includes('price') && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="flex gap-3 pb-3 px-3">
                          <div className="flex-1">
                            <label className="text-xs text-white/40 block mb-1">Min Price</label>
                            <input
                              type="number"
                              placeholder="$0"
                              value={filters.minPrice}
                              onChange={(e) => updateFilter('minPrice', e.target.value)}
                              className="w-full px-3 py-2 bg-white/5 rounded-xl border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-white/40 block mb-1">Max Price</label>
                            <input
                              type="number"
                              placeholder="$500,000"
                              value={filters.maxPrice}
                              onChange={(e) => updateFilter('maxPrice', e.target.value)}
                              className="w-full px-3 py-2 bg-white/5 rounded-xl border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 p-4 border-t border-white/10 bg-white/5">
                <button
                  onClick={onClose}
                  className="w-full py-3 bg-red-500 hover:bg-red-600 rounded-xl font-medium text-white transition-colors text-sm flex items-center justify-center gap-2"
                >
                  Apply Filters
                  {getActiveFilterCount() > 0 && (
                    <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
                      {getActiveFilterCount()}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}