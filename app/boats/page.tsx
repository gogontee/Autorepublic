'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Filter, Grid, List, ChevronDown, Anchor, Ship, Sailboat, Waves } from 'lucide-react'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import CarCard from '@/components/CarCard'

// Sample boat data
const allBoats = [
  {
    id: 1,
    name: 'Sunseeker Predator 65',
    year: 2023,
    price: '$1,850,000',
    mileage: '120 hrs',
    fuel: 'Diesel',
    transmission: 'Automatic',
    image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800&auto=format&fit=crop',
    rating: 4.9,
    reviews: 45,
    location: 'Miami, FL',
    brand: 'Sunseeker',
    model: 'Predator 65',
    color: 'White',
    category: 'motor'
  },
  {
    id: 2,
    name: 'Azimut Grande 27 Metri',
    year: 2024,
    price: '$3,200,000',
    mileage: '80 hrs',
    fuel: 'Diesel',
    transmission: 'Automatic',
    image: 'https://images.unsplash.com/photo-1546080274-82639b21c093?w=800&auto=format&fit=crop',
    rating: 4.8,
    reviews: 32,
    location: 'Miami, FL',
    brand: 'Azimut',
    model: 'Grande 27',
    color: 'White',
    category: 'luxury'
  },
  {
    id: 3,
    name: 'Boston Whaler 420',
    year: 2023,
    price: '$725,000',
    mileage: '200 hrs',
    fuel: 'Gasoline',
    transmission: 'Automatic',
    image: 'https://images.unsplash.com/photo-1598363389083-b5c8cd6614b7?w=800&auto=format&fit=crop',
    rating: 4.7,
    reviews: 78,
    location: 'Los Angeles, CA',
    brand: 'Boston Whaler',
    model: '420 Outrage',
    color: 'Blue',
    category: 'fishing'
  },
  {
    id: 4,
    name: 'Ferretti Yachts 670',
    year: 2024,
    price: '$2,450,000',
    mileage: '60 hrs',
    fuel: 'Diesel',
    transmission: 'Automatic',
    image: 'https://images.unsplash.com/photo-1574085733277-851f5d23f36a?w=800&auto=format&fit=crop',
    rating: 4.9,
    reviews: 56,
    location: 'Miami, FL',
    brand: 'Ferretti',
    model: 'Yachts 670',
    color: 'White',
    category: 'luxury'
  },
  {
    id: 5,
    name: 'Sea Ray SLX 400',
    year: 2023,
    price: '$545,000',
    mileage: '150 hrs',
    fuel: 'Gasoline',
    transmission: 'Automatic',
    image: 'https://images.unsplash.com/photo-1598371839696-5c5a1cfb1a8a?w=800&auto=format&fit=crop',
    rating: 4.6,
    reviews: 89,
    location: 'Chicago, IL',
    brand: 'Sea Ray',
    model: 'SLX 400',
    color: 'Red',
    category: 'motor'
  },
  {
    id: 6,
    name: 'Lagoon 52 F',
    year: 2023,
    price: '$1,950,000',
    mileage: '300 hrs',
    fuel: 'Diesel',
    transmission: 'Automatic',
    image: 'https://images.unsplash.com/photo-1534269222346-5a89a5a5b47f?w=800&auto=format&fit=crop',
    rating: 4.8,
    reviews: 67,
    location: 'Miami, FL',
    brand: 'Lagoon',
    model: '52 F',
    color: 'White',
    category: 'sail'
  },
  {
    id: 7,
    name: 'Pershing 7X',
    year: 2024,
    price: '$3,800,000',
    mileage: '40 hrs',
    fuel: 'Diesel',
    transmission: 'Automatic',
    image: 'https://images.unsplash.com/photo-1598371839696-5c5a1cfb1a8a?w=800&auto=format&fit=crop',
    rating: 4.9,
    reviews: 23,
    location: 'Miami, FL',
    brand: 'Pershing',
    model: '7X',
    color: 'Silver',
    category: 'luxury'
  },
  {
    id: 8,
    name: 'Grady-White Canyon 456',
    year: 2024,
    price: '$895,000',
    mileage: '100 hrs',
    fuel: 'Gasoline',
    transmission: 'Automatic',
    image: 'https://images.unsplash.com/photo-1598371839696-5c5a1cfb1a8a?w=800&auto=format&fit=crop',
    rating: 4.7,
    reviews: 34,
    location: 'New York, NY',
    brand: 'Grady-White',
    model: 'Canyon 456',
    color: 'Blue',
    category: 'fishing'
  },
  {
    id: 9,
    name: 'Hinckley Picnic Boat 40',
    year: 2023,
    price: '$1,250,000',
    mileage: '180 hrs',
    fuel: 'Diesel',
    transmission: 'Automatic',
    image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800&auto=format&fit=crop',
    rating: 4.6,
    reviews: 45,
    location: 'Boston, MA',
    brand: 'Hinckley',
    model: 'Picnic Boat 40',
    color: 'White',
    category: 'motor'
  },
]

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

export default function BoatsPage() {
  const [boats] = useState(allBoats)
  const [filteredBoats, setFilteredBoats] = useState(allBoats)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('newest')
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [activeFilters] = useState<FilterState>({
    brand: '',
    model: '',
    location: '',
    color: '',
    transmission: '',
    minPrice: '',
    maxPrice: '',
    year: ''
  })

  // Apply sorting
  const applySorting = () => {
    let filtered = [...boats]

    // Sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => b.year - a.year)
        break
      case 'price-low':
        filtered.sort((a, b) => 
          parseInt(a.price.replace(/[$,]/g, '')) - parseInt(b.price.replace(/[$,]/g, ''))
        )
        break
      case 'price-high':
        filtered.sort((a, b) => 
          parseInt(b.price.replace(/[$,]/g, '')) - parseInt(a.price.replace(/[$,]/g, ''))
        )
        break
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating)
        break
      default:
        break
    }

    setFilteredBoats(filtered)
  }

  // Handle sort change
  const handleSortChange = (value: string) => {
    setSortBy(value)
    setShowSortDropdown(false)
    applySorting()
  }

  // Toggle view mode
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'grid' ? 'list' : 'grid')
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="pb-24 md:pb-6">
        {/* Hero Section - Boats */}
        <section className="relative overflow-hidden border-b border-white/5">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-cyan-600/30" />
          <div className="absolute inset-0 bg-black/40" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="flex items-center gap-3 mb-2">
              <Anchor className="w-6 h-6 text-blue-400" />
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Luxury Boats
              </h1>
            </div>
            <p className="text-sm text-white/60 max-w-2xl">
              Discover premium yachts and boats from the world's finest manufacturers
            </p>
          </div>
        </section>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-1 mb-3">
            {/* Left side */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Results Count */}
              <span className="text-[10px] sm:text-xs text-white/40 whitespace-nowrap">
                {filteredBoats.length} boats
              </span>
            </div>

            {/* Right side: Sort + View Toggle (Mobile only) */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Sort Dropdown */}
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
                        onClick={() => handleSortChange(option.value)}
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

              {/* View Toggle - ONLY on mobile */}
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

          {/* Boat Grid/List */}
          <div className={`
            grid gap-2 sm:gap-3
            ${viewMode === 'grid' 
              ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
            }
          `}>
            {filteredBoats.map((boat, index) => (
              <motion.div
                key={boat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <CarCard car={boat} index={index} />
              </motion.div>
            ))}
          </div>

          {/* No Results */}
          {filteredBoats.length === 0 && (
            <div className="text-center py-8">
              <p className="text-white/40 text-sm">No boats found matching your criteria</p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}