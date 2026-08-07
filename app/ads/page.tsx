'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Upload, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Video,
  Image as ImageIcon,
  Info,
  Shield,
  Clock,
  DollarSign,
  Calendar,
  FileText,
  CreditCard,
  Zap,
  Star,
  Wallet,
  Link as LinkIcon,
  Plus,
  ThumbsUp,
  RotateCcw
} from 'lucide-react'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import { supabase } from '@/lib/supabase/client'
import FundWallet from '@/components/ads/FundWallet'

interface AdData {
  video: File | null
  image: File | null
  text: string
  link: string
  start_time: string
  end_time: string
  videoPreview?: string | null
  imagePreview?: string | null
}

interface Plan {
  id: string
  name: string
  duration: number
  price: number
  description: string
  icon: any
  popular?: boolean
}

const plans: Plan[] = [
  {
    id: '1week',
    name: '7 Days',
    duration: 7,
    price: 100000,
    description: 'Quick promotion',
    icon: Zap,
  },
  {
    id: '1month',
    name: '30 Days',
    duration: 30,
    price: 350000,
    description: 'Best value',
    icon: Calendar,
    popular: true,
  },
  {
    id: '3months',
    name: '90 Days',
    duration: 90,
    price: 800000,
    description: 'Maximum exposure',
    icon: Star,
  },
]

// Local storage keys
const ADS_FORM_STORAGE_KEY = 'ads_form_data'
const ADS_SELECTED_PLAN_KEY = 'ads_selected_plan'
const ADS_MEDIA_STORAGE_KEY = 'ads_media_data'

// Helper function to get the correct start time (24 hours + 60 minutes from now)
const getDefaultStartTime = () => {
  const now = new Date()
  // Add 24 hours + 90 minutes
  const startDate = new Date(now.getTime() + (24 * 60 * 60 * 1000) + (90 * 60 * 1000))
  // Round to next 15 minutes for cleaner look
  const minutes = startDate.getMinutes()
  const roundedMinutes = Math.ceil(minutes / 15) * 15
  startDate.setMinutes(roundedMinutes)
  startDate.setSeconds(0)
  startDate.setMilliseconds(0)
  return startDate.toISOString().slice(0, 16)
}

// Helper to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

// Helper to convert base64 to file
const base64ToFile = (base64: string, filename: string, mimeType: string): File => {
  const byteString = atob(base64.split(',')[1])
  const ab = new ArrayBuffer(byteString.length)
  const ia = new Uint8Array(ab)
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }
  return new File([ab], filename, { type: mimeType })
}

