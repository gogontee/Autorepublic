'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  Car, 
  Package, 
  Gauge, 
  Crown, 
  Zap, 
  Truck, 
  Container, 
  Bike,
  Sparkles,
  Sun,
  Grid3X3,
  Bus,
  ChevronDown
} from 'lucide-react'
import LocationFilter from './LocationFilter'

const categories = [
  { id: 'all', name: 'All', icon: Grid3X3 },
  { id: 'sedan', name: 'Sedan', icon: Car },
  { id: 'suv', name: 'SUV', icon: Package },
  { id: 'sports', name: 'Sports', icon: Gauge },
  { id: 'luxury', name: 'Luxury', icon: Crown },
  { id: 'electric', name: 'Electric', icon: Zap },
  { id: 'van', name: 'Van', icon: Truck },
  { id: 'bus', name: 'Bus', icon: Bus },
  { id: 'trailer', name: 'Trailer', icon: Container },
  { id: 'truck', name: 'Truck', icon: Truck },
  { id: 'coupe', name: 'Coupe', icon: Sparkles },
  { id: 'convertible', name: 'Convertible', icon: Sun },
  { id: 'power-bike', name: 'Power Bike', icon: Bike },
]

interface VehicleCategoryProps {
  onSelectCategory?: (categoryId: string | null) => void
  onSelectCondition?: (condition: string | null) => void
  onSelectState?: (state: string | null) => void
  onSelectCity?: (city: string | null) => void
  selectedCategory?: string | null
  selectedCondition?: string | null
  selectedState?: string | null
  selectedCity?: string | null
}

