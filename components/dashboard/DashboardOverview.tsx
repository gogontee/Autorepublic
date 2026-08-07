'use client'

import { useState, useEffect } from 'react'
import { 
  Car, 
  Store, 
  Eye, 
  CheckCircle, 
  Clock, 
  XCircle, 
  TrendingUp,
  ChevronRight
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface DashboardOverviewProps {
  userData?: {
    user: any
    profile: any
    session: any
  }
}

interface Stats {
  totalListings: number
  totalActive: number
  totalPending: number
  totalSold: number
  totalViews: number
}

export default function DashboardOverview({ userData }: DashboardOverviewProps) {
  const { user, profile } = userData || {}
  const [stats, setStats] = useState<Stats>({
    totalListings: 0,
    totalActive: 0,
    totalPending: 0,
    totalSold: 0,
    totalViews: 0
  })
  const [loading, setLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  const displayName = profile?.first_name || user?.email?.split('@')[0] || 'User'

  // Fetch stats and recent activity
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return

      try {
        // Fetch all vehicles for the current user
        const { data: vehicles, error } = await supabase
          .from('vehicles')
          .select('*')
          .eq('user_id', user.id)

        if (error) {
          console.error('Error fetching vehicles:', error)
          return
        }

        // Calculate stats
        const totalListings = vehicles?.length || 0
        const totalActive = vehicles?.filter(v => v.status === 'active' && v.sold !== true).length || 0
        const totalPending = vehicles?.filter(v => v.status === 'pending').length || 0
        const totalSold = vehicles?.filter(v => v.sold === true).length || 0
        const totalViews = vehicles?.reduce((sum, v) => sum + (v.views || 0), 0) || 0

        setStats({
          totalListings,
          totalActive,
          totalPending,
          totalSold,
          totalViews
        })

        // Get recent activity (last 5 vehicles)
        const recent = vehicles
          ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)
          .map(v => ({
            id: v.id,
            action: v.status === 'pending' ? 'New listing pending review' : 
                    v.sold ? 'Vehicle sold' : 
                    'New listing added',
            item: v.title || `${v.brand} ${v.model}`,
            time: timeAgo(new Date(v.created_at)),
            price: `$${v.price?.toLocaleString() || '0'}`,
            status: v.status,
            sold: v.sold
          })) || []

        setRecentActivity(recent)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user])

  // Helper function to format time ago
  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    
    let interval = seconds / 31536000
    if (interval > 1) return Math.floor(interval) + ' years ago'
    
    interval = seconds / 2592000
    if (interval > 1) return Math.floor(interval) + ' months ago'
    
    interval = seconds / 86400
    if (interval > 1) return Math.floor(interval) + ' days ago'
    
    interval = seconds / 3600
    if (interval > 1) return Math.floor(interval) + ' hours ago'
    
    interval = seconds / 60
    if (interval > 1) return Math.floor(interval) + ' minutes ago'
    
    return Math.floor(seconds) + ' seconds ago'
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white/60">Loading dashboard...</div>
      </div>
    )
  }

  // Stats configuration
  const statItems = [
    { 
      label: 'Total Listings', 
      value: stats.totalListings.toString(), 
      icon: Car, 
      color: 'bg-red-500/20' 
    },
    { 
      label: 'Active', 
      value: stats.totalActive.toString(), 
      icon: CheckCircle, 
      color: 'bg-green-500/20' 
    },
    { 
      label: 'Pending', 
      value: stats.totalPending.toString(), 
      icon: Clock, 
      color: 'bg-yellow-500/20' 
    },
    { 
      label: 'Sold', 
      value: stats.totalSold.toString(), 
      icon: XCircle, 
      color: 'bg-blue-500/20' 
    },
    { 
      label: 'Total Views', 
      value: stats.totalViews.toLocaleString(), 
      icon: Eye, 
      color: 'bg-purple-500/20' 
    },
  ]

  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-white">
              Welcome back, {displayName} 👋
            </h1>
            <p className="text-xs sm:text-sm text-white/40 mt-1">
              Here's what's happening with your Auto Republic account
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <span className="text-lg sm:text-xl font-bold text-red-500">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - 5 columns */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {statItems.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-xl ${stat.color}`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-[10px] sm:text-xs text-white/40">{stat.label}</span>
              </div>
              <div className="flex items-end">
                <span className="text-base sm:text-2xl font-bold text-white">{stat.value}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs sm:text-sm font-medium text-white/60">Recent Activity</h2>
          <button className="text-[10px] sm:text-xs text-red-500 hover:text-red-400 transition-colors">
            View All
          </button>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
          {recentActivity.length === 0 ? (
            <div className="p-4 text-center text-white/40 text-sm">
              No recent activity
            </div>
          ) : (
            recentActivity.map((activity, index) => (
              <div
                key={activity.id}
                className={`flex items-center justify-between p-3 sm:p-4 ${
                  index !== recentActivity.length - 1 ? 'border-b border-white/5' : ''
                } hover:bg-white/5 transition-colors`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] sm:text-sm font-medium text-white truncate">
                      {activity.action}
                    </p>
                    {activity.sold && (
                      <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-[8px] font-medium">
                        Sold
                      </span>
                    )}
                    {activity.status === 'pending' && (
                      <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-[8px] font-medium">
                        Pending
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] sm:text-xs text-white/40 truncate">
                    {activity.item} • {activity.time}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className="text-[11px] sm:text-sm font-semibold text-red-500 whitespace-nowrap">
                    {activity.price}
                  </span>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-white/20" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}