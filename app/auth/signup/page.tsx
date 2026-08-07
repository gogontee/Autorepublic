'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, User, MapPin, Globe, Check, MailCheck, ChevronDown, Building } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'

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

export default function SignupPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])
  const [states, setStates] = useState<string[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [selectedLga, setSelectedLga] = useState<string | null>(null)
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false)
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false)
  const [stateSearchTerm, setStateSearchTerm] = useState('')
  const [citySearchTerm, setCitySearchTerm] = useState('')
  const [isNigeria, setIsNigeria] = useState(true)
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    company: '',
    email: '',
    city: '',
    state: '',
    country: 'Nigeria',
    lga: '',
    password: '',
    confirmPassword: '',
  })

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

  // Handle country change
  const handleCountryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, country: value, state: '', city: '', lga: '' }))
    setSelectedLga(null)
    setCities([])
    setIsNigeria(value.toLowerCase() === 'nigeria')
    setStateSearchTerm('')
    setCitySearchTerm('')
    setIsStateDropdownOpen(false)
    setIsCityDropdownOpen(false)
  }

  // Handle state selection
  const handleStateSelect = (state: string) => {
    setFormData(prev => ({ ...prev, state, city: '', lga: '' }))
    setSelectedLga(null)
    setCities([])
    setStateSearchTerm('')
    setIsStateDropdownOpen(false)
    setCitySearchTerm('')
    
    // Find cities for the selected state
    const location = locations.find(loc => loc.state === state)
    if (location) {
      setCities(location.cities)
    }
  }

  // Handle city selection
  const handleCitySelect = (city: City) => {
    setFormData(prev => ({ ...prev, city: city.name, lga: city.lga }))
    setSelectedLga(city.lga)
    setCitySearchTerm('')
    setIsCityDropdownOpen(false)
  }

  // Filter states based on search
  const filteredStates = states.filter(state => 
    state.toLowerCase().includes(stateSearchTerm.toLowerCase())
  )

  // Filter cities based on search
  const filteredCities = cities.filter(city => 
    city.name.toLowerCase().includes(citySearchTerm.toLowerCase())
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === 'country') {
      handleCountryChange(e as React.ChangeEvent<HTMLInputElement>)
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    // Validate location if Nigeria
    if (isNigeria && !formData.state) {
      setError('Please select a state')
      setLoading(false)
      return
    }

    if (isNigeria && !formData.city) {
      setError('Please select a city')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            gender: formData.gender,
            company: formData.company || null, // Add company field (optional)
            city: formData.city,
            state: formData.state,
            country: formData.country,
            lga: isNigeria ? formData.lga : null,
            full_name: `${formData.firstName} ${formData.lastName}`,
          },
          emailRedirectTo: `${window.location.origin}/auth/login`,
        },
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      if (data.user) {
        setShowConfirmation(true)
        setLoading(false)
      }
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  const handleGoToLogin = () => {
    router.push('/auth/login?success=Please check your email to verify your account')
  }

  const handleResendEmail = async () => {
    setShowConfirmation(false)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/login`,
        },
      })
      if (error) {
        setError(error.message)
      }
    } catch (err) {
      // Handle error
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="pt-14 md:pt-16 pb-24 md:pb-6">
        <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Image
                  src="/autorepublic.png"
                  alt="Auto Republic"
                  width={48}
                  height={48}
                  className="w-12 h-12 object-contain"
                />
              </div>
              <h1 className="text-2xl font-bold text-white">
                Create Account
              </h1>
              <p className="text-sm text-white/40 mt-1">
                Join Auto Republic and start your journey
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Form - Hidden when confirmation is shown */}
            {!showConfirmation && (
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* First & Last Name */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors appearance-none"
                  >
                    <option value="" className="bg-black">Select gender</option>
                    <option value="male" className="bg-black">Male</option>
                    <option value="female" className="bg-black">Female</option>
                    <option value="other" className="bg-black">Other</option>
                    <option value="prefer-not" className="bg-black">Prefer not to say</option>
                  </select>
                </div>

                {/* Company Name - Optional */}
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1">
                    Company Name <span className="text-white/30">(optional)</span>
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                      placeholder="Your company name (optional)"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                {/* Current Location Section */}
                <div className="bg-white/5 rounded-xl border border-white/5 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-medium text-white/60">Current Location</span>
                  </div>

                  {/* Country */}
                  <div className="mb-2">
                    <label className="block text-[10px] font-medium text-white/40 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                      placeholder="Enter country"
                    />
                  </div>

                  {/* State/Region - Dropdown for Nigeria, Input for others */}
                  <div className="mb-2">
                    <label className="block text-[10px] font-medium text-white/40 mb-1">
                      {isNigeria ? 'State' : 'State/Region'}
                    </label>
                    {isNigeria ? (
                      <div className="relative">
                        <div
                          onClick={() => setIsStateDropdownOpen(!isStateDropdownOpen)}
                          className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm cursor-pointer flex items-center justify-between focus:outline-none focus:border-red-500/50 transition-colors"
                        >
                          <span className={formData.state ? 'text-white' : 'text-white/30'}>
                            {formData.state || 'Select state'}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${isStateDropdownOpen ? 'rotate-180' : ''}`} />
                        </div>
                        
                        {isStateDropdownOpen && (
                          <div className="absolute z-10 w-full mt-1 bg-black/95 border border-white/10 rounded-lg shadow-2xl max-h-48 overflow-y-auto">
                            <div className="p-2">
                              <input
                                type="text"
                                value={stateSearchTerm}
                                onChange={(e) => setStateSearchTerm(e.target.value)}
                                placeholder="Search states..."
                                className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-red-500/50"
                              />
                            </div>
                            {filteredStates.length === 0 ? (
                              <div className="px-3 py-2 text-xs text-white/40">No states found</div>
                            ) : (
                              filteredStates.map((state) => (
                                <div
                                  key={state}
                                  onClick={() => handleStateSelect(state)}
                                  className="px-3 py-1.5 text-sm text-white/80 hover:bg-white/5 cursor-pointer transition-colors"
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
                        className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                        placeholder="Enter state/region"
                      />
                    )}
                  </div>

                  {/* City - Dropdown for Nigeria, Input for others */}
                  <div>
                    <label className="block text-[10px] font-medium text-white/40 mb-1">
                      City
                    </label>
                    {isNigeria ? (
                      <div className="relative">
                        <div
                          onClick={() => {
                            if (formData.state) {
                              setIsCityDropdownOpen(!isCityDropdownOpen)
                            }
                          }}
                          className={`w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm cursor-pointer flex items-center justify-between focus:outline-none focus:border-red-500/50 transition-colors ${
                            !formData.state ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <span className={formData.city ? 'text-white' : 'text-white/30'}>
                            {formData.city || (formData.state ? 'Select city' : 'Select state first')}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${isCityDropdownOpen ? 'rotate-180' : ''}`} />
                        </div>
                        
                        {isCityDropdownOpen && formData.state && (
                          <div className="absolute z-10 w-full mt-1 bg-black/95 border border-white/10 rounded-lg shadow-2xl max-h-48 overflow-y-auto">
                            <div className="p-2">
                              <input
                                type="text"
                                value={citySearchTerm}
                                onChange={(e) => setCitySearchTerm(e.target.value)}
                                placeholder="Search cities..."
                                className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-red-500/50"
                              />
                            </div>
                            {filteredCities.length === 0 ? (
                              <div className="px-3 py-2 text-xs text-white/40">No cities found</div>
                            ) : (
                              filteredCities.map((city) => (
                                <div
                                  key={city.name}
                                  onClick={() => handleCitySelect(city)}
                                  className="px-3 py-1.5 text-sm text-white/80 hover:bg-white/5 cursor-pointer transition-colors"
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
                        className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                        placeholder="Enter city"
                      />
                    )}
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={8}
                      className="w-full pl-10 pr-10 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-10 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Terms & Conditions */}
                <div className="flex items-start gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setAcceptTerms(!acceptTerms)}
                    className={`flex-shrink-0 w-4 h-4 mt-0.5 rounded border transition-colors flex items-center justify-center ${
                      acceptTerms 
                        ? 'bg-red-500 border-red-500' 
                        : 'border-white/30 hover:border-white/50'
                    }`}
                  >
                    {acceptTerms && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <p className="text-xs text-white/60 leading-relaxed">
                    I agree to the{' '}
                    <Link href="#" className="text-red-500 hover:text-red-400 transition-colors">
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link href="#" className="text-red-500 hover:text-red-400 transition-colors">
                      Privacy Policy
                    </Link>
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!acceptTerms || loading}
                  className={`w-full py-2.5 rounded-xl font-medium text-white transition-all ${
                    acceptTerms && !loading
                      ? 'bg-red-500 hover:bg-red-600 hover:scale-[1.02] active:scale-[0.98]' 
                      : 'bg-white/10 text-white/40 cursor-not-allowed'
                  }`}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
            )}

            {/* Login Link - Hidden when confirmation is shown */}
            {!showConfirmation && (
              <p className="text-center text-sm text-white/40 mt-4">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-red-500 hover:text-red-400 font-medium transition-colors">
                  Login
                </Link>
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Confirmation Popup Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 max-w-md w-full border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <MailCheck className="w-10 h-10 text-green-400" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">
                Verify Your Email
              </h2>
              
              <p className="text-sm text-white/60 mb-2">
                We've sent a verification link to
              </p>
              <p className="text-sm font-medium text-white mb-4">
                {formData.email}
              </p>
              
              <div className="bg-white/5 rounded-xl p-4 mb-6">
                <p className="text-xs text-white/40">
                  Please check your email and click the verification link to activate your account.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleGoToLogin}
                  className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Go to Login
                </button>
                <button
                  onClick={handleResendEmail}
                  className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium text-white/60 transition-all hover:text-white"
                >
                  Resend Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}