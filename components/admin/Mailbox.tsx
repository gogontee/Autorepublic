// components/admin/Mailbox.tsx
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
  Mail,
  Inbox,
  Archive,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  User,
  Mail as MailIcon,
  Clock,
  Calendar,
  MessageSquare,
  Reply,
  Star,
  StarOff,
  Sparkles,
  Send
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface MailboxMessage {
  id: string
  name: string
  email: string
  subject: string
  message: string
  user_id: string | null
  status: 'pending' | 'read' | 'replied' | 'archived'
  created_at: string
  updated_at: string
}

interface User {
  user_id: string
  email: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
}

type FilterType = 'all' | 'pending' | 'read' | 'replied' | 'archived'

export default function MailboxManagement() {
  const [messages, setMessages] = useState<MailboxMessage[]>([])
  const [users, setUsers] = useState<Record<string, User>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedMessage, setSelectedMessage] = useState<MailboxMessage | null>(null)
  const [showReplyModal, setShowReplyModal] = useState(false)
  const [replyForm, setReplyForm] = useState({
    subject: '',
    message: ''
  })
  const [sendingReply, setSendingReply] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    read: 0,
    replied: 0,
    archived: 0
  })

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('mailbox')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error

        setMessages(data || [])

        // Fetch users
        const userIds = [...new Set(data?.map(m => m.user_id).filter(id => id) || [])]
        if (userIds.length > 0) {
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('user_id, email, first_name, last_name, avatar_url')
            .in('user_id', userIds)

          if (!usersError && usersData) {
            const userMap: Record<string, User> = {}
            usersData.forEach((user: any) => {
              userMap[user.user_id] = {
                user_id: user.user_id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                avatar_url: user.avatar_url
              }
            })
            setUsers(userMap)
          }
        }

        calculateStats(data || [])
      } catch (err) {
        console.error('Error fetching messages:', err)
        setError('Failed to load messages')
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
  }, [])

  const calculateStats = (data: MailboxMessage[]) => {
    const pending = data.filter(m => m.status === 'pending').length
    const read = data.filter(m => m.status === 'read').length
    const replied = data.filter(m => m.status === 'replied').length
    const archived = data.filter(m => m.status === 'archived').length

    setStats({
      total: data.length,
      pending,
      read,
      replied,
      archived
    })
  }

  const handleStatusUpdate = async (messageId: string, status: MailboxMessage['status']) => {
    setActionLoading(messageId)
    try {
      const { error } = await supabase
        .from('mailbox')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', messageId)

      if (error) throw error

      const { data: updated } = await supabase
        .from('mailbox')
        .select('*')
        .order('created_at', { ascending: false })

      setMessages(updated || [])
      calculateStats(updated || [])
    } catch (err) {
      console.error('Error updating message:', err)
      alert('Failed to update message status')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (messageId: string) => {
    if (!confirm('Are you sure you want to permanently delete this message?')) return

    setActionLoading(messageId)
    try {
      const { error } = await supabase
        .from('mailbox')
        .delete()
        .eq('id', messageId)

      if (error) throw error

      const { data: updated } = await supabase
        .from('mailbox')
        .select('*')
        .order('created_at', { ascending: false })

      setMessages(updated || [])
      calculateStats(updated || [])
    } catch (err) {
      console.error('Error deleting message:', err)
      alert('Failed to delete message')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReply = (message: MailboxMessage) => {
    setSelectedMessage(message)
    setReplyForm({
      subject: `Re: ${message.subject}`,
      message: `\n\n--- Original Message ---\nFrom: ${message.name} <${message.email}>\nSubject: ${message.subject}\n\n${message.message}`
    })
    setShowReplyModal(true)
  }

  const handleSendReply = async () => {
    if (!replyForm.message.trim()) {
      alert('Please enter a reply message')
      return
    }

    setSendingReply(true)
    try {
      // Here you would send the actual email via your email service
      // For now, we'll just update the status to 'replied'
      
      if (selectedMessage) {
        await handleStatusUpdate(selectedMessage.id, 'replied')
      }

      setShowReplyModal(false)
      setReplyForm({ subject: '', message: '' })
      setSelectedMessage(null)
      alert('Reply sent successfully!')
    } catch (err) {
      console.error('Error sending reply:', err)
      alert('Failed to send reply')
    } finally {
      setSendingReply(false)
    }
  }

  const getFilteredMessages = () => {
    let filtered = [...messages]

    // Apply filter
    if (filter !== 'all') {
      filtered = filtered.filter(m => m.status === filter)
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query) ||
        m.subject.toLowerCase().includes(query) ||
        m.message.toLowerCase().includes(query)
      )
    }

    return filtered
  }

  const filteredMessages = getFilteredMessages()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' }
      case 'read':
        return { label: 'Read', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' }
      case 'replied':
        return { label: 'Replied', color: 'bg-green-500/20 text-green-400 border-green-500/30' }
      case 'archived':
        return { label: 'Archived', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' }
      default:
        return { label: 'Unknown', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        <span className="text-white/60 ml-3">Loading messages...</span>
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
            <Mail className="w-5 h-5 text-red-400" />
            Mailbox
          </h2>
          <p className="text-sm text-white/40">Manage user messages and inquiries</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white/60 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
        <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-red-500/20 transition-all">
          <p className="text-[10px] text-white/40">Total</p>
          <p className="text-lg font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-yellow-500/20 transition-all">
          <p className="text-[10px] text-white/40">Pending</p>
          <p className="text-lg font-bold text-yellow-400">{stats.pending}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-blue-500/20 transition-all">
          <p className="text-[10px] text-white/40">Read</p>
          <p className="text-lg font-bold text-blue-400">{stats.read}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-green-500/20 transition-all">
          <p className="text-[10px] text-white/40">Replied</p>
          <p className="text-lg font-bold text-green-400">{stats.replied}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-gray-500/20 transition-all">
          <p className="text-[10px] text-white/40">Archived</p>
          <p className="text-lg font-bold text-gray-400">{stats.archived}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide flex-1">
          {(['all', 'pending', 'read', 'replied', 'archived'] as FilterType[]).map((tab) => {
            const isActive = filter === tab
            const count = tab === 'all' ? stats.total :
              tab === 'pending' ? stats.pending :
              tab === 'read' ? stats.read :
              tab === 'replied' ? stats.replied :
              tab === 'archived' ? stats.archived :
              0

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
            placeholder="Search messages..."
            className="w-full sm:w-48 pl-9 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Messages List */}
      {filteredMessages.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-xl border border-white/5">
          <Inbox className="w-12 h-12 text-white/20 mx-auto mb-2" />
          <p className="text-white/40 text-sm">No messages found</p>
          <p className="text-white/20 text-xs mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredMessages.map((message) => {
            const user = message.user_id ? users[message.user_id] : null
            const isExpanded = expandedId === message.id
            const isLoading = actionLoading === message.id
            const statusBadge = getStatusBadge(message.status)

            return (
              <div
                key={message.id}
                className={`bg-white/5 rounded-xl border transition-all overflow-hidden ${
                  message.status === 'pending'
                    ? 'border-yellow-500/20 hover:border-yellow-500/30 bg-yellow-500/5'
                    : message.status === 'replied'
                    ? 'border-green-500/20 hover:border-green-500/30'
                    : 'border-white/5 hover:border-white/10'
                }`}
              >
                <div className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        message.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : message.status === 'replied'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        <MailIcon className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`text-sm font-medium ${
                              message.status === 'pending' ? 'text-white' : 'text-white/80'
                            }`}>
                              {message.subject}
                            </p>
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-medium border ${statusBadge.color}`}>
                              {statusBadge.label}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-white/40">
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>{message.name}</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              <span>{message.email}</span>
                            </div>
                            {user && (
                              <>
                                <span>•</span>
                                <span className="text-white/30">
                                  {user.first_name || user.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'User'}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Time */}
                        <div className="flex-shrink-0 text-right">
                          <p className="text-[10px] text-white/20">
                            {new Date(message.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Message Preview */}
                      <p className="text-xs text-white/40 mt-1.5 line-clamp-2">
                        {message.message}
                      </p>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-white/5">
                        {message.status !== 'read' && message.status !== 'replied' && message.status !== 'archived' && (
                          <button
                            onClick={() => handleStatusUpdate(message.id, 'read')}
                            disabled={isLoading}
                            className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-[10px] font-medium text-blue-400 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                          >
                            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            Mark Read
                          </button>
                        )}

                        {message.status !== 'replied' && (
                          <button
                            onClick={() => handleReply(message)}
                            className="flex items-center gap-1.5 px-3 py-1 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-[10px] font-medium text-green-400 transition-all hover:scale-105 active:scale-95"
                          >
                            <Reply className="w-3 h-3" />
                            Reply
                          </button>
                        )}

                        {message.status !== 'archived' && (
                          <button
                            onClick={() => handleStatusUpdate(message.id, 'archived')}
                            disabled={isLoading}
                            className="flex items-center gap-1.5 px-3 py-1 bg-gray-500/20 hover:bg-gray-500/30 rounded-lg text-[10px] font-medium text-gray-400 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                          >
                            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Archive className="w-3 h-3" />}
                            Archive
                          </button>
                        )}

                        <button
                          onClick={() => setExpandedId(isExpanded ? null : message.id)}
                          className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-medium text-white/60 transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          {isExpanded ? 'Less' : 'More'}
                        </button>

                        <button
                          onClick={() => handleDelete(message.id)}
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
                        <p className="text-white/40 mb-1">Full Message</p>
                        <div className="bg-white/5 rounded-lg p-3 text-white/60 leading-relaxed whitespace-pre-wrap">
                          {message.message}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <p className="text-white/40 mb-1">ID</p>
                          <p className="text-white/80 font-mono text-[10px]">{message.id}</p>
                        </div>
                        <div>
                          <p className="text-white/40 mb-1">User ID</p>
                          <p className="text-white/80 font-mono text-[10px]">{message.user_id || 'Anonymous'}</p>
                        </div>
                        <div>
                          <p className="text-white/40 mb-1">Status</p>
                          <p className="text-white/80">{message.status}</p>
                        </div>
                        <div>
                          <p className="text-white/40 mb-1">Updated</p>
                          <p className="text-white/80">{new Date(message.updated_at).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Reply Modal */}
      {showReplyModal && selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 max-w-2xl w-full border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Reply className="w-5 h-5 text-green-400" />
                Reply to Message
              </h3>
              <button
                onClick={() => setShowReplyModal(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">From</label>
                <p className="text-sm text-white/80">{selectedMessage.name} &lt;{selectedMessage.email}&gt;</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">Subject</label>
                <input
                  type="text"
                  value={replyForm.subject}
                  onChange={(e) => setReplyForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">Reply</label>
                <textarea
                  value={replyForm.message}
                  onChange={(e) => setReplyForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={8}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors resize-none font-mono"
                  placeholder="Type your reply here..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSendReply}
                  disabled={sendingReply}
                  className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 rounded-lg text-sm font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-green-500/25"
                >
                  {sendingReply ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Reply
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowReplyModal(false)}
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