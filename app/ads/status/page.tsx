// app/ads/status/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Calendar, 
  Clock, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2,
  Video,
  Image as ImageIcon,
  FileText,
  CalendarDays,
  TrendingUp,
  Users,
  BarChart3,
  Play,
  Pause,
  ChevronRight,
  Zap,
  Sparkles,
  MousePointerClick,
  RotateCcw
} from 'lucide-react'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import { supabase } from '@/lib/supabase/client'

interface Ad {
  id: string
  user_id: string
  video: string | null
  image: string | null
  text: string | null
  ads_link: string | null
  start_time: string
  end_time: string
  created_at: string
  approval: boolean
  pause: boolean
  click_count: number
  view_count: number
}

type FilterType = 'all' | 'active' | 'pending' | 'completed' | 'paused'

export default function AdsStatusPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [ads, setAds] = useState<Ad[]>([])
  const [filter, setFilter] = useState<FilterType>('all')
  const [error, setError] = useState('')
  const [recreatingAd, setRecreatingAd] = useState<string | null>(null)

  // Check auth and fetch ads
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.user) {
          router.push('/auth/login')
          return
        }

        setUser(session.user)

        // Fetch user's ads
        const { data: adsData, error: adsError } = await supabase
          .from('ads')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })

        if (adsError) {
          console.error('Error fetching ads:', adsError)
          setError('Failed to load ads')
        } else {
          setAds(adsData || [])
        }

        setLoading(false)
      } catch (err) {
        console.error('Error:', err)
        setError('An unexpected error occurred')
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Get ad status
  const getAdStatus = (ad: Ad) => {
    const now = new Date()
    const start = new Date(ad.start_time)
    const end = new Date(ad.end_time)

    if (ad.pause) {
      return { label: 'Paused', color: 'text-yellow-400 bg-yellow-500/10', icon: Pause }
    }

    if (!ad.approval) {
      return { label: 'Pending Approval', color: 'text-orange-400 bg-orange-500/10', icon: AlertCircle }
    }

    if (now < start) {
      return { label: 'Scheduled', color: 'text-blue-400 bg-blue-500/10', icon: Calendar }
    }

    if (now > end) {
      return { label: 'Completed', color: 'text-gray-400 bg-gray-500/10', icon: CheckCircle }
    }

    return { label: 'Active', color: 'text-green-400 bg-green-500/10', icon: Play }
  }

  // Get days and time remaining
  const getRemainingTime = (ad: Ad) => {
    const now = new Date()
    const end = new Date(ad.end_time)
    const diff = end.getTime() - now.getTime()

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, text: 'Expired' }
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    let text = ''
    if (days > 0) {
      text = `${days}d ${hours}h`
    } else if (hours > 0) {
      text = `${hours}h ${minutes}m`
    } else {
      text = `${minutes}m`
    }

    return { days, hours, minutes, text }
  }

  // Handle re-run ad - store ad ID in sessionStorage
  const handleReRunAd = async (ad: Ad) => {
    setRecreatingAd(ad.id)
    try {
      // Store the ad ID in sessionStorage
      sessionStorage.setItem('rerun_ad_id', ad.id)
      router.push('/ads')
    } catch (err) {
      console.error('Error recreating ad:', err)
      setError('Failed to recreate ad')
    } finally {
      setRecreatingAd(null)
    }
  }

  // Filter ads
  const filteredAds = ads.filter(ad => {
    const status = getAdStatus(ad)
    switch (filter) {
      case 'active':
        return status.label === 'Active'
      case 'pending':
        return status.label === 'Pending Approval'
      case 'completed':
        return status.label === 'Completed'
      case 'paused':
        return status.label === 'Paused'
      default:
        return true
    }
  })

  // Stats
  const totalAds = ads.length
  const activeAds = ads.filter(ad => getAdStatus(ad).label === 'Active').length
  const totalViews = ads.reduce((sum, ad) => sum + (ad.view_count || 0), 0)
  const totalClicks = ads.reduce((sum, ad) => sum + (ad.click_count || 0), 0)
  const pendingAds = ads.filter(ad => getAdStatus(ad).label === 'Pending Approval').length
  
  // Calculate CTR (Click Through Rate)
  const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : '0.0'

  // Get empty state message based on filter
  const getEmptyStateMessage = () => {
    switch (filter) {
      case 'active':
        return 'No active ads found'
      case 'pending':
        return 'No pending ads found'
      case 'completed':
        return 'No completed ads found'
      case 'paused':
        return 'No paused ads found'
      default:
        return 'No ads found'
    }
  }

  const getEmptyStateDescription = () => {
    switch (filter) {
      case 'active':
        return 'Your ads will appear here once they are approved and running'
      case 'pending':
        return 'Ads you submit will appear here for approval'
      case 'completed':
        return 'Ads that have finished running will appear here'
      case 'paused':
        return 'Ads you pause will appear here'
      default:
        return 'Create your first ad to start promoting'
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
          <span className="text-white/60 ml-3">Loading your ads...</span>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="pb-24 md:pb-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-red-400" />
                Ad Analytics
              </h1>
              <p className="text-xs text-white/40 mt-0.5">Track your ad performance</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/30">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400/50" />
              <span>Live</span>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-5">
            <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-red-500/20 transition-all">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-red-400" />
                </div>
                <span className="text-[10px] text-white/40">Total Ads</span>
              </div>
              <p className="text-lg font-bold text-white">{totalAds}</p>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-green-500/20 transition-all">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Play className="w-3.5 h-3.5 text-green-400" />
                </div>
                <span className="text-[10px] text-white/40">Active</span>
              </div>
              <p className="text-lg font-bold text-green-400">{activeAds}</p>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-yellow-500/20 transition-all">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />
                </div>
                <span className="text-[10px] text-white/40">Pending</span>
              </div>
              <p className="text-lg font-bold text-yellow-400">{pendingAds}</p>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-blue-500/20 transition-all">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <MousePointerClick className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <span className="text-[10px] text-white/40">CTR</span>
              </div>
              <p className="text-lg font-bold text-blue-400">{ctr}%</p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 scrollbar-hide">
            {(['all', 'active', 'pending', 'completed', 'paused'] as FilterType[]).map((tab) => {
              const isActive = filter === tab
              const count = tab === 'all' 
                ? totalAds 
                : ads.filter(ad => getAdStatus(ad).label === (tab === 'pending' ? 'Pending Approval' : 
                    tab === 'active' ? 'Active' : 
                    tab === 'completed' ? 'Completed' : 
                    tab === 'paused' ? 'Paused' : '')).length
              
              return (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {count > 0 && (
                    <span className={`ml-1.5 text-[10px] ${isActive ? 'text-white/80' : 'text-white/30'}`}>
                      ({count})
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Ads List */}
          {filteredAds.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/5">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-white/20" />
              </div>
              <p className="text-white/40 text-sm">{getEmptyStateMessage()}</p>
              <p className="text-white/20 text-xs mt-1">{getEmptyStateDescription()}</p>
              {filter === 'all' && (
                <button
                  onClick={() => router.push('/ads')}
                  className="mt-4 px-6 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-medium text-white transition-all hover:scale-[1.02]"
                >
                  Create Ad
                </button>
              )}
              {(filter === 'active' || filter === 'pending' || filter === 'completed' || filter === 'paused') && (
                <button
                  onClick={() => setFilter('all')}
                  className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium text-white/60 transition-all hover:text-white"
                >
                  View All Ads
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAds.map((ad) => {
                const status = getAdStatus(ad)
                const remaining = getRemainingTime(ad)
                const StatusIcon = status.icon
                const hasMedia = ad.video || ad.image
                const mediaType = ad.video ? 'video' : ad.image ? 'image' : null
                const mediaUrl = ad.video || ad.image
                const viewCount = ad.view_count || 0
                const clickCount = ad.click_count || 0
                const adCtr = viewCount > 0 ? ((clickCount / viewCount) * 100).toFixed(1) : '0.0'
                const isCompleted = status.label === 'Completed'

                return (
                  <div
                    key={ad.id}
                    className="bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all overflow-hidden group"
                  >
                    {/* Ad Content */}
                    <div className="p-3 sm:p-4">
                      <div className="flex gap-3">
                        {/* Media Preview */}
                        <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-black/50 border border-white/5 relative">
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
                            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 rounded text-[8px] text-white/60">
                              {mediaType === 'video' ? '🎬' : '🖼️'}
                            </div>
                          )}
                        </div>

                        {/* Ad Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${status.color}`}>
                                  <StatusIcon className="w-3 h-3 inline mr-1" />
                                  {status.label}
                                </span>
                                {ad.pause && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-500/10 text-yellow-400">
                                    <Pause className="w-3 h-3 inline mr-1" />
                                    Paused
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
                                  className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors truncate block mt-0.5"
                                >
                                  {ad.ads_link}
                                </a>
                              )}
                            </div>
                            {/* Stats Badges */}
                            {status.label === 'Active' || status.label === 'Completed' ? (
                              <div className="flex-shrink-0 flex flex-col items-end gap-1">
                                <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2 py-0.5">
                                  <Eye className="w-3 h-3 text-blue-400" />
                                  <span className="text-[10px] font-medium text-white/80">{viewCount}</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2 py-0.5">
                                  <MousePointerClick className="w-3 h-3 text-green-400" />
                                  <span className="text-[10px] font-medium text-white/80">{clickCount}</span>
                                </div>
                                {viewCount > 0 && (
                                  <div className="flex items-center gap-1 bg-white/5 rounded-lg px-2 py-0.5">
                                    <Zap className="w-3 h-3 text-yellow-400" />
                                    <span className="text-[10px] font-medium text-white/60">{adCtr}% CTR</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex-shrink-0">
                                <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2 py-1">
                                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                                  <span className="text-xs font-medium text-white/80">{viewCount}</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Dates and Remaining Time */}
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-white/40">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>Start: {new Date(ad.start_time).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>End: {new Date(ad.end_time).toLocaleDateString()}</span>
                            </div>
                            {status.label !== 'Completed' && status.label !== 'Pending Approval' && (
                              <div className="flex items-center gap-1 text-yellow-400/70">
                                <Zap className="w-3 h-3" />
                                <span>{remaining.text} remaining</span>
                              </div>
                            )}
                            {status.label === 'Completed' && (
                              <div className="flex items-center gap-1 text-gray-400">
                                <CheckCircle className="w-3 h-3" />
                                <span>Completed</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1 text-white/20 ml-auto">
                              <CalendarDays className="w-3 h-3" />
                              <span className="text-[10px]">
                                {new Date(ad.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {/* Progress Bar for Active Ads */}
                          {status.label === 'Active' && (
                            <div className="mt-2">
                              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-1000"
                                  style={{
                                    width: `${Math.max(0, Math.min(100, 
                                      ((new Date().getTime() - new Date(ad.start_time).getTime()) / 
                                      (new Date(ad.end_time).getTime() - new Date(ad.start_time).getTime())) * 100
                                    ))}%`
                                  }}
                                />
                              </div>
                              <div className="flex justify-between mt-0.5 text-[8px] text-white/20">
                                <span>Start</span>
                                <span>{remaining.text}</span>
                                <span>End</span>
                              </div>
                            </div>
                          )}

                          {/* Re-run Ad Button for Completed Ads */}
                          {isCompleted && (
                            <div className="mt-3">
                              <button
                                onClick={() => handleReRunAd(ad)}
                                disabled={recreatingAd === ad.id}
                                className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-red-500/20 to-orange-500/20 hover:from-red-500/30 hover:to-orange-500/30 border border-red-500/30 hover:border-red-500/50 rounded-lg text-xs font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                              >
                                {recreatingAd === ad.id ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Place This Ad Again
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}