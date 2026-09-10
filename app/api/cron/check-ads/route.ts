// app/api/cron/check-ads/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import { checkAllAdStatuses } from '@/lib/notification-triggers'

// Force dynamic rendering - prevents static generation at build time
export const dynamic = 'force-dynamic'

// Optional: Set revalidation period (in seconds)
// export const revalidate = 3600 // Revalidate every hour

export async function GET(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
      console.error('CRON_SECRET is not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔍 Starting cron job: Checking ad statuses...')

    // Get users with active, approved, unpaused ads.
    const { data: ads, error } = await supabaseServer
      .from('ads')
      .select('user_id')
      .eq('status', 'active')
      .eq('approval', true)
      .eq('pause', false)
      .order('user_id')

    if (error) {
      console.error('❌ Error fetching ads:', error)
      return NextResponse.json(
        { error: 'Failed to process ad statuses' },
        { status: 500 }
      )
    }

    // Get unique user_ids
    const uniqueUserIds = [...new Set(ads?.map(ad => ad.user_id) || [])]
    console.log(`📊 Found ${uniqueUserIds.length} unique users with active ads`)

    // Check ad statuses for each user
    let totalChecked = 0
    let totalErrors = 0

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
        }
      }
    }

    console.log(`✅ Cron job completed: Checked ${totalChecked} users`)

    return NextResponse.json({
      success: true,
      users_checked: totalChecked,
      users_with_errors: totalErrors,
      message: `Checked ads for ${totalChecked} users${totalErrors > 0 ? ` (${totalErrors} errors)` : ''}`
    })
  } catch (error) {
    console.error('❌ Cron job error:', error)
    return NextResponse.json({
      error: 'Internal server error',
    }, { status: 500 })
  }
}