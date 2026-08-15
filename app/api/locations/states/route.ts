import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('state')
      .order('state')

    if (error) throw error

    // Get unique states
    const uniqueStates = Array.from(
      new Set(data.map(item => item.state))
    ).sort()

    return NextResponse.json({ states: uniqueStates })
  } catch (error) {
    console.error('Error fetching states:', error)
    return NextResponse.json(
      { error: 'Failed to fetch states' },
      { status: 500 }
    )
  }
}