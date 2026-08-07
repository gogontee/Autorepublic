// lib/notification-triggers.ts
import { supabase } from './supabase/client'
import { createNotification, getNotificationByReference, NotificationType } from './notifications'

// Check and create notifications for transactions
export async function checkTransactionNotifications(userId: string) {
  try {
    // Get latest transactions for user
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (error || !transactions) return

    // Check each transaction for notifications
    for (const tx of transactions) {
      // Check if notification already exists for this transaction
      const existing = await getNotificationByReference(userId, 'transaction', tx.id)
      if (existing) continue

      // Create notification based on transaction type
      if (tx.type === 'debit' && tx.status === 'completed') {
        await createNotification({
          userId,
          type: 'transaction',
          title: 'Payment Debited',
          message: `₦${tx.amount.toLocaleString()} was debited from your wallet for ${tx.description || 'transaction'}`,
          link: '/dashboard/wallet',
          metadata: { reference_type: 'transaction', reference_id: tx.id, transaction_id: tx.id }
        })
      } else if (tx.type === 'credit' && tx.status === 'completed') {
        await createNotification({
          userId,
          type: 'wallet',
          title: 'Wallet Funded',
          message: `₦${tx.amount.toLocaleString()} was credited to your wallet`,
          link: '/dashboard/wallet',
          metadata: { reference_type: 'transaction', reference_id: tx.id, transaction_id: tx.id }
        })
      }
    }
  } catch (err) {
    console.error('Error checking transactions:', err)
  }
}

