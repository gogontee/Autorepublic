'use client'

import { useState } from 'react'
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
  Bus
} from 'lucide-react'

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
  selectedCategory?: string | null
  selectedCondition?: string | null
}

export default function VehicleCategory({ 
  onSelectCategory, 
  onSelectCondition,
  selectedCategory,
  selectedCondition
}: VehicleCategoryProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const filters = [
    { id: 'all', label: 'All', value: null },
    { id: 'brand-new', label: 'Brand New', value: 'brand new' },
    { id: 'foreign-used', label: 'Foreign Used', value: 'foreign used' },
    { id: 'local-used', label: 'Local Used', value: 'local used' },
  ]

  return (
    <div className="py-1 sm:py-2 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Single line with filters */}
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-hide">
            <h2 className="text-[10px] sm:text-xs font-medium text-white/60 whitespace-nowrap">
              Browse by Category
            </h2>
            
            {/* Filter Labels - Condition filters with "All" */}
            <div className="flex items-center gap-1 sm:gap-1.5">
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
          </div>
          
          <button className="text-[10px] sm:text-xs text-red-500 font-medium hover:text-red-400 transition-colors whitespace-nowrap flex-shrink-0">
            View All
          </button>
        </div>

        {/* Categories Scroll */}
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

                {/* Active/Hover indicator - only shows when selected or hovered */}
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