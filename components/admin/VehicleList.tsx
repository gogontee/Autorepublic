// components/admin/VehicleList.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  Filter, 
  AlertCircle, 
  Loader2,
  Car,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Trash2,
  Check,
  X,
  Plus,
  Edit,
  Save,
  XCircle,
  List,
  Grid,
  Hash,
  Tag,
  Sparkles
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface VehicleBrand {
  id: number
  brand: string
  model: string
  trims: string[] | null
  created_at: string
}

type ViewMode = 'grid' | 'list'

export default function VehicleListManagement() {
  const [vehicles, setVehicles] = useState<VehicleBrand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({
    brand: '',
    model: '',
    trims: ''
  })
  const [isAdding, setIsAdding] = useState(false)
  const [addForm, setAddForm] = useState({
    brand: '',
    model: '',
    trims: ''
  })
  const [stats, setStats] = useState({
    total: 0,
    brands: 0,
    models: 0,
    totalTrims: 0
  })

  // Fetch vehicle list
  useEffect(() => {
    const fetchVehicles = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('vehiclelist')
          .select('*')
          .order('brand', { ascending: true })
          .order('model', { ascending: true })

        if (error) throw error

        setVehicles(data || [])
        calculateStats(data || [])
      } catch (err) {
        console.error('Error fetching vehicle list:', err)
        setError('Failed to load vehicle list')
      } finally {
        setLoading(false)
      }
    }

    fetchVehicles()
  }, [])

  const calculateStats = (data: VehicleBrand[]) => {
    const brands = [...new Set(data.map(v => v.brand))]
    let totalTrims = 0
    data.forEach(v => {
      if (v.trims) {
        totalTrims += v.trims.length
      }
    })

    setStats({
      total: data.length,
      brands: brands.length,
      models: data.length,
      totalTrims
    })
  }

  const handleAdd = async () => {
    if (!addForm.brand.trim() || !addForm.model.trim()) {
      alert('Brand and Model are required')
      return
    }

    setActionLoading(0)
    try {
      const trimsArray = addForm.trims
        ? addForm.trims.split(',').map(t => t.trim()).filter(t => t)
        : []

      const { data, error } = await supabase
        .from('vehiclelist')
        .insert({
          brand: addForm.brand.trim(),
          model: addForm.model.trim(),
          trims: trimsArray
        })
        .select()
        .single()

      if (error) throw error

      setVehicles(prev => [...prev, data].sort((a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model)))
      calculateStats([...vehicles, data])
      setIsAdding(false)
      setAddForm({ brand: '', model: '', trims: '' })
    } catch (err) {
      console.error('Error adding vehicle:', err)
      alert('Failed to add vehicle')
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpdate = async (id: number) => {
    if (!editForm.brand.trim() || !editForm.model.trim()) {
      alert('Brand and Model are required')
      return
    }

    setActionLoading(id)
    try {
      const trimsArray = editForm.trims
        ? editForm.trims.split(',').map(t => t.trim()).filter(t => t)
        : []

      const { data, error } = await supabase
        .from('vehiclelist')
        .update({
          brand: editForm.brand.trim(),
          model: editForm.model.trim(),
          trims: trimsArray
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      setVehicles(prev => prev.map(v => v.id === id ? data : v))
      calculateStats(vehicles.map(v => v.id === id ? data : v))
      setEditingId(null)
      setEditForm({ brand: '', model: '', trims: '' })
    } catch (err) {
      console.error('Error updating vehicle:', err)
      alert('Failed to update vehicle')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this vehicle entry?')) return

    setActionLoading(id)
    try {
      const { error } = await supabase
        .from('vehiclelist')
        .delete()
        .eq('id', id)

      if (error) throw error

      const updatedVehicles = vehicles.filter(v => v.id !== id)
      setVehicles(updatedVehicles)
      calculateStats(updatedVehicles)
    } catch (err) {
      console.error('Error deleting vehicle:', err)
      alert('Failed to delete vehicle')
    } finally {
      setActionLoading(null)
    }
  }

  const startEdit = (vehicle: VehicleBrand) => {
    setEditingId(vehicle.id)
    setEditForm({
      brand: vehicle.brand,
      model: vehicle.model,
      trims: vehicle.trims ? vehicle.trims.join(', ') : ''
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({ brand: '', model: '', trims: '' })
  }

  const startAdd = () => {
    setIsAdding(true)
    setAddForm({ brand: '', model: '', trims: '' })
  }

  const cancelAdd = () => {
    setIsAdding(false)
    setAddForm({ brand: '', model: '', trims: '' })
  }

  const getFilteredVehicles = () => {
    if (!searchQuery) return vehicles

    const query = searchQuery.toLowerCase()
    return vehicles.filter(v =>
      v.brand.toLowerCase().includes(query) ||
      v.model.toLowerCase().includes(query) ||
      (v.trims && v.trims.some(t => t.toLowerCase().includes(query)))
    )
  }

  const filteredVehicles = getFilteredVehicles()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        <span className="text-white/60 ml-3">Loading vehicle list...</span>
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
            <Car className="w-5 h-5 text-red-400" />
            Vehicle List Management
          </h2>
          <p className="text-sm text-white/40">Manage vehicle brands, models, and trims</p>
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
            onClick={startAdd}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-sm font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-red-500/25"
          >
            <Plus className="w-4 h-4" />
            Add New
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-red-500/20 transition-all">
          <p className="text-[10px] text-white/40">Total Entries</p>
          <p className="text-lg font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-blue-500/20 transition-all">
          <p className="text-[10px] text-white/40">Brands</p>
          <p className="text-lg font-bold text-blue-400">{stats.brands}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-green-500/20 transition-all">
          <p className="text-[10px] text-white/40">Models</p>
          <p className="text-lg font-bold text-green-400">{stats.models}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-purple-500/20 transition-all">
          <p className="text-[10px] text-white/40">Total Trims</p>
          <p className="text-lg font-bold text-purple-400">{stats.totalTrims}</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by brand, model, or trim..."
            className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-white/5 rounded-lg p-0.5 border border-white/5 flex-shrink-0">
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'list' 
                ? 'bg-red-500/20 text-red-400' 
                : 'text-white/40 hover:text-white/60'
            }`}
            title="List view"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'grid' 
                ? 'bg-red-500/20 text-red-400' 
                : 'text-white/40 hover:text-white/60'
            }`}
            title="Grid view"
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="bg-gradient-to-br from-red-500/10 via-red-600/5 to-transparent rounded-xl p-4 border border-red-500/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-red-400" />
              Add New Vehicle
            </h3>
            <button
              onClick={cancelAdd}
              className="text-white/40 hover:text-white/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-medium text-white/40 mb-1">Brand *</label>
              <input
                type="text"
                value={addForm.brand}
                onChange={(e) => setAddForm(prev => ({ ...prev, brand: e.target.value }))}
                placeholder="e.g. Mercedes-Benz"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-white/40 mb-1">Model *</label>
              <input
                type="text"
                value={addForm.model}
                onChange={(e) => setAddForm(prev => ({ ...prev, model: e.target.value }))}
                placeholder="e.g. C-Class"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-white/40 mb-1">Trims (comma separated)</label>
              <input
                type="text"
                value={addForm.trims}
                onChange={(e) => setAddForm(prev => ({ ...prev, trims: e.target.value }))}
                placeholder="e.g. C180, C200, C300"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleAdd}
              disabled={actionLoading === 0}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-sm font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
            >
              {actionLoading === 0 ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save
            </button>
            <button
              onClick={cancelAdd}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium text-white/60 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Vehicles List */}
      {filteredVehicles.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-xl border border-white/5">
          <Car className="w-12 h-12 text-white/20 mx-auto mb-2" />
          <p className="text-white/40 text-sm">No vehicles found</p>
          <p className="text-white/20 text-xs mt-1">
            {searchQuery ? 'Try adjusting your search' : 'Click "Add New" to create your first entry'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        // Grid View
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredVehicles.map((vehicle) => {
            const isExpanded = expandedId === vehicle.id
            const isEditing = editingId === vehicle.id
            const isLoading = actionLoading === vehicle.id

            return (
              <div
                key={vehicle.id}
                className="bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all overflow-hidden group"
              >
                <div className="p-3">
                  {isEditing ? (
                    // Edit Mode
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editForm.brand}
                        onChange={(e) => setEditForm(prev => ({ ...prev, brand: e.target.value }))}
                        placeholder="Brand"
                        className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-red-500/50"
                      />
                      <input
                        type="text"
                        value={editForm.model}
                        onChange={(e) => setEditForm(prev => ({ ...prev, model: e.target.value }))}
                        placeholder="Model"
                        className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-red-500/50"
                      />
                      <input
                        type="text"
                        value={editForm.trims}
                        onChange={(e) => setEditForm(prev => ({ ...prev, trims: e.target.value }))}
                        placeholder="Trims (comma separated)"
                        className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-red-500/50"
                      />
                      <div className="flex gap-1.5 mt-2">
                        <button
                          onClick={() => handleUpdate(vehicle.id)}
                          disabled={isLoading}
                          className="flex-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 rounded-lg text-xs font-medium text-white transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium text-white/60 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-white truncate">
                            {vehicle.brand}
                          </h3>
                          <p className="text-xs text-white/60">{vehicle.model}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Hash className="w-2.5 h-2.5 text-white/20" />
                            <span className="text-[10px] text-white/30">
                              {vehicle.trims ? vehicle.trims.length : 0} trims
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEdit(vehicle)}
                            className="p-1 rounded-lg text-white/30 hover:bg-white/10 hover:text-white/60 transition-all"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(vehicle.id)}
                            disabled={isLoading}
                            className="p-1 rounded-lg text-white/20 hover:bg-red-500/10 hover:text-red-400 transition-all disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Trims */}
                      {vehicle.trims && vehicle.trims.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-white/5">
                          <div className="flex flex-wrap gap-1">
                            {vehicle.trims.slice(0, 6).map((trim, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 bg-white/5 rounded text-[8px] text-white/40 font-mono"
                              >
                                {trim}
                              </span>
                            ))}
                            {vehicle.trims.length > 6 && (
                              <span className="px-1.5 py-0.5 rounded text-[8px] text-white/20">
                                +{vehicle.trims.length - 6}
                              </span>
                            )}
                          </div>
                          {vehicle.trims.length > 6 && (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : vehicle.id)}
                              className="text-[8px] text-red-400/60 hover:text-red-400 mt-1 transition-colors"
                            >
                              {isExpanded ? 'Show less' : `Show all ${vehicle.trims.length} trims`}
                            </button>
                          )}
                          {isExpanded && vehicle.trims.length > 6 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {vehicle.trims.map((trim, idx) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.5 bg-white/5 rounded text-[8px] text-white/40 font-mono"
                                >
                                  {trim}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        // List View
        <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-3 p-3 border-b border-white/5 text-[10px] text-white/40 font-medium">
            <div className="col-span-4 sm:col-span-3">Brand</div>
            <div className="col-span-4 sm:col-span-3">Model</div>
            <div className="col-span-3 sm:col-span-4">Trims</div>
            <div className="col-span-1 sm:col-span-2 text-right">Actions</div>
          </div>

          {filteredVehicles.map((vehicle) => {
            const isEditing = editingId === vehicle.id
            const isLoading = actionLoading === vehicle.id

            return (
              <div
                key={vehicle.id}
                className="grid grid-cols-12 gap-3 p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors items-center"
              >
                {isEditing ? (
                  // Edit Mode - Full row
                  <>
                    <div className="col-span-4 sm:col-span-3">
                      <input
                        type="text"
                        value={editForm.brand}
                        onChange={(e) => setEditForm(prev => ({ ...prev, brand: e.target.value }))}
                        className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-xs focus:outline-none focus:border-red-500/50"
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-3">
                      <input
                        type="text"
                        value={editForm.model}
                        onChange={(e) => setEditForm(prev => ({ ...prev, model: e.target.value }))}
                        className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-xs focus:outline-none focus:border-red-500/50"
                      />
                    </div>
                    <div className="col-span-3 sm:col-span-4">
                      <input
                        type="text"
                        value={editForm.trims}
                        onChange={(e) => setEditForm(prev => ({ ...prev, trims: e.target.value }))}
                        placeholder="C180, C200, C300"
                        className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-xs focus:outline-none focus:border-red-500/50"
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-2 flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleUpdate(vehicle.id)}
                        disabled={isLoading}
                        className="p-1 bg-red-500 hover:bg-red-600 rounded text-white transition-all disabled:opacity-50"
                      >
                        {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1 bg-white/10 hover:bg-white/20 rounded text-white/60 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                ) : (
                  // View Mode
                  <>
                    <div className="col-span-4 sm:col-span-3">
                      <p className="text-sm font-medium text-white truncate">{vehicle.brand}</p>
                    </div>
                    <div className="col-span-4 sm:col-span-3">
                      <p className="text-sm text-white/80 truncate">{vehicle.model}</p>
                    </div>
                    <div className="col-span-3 sm:col-span-4">
                      <div className="flex flex-wrap gap-1">
                        {vehicle.trims && vehicle.trims.length > 0 ? (
                          vehicle.trims.slice(0, 4).map((trim, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 bg-white/5 rounded text-[8px] text-white/40 font-mono"
                            >
                              {trim}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-white/20">No trims</span>
                        )}
                        {vehicle.trims && vehicle.trims.length > 4 && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] text-white/20">
                            +{vehicle.trims.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="col-span-1 sm:col-span-2 flex items-center justify-end gap-1">
                      <button
                        onClick={() => startEdit(vehicle)}
                        className="p-1 rounded text-white/30 hover:bg-white/10 hover:text-white/60 transition-all"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(vehicle.id)}
                        disabled={isLoading}
                        className="p-1 rounded text-white/20 hover:bg-red-500/10 hover:text-red-400 transition-all disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}