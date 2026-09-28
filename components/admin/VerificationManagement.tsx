'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  Eye,
  X,
  Search,
  Filter,
  UserCheck,
  UserX,
  FileCheck,
  CreditCard,
  Users,
  Globe,
  Calendar,
  ExternalLink,
  Trash2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertTriangle,
  Download,
  Maximize2,
  MapPin,
  Mail,
  Phone
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

// ==========================================
// TYPES
// ==========================================
interface VerificationRow {
  id: string
  user_id: string
  selfie_url: string | null
  id_type: string | null
  id_card_url: string | null
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  submitted_at: string
  created_at: string
  updated_at: string
  // Joined user data
  user?: {
    first_name: string | null
    last_name: string | null
    email: string | null
    phone: string | null
    avatar_url: string | null
    city: string | null
    state: string | null
    country: string | null
  } | null
}

interface VerificationManagementProps {
  className?: string
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected'

// ==========================================
// CONSTANTS
// ==========================================
const ID_TYPE_LABELS: Record<string, string> = {
  nin: 'NIN (National ID)',
  drivers_license: "Driver's License",
  voters_card: "Voter's Card",
  international_passport: 'International Passport',
}

const ID_TYPE_ICONS: Record<string, any> = {
  nin: CreditCard,
  drivers_license: FileCheck,
  voters_card: Users,
  international_passport: Globe,
}

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function VerificationManagement({ className = '' }: VerificationManagementProps) {
  const [verifications, setVerifications] = useState<VerificationRow[]>([])
  const [filteredVerifications, setFilteredVerifications] = useState<VerificationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('pending')

  // Selected verification for detail view
  const [selectedVerification, setSelectedVerification] = useState<VerificationRow | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [signedUrls, setSignedUrls] = useState<{ selfie: string | null; id: string | null }>({
    selfie: null,
    id: null,
  })
  const [loadingUrls, setLoadingUrls] = useState(false)

  // Rejection modal
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [processing, setProcessing] = useState(false)

  // Delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<VerificationRow | null>(null)

  // Image zoom
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)

  // Admin check
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)

  // ==========================================
  // CHECK ADMIN STATUS
  // ==========================================
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          setError('You must be logged in to access this page')
          setCheckingAdmin(false)
          setLoading(false)
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('role')
          .eq('user_id', session.user.id)
          .single()

        if (profileError || profile?.role !== 'admin') {
          setError('Access denied. Admin privileges required.')
          setCheckingAdmin(false)
          setLoading(false)
          return
        }

        setIsAdmin(true)
        setCheckingAdmin(false)
      } catch (err) {
        console.error('Error checking admin:', err)
        setError('Failed to verify admin access')
        setCheckingAdmin(false)
        setLoading(false)
      }
    }

    checkAdmin()
  }, [])

  // ==========================================
  // FETCH VERIFICATIONS
  // ==========================================
  const fetchVerifications = useCallback(async () => {
    if (!isAdmin) return

    try {
      setLoading(true)
      setError('')

      const { data, error: fetchError } = await supabase
        .from('verify')
        .select(`
          *,
          user:users!verify_user_id_fkey (
            first_name,
            last_name,
            email,
            phone,
            avatar_url,
            city,
            state,
            country
          )
        `)
        .order('submitted_at', { ascending: false })

      if (fetchError) {
        console.error('Fetch error:', fetchError)
        // Fallback: if FK join fails, fetch without user data
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('verify')
          .select('*')
          .order('submitted_at', { ascending: false })

        if (fallbackError) throw fallbackError

        // Manually join user data
        const userIds = (fallbackData || []).map((v) => v.user_id)
        const { data: usersData } = await supabase
          .from('users')
          .select('user_id, first_name, last_name, email, phone, avatar_url, city, state, country')
          .in('user_id', userIds)

        const userMap = new Map((usersData || []).map((u) => [u.user_id, u]))
        const merged = (fallbackData || []).map((v) => ({
          ...v,
          user: userMap.get(v.user_id) || null,
        }))

        setVerifications(merged as VerificationRow[])
        setLoading(false)
        return
      }

      setVerifications((data || []) as VerificationRow[])
    } catch (err: any) {
      console.error('Error fetching verifications:', err)
      setError(err.message || 'Failed to load verification requests')
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  useEffect(() => {
    if (isAdmin) {
      fetchVerifications()
    }
  }, [isAdmin, fetchVerifications])

  // ==========================================
  // FILTER
  // ==========================================
  useEffect(() => {
    let filtered = [...verifications]

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((v) => v.status === statusFilter)
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      filtered = filtered.filter((v) => {
        const fullName = `${v.user?.first_name || ''} ${v.user?.last_name || ''}`.toLowerCase()
        const email = (v.user?.email || '').toLowerCase()
        const phone = (v.user?.phone || '').toLowerCase()
        const id = v.id.toLowerCase()

        return (
          fullName.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          id.includes(q)
        )
      })
    }

    setFilteredVerifications(filtered)
  }, [verifications, statusFilter, searchQuery])

  // ==========================================
  // COUNTS
  // ==========================================
  const counts = {
    all: verifications.length,
    pending: verifications.filter((v) => v.status === 'pending').length,
    approved: verifications.filter((v) => v.status === 'approved').length,
    rejected: verifications.filter((v) => v.status === 'rejected').length,
  }

  // ==========================================
  // SIGNED URLS (for private bucket)
  // ==========================================
  const loadSignedUrls = async (verification: VerificationRow) => {
    setLoadingUrls(true)
    setSignedUrls({ selfie: null, id: null })

    try {
      const urls: { selfie: string | null; id: string | null } = {
        selfie: null,
        id: null,
      }

      if (verification.selfie_url) {
        const { data, error } = await supabase.storage
          .from('verifications')
          .createSignedUrl(verification.selfie_url, 3600)
        if (!error && data) urls.selfie = data.signedUrl
      }

      if (verification.id_card_url) {
        const { data, error } = await supabase.storage
          .from('verifications')
          .createSignedUrl(verification.id_card_url, 3600)
        if (!error && data) urls.id = data.signedUrl
      }

      setSignedUrls(urls)
    } catch (err) {
      console.error('Error loading signed URLs:', err)
    } finally {
      setLoadingUrls(false)
    }
  }

  // ==========================================
  // OPEN DETAIL
  // ==========================================
  const openDetail = async (verification: VerificationRow) => {
    setSelectedVerification(verification)
    setShowDetailModal(true)
    await loadSignedUrls(verification)
  }

  // ==========================================
  // APPROVE
  // ==========================================
  const handleApprove = async () => {
    if (!selectedVerification) return

    setProcessing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('No session')

      const { error: updateError } = await supabase
        .from('verify')
        .update({
          status: 'approved',
          rejection_reason: null,
          reviewed_by: session.user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selectedVerification.id)

      if (updateError) throw updateError

      // Update local state
      setVerifications((prev) =>
        prev.map((v) =>
          v.id === selectedVerification.id
            ? { ...v, status: 'approved', rejection_reason: null }
            : v
        )
      )

      setSuccess('Verification approved successfully!')
      setShowDetailModal(false)
      setSelectedVerification(null)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      console.error('Approve error:', err)
      setError(err.message || 'Failed to approve verification')
      setTimeout(() => setError(''), 3000)
    } finally {
      setProcessing(false)
    }
  }

  // ==========================================
  // REJECT
  // ==========================================
  const handleReject = async () => {
    if (!selectedVerification || !rejectionReason.trim()) {
      setError('Please provide a rejection reason')
      return
    }

    setProcessing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('No session')

      const { error: updateError } = await supabase
        .from('verify')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason.trim(),
          reviewed_by: session.user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selectedVerification.id)

      if (updateError) throw updateError

      setVerifications((prev) =>
        prev.map((v) =>
          v.id === selectedVerification.id
            ? { ...v, status: 'rejected', rejection_reason: rejectionReason.trim() }
            : v
        )
      )

      setSuccess('Verification rejected.')
      setShowRejectModal(false)
      setShowDetailModal(false)
      setSelectedVerification(null)
      setRejectionReason('')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      console.error('Reject error:', err)
      setError(err.message || 'Failed to reject verification')
      setTimeout(() => setError(''), 3000)
    } finally {
      setProcessing(false)
    }
  }

  // ==========================================
  // DELETE
  // ==========================================
  const handleDelete = async () => {
    if (!deleteTarget) return

    setProcessing(true)
    try {
      // Delete storage files first
      const filesToDelete: string[] = []
      if (deleteTarget.selfie_url) filesToDelete.push(deleteTarget.selfie_url)
      if (deleteTarget.id_card_url) filesToDelete.push(deleteTarget.id_card_url)

      if (filesToDelete.length > 0) {
        await supabase.storage.from('verifications').remove(filesToDelete)
      }

      const { error: deleteError } = await supabase
        .from('verify')
        .delete()
        .eq('id', deleteTarget.id)

      if (deleteError) throw deleteError

      setVerifications((prev) => prev.filter((v) => v.id !== deleteTarget.id))
      setSuccess('Verification record deleted.')
      setShowDeleteModal(false)
      setDeleteTarget(null)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      console.error('Delete error:', err)
      setError(err.message || 'Failed to delete record')
      setTimeout(() => setError(''), 3000)
    } finally {
      setProcessing(false)
    }
  }

  // ==========================================
  // HELPERS
  // ==========================================
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatRelativeTime = (date: string) => {
    const now = new Date()
    const then = new Date(date)
    const diff = now.getTime() - then.getTime()

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return formatDate(date)
  }

  const getUserDisplayName = (v: VerificationRow) => {
    if (v.user?.first_name && v.user?.last_name) {
      return `${v.user.first_name} ${v.user.last_name}`
    }
    if (v.user?.first_name) return v.user.first_name
    if (v.user?.email) return v.user.email.split('@')[0]
    return 'Unknown User'
  }

  const getUserInitials = (v: VerificationRow) => {
    if (v.user?.first_name && v.user?.last_name) {
      return `${v.user.first_name[0]}${v.user.last_name[0]}`.toUpperCase()
    }
    if (v.user?.first_name) return v.user.first_name[0].toUpperCase()
    if (v.user?.email) return v.user.email[0].toUpperCase()
    return 'U'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          label: 'Approved',
          color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          icon: CheckCircle,
        }
      case 'rejected':
        return {
          label: 'Rejected',
          color: 'bg-red-500/15 text-red-400 border-red-500/30',
          icon: XCircle,
        }
      default:
        return {
          label: 'Pending',
          color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          icon: Clock,
        }
    }
  }

  // ==========================================
  // RENDER: LOADING
  // ==========================================
  if (checkingAdmin || loading) {
    return (
      <div className={`bg-black/40 rounded-2xl border border-white/5 p-12 ${className}`}>
        <div className="flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
          <p className="text-sm text-white/60">Loading verification requests...</p>
        </div>
      </div>
    )
  }

  // ==========================================
  // RENDER: ACCESS DENIED
  // ==========================================
  if (!isAdmin) {
    return (
      <div className={`bg-black/40 rounded-2xl border border-white/5 p-12 ${className}`}>
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Shield className="w-7 h-7 text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-white">Access Denied</h3>
          <p className="text-sm text-white/50 max-w-sm">
            {error || 'You do not have permission to view this page. Admin privileges required.'}
          </p>
        </div>
      </div>
    )
  }

  // ==========================================
  // RENDER: MAIN
  // ==========================================
  return (
    <div className={`bg-black/40 rounded-2xl border border-white/5 p-4 sm:p-6 ${className}`}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-400" />
            Verification Management
          </h2>
          <p className="text-sm text-white/40 mt-0.5">
            Review and manage user identity verification requests
          </p>
        </div>
        <button
          onClick={fetchVerifications}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium text-white/80 transition-all border border-white/5 hover:border-white/10"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Success/Error Messages */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            {success}
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search by name, email, phone, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 overflow-x-auto">
          {(['all', 'pending', 'approved', 'rejected'] as FilterStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {status === 'pending' && <Clock className="w-3 h-3" />}
              {status === 'approved' && <CheckCircle className="w-3 h-3" />}
              {status === 'rejected' && <XCircle className="w-3 h-3" />}
              <span className="capitalize">{status}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                statusFilter === status ? 'bg-white/20' : 'bg-white/10'
              }`}>
                {counts[status]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filteredVerifications.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
            <Shield className="w-8 h-8 text-white/20" />
          </div>
          <p className="text-sm text-white/50">
            {searchQuery || statusFilter !== 'all'
              ? 'No verification requests match your filters'
              : 'No verification requests yet'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-3 px-3 text-[10px] font-medium text-white/40 uppercase tracking-wider">User</th>
                <th className="text-left py-3 px-3 text-[10px] font-medium text-white/40 uppercase tracking-wider hidden md:table-cell">ID Type</th>
                <th className="text-left py-3 px-3 text-[10px] font-medium text-white/40 uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-3 text-[10px] font-medium text-white/40 uppercase tracking-wider hidden lg:table-cell">Submitted</th>
                <th className="text-right py-3 px-3 text-[10px] font-medium text-white/40 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVerifications.map((v) => {
                const statusBadge = getStatusBadge(v.status)
                const StatusIcon = statusBadge.icon
                const IdIcon = v.id_type ? ID_TYPE_ICONS[v.id_type] || FileCheck : FileCheck

                return (
                  <tr
                    key={v.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    {/* User */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-red-500/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {v.user?.avatar_url ? (
                            <img
                              src={v.user.avatar_url}
                              alt={getUserDisplayName(v)}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-bold text-red-400">
                              {getUserInitials(v)}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {getUserDisplayName(v)}
                          </p>
                          <p className="text-[10px] text-white/40 truncate">
                            {v.user?.email || 'No email'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* ID Type */}
                    <td className="py-3 px-3 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <IdIcon className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
                        <span className="text-xs text-white/60">
                          {v.id_type ? ID_TYPE_LABELS[v.id_type] : '—'}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusBadge.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusBadge.label}
                      </span>
                    </td>

                    {/* Submitted */}
                    <td className="py-3 px-3 hidden lg:table-cell">
                      <span className="text-xs text-white/50">
                        {formatRelativeTime(v.submitted_at)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openDetail(v)}
                          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTarget(v)
                            setShowDeleteModal(true)
                          }}
                          className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors text-white/50 hover:text-red-400"
                          title="Delete record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Results count */}
          <div className="mt-4 text-center">
            <p className="text-xs text-white/30">
              Showing {filteredVerifications.length} of {verifications.length} requests
            </p>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* DETAIL MODAL */}
      {/* ========================================== */}
      <AnimatePresence>
        {showDetailModal && selectedVerification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              setShowDetailModal(false)
              setSelectedVerification(null)
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/20 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Verification Details</h3>
                    <p className="text-[11px] text-white/40 font-mono">
                      ID: {selectedVerification.id.slice(0, 8)}...
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false)
                    setSelectedVerification(null)
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-white/50" />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-5">

                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(selectedVerification.status).color}`}>
                    {(() => {
                      const Icon = getStatusBadge(selectedVerification.status).icon
                      return <Icon className="w-3.5 h-3.5" />
                    })()}
                    {getStatusBadge(selectedVerification.status).label}
                  </span>
                  <span className="text-[11px] text-white/40">
                    Submitted {formatRelativeTime(selectedVerification.submitted_at)}
                  </span>
                </div>

                {/* Rejection reason (if rejected) */}
                {selectedVerification.status === 'rejected' && selectedVerification.rejection_reason && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-red-400">Rejection Reason</p>
                        <p className="text-[11px] text-white/60 mt-0.5">
                          {selectedVerification.rejection_reason}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* User Info */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
                    User Information
                  </h4>
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {selectedVerification.user?.avatar_url ? (
                        <img
                          src={selectedVerification.user.avatar_url}
                          alt={getUserDisplayName(selectedVerification)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-bold text-red-400">
                          {getUserInitials(selectedVerification)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-medium text-white">
                        {getUserDisplayName(selectedVerification)}
                      </p>
                      {selectedVerification.user?.email && (
                        <p className="text-xs text-white/50 flex items-center gap-1.5">
                          <Mail className="w-3 h-3" />
                          {selectedVerification.user.email}
                        </p>
                      )}
                      {selectedVerification.user?.phone && (
                        <p className="text-xs text-white/50 flex items-center gap-1.5">
                          <Phone className="w-3 h-3" />
                          {selectedVerification.user.phone}
                        </p>
                      )}
                      {(selectedVerification.user?.city || selectedVerification.user?.state) && (
                        <p className="text-xs text-white/50 flex items-center gap-1.5">
                          <MapPin className="w-3 h-3" />
                          {[selectedVerification.user?.city, selectedVerification.user?.state, selectedVerification.user?.country]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* ID Type */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
                    ID Type
                  </h4>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = selectedVerification.id_type ? ID_TYPE_ICONS[selectedVerification.id_type] || FileCheck : FileCheck
                      return <Icon className="w-4 h-4 text-white/60" />
                    })()}
                    <span className="text-sm text-white">
                      {selectedVerification.id_type
                        ? ID_TYPE_LABELS[selectedVerification.id_type]
                        : 'Not specified'}
                    </span>
                  </div>
                </div>

                {/* Images */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Selfie */}
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
                      Selfie
                    </h4>
                    <div className="aspect-square rounded-lg overflow-hidden bg-black relative">
                      {loadingUrls ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 text-red-400 animate-spin" />
                        </div>
                      ) : signedUrls.selfie ? (
                        <>
                          <img
                            src={signedUrls.selfie}
                            alt="Selfie"
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => setZoomedImage(signedUrls.selfie)}
                          />
                          <button
                            onClick={() => setZoomedImage(signedUrls.selfie)}
                            className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-lg backdrop-blur-sm transition-colors"
                          >
                            <Maximize2 className="w-3.5 h-3.5 text-white" />
                          </button>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <p className="text-xs text-white/30">No selfie available</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ID Card */}
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
                      ID Document
                    </h4>
                    <div className="aspect-square rounded-lg overflow-hidden bg-black relative">
                      {loadingUrls ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 text-red-400 animate-spin" />
                        </div>
                      ) : signedUrls.id ? (
                        <>
                          <img
                            src={signedUrls.id}
                            alt="ID Document"
                            className="w-full h-full object-contain cursor-pointer bg-gray-900"
                            onClick={() => setZoomedImage(signedUrls.id)}
                          />
                          <button
                            onClick={() => setZoomedImage(signedUrls.id)}
                            className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-lg backdrop-blur-sm transition-colors"
                          >
                            <Maximize2 className="w-3.5 h-3.5 text-white" />
                          </button>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <p className="text-xs text-white/30">No ID available</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {selectedVerification.status === 'pending' && (
                  <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-white/5">
                    <button
                      onClick={handleApprove}
                      disabled={processing}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-sm font-medium text-white transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50"
                    >
                      {processing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      disabled={processing}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-medium text-white transition-all shadow-lg shadow-red-500/25 disabled:opacity-50"
                    >
                      <UserX className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================== */}
      {/* REJECT MODAL */}
      {/* ========================================== */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowRejectModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-900 rounded-2xl border border-white/10 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/20 flex items-center justify-center">
                    <UserX className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Reject Verification</h3>
                    <p className="text-[11px] text-white/40">Provide a reason for the user</p>
                  </div>
                </div>

                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  placeholder="e.g. ID photo is blurry, name doesn't match, document expired..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors resize-none"
                />

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => {
                      setShowRejectModal(false)
                      setRejectionReason('')
                    }}
                    className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium text-white/60 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={processing || !rejectionReason.trim()}
                    className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    Reject
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================== */}
      {/* DELETE MODAL */}
      {/* ========================================== */}
      <AnimatePresence>
        {showDeleteModal && deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-900 rounded-2xl border border-white/10 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/20 flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Delete Verification Record</h3>
                    <p className="text-[11px] text-white/40">This action cannot be undone</p>
                  </div>
                </div>

                <p className="text-sm text-white/60 mb-4">
                  Are you sure you want to permanently delete the verification for{' '}
                  <span className="text-white font-medium">
                    {getUserDisplayName(deleteTarget)}
                  </span>
                  ? All uploaded documents will also be deleted.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false)
                      setDeleteTarget(null)
                    }}
                    className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium text-white/60 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={processing}
                    className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================== */}
      {/* IMAGE ZOOM */}
      {/* ========================================== */}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setZoomedImage(null)}
          >
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              src={zoomedImage}
              alt="Zoomed"
              className="max-w-full max-h-[90vh] object-contain rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}