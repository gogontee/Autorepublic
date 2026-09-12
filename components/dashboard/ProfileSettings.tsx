'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  User, 
  Mail, 
  MapPin, 
  Camera, 
  Save,
  Phone,
  AlertCircle,
  CheckCircle,
  X,
  Loader2,
  ChevronDown,
  Home,
  Sparkles,
  Edit2,
  Shield,
  MessageCircle,
  ShieldCheck,
  Clock
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import Verify from './Verify'

interface ProfileSettingsProps {
  userData?: {
    user: any
    profile: any
    session: any
  }
  onProfileUpdate?: () => void
}

interface City {
  name: string
  slug: string
  lga: string
}

interface Location {
  id: number
  state: string
  cities: City[]
}

const PROFILE_TOUR_KEY = 'profile_edit_tour_views'
const PHONE_HINT_KEY = 'profile_phone_hint_seen'

export default function ProfileSettings({ userData, onProfileUpdate }: ProfileSettingsProps) {
  const { user, profile } = userData || {}
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [locations, setLocations] = useState<Location[]>([])
  const [states, setStates] = useState<string[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false)
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false)
  const [stateSearchTerm, setStateSearchTerm] = useState('')
  const [citySearchTerm, setCitySearchTerm] = useState('')
  const [isNigeria, setIsNigeria] = useState(true)
  const [hasLoadedCities, setHasLoadedCities] = useState(false)

  const [showEditTourPopup, setShowEditTourPopup] = useState(false)
  const [showPhoneHint, setShowPhoneHint] = useState(false)

  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [verifyStatus, setVerifyStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none')
  const [verifyLoading, setVerifyLoading] = useState(true)

  const [liveProfile, setLiveProfile] = useState<any>(profile || null)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    country: '',
    lga: '',
    fullAddress: '',
    bio: '',
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const views = parseInt(localStorage.getItem(PROFILE_TOUR_KEY) || '0', 10)
    if (views < 2) {
      const timer = setTimeout(() => setShowEditTourPopup(true), 800)
      localStorage.setItem(PROFILE_TOUR_KEY, String(views + 1))
      return () => clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (!user?.id) {
      setVerifyLoading(false)
      return
    }
    const fetchVerifyStatus = async () => {
      try {
        if (liveProfile?.is_verified === true) {
          setVerifyStatus('approved')
          setVerifyLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('verify')
          .select('status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (!error && data) {
          setVerifyStatus(data.status as any)
        } else {
          setVerifyStatus('none')
        }
      } catch (err) {
        console.error('Error fetching verify status:', err)
        setVerifyStatus('none')
      } finally {
        setVerifyLoading(false)
      }
    }
    fetchVerifyStatus()
  }, [user?.id, liveProfile?.is_verified])

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        email: user?.email || '',
        phone: profile.phone || '',
        city: profile.city || '',
        state: profile.state || '',
        country: profile.country || '',
        lga: profile.lga || '',
        fullAddress: profile.full_address || '',
        bio: profile.bio || '',
      })
      setAvatarUrl(profile.avatar_url || null)
      setLiveProfile(profile)
      setIsNigeria(profile.country?.toLowerCase() === 'nigeria')
      
      if (profile.state) {
        const location = locations.find(loc => loc.state === profile.state)
        if (location) {
          setCities(location.cities)
          setHasLoadedCities(true)
        }
      }
    } else if (user) {
      setFormData(prev => ({
        ...prev,
        email: user.email || '',
        firstName: user.user_metadata?.first_name || '',
        lastName: user.user_metadata?.last_name || '',
      }))
    }
  }, [profile, user, locations])

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data, error } = await supabase
          .from('locations')
          .select('*')
          .order('state', { ascending: true })

        if (error) {
          console.error('Error fetching locations:', error)
          return
        }

        if (data) {
          setLocations(data)
          const stateNames = data.map((loc: Location) => loc.state)
          setStates(stateNames)
        }
      } catch (err) {
        console.error('Error:', err)
      }
    }

    fetchLocations()
  }, [])

  const handlePhoneFocus = () => {
    if (typeof window === 'undefined') return
    const seen = localStorage.getItem(PHONE_HINT_KEY) === 'true'
    if (!seen) {
      setShowPhoneHint(true)
    }
  }

  const dismissPhoneHint = () => {
    setShowPhoneHint(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem(PHONE_HINT_KEY, 'true')
    }
  }

  const handleStateSelect = (state: string) => {
    setFormData(prev => ({ ...prev, state, city: '', lga: '' }))
    setCities([])
    setStateSearchTerm('')
    setIsStateDropdownOpen(false)
    setCitySearchTerm('')
    setHasLoadedCities(false)
    
    const location = locations.find(loc => loc.state === state)
    if (location) {
      setCities(location.cities)
      setHasLoadedCities(true)
    }
  }

  const handleCitySelect = (city: City) => {
    setFormData(prev => ({ ...prev, city: city.name, lga: city.lga }))
    setCitySearchTerm('')
    setIsCityDropdownOpen(false)
  }

  const handleCountryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, country: value, state: '', city: '', lga: '' }))
    setCities([])
    setIsNigeria(value.toLowerCase() === 'nigeria')
    setStateSearchTerm('')
    setCitySearchTerm('')
    setIsStateDropdownOpen(false)
    setIsCityDropdownOpen(false)
    setHasLoadedCities(false)
  }

  const handleCityDropdownOpen = () => {
    if (!isEditing) return
    
    if (formData.state) {
      if (!hasLoadedCities && formData.state) {
        const location = locations.find(loc => loc.state === formData.state)
        if (location) {
          setCities(location.cities)
          setHasLoadedCities(true)
        }
      }
      if (cities.length > 0) {
        setIsCityDropdownOpen(!isCityDropdownOpen)
      }
    }
  }

  const filteredStates = states.filter(state => 
    state.toLowerCase().includes(stateSearchTerm.toLowerCase())
  )

  const filteredCities = cities.filter(city => 
    city.name.toLowerCase().includes(citySearchTerm.toLowerCase())
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name === 'country') {
      handleCountryChange(e as React.ChangeEvent<HTMLInputElement>)
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
    setErrorMessage('')
    setSuccessMessage('')
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size must be less than 5MB')
      return
    }

    setUploadingAvatar(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${user?.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatar')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        setErrorMessage(`Failed to upload avatar: ${uploadError.message}`)
        setUploadingAvatar(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from('avatar')
        .getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl

      const { error: updateError } = await supabase
        .from('users')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user?.id)

      if (updateError) {
        console.error('Update error:', updateError)
        setErrorMessage('Failed to update avatar. Please try again.')
        setUploadingAvatar(false)
        return
      }

      setAvatarUrl(publicUrl)
      setLiveProfile((prev: any) => ({ ...(prev || {}), avatar_url: publicUrl }))
      setSuccessMessage('Avatar updated successfully!')
      if (onProfileUpdate) onProfileUpdate()
      
      setTimeout(() => {
        window.location.reload()
      }, 1500)

    } catch (err) {
      console.error('Error:', err)
      setErrorMessage('An unexpected error occurred')
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const updateData: any = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        full_name: `${formData.firstName} ${formData.lastName}`.trim(),
        phone: formData.phone,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        lga: formData.lga,
        full_address: formData.fullAddress,
        bio: formData.bio,
        updated_at: new Date().toISOString(),
      }

      Object.keys(updateData).forEach(key => {
        if (updateData[key] === '' || updateData[key] === null || updateData[key] === undefined) {
          delete updateData[key]
        }
      })

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('user_id', user?.id)

      if (error) {
        console.error('Error updating profile:', error)
        setErrorMessage(`Failed to update profile: ${error.message}`)
        setLoading(false)
        return
      }

      setLiveProfile((prev: any) => ({ ...(prev || {}), ...updateData }))
      if (onProfileUpdate) onProfileUpdate()

      setSuccessMessage('Profile updated successfully!')
      setIsEditing(false)
      setLoading(false)
      
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err: any) {
      console.error('Error:', err)
      setErrorMessage(err.message || 'An unexpected error occurred')
      setLoading(false)
    }
  }

  const handleVerified = () => {
    setVerifyStatus('pending')
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-white/40">Please log in to view your profile</p>
      </div>
    )
  }

  // ==========================================
  // VERIFY BADGE / BUTTON
  // ==========================================
  const renderVerifyBadge = () => {
    if (verifyLoading) {
      return (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-white/40">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Checking status...
        </div>
      )
    }

    if (verifyStatus === 'approved') {
      return (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          Account Verified
        </div>
      )
    }

    if (verifyStatus === 'pending') {
      return (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-400">
          <Clock className="w-4 h-4" />
          Verification Pending — Under Review
        </div>
      )
    }

    if (verifyStatus === 'rejected') {
      return (
        <motion.button
          onClick={() => setShowVerifyModal(true)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-500 hover:bg-red-600 border border-red-400/40 text-sm font-semibold text-white shadow-lg shadow-red-500/30 transition-colors"
        >
          <AlertCircle className="w-4 h-4" />
          Verification Failed — Tap to Retry
        </motion.button>
      )
    }

    // Not submitted — most important state: make this obvious
    return (
      <div className="flex flex-col items-center gap-2">
        <motion.button
          onClick={() => setShowVerifyModal(true)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          animate={{
            boxShadow: [
              '0 0 0 0 rgba(239, 68, 68, 0.4)',
              '0 0 0 12px rgba(239, 68, 68, 0)',
              '0 0 0 0 rgba(239, 68, 68, 0)',
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeOut',
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-full bg-red-500 hover:bg-red-600 border border-red-400/40 text-sm sm:text-base font-bold text-white shadow-lg shadow-red-500/40 transition-colors"
        >
          <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
          Verify Me to Start Selling
        </motion.button>
        <p className="text-xs text-white/50 text-center max-w-xs">
          Verification is required before you can list vehicles on AutoRepublic.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
            Profile Settings
          </h1>
          <p className="text-sm text-white/40 mt-0.5">Manage your account information</p>
        </div>
        <button
          onClick={() => {
            setIsEditing(!isEditing)
            setErrorMessage('')
            setSuccessMessage('')
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all hover:scale-105 active:scale-95 ${
            isEditing 
              ? 'bg-white/10 text-white/70 hover:bg-white/15' 
              : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25'
          }`}
        >
          {isEditing ? (
            <>
              <X className="w-4 h-4" />
              Cancel
            </>
          ) : (
            <>
              <Edit2 className="w-4 h-4" />
              Edit
            </>
          )}
        </button>
      </div>

      {/* Messages */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            {successMessage}
          </motion.div>
        )}

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {errorMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Picture */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative group">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-red-500/30 to-red-600/10 flex items-center justify-center overflow-hidden border-2 border-white/10 ring-2 ring-red-500/20 ring-offset-2 ring-offset-black">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt="Profile" 
                className="w-full h-full object-cover"
                onError={() => setAvatarUrl(null)}
              />
            ) : (
              <span className="text-3xl font-bold text-red-500">
                {formData.firstName?.charAt(0) || 'U'}{formData.lastName?.charAt(0) || ''}
              </span>
            )}
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute -bottom-1 -right-1 p-2.5 bg-red-500 hover:bg-red-600 rounded-full transition-all hover:scale-110 active:scale-95 shadow-lg shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-black"
            title="Upload new avatar"
          >
            {uploadingAvatar ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Camera className="w-4 h-4 text-white" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
        </div>
        
        <h2 className="text-lg font-semibold text-white mt-4">
          {formData.firstName || 'User'} {formData.lastName || ''}
        </h2>
        <p className="text-sm text-white/40">{formData.email}</p>
        
        {/* Verification badge / button */}
        <div className="mt-4">
          {renderVerifyBadge()}
        </div>

        <p className="text-xs text-white/30 mt-3 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400/50" />
          Tap camera to change avatar
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row: First Name & Last Name */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-white/50 mb-1.5">First Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full pl-10 pr-3 py-2.5 bg-white/5 border rounded-lg text-white text-sm focus:outline-none focus:border-red-500/50 transition-all ${
                  isEditing ? 'border-white/10 hover:border-white/20' : 'border-transparent opacity-60'
                } ${!isEditing ? 'cursor-default' : ''}`}
                placeholder="First Name"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/50 mb-1.5">Last Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full pl-10 pr-3 py-2.5 bg-white/5 border rounded-lg text-white text-sm focus:outline-none focus:border-red-500/50 transition-all ${
                  isEditing ? 'border-white/10 hover:border-white/20' : 'border-transparent opacity-60'
                } ${!isEditing ? 'cursor-default' : ''}`}
                placeholder="Last Name"
              />
            </div>
          </div>
        </div>

        {/* Row: Email & Phone */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-white/50 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-transparent rounded-lg text-white text-sm cursor-default opacity-50"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/50 mb-1.5">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onFocus={handlePhoneFocus}
                disabled={!isEditing}
                placeholder="Add phone number"
                className={`w-full pl-10 pr-3 py-2.5 bg-white/5 border rounded-lg text-white text-sm focus:outline-none focus:border-red-500/50 transition-all ${
                  isEditing ? 'border-white/10 hover:border-white/20' : 'border-transparent opacity-60'
                } ${!isEditing ? 'cursor-default' : ''}`}
              />
            </div>
          </div>
        </div>

        {/* Location Section */}
        <div className="bg-white/5 rounded-lg border border-white/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-white/60">Location</span>
          </div>

          <div className="space-y-3">
            {/* Country */}
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Country</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-3.5 py-2.5 bg-white/5 border rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors ${
                  isEditing ? 'border-white/10' : 'border-transparent opacity-60 cursor-default'
                }`}
                placeholder="Add country"
              />
            </div>

            {/* State & City Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1.5">
                  {isNigeria ? 'State' : 'State/Region'}
                </label>
                {isNigeria ? (
                  <div className="relative">
                    <div
                      onClick={() => {
                        if (isEditing) {
                          setIsStateDropdownOpen(!isStateDropdownOpen)
                        }
                      }}
                      className={`w-full px-3.5 py-2.5 bg-white/5 border rounded-lg text-white text-sm cursor-pointer flex items-center justify-between focus:outline-none focus:border-red-500/50 transition-colors ${
                        isEditing ? 'border-white/10' : 'border-transparent opacity-60 cursor-default'
                      }`}
                    >
                      <span className={formData.state ? 'text-white' : 'text-white/40'}>
                        {formData.state || (isEditing ? 'Select state' : 'No state')}
                      </span>
                      {isEditing && (
                        <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${isStateDropdownOpen ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                    
                    {isStateDropdownOpen && isEditing && (
                      <div className="absolute z-10 w-full mt-1 bg-black/95 border border-white/10 rounded-lg shadow-2xl max-h-52 overflow-y-auto">
                        <div className="p-2">
                          <input
                            type="text"
                            value={stateSearchTerm}
                            onChange={(e) => setStateSearchTerm(e.target.value)}
                            placeholder="Search..."
                            className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-red-500/50"
                          />
                        </div>
                        {filteredStates.length === 0 ? (
                          <div className="px-3 py-2 text-xs text-white/40">No states found</div>
                        ) : (
                          filteredStates.map((state) => (
                            <div
                              key={state}
                              onClick={() => handleStateSelect(state)}
                              className="px-3.5 py-2.5 text-sm text-white/80 hover:bg-white/5 cursor-pointer transition-colors"
                            >
                              {state}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Add state/region"
                    className={`w-full px-3.5 py-2.5 bg-white/5 border rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors ${
                      isEditing ? 'border-white/10' : 'border-transparent opacity-60 cursor-default'
                    }`}
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-white/40 mb-1.5">City</label>
                {isNigeria ? (
                  <div className="relative">
                    <div
                      onClick={handleCityDropdownOpen}
                      className={`w-full px-3.5 py-2.5 bg-white/5 border rounded-lg text-white text-sm cursor-pointer flex items-center justify-between focus:outline-none focus:border-red-500/50 transition-colors ${
                        isEditing ? 'border-white/10' : 'border-transparent opacity-60 cursor-default'
                      } ${(!formData.state || !isEditing) ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      <span className={formData.city ? 'text-white' : 'text-white/40'}>
                        {formData.city 
                          ? formData.city 
                          : formData.state 
                            ? (isEditing ? 'Select city' : 'No city') 
                            : 'Select state first'}
                      </span>
                      {isEditing && formData.state && cities.length > 0 && (
                        <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${isCityDropdownOpen ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                    
                    {isCityDropdownOpen && isEditing && formData.state && cities.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-black/95 border border-white/10 rounded-lg shadow-2xl max-h-52 overflow-y-auto">
                        <div className="p-2">
                          <input
                            type="text"
                            value={citySearchTerm}
                            onChange={(e) => setCitySearchTerm(e.target.value)}
                            placeholder="Search..."
                            className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-red-500/50"
                          />
                        </div>
                        {filteredCities.length === 0 ? (
                          <div className="px-3 py-2 text-xs text-white/40">No cities found</div>
                        ) : (
                          filteredCities.map((city) => (
                            <div
                              key={`${city.slug}-${city.lga}`}
                              onClick={() => handleCitySelect(city)}
                              className="px-3.5 py-2.5 text-sm text-white/80 hover:bg-white/5 cursor-pointer transition-colors flex items-center justify-between gap-2"
                            >
                              <span>{city.name}</span>
                              <span className="text-xs text-white/40">{city.lga}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Add city"
                    className={`w-full px-3.5 py-2.5 bg-white/5 border rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors ${
                      isEditing ? 'border-white/10' : 'border-transparent opacity-60 cursor-default'
                    }`}
                  />
                )}
              </div>
            </div>

            {/* LGA */}
            {isNigeria && (
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1.5">
                  LGA <span className="text-white/20">(Auto)</span>
                </label>
                <input
                  type="text"
                  name="lga"
                  value={formData.lga}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-transparent rounded-lg text-white text-sm opacity-50 cursor-default"
                  placeholder={formData.lga || 'Select city to auto-populate'}
                />
              </div>
            )}

            {/* Full Address */}
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">
                Full Address <span className="text-white/20">(Optional)</span>
              </label>
              <div className="relative">
                <Home className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  name="fullAddress"
                  value={formData.fullAddress}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Add full address"
                  className={`w-full pl-10 pr-3 py-2.5 bg-white/5 border rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors ${
                    isEditing ? 'border-white/10' : 'border-transparent opacity-60 cursor-default'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-white/50 mb-1.5">
            Bio <span className="text-white/20">(Optional)</span>
          </label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            disabled={!isEditing}
            rows={3}
            placeholder="Tell us about yourself..."
            className={`w-full px-3.5 py-3 bg-white/5 border rounded-lg text-white text-sm focus:outline-none focus:border-red-500/50 transition-all resize-none ${
              isEditing ? 'border-white/10 hover:border-white/20' : 'border-transparent opacity-60'
            } ${!isEditing ? 'cursor-default' : ''}`}
          />
        </div>

        {/* Save Button */}
        <AnimatePresence>
          {isEditing && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-red-500 hover:bg-red-600 rounded-lg font-semibold text-white text-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/25"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </motion.button>
          )}
        </AnimatePresence>

        {/* Privacy Notice */}
        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-emerald-400/60 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-white/40 leading-relaxed">
                <span className="text-white/60 font-medium">Your privacy matters.</span> Your information is protected and will only be used to enhance your platform experience.
              </p>
              <p className="text-[11px] text-white/25 leading-relaxed mt-1">
                <span className="text-white/40">Publicly visible:</span> Profile image, First name, Dealer's number (where applicable), State & City (where applicable)
              </p>
            </div>
          </div>
        </div>
      </form>

      {/* EDIT TOUR POPUP */}
      <AnimatePresence>
        {showEditTourPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowEditTourPopup(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative max-w-sm w-full bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-red-500/20 shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowEditTourPopup(false)}
                className="absolute top-3 right-3 p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-white/40" />
              </button>

              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <Edit2 className="w-8 h-8 text-red-400" />
                  </div>
                  <motion.div
                    animate={{ y: [-4, 0, -4] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -top-6 -right-6"
                  >
                    <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/40">
                      <motion.span
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-white text-lg font-bold"
                      >
                        ↗
                      </motion.span>
                    </div>
                  </motion.div>
                </div>
              </div>

              <h3 className="text-lg font-bold text-white text-center mb-2">
                Ready to edit your profile?
              </h3>
              <p className="text-sm text-white/60 text-center leading-relaxed mb-5">
                Tap the <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-500/15 border border-red-500/30 rounded text-red-400 font-medium">
                  <Edit2 className="w-3 h-3" />
                  Edit
                </span> button at the top right to make changes to your profile information.
              </p>

              <button
                onClick={() => setShowEditTourPopup(false)}
                className="w-full py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-red-500/25"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PHONE / WHATSAPP HINT POPUP */}
      <AnimatePresence>
        {showPhoneHint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm"
            onClick={dismissPhoneHint}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative max-w-sm w-full bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-emerald-500/20 shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={dismissPhoneHint}
                className="absolute top-3 right-3 p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-white/40" />
              </button>

              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-emerald-400" />
                </div>
              </div>

              <h3 className="text-lg font-bold text-white text-center mb-2">
                Use an Active WhatsApp Number
              </h3>
              <p className="text-sm text-white/60 text-center leading-relaxed mb-5">
                For faster communication with buyers and sellers, please provide a phone number that's active on <span className="text-emerald-400 font-medium">WhatsApp</span>. This lets you receive inquiries instantly.
              </p>

              <button
                onClick={dismissPhoneHint}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-sm font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-500/25"
              >
                I Understand
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VERIFY MODAL */}
      <Verify
        userData={{ user, profile: liveProfile, session: userData?.session }}
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        onVerified={handleVerified}
      />
    </div>
  )
}