export default function VehicleCategory({ 
  onSelectCategory, 
  onSelectCondition,
  onSelectState,
  onSelectCity,
  selectedCategory,
  selectedCondition,
  selectedState,
  selectedCity
}: VehicleCategoryProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [isConditionDropdownOpen, setIsConditionDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })

  const filters = [
    { id: 'all', label: 'All', value: null },
    { id: 'brand-new', label: 'Brand New', value: 'brand new' },
    { id: 'foreign-used', label: 'Foreign Used', value: 'foreign used' },
    { id: 'local-used', label: 'Local Used', value: 'local used' },
  ]

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsConditionDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Update dropdown position when opened
  useEffect(() => {
    if (isConditionDropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 2,
        left: rect.left + window.scrollX,
      })
    }
  }, [isConditionDropdownOpen])

  // Get the current condition label
  const getCurrentConditionLabel = () => {
    if (!selectedCondition) return 'All'
    const filter = filters.find(f => f.value === selectedCondition)
    return filter ? filter.label : 'All'
  }

  return (
    <div className="py-1 sm:py-2 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Single line with filters */}
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          {/* Left side - filters */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* Mobile View - Hidden on desktop */}
            <div className="flex items-center gap-1.5 sm:hidden flex-shrink-0">
              {/* Condition Dropdown on Mobile */}
              <div ref={dropdownRef} className="relative inline-block">
                <button
                  ref={buttonRef}
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsConditionDropdownOpen(!isConditionDropdownOpen)
                  }}
                  className={`
                    flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-medium transition-all whitespace-nowrap
                    ${selectedCondition
                      ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20'
                      : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white/80'
                    }
                  `}
                >
                  <span>{getCurrentConditionLabel()}</span>
                  <ChevronDown className={`w-2.5 h-2.5 transition-transform ${isConditionDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Condition Dropdown Menu - Fixed position directly below button */}
                {isConditionDropdownOpen && (
                  <div 
                    className="fixed bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-[99999]"
                    style={{
                      top: dropdownPosition.top,
                      left: dropdownPosition.left,
                      minWidth: '120px',
                      maxWidth: '160px'
                    }}
                  >
                    {filters.map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => {
                          onSelectCondition?.(filter.value)
                          setIsConditionDropdownOpen(false)
                        }}
                        className={`
                          w-full flex items-center justify-between px-3 py-2 text-[9px] transition-colors
                          ${(selectedCondition === filter.value) || (filter.id === 'all' && !selectedCondition)
                            ? 'bg-red-500/10 text-red-500'
                            : 'text-white/60 hover:bg-white/5 hover:text-white'
                          }
                        `}
                      >
                        <span>{filter.label}</span>
                        {(selectedCondition === filter.value) || (filter.id === 'all' && !selectedCondition) && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Location Filter on Mobile - Reduced font sizes */}
              <div className="scale-90 origin-left flex-shrink-0">
                <LocationFilter
                  selectedState={selectedState ?? null}
                  selectedCity={selectedCity ?? null}
                  onStateChange={(state) => {
                    console.log('📍 State changed in VehicleCategory:', state)
                    onSelectState?.(state)
                  }}
                  onCityChange={(city) => {
                    console.log('📍 City changed in VehicleCategory:', city)
                    onSelectCity?.(city)
                  }}
                />
              </div>
            </div>

            {/* Desktop View - Hidden on mobile */}
            <div className="hidden sm:flex items-center gap-2 sm:gap-3 min-w-0 flex-1 overflow-x-auto scrollbar-hide">
              <h2 className="text-[10px] sm:text-xs font-medium text-white/60 whitespace-nowrap flex-shrink-0">
                Browse by Category
              </h2>
              
              {/* Filter Labels - Condition filters with "All" */}
              <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => onSelectCondition?.(selectedCondition === filter.value ? null : filter.value)}
                    className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-medium transition-all whitespace-nowrap ${
                      (selectedCondition === filter.value) || (filter.id === 'all' && !selectedCondition)
                        ? 'bg-red-500 text-white'
                        : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Location Filter on Desktop */}
              <div className="flex items-center gap-1 sm:gap-1.5 border-l border-white/10 pl-2 sm:pl-3 flex-shrink-0">
                <LocationFilter
                  selectedState={selectedState ?? null}
                  selectedCity={selectedCity ?? null}
                  onStateChange={(state) => {
                    console.log('📍 State changed in VehicleCategory:', state)
                    onSelectState?.(state)
                  }}
                  onCityChange={(city) => {
                    console.log('📍 City changed in VehicleCategory:', city)
                    onSelectCity?.(city)
                  }}
                />
              </div>
            </div>
          </div>
          
          <button className="text-[10px] sm:text-xs text-red-500 font-medium hover:text-red-400 transition-colors whitespace-nowrap flex-shrink-0 ml-2">
            View All
          </button>
        </div>

        {/* Categories Scroll - Unchanged, works on both mobile and desktop */}
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 sm:pb-2 scrollbar-hide">
          {categories.map((category) => {
            const Icon = category.icon
            const isSelected = selectedCategory === category.id
            const isHovered = hoveredId === category.id

            return (
              <motion.button
                key={category.id}
                onClick={() => {
                  const newId = selectedCategory === category.id ? null : category.id
                  onSelectCategory?.(newId)
                }}
                onMouseEnter={() => setHoveredId(category.id)}
                onMouseLeave={() => setHoveredId(null)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  flex-shrink-0 rounded-xl sm:rounded-2xl transition-all relative group
                  px-2.5 sm:px-4 py-1.5 sm:py-2.5
                  ${isSelected
                    ? 'bg-white/10 text-white border border-white/20 shadow-lg shadow-white/5'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80 border border-transparent hover:border-white/10'
                  }
                `}
              >
                <div className="flex items-center gap-1.5 sm:gap-2.5">
                  <Icon 
                    className={`
                      transition-colors
                      w-3.5 h-3.5 sm:w-4 sm:h-4
                      ${isSelected 
                        ? 'text-white' 
                        : isHovered 
                          ? 'text-white/80' 
                          : 'text-white/40'
                      }
                    `}
                    strokeWidth={isSelected ? 2 : 1.5}
                  />
                  
                  <span className={`
                    font-medium transition-colors whitespace-nowrap
                    text-[10px] sm:text-xs
                    ${isSelected ? 'text-white' : 'text-white/60 group-hover:text-white/80'}
                  `}>
                    {category.name}
                  </span>
                </div>

                {/* Active/Hover indicator */}
                {(isHovered || isSelected) && (
                  <motion.div
                    layoutId="category-indicator"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 sm:w-6 h-0.5 bg-gradient-to-r from-red-500 to-red-400 rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}