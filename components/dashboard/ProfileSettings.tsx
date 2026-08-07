'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  User, 
  Mail, 
  MapPin, 
  Globe, 
  Camera, 
  Save,
  Phone,
  AlertCircle,
  CheckCircle,
  X,
  Upload,
  Loader2,
  ChevronDown,
  Home,
  Sparkles,
  Edit2,
  Shield
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'

interface ProfileSettingsProps {
  userData?: {
    user: any
    profile: any
    session: any
  }
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

export default function ProfileSettings({ userData }: ProfileSettingsProps) {
  const { user, profile } = userData || {}
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Location state
  const [locations, setLocations] = useState<Location[]>([])
  const [states, setStates] = useState<string[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false)
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false)
  const [stateSearchTerm, setStateSearchTerm] = useState('')
  const [citySearchTerm, setCitySearchTerm] = useState('')
  const [isNigeria, setIsNigeria] = useState(true)
  const [hasLoadedCities, setHasLoadedCities] = useState(false)

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

  // Initialize form with user data
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
      setIsNigeria(profile.country?.toLowerCase() === 'nigeria')
      
      // If user has a state, load cities for it
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

  // Fetch locations on mount
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

  // Handle state selection
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

  // Handle city selection
  const handleCitySelect = (city: City) => {
    setFormData(prev => ({ ...prev, city: city.name, lga: city.lga }))
    setCitySearchTerm('')
    setIsCityDropdownOpen(false)
  }

  // Handle country change
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

  // Handle opening city dropdown - check if state exists
  const handleCityDropdownOpen = () => {
    if (!isEditing) return
    
    // If state exists, load cities if not already loaded
    if (formData.state) {
      // If cities haven't been loaded yet or are empty, try to load them
      if (!hasLoadedCities && formData.state) {
        const location = locations.find(loc => loc.state === formData.state)
        if (location) {
          setCities(location.cities)
          setHasLoadedCities(true)
        }
      }
      // Only open if there are cities available
      if (cities.length > 0) {
        setIsCityDropdownOpen(!isCityDropdownOpen)
      }
    }
  }

  // Filter states based on search
  const filteredStates = states.filter(state => 
    state.toLowerCase().includes(stateSearchTerm.toLowerCase())
  )

  // Filter cities based on search
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

  // Handle avatar upload
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
      setSuccessMessage('Avatar updated successfully!')
      
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

