'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Vehicle } from '@/types/compare'
import Image from 'next/image'
import { X, ShoppingBag, ChevronLeft, ChevronRight, Info } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ComparisonTableProps {
  vehicles: Vehicle[]
  removeVehicle: (id: string) => void
  onAddVehicleClick?: () => void
}

interface CompareRow {
  label: string
  key?: keyof Vehicle
  render?: (vehicle: Vehicle) => React.ReactNode
}

const rows: CompareRow[] = [
  {
    label: 'Price',
    render: (vehicle) =>
      `₦${Number(vehicle.price).toLocaleString()}`,
  },
  {
    label: 'Year',
    key: 'year',
  },
  {
    label: 'Brand',
    key: 'brand',
  },
  {
    label: 'Model',
    key: 'model',
  },
  {
    label: 'Trim',
    key: 'trim',
  },
  {
    label: 'Condition',
    key: 'condition',
  },
  {
    label: 'Mileage',
    key: 'mileage',
  },
  {
    label: 'Fuel Type',
    key: 'fuel_type',
  },
  {
    label: 'Transmission',
    key: 'transmission',
  },
  {
    label: 'Engine',
    key: 'engine_type',
  },
  {
    label: 'Exterior Color',
    key: 'color',
  },
  {
    label: 'Interior Color',
    key: 'interior_color',
  },
  {
    label: 'Category',
    key: 'category',
  },
  {
    label: 'VIN',
    key: 'vin',
  },
  {
    label: 'Views',
    key: 'views',
  },
  {
    label: 'Location',
    render: (vehicle) =>
      [vehicle.city, vehicle.state, vehicle.country]
        .filter(Boolean)
        .join(', '),
  },
]

function valuesAreDifferent(
  vehicles: Vehicle[],
  row: CompareRow
) {
  if (vehicles.length < 2) return false

  const values = vehicles.map((vehicle) => {
    if (row.render) {
      return String(row.render(vehicle))
    }
    return String(vehicle[row.key!] ?? '')
  })

  return new Set(values).size > 1
}

