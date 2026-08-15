import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const state = searchParams.get('state')

  console.log('Cities API called with state:', state)

  if (!state) {
    return NextResponse.json(
      { error: 'State parameter is required' },
      { status: 400 }
    )
  }

  try {
    // First, check if the state exists
    const { count, error: countError } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('state', state)

    if (countError) {
      console.error('Count error:', countError)
      return NextResponse.json(
        { error: 'Database error: ' + countError.message },
        { status: 500 }
      )
    }

    if (count === 0) {
      console.log('No records found for state:', state)
      return NextResponse.json({ cities: [] })
    }

    // Query the locations table for the specific state
    const { data, error } = await supabase
      .from('locations')
      .select('cities')
      .eq('state', state)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Database error: ' + error.message },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      console.log('No data found for state:', state)
      return NextResponse.json({ cities: [] })
    }

    // Extract city names from the JSONB array
    const cityNamesSet = new Set<string>()
    
    data.forEach(item => {
      if (item.cities && Array.isArray(item.cities)) {
        item.cities.forEach((cityObj: any) => {
          if (cityObj?.name && typeof cityObj.name === 'string') {
            const cityName = cityObj.name.trim()
            if (cityName) {
              cityNamesSet.add(cityName)
            }
          }
        })
      }
    })

    // Convert Set to array and sort alphabetically
    const sortedCities = Array.from(cityNamesSet).sort()

    console.log(`Found ${sortedCities.length} unique cities for ${state}:`, sortedCities)

    return NextResponse.json({ cities: sortedCities })

  } catch (error) {
    console.error('Error in /api/locations/cities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cities: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}