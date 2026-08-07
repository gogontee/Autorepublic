// lib/compare/searchVehicles.ts
import { supabase } from '@/lib/supabase/client'

export interface SearchResult {
  id: string
  user_id: string
  title: string
  brand: string
  model: string
  trim: string | null
  year: number
  price: number
  mileage: string | null
  fuel_type: string | null
  transmission: string | null
  color: string | null
  interior_color: string | null
  engine_type: string | null
  vin: string | null
  car_code: string | null
  description: string | null
  condition: string | null
  category: string | null
  images: string[] | null
  cover_image: string | null
  city: string | null
  state: string | null
  country: string | null
  phone: string | null
  status: string | null
  featured: boolean | null
  sold: boolean | null
  unavailable: boolean | null
  views: number | null
  report_counts: number | null
  created_at: string
  updated_at: string
  Removed?: boolean | null
  matchType: 'code' | 'code-prefix'
}

export async function searchVehicles(query: string): Promise<SearchResult[]> {
  const trimmed = query.trim()
  const upper = trimmed.toUpperCase()
  
  console.log('🔍 [searchVehicles] Called with:', { query, trimmed, upper })
  
  if (!trimmed || trimmed.length < 2) {
    console.log('❌ [searchVehicles] Query too short')
    return []
  }

  try {
    // FIRST: Let's just get ALL vehicles to see what's in the database
    console.log('🔍 [searchVehicles] Fetching all vehicles to debug...')
    const { data: allData, error: allError } = await supabase
      .from('vehicles')
      .select('id, title, car_code, status, sold, Removed')
      .limit(10)

    if (allError) {
      console.error('❌ [searchVehicles] Error fetching all vehicles:', allError)
    } else {
      console.log('📊 [searchVehicles] Sample vehicles in DB:', allData)
    }

    // NOW: Search by car_code with proper filters
    console.log(`🔍 [searchVehicles] Searching for car_code: "${upper}"`)
    
    // Try exact match with all filters
    const { data: exactMatch, error: exactError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('status', 'active')
      .eq('sold', false)
      .eq('Removed', false)
      .ilike('car_code', upper)

    if (exactError) {
      console.error('❌ [searchVehicles] Exact match error:', exactError)
    }

    if (exactMatch && exactMatch.length > 0) {
      console.log('✅ [searchVehicles] Found exact match:', exactMatch.length)
      return exactMatch.map((v: any) => ({
        ...v,
        matchType: 'code'
      }))
    }

    // Try without sold and Removed filters
    console.log('🔍 [searchVehicles] Trying without sold/Removed filters...')
    const { data: lessFiltered, error: lessError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('status', 'active')
      .ilike('car_code', upper)

    if (lessError) {
      console.error('❌ [searchVehicles] Less filtered error:', lessError)
    }

    if (lessFiltered && lessFiltered.length > 0) {
      console.log('✅ [searchVehicles] Found with less filters:', lessFiltered.length)
      // Filter out sold/removed in code
      const filtered = lessFiltered.filter((v: any) => 
        v.sold !== true && v.Removed !== true
      )
      if (filtered.length > 0) {
        return filtered.map((v: any) => ({
          ...v,
          matchType: 'code'
        }))
      }
      // If all are filtered out, still return them but log
      console.log('⚠️ [searchVehicles] Found but all are sold/removed')
    }

    // Try partial match
    console.log('🔍 [searchVehicles] Trying partial match...')
    const { data: partialMatch, error: partialError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('status', 'active')
      .ilike('car_code', `${upper}%`)

    if (partialError) {
      console.error('❌ [searchVehicles] Partial match error:', partialError)
    }

    if (partialMatch && partialMatch.length > 0) {
      console.log('✅ [searchVehicles] Found partial match:', partialMatch.length)
      const filtered = partialMatch.filter((v: any) => 
        v.sold !== true && v.Removed !== true
      )
      if (filtered.length > 0) {
        return filtered.map((v: any) => ({
          ...v,
          matchType: 'code-prefix'
        }))
      }
    }

    // Try contains match
    console.log('🔍 [searchVehicles] Trying contains match...')
    const { data: containsMatch, error: containsError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('status', 'active')
      .ilike('car_code', `%${upper}%`)
      .limit(5)

    if (containsError) {
      console.error('❌ [searchVehicles] Contains match error:', containsError)
    }

    if (containsMatch && containsMatch.length > 0) {
      console.log('✅ [searchVehicles] Found contains match:', containsMatch.length)
      const filtered = containsMatch.filter((v: any) => 
        v.sold !== true && v.Removed !== true
      )
      if (filtered.length > 0) {
        return filtered.map((v: any) => ({
          ...v,
          matchType: 'code-prefix'
        }))
      }
    }

    console.log('❌ [searchVehicles] No matches found for:', upper)
    return []
  } catch (err) {
    console.error('💥 [searchVehicles] Unexpected error:', err)
    return []
  }
}