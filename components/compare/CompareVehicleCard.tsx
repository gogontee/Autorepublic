'use client'

import { X, Car, Calendar, DollarSign, Hash } from 'lucide-react'
import { Vehicle } from '@/types/compare'

interface CompareVehicleCardProps {
  vehicle: Vehicle
  onRemove: () => void
}

export default function CompareVehicleCard({
  vehicle,
  onRemove,
}: CompareVehicleCardProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#111111] shadow-lg">

      {/* Remove Button */}

      <button
        onClick={onRemove}
        className="absolute right-3 top-3 z-20 h-9 w-9 rounded-full bg-black/70 backdrop-blur hover:bg-red-600 transition"
      >
        <X className="mx-auto h-4 w-4 text-white" />
      </button>

      {/* Vehicle Image */}

      <div className="relative aspect-[16/10] bg-black">

        {vehicle.cover_image ? (

          <img
            src={vehicle.cover_image}
            alt={vehicle.title}
            className="h-full w-full object-cover"
          />

        ) : (

          <div className="flex h-full items-center justify-center">

            <Car className="h-14 w-14 text-white/20" />

          </div>

        )}

      </div>

      {/* Content */}

      <div className="p-5">

        <h3 className="line-clamp-2 text-lg font-bold text-white">
          {vehicle.title}
        </h3>

        <p className="mt-1 text-sm text-white/60">
          {vehicle.brand} • {vehicle.model}
          {vehicle.trim && ` • ${vehicle.trim}`}
        </p>

        {/* Price */}

        <div className="mt-4 flex items-center gap-2">

          <DollarSign className="h-4 w-4 text-red-500" />

          <span className="text-xl font-bold text-white">
            ${Number(vehicle.price).toLocaleString()}
          </span>

        </div>

        {/* Information */}

        <div className="mt-5 grid grid-cols-2 gap-3">

          <div className="rounded-xl bg-white/5 p-3">

            <div className="flex items-center gap-2 text-white/40">

              <Hash className="h-4 w-4" />

              <span className="text-xs uppercase">
                Code
              </span>

            </div>

            <p className="mt-1 font-mono text-red-400">
              {vehicle.car_code}
            </p>

          </div>

          <div className="rounded-xl bg-white/5 p-3">

            <div className="flex items-center gap-2 text-white/40">

              <Calendar className="h-4 w-4" />

              <span className="text-xs uppercase">
                Year
              </span>

            </div>

            <p className="mt-1 text-white">
              {vehicle.year}
            </p>

          </div>

        </div>

        {/* Footer */}

        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">

          <div>

            <p className="text-xs text-white/40">
              Condition
            </p>

            <p className="text-sm text-white">
              {vehicle.condition || 'N/A'}
            </p>

          </div>

          <div>

            <p className="text-xs text-white/40">
              Transmission
            </p>

            <p className="text-sm text-white">
              {vehicle.transmission || 'N/A'}
            </p>

          </div>

        </div>

      </div>

    </div>
  )
}