// lib/notifications.ts
import { supabase } from './supabase/client'

export interface Notification {
  id: string
  user_id: string | null // Allow null for bulk notifications
  type: 'transaction' | 'ad' | 'vehicle' | 'system' | 'wallet' | 'report'
  title: string
  message: string
  link?: string
  is_read: boolean
  is_seen: boolean
  metadata?: any
  created_at: string
  read_at?: string
  // Bulk notification fields
  is_bulk?: boolean
  recipient_count?: number
  read_count?: number
}

export type NotificationType = 'transaction' | 'ad' | 'vehicle' | 'system' | 'wallet' | 'report'

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
  metadata?: any
}

// Create a single notification
export async function createNotification(params: CreateNotificationParams) {
  const { userId, type, title, message, link, metadata } = params

  try {
    console.log('📝 Creating notification for user:', userId)

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        link: link || null,
        metadata: metadata || null,
        is_read: false,
        is_seen: false,
        is_bulk: false,
        recipient_count: 0,
        read_count: 0,
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating notification:', error)
      return null
    }

    console.log('✅ Notification created:', data)
    return data
  } catch (err) {
    console.error('❌ Error creating notification:', err)
    return null
  }
}

// Get user notifications (including bulk notifications the user is part of)
export async function getNotifications(userId: string, limit: number = 50) {
  try {
    // Get regular notifications for the user AND bulk notifications (user_id is NULL for bulk)
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        notification_recipients!left (
          is_read,
          read_at,
          user_id
        )
      `)
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('❌ Error fetching notifications:', error)
      return []
    }

    // Transform data to include user-specific read status for bulk notifications
    const transformedData = data?.map((notification: any) => {
      // If it's a bulk notification (user_id is NULL), check if this user is a recipient
      if (notification.user_id === null && notification.is_bulk) {
        const recipient = notification.notification_recipients?.find(
          (r: any) => r.user_id === userId
        )
        return {
          ...notification,
          is_read: recipient?.is_read || false,
          read_at: recipient?.read_at || null,
        }
      }
      return notification
    }) || []

    console.log(`✅ Fetched ${transformedData.length} notifications for user ${userId}`)
    return transformedData as Notification[]
  } catch (err) {
    console.error('❌ Error fetching notifications:', err)
    return []
  }
}

// Mark notification as read (handles both regular and bulk)
export async function markAsRead(notificationId: string, userId?: string) {
  try {
    // First check if it's a bulk notification
    const { data: notification } = await supabase
      .from('notifications')
      .select('is_bulk, user_id')
      .eq('id', notificationId)
      .single()

    if (notification?.is_bulk && userId) {
      // For bulk notifications, update the recipient record
      const { error } = await supabase
        .from('notification_recipients')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('notification_id', notificationId)
        .eq('user_id', userId)

      if (error) {
        console.error('❌ Error marking bulk notification as read:', error)
        return false
      }
      console.log(`✅ Bulk notification ${notificationId} marked as read for user ${userId}`)
      return true
    } else {
      // Regular notification
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId)

      if (error) {
        console.error('❌ Error marking notification as read:', error)
        return false
      }
      console.log(`✅ Notification ${notificationId} marked as read`)
      return true
    }
  } catch (err) {
    console.error('❌ Error marking as read:', err)
    return false
  }
}

// Mark all notifications as read (handles both regular and bulk)
export async function markAllAsRead(userId: string) {
  try {
    console.log(`📝 Marking all notifications as read for user ${userId}`)

    // Mark regular notifications as read
    const { error: regularError } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('is_read', false)
      .eq('is_bulk', false)

    if (regularError) {
      console.error('❌ Error marking regular notifications as read:', regularError)
    } else {
      console.log('✅ Regular notifications marked as read')
    }

    // Mark bulk notifications as read for this user
    const { error: bulkError } = await supabase
      .from('notification_recipients')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (bulkError) {
      console.error('❌ Error marking bulk notifications as read:', bulkError)
    } else {
      console.log('✅ Bulk notifications marked as read')
    }

    return true
  } catch (err) {
    console.error('❌ Error marking all as read:', err)
    return false
  }
}

// Delete notification (handles both regular and bulk)
export async function deleteNotification(notificationId: string) {
  try {
    console.log(`📝 Deleting notification ${notificationId}`)

    // Check if it's a bulk notification
    const { data: notification } = await supabase
      .from('notifications')
      .select('is_bulk')
      .eq('id', notificationId)
      .single()

    if (notification?.is_bulk) {
      // For bulk notifications, delete all recipient records first
      const { error: recipientError } = await supabase
        .from('notification_recipients')
        .delete()
        .eq('notification_id', notificationId)

      if (recipientError) {
        console.error('❌ Error deleting bulk recipients:', recipientError)
      } else {
        console.log('✅ Bulk recipients deleted')
      }
    }

    // Delete the notification
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) {
      console.error('❌ Error deleting notification:', error)
      return false
    }

    console.log(`✅ Notification ${notificationId} deleted`)
    return true
  } catch (err) {
    console.error('❌ Error deleting notification:', err)
    return false
  }
}

// Get unread count (handles both regular and bulk)
export async function getUnreadCount(userId: string) {
  try {
    // Get unread regular notifications
    const { count: regularCount, error: regularError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .eq('is_bulk', false)

    if (regularError) {
      console.error('❌ Error getting regular unread count:', regularError)
    }

    // Get unread bulk notifications for this user
    const { count: bulkCount, error: bulkError } = await supabase
      .from('notification_recipients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (bulkError) {
      console.error('❌ Error getting bulk unread count:', bulkError)
    }

    const total = (regularCount || 0) + (bulkCount || 0)
    console.log(`📊 Unread count for user ${userId}: ${total}`)
    return total
  } catch (err) {
    console.error('❌ Error getting unread count:', err)
    return 0
  }
}

// Subscribe to new notifications (real-time)
export function subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
  console.log(`📡 Subscribing to notifications for user ${userId}`)

  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log('📬 New regular notification:', payload.new)
        callback(payload.new as Notification)
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notification_recipients',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log('📬 New bulk notification recipient:', payload.new)
        // When a new recipient is added, fetch the full notification
        const fetchNotification = async () => {
          const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('id', payload.new.notification_id)
            .single()
          
          if (data) {
            callback({
              ...data,
              is_read: false,
              is_bulk: true,
            } as Notification)
          }
        }
        fetchNotification()
      }
    )
    .subscribe((status) => {
      console.log(`📡 Notification subscription status: ${status}`)
    })

  return channel
}

// Get notification by reference (to avoid duplicates)
export async function getNotificationByReference(userId: string, referenceType: string, referenceId: string) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('metadata->>reference_type', referenceType)
      .eq('metadata->>reference_id', referenceId)
      .maybeSingle()

    if (error) {
      console.error('❌ Error checking notification:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('❌ Error:', err)
    return null
  }
}