export default function AdsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [walletBalance, setWalletBalance] = useState(0)
  const [walletId, setWalletId] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<Plan>(plans[0])
  const [formData, setFormData] = useState<AdData>({
    video: null,
    image: null,
    text: '',
    link: '',
    start_time: '',
    end_time: '',
    videoPreview: null,
    imagePreview: null,
  })
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewType, setPreviewType] = useState<'image' | 'video' | null>(null)
  const [previewFileName, setPreviewFileName] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isReRun, setIsReRun] = useState(false)
  const [rerunAdId, setRerunAdId] = useState<string | null>(null)
  
  // Fund wallet states
  const [showFundWallet, setShowFundWallet] = useState(false)
  const [showInsufficientPopup, setShowInsufficientPopup] = useState(false)
  const [neededAmount, setNeededAmount] = useState(0)
  
  // Success popup state
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)

  // Check auth and fetch wallet
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.user) {
          router.push('/auth/login')
          return
        }

        setUser(session.user)

        // Fetch wallet balance and ID
        const { data: walletData, error: walletError } = await supabase
          .from('wallets')
          .select('id, balance')
          .eq('user_id', session.user.id)
          .single()

        if (walletError) {
          console.error('Error fetching wallet:', walletError)
        } else if (walletData) {
          setWalletBalance(walletData.balance)
          setWalletId(walletData.id)
        }

        setLoading(false)
      } catch (err) {
        console.error('Auth check error:', err)
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  // Load re-run ad data from database
  useEffect(() => {
    const loadRerunAd = async () => {
      const rerunAdId = sessionStorage.getItem('rerun_ad_id')
      if (!rerunAdId) {
        // If no re-run ID, just set loading to false
        setLoading(false)
        return
      }
      
      setRerunAdId(rerunAdId)
      
      try {
        // Fetch the ad data
        const { data: adData, error } = await supabase
          .from('ads')
          .select('*')
          .eq('id', rerunAdId)
          .single()
        
        if (error) {
          console.error('Error fetching ad for re-run:', error)
          sessionStorage.removeItem('rerun_ad_id')
          setLoading(false)
          return
        }
        
        if (adData) {
          console.log('🔄 Loading re-run ad data from database:', adData)
          
          // Set the default start time (24 hours from now)
          const defaultStart = getDefaultStartTime()
          
          // Pre-fill the form with the ad data
          setFormData(prev => ({
            ...prev,
            text: adData.text || '',
            link: adData.ads_link || '',
            start_time: defaultStart,
            videoPreview: adData.video || null,
            imagePreview: adData.image || null,
          }))
          
          // Set preview if media exists
          if (adData.video) {
            setPreviewUrl(adData.video)
            setPreviewType('video')
            setPreviewFileName('Existing video')
          } else if (adData.image) {
            setPreviewUrl(adData.image)
            setPreviewType('image')
            setPreviewFileName('Existing image')
          }
          
          // Set re-run flag
          setIsReRun(true)
          
          // Clear the session storage after loading
          sessionStorage.removeItem('rerun_ad_id')
        }
      } catch (err) {
        console.error('Error loading re-run data:', err)
      } finally {
        setLoading(false)
      }
    }
    
    loadRerunAd()
  }, []) // Run once on mount

  // Load saved form data from localStorage on initial load
  useEffect(() => {
    if (!isInitialLoad || isReRun) return // Skip if re-run is loading
    
    const savedFormData = localStorage.getItem(ADS_FORM_STORAGE_KEY)
    const savedPlan = localStorage.getItem(ADS_SELECTED_PLAN_KEY)
    const savedMedia = localStorage.getItem(ADS_MEDIA_STORAGE_KEY)
    
    // Load selected plan
    if (savedPlan) {
      const plan = plans.find(p => p.id === savedPlan)
      if (plan) {
        setSelectedPlan(plan)
      }
    }
    
    // Load form data (text and link only, not dates)
    if (savedFormData) {
      try {
        const parsed = JSON.parse(savedFormData)
        setFormData(prev => ({
          ...prev,
          text: parsed.text || '',
          link: parsed.link || '',
        }))
        console.log('✅ Loaded saved form data:', parsed)
      } catch (e) {
        console.error('Error parsing saved form data:', e)
      }
    }
    
    // Load saved media
    if (savedMedia) {
      try {
        const parsed = JSON.parse(savedMedia)
        if (parsed.imagePreview) {
          const imageFile = base64ToFile(parsed.imagePreview, parsed.imageName || 'image.png', 'image/png')
          setFormData(prev => ({
            ...prev,
            image: imageFile,
            imagePreview: parsed.imagePreview
          }))
          setPreviewUrl(parsed.imagePreview)
          setPreviewType('image')
          setPreviewFileName(parsed.imageName || 'image.png')
          console.log('✅ Loaded saved image')
        } else if (parsed.videoPreview) {
          const videoFile = base64ToFile(parsed.videoPreview, parsed.videoName || 'video.mp4', 'video/mp4')
          setFormData(prev => ({
            ...prev,
            video: videoFile,
            videoPreview: parsed.videoPreview
          }))
          setPreviewUrl(parsed.videoPreview)
          setPreviewType('video')
          setPreviewFileName(parsed.videoName || 'video.mp4')
          console.log('✅ Loaded saved video')
        }
      } catch (e) {
        console.error('Error parsing saved media:', e)
      }
    }
    
    // Set default start time (always fresh)
    const defaultStart = getDefaultStartTime()
    setFormData(prev => ({ ...prev, start_time: defaultStart }))
    console.log('📅 Set default start time:', defaultStart)
    
    setIsInitialLoad(false)
  }, [isInitialLoad, isReRun])

  // Save form data to localStorage whenever it changes (after initial load)
  useEffect(() => {
    if (isInitialLoad || isReRun) return // Don't save if re-run is active
    
    // Save text and link only
    const dataToSave = {
      text: formData.text,
      link: formData.link,
    }
    localStorage.setItem(ADS_FORM_STORAGE_KEY, JSON.stringify(dataToSave))
    localStorage.setItem(ADS_SELECTED_PLAN_KEY, selectedPlan.id)
    console.log('💾 Saved form data to localStorage:', dataToSave)
  }, [formData.text, formData.link, selectedPlan, isInitialLoad, isReRun])

  // Save media to localStorage
  useEffect(() => {
    if (isInitialLoad || isReRun) return // Don't save if re-run is active
    
    const saveMedia = async () => {
      const mediaData: any = {}
      
      if (formData.image) {
        try {
          const base64 = await fileToBase64(formData.image)
          mediaData.imagePreview = base64
          mediaData.imageName = formData.image.name
        } catch (e) {
          console.error('Error saving image:', e)
        }
      } else if (formData.video) {
        try {
          const base64 = await fileToBase64(formData.video)
          mediaData.videoPreview = base64
          mediaData.videoName = formData.video.name
        } catch (e) {
          console.error('Error saving video:', e)
        }
      }
      
      if (Object.keys(mediaData).length > 0) {
        localStorage.setItem(ADS_MEDIA_STORAGE_KEY, JSON.stringify(mediaData))
        console.log('💾 Saved media to localStorage')
      } else {
        localStorage.removeItem(ADS_MEDIA_STORAGE_KEY)
      }
    }
    
    saveMedia()
  }, [formData.image, formData.video, isInitialLoad, isReRun])

  // Auto-refresh start time every 2 minutes
  useEffect(() => {
    if (isInitialLoad) return
    
    const interval = setInterval(() => {
      const newStartTime = getDefaultStartTime()
      setFormData(prev => ({ ...prev, start_time: newStartTime }))
      console.log('🔄 Refreshed start time:', newStartTime)
    }, 120000) // 2 minutes
    
    return () => clearInterval(interval)
  }, [isInitialLoad])

  // Update end time when plan or start time changes
  useEffect(() => {
    if (formData.start_time && selectedPlan) {
      const startDate = new Date(formData.start_time)
      const endDate = new Date(startDate.getTime() + selectedPlan.duration * 24 * 60 * 60 * 1000)
      const endTime = endDate.toISOString().slice(0, 16)
      setFormData(prev => ({ ...prev, end_time: endTime }))
    }
  }, [formData.start_time, selectedPlan])

  // Format currency in Naira
  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB')
      return
    }

    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')

    if (!isVideo && !isImage) {
      setError('Please upload an image or video file')
      return
    }

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setPreviewType(isVideo ? 'video' : 'image')
    setPreviewFileName(file.name)

    if (isVideo) {
      setFormData(prev => ({ ...prev, video: file, image: null, videoPreview: url, imagePreview: null }))
    } else {
      setFormData(prev => ({ ...prev, image: file, video: null, imagePreview: url, videoPreview: null }))
    }

    setError('')
  }

  // Handle file removal
  const removeFile = () => {
    setFormData(prev => ({ ...prev, video: null, image: null, videoPreview: null, imagePreview: null }))
    setPreviewUrl(null)
    setPreviewType(null)
    setPreviewFileName('')
    localStorage.removeItem(ADS_MEDIA_STORAGE_KEY)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, text: e.target.value }))
  }

  // Handle link change
  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, link: e.target.value }))
  }

  // Handle date change (user manually changes date)
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Handle plan selection
  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan)
  }

  // Validate form
  const validateForm = () => {
    // For re-run, we don't require media since it's already saved
    if (!isReRun && !formData.video && !formData.image && !formData.text) {
      setError('Please upload an image/video or provide text for your ad')
      return false
    }

    if (!formData.start_time) {
      setError('Please select a start date')
      return false
    }

    const start = new Date(formData.start_time)
    const now = new Date()
    // Check if start time is at least 24 hours from now
    const minStartTime = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    
    if (start < minStartTime) {
      setError('Start date must be at least 24 hours from now')
      return false
    }

    if (!walletId) {
      setError('Wallet not found. Please contact support.')
      return false
    }

    if (walletBalance < selectedPlan.price) {
      setNeededAmount(selectedPlan.price - walletBalance)
      setShowInsufficientPopup(true)
      return false
    }

    // Validate link format if provided
    if (formData.link && !formData.link.startsWith('http://') && !formData.link.startsWith('https://')) {
      setError('Please enter a valid URL starting with http:// or https://')
      return false
    }

    return true
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!validateForm()) return

    setSubmitting(true)

    try {
      let mediaUrl = null

      // Only upload new media if user uploaded a new file
      if (formData.video || formData.image) {
        const file = formData.video || formData.image
        const fileExt = file!.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
        const bucket = formData.video ? 'ad-videos' : 'ad-images'

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, file!)

        if (uploadError) {
          throw new Error(`Failed to upload media: ${uploadError.message}`)
        }

        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName)

        mediaUrl = urlData.publicUrl
      } else if (isReRun && (formData.videoPreview || formData.imagePreview)) {
        // For re-run, keep the existing media URL
        mediaUrl = formData.videoPreview || formData.imagePreview
      }

      // Create transaction record for debit with wallet_id
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          wallet_id: walletId,
          type: 'debit',
          amount: selectedPlan.price,
          description: `Ad payment - ${selectedPlan.name} plan${isReRun ? ' (Re-run)' : ''}`,
          status: 'completed'
        })

      if (txError) {
        console.error('Transaction error:', txError)
        throw new Error(`Failed to record transaction: ${txError.message}`)
      }

      // Update wallet balance
      const newBalance = walletBalance - selectedPlan.price
      const { error: walletError } = await supabase
        .from('wallets')
        .update({ 
          balance: newBalance,
          total_withdrawn: (await getTotalWithdrawn(user.id)) + selectedPlan.price,
          updated_at: new Date().toISOString()
        })
        .eq('id', walletId)

      if (walletError) {
        throw new Error(`Failed to update wallet: ${walletError.message}`)
      }

      // Create ad
      const { error: insertError } = await supabase
        .from('ads')
        .insert({
          user_id: user.id,
          video: mediaUrl && formData.videoPreview ? mediaUrl : (formData.video ? mediaUrl : null),
          image: mediaUrl && formData.imagePreview ? mediaUrl : (formData.image ? mediaUrl : null),
          text: formData.text || null,
          ads_link: formData.link || null,
          start_time: formData.start_time,
          end_time: formData.end_time,
          approval: false,
          pause: false,
        })

      if (insertError) {
        throw new Error(`Failed to submit ad: ${insertError.message}`)
      }

      // Update local wallet balance
      setWalletBalance(newBalance)

      // Clear localStorage after successful submission
      localStorage.removeItem(ADS_FORM_STORAGE_KEY)
      localStorage.removeItem(ADS_SELECTED_PLAN_KEY)
      localStorage.removeItem(ADS_MEDIA_STORAGE_KEY)

      // Reset form
      const defaultStart = getDefaultStartTime()
      setFormData({
        video: null,
        image: null,
        text: '',
        link: '',
        start_time: defaultStart,
        end_time: '',
        videoPreview: null,
        imagePreview: null,
      })
      setPreviewUrl(null)
      setPreviewType(null)
      setPreviewFileName('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // Reset re-run flag
      setIsReRun(false)
      setRerunAdId(null)

      // Show success popup
      setShowSuccessPopup(true)
      setSuccess(true)

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  // Helper to get total withdrawn
  const getTotalWithdrawn = async (userId: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'debit')
      .eq('status', 'completed')
    
    if (error || !data) return 0
    return data.reduce((sum, tx) => sum + tx.amount, 0)
  }

  // Handle fund wallet success
  const handleFundSuccess = async () => {
    // Refresh wallet balance
    const { data: walletData } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', user.id)
      .single()
    
    if (walletData) {
      setWalletBalance(walletData.balance)
      setWalletId(walletData.id)
      setShowInsufficientPopup(false)
      setShowFundWallet(false)
      setError('')
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
          <span className="text-white/60 ml-3">Loading...</span>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="pb-24 md:pb-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <h1 className="text-base sm:text-xl md:text-2xl font-bold text-white">
              {isReRun ? 'Re-run Your Ad' : 'Promote Your Brand'}
            </h1>
            <p className="text-[11px] sm:text-sm text-white/40 mt-0.5 sm:mt-1">
              {isReRun 
                ? 'Place your ad again with the same content' 
                : 'Create an ad to promote your products or services'}
            </p>
            {isReRun && (
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs text-blue-400">
                <RotateCcw className="w-3 h-3" />
                Re-running ad from previous campaign
              </div>
            )}
          </div>

          {/* Wallet Balance */}
          <div className="bg-gradient-to-br from-red-500/10 via-red-600/5 to-transparent rounded-xl p-3 sm:p-4 border border-red-500/20 mb-4 sm:mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
                <span className="text-[10px] sm:text-sm text-white/60">Your Wallet Balance</span>
              </div>
              <span className="text-base sm:text-lg font-bold text-white">{formatCurrency(walletBalance)}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-[9px] sm:text-xs text-white/40">
              <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Payment deducted upon approval</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[11px] sm:text-sm flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Insufficient Balance Popup */}
          {showInsufficientPopup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
              <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 max-w-md w-full border border-white/10 shadow-2xl animate-in zoom-in duration-300">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-yellow-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Insufficient Balance</h3>
                  <p className="text-sm text-white/60 mb-1">
                    You need <span className="text-yellow-400 font-semibold">{formatCurrency(selectedPlan.price)}</span> for the <span className="text-white font-semibold">{selectedPlan.name}</span> plan.
                  </p>
                  <p className="text-sm text-white/60 mb-4">
                    Your current balance is <span className="text-red-400 font-semibold">{formatCurrency(walletBalance)}</span>
                  </p>
                  <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/5">
                    <p className="text-xs text-white/40">
                      You need an additional <span className="text-yellow-400 font-semibold">{formatCurrency(neededAmount)}</span> to proceed
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => {
                        setShowFundWallet(true)
                        setShowInsufficientPopup(false)
                      }}
                      className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Top Up Now
                    </button>
                    <button
                      onClick={() => {
                        setShowInsufficientPopup(false)
                        setError('')
                      }}
                      className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium text-white/60 transition-all hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success Popup */}
          {showSuccessPopup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
              <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 max-w-md w-full border border-white/10 shadow-2xl animate-in zoom-in duration-300">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                    <ThumbsUp className="w-10 h-10 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {isReRun ? 'Ad Re-submitted Successfully! 🎉' : 'Ad Submitted Successfully! 🎉'}
                  </h3>
                  <p className="text-sm text-white/60 mb-2">
                    {isReRun 
                      ? 'Your ad has been re-placed and is awaiting admin approval.'
                      : 'Your ad has been placed and is awaiting admin approval.'}
                  </p>
                  <p className="text-sm text-white/40 mb-6">
                    You will be notified once it's approved.
                  </p>
                  <div className="bg-white/5 rounded-xl p-4 mb-6 text-left border border-white/5">
                    <p className="text-xs text-white/40 mb-1">Ad Summary</p>
                    <p className="text-sm font-medium text-white">
                      {selectedPlan.name} Plan • {formatCurrency(selectedPlan.price)}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                      <span>Starts: {formData.start_time ? new Date(formData.start_time).toLocaleString() : 'N/A'}</span>
                      <span>•</span>
                      <span>Duration: {selectedPlan.duration} days</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => {
                        setShowSuccessPopup(false)
                        setSuccess(false)
                        setIsReRun(false)
                        setRerunAdId(null)
                        const defaultStart = getDefaultStartTime()
                        setFormData({
                          video: null,
                          image: null,
                          text: '',
                          link: '',
                          start_time: defaultStart,
                          end_time: '',
                          videoPreview: null,
                          imagePreview: null,
                        })
                        setPreviewUrl(null)
                        setPreviewType(null)
                        setPreviewFileName('')
                        localStorage.removeItem(ADS_FORM_STORAGE_KEY)
                        localStorage.removeItem(ADS_MEDIA_STORAGE_KEY)
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ''
                        }
                      }}
                      className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium text-white/60 transition-all hover:text-white"
                    >
                      {isReRun ? 'Create New Ad' : 'Place Another Ad'}
                    </button>
                    <button
                      onClick={() => {
                        setShowSuccessPopup(false)
                        setSuccess(false)
                        router.push('/ads/status')
                      }}
                      className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Check Ad Status
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Guidelines */}
          <div className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/5 mb-4 sm:mb-6">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
              <h3 className="text-[11px] sm:text-sm font-medium text-white">Ad Guidelines</h3>
            </div>
            <ul className="space-y-0.5 text-[9px] sm:text-xs text-white/40">
              <li className="flex items-start gap-1.5 sm:gap-2">
                <div className="w-1 h-1 rounded-full bg-red-400 mt-1 flex-shrink-0" />
                <span>10:1.5 ratio (width:height) for images/videos</span>
              </li>
              <li className="flex items-start gap-1.5 sm:gap-2">
                <div className="w-1 h-1 rounded-full bg-red-400 mt-1 flex-shrink-0" />
                <span>No nudity, scam, or inappropriate content</span>
              </li>
              <li className="flex items-start gap-1.5 sm:gap-2">
                <div className="w-1 h-1 rounded-full bg-red-400 mt-1 flex-shrink-0" />
                <span>Start date must be at least 24 hours from now</span>
              </li>
              <li className="flex items-start gap-1.5 sm:gap-2">
                <div className="w-1 h-1 rounded-full bg-red-400 mt-1 flex-shrink-0" />
                <span>Add a link to drive traffic to your website</span>
              </li>
            </ul>
          </div>

          {/* Pricing Plans */}
          <div className="mb-4 sm:mb-6">
            <h3 className="text-[11px] sm:text-sm font-medium text-white/60 mb-2 sm:mb-3">Choose Your Plan</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {plans.slice(0, 2).map((plan) => {
                const isSelected = selectedPlan.id === plan.id
                const Icon = plan.icon
                const hasEnoughBalance = walletBalance >= plan.price
                return (
                  <button
                    key={plan.id}
                    onClick={() => handlePlanSelect(plan)}
                    className={`relative p-2.5 sm:p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-red-500 bg-red-500/10 shadow-lg shadow-red-500/20'
                        : hasEnoughBalance
                          ? 'border-white/10 bg-white/5 hover:border-white/20'
                          : 'border-white/5 bg-white/5 opacity-60 hover:border-red-500/30'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-gradient-to-r from-red-500 to-orange-500 rounded-full text-[6px] sm:text-[8px] font-medium text-white uppercase tracking-wider">
                        Popular
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                      <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSelected ? 'text-red-400' : 'text-white/40'}`} />
                      <span className={`text-[11px] sm:text-sm font-semibold ${isSelected ? 'text-white' : 'text-white/80'}`}>
                        {plan.name}
                      </span>
                    </div>
                    <p className={`text-base sm:text-2xl font-bold ${isSelected ? 'text-red-500' : 'text-white'}`}>
                      {formatCurrency(plan.price)}
                    </p>
                    <p className="text-[8px] sm:text-xs text-white/40 mt-0.5 sm:mt-1">{plan.description}</p>
                    <p className="text-[7px] sm:text-[10px] text-white/20 mt-0.5 sm:mt-2">{plan.duration} days</p>
                    {!hasEnoughBalance && (
                      <p className="text-[7px] sm:text-[10px] text-red-400/60 mt-1">Insufficient balance</p>
                    )}
                  </button>
                )
              })}
              {plans.slice(2).map((plan) => {
                const isSelected = selectedPlan.id === plan.id
                const Icon = plan.icon
                const hasEnoughBalance = walletBalance >= plan.price
                return (
                  <button
                    key={plan.id}
                    onClick={() => handlePlanSelect(plan)}
                    className={`col-span-2 sm:col-span-1 relative p-2.5 sm:p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-red-500 bg-red-500/10 shadow-lg shadow-red-500/20'
                        : hasEnoughBalance
                          ? 'border-white/10 bg-white/5 hover:border-white/20'
                          : 'border-white/5 bg-white/5 opacity-60 hover:border-red-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                      <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSelected ? 'text-red-400' : 'text-white/40'}`} />
                      <span className={`text-[11px] sm:text-sm font-semibold ${isSelected ? 'text-white' : 'text-white/80'}`}>
                        {plan.name}
                      </span>
                    </div>
                    <p className={`text-base sm:text-2xl font-bold ${isSelected ? 'text-red-500' : 'text-white'}`}>
                      {formatCurrency(plan.price)}
                    </p>
                    <p className="text-[8px] sm:text-xs text-white/40 mt-0.5 sm:mt-1">{plan.description}</p>
                    <p className="text-[7px] sm:text-[10px] text-white/20 mt-0.5 sm:mt-2">{plan.duration} days</p>
                    {!hasEnoughBalance && (
                      <p className="text-[7px] sm:text-[10px] text-red-400/60 mt-1">Insufficient balance</p>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Media Upload */}
            <div className="bg-white/5 rounded-xl border border-white/5 p-3 sm:p-6">
              <label className="block text-[11px] sm:text-sm font-medium text-white/60 mb-2 sm:mb-3">
                Ad Media
                <span className="text-[9px] sm:text-xs text-white/30 ml-1.5 sm:ml-2">(Optional)</span>
              </label>
              
              {previewUrl ? (
                <div className="relative aspect-[10/1.5] rounded-xl overflow-hidden bg-black/50">
                  {previewType === 'video' ? (
                    <video
                      src={previewUrl}
                      className="w-full h-full object-cover"
                      controls
                      playsInline
                    />
                  ) : (
                    <img
                      src={previewUrl}
                      alt="Ad preview"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute bottom-1.5 sm:bottom-2 left-1.5 sm:left-2 px-1.5 sm:px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded-full text-[8px] sm:text-[10px] text-white/60">
                    {previewType === 'video' ? 'Video' : 'Image'} • {previewFileName}
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 p-1 sm:p-1.5 bg-black/70 hover:bg-red-500 rounded-full transition-colors"
                  >
                    <X className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-white/10 rounded-xl p-6 sm:p-8 text-center hover:border-white/20 transition-colors relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-white/5 flex items-center justify-center">
                      <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-white/40" />
                    </div>
                    <div>
                      <p className="text-[11px] sm:text-sm text-white/60">Click or drag to upload</p>
                      <p className="text-[9px] sm:text-xs text-white/30 mt-0.5 sm:mt-1">PNG, JPG, MP4 • Max 50MB • 10:1.5 ratio</p>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 text-[9px] sm:text-xs text-white/20">
                      <span className="flex items-center gap-0.5 sm:gap-1">
                        <ImageIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        Image
                      </span>
                      <span className="flex items-center gap-0.5 sm:gap-1">
                        <Video className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        Video
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Text Ad */}
            <div className="bg-white/5 rounded-xl border border-white/5 p-3 sm:p-6">
              <label className="block text-[11px] sm:text-sm font-medium text-white/60 mb-1.5 sm:mb-2">
                Ad Text
                <span className="text-[9px] sm:text-xs text-white/30 ml-1.5 sm:ml-2">(Optional)</span>
              </label>
              <textarea
                value={formData.text}
                onChange={handleTextChange}
                rows={3}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-white text-[11px] sm:text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors resize-none"
                placeholder="Write your ad message here..."
                maxLength={500}
              />
              <div className="flex justify-end mt-1">
                <span className="text-[9px] sm:text-xs text-white/30">{formData.text.length}/500</span>
              </div>
            </div>

            {/* Link Input */}
            <div className="bg-white/5 rounded-xl border border-white/5 p-3 sm:p-6">
              <label className="block text-[11px] sm:text-sm font-medium text-white/60 mb-1.5 sm:mb-2">
                Ad Link
                <span className="text-[9px] sm:text-xs text-white/30 ml-1.5 sm:ml-2">(Optional)</span>
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="url"
                  value={formData.link}
                  onChange={handleLinkChange}
                  placeholder="https://your-website.com"
                  className="w-full pl-10 pr-4 py-2 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-white text-[11px] sm:text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                />
              </div>
              <p className="text-[8px] sm:text-[10px] text-white/30 mt-1.5">
                Add a link to drive traffic to your website or product page
              </p>
            </div>

            {/* Schedule */}
            <div className="bg-white/5 rounded-xl border border-white/5 p-3 sm:p-6">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-4">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
                <h3 className="text-[11px] sm:text-sm font-medium text-white">Schedule</h3>
                <span className="text-[8px] sm:text-[10px] text-white/20 ml-auto">
                  Auto-refreshes every 2 min
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[10px] sm:text-xs font-medium text-white/60 mb-1">
                    Start Date & Time
                    <span className="text-[8px] sm:text-[10px] text-white/30 ml-1">(24h min)</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleDateChange}
                    required
                    min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                    className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white/5 border border-white/10 rounded-xl text-white text-[11px] sm:text-sm focus:outline-none focus:border-red-500/50 transition-colors"
                  />
                  <p className="text-[7px] sm:text-[9px] text-white/20 mt-0.5">
                    Auto-updates every 2 minutes
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] sm:text-xs font-medium text-white/60 mb-1">
                    End Date & Time
                    <span className="text-[8px] sm:text-[10px] text-white/30 ml-1">(Auto-calculated)</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="end_time"
                    value={formData.end_time}
                    disabled
                    className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white/5 border border-white/10 rounded-xl text-white text-[11px] sm:text-sm opacity-60 cursor-not-allowed"
                  />
                  <p className="text-[8px] sm:text-[10px] text-white/30 mt-1">
                    {selectedPlan.name} plan • {selectedPlan.duration} days
                  </p>
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="bg-white/5 rounded-xl border border-white/5 p-3 sm:p-4">
              <h4 className="text-[11px] sm:text-sm font-medium text-white/60 mb-2 sm:mb-3">Cost Breakdown</h4>
              <div className="space-y-1.5 sm:space-y-2 text-[11px] sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-white/40">{selectedPlan.name} Plan</span>
                  <span className="text-white/60">{formatCurrency(selectedPlan.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Processing Fee</span>
                  <span className="text-white/60">₦0.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Duration</span>
                  <span className="text-white/60">{selectedPlan.duration} days</span>
                </div>
                <div className="border-t border-white/5 pt-1.5 sm:pt-2 flex justify-between font-semibold">
                  <span className="text-white">Total</span>
                  <span className="text-red-500">{formatCurrency(selectedPlan.price)}</span>
                </div>
                <div className="text-[9px] sm:text-xs text-white/30 mt-1.5 sm:mt-2">
                  <p>Payment processed upon approval</p>
                  <p className="mt-0.5">Balance: {formatCurrency(walletBalance)}</p>
                  {walletBalance < selectedPlan.price && (
                    <p className="mt-1 text-red-400/70 text-[8px] sm:text-[10px]">
                      ⚠️ Insufficient balance. Please add funds.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-2.5 sm:py-3 rounded-xl font-medium text-white transition-all flex items-center justify-center gap-2 shadow-lg text-[13px] sm:text-base ${
                submitting || walletBalance < selectedPlan.price
                  ? 'bg-white/10 text-white/40 cursor-not-allowed'
                  : 'bg-red-500 hover:bg-red-600 hover:scale-[1.02] active:scale-[0.98] shadow-red-500/25'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                  Submitting...
                </>
              ) : walletBalance < selectedPlan.price ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Insufficient Wallet Balance
                </>
              ) : isReRun ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Re-run Ad
                </>
              ) : (
                <>
                  <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Submit Ad for Review
                </>
              )}
            </button>

            <p className="text-center text-[8px] sm:text-[10px] text-white/20 mt-2">
              By submitting, you agree to our ad policies and terms
            </p>
          </form>
        </div>
      </main>

      <BottomNav />

      {/* Fund Wallet Modal */}
      {showFundWallet && (
        <FundWallet
          userData={{ user, profile: null, session: null }}
          onClose={() => {
            setShowFundWallet(false)
            if (walletBalance < selectedPlan.price) {
              setShowInsufficientPopup(true)
            }
          }}
          onSuccess={handleFundSuccess}
        />
      )}
    </div>
  )
}