export default function ComparisonTable({
  vehicles,
  removeVehicle,
  onAddVehicleClick,
}: ComparisonTableProps) {
  const router = useRouter()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)

  if (vehicles.length === 0) {
    return null
  }

  // Ensure we always have 3 vehicles (pad with null if needed)
  const paddedVehicles: (Vehicle | null)[] = [...vehicles]
  while (paddedVehicles.length < 3) {
    paddedVehicles.push(null)
  }

  // Handle "Buy This" button click
  const handleBuyThis = (vehicleId: string) => {
    router.push(`/vehicles/${vehicleId}`)
  }

  // Handle scroll to show/hide arrows
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setShowLeftArrow(scrollLeft > 20)
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20)
    }
  }

  // Check scroll on mount and resize
  useEffect(() => {
    handleScroll()
    const handleResize = () => handleScroll()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' })
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] overflow-hidden relative">
      {/* Header */}
      <div className="px-3 sm:px-4 py-2 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
        <span className="text-[8px] sm:text-[10px] font-medium text-white/30 uppercase tracking-wider">
          Comparison Table
        </span>
        <span className="text-[8px] sm:text-[10px] text-white/20">{vehicles.length} / 3</span>
      </div>

      {/* Scrollable Container */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="overflow-x-auto scrollbar-hide relative"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Grid: 4 columns - Attributes | Vehicle 1 | Vehicle 2 | Vehicle 3 */}
        <div className="grid grid-cols-4 min-w-[640px] sm:min-w-0 divide-x divide-white/5">
          
          {/* Column 1: Attributes with Logo and Title */}
          <div className="p-3 sm:p-4 bg-rose-500/10 flex flex-col items-center justify-center space-y-1.5 sm:space-y-2 min-w-[100px] sm:min-w-[120px]">
            <div className="relative w-7 h-7 sm:w-10 sm:h-10">
              <Image
                src="/autorepublic.png"
                alt="Auto Republic"
                fill
                className="object-contain opacity-60"
              />
            </div>
            <span className="text-[8px] sm:text-[10px] font-medium text-white/40 uppercase tracking-wider text-center">
              Attributes
            </span>
          </div>

          {/* Columns 2-4: Vehicle headers with images */}
          {paddedVehicles.map((vehicle, index) => (
            <div key={index} className="p-2 sm:p-3 bg-white/[0.02] relative min-w-[140px] sm:min-w-[180px]">
              {vehicle ? (
                <div className="space-y-1.5 sm:space-y-2">
                  {/* Remove Button */}
                  <button
                    onClick={() => removeVehicle(vehicle.id)}
                    className="absolute top-1 right-1 sm:top-2 sm:right-2 z-10 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-black/70 hover:bg-red-500 transition flex items-center justify-center"
                  >
                    <X className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                  </button>
                  {/* Image */}
                  <div className="aspect-[16/9] rounded-lg overflow-hidden bg-black/50">
                    {vehicle.cover_image ? (
                      <img
                        src={vehicle.cover_image}
                        alt={vehicle.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/10 text-[8px] sm:text-xs">
                        No Image
                      </div>
                    )}
                  </div>
                  {/* Title */}
                  <p className="text-[9px] sm:text-xs font-medium text-white truncate">
                    {vehicle.title}
                  </p>
                  {/* Car Code */}
                  <p className="text-[8px] sm:text-[10px] font-mono text-red-400/80 truncate">
                    {vehicle.car_code}
                  </p>
                  {/* Price */}
                  <p className="text-[10px] sm:text-sm font-bold text-red-500 truncate">
                    ₦{Number(vehicle.price).toLocaleString()}
                  </p>
                </div>
              ) : (
                <div 
                  className="aspect-[16/9] rounded-lg border-2 border-dashed border-white/5 flex flex-col items-center justify-center cursor-pointer hover:border-white/20 hover:bg-white/5 transition-all group"
                  onClick={onAddVehicleClick}
                >
                  <span className="text-xl sm:text-2xl text-white/10 group-hover:text-white/20 transition-colors">+</span>
                  <span className="text-[8px] sm:text-[10px] text-white/20 group-hover:text-white/30 transition-colors mt-0.5 sm:mt-1">Add Vehicle</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Attribute Rows - Same scrollable container */}
        <div className="divide-y divide-white/5">
          {rows.map((row) => {
            const isDifferent = valuesAreDifferent(
              vehicles.filter((v): v is Vehicle => v !== null),
              row
            )
            
            return (
              <div
                key={row.label}
                className={`grid grid-cols-4 min-w-[640px] sm:min-w-0 divide-x divide-white/5 ${
                  isDifferent ? 'bg-red-500/[0.03]' : ''
                }`}
              >
                {/* Attribute Label */}
                <div className="px-2 sm:px-4 py-2 sm:py-3 bg-rose-500/5 flex items-center min-w-[100px] sm:min-w-[120px]">
                  <span className="text-[9px] sm:text-[11px] font-medium text-white/40 truncate">
                    {row.label}
                  </span>
                </div>

                {/* Values for each vehicle */}
                {paddedVehicles.map((vehicle, index) => (
                  <div
                    key={`${index}-${row.label}`}
                    className={`px-2 sm:px-4 py-2 sm:py-3 flex items-center min-w-[140px] sm:min-w-[180px] ${
                      isDifferent && vehicle ? 'border-l-2 border-red-500/20' : ''
                    }`}
                  >
                    <span className="text-[10px] sm:text-[13px] text-white/80 truncate w-full">
                      {vehicle ? (
                        row.render
                          ? row.render(vehicle)
                          : vehicle[row.key!] ? (
                              String(vehicle[row.key!])
                            ) : (
                              <span className="text-white/20">—</span>
                            )
                      ) : (
                        <span className="text-white/10">—</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )
          })}

          {/* Buy This Row */}
          <div className="grid grid-cols-4 min-w-[640px] sm:min-w-0 divide-x divide-white/5 bg-gradient-to-r from-red-500/5 to-red-600/5">
            {/* Attribute Label */}
            <div className="px-2 sm:px-4 py-2.5 sm:py-4 bg-rose-500/10 flex items-center min-w-[100px] sm:min-w-[120px]">
              <span className="text-[8px] sm:text-[11px] font-medium text-white/60 truncate">
                Which one do you prefer?
              </span>
            </div>

            {/* Buy This Buttons for each vehicle */}
            {paddedVehicles.map((vehicle, index) => (
              <div
                key={`buy-${index}`}
                className="px-2 sm:px-4 py-2.5 sm:py-4 flex items-center justify-center min-w-[140px] sm:min-w-[180px]"
              >
                {vehicle ? (
                  <button
                    onClick={() => handleBuyThis(vehicle.id)}
                    className="w-full px-2 sm:px-4 py-1.5 sm:py-2 bg-red-500 hover:bg-red-600 rounded-lg sm:rounded-xl text-[9px] sm:text-xs font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1 sm:gap-2 shadow-lg shadow-red-500/20"
                  >
                    <ShoppingBag className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden xs:inline">Buy This</span>
                    <span className="xs:hidden">Detail</span>
                  </button>
                ) : (
                  <span className="text-[8px] sm:text-[10px] text-white/20">—</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Arrows - Mobile Only */}
      <div className="md:hidden absolute left-0 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
        <button
          onClick={scrollLeft}
          className={`pointer-events-auto w-6 h-6 rounded-full bg-black/70 backdrop-blur flex items-center justify-center border border-white/10 transition-opacity ${
            showLeftArrow ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ visibility: showLeftArrow ? 'visible' : 'hidden' }}
        >
          <ChevronLeft className="w-3.5 h-3.5 text-white/60" />
        </button>
      </div>
      <div className="md:hidden absolute right-0 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
        <button
          onClick={scrollRight}
          className={`pointer-events-auto w-6 h-6 rounded-full bg-black/70 backdrop-blur flex items-center justify-center border border-white/10 transition-opacity ${
            showRightArrow ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ visibility: showRightArrow ? 'visible' : 'hidden' }}
        >
          <ChevronRight className="w-3.5 h-3.5 text-white/60" />
        </button>
      </div>

      {/* Footer Disclaimer */}
      <div className="px-3 sm:px-4 py-3 border-t border-white/5 bg-white/[0.02]">
        <div className="flex items-start gap-2">
          <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/20 flex-shrink-0 mt-0.5" />
          <div className="text-[8px] sm:text-[10px] text-white/30 leading-relaxed">
            <p>
              This comparison information is based on the details provided by the dealer at the time of posting 
              on <span className="text-white/40">Auto Republic</span>.
            </p>
            <p className="mt-0.5">
              For complete vehicle specifications and features, we recommend researching each vehicle on 
              <span className="text-white/40"> Google</span> or the manufacturer's official website.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}