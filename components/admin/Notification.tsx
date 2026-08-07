// components/admin/Notification.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2,
  Bell,
  Mail,
  Users,
  Calendar,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Trash2,
  Check,
  X,
  Send,
  Plus,
  Edit,
  Save,
  Megaphone,
  Wallet,
  Car,
  Info,
  Flag,
  Sparkles,
  UserCheck,
  UserCog
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { createNotification } from '@/lib/notifications'
import { createBulkNotification } from '@/lib/notification-bulk'

interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  link: string | null
  is_read: boolean
  is_seen: boolean
  metadata: any
  created_at: string
  read_at: string | null
  is_bulk?: boolean
  recipient_count?: number
  read_count?: number
}

interface User {
  user_id: string
  email: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  role: string | null
}

type FilterType = 'all' | 'unread' | 'read' | 'transaction' | 'ad' | 'vehicle' | 'system' | 'wallet' | 'report'

type RecipientType = 'single' | 'all_users' | 'dealers' | 'users'

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

export default function NotificationManagement() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [users, setUsers] = useState<Record<string, User>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showSendModal, setShowSendModal] = useState(false)
  const [sendForm, setSendForm] = useState({
    recipientType: 'single' as RecipientType,
    userId: '',
    type: 'system',
    title: '',
    message: '',
    link: ''
  })
  const [sending, setSending] = useState(false)
  const [recipientCount, setRecipientCount] = useState(0)
  const [recipientPreview, setRecipientPreview] = useState<User[]>([])
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    read: 0,
    byType: {} as Record<string, number>
  })

  // Fetch notifications and users
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch notifications
        const { data: notificationsData, error: notificationsError } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })

        if (notificationsError) throw notificationsError

        setNotifications(notificationsData || [])

        // Fetch all users with roles
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('user_id, email, first_name, last_name, avatar_url, role')

        if (!usersError && usersData) {
          const userMap: Record<string, User> = {}
          usersData.forEach((user: any) => {
            userMap[user.user_id] = {
              user_id: user.user_id,
              email: user.email,
              first_name: user.first_name,
              last_name: user.last_name,
              avatar_url: user.avatar_url,
              role: user.role
            }
          })
          setUsers(userMap)
        }

        calculateStats(notificationsData || [])
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load notifications')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Update recipient preview when recipient type changes
  useEffect(() => {
    const updateRecipientPreview = async () => {
      let recipients: User[] = []
      
      switch (sendForm.recipientType) {
        case 'all_users':
          recipients = Object.values(users)
          break
        case 'dealers':
          recipients = Object.values(users).filter(u => u.role === 'dealer')
          break
        case 'users':
          recipients = Object.values(users).filter(u => u.role !== 'dealer' && u.role !== 'admin')
          break
        case 'single':
          if (sendForm.userId && users[sendForm.userId]) {
            recipients = [users[sendForm.userId]]
          }
          break
      }
      
      setRecipientPreview(recipients)
      setRecipientCount(recipients.length)
    }

    updateRecipientPreview()
  }, [sendForm.recipientType, sendForm.userId, users])

  const calculateStats = (data: Notification[]) => {
    const unread = data.filter(n => !n.is_read).length
    const read = data.filter(n => n.is_read).length
    const byType: Record<string, number> = {}

    data.forEach(n => {
      byType[n.type] = (byType[n.type] || 0) + 1
    })

    setStats({
      total: data.length,
      unread,
      read,
      byType
    })
  }

  const handleMarkAsRead = async (notificationId: string) => {
    setActionLoading(notificationId)
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId)

      if (error) throw error

      const { data: updated } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })

      setNotifications(updated || [])
      calculateStats(updated || [])
    } catch (err) {
      console.error('Error marking as read:', err)
      alert('Failed to mark notification as read')
    } finally {
      setActionLoading(null)
    }
  }

  const handleMarkAllAsRead = async () => {
    setActionLoading('all')
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('is_read', false)

      if (error) throw error

      const { data: updated } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })

      setNotifications(updated || [])
      calculateStats(updated || [])
    } catch (err) {
      console.error('Error marking all as read:', err)
      alert('Failed to mark all as read')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (notificationId: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return

    setActionLoading(notificationId)
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error

      const { data: updated } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })

      setNotifications(updated || [])
      calculateStats(updated || [])
    } catch (err) {
      console.error('Error deleting notification:', err)
      alert('Failed to delete notification')
    } finally {
      setActionLoading(null)
    }
  }

  // Updated handleSendNotification function with bulk support
  const handleSendNotification = async () => {
    if (!sendForm.title || !sendForm.message) {
      alert('Title and Message are required')
      return
    }

    if (sendForm.recipientType === 'single' && !sendForm.userId) {
      alert('Please select a user')
      return
    }

    setSending(true)
    try {
      let userIds: string[] = []

      switch (sendForm.recipientType) {
        case 'single':
          userIds = [sendForm.userId]
          break
        case 'all_users':
          userIds = Object.keys(users)
          break
        case 'dealers':
          userIds = Object.values(users)
            .filter(u => u.role === 'dealer')
            .map(u => u.user_id)
          break
        case 'users':
          userIds = Object.values(users)
            .filter(u => u.role !== 'dealer' && u.role !== 'admin')
            .map(u => u.user_id)
          break
      }

      if (userIds.length === 0) {
        alert('No recipients found')
        setSending(false)
        return
      }

      let result

      if (userIds.length === 1) {
        // Single notification
        const { createNotification } = await import('@/lib/notifications')
        result = await createNotification({
          userId: userIds[0],
          type: sendForm.type as any,
          title: sendForm.title,
          message: sendForm.message,
          link: sendForm.link || undefined
        })
      } else {
        // Bulk notification
        const { createBulkNotification } = await import('@/lib/notification-bulk')
        result = await createBulkNotification({
          userIds,
          type: sendForm.type as any,
          title: sendForm.title,
          message: sendForm.message,
          link: sendForm.link || undefined
        })
      }

      if (result) {
        // Refresh notifications
        const { data: updated } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })

        setNotifications(updated || [])
        calculateStats(updated || [])
        setShowSendModal(false)
        setSendForm({
          recipientType: 'single',
          userId: '',
          type: 'system',
          title: '',
          message: '',
          link: ''
        })
        
        const message = userIds.length === 1 
          ? 'Notification sent successfully!' 
          : `Bulk notification sent to ${userIds.length} user(s) successfully!`
        alert(message)
      } else {
        alert('Failed to send notification')
      }
    } catch (err) {
      console.error('Error sending notification:', err)
      alert('Failed to send notification')
    } finally {
      setSending(false)
    }
  }

  const getFilteredNotifications = () => {
    let filtered = [...notifications]

    if (filter !== 'all') {
      if (filter === 'unread') {
        filtered = filtered.filter(n => !n.is_read)
      } else if (filter === 'read') {
        filtered = filtered.filter(n => n.is_read)
      } else {
        filtered = filtered.filter(n => n.type === filter)
      }
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(n => {
        const user = users[n.user_id]
        const userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase() : ''
        return n.title.toLowerCase().includes(query) ||
          n.message.toLowerCase().includes(query) ||
          userName.includes(query) ||
          user?.email?.toLowerCase().includes(query)
      })
    }

    return filtered
  }

  const filteredNotifications = getFilteredNotifications()
  const getRecipientLabel = () => {
    switch (sendForm.recipientType) {
      case 'all_users': return 'All Users'
      case 'dealers': return 'All Dealers'
      case 'users': return 'All Users (non-dealers)'
      case 'single': return 'Single User'
      default: return 'Select Recipient'
    }
  }

  const getRecipientIcon = () => {
    switch (sendForm.recipientType) {
      case 'all_users': return <Users className="w-4 h-4" />
      case 'dealers': return <UserCog className="w-4 h-4" />
      case 'users': return <UserCheck className="w-4 h-4" />
      case 'single': return <Users className="w-4 h-4" />
      default: return <Users className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        <span className="text-white/60 ml-3">Loading notifications...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-white/60">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-red-400" />
            Notification Management
          </h2>
          <p className="text-sm text-white/40">Manage and send platform notifications</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white/60 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowSendModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-sm font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-red-500/25"
          >
            <Send className="w-4 h-4" />
            Send Notification
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-red-500/20 transition-all">
          <p className="text-[10px] text-white/40">Total</p>
          <p className="text-lg font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-yellow-500/20 transition-all">
          <p className="text-[10px] text-white/40">Unread</p>
          <p className="text-lg font-bold text-yellow-400">{stats.unread}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-green-500/20 transition-all">
          <p className="text-[10px] text-white/40">Read</p>
          <p className="text-lg font-bold text-green-400">{stats.read}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-blue-500/20 transition-all">
          <p className="text-[10px] text-white/40">Types</p>
          <p className="text-lg font-bold text-blue-400">{Object.keys(stats.byType).length}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide flex-1">
          {(['all', 'unread', 'read', 'transaction', 'ad', 'vehicle', 'system', 'wallet', 'report'] as FilterType[]).map((tab) => {
            const isActive = filter === tab
            const count = tab === 'all' ? stats.total :
              tab === 'unread' ? stats.unread :
              tab === 'read' ? stats.read :
              stats.byType[tab] || 0

            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span className="ml-1.5 text-[8px] opacity-60">({count})</span>
              </button>
            )
          })}
        </div>

        <div className="relative flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notifications..."
            className="w-full sm:w-48 pl-9 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-xl border border-white/5">
          <Bell className="w-12 h-12 text-white/20 mx-auto mb-2" />
          <p className="text-white/40 text-sm">No notifications found</p>
          <p className="text-white/20 text-xs mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notification) => {
            const user = users[notification.user_id]
            const Icon = typeIcons[notification.type as keyof typeof typeIcons] || Bell
            const colorClass = typeColors[notification.type as keyof typeof typeColors] || typeColors.system
            const label = typeLabels[notification.type as keyof typeof typeLabels] || 'System'
            const isExpanded = expandedId === notification.id
            const isLoading = actionLoading === notification.id

            return (
              <div
                key={notification.id}
                className={`bg-white/5 rounded-xl border transition-all overflow-hidden ${
                  notification.is_read
                    ? 'border-white/5 hover:border-white/10'
                    : 'border-red-500/20 hover:border-red-500/30 bg-red-500/5'
                }`}
              >
                <div className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`text-sm font-medium ${notification.is_read ? 'text-white/60' : 'text-white'}`}>
                              {notification.title}
                            </p>
                            <span className="px-2 py-0.5 rounded-full text-[8px] font-medium bg-white/10 text-white/40 border border-white/5">
                              {label}
                            </span>
                            {!notification.is_read && (
                              <span className="px-2 py-0.5 rounded-full text-[8px] font-medium bg-red-500/20 text-red-400 border border-red-500/20">
                                New
                              </span>
                            )}
                            {notification.is_bulk && (
                              <span className="px-2 py-0.5 rounded-full text-[8px] font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                <Users className="w-2.5 h-2.5 inline mr-0.5" />
                                Bulk
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-white/40 mt-1 line-clamp-2">{notification.message}</p>
                          {notification.is_bulk && (
                            <div className="flex items-center gap-3 mt-1 text-[8px] text-white/30">
                              <span className="flex items-center gap-1">
                                <Users className="w-2.5 h-2.5" />
                                {notification.recipient_count || 0} recipients
                              </span>
                              <span className="flex items-center gap-1">
                                <CheckCircle className="w-2.5 h-2.5" />
                                {notification.read_count || 0} read
                              </span>
                            </div>
                          )}
                        </div>

                        {/* User & Time */}
                        <div className="flex-shrink-0 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            {user && (
                              <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2 py-1">
                                <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center overflow-hidden">
                                  {user.avatar_url ? (
                                    <img src={user.avatar_url} alt={user.first_name || ''} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-[7px] font-bold text-red-500">
                                      {(user.first_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-white/60 truncate max-w-[80px]">
                                  {user.first_name || user.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : user.email}
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] text-white/20 mt-1">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                          {notification.read_at && (
                            <p className="text-[8px] text-white/20">
                              Read: {new Date(notification.read_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-white/5">
                        {!notification.is_read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            disabled={isLoading}
                            className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-[10px] font-medium text-blue-400 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                          >
                            {isLoading ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                            Mark as Read
                          </button>
                        )}

                        <button
                          onClick={() => setExpandedId(isExpanded ? null : notification.id)}
                          className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-medium text-white/60 transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          {isExpanded ? 'Less' : 'More'}
                        </button>

                        <button
                          onClick={() => handleDelete(notification.id)}
                          disabled={isLoading}
                          className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-[10px] font-medium text-red-400 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 ml-auto"
                        >
                          {isLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-white/5">
                    <div className="pt-3 space-y-2 text-xs">
                      <div>
                        <p className="text-white/40 mb-1">Message</p>
                        <p className="text-white/60 leading-relaxed">{notification.message}</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <p className="text-white/40 mb-1">ID</p>
                          <p className="text-white/80 font-mono text-[10px]">{notification.id}</p>
                        </div>
                        <div>
                          <p className="text-white/40 mb-1">User ID</p>
                          <p className="text-white/80 font-mono text-[10px]">{notification.user_id}</p>
                        </div>
                        <div>
                          <p className="text-white/40 mb-1">Type</p>
                          <p className="text-white/80">{notification.type}</p>
                        </div>
                        <div>
                          <p className="text-white/40 mb-1">Link</p>
                          <p className="text-white/80 break-all">{notification.link || 'None'}</p>
                        </div>
                        <div>
                          <p className="text-white/40 mb-1">Created</p>
                          <p className="text-white/80">{new Date(notification.created_at).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-white/40 mb-1">Read</p>
                          <p className="text-white/80">{notification.read_at ? new Date(notification.read_at).toLocaleString() : 'Not read'}</p>
                        </div>
                        {notification.is_bulk && (
                          <>
                            <div>
                              <p className="text-white/40 mb-1">Bulk</p>
                              <p className="text-white/80">Yes</p>
                            </div>
                            <div>
                              <p className="text-white/40 mb-1">Recipients</p>
                              <p className="text-white/80">{notification.recipient_count || 0}</p>
                            </div>
                            <div>
                              <p className="text-white/40 mb-1">Read Count</p>
                              <p className="text-white/80">{notification.read_count || 0}</p>
                            </div>
                          </>
                        )}
                      </div>
                      {notification.metadata && (
                        <div>
                          <p className="text-white/40 mb-1">Metadata</p>
                          <pre className="text-[10px] text-white/40 bg-white/5 p-2 rounded-lg overflow-x-auto">
                            {JSON.stringify(notification.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Send Notification Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 max-w-md w-full border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-red-400" />
                Send Notification
              </h3>
              <button
                onClick={() => setShowSendModal(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Recipient Type */}
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">Send To</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSendForm(prev => ({ ...prev, recipientType: 'single', userId: '' }))}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      sendForm.recipientType === 'single'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    Single User
                  </button>
                  <button
                    onClick={() => setSendForm(prev => ({ ...prev, recipientType: 'all_users' }))}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      sendForm.recipientType === 'all_users'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    All Users
                  </button>
                  <button
                    onClick={() => setSendForm(prev => ({ ...prev, recipientType: 'dealers' }))}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      sendForm.recipientType === 'dealers'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    Dealers
                  </button>
                  <button
                    onClick={() => setSendForm(prev => ({ ...prev, recipientType: 'users' }))}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      sendForm.recipientType === 'users'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    Regular Users
                  </button>
                </div>
                <p className="text-[10px] text-white/30 mt-1.5">
                  {sendForm.recipientType === 'single' && 'Send to one specific user'}
                  {sendForm.recipientType === 'all_users' && `Send to all ${recipientCount} users`}
                  {sendForm.recipientType === 'dealers' && `Send to all ${recipientCount} dealers`}
                  {sendForm.recipientType === 'users' && `Send to all ${recipientCount} regular users`}
                </p>
              </div>

              {/* User ID (only for single user) */}
              {sendForm.recipientType === 'single' && (
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1">User ID *</label>
                  <input
                    type="text"
                    value={sendForm.userId}
                    onChange={(e) => setSendForm(prev => ({ ...prev, userId: e.target.value }))}
                    placeholder="Enter user UUID"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                  />
                </div>
              )}

              {/* Recipient Preview */}
              {sendForm.recipientType !== 'single' && recipientPreview.length > 0 && (
                <div className="bg-white/5 rounded-lg p-2 max-h-24 overflow-y-auto">
                  <p className="text-[8px] text-white/30 mb-1">Preview ({recipientCount} recipients):</p>
                  <div className="flex flex-wrap gap-1">
                    {recipientPreview.slice(0, 5).map((user) => (
                      <span key={user.user_id} className="text-[8px] text-white/40 bg-white/5 px-1.5 py-0.5 rounded">
                        {user.first_name || user.email || user.user_id.slice(0, 8)}
                      </span>
                    ))}
                    {recipientPreview.length > 5 && (
                      <span className="text-[8px] text-white/20">+{recipientPreview.length - 5} more</span>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">Type</label>
                <select
                  value={sendForm.type}
                  onChange={(e) => setSendForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors"
                >
                  <option value="system">System</option>
                  <option value="transaction">Transaction</option>
                  <option value="ad">Ad</option>
                  <option value="vehicle">Vehicle</option>
                  <option value="wallet">Wallet</option>
                  <option value="report">Report</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">Title *</label>
                <input
                  type="text"
                  value={sendForm.title}
                  onChange={(e) => setSendForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Notification title"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">Message *</label>
                <textarea
                  value={sendForm.message}
                  onChange={(e) => setSendForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={3}
                  placeholder="Notification message"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">Link (optional)</label>
                <input
                  type="text"
                  value={sendForm.link}
                  onChange={(e) => setSendForm(prev => ({ ...prev, link: e.target.value }))}
                  placeholder="/dashboard/wallet"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSendNotification}
                  disabled={sending}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 rounded-lg text-sm font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-500/25"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowSendModal(false)}
                  className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium text-white/60 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}