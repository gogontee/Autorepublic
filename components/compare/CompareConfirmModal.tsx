'use client'

import { X, Plus, Calendar, Tag, Hash, Car } from 'lucide-react'
import { SearchResult } from '@/lib/compare/searchVehicles'

interface CompareConfirmModalProps {
  open: boolean
  vehicle: SearchResult | null
  onClose: () => void
  onConfirm: (vehicle: SearchResult) => void
}

export default function CompareConfirmModal({
  open,
  vehicle,
  onClose,
  onConfirm,
}: CompareConfirmModalProps) {
  if (!open || !vehicle) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal - Compact */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl bg-[#111111] border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Compact Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-red-500 font-medium">
                Vehicle Found
              </span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="text-[10px] text-white/40">Add to Compare</span>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/5 hover:bg-red-500/20 transition flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5 text-white/60 hover:text-white" />
            </button>
          </div>

          {/* Compact Image */}
          <div className="aspect-[21/9] bg-black relative">
            {vehicle.cover_image ? (
              <img
                src={vehicle.cover_image}
                alt={vehicle.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Car className="w-10 h-10 text-white/20" />
              </div>
            )}
            {/* Car Code Badge on Image */}
            <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 backdrop-blur-sm rounded-full">
              <span className="font-mono text-[10px] text-red-400">{vehicle.car_code}</span>
            </div>
          </div>

          {/* Compact Content */}
          <div className="p-4">
            {/* Title & Price Row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white truncate">{vehicle.title}</h3>
                <p className="text-xs text-white/40 truncate">
                  {vehicle.brand} • {vehicle.model}
                  {vehicle.trim && ` • ${vehicle.trim}`}
                </p>
              </div>
              <div className="flex-shrink-0">
                <span className="text-sm font-bold text-red-500">
                  ${Number(vehicle.price).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Compact Info Grid - 2 columns */}
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              <div className="flex items-center gap-1.5 text-xs">
                <Calendar className="w-3 h-3 text-white/30" />
                <span className="text-white/60">{vehicle.year}</span>
              </div>
              {vehicle.condition && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-white/60">Condition:</span>
                  <span className="text-green-400 capitalize">{vehicle.condition}</span>
                </div>
              )}
              {vehicle.mileage && (
                <div className="flex items-center gap-1.5 text-xs col-span-2">
                  <span className="text-white/60">Mileage:</span>
                  <span className="text-white">{vehicle.mileage}</span>
                </div>
              )}
              {vehicle.fuel_type && (
                <div className="flex items-center gap-1.5 text-xs col-span-2">
                  <span className="text-white/60">Fuel:</span>
                  <span className="text-white capitalize">{vehicle.fuel_type}</span>
                </div>
              )}
            </div>

            {/* Compact Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={onClose}
                className="h-9 rounded-xl border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirm(vehicle)}
                className="h-9 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold flex items-center justify-center gap-1.5 transition text-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add to Compare
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}