  // Handle remove avatar
  const handleRemoveAvatar = async () => {
    if (!avatarUrl) return

    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const urlParts = avatarUrl.split('/')
      const avatarIndex = urlParts.indexOf('avatar')
      
      if (avatarIndex !== -1) {
        const filePath = urlParts.slice(avatarIndex + 2).join('/')
        if (filePath) {
          await supabase.storage.from('avatar').remove([filePath])
        }
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user?.id)

      if (updateError) {
        console.error('Update error:', updateError)
        setErrorMessage('Failed to remove avatar. Please try again.')
        setLoading(false)
        return
      }

      setAvatarUrl(null)
      setSuccessMessage('Avatar removed successfully!')
      setTimeout(() => window.location.reload(), 1500)

    } catch (err) {
      console.error('Error:', err)
      setErrorMessage('An unexpected error occurred')
    } finally {
      setLoading(false)
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

      // Remove empty fields (optional)
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === '' || updateData[key] === null || updateData[key] === undefined) {
          delete updateData[key]
        }
      })

      console.log('Updating profile with:', updateData)

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

  const displayName = formData.firstName || user?.email?.split('@')[0] || 'User'

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-red-400" />
            Profile Settings
          </h1>
          <p className="text-[10px] text-white/40 mt-0.5">Manage your account information</p>
        </div>
        <button
          onClick={() => {
            setIsEditing(!isEditing)
            setErrorMessage('')
            setSuccessMessage('')
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all hover:scale-105 active:scale-95 ${
            isEditing 
              ? 'bg-white/10 text-white/60 hover:bg-white/15' 
              : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25'
          }`}
        >
          {isEditing ? (
            <>
              <X className="w-3 h-3" />
              Cancel
            </>
          ) : (
            <>
              <Edit2 className="w-3 h-3" />
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
            className="mb-3 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-[10px] flex items-center gap-2"
          >
            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {successMessage}
          </motion.div>
        )}

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-3 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-[10px] flex items-center gap-2"
          >
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {errorMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Picture */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500/30 to-red-600/10 flex items-center justify-center overflow-hidden border-2 border-white/10 ring-2 ring-red-500/20 ring-offset-2 ring-offset-black">
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
            className="absolute -bottom-1 -right-1 p-1.5 bg-red-500 hover:bg-red-600 rounded-full transition-all hover:scale-110 active:scale-95 shadow-lg shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-black"
            title="Upload new avatar"
          >
            {uploadingAvatar ? (
              <Loader2 className="w-3 h-3 text-white animate-spin" />
            ) : (
              <Camera className="w-3 h-3 text-white" />
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
        
        <h2 className="text-sm font-semibold text-white mt-3">
          {formData.firstName || 'User'} {formData.lastName || ''}
        </h2>
        <p className="text-[10px] text-white/40">{formData.email}</p>
        <p className="text-[8px] text-white/20 mt-1 flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-amber-400/50" />
          Tap camera to change avatar
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Row: First Name & Last Name */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[9px] font-medium text-white/40 mb-1">First Name</label>
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30" />
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full pl-7 pr-2.5 py-1.5 bg-white/5 border rounded-lg text-white text-xs focus:outline-none focus:border-red-500/50 transition-all ${
                  isEditing ? 'border-white/10 hover:border-white/20' : 'border-transparent opacity-50'
                } ${!isEditing ? 'cursor-default' : ''}`}
                placeholder="First Name"
              />
            </div>
          </div>
          <div>
            <label className="block text-[9px] font-medium text-white/40 mb-1">Last Name</label>
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30" />
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full pl-7 pr-2.5 py-1.5 bg-white/5 border rounded-lg text-white text-xs focus:outline-none focus:border-red-500/50 transition-all ${
                  isEditing ? 'border-white/10 hover:border-white/20' : 'border-transparent opacity-50'
                } ${!isEditing ? 'cursor-default' : ''}`}
                placeholder="Last Name"
              />
            </div>
          </div>
        </div>

        {/* Row: Email & Phone */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[9px] font-medium text-white/40 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30" />
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                className="w-full pl-7 pr-2.5 py-1.5 bg-white/5 border border-transparent rounded-lg text-white text-xs cursor-default opacity-40"
              />
            </div>
          </div>
          <div>
            <label className="block text-[9px] font-medium text-white/40 mb-1">Phone</label>
            <div className="relative">
              <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30" />
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Add phone number"
                className={`w-full pl-7 pr-2.5 py-1.5 bg-white/5 border rounded-lg text-white text-xs focus:outline-none focus:border-red-500/50 transition-all ${
                  isEditing ? 'border-white/10 hover:border-white/20' : 'border-transparent opacity-50'
                } ${!isEditing ? 'cursor-default' : ''}`}
              />
            </div>
          </div>
        </div>

        {/* Location Section */}
        <div className="bg-white/5 rounded-lg border border-white/5 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <MapPin className="w-3 h-3 text-red-400" />
            <span className="text-[9px] font-medium text-white/60">Location</span>
          </div>

          <div className="space-y-2">
            {/* Country */}
            <div>
              <label className="block text-[8px] font-medium text-white/30 mb-0.5">Country</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-2.5 py-1 bg-white/5 border rounded-lg text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors ${
                  isEditing ? 'border-white/10' : 'border-transparent opacity-50 cursor-default'
                }`}
                placeholder="Add country"
              />
            </div>

            {/* State & City Row */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[8px] font-medium text-white/30 mb-0.5">
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
                      className={`w-full px-2.5 py-1 bg-white/5 border rounded-lg text-white text-xs cursor-pointer flex items-center justify-between focus:outline-none focus:border-red-500/50 transition-colors ${
                        isEditing ? 'border-white/10' : 'border-transparent opacity-50 cursor-default'
                      }`}
                    >
                      <span className={formData.state ? 'text-white' : 'text-white/30'}>
                        {formData.state || (isEditing ? 'Select state' : 'No state')}
                      </span>
                      {isEditing && (
                        <ChevronDown className={`w-3 h-3 text-white/30 transition-transform ${isStateDropdownOpen ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                    
                    {isStateDropdownOpen && isEditing && (
                      <div className="absolute z-10 w-full mt-0.5 bg-black/95 border border-white/10 rounded-lg shadow-2xl max-h-36 overflow-y-auto">
                        <div className="p-1.5">
                          <input
                            type="text"
                            value={stateSearchTerm}
                            onChange={(e) => setStateSearchTerm(e.target.value)}
                            placeholder="Search..."
                            className="w-full px-2 py-0.5 bg-white/5 border border-white/10 rounded-lg text-white text-[10px] placeholder:text-white/30 focus:outline-none focus:border-red-500/50"
                          />
                        </div>
                        {filteredStates.length === 0 ? (
                          <div className="px-2.5 py-1 text-[10px] text-white/40">No states found</div>
                        ) : (
                          filteredStates.map((state) => (
                            <div
                              key={state}
                              onClick={() => handleStateSelect(state)}
                              className="px-2.5 py-1 text-[10px] text-white/80 hover:bg-white/5 cursor-pointer transition-colors"
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
                    className={`w-full px-2.5 py-1 bg-white/5 border rounded-lg text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors ${
                      isEditing ? 'border-white/10' : 'border-transparent opacity-50 cursor-default'
                    }`}
                  />
                )}
              </div>

              <div>
                <label className="block text-[8px] font-medium text-white/30 mb-0.5">City</label>
                {isNigeria ? (
                  <div className="relative">
                    <div
                      onClick={handleCityDropdownOpen}
                      className={`w-full px-2.5 py-1 bg-white/5 border rounded-lg text-white text-xs cursor-pointer flex items-center justify-between focus:outline-none focus:border-red-500/50 transition-colors ${
                        isEditing ? 'border-white/10' : 'border-transparent opacity-50 cursor-default'
                      } ${(!formData.state || !isEditing) ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      <span className={formData.city ? 'text-white' : 'text-white/30'}>
                        {formData.city 
                          ? formData.city 
                          : formData.state 
                            ? (isEditing ? 'Select city' : 'No city') 
                            : 'Select state first'}
                      </span>
                      {isEditing && formData.state && cities.length > 0 && (
                        <ChevronDown className={`w-3 h-3 text-white/30 transition-transform ${isCityDropdownOpen ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                    
                    {isCityDropdownOpen && isEditing && formData.state && cities.length > 0 && (
                      <div className="absolute z-10 w-full mt-0.5 bg-black/95 border border-white/10 rounded-lg shadow-2xl max-h-36 overflow-y-auto">
                        <div className="p-1.5">
                          <input
                            type="text"
                            value={citySearchTerm}
                            onChange={(e) => setCitySearchTerm(e.target.value)}
                            placeholder="Search..."
                            className="w-full px-2 py-0.5 bg-white/5 border border-white/10 rounded-lg text-white text-[10px] placeholder:text-white/30 focus:outline-none focus:border-red-500/50"
                          />
                        </div>
                        {filteredCities.length === 0 ? (
                          <div className="px-2.5 py-1 text-[10px] text-white/40">No cities found</div>
                        ) : (
                          filteredCities.map((city) => (
                            <div
                              key={city.name}
                              onClick={() => handleCitySelect(city)}
                              className="px-2.5 py-1 text-[10px] text-white/80 hover:bg-white/5 cursor-pointer transition-colors"
                            >
                              {city.name}
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
                    className={`w-full px-2.5 py-1 bg-white/5 border rounded-lg text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors ${
                      isEditing ? 'border-white/10' : 'border-transparent opacity-50 cursor-default'
                    }`}
                  />
                )}
              </div>
            </div>

            {/* LGA - Auto-populated for Nigeria */}
            {isNigeria && (
              <div>
                <label className="block text-[8px] font-medium text-white/30 mb-0.5">
                  LGA <span className="text-white/20">(Auto)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="lga"
                    value={formData.lga}
                    disabled
                    className="w-full px-2.5 py-1 bg-white/5 border border-transparent rounded-lg text-white text-[10px] opacity-40 cursor-default"
                    placeholder={formData.lga || 'Select city to auto-populate'}
                  />
                </div>
              </div>
            )}

            {/* Full Address */}
            <div>
              <label className="block text-[8px] font-medium text-white/30 mb-0.5">
                Full Address <span className="text-white/20">(Optional)</span>
              </label>
              <div className="relative">
                <Home className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30" />
                <input
                  type="text"
                  name="fullAddress"
                  value={formData.fullAddress}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Add full address"
                  className={`w-full pl-7 pr-2.5 py-1 bg-white/5 border rounded-lg text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors ${
                    isEditing ? 'border-white/10' : 'border-transparent opacity-50 cursor-default'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-[9px] font-medium text-white/40 mb-1">
            Bio <span className="text-white/20">(Optional)</span>
          </label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            disabled={!isEditing}
            rows={2}
            placeholder="Tell us about yourself..."
            className={`w-full px-3 py-1.5 bg-white/5 border rounded-lg text-white text-xs focus:outline-none focus:border-red-500/50 transition-all resize-none ${
              isEditing ? 'border-white/10 hover:border-white/20' : 'border-transparent opacity-50'
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
              className="w-full py-2 bg-red-500 hover:bg-red-600 rounded-lg font-medium text-white text-xs transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/25"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-3 h-3" />
                  Save Changes
                </>
              )}
            </motion.button>
          )}
        </AnimatePresence>

        {/* Privacy Notice */}
        <div className="mt-4 pt-3 border-t border-white/5">
          <div className="flex items-start gap-2">
            <Shield className="w-3.5 h-3.5 text-emerald-400/60 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[8px] text-white/30 leading-relaxed">
                <span className="text-white/40 font-medium">Your privacy matters.</span> Your information is protected and will only be used to enhance your platform experience.
              </p>
              <p className="text-[7px] text-white/20 leading-relaxed mt-0.5">
                <span className="text-white/30">Publicly visible:</span> Profile image, First name, Dealer's number (where applicable), State & City (where applicable)
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}