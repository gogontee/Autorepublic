// app/compare/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { Car, Search as SearchIcon } from 'lucide-react'

import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import Ads from '@/components/Ads'

import CompareSearch from '@/components/compare/CompareSearch'
import ComparisonTable from '@/components/compare/ComparisonTable'

import { Vehicle } from '@/types/compare'

// Key for localStorage
const STORAGE_KEY = 'compare_vehicles'

export default function ComparePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Load vehicles from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setVehicles(parsed)
        }
      } catch (e) {
        console.error('Failed to parse saved vehicles:', e)
      }
    }
    setIsLoaded(true)
  }, [])

  // Save vehicles to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      if (vehicles.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles))
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [vehicles, isLoaded])

  // Handle removing a vehicle
  const handleRemoveVehicle = (id: string) => {
    setVehicles(prev => prev.filter(v => v.id !== id))
  }

  // Handle "Add Vehicle" click - scroll to search and focus
  const handleAddVehicleClick = () => {
    if (searchRef.current) {
      // Scroll to the search section
      searchRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      })
      
      // Focus the input after scrolling
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus()
        }
      }, 500)
    }
  }

  // Show loading state while restoring from localStorage
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Ads className="rounded-2xl overflow-hidden shadow-lg shadow-red-500/5" />
        </div>
        <main className="pb-24 md:pb-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
              <span className="ml-3 text-white/40 text-sm">Loading your comparison...</span>
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <Header />

      {/* Ads - Below Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <Ads className="rounded-2xl overflow-hidden shadow-lg shadow-red-500/5" />
      </div>

      {/* Main Content */}
      <main className="pb-24 md:pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          
          {/* Page Header - Minimal */}
          <div className="mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <Car className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Compare Vehicles</h1>
              <p className="text-xs text-white/40">Compare up to 3 vehicles by their Tag</p>
            </div>
          </div>

          {/* Search Component - with refs for focusing */}
          <div ref={searchRef}>
            <CompareSearch
              vehicles={vehicles}
              setVehicles={setVehicles}
              inputRef={searchInputRef}
            />
          </div>

          {/* Comparison Table */}
          {vehicles.length > 0 && (
            <div className="mt-6">
              <ComparisonTable 
                vehicles={vehicles} 
                removeVehicle={handleRemoveVehicle}
                onAddVehicleClick={handleAddVehicleClick}
              />
            </div>
          )}

          {/* Empty State */}
          {vehicles.length === 0 && (
            <div className="mt-8 text-center py-16 bg-white/5 rounded-3xl border border-white/5">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <SearchIcon className="w-10 h-10 text-white/20" />
              </div>
              <h3 className="text-lg font-medium text-white/60">No Vehicles Selected</h3>
              <p className="text-sm text-white/30 mt-1 max-w-md mx-auto">
                Search for vehicles using their Tag above to compare them side by side.
              </p>
            </div>
          )}

        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}