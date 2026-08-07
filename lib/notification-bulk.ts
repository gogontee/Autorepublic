// lib/notification-bulk.ts
import { supabase } from './supabase/client'
import { NotificationType } from './notifications'

interface CreateBulkNotificationParams {
  userIds: string[]
  type: NotificationType
  title: string
  message: string
  link?: string
  metadata?: any
}

export async function createBulkNotification(params: CreateBulkNotificationParams) {
  const { userIds, type, title, message, link, metadata } = params

  if (userIds.length === 0) {
    console.error('No users to notify')
    return null
  }

  try {
    console.log(`📝 Creating bulk notification for ${userIds.length} users:`, { title })

    // 1. Create the notification record (single row) - user_id is NULL for bulk
    const { data: notification, error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: null, // ✅ Set to NULL for bulk notifications
        type,
        title,
        message,
        link: link || null,
        metadata: metadata || null,
        is_bulk: true,
        recipient_count: userIds.length,
        read_count: 0,
        is_read: false,
        is_seen: false,
      })
      .select()
      .single()

    if (notifError) {
      console.error('❌ Error creating notification:', notifError)
      return null
    }

    console.log('✅ Bulk notification created:', notification.id)

    // 2. Create recipient records in batches
    const batchSize = 100
    let successCount = 0

    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize)
      const recipientRecords = batch.map(userId => ({
        notification_id: notification.id,
        user_id: userId,
        is_read: false,
      }))

      const { error: recipientError } = await supabase
        .from('notification_recipients')
        .insert(recipientRecords)

      if (recipientError) {
        console.error('❌ Error creating recipients batch:', recipientError)
      } else {
        successCount += batch.length
        console.log(`✅ Created ${successCount}/${userIds.length} recipients`)
      }
    }

    console.log(`✅ Bulk notification complete: ${notification.id} (${successCount} recipients)`)

    return {
      ...notification,
      recipient_count: successCount,
    }
  } catch (err) {
    console.error('❌ Error creating bulk notification:', err)
    return null
  }
}