// components/admin/VehicleReport.tsx
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
  Flag,
  Car,
  User,
  Calendar,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Trash2,
  MessageSquare,
  AlertTriangle,
  Shield,
  Users,
  Sparkles,
  ExternalLink
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

interface VehicleReport {
  id: string
  vehicle_id: string
  reporter_id: string
  reason: string
  description: string | null
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  created_at: string
  updated_at: string
}

interface Vehicle {
  id: string
  title: string
  brand: string
  model: string
  year: number
  cover_image: string | null
  user_id: string
  status: string
}

interface User {
  user_id: string
  email: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
}

type FilterType = 'all' | 'pending' | 'reviewed' | 'resolved' | 'dismissed'

export default function VehicleReportManagement() {
  const [reports, setReports] = useState<(VehicleReport & { vehicle?: Vehicle, reporter?: User })[]>([])
  const [vehicles, setVehicles] = useState<Record<string, Vehicle>>({})
  const [users, setUsers] = useState<Record<string, User>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reviewed: 0,
    resolved: 0,
    dismissed: 0
  })

  // Fetch reports
  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true)
      try {
        // Fetch all reports with vehicle and reporter info
        const { data: reportsData, error: reportsError } = await supabase
          .from('vehicle_reports')
          .select('*')
          .order('created_at', { ascending: false })

        if (reportsError) throw reportsError

        // Fetch vehicles
        const vehicleIds = [...new Set(reportsData?.map(r => r.vehicle_id) || [])]
        if (vehicleIds.length > 0) {
          const { data: vehiclesData, error: vehiclesError } = await supabase
            .from('vehicles')
            .select('id, title, brand, model, year, cover_image, user_id, status')
            .in('id', vehicleIds)

          if (!vehiclesError && vehiclesData) {
            const vehicleMap: Record<string, Vehicle> = {}
            vehiclesData.forEach((v: any) => {
              vehicleMap[v.id] = v
            })
            setVehicles(vehicleMap)
          }
        }

        // Fetch users (reporters)
        const userIds = [...new Set(reportsData?.map(r => r.reporter_id) || [])]
        if (userIds.length > 0) {
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('user_id, email, first_name, last_name, avatar_url')
            .in('user_id', userIds)

          if (!usersError && usersData) {
            const userMap: Record<string, User> = {}
            usersData.forEach((u: any) => {
              userMap[u.user_id] = {
                user_id: u.user_id,
                email: u.email,
                first_name: u.first_name,
                last_name: u.last_name,
                avatar_url: u.avatar_url
              }
            })
            setUsers(userMap)
          }
        }

        // Combine data
        const combinedReports = reportsData?.map(report => ({
          ...report,
          vehicle: vehicles[report.vehicle_id],
          reporter: users[report.reporter_id]
        })) || []

        setReports(combinedReports)
        calculateStats(combinedReports)
      } catch (err) {
        console.error('Error fetching reports:', err)
        setError('Failed to load reports')
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [])

  const calculateStats = (data: any[]) => {
    const pending = data.filter(r => r.status === 'pending').length
    const reviewed = data.filter(r => r.status === 'reviewed').length
    const resolved = data.filter(r => r.status === 'resolved').length
    const dismissed = data.filter(r => r.status === 'dismissed').length

    setStats({
      total: data.length,
      pending,
      reviewed,
      resolved,
      dismissed
    })
  }

  const handleStatusUpdate = async (reportId: string, status: VehicleReport['status']) => {
    setActionLoading(reportId)
    try {
      const { error } = await supabase
        .from('vehicle_reports')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', reportId)

      if (error) throw error

      // Refresh data
      const { data: updated } = await supabase
        .from('vehicle_reports')
        .select('*')
        .order('created_at', { ascending: false })

      // Re-fetch vehicles and users
      const vehicleIds = [...new Set(updated?.map(r => r.vehicle_id) || [])]
      const userIds = [...new Set(updated?.map(r => r.reporter_id) || [])]
      
      let updatedVehicles = vehicles
      let updatedUsers = users

      if (vehicleIds.length > 0) {
        const { data: vData } = await supabase
          .from('vehicles')
          .select('id, title, brand, model, year, cover_image, user_id, status')
          .in('id', vehicleIds)
        
        if (vData) {
          const vMap: Record<string, Vehicle> = {}
          vData.forEach((v: any) => { vMap[v.id] = v })
          updatedVehicles = vMap
          setVehicles(vMap)
        }
      }

      if (userIds.length > 0) {
        const { data: uData } = await supabase
          .from('users')
          .select('user_id, email, first_name, last_name, avatar_url')
          .in('user_id', userIds)
        
        if (uData) {
          const uMap: Record<string, User> = {}
          uData.forEach((u: any) => { uMap[u.user_id] = u })
          updatedUsers = uMap
          setUsers(uMap)
        }
      }

      const combined = updated?.map(report => ({
        ...report,
        vehicle: updatedVehicles[report.vehicle_id],
        reporter: updatedUsers[report.reporter_id]
      })) || []

      setReports(combined)
      calculateStats(combined)
    } catch (err) {
      console.error('Error updating report:', err)
      alert('Failed to update report status')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (reportId: string) => {
    if (!confirm('Are you sure you want to permanently delete this report?')) return

    setActionLoading(reportId)
    try {
      const { error } = await supabase
        .from('vehicle_reports')
        .delete()
        .eq('id', reportId)

      if (error) throw error

      const { data: updated } = await supabase
        .from('vehicle_reports')
        .select('*')
        .order('created_at', { ascending: false })

      const combined = updated?.map(report => ({
        ...report,
        vehicle: vehicles[report.vehicle_id],
        reporter: users[report.reporter_id]
      })) || []

      setReports(combined)
      calculateStats(combined)
    } catch (err) {
      console.error('Error deleting report:', err)
      alert('Failed to delete report')
    } finally {
      setActionLoading(null)
    }
  }

  const getFilteredReports = () => {
    let filtered = [...reports]

    // Apply filter
    if (filter !== 'all') {
      filtered = filtered.filter(r => r.status === filter)
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(r => {
        const vehicle = r.vehicle
        const reporter = r.reporter
        const vehicleName = vehicle ? `${vehicle.brand} ${vehicle.model}`.toLowerCase() : ''
        const reporterName = reporter ? `${reporter.first_name || ''} ${reporter.last_name || ''}`.toLowerCase() : ''
        return vehicleName.includes(query) ||
          reporterName.includes(query) ||
          reporter?.email?.toLowerCase().includes(query) ||
          r.reason.toLowerCase().includes(query) ||
          (r.description && r.description.toLowerCase().includes(query))
      })
    }

    return filtered
  }

  const filteredReports = getFilteredReports()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' }
      case 'reviewed':
        return { label: 'Reviewed', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' }
      case 'resolved':
        return { label: 'Resolved', color: 'bg-green-500/20 text-green-400 border-green-500/30' }
      case 'dismissed':
        return { label: 'Dismissed', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' }
      default:
        return { label: 'Unknown', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        <span className="text-white/60 ml-3">Loading reports...</span>
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
            <Flag className="w-5 h-5 text-red-400" />
            Vehicle Reports
          </h2>
          <p className="text-sm text-white/40">Manage reported vehicles and investigate issues</p>
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
          <p className="text-[10px] text-white/40">Reviewed</p>
          <p className="text-lg font-bold text-blue-400">{stats.reviewed}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-green-500/20 transition-all">
          <p className="text-[10px] text-white/40">Resolved</p>
          <p className="text-lg font-bold text-green-400">{stats.resolved}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-gray-500/20 transition-all">
          <p className="text-[10px] text-white/40">Dismissed</p>
          <p className="text-lg font-bold text-gray-400">{stats.dismissed}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide flex-1">
          {(['all', 'pending', 'reviewed', 'resolved', 'dismissed'] as FilterType[]).map((tab) => {
            const isActive = filter === tab
            const count = tab === 'all' ? stats.total :
              tab === 'pending' ? stats.pending :
              tab === 'reviewed' ? stats.reviewed :
              tab === 'resolved' ? stats.resolved :
              tab === 'dismissed' ? stats.dismissed :
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
            placeholder="Search reports..."
            className="w-full sm:w-48 pl-9 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-xl border border-white/5">
          <Flag className="w-12 h-12 text-white/20 mx-auto mb-2" />
          <p className="text-white/40 text-sm">No reports found</p>
          <p className="text-white/20 text-xs mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => {
            const vehicle = report.vehicle
            const reporter = report.reporter
            const isExpanded = expandedId === report.id
            const isLoading = actionLoading === report.id
            const statusBadge = getStatusBadge(report.status)

            return (
              <div
                key={report.id}
                className={`bg-white/5 rounded-xl border transition-all overflow-hidden ${
                  report.status === 'pending'
                    ? 'border-yellow-500/20 hover:border-yellow-500/30 bg-yellow-500/5'
                    : 'border-white/5 hover:border-white/10'
                }`}
              >
                <div className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Vehicle Image */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-black/50 border border-white/5">
                        {vehicle?.cover_image ? (
                          <img
                            src={vehicle.cover_image}
                            alt={vehicle.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Car className="w-6 h-6 text-white/20" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-white">
                              {vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Unknown Vehicle'}
                            </p>
                            {vehicle?.year && (
                              <span className="text-xs text-white/40">({vehicle.year})</span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-medium border ${statusBadge.color}`}>
                              {statusBadge.label}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-white/40">
                            <div className="flex items-center gap-1">
                              <Flag className="w-3 h-3" />
                              <span>{report.reason}</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>
                                {reporter ? `${reporter.first_name || ''} ${reporter.last_name || ''}`.trim() || 'Unknown' : 'Unknown'}
                              </span>
                            </div>
                          </div>
                          {report.description && (
                            <p className="text-xs text-white/30 mt-1 line-clamp-1">
                              {report.description}
                            </p>
                          )}
                        </div>

                        {/* Time */}
                        <div className="flex-shrink-0 text-right">
                          <p className="text-[10px] text-white/20">
                            {new Date(report.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-white/5">
                        {report.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(report.id, 'reviewed')}
                              disabled={isLoading}
                              className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-[10px] font-medium text-blue-400 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                            >
                              {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
                              Review
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(report.id, 'resolved')}
                              disabled={isLoading}
                              className="flex items-center gap-1.5 px-3 py-1 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-[10px] font-medium text-green-400 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                            >
                              {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                              Resolve
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(report.id, 'dismissed')}
                              disabled={isLoading}
                              className="flex items-center gap-1.5 px-3 py-1 bg-gray-500/20 hover:bg-gray-500/30 rounded-lg text-[10px] font-medium text-gray-400 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                            >
                              {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                              Dismiss
                            </button>
                          </>
                        )}

                        {report.status === 'reviewed' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(report.id, 'resolved')}
                              disabled={isLoading}
                              className="flex items-center gap-1.5 px-3 py-1 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-[10px] font-medium text-green-400 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                            >
                              {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                              Resolve
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(report.id, 'dismissed')}
                              disabled={isLoading}
                              className="flex items-center gap-1.5 px-3 py-1 bg-gray-500/20 hover:bg-gray-500/30 rounded-lg text-[10px] font-medium text-gray-400 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                            >
                              {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                              Dismiss
                            </button>
                          </>
                        )}

                        {vehicle && (
                          <Link
                            href={`/vehicles/${vehicle.id}`}
                            target="_blank"
                            className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-medium text-white/60 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View Vehicle
                          </Link>
                        )}

                        <button
                          onClick={() => setExpandedId(isExpanded ? null : report.id)}
                          className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-medium text-white/60 transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          {isExpanded ? 'Less' : 'More'}
                        </button>

                        <button
                          onClick={() => handleDelete(report.id)}
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
                      {report.description && (
                        <div>
                          <p className="text-white/40 mb-1">Description</p>
                          <div className="bg-white/5 rounded-lg p-3 text-white/60 leading-relaxed">
                            {report.description}
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <p className="text-white/40 mb-1">Report ID</p>
                          <p className="text-white/80 font-mono text-[10px]">{report.id}</p>
                        </div>
                        <div>
                          <p className="text-white/40 mb-1">Vehicle ID</p>
                          <p className="text-white/80 font-mono text-[10px]">{report.vehicle_id}</p>
                        </div>
                        <div>
                          <p className="text-white/40 mb-1">Reporter ID</p>
                          <p className="text-white/80 font-mono text-[10px]">{report.reporter_id}</p>
                        </div>
                        <div>
                          <p className="text-white/40 mb-1">Reason</p>
                          <p className="text-white/80">{report.reason}</p>
                        </div>
                        <div>
                          <p className="text-white/40 mb-1">Created</p>
                          <p className="text-white/80">{new Date(report.created_at).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-white/40 mb-1">Updated</p>
                          <p className="text-white/80">{new Date(report.updated_at).toLocaleString()}</p>
                        </div>
                      </div>
                      {vehicle && (
                        <div className="mt-2 p-3 bg-white/5 rounded-lg">
                          <p className="text-white/40 mb-1">Vehicle Details</p>
                          <div className="grid grid-cols-2 gap-1 text-[10px] text-white/60">
                            <span>Title: {vehicle.title}</span>
                            <span>Brand: {vehicle.brand}</span>
                            <span>Model: {vehicle.model}</span>
                            <span>Year: {vehicle.year}</span>
                            <span>Status: {vehicle.status}</span>
                            <span>Owner: {vehicle.user_id}</span>
                          </div>
                        </div>
                      )}
                      {reporter && (
                        <div className="mt-2 p-3 bg-white/5 rounded-lg">
                          <p className="text-white/40 mb-1">Reporter Details</p>
                          <div className="grid grid-cols-2 gap-1 text-[10px] text-white/60">
                            <span>Name: {`${reporter.first_name || ''} ${reporter.last_name || ''}`.trim() || 'N/A'}</span>
                            <span>Email: {reporter.email}</span>
                          </div>
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