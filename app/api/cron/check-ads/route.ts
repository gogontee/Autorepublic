// app/api/cron/check-ads/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { checkAllAdStatuses } from '@/lib/notification-triggers'

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase client is properly initialized
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('Missing NEXT_PUBLIC_SUPABASE_URL')
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase URL' },
        { status: 500 }
      )
    }

    // Optional: Add a secret key for security (recommended)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    // Only check auth if CRON_SECRET is set
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error('Unauthorized cron request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔍 Starting cron job: Checking ad statuses...')

    // Get all users who have active ads
    const { data: ads, error } = await supabase
      .from('ads')
      .select('user_id')
      .eq('status', 'active')
      .eq('approval', true)
      .order('user_id')

    if (error) {
      console.error('❌ Error fetching ads:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch ads', 
        details: error.message 
      }, { status: 500 })
    }

    // Get unique user_ids
    const uniqueUserIds = [...new Set(ads?.map(ad => ad.user_id) || [])]
    console.log(`📊 Found ${uniqueUserIds.length} unique users with active ads`)

    // Check ad statuses for each user
    let totalChecked = 0
    let totalErrors = 0
    const errors: string[] = []

    for (const userId of uniqueUserIds) {
      if (userId) {
        try {
          console.log(`🔄 Checking ads for user ${userId}...`)
          await checkAllAdStatuses(userId)
          totalChecked++
          console.log(`✅ Completed check for user ${userId}`)
        } catch (err) {
          console.error(`❌ Error checking ads for user ${userId}:`, err)
          totalErrors++
          errors.push(`User ${userId}: ${err instanceof Error ? err.message : 'Unknown error'}`)
        }
      }
    }

    console.log(`✅ Cron job completed: Checked ${totalChecked} users`)

    return NextResponse.json({ 
      success: true, 
      users_checked: totalChecked,
      users_with_errors: totalErrors,
      errors: errors.length > 0 ? errors : undefined,
      message: `Checked ads for ${totalChecked} users${totalErrors > 0 ? ` (${totalErrors} errors)` : ''}`
    })
  } catch (error) {
    console.error('❌ Cron job error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}