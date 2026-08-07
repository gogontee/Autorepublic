// components/admin/DashboardOverview.tsx
'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  Car,
  Megaphone,
  Mail,
  Flag,
  Bell,
  List,
  Activity,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface Stats {
  users: { total: number; active: number; new: number }
  vehicles: { total: number; active: number; pending: number }
  ads: { total: number; active: number; pending: number }
  reports: { total: number; pending: number; resolved: number }
  mailbox: { total: number; unread: number }
  notifications: { total: number; unread: number }
}

export default function DashboardOverview() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    users: { total: 0, active: 0, new: 0 },
    vehicles: { total: 0, active: 0, pending: 0 },
    ads: { total: 0, active: 0, pending: 0 },
    reports: { total: 0, pending: 0, resolved: 0 },
    mailbox: { total: 0, unread: 0 },
    notifications: { total: 0, unread: 0 }
  })
  const [recentActivities, setRecentActivities] = useState<any[]>([])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Users
        const { count: totalUsers } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
        
        const { count: activeUsers } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)

        const { count: newUsers } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

        // Vehicles
        const { count: totalVehicles } = await supabase
          .from('vehicles')
          .select('*', { count: 'exact', head: true })

        const { count: activeVehicles } = await supabase
          .from('vehicles')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')

        const { count: pendingVehicles } = await supabase
          .from('vehicles')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')

        // Ads
        const { count: totalAds } = await supabase
          .from('ads')
          .select('*', { count: 'exact', head: true })

        const { count: activeAds } = await supabase
          .from('ads')
          .select('*', { count: 'exact', head: true })
          .eq('approval', true)
          .eq('pause', false)

        const { count: pendingAds } = await supabase
          .from('ads')
          .select('*', { count: 'exact', head: true })
          .eq('approval', false)

        // Reports
        const { count: totalReports } = await supabase
          .from('vehicle_reports')
          .select('*', { count: 'exact', head: true })

        const { count: pendingReports } = await supabase
          .from('vehicle_reports')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')

        const { count: resolvedReports } = await supabase
          .from('vehicle_reports')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'resolved')

        // Mailbox
        const { count: totalMail } = await supabase
          .from('mailbox')
          .select('*', { count: 'exact', head: true })

        const { count: unreadMail } = await supabase
          .from('mailbox')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')

        // Notifications
        const { count: totalNotifications } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })

        const { count: unreadNotifications } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('is_read', false)

        // Recent activity (last 5 notifications)
        const { data: recent } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5)

        setStats({
          users: { total: totalUsers || 0, active: activeUsers || 0, new: newUsers || 0 },
          vehicles: { total: totalVehicles || 0, active: activeVehicles || 0, pending: pendingVehicles || 0 },
          ads: { total: totalAds || 0, active: activeAds || 0, pending: pendingAds || 0 },
          reports: { total: totalReports || 0, pending: pendingReports || 0, resolved: resolvedReports || 0 },
          mailbox: { total: totalMail || 0, unread: unreadMail || 0 },
          notifications: { total: totalNotifications || 0, unread: unreadNotifications || 0 }
        })

        setRecentActivities(recent || [])
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.users.total,
      icon: Users,
      color: 'text-blue-400 bg-blue-500/10',
      change: `${stats.users.new} new this week`
    },
    {
      title: 'Active Users',
      value: stats.users.active,
      icon: Activity,
      color: 'text-green-400 bg-green-500/10'
    },
    {
      title: 'Total Vehicles',
      value: stats.vehicles.total,
      icon: Car,
      color: 'text-purple-400 bg-purple-500/10',
      change: `${stats.vehicles.pending} pending review`
    },
    {
      title: 'Active Ads',
      value: stats.ads.active,
      icon: Megaphone,
      color: 'text-red-400 bg-red-500/10',
      change: `${stats.ads.pending} pending approval`
    },
    {
      title: 'Reports',
      value: stats.reports.total,
      icon: Flag,
      color: 'text-yellow-400 bg-yellow-500/10',
      change: `${stats.reports.pending} pending review`
    },
    {
      title: 'Mailbox',
      value: stats.mailbox.total,
      icon: Mail,
      color: 'text-cyan-400 bg-cyan-500/10',
      change: `${stats.mailbox.unread} unread`
    },
    {
      title: 'Notifications',
      value: stats.notifications.total,
      icon: Bell,
      color: 'text-pink-400 bg-pink-500/10',
      change: `${stats.notifications.unread} unread`
    },
    {
      title: 'Vehicle List',
      value: 'Manage',
      icon: List,
      color: 'text-orange-400 bg-orange-500/10',
      change: 'Add/Edit vehicles'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-white/40 mt-1">Overview of your platform</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/30">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Live
          </span>
          <span>•</span>
          <span>{new Date().toLocaleString()}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={index}
              className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-all hover:scale-[1.02]"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-[10px] text-white/40">{stat.title}</p>
                  <p className="text-xl font-bold text-white mt-1">{stat.value}</p>
                  {stat.change && (
                    <p className="text-[8px] text-white/30 mt-1">{stat.change}</p>
                  )}
                </div>
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white/5 rounded-xl border border-white/5 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white">Recent Activity</h3>
        </div>
        {recentActivities.length === 0 ? (
          <p className="text-xs text-white/30 text-center py-4">No recent activity</p>
        ) : (
          <div className="space-y-2">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-3 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  {activity.type === 'ad' ? (
                    <Megaphone className="w-3.5 h-3.5 text-blue-400" />
                  ) : activity.type === 'vehicle' ? (
                    <Car className="w-3.5 h-3.5 text-purple-400" />
                  ) : activity.type === 'report' ? (
                    <Flag className="w-3.5 h-3.5 text-yellow-400" />
                  ) : (
                    <Bell className="w-3.5 h-3.5 text-red-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/80 truncate">{activity.title}</p>
                  <p className="text-[10px] text-white/30 truncate">{activity.message}</p>
                </div>
                <span className="text-[8px] text-white/20 flex-shrink-0">
                  {new Date(activity.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-white/10 transition-all text-center group cursor-default">
          <Users className="w-5 h-5 text-blue-400 mx-auto mb-1" />
          <p className="text-[10px] text-white/60">Manage Users</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-white/10 transition-all text-center group cursor-default">
          <Car className="w-5 h-5 text-purple-400 mx-auto mb-1" />
          <p className="text-[10px] text-white/60">Manage Vehicles</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-white/10 transition-all text-center group cursor-default">
          <Megaphone className="w-5 h-5 text-red-400 mx-auto mb-1" />
          <p className="text-[10px] text-white/60">Manage Ads</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-white/10 transition-all text-center group cursor-default">
          <Flag className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
          <p className="text-[10px] text-white/60">View Reports</p>
        </div>
      </div>
    </div>
  )
}