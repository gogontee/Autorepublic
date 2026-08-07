// components/compare/CompareSearchCard.tsx
'use client'

import { Plus, Car } from 'lucide-react'
import { SearchResult } from '@/lib/compare/searchVehicles'

interface CompareSearchCardProps {
  vehicle: SearchResult
  onSelect: (vehicle: SearchResult) => void
}

const badgeConfig = {
  code: { label: 'CODE', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  'code-prefix': { label: 'CODE', color: 'bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20' },
  brand: { label: 'BRAND', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  model: { label: 'MODEL', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  title: { label: 'TITLE', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  trim: { label: 'TRIM', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
}

export default function CompareSearchCard({
  vehicle,
  onSelect,
}: CompareSearchCardProps) {
  const config = badgeConfig[vehicle.matchType]

  return (
    <button
      onClick={() => onSelect(vehicle)}
      className="group w-full rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-red-500/30 transition-all duration-200 overflow-hidden"
    >
      <div className="flex items-center gap-3 p-3">
        {/* Image */}
        <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-black/50 flex-shrink-0">
          {vehicle.cover_image ? (
            <img
              src={vehicle.cover_image}
              alt={vehicle.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Car className="w-5 h-5 text-white/10" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-white truncate">
              {vehicle.title}
            </h4>
            <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-medium border ${config.color}`}>
              {config.label}
            </span>
          </div>
          <p className="text-xs text-white/40 truncate">
            {vehicle.brand} • {vehicle.model}
            {vehicle.trim && ` • ${vehicle.trim}`}
          </p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[10px] font-mono text-red-400/80">{vehicle.car_code}</span>
            <span className="text-[10px] text-white/30">•</span>
            <span className="text-[10px] text-white/50">{vehicle.year}</span>
            <span className="text-[10px] text-white/30">•</span>
            <span className="text-[10px] font-medium text-white/70">₦{Number(vehicle.price).toLocaleString()}</span>
          </div>
        </div>

        {/* Add Button */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/10 group-hover:bg-red-500 transition-colors flex items-center justify-center">
          <Plus className="w-4 h-4 text-red-400 group-hover:text-white transition-colors" />
        </div>
      </div>
    </button>
  )
}