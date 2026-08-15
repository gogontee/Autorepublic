'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { MapPin, ChevronDown, X, Check, Loader2 } from 'lucide-react'

interface LocationFilterProps {
  selectedState: string | null
  selectedCity: string | null
  onStateChange: (state: string | null) => void
  onCityChange: (city: string | null) => void
}

export default function LocationFilter({
  selectedState,
  selectedCity,
  onStateChange,
  onCityChange
}: LocationFilterProps) {
  const [states, setStates] = useState<string[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [isStateOpen, setIsStateOpen] = useState(false)
  const [isCityOpen, setIsCityOpen] = useState(false)
  const [isLoadingStates, setIsLoadingStates] = useState(false)
  const [isLoadingCities, setIsLoadingCities] = useState(false)
  const [stateSearch, setStateSearch] = useState('')
  const [citySearch, setCitySearch] = useState('')
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, minWidth: 0 })
  const [isPositionReady, setIsPositionReady] = useState(false)
  
  const stateRef = useRef<HTMLDivElement>(null)
  const cityRef = useRef<HTMLDivElement>(null)
  const stateButtonRef = useRef<HTMLButtonElement>(null)
  const cityButtonRef = useRef<HTMLButtonElement>(null)

  console.log('🔍 LocationFilter props:', { selectedState, selectedCity })

  // Fetch states on mount
  useEffect(() => {
    fetchStates()
  }, [])

  // Fetch cities when state changes
  useEffect(() => {
    console.log('📍 LocationFilter - selectedState changed:', selectedState)
    if (selectedState) {
      fetchCities(selectedState)
    } else {
      setCities([])
    }
  }, [selectedState])

  // Click outside handlers - FIXED for portal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      // Handle state dropdown outside click
      if (isStateOpen) {
        // Check if click is on the button
        if (stateButtonRef.current && stateButtonRef.current.contains(target)) {
          return // Don't close if clicking the button
        }

        // Check if click is inside the portal dropdown
        const dropdown = document.querySelector('[data-location-state-dropdown]')
        if (dropdown && dropdown.contains(target)) {
          return // Don't close if clicking inside the dropdown
        }

        // Click is outside both button and dropdown
        setIsStateOpen(false)
        setIsPositionReady(false)
      }

      // Handle city dropdown outside click
      if (isCityOpen) {
        // Check if click is on the button
        if (cityButtonRef.current && cityButtonRef.current.contains(target)) {
          return // Don't close if clicking the button
        }

        // Check if click is inside the portal dropdown
        const dropdown = document.querySelector('[data-location-city-dropdown]')
        if (dropdown && dropdown.contains(target)) {
          return // Don't close if clicking inside the dropdown
        }

        // Click is outside both button and dropdown
        setIsCityOpen(false)
        setIsPositionReady(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isStateOpen, isCityOpen])

  // Update dropdown position
  const updateDropdownPosition = useCallback(() => {
    let rect: DOMRect | null = null
    
    if (isStateOpen && stateButtonRef.current) {
      rect = stateButtonRef.current.getBoundingClientRect()
    } else if (isCityOpen && cityButtonRef.current) {
      rect = cityButtonRef.current.getBoundingClientRect()
    }
    
    if (rect) {
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        minWidth: Math.max(rect.width, 200)
      })
      setIsPositionReady(true)
    }
  }, [isStateOpen, isCityOpen])

  // Pre-calculate position before opening
  useEffect(() => {
    if (isStateOpen || isCityOpen) {
      requestAnimationFrame(() => {
        updateDropdownPosition()
      })
    } else {
      setIsPositionReady(false)
    }
  }, [isStateOpen, isCityOpen, updateDropdownPosition])

  const fetchStates = async () => {
    console.log('🔄 Fetching states...')
    setIsLoadingStates(true)
    try {
      const response = await fetch('/api/locations/states')
      console.log('📡 States API response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch states: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('📦 States data received:', data)
      
      const statesList = data.states || []
      setStates(statesList)
      console.log('✅ States set in state:', statesList.length, 'states')
    } catch (error) {
      console.error('❌ Error fetching states:', error)
    } finally {
      setIsLoadingStates(false)
    }
  }

  const fetchCities = async (state: string) => {
    console.log('🔄 Fetching cities for state:', state)
    setIsLoadingCities(true)
    try {
      const response = await fetch(`/api/locations/cities?state=${encodeURIComponent(state)}`)
      console.log('📡 Cities API response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch cities: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('📦 Cities data received:', data)
      
      const citiesList = data.cities || []
      setCities(citiesList)
      console.log('✅ Cities set in state:', citiesList.length, 'cities')
    } catch (error) {
      console.error('❌ Error fetching cities:', error)
    } finally {
      setIsLoadingCities(false)
    }
  }

  const filteredStates = states.filter(state =>
    state.toLowerCase().includes(stateSearch.toLowerCase())
  )

  const filteredCities = cities.filter(city =>
    city.toLowerCase().includes(citySearch.toLowerCase())
  )

  const clearLocation = () => {
    console.log('🧹 Clearing location')
    onStateChange(null)
    onCityChange(null)
    setStateSearch('')
    setCitySearch('')
    setIsStateOpen(false)
    setIsCityOpen(false)
    setIsPositionReady(false)
  }

  const handleStateSelect = (state: string) => {
    console.log('📍 State selected in LocationFilter:', state)
    setIsStateOpen(false)
    setIsPositionReady(false)
    setStateSearch('')
    onStateChange(state)
  }

  const handleCitySelect = (city: string | null) => {
    console.log('📍 City selected in LocationFilter:', city)
    setIsCityOpen(false)
    setIsPositionReady(false)
    setCitySearch('')
    onCityChange(city)
  }

  const toggleStateDropdown = () => {
    console.log('🔄 Toggling state dropdown, current state:', isStateOpen)
    if (!isStateOpen) {
      if (stateButtonRef.current) {
        const rect = stateButtonRef.current.getBoundingClientRect()
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          minWidth: Math.max(rect.width, 200)
        })
        setIsPositionReady(true)
      }
    }
    setIsStateOpen(!isStateOpen)
    setIsCityOpen(false)
  }

  const toggleCityDropdown = () => {
    console.log('🔄 Toggling city dropdown, current state:', isCityOpen)
    if (!isCityOpen) {
      if (cityButtonRef.current) {
        const rect = cityButtonRef.current.getBoundingClientRect()
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          minWidth: Math.max(rect.width, 200)
        })
        setIsPositionReady(true)
      }
    }
    setIsCityOpen(!isCityOpen)
    setIsStateOpen(false)
  }

  // Render state dropdown
  const renderStateDropdown = () => {
    if (!isStateOpen) return null

    return createPortal(
      <div 
        data-location-state-dropdown
        className="fixed bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-[99999]"
        style={{
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          minWidth: dropdownPosition.minWidth || '200px',
          maxWidth: '280px',
          opacity: isPositionReady ? 1 : 0,
          transition: 'opacity 0.15s ease'
        }}
      >
        <div className="p-2 border-b border-white/5">
          <input
            type="text"
            placeholder="Search states..."
            value={stateSearch}
            onChange={(e) => setStateSearch(e.target.value)}
            className="w-full px-3 py-1.5 bg-white/5 text-white text-xs rounded-lg border border-white/10 focus:border-red-500/50 focus:outline-none placeholder:text-white/30"
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        <div className="max-h-48 overflow-y-auto scrollbar-thin">
          {isLoadingStates ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
            </div>
          ) : filteredStates.length === 0 ? (
            <div className="text-center py-6 text-white/40 text-xs">
              {states.length === 0 ? 'No states found' : 'No matching states'}
            </div>
          ) : (
            filteredStates.map((state) => (
              <button
                key={state}
                onClick={() => handleStateSelect(state)}
                className={`
                  w-full flex items-center justify-between px-3 py-2 text-xs transition-colors
                  ${selectedState === state
                    ? 'bg-red-500/10 text-red-500'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }
                `}
              >
                <span>{state}</span>
                {selectedState === state && (
                  <Check className="w-3.5 h-3.5" />
                )}
              </button>
            ))
          )}
        </div>
      </div>,
      document.body
    )
  }

  // Render city dropdown
  const renderCityDropdown = () => {
    if (!isCityOpen || !selectedState) return null

    return createPortal(
      <div 
        data-location-city-dropdown
        className="fixed bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-[99999]"
        style={{
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          minWidth: dropdownPosition.minWidth || '200px',
          maxWidth: '280px',
          opacity: isPositionReady ? 1 : 0,
          transition: 'opacity 0.15s ease'
        }}
      >
        <div className="p-2 border-b border-white/5">
          <input
            type="text"
            placeholder="Search cities..."
            value={citySearch}
            onChange={(e) => setCitySearch(e.target.value)}
            className="w-full px-3 py-1.5 bg-white/5 text-white text-xs rounded-lg border border-white/10 focus:border-red-500/50 focus:outline-none placeholder:text-white/30"
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        <div className="max-h-48 overflow-y-auto scrollbar-thin">
          {isLoadingCities ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
            </div>
          ) : cities.length === 0 ? (
            <div className="text-center py-6 text-white/40 text-xs">
              No cities found for this state
            </div>
          ) : (
            <>
              <button
                onClick={() => handleCitySelect(null)}
                className={`
                  w-full flex items-center justify-between px-3 py-2 text-xs transition-colors
                  ${!selectedCity
                    ? 'bg-red-500/10 text-red-500'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }
                `}
              >
                <span>All Cities</span>
                {!selectedCity && (
                  <Check className="w-3.5 h-3.5" />
                )}
              </button>

              <div className="border-t border-white/5" />

              {filteredCities.length === 0 ? (
                <div className="text-center py-6 text-white/40 text-xs">
                  No matching cities
                </div>
              ) : (
                filteredCities.map((city) => (
                  <button
                    key={city}
                    onClick={() => handleCitySelect(city)}
                    className={`
                      w-full flex items-center justify-between px-3 py-2 text-xs transition-colors
                      ${selectedCity === city
                        ? 'bg-red-500/10 text-red-500'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                      }
                    `}
                  >
                    <span>{city}</span>
                    {selectedCity === city && (
                      <Check className="w-3.5 h-3.5" />
                    )}
                  </button>
                ))
              )}
            </>
          )}
        </div>
      </div>,
      document.body
    )
  }

  return (
    <div className="flex items-center gap-2">
      {/* State Dropdown */}
      <div ref={stateRef} className="relative inline-block">
        <button
          ref={stateButtonRef}
          onClick={toggleStateDropdown}
          className={`
            flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap
            ${selectedState
              ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20'
              : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white/80'
            }
          `}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span className="min-w-[40px]">{selectedState || 'State'}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${isStateOpen ? 'rotate-180' : ''}`} />
          {selectedState && (
            <span
              onClick={(e) => {
                e.stopPropagation()
                clearLocation()
              }}
              className="ml-0.5 hover:bg-white/10 rounded-full p-0.5 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </span>
          )}
        </button>

        {renderStateDropdown()}
      </div>

      {/* City Dropdown - Only show if state is selected */}
      {selectedState && (
        <div ref={cityRef} className="relative inline-block">
          <button
            ref={cityButtonRef}
            onClick={toggleCityDropdown}
            className={`
              flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap
              ${selectedCity
                ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20'
                : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white/80'
              }
            `}
          >
            <span className="min-w-[40px]">{selectedCity || 'City'}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${isCityOpen ? 'rotate-180' : ''}`} />
            {selectedCity && (
              <span
                onClick={(e) => {
                  e.stopPropagation()
                  onCityChange(null)
                }}
                className="ml-0.5 hover:bg-white/10 rounded-full p-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </span>
            )}
          </button>

          {renderCityDropdown()}
        </div>
      )}
    </div>
  )
}