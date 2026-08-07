// components/admin/AdsManagement.tsx
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
  Play,
  Pause,
  Calendar,
  Clock,
  TrendingUp,
  MousePointerClick,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Video,
  FileText,
  ExternalLink,
  Trash2,
  Ban,
  Check,
  X
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { checkAdNotifications } from '@/lib/notification-triggers'

interface Ad {
  id: number
  user_id: string
  video: string | null
  image: string | null
  text: string | null
  ads_link: string | null
  approval: boolean
  pause: boolean
  start_time: string
  end_time: string
  created_at: string
  updated_at: string
  click_count: number
  view_count: number
}

interface UserProfile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
}

type FilterType = 'all' | 'pending' | 'approved' | 'active' | 'completed' | 'paused'

export default function AdsManagement() {
  const [ads, setAds] = useState<Ad[]>([])
  const [users, setUsers] = useState<Record<string, UserProfile>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedAd, setExpandedAd] = useState<number | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    active: 0,
    completed: 0,
    paused: 0,
    approved: 0
  })

  // Fetch ads and users
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch all ads
        const { data: adsData, error: adsError } = await supabase
          .from('ads')
          .select('*')
          .order('created_at', { ascending: false })

        if (adsError) throw adsError

        setAds(adsData || [])

        // Fetch user profiles for all ads
        const userIds = [...new Set(adsData?.map(ad => ad.user_id) || [])]
        if (userIds.length > 0) {
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('user_id, email, first_name, last_name, avatar_url')
            .in('user_id', userIds)

          if (!usersError && usersData) {
            const userMap: Record<string, UserProfile> = {}
            usersData.forEach((user: any) => {
              userMap[user.user_id] = {
                id: user.user_id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                avatar_url: user.avatar_url
              }
            })
            setUsers(userMap)
          }
        }

        // Calculate stats
        calculateStats(adsData || [])
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load ads')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const calculateStats = (adsData: Ad[]) => {
    const now = new Date()
    let pending = 0, active = 0, completed = 0, paused = 0, approved = 0

    adsData.forEach(ad => {
      const start = new Date(ad.start_time)
      const end = new Date(ad.end_time)
      const isActive = ad.approval && !ad.pause && now >= start && now <= end
      const isCompleted = ad.approval && !ad.pause && now > end

      if (ad.approval) approved++
      if (ad.pause) paused++
      else if (!ad.approval) pending++
      else if (isActive) active++
      else if (isCompleted) completed++
    })

    setStats({
      total: adsData.length,
      pending,
      active,
      completed,
      paused,
      approved
    })
  }

  const getAdStatus = (ad: Ad) => {
    const now = new Date()
    const start = new Date(ad.start_time)
    const end = new Date(ad.end_time)

    if (ad.pause) {
      return { label: 'Paused', color: 'text-yellow-400 bg-yellow-500/20', icon: Pause }
    }
    if (!ad.approval) {
      return { label: 'Pending', color: 'text-orange-400 bg-orange-500/20', icon: AlertCircle }
    }
    if (now < start) {
      return { label: 'Scheduled', color: 'text-blue-400 bg-blue-500/20', icon: Calendar }
    }
    if (now > end) {
      return { label: 'Completed', color: 'text-gray-400 bg-gray-500/20', icon: CheckCircle }
    }
    return { label: 'Active', color: 'text-green-400 bg-green-500/20', icon: Play }
  }

  const handleApprove = async (adId: number) => {
    setActionLoading(adId)
    try {
      const { data: ad, error: fetchError } = await supabase
        .from('ads')
        .select('user_id')
        .eq('id', adId)
        .single()

      if (fetchError) throw fetchError

      const { error } = await supabase
        .from('ads')
        .update({ approval: true, updated_at: new Date().toISOString() })
        .eq('id', adId)

      if (error) throw error

      // Send notification to user
      if (ad?.user_id) {
        await checkAdNotifications(ad.user_id)
      }

      // Refresh data
      const { data: updatedAds } = await supabase
        .from('ads')
        .select('*')
        .order('created_at', { ascending: false })

      setAds(updatedAds || [])
      calculateStats(updatedAds || [])
    } catch (err) {
      console.error('Error approving ad:', err)
      alert('Failed to approve ad')
    } finally {
      setActionLoading(null)
    }
  }

  const handlePause = async (adId: number, pause: boolean) => {
    setActionLoading(adId)
    try {
      const { data: ad, error: fetchError } = await supabase
        .from('ads')
        .select('user_id')
        .eq('id', adId)
        .single()

      if (fetchError) throw fetchError

      const { error } = await supabase
        .from('ads')
        .update({ pause, updated_at: new Date().toISOString() })
        .eq('id', adId)

      if (error) throw error

      // Send notification to user
      if (ad?.user_id) {
        await checkAdNotifications(ad.user_id)
      }

      // Refresh data
      const { data: updatedAds } = await supabase
        .from('ads')
        .select('*')
        .order('created_at', { ascending: false })

      setAds(updatedAds || [])
      calculateStats(updatedAds || [])
    } catch (err) {
      console.error('Error updating ad:', err)
      alert('Failed to update ad')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (adId: number) => {
    if (!confirm('Are you sure you want to delete this ad?')) return

    setActionLoading(adId)
    try {
      const { error } = await supabase
        .from('ads')
        .delete()
        .eq('id', adId)

      if (error) throw error

      const { data: updatedAds } = await supabase
        .from('ads')
        .select('*')
        .order('created_at', { ascending: false })

      setAds(updatedAds || [])
      calculateStats(updatedAds || [])
    } catch (err) {
      console.error('Error deleting ad:', err)
      alert('Failed to delete ad')
    } finally {
      setActionLoading(null)
    }
  }

  const getFilteredAds = () => {
    let filtered = [...ads]

    // Apply filter
    if (filter !== 'all') {
      filtered = filtered.filter(ad => {
        const status = getAdStatus(ad)
        switch (filter) {
          case 'pending': return status.label === 'Pending'
          case 'approved': return ad.approval && !ad.pause
          case 'active': return status.label === 'Active'
          case 'completed': return status.label === 'Completed'
          case 'paused': return status.label === 'Paused'
          default: return true
        }
      })
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(ad => {
        const user = users[ad.user_id]
        const userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase() : ''
        return ad.text?.toLowerCase().includes(query) ||
          userName.includes(query) ||
          user?.email?.toLowerCase().includes(query)
      })
    }

    return filtered
  }

  const filteredAds = getFilteredAds()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        <span className="text-white/60 ml-3">Loading ads...</span>
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
          <h2 className="text-xl font-bold text-white">Ad Management</h2>
          <p className="text-sm text-white/40">Manage and moderate user advertisements</p>
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
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
          <p className="text-[10px] text-white/40">Total</p>
          <p className="text-lg font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
          <p className="text-[10px] text-white/40">Pending</p>
          <p className="text-lg font-bold text-orange-400">{stats.pending}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
          <p className="text-[10px] text-white/40">Active</p>
          <p className="text-lg font-bold text-green-400">{stats.active}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
          <p className="text-[10px] text-white/40">Completed</p>
          <p className="text-lg font-bold text-gray-400">{stats.completed}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
          <p className="text-[10px] text-white/40">Paused</p>
          <p className="text-lg font-bold text-yellow-400">{stats.paused}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
          <p className="text-[10px] text-white/40">Approved</p>
          <p className="text-lg font-bold text-blue-400">{stats.approved}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide flex-1">
          {(['all', 'pending', 'approved', 'active', 'completed', 'paused'] as FilterType[]).map((tab) => {
            const isActive = filter === tab
            const count = tab === 'all' ? stats.total :
              tab === 'pending' ? stats.pending :
              tab === 'approved' ? stats.approved :
              tab === 'active' ? stats.active :
              tab === 'completed' ? stats.completed :
              tab === 'paused' ? stats.paused :
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
            placeholder="Search ads or users..."
            className="w-full sm:w-48 pl-9 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Ads List */}
      {filteredAds.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-xl border border-white/5">
          <FileText className="w-12 h-12 text-white/20 mx-auto mb-2" />
          <p className="text-white/40 text-sm">No ads found</p>
          <p className="text-white/20 text-xs mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAds.map((ad) => {
            const status = getAdStatus(ad)
            const StatusIcon = status.icon
            const user = users[ad.user_id]
            const hasMedia = ad.video || ad.image
            const mediaType = ad.video ? 'video' : ad.image ? 'image' : null
            const mediaUrl = ad.video || ad.image
            const isExpanded = expandedAd === ad.id
            const isActionLoading = actionLoading === ad.id

            return (
              <div
                key={ad.id}
                className="bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all overflow-hidden"
              >
                {/* Main Row */}
                <div className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Media Preview */}
                    <div className="flex-shrink-0 w-full sm:w-20 h-20 rounded-lg overflow-hidden bg-black/50 border border-white/5 relative">
                      {hasMedia ? (
                        mediaType === 'video' ? (
                          <video
                            src={mediaUrl!}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                          />
                        ) : (
                          <img
                            src={mediaUrl!}
                            alt="Ad preview"
                            className="w-full h-full object-cover"
                          />
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/5">
                          <FileText className="w-8 h-8 text-white/20" />
                        </div>
                      )}
                      {mediaType && (
                        <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/70 rounded text-[8px] text-white/60">
                          {mediaType === 'video' ? '🎬' : '🖼️'}
                        </div>
                      )}
                    </div>

                    {/* Ad Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${status.color}`}>
                              <StatusIcon className="w-3 h-3 inline mr-1" />
                              {status.label}
                            </span>
                            {ad.approval && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/20 text-green-400">
                                <Check className="w-3 h-3 inline mr-1" />
                                Approved
                              </span>
                            )}
                          </div>
                          {ad.text && (
                            <p className="text-sm text-white/80 mt-1 line-clamp-2">{ad.text}</p>
                          )}
                          {ad.ads_link && (
                            <a
                              href={ad.ads_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors truncate mt-0.5 flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {ad.ads_link}
                            </a>
                          )}
                        </div>

                        {/* User Info */}
                        {user && (
                          <div className="flex-shrink-0 flex items-center gap-2 bg-white/5 rounded-lg px-2 py-1">
                            <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center overflow-hidden">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt={user.first_name || ''} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[8px] font-bold text-red-500">
                                  {(user.first_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="text-left">
                              <p className="text-[10px] font-medium text-white/80 truncate max-w-[100px]">
                                {user.first_name || user.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'User'}
                              </p>
                              <p className="text-[8px] text-white/30 truncate max-w-[100px]">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Dates & Stats */}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-white/40">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Start: {new Date(ad.start_time).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>End: {new Date(ad.end_time).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>{ad.view_count || 0} views</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MousePointerClick className="w-3 h-3" />
                          <span>{ad.click_count || 0} clicks</span>
                        </div>
                        <div className="flex items-center gap-1 text-white/20 ml-auto">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(ad.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-white/5">
                        {status.label === 'Pending' && (
                          <button
                            onClick={() => handleApprove(ad.id)}
                            disabled={isActionLoading}
                            className="flex items-center gap-1.5 px-3 py-1 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-[10px] font-medium text-green-400 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                          >
                            {isActionLoading ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                            Approve
                          </button>
                        )}

                        {status.label === 'Active' && (
                          <button
                            onClick={() => handlePause(ad.id, true)}
                            disabled={isActionLoading}
                            className="flex items-center gap-1.5 px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg text-[10px] font-medium text-yellow-400 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                          >
                            {isActionLoading ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Pause className="w-3 h-3" />
                            )}
                            Pause
                          </button>
                        )}

                        {status.label === 'Paused' && (
                          <button
                            onClick={() => handlePause(ad.id, false)}
                            disabled={isActionLoading}
                            className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-[10px] font-medium text-blue-400 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                          >
                            {isActionLoading ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Play className="w-3 h-3" />
                            )}
                            Resume
                          </button>
                        )}

                        <button
                          onClick={() => setExpandedAd(isExpanded ? null : ad.id)}
                          className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-medium text-white/60 transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          {isExpanded ? 'Less' : 'More'}
                        </button>

                        <button
                          onClick={() => handleDelete(ad.id)}
                          disabled={isActionLoading}
                          className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-[10px] font-medium text-red-400 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 ml-auto"
                        >
                          {isActionLoading ? (
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
                    <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-white/40 mb-1">Ad ID</p>
                        <p className="text-white/80 font-mono">{ad.id}</p>
                      </div>
                      <div>
                        <p className="text-white/40 mb-1">User ID</p>
                        <p className="text-white/80 font-mono">{ad.user_id}</p>
                      </div>
                      <div>
                        <p className="text-white/40 mb-1">Created</p>
                        <p className="text-white/80">{new Date(ad.created_at).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-white/40 mb-1">Updated</p>
                        <p className="text-white/80">{new Date(ad.updated_at).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-white/40 mb-1">Views</p>
                        <p className="text-white/80">{ad.view_count}</p>
                      </div>
                      <div>
                        <p className="text-white/40 mb-1">Clicks</p>
                        <p className="text-white/80">{ad.click_count}</p>
                      </div>
                      {ad.video && (
                        <div className="col-span-2">
                          <p className="text-white/40 mb-1">Video URL</p>
                          <a href={ad.video} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 break-all">
                            {ad.video}
                          </a>
                        </div>
                      )}
                      {ad.image && (
                        <div className="col-span-2">
                          <p className="text-white/40 mb-1">Image URL</p>
                          <a href={ad.image} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 break-all">
                            {ad.image}
                          </a>
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
    </div>
  )
}