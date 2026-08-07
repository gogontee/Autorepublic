'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus,
  CreditCard,
  ArrowRight,
  AlertCircle,
  Loader2,
  Heart,
  X
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import CarCard from '@/components/CarCard'

interface MyCartProps {
  userData?: {
    user: any
    profile: any
    session: any
  }
}

interface GarageItem {
  id: string
  user_id: string
  vehicle_id: string
  created_at: string
  vehicles: {
    id: string
    title: string
    brand: string
    model: string
    year: number
    price: number
    mileage: string
    fuel_type: string
    transmission: string
    cover_image: string
    images: string[]
    condition: string
    category: string
    car_code: string
    city: string
    state: string
    country: string
    views?: number
  }
}

export default function MyCart({ userData }: MyCartProps) {
  const { user, profile } = userData || {}
  const router = useRouter()
  const [items, setItems] = useState<GarageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [removingId, setRemovingId] = useState<string | null>(null)

  // Fetch garage items (previously cart)
  useEffect(() => {
    const fetchGarage = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('garage')
          .select(`
            id,
            user_id,
            vehicle_id,
            created_at,
            vehicles (
              id,
              title,
              brand,
              model,
              year,
              price,
              mileage,
              fuel_type,
              transmission,
              cover_image,
              images,
              condition,
              category,
              car_code,
              city,
              state,
              country,
              views
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching garage:', error)
          setError('Failed to load your garage')
          setLoading(false)
          return
        }

        if (data && data.length > 0) {
          // The data from Supabase returns vehicles as an array, but we need to handle it properly
          const formattedItems: GarageItem[] = data.map((item: any) => ({
            id: item.id,
            user_id: item.user_id,
            vehicle_id: item.vehicle_id,
            created_at: item.created_at,
            vehicles: item.vehicles // This should be a single object, not an array
          }))
          setItems(formattedItems)
        } else {
          setItems([])
        }
        setLoading(false)
      } catch (err) {
        console.error('Error:', err)
        setError('An unexpected error occurred')
        setLoading(false)
      }
    }

    fetchGarage()
  }, [user])

  // Remove item from garage
  const removeItem = async (id: string) => {
    setRemovingId(id)
    try {
      const { error } = await supabase
        .from('garage')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error removing from garage:', error)
        alert('Failed to remove from garage')
        setRemovingId(null)
        return
      }

      setItems(prev => prev.filter(item => item.id !== id))
      setRemovingId(null)
    } catch (err) {
      console.error('Error:', err)
      alert('An unexpected error occurred')
      setRemovingId(null)
    }
  }

  // Format location
  const formatLocation = (city: string, country: string) => {
    if (!city && !country) return 'Location Unknown'
    
    let location = ''
    if (city) {
      const cityFirstWord = city.split(' ')[0]
      location += cityFirstWord
    }
    
    if (country) {
      const countryAbbr = country.slice(0, 2).toUpperCase()
      location += location ? `, ${countryAbbr}` : countryAbbr
    }
    
    return location || 'Location Unknown'
  }

  // Get condition label
  const getConditionLabel = (condition: string) => {
    if (!condition) return 'Used'
    const cond = condition.toLowerCase()
    if (cond === 'brand new') return 'New'
    if (cond === 'foreign used') return 'F-Used'
    if (cond === 'local used') return 'L-Used'
    return condition.charAt(0).toUpperCase() + condition.slice(1)
  }

  // If no user is logged in
  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-white/40">Please log in to view your garage</p>
        <Link href="/auth/login" className="inline-block mt-4 px-6 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-medium text-white transition-colors">
          Login
        </Link>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto mb-4" />
        <p className="text-white/40">Loading your garage...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">My Garage</h2>
          <p className="text-sm text-white/40 mt-0.5">
            {items.length} vehicle{items.length !== 1 ? 's' : ''} saved for consideration
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full">
          <Heart className="w-4 h-4 text-red-500" />
          <span className="text-sm font-medium text-white">{items.length}</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/40">Your garage is empty</p>
          <p className="text-white/30 text-sm mb-4">Start saving vehicles you're interested in</p>
          <Link href="/vehicles" className="inline-block mt-4 px-6 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-medium text-white transition-colors">
            Browse Vehicles
          </Link>
        </div>
      ) : (
        <>
          {/* Garage Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {items.map((item, index) => {
              const vehicle = item.vehicles
              return (
                <div key={item.id} className="relative group">
                  <CarCard 
                    car={{
                      id: vehicle.id,
                      title: vehicle.title,
                      brand: vehicle.brand,
                      model: vehicle.model,
                      year: vehicle.year,
                      price: vehicle.price,
                      mileage: vehicle.mileage || 'N/A',
                      fuel_type: vehicle.fuel_type,
                      transmission: vehicle.transmission,
                      cover_image: vehicle.cover_image,
                      images: vehicle.images,
                      location: formatLocation(vehicle.city, vehicle.country),
                      conditionLabel: getConditionLabel(vehicle.condition),
                      condition: vehicle.condition,
                      rating: 4.5,
                      reviews: 0,
                      car_code: vehicle.car_code || undefined,
                    }}
                    index={index}
                  />
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(item.id)}
                    disabled={removingId === item.id}
                    className="absolute top-2 right-2 z-10 p-2 bg-black/70 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80 disabled:opacity-50"
                  >
                    {removingId === item.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5 text-white" />
                    )}
                  </button>

                  {/* Added Date */}
                  <div className="absolute bottom-2 left-2 z-10 px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded-full text-[8px] text-white/40">
                    Added {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </div>
              )
            })}
          </div>

          {/* View All Link */}
          <div className="mt-6 text-center">
            <Link 
              href="/garage" 
              className="text-sm text-red-500 hover:text-red-400 transition-colors font-medium"
            >
              View All in Garage →
            </Link>
          </div>
        </>
      )}
    </div>
  )
}