'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Search, Loader2, AlertCircle, Sparkles, ArrowRight, Hash } from 'lucide-react'

import { Vehicle } from '@/types/compare'
import {
  searchVehicles,
  SearchResult,
} from '@/lib/compare/searchVehicles'

import CompareSearchCard from './CompareSearchCard'
import CompareConfirmModal from './CompareConfirmModal'

interface CompareSearchProps {
  vehicles: Vehicle[]
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>
  inputRef?: React.RefObject<HTMLInputElement>
}

export default function CompareSearch({
  vehicles,
  setVehicles,
  inputRef,
}: CompareSearchProps) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [confirmVehicle, setConfirmVehicle] = useState<SearchResult | null>(null)
  const [error, setError] = useState('')
  const searchRef = useRef<HTMLDivElement>(null)
  const internalInputRef = useRef<HTMLInputElement>(null)
  const activeInputRef = inputRef || internalInputRef

  // Close search on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Smart search - only by car_code
  useEffect(() => {
    const value = query.trim().toUpperCase()
    
    console.log('🔍 Search query:', value)
    
    // Only search if it looks like a car code (alphanumeric, 2+ chars)
    if (value.length < 2) {
      setResults([])
      setShowResults(false)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        console.log('🔍 Calling searchVehicles with:', value)
        const data = await searchVehicles(value)
        console.log('📊 Search results:', data.length, data)
        setResults(data)
        setShowResults(data.length > 0)
      } catch (err) {
        console.error('Search error:', err)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const handleSelectVehicle = (vehicle: SearchResult) => {
    setShowResults(false)
    setConfirmVehicle(vehicle)
  }

  const handleConfirmVehicle = (vehicle: SearchResult) => {
    setError('')

    if (vehicles.length >= 3) {
      setConfirmVehicle(null)
      setError('You can compare a maximum of three vehicles.')
      return
    }

    const exists = vehicles.some((item) => item.id === vehicle.id)
    if (exists) {
      setConfirmVehicle(null)
      setError('This vehicle has already been added.')
      return
    }

    setVehicles((prev) => [...prev, vehicle])
    setQuery('')
    setResults([])
    setShowResults(false)
    setConfirmVehicle(null)
  }

  return (
    <div className="space-y-4">
      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Search */}
      <div ref={searchRef} className="relative">
        {/* Search Bar - Compact & Sleek with border */}
        <div className="bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/15 p-4 transition-all hover:border-white/25 focus-within:border-red-500/50">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            {/* Left side - Icon & Input */}
            <div className="flex items-center gap-2 flex-1">
              {/* Icon */}
              <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/10 flex items-center justify-center">
                <Hash className="w-4 h-4 text-red-400" />
              </div>
              
              {/* Input */}
              <div className="flex-1 relative">
                <input
                  ref={activeInputRef}
                  value={query}
                  onChange={(e) => {
                    // Only allow alphanumeric and hyphens
                    const value = e.target.value.replace(/[^A-Za-z0-9-]/g, '').toUpperCase()
                    setQuery(value)
                  }}
                  placeholder="Enter vehicle tag (e.g. 5H60)"
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/30 outline-none py-2 px-1 font-mono uppercase"
                  autoFocus={false}
                  autoComplete="off"
                  spellCheck={false}
                />
                {query.length > 0 && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] text-white/20 font-mono">
                    {query.length}/10
                  </div>
                )}
              </div>

              {/* Loading / Search Icon */}
              <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                ) : (
                  <Search className="w-4 h-4 text-white/30" />
                )}
              </div>
            </div>

            {/* Right side - Info Text (Desktop only) */}
            <div className="hidden sm:flex items-center gap-3 flex-shrink-0 pl-4 border-l border-white/5">
              <div className="flex items-center gap-2 text-[10px] text-white/30">
                <Hash className="w-3 h-3" />
                <span>Enter Vehicle Tag</span>
              </div>
              <ArrowRight className="w-3 h-3 text-white/20" />
              <span className="text-[10px] text-white/20 font-mono">5H60</span>
            </div>
          </div>

          {/* Quick Tips - Below (only on mobile or when no query) */}
          {query.length === 0 && (
            <div className="mt-2 flex items-center gap-2 px-1 sm:hidden">
              <span className="text-[10px] text-white/20">Example:</span>
              <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full font-mono">5H60</span>
              <span className="text-[10px] text-white/20">•</span>
              <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full font-mono">D34R</span>
              <span className="text-[10px] text-white/20">•</span>
              <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full font-mono">W40H</span>
            </div>
          )}
        </div>

        {/* Search Results */}
        {showResults && (
          <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-[400px] overflow-y-auto rounded-2xl border border-white/10 bg-[#0f0f0f] p-2 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
            {results.length > 0 ? (
              <div className="space-y-1.5">
                {results.map((vehicle) => (
                  <CompareSearchCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    onSelect={handleSelectVehicle}
                  />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-white/40">
                  No vehicle found with tag "<span className="text-white/60 font-mono">{query}</span>"
                </p>
                <p className="text-xs text-white/20 mt-1">
                  Make sure you entered the correct vehicle tag
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <CompareConfirmModal
        open={!!confirmVehicle}
        vehicle={confirmVehicle}
        onClose={() => setConfirmVehicle(null)}
        onConfirm={handleConfirmVehicle}
      />
    </div>
  )
}