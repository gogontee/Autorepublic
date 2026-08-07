// app/api/cron/check-ads/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { checkAllAdStatuses } from '@/lib/notification-triggers'

export async function GET(request: NextRequest) {
  try {
    // Optional: Add a secret key for security
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all users who have ads - use select with distinct
    const { data: users, error } = await supabase
      .from('ads')
      .select('user_id')
      .order('user_id')

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Get unique user_ids
    const uniqueUserIds = [...new Set(users?.map(user => user.user_id) || [])]

    // Check ad statuses for each user
    let totalChecked = 0
    for (const userId of uniqueUserIds) {
      if (userId) {
        await checkAllAdStatuses(userId)
        totalChecked++
      }
    }

    return NextResponse.json({ 
      success: true, 
      users_checked: totalChecked,
      message: `Checked ads for ${totalChecked} users`
    })
  } catch (error) {
    console.error('Cron error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}