// Check and create notifications for ads
export async function checkAdNotifications(userId: string) {
  try {
    // Get all ads for user (not just latest)
    const { data: ads, error } = await supabase
      .from('ads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error || !ads) return

    for (const ad of ads) {
      // Check if notification already exists for this ad status change
      const existing = await getNotificationByReference(userId, 'ad', ad.id)
      
      // Get ad status
      const now = new Date()
      const start = new Date(ad.start_time)
      const end = new Date(ad.end_time)
      const isActive = ad.approval === true && ad.pause === false && now >= start && now <= end
      const isCompleted = ad.approval === true && ad.pause === false && now > end
      const isPending = ad.approval === false && ad.pause === false
      const isPaused = ad.pause === true

      // Notification: Ad Approved (when approval changes from false to true)
      if (ad.approval === true && !ad.pause) {
        // Check if approval notification already sent
        const approvalNotif = await getNotificationByReference(userId, 'ad_approved', ad.id)
        if (!approvalNotif) {
          await createNotification({
            userId,
            type: 'ad',
            title: '✅ Ad Approved!',
            message: `Your ad "${ad.text || 'Advertisement'}" has been approved and is now live! It will start running on ${new Date(ad.start_time).toLocaleDateString()}.`,
            link: '/ads/status',
            metadata: { 
              reference_type: 'ad_approved', 
              reference_id: ad.id,
              ad_id: ad.id,
              status: 'approved'
            }
          })
          console.log(`📢 Ad approved notification sent for ad ${ad.id}`)
        }
      }

      // Notification: Ad Rejected (if we had a rejection field - skip for now)

      // Notification: Ad Active (when ad becomes active)
      if (isActive) {
        const activeNotif = await getNotificationByReference(userId, 'ad_active', ad.id)
        if (!activeNotif) {
          await createNotification({
            userId,
            type: 'ad',
            title: '▶️ Ad Now Active',
            message: `Your ad "${ad.text || 'Advertisement'}" is now active and visible to users. It will run until ${new Date(ad.end_time).toLocaleDateString()}.`,
            link: '/ads/status',
            metadata: { 
              reference_type: 'ad_active', 
              reference_id: ad.id,
              ad_id: ad.id,
              status: 'active'
            }
          })
          console.log(`📢 Ad active notification sent for ad ${ad.id}`)
        }
      }

      // Notification: Ad Completed (when ad expires)
      if (isCompleted) {
        const completedNotif = await getNotificationByReference(userId, 'ad_completed', ad.id)
        if (!completedNotif) {
          // Get ad performance stats
          const viewCount = ad.view_count || 0
          const clickCount = ad.click_count || 0
          const ctr = viewCount > 0 ? ((clickCount / viewCount) * 100).toFixed(1) : '0.0'
          
          await createNotification({
            userId,
            type: 'ad',
            title: '📊 Ad Completed',
            message: `Your ad "${ad.text || 'Advertisement'}" has completed its run. Performance: ${viewCount} views, ${clickCount} clicks (${ctr}% CTR). Want to run it again?`,
            link: '/ads/status',
            metadata: { 
              reference_type: 'ad_completed', 
              reference_id: ad.id,
              ad_id: ad.id,
              status: 'completed',
              views: viewCount,
              clicks: clickCount,
              ctr: ctr
            }
          })
          console.log(`📢 Ad completed notification sent for ad ${ad.id}`)
        }
      }

      // Notification: Ad Paused
      if (isPaused) {
        const pausedNotif = await getNotificationByReference(userId, 'ad_paused', ad.id)
        if (!pausedNotif && ad.pause === true) {
          await createNotification({
            userId,
            type: 'ad',
            title: '⏸️ Ad Paused',
            message: `Your ad "${ad.text || 'Advertisement'}" has been paused. You can resume it anytime from your dashboard.`,
            link: '/ads/status',
            metadata: { 
              reference_type: 'ad_paused', 
              reference_id: ad.id,
              ad_id: ad.id,
              status: 'paused'
            }
          })
          console.log(`📢 Ad paused notification sent for ad ${ad.id}`)
        }
      }

      // Notification: Ad Pending
      if (isPending) {
        // Only send pending notification if not already sent
        const pendingNotif = await getNotificationByReference(userId, 'ad_pending', ad.id)
        if (!pendingNotif) {
          await createNotification({
            userId,
            type: 'ad',
            title: '⏳ Ad Pending Approval',
            message: `Your ad "${ad.text || 'Advertisement'}" has been submitted and is awaiting admin approval. You'll be notified once it's approved.`,
            link: '/ads/status',
            metadata: { 
              reference_type: 'ad_pending', 
              reference_id: ad.id,
              ad_id: ad.id,
              status: 'pending'
            }
          })
          console.log(`📢 Ad pending notification sent for ad ${ad.id}`)
        }
      }
    }
  } catch (err) {
    console.error('Error checking ads:', err)
  }
}

// Check and create notifications for vehicles
export async function checkVehicleNotifications(userId: string) {
  try {
    // Get latest vehicles for user
    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (error || !vehicles) return

    for (const vehicle of vehicles) {
      // Check if notification already exists
      const existing = await getNotificationByReference(userId, 'vehicle', vehicle.id)
      if (existing) continue

      // Vehicle status notifications
      if (vehicle.status === 'active') {
        await createNotification({
          userId,
          type: 'vehicle',
          title: 'Vehicle Listed',
          message: `Your ${vehicle.brand} ${vehicle.model} has been listed successfully!`,
          link: `/dashboard/${userId}/my-store`,
          metadata: { reference_type: 'vehicle', reference_id: vehicle.id, vehicle_id: vehicle.id }
        })
      } else if (vehicle.status === 'pending') {
        await createNotification({
          userId,
          type: 'vehicle',
          title: 'Vehicle Pending Review',
          message: `Your ${vehicle.brand} ${vehicle.model} is pending review.`,
          link: `/dashboard/${userId}/my-store`,
          metadata: { reference_type: 'vehicle', reference_id: vehicle.id, vehicle_id: vehicle.id }
        })
      } else if (vehicle.status === 'sold') {
        await createNotification({
          userId,
          type: 'vehicle',
          title: 'Vehicle Sold! 🎉',
          message: `Your ${vehicle.brand} ${vehicle.model} has been marked as sold.`,
          link: `/dashboard/${userId}/my-store`,
          metadata: { reference_type: 'vehicle', reference_id: vehicle.id, vehicle_id: vehicle.id }
        })
      }
    }
  } catch (err) {
    console.error('Error checking vehicles:', err)
  }
}

// Check and create notifications for vehicle reports
export async function checkVehicleReportNotifications(userId: string) {
  try {
    // Get vehicle reports for user's vehicles
    const { data: reports, error } = await supabase
      .from('vehicle_reports')
      .select(`
        *,
        vehicles!inner (
          id,
          brand,
          model,
          user_id
        )
      `)
      .eq('vehicles.user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error || !reports) return

    for (const report of reports) {
      // Check if notification already exists for this report
      const existing = await getNotificationByReference(userId, 'report', report.id)
      if (existing) continue

      // Create report notification
      await createNotification({
        userId,
        type: 'report',
        title: 'Vehicle Reported',
        message: `Your ${report.vehicles.brand} ${report.vehicles.model} has been reported for: ${report.reason}. Our team will review this shortly.`,
        link: `/vehicles/${report.vehicle_id}`,
        metadata: { 
          reference_type: 'report', 
          reference_id: report.id,
          vehicle_id: report.vehicle_id,
          report_id: report.id,
          reason: report.reason
        }
      })
    }
  } catch (err) {
    console.error('Error checking vehicle reports:', err)
  }
}

// Check all ad statuses for a user (run periodically)
export async function checkAllAdStatuses(userId: string) {
  try {
    // Get all ads for user
    const { data: ads, error } = await supabase
      .from('ads')
      .select('*')
      .eq('user_id', userId)

    if (error || !ads) return

    const now = new Date()

    for (const ad of ads) {
      const start = new Date(ad.start_time)
      const end = new Date(ad.end_time)
      
      // Check if ad just became active (start time has passed and it's approved)
      if (ad.approval === true && ad.pause === false && now >= start && now <= end) {
        const activeNotif = await getNotificationByReference(userId, 'ad_active', ad.id)
        if (!activeNotif) {
          await createNotification({
            userId,
            type: 'ad',
            title: '▶️ Ad Now Active',
            message: `Your ad "${ad.text || 'Advertisement'}" is now active and visible to users. It will run until ${new Date(ad.end_time).toLocaleDateString()}.`,
            link: '/ads/status',
            metadata: { 
              reference_type: 'ad_active', 
              reference_id: ad.id,
              ad_id: ad.id,
              status: 'active'
            }
          })
          console.log(`📢 Ad active notification sent for ad ${ad.id}`)
        }
      }
      
      // Check if ad just completed (end time has passed)
      if (ad.approval === true && ad.pause === false && now > end) {
        const completedNotif = await getNotificationByReference(userId, 'ad_completed', ad.id)
        if (!completedNotif) {
          const viewCount = ad.view_count || 0
          const clickCount = ad.click_count || 0
          const ctr = viewCount > 0 ? ((clickCount / viewCount) * 100).toFixed(1) : '0.0'
          
          await createNotification({
            userId,
            type: 'ad',
            title: '📊 Ad Completed',
            message: `Your ad "${ad.text || 'Advertisement'}" has completed its run. Performance: ${viewCount} views, ${clickCount} clicks (${ctr}% CTR). Want to run it again?`,
            link: '/ads/status',
            metadata: { 
              reference_type: 'ad_completed', 
              reference_id: ad.id,
              ad_id: ad.id,
              status: 'completed',
              views: viewCount,
              clicks: clickCount,
              ctr: ctr
            }
          })
          console.log(`📢 Ad completed notification sent for ad ${ad.id}`)
        }
      }
    }
  } catch (err) {
    console.error('Error checking ad statuses:', err)
  }
}

// Manual notification sender
export async function sendManualNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType = 'system',
  link?: string
) {
  return await createNotification({
    userId,
    type,
    title,
    message,
    link,
  })
}

// Check all activities for a user
export async function checkAllUserActivities(userId: string) {
  await Promise.all([
    checkTransactionNotifications(userId),
    checkAdNotifications(userId),
    checkVehicleNotifications(userId),
    checkVehicleReportNotifications(userId),
    checkAllAdStatuses(userId),
  ])
}