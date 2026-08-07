// components/NotificationModal.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  X, 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Eye, 
  Wallet, 
  Megaphone, 
  Car, 
  Info,
  AlertCircle,
  Clock,
  ArrowRight,
  Flag
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Notification, 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification,
  getUnreadCount
} from '@/lib/notifications'
import { supabase } from '@/lib/supabase/client'

interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

// Extended Notification interface to include bulk fields (internal use only)
interface ExtendedNotification extends Notification {
  is_bulk?: boolean
  recipient_count?: number
  read_count?: number
}

const typeIcons = {
  transaction: Wallet,
  ad: Megaphone,
  vehicle: Car,
  system: Info,
  wallet: Wallet,
  report: Flag,
}

const typeColors = {
  transaction: 'text-emerald-400 bg-emerald-500/20',
  ad: 'text-blue-400 bg-blue-500/20',
  vehicle: 'text-purple-400 bg-purple-500/20',
  system: 'text-yellow-400 bg-yellow-500/20',
  wallet: 'text-cyan-400 bg-cyan-500/20',
  report: 'text-red-400 bg-red-500/20',
}

const typeLabels = {
  transaction: 'Transaction',
  ad: 'Ad',
  vehicle: 'Vehicle',
  system: 'System',
  wallet: 'Wallet',
  report: 'Report',
}

export default function NotificationModal({ isOpen, onClose, userId }: NotificationModalProps) {
  const [notifications, setNotifications] = useState<ExtendedNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isMarkingAll, setIsMarkingAll] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<any>(null)

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoading(true)
    const data = await getNotifications(userId)
    setNotifications(data as ExtendedNotification[])
    const count = await getUnreadCount(userId)
    setUnreadCount(count)
    setLoading(false)
  }

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      fetchNotifications()
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, userId, onClose])

  // Handle mark as read
  const handleMarkAsRead = async (notificationId: string) => {
    const success = await markAsRead(notificationId, userId)
    if (success) {
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true)
    const success = await markAllAsRead(userId)
    if (success) {
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      )
      setUnreadCount(0)
    }
    setIsMarkingAll(false)
  }

  // Handle delete notification
  const handleDelete = async (notificationId: string) => {
    const success = await deleteNotification(notificationId)
    if (success) {
      const removed = notifications.find(n => n.id === notificationId)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      if (removed && !removed.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    }
  }

  // Handle notification click
  const handleNotificationClick = (notification: ExtendedNotification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id)
    }
    if (notification.link) {
      window.location.href = notification.link
    }
  }

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md bg-black/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500 text-white text-[8px] font-medium rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAll}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white/60"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white/60"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="overflow-y-auto max-h-[calc(80vh-60px)] p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-xs text-white/40">No notifications yet</p>
              <p className="text-[10px] text-white/20 mt-1">We'll notify you when something happens</p>
            </div>
          ) : (
            <AnimatePresence>
              {notifications.map((notification) => {
                const Icon = typeIcons[notification.type] || Info
                const colorClass = typeColors[notification.type] || typeColors.system
                const label = typeLabels[notification.type] || 'System'

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`group relative rounded-xl p-3 mb-1.5 cursor-pointer transition-all ${
                      notification.is_read
                        ? 'hover:bg-white/5'
                        : 'bg-red-500/5 hover:bg-red-500/10 border border-red-500/10'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className={`text-[10px] font-medium truncate ${notification.is_read ? 'text-white/60' : 'text-white'}`}>
                              {notification.title}
                            </p>
                            <p className="text-[9px] text-white/40 line-clamp-2 mt-0.5">
                              {notification.message}
                            </p>
                            {/* ❌ REMOVED: Bulk stats display - users should not see recipient counts */}
                          </div>
                          <span className="text-[8px] text-white/20 flex-shrink-0">
                            {formatTime(notification.created_at)}
                          </span>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[7px] text-white/20">
                            {label}
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notification.is_read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMarkAsRead(notification.id)
                                }}
                                className="p-0.5 hover:bg-white/10 rounded transition-colors text-white/30 hover:text-white/60"
                              >
                                <Check className="w-2.5 h-2.5" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(notification.id)
                              }}
                              className="p-0.5 hover:bg-red-500/10 rounded transition-colors text-white/20 hover:text-red-400"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Unread indicator */}
                    {!notification.is_read && (
                      <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-red-500" />
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  )
}