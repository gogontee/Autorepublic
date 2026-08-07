// components/admin/Users.tsx
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
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Shield,
  Star,
  Users,
  Activity,
  Trash2,
  Check,
  X,
  Edit,
  MoreVertical,
  UserCheck,
  UserX,
  Award,
  Building,
  Globe
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface UserProfile {
  id: string
  user_id: string
  email: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
  gender: string | null
  city: string | null
  state: string | null
  country: string | null
  phone: string | null
  avatar_url: string | null
  role: string | null
  is_active: boolean | null
  is_verified: boolean | null
  last_login: string | null
  created_at: string
  updated_at: string
  lga: string | null
  full_address: string | null
  bio: string | null
}

type FilterType = 'all' | 'active' | 'inactive' | 'verified' | 'unverified' | 'admin' | 'dealer'

export default function UsersManagement() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    verified: 0,
    unverified: 0,
    admin: 0,
    dealer: 0
  })

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error

        setUsers(data || [])
        calculateStats(data || [])
      } catch (err) {
        console.error('Error fetching users:', err)
        setError('Failed to load users')
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const calculateStats = (usersData: UserProfile[]) => {
    const active = usersData.filter(u => u.is_active === true).length
    const inactive = usersData.filter(u => u.is_active === false).length
    const verified = usersData.filter(u => u.is_verified === true).length
    const unverified = usersData.filter(u => u.is_verified === false).length
    const admin = usersData.filter(u => u.role === 'admin').length
    const dealer = usersData.filter(u => u.role === 'dealer').length

    setStats({
      total: usersData.length,
      active,
      inactive,
      verified,
      unverified,
      admin,
      dealer
    })
  }

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    setActionLoading(userId)
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          is_active: isActive, 
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', userId)

      if (error) throw error

      // Refresh data
      const { data: updatedUsers } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      setUsers(updatedUsers || [])
      calculateStats(updatedUsers || [])
    } catch (err) {
      console.error('Error updating user:', err)
      alert('Failed to update user')
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleVerified = async (userId: string, isVerified: boolean) => {
    setActionLoading(userId)
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          is_verified: isVerified, 
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', userId)

      if (error) throw error

      // Refresh data
      const { data: updatedUsers } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      setUsers(updatedUsers || [])
      calculateStats(updatedUsers || [])
    } catch (err) {
      console.error('Error updating user:', err)
      alert('Failed to update user')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRoleChange = async (userId: string, role: string) => {
    setActionLoading(userId)
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          role, 
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', userId)

      if (error) throw error

      // Refresh data
      const { data: updatedUsers } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      setUsers(updatedUsers || [])
      calculateStats(updatedUsers || [])
    } catch (err) {
      console.error('Error updating user role:', err)
      alert('Failed to update user role')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) return

    setActionLoading(userId)
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('user_id', userId)

      if (error) throw error

      const { data: updatedUsers } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      setUsers(updatedUsers || [])
      calculateStats(updatedUsers || [])
    } catch (err) {
      console.error('Error deleting user:', err)
      alert('Failed to delete user')
    } finally {
      setActionLoading(null)
    }
  }

  const getFilteredUsers = () => {
    let filtered = [...users]

    // Apply filter
    if (filter !== 'all') {
      filtered = filtered.filter(u => {
        switch (filter) {
          case 'active': return u.is_active === true
          case 'inactive': return u.is_active === false
          case 'verified': return u.is_verified === true
          case 'unverified': return u.is_verified === false
          case 'admin': return u.role === 'admin'
          case 'dealer': return u.role === 'dealer'
          default: return true
        }
      })
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(u =>
        u.email?.toLowerCase().includes(query) ||
        u.first_name?.toLowerCase().includes(query) ||
        u.last_name?.toLowerCase().includes(query) ||
        `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase().includes(query) ||
        u.phone?.includes(query) ||
        u.city?.toLowerCase().includes(query) ||
        u.state?.toLowerCase().includes(query) ||
        u.country?.toLowerCase().includes(query)
      )
    }

    return filtered
  }

  const getRoleBadge = (role: string | null) => {
    switch (role) {
      case 'admin':
        return { label: 'Admin', color: 'bg-red-500/20 text-red-400 border-red-500/30' }
      case 'dealer':
        return { label: 'Dealer', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' }
      default:
        return { label: 'User', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' }
    }
  }

  const filteredUsers = getFilteredUsers()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        <span className="text-white/60 ml-3">Loading users...</span>
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
            <Users className="w-5 h-5 text-red-400" />
            User Management
          </h2>
          <p className="text-sm text-white/40">Manage and moderate platform users</p>
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
      <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 sm:gap-3">
        <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-red-500/20 transition-all">
          <p className="text-[10px] text-white/40">Total</p>
          <p className="text-lg font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-green-500/20 transition-all">
          <p className="text-[10px] text-white/40">Active</p>
          <p className="text-lg font-bold text-green-400">{stats.active}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-red-500/20 transition-all">
          <p className="text-[10px] text-white/40">Inactive</p>
          <p className="text-lg font-bold text-red-400">{stats.inactive}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-blue-500/20 transition-all">
          <p className="text-[10px] text-white/40">Verified</p>
          <p className="text-lg font-bold text-blue-400">{stats.verified}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-yellow-500/20 transition-all">
          <p className="text-[10px] text-white/40">Unverified</p>
          <p className="text-lg font-bold text-yellow-400">{stats.unverified}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-purple-500/20 transition-all">
          <p className="text-[10px] text-white/40">Admin</p>
          <p className="text-lg font-bold text-purple-400">{stats.admin}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-cyan-500/20 transition-all">
          <p className="text-[10px] text-white/40">Dealers</p>
          <p className="text-lg font-bold text-cyan-400">{stats.dealer}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide flex-1">
          {(['all', 'active', 'inactive', 'verified', 'unverified', 'admin', 'dealer'] as FilterType[]).map((tab) => {
            const isActive = filter === tab
            const count = tab === 'all' ? stats.total :
              tab === 'active' ? stats.active :
              tab === 'inactive' ? stats.inactive :
              tab === 'verified' ? stats.verified :
              tab === 'unverified' ? stats.unverified :
              tab === 'admin' ? stats.admin :
              tab === 'dealer' ? stats.dealer :
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
            placeholder="Search users..."
            className="w-full sm:w-48 pl-9 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-xl border border-white/5">
          <User className="w-12 h-12 text-white/20 mx-auto mb-2" />
          <p className="text-white/40 text-sm">No users found</p>
          <p className="text-white/20 text-xs mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user) => {
            const isExpanded = expandedUser === user.user_id
            const isActionLoading = actionLoading === user.user_id
            const roleBadge = getRoleBadge(user.role)
            const displayName = user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email

            return (
              <div
                key={user.user_id}
                className="bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all overflow-hidden group"
              >
                {/* Main Row */}
                <div className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500/30 to-red-600/10 flex items-center justify-center overflow-hidden border-2 border-white/10">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl font-bold text-red-500">
                            {(user.first_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* User Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-medium text-white truncate">
                              {displayName}
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${roleBadge.color}`}>
                              {roleBadge.label}
                            </span>
                            {user.is_verified && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                <Check className="w-2.5 h-2.5 inline mr-0.5" />
                                Verified
                              </span>
                            )}
                            {user.is_active ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                                <Activity className="w-2.5 h-2.5 inline mr-0.5" />
                                Active
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                                <X className="w-2.5 h-2.5 inline mr-0.5" />
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-white/40">
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              <span>{user.email}</span>
                            </div>
                            {user.phone && (
                              <>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  <span>{user.phone}</span>
                                </div>
                              </>
                            )}
                            {user.city && (
                              <>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  <span>{user.city}{user.state ? `, ${user.state}` : ''}</span>
                                </div>
                              </>
                            )}
                            {user.country && (
                              <>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                  <Globe className="w-3 h-3" />
                                  <span>{user.country}</span>
                                </div>
                              </>
                            )}
                          </div>
                          {user.bio && (
                            <p className="text-xs text-white/30 mt-1 line-clamp-1">{user.bio}</p>
                          )}
                        </div>

                        {/* Join Date */}
                        <div className="flex-shrink-0 text-right">
                          <p className="text-[10px] text-white/20">Joined</p>
                          <p className="text-xs text-white/40">
                            {new Date(user.created_at).toLocaleDateString()}
                          </p>
                          {user.last_login && (
                            <p className="text-[10px] text-white/20 mt-0.5">
                              Last active: {new Date(user.last_login).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-white/5">
                        {/* Toggle Active */}
                        <button
                          onClick={() => handleToggleActive(user.user_id, !user.is_active)}
                          disabled={isActionLoading}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-medium transition-all hover:scale-105 active:scale-95 disabled:opacity-50 ${
                            user.is_active
                              ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
                              : 'bg-green-500/10 hover:bg-green-500/20 text-green-400'
                          }`}
                        >
                          {isActionLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : user.is_active ? (
                            <>
                              <UserX className="w-3 h-3" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3 h-3" />
                              Activate
                            </>
                          )}
                        </button>

                        {/* Toggle Verified */}
                        <button
                          onClick={() => handleToggleVerified(user.user_id, !user.is_verified)}
                          disabled={isActionLoading}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-medium transition-all hover:scale-105 active:scale-95 disabled:opacity-50 ${
                            user.is_verified
                              ? 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400'
                              : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400'
                          }`}
                        >
                          {isActionLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : user.is_verified ? (
                            <>
                              <X className="w-3 h-3" />
                              Unverify
                            </>
                          ) : (
                            <>
                              <Check className="w-3 h-3" />
                              Verify
                            </>
                          )}
                        </button>

                        {/* Role Selector */}
                        <select
                          value={user.role || 'user'}
                          onChange={(e) => handleRoleChange(user.user_id, e.target.value)}
                          disabled={isActionLoading}
                          className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] text-white/80 focus:outline-none focus:border-red-500/50 transition-colors disabled:opacity-50"
                        >
                          <option value="user" className="bg-black">User</option>
                          <option value="dealer" className="bg-black">Dealer</option>
                          <option value="admin" className="bg-black">Admin</option>
                        </select>

                        {/* Expand */}
                        <button
                          onClick={() => setExpandedUser(isExpanded ? null : user.user_id)}
                          className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-medium text-white/60 transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          {isExpanded ? 'Less' : 'More'}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(user.user_id)}
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
                    <div className="pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <p className="text-white/40 mb-1">User ID</p>
                        <p className="text-white/80 font-mono text-[10px]">{user.user_id}</p>
                      </div>
                      <div>
                        <p className="text-white/40 mb-1">Email</p>
                        <p className="text-white/80 break-all">{user.email}</p>
                      </div>
                      <div>
                        <p className="text-white/40 mb-1">Phone</p>
                        <p className="text-white/80">{user.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-white/40 mb-1">Gender</p>
                        <p className="text-white/80">{user.gender || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-white/40 mb-1">Location</p>
                        <p className="text-white/80">
                          {user.city || 'N/A'}{user.state ? `, ${user.state}` : ''}{user.country ? `, ${user.country}` : ''}
                        </p>
                      </div>
                      <div>
                        <p className="text-white/40 mb-1">LGA</p>
                        <p className="text-white/80">{user.lga || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-white/40 mb-1">Full Address</p>
                        <p className="text-white/80 text-[10px]">{user.full_address || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-white/40 mb-1">Created</p>
                        <p className="text-white/80">{new Date(user.created_at).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-white/40 mb-1">Last Updated</p>
                        <p className="text-white/80">{new Date(user.updated_at).toLocaleString()}</p>
                      </div>
                      {user.bio && (
                        <div className="col-span-3">
                          <p className="text-white/40 mb-1">Bio</p>
                          <p className="text-white/60 text-[10px] leading-relaxed">{user.bio}</p>
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