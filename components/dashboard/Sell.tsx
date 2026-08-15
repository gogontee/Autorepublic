'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Upload, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Search,
  MapPin,
  Plus,
  Star,
  ChevronDown,
  Phone,
  ThumbsUp,
  Hash,
  Palette,
  Gauge,
  ChevronLeft,
  ChevronRight,
  Home,
  Check
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'

// Dynamically import ReactQuill with a loading fallback
const ReactQuill = dynamic(
  () => import('react-quill'),
  { 
    ssr: false,
    loading: () => (
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-white/40 text-sm">
        Loading editor...
      </div>
    )
  }
)

// Import CSS separately
import 'react-quill/dist/quill.snow.css'

interface SellProps {
  userData?: {
    user: any
    profile: any
    session: any
  }
  savedFormData?: any
  savedImages?: any[]
  onFormDataChange?: (data: any) => void
  onImagesChange?: (images: any[]) => void
  onFormSubmit?: () => void
  onSuccessAction?: () => void
}

interface ImageFile {
  file: File
  preview: string
  id: string
  isCover: boolean
}

const fuelTypes = ['Gasoline', 'Diesel', 'Electric', 'Hybrid', 'Plug-in Hybrid']
const transmissions = ['Automatic', 'Manual', 'CVT', 'Dual-Clutch', 'Semi-Automatic']
const conditions = ['Brand New', 'Foreign Used', 'Local Used']
const categories = ['Sedan', 'SUV', 'Sports', 'Bus', 'Truck', 'Van', 'Coupe', 'Convertible', 'Hatchback', 'Power Bike', 'Wagon']

// Compact color palette with common car colors
const colorPalette = [
  { name: 'Black', hex: '#1a1a1a' },
  { name: 'White', hex: '#f5f5f5' },
  { name: 'Silver', hex: '#c0c0c0' },
  { name: 'Gray', hex: '#808080' },
  { name: 'Charcoal', hex: '#36454F' },
  { name: 'Red', hex: '#cc0000' },
  { name: 'Dark Red', hex: '#8B0000' },
  { name: 'Maroon', hex: '#800000' },
  { name: 'Burgundy', hex: '#900020' },
  { name: 'Blue', hex: '#0044cc' },
  { name: 'Dark Blue', hex: '#00008B' },
  { name: 'Navy', hex: '#000080' },
  { name: 'Light Blue', hex: '#87CEEB' },
  { name: 'Green', hex: '#006400' },
  { name: 'Dark Green', hex: '#004d00' },
  { name: 'Teal', hex: '#008080' },
  { name: 'Yellow', hex: '#FFD700' },
  { name: 'Gold', hex: '#D4AF37' },
  { name: 'Orange', hex: '#FF8C00' },
  { name: 'Bronze', hex: '#CD7F32' },
  { name: 'Purple', hex: '#6A0DAD' },
  { name: 'Brown', hex: '#8B4513' },
  { name: 'Tan', hex: '#D2B48C' },
  { name: 'Beige', hex: '#F5F5DC' },
  { name: 'Cream', hex: '#FFFDD0' },
  { name: 'Pink', hex: '#FF69B4' },
]

const engineTypes = ['V4', 'V6', 'V8', 'V10', 'V12', 'Inline-4', 'Inline-6', 'Electric', 'Hybrid', 'Plug-in Hybrid', 'Turbocharged', 'Supercharged']

const years = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i)

// Quill modules configuration
const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ color: [] }, { background: [] }],
    ['clean']
  ],
}

const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'blockquote', 'code-block',
  'list', 'bullet',
  'color', 'background'
]

export default function Sell({ 
  userData, 
  savedFormData, 
  savedImages,
  onFormDataChange, 
  onImagesChange,
  onFormSubmit,
  onSuccessAction 
}: SellProps) {
  const { user, profile } = userData || {}
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [searching, setSearching] = useState(false)
  const [allBrands, setAllBrands] = useState<string[]>([])
  const [brandSuggestions, setBrandSuggestions] = useState<string[]>([])
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false)
  const [allModels, setAllModels] = useState<string[]>([])
  const [modelSuggestions, setModelSuggestions] = useState<string[]>([])
  const [showModelSuggestions, setShowModelSuggestions] = useState(false)
  const [allTrims, setAllTrims] = useState<string[]>([])
  const [trimSuggestions, setTrimSuggestions] = useState<string[]>([])
  const [showTrimSuggestions, setShowTrimSuggestions] = useState(false)
  const [engineSuggestions, setEngineSuggestions] = useState<string[]>([])
  const [showEngineSuggestions, setShowEngineSuggestions] = useState(false)
  
  // Location state
  const [allStates, setAllStates] = useState<string[]>([])
  const [allCities, setAllCities] = useState<string[]>([])
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false)
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false)
  const [isLoadingStates, setIsLoadingStates] = useState(false)
  const [isLoadingCities, setIsLoadingCities] = useState(false)
  const [stateSearch, setStateSearch] = useState('')
  const [citySearch, setCitySearch] = useState('')
  
  const brandInputRef = useRef<HTMLInputElement>(null)
  const modelInputRef = useRef<HTMLInputElement>(null)
  const trimInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const engineInputRef = useRef<HTMLInputElement>(null)
  const colorScrollRef = useRef<HTMLDivElement>(null)
  const interiorColorScrollRef = useRef<HTMLDivElement>(null)
  const stateButtonRef = useRef<HTMLButtonElement>(null)
  const cityButtonRef = useRef<HTMLButtonElement>(null)
  const stateDropdownRef = useRef<HTMLDivElement>(null)
  const cityDropdownRef = useRef<HTMLDivElement>(null)

  // Initialize formData with saved data if available
  const defaultFormData = {
    title: '',
    brand: '',
    model: '',
    trim: '',
    year: '',
    price: '',
    mileage: '',
    fuelType: '',
    transmission: '',
    color: '',
    interiorColor: '',
    engineType: '',
    vin: '',
    description: '',
    condition: '',
    category: '',
    city: '',
    state: '',
    country: '',
    fullAddress: '',
    phone: profile?.phone || '',
  }

  const [formData, setFormData] = useState(() => {
    if (savedFormData) {
      return {
        ...defaultFormData,
        ...savedFormData,
        phone: savedFormData.phone || profile?.phone || '',
      }
    }
    return defaultFormData
  })

  // Initialize images from saved data
  const [images, setImages] = useState<ImageFile[]>(() => {
    if (savedImages && savedImages.length > 0) {
      return savedImages.map((img: any) => ({
        id: img.id,
        preview: img.preview,
        isCover: img.isCover,
        file: new File([], img.fileName || 'image.jpg', { type: img.fileType || 'image/jpeg' })
      }))
    }
    return []
  })

  // Save form data whenever it changes
  useEffect(() => {
    if (onFormDataChange) {
      onFormDataChange(formData)
    }
  }, [formData, onFormDataChange])

  // Save images whenever they change
  useEffect(() => {
    if (onImagesChange) {
      onImagesChange(images)
    }
  }, [images, onImagesChange])

  // Fetch all brands on component mount
  useEffect(() => {
    const fetchAllBrands = async () => {
      try {
        const { data, error } = await supabase
          .from('vehiclelist')
          .select('brand')
          .order('brand')

        if (error) throw error

        const uniqueBrands = [...new Set(data.map((item: any) => item.brand))]
        setAllBrands(uniqueBrands)
      } catch (err) {
        console.error('Error fetching brands:', err)
      }
    }

    fetchAllBrands()
    fetchAllStates()
  }, [])

  // Fetch all states
  const fetchAllStates = async () => {
    setIsLoadingStates(true)
    try {
      const response = await fetch('/api/locations/states')
      if (!response.ok) throw new Error('Failed to fetch states')
      const data = await response.json()
      setAllStates(data.states || [])
    } catch (error) {
      console.error('Error fetching states:', error)
    } finally {
      setIsLoadingStates(false)
    }
  }

  // Fetch cities for a state
  const fetchCitiesForState = async (state: string) => {
    if (!state) {
      setAllCities([])
      return
    }

    setIsLoadingCities(true)
    try {
      const response = await fetch(`/api/locations/cities?state=${encodeURIComponent(state)}`)
      if (!response.ok) throw new Error('Failed to fetch cities')
      const data = await response.json()
      setAllCities(data.cities || [])
    } catch (error) {
      console.error('Error fetching cities:', error)
      setAllCities([])
    } finally {
      setIsLoadingCities(false)
    }
  }

  // Fetch cities when state changes
  useEffect(() => {
    if (formData.state) {
      fetchCitiesForState(formData.state)
    } else {
      setAllCities([])
    }
  }, [formData.state])

  // Fetch all models for a brand when brand is selected
  useEffect(() => {
    const fetchModelsForBrand = async () => {
      if (!formData.brand) {
        setAllModels([])
        setModelSuggestions([])
        return
      }

      try {
        const { data, error } = await supabase
          .from('vehiclelist')
          .select('model')
          .eq('brand', formData.brand)
          .order('model')

        if (error) throw error

        const uniqueModels = [...new Set(data.map((item: any) => item.model))]
        setAllModels(uniqueModels)
        if (uniqueModels.length > 0) {
          setModelSuggestions(uniqueModels)
          setShowModelSuggestions(true)
        }
      } catch (err) {
        console.error('Error fetching models:', err)
      }
    }

    fetchModelsForBrand()
  }, [formData.brand])

  // Fetch all trims for a model when model is selected
  useEffect(() => {
    const fetchTrimsForModel = async () => {
      if (!formData.model) {
        setAllTrims([])
        setTrimSuggestions([])
        return
      }

      try {
        const { data, error } = await supabase
          .from('vehiclelist')
          .select('trims')
          .eq('model', formData.model)
          .single()

        if (error) throw error

        if (data?.trims) {
          setAllTrims(data.trims)
          if (data.trims.length > 0) {
            setTrimSuggestions(data.trims)
            setShowTrimSuggestions(true)
          }
        }
      } catch (err) {
        console.error('Error fetching trims:', err)
      }
    }

    fetchTrimsForModel()
  }, [formData.model])

  // Handle engine suggestions
  const handleEngineFocus = () => {
    setEngineSuggestions(engineTypes)
    setShowEngineSuggestions(true)
  }

  const handleEngineChange = (value: string) => {
    setFormData((prev: typeof formData) => ({ ...prev, engineType: value }))
    if (value.length > 0) {
      const filtered = engineTypes.filter((type: string) => 
        type.toLowerCase().includes(value.toLowerCase())
      )
      setEngineSuggestions(filtered)
      setShowEngineSuggestions(filtered.length > 0)
    } else {
      setEngineSuggestions(engineTypes)
      setShowEngineSuggestions(true)
    }
  }

  const selectEngine = (engine: string) => {
    setFormData((prev: typeof formData) => ({ ...prev, engineType: engine }))
    setShowEngineSuggestions(false)
  }

  // Handle brand input
  const handleBrandFocus = () => {
    if (allBrands.length > 0) {
      setBrandSuggestions(allBrands)
      setShowBrandSuggestions(true)
    }
  }

  const handleBrandChange = (value: string) => {
    setFormData((prev: typeof formData) => ({ ...prev, brand: value }))
    if (error) setError('')
    
    if (value.length > 0) {
      const filtered = allBrands.filter((brand: string) => 
        brand.toLowerCase().includes(value.toLowerCase())
      )
      setBrandSuggestions(filtered)
      setShowBrandSuggestions(filtered.length > 0)
    } else {
      setBrandSuggestions(allBrands)
      setShowBrandSuggestions(allBrands.length > 0)
    }
  }

  // Handle model input
  const handleModelFocus = () => {
    if (formData.brand) {
      if (allModels.length > 0) {
        setModelSuggestions(allModels)
        setShowModelSuggestions(true)
      }
    } else {
      setModelSuggestions([])
      setShowModelSuggestions(false)
    }
  }

  const handleModelChange = (value: string) => {
    setFormData((prev: typeof formData) => ({ ...prev, model: value }))
    if (error) setError('')
    
    if (value.length > 0) {
      const filtered = allModels.filter((model: string) => 
        model.toLowerCase().includes(value.toLowerCase())
      )
      setModelSuggestions(filtered)
      setShowModelSuggestions(filtered.length > 0)
    } else {
      setModelSuggestions(allModels)
      setShowModelSuggestions(allModels.length > 0)
    }
  }

  // Handle trim input
  const handleTrimFocus = () => {
    if (formData.model && allTrims.length > 0) {
      setTrimSuggestions(allTrims)
      setShowTrimSuggestions(true)
    }
  }

  const handleTrimChange = (value: string) => {
    setFormData((prev: typeof formData) => ({ ...prev, trim: value }))
    if (error) setError('')
    
    if (value.length > 0) {
      const filtered = allTrims.filter((trim: string) => 
        trim.toLowerCase().includes(value.toLowerCase())
      )
      setTrimSuggestions(filtered)
      setShowTrimSuggestions(filtered.length > 0)
    } else {
      setTrimSuggestions(allTrims)
      setShowTrimSuggestions(allTrims.length > 0)
    }
  }

  // Auto-fill brand when model is selected
  useEffect(() => {
    const fetchBrandFromModel = async () => {
      if (formData.model && !formData.brand) {
        try {
          const { data, error } = await supabase
            .from('vehiclelist')
            .select('brand')
            .eq('model', formData.model)
            .limit(1)
            .single()

          if (error) throw error

          if (data?.brand) {
            setFormData((prev: typeof formData) => ({ ...prev, brand: data.brand }))
            setShowModelSuggestions(false)
          }
        } catch (err) {
          console.error('Error fetching brand from model:', err)
        }
      }
    }

    fetchBrandFromModel()
  }, [formData.model])

  // Location dropdown handlers
  const toggleStateDropdown = () => {
    setIsStateDropdownOpen(!isStateDropdownOpen)
    setIsCityDropdownOpen(false)
  }

  const toggleCityDropdown = () => {
    if (formData.state) {
      setIsCityDropdownOpen(!isCityDropdownOpen)
      setIsStateDropdownOpen(false)
    }
  }

  const selectState = (state: string) => {
    setFormData((prev: typeof formData) => ({ ...prev, state, city: '' }))
    setIsStateDropdownOpen(false)
    setStateSearch('')
  }

  const selectCity = (city: string) => {
    setFormData((prev: typeof formData) => ({ ...prev, city }))
    setIsCityDropdownOpen(false)
    setCitySearch('')
  }

  // Filter states and cities
  const filteredStates = allStates.filter((state: string) =>
    state.toLowerCase().includes(stateSearch.toLowerCase())
  )

  const filteredCities = allCities.filter((city: string) =>
    city.toLowerCase().includes(citySearch.toLowerCase())
  )

  const selectBrand = (brand: string) => {
    setFormData((prev: typeof formData) => ({ ...prev, brand }))
    setShowBrandSuggestions(false)
    setBrandSuggestions([])
    setFormData((prev: typeof formData) => ({ ...prev, model: '', trim: '' }))
    if (modelInputRef.current) {
      modelInputRef.current.focus()
    }
  }

  const selectModel = (model: string) => {
    setFormData((prev: typeof formData) => ({ ...prev, model }))
    setShowModelSuggestions(false)
    setModelSuggestions([])
    setFormData((prev: typeof formData) => ({ ...prev, trim: '' }))
    if (trimInputRef.current) {
      trimInputRef.current.focus()
    }
  }

  const selectTrim = (trim: string) => {
    setFormData((prev: typeof formData) => ({ ...prev, trim }))
    setShowTrimSuggestions(false)
    setTrimSuggestions([])
  }

  // Find LGA from city name
  const findLGAForCity = async (city: string, state: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('cities')
        .eq('state', state)
        .single()

      if (error) throw error

      if (data?.cities) {
        const cityObj = data.cities.find((c: any) => 
          c.name && c.name.toLowerCase() === city.toLowerCase()
        )
        return cityObj?.lga || null
      }
      return null
    } catch (error) {
      console.error('Error finding LGA for city:', error)
      return null
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev: typeof formData) => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  // Handle description change for rich text
  const handleDescriptionChange = (value: string) => {
    setFormData((prev: typeof formData) => ({ ...prev, description: value }))
    if (error) setError('')
  }

  // Handle color selection - Exterior
  const selectExteriorColor = (colorName: string) => {
    setFormData((prev: typeof formData) => ({ ...prev, color: colorName }))
  }

  // Handle color selection - Interior
  const selectInteriorColor = (colorName: string) => {
    setFormData((prev: typeof formData) => ({ ...prev, interiorColor: colorName }))
  }

  // Scroll color picker
  const scrollColors = (direction: 'left' | 'right', ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      const scrollAmount = 120
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newImages: ImageFile[] = []
    for (let i = 0; i < Math.min(files.length, 10 - images.length); i++) {
      const file = files[i]
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB')
        continue
      }
      newImages.push({
        file,
        preview: URL.createObjectURL(file),
        id: Math.random().toString(36).substr(2, 9),
        isCover: images.length === 0 && i === 0
      })
    }
    setImages((prev: ImageFile[]) => [...prev, ...newImages])
  }

  const removeImage = (id: string) => {
    setImages((prev: ImageFile[]) => {
      const filtered = prev.filter((img: ImageFile) => img.id !== id)
      const removed = prev.find((img: ImageFile) => img.id === id)
      if (removed) URL.revokeObjectURL(removed.preview)
      
      if (removed?.isCover && filtered.length > 0) {
        filtered[0].isCover = true
      }
      
      return filtered
    })
  }

  const setCoverImage = (id: string) => {
    setImages((prev: ImageFile[]) => prev.map((img: ImageFile) => ({
      ...img,
      isCover: img.id === id
    })))
  }

  const resetForm = () => {
    setFormData({
      title: '',
      brand: '',
      model: '',
      trim: '',
      year: '',
      price: '',
      mileage: '',
      fuelType: '',
      transmission: '',
      color: '',
      interiorColor: '',
      engineType: '',
      vin: '',
      description: '',
      condition: '',
      category: '',
      city: '',
      state: '',
      country: '',
      fullAddress: '',
      phone: profile?.phone || '',
    })
    setImages([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('Please log in to list a vehicle')
      return
    }

    if (images.length === 0) {
      setError('Please upload at least one image')
      return
    }

    if (!formData.city || !formData.state) {
      setError('Please select a city and state')
      return
    }

    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      // Find LGA for the selected city
      let lga = null
      if (formData.city && formData.state) {
        lga = await findLGAForCity(formData.city, formData.state)
      }

      const imageUrls: string[] = []
      let coverImageUrl = ''
      
      for (const image of images) {
        const fileExt = image.file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('vehicle-images')
          .upload(fileName, image.file)

        if (uploadError) {
          throw new Error(`Failed to upload image: ${uploadError.message}`)
        }

        const { data: urlData } = supabase.storage
          .from('vehicle-images')
          .getPublicUrl(fileName)

        imageUrls.push(urlData.publicUrl)
        if (image.isCover) {
          coverImageUrl = urlData.publicUrl
        }
      }

      if (!coverImageUrl && imageUrls.length > 0) {
        coverImageUrl = imageUrls[0]
      }

      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .insert({
          user_id: user.id,
          title: formData.title,
          brand: formData.brand,
          model: formData.model,
          trim: formData.trim || null,
          year: parseInt(formData.year),
          price: parseFloat(formData.price),
          mileage: formData.mileage || null,
          fuel_type: formData.fuelType || null,
          transmission: formData.transmission || null,
          color: formData.color || null,
          interior_color: formData.interiorColor || null,
          engine_type: formData.engineType || null,
          vin: formData.vin || null,
          description: formData.description || null,
          condition: formData.condition || null,
          category: formData.category || null,
          images: imageUrls,
          cover_image: coverImageUrl,
          city: formData.city || null,
          state: formData.state || null,
          country: formData.country || null,
          lga: lga || null,
          full_address: formData.fullAddress || null,
          phone: formData.phone || null,
          status: 'pending',
        })
        .select()
        .single()

      if (vehicleError) {
        throw new Error(`Failed to create listing: ${vehicleError.message}`)
      }

      setSuccess(true)
      setShowSuccessModal(true)
      
      // Clear saved form data after successful submission
      if (onFormSubmit) {
        onFormSubmit()
      }
      
      resetForm()
      
      setTimeout(() => {
        setShowSuccessModal(false)
        setSuccess(false)
      }, 5000)

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-white/40">Please log in to list a vehicle</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 max-w-md w-full border border-white/10 shadow-2xl animate-in zoom-in duration-300">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <ThumbsUp className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Listing Submitted! 🎉</h2>
              <p className="text-sm text-white/60 mb-2">
                Your vehicle has been successfully listed for review.
              </p>
              <p className="text-sm text-white/40 mb-6">
                Our team will review your listing and make it live shortly.
                You'll be notified once it's approved.
              </p>
              <div className="border-t border-white/5 my-4" />
              <div className="bg-white/5 rounded-xl p-4 mb-6 text-left">
                <p className="text-xs text-white/40 mb-1">Listing Summary</p>
                <p className="text-sm font-medium text-white truncate">
                  {formData.title || `${formData.brand} ${formData.model}`}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                  <span>{formData.year}</span>
                  <span>•</span>
                  <span>{formData.price ? `$${parseInt(formData.price).toLocaleString()}` : ''}</span>
                  <span>•</span>
                  <span className="capitalize">{formData.condition}</span>
                </div>
                {formData.city && (
                  <p className="text-xs text-white/40 mt-1">
                    📍 {formData.city}, {formData.state}
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setShowSuccessModal(false)
                    setSuccess(false)
                    // Call onSuccessAction if provided
                    if (onSuccessAction) {
                      onSuccessAction()
                    }
                    // Navigate to dashboard my-listings page
                    router.push('/dashboard/my-listing')
                  }}
                  className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  View My Listings
                </button>
                <button
                  onClick={() => {
                    setShowSuccessModal(false)
                    setSuccess(false)
                  }}
                  className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium text-white/60 transition-all hover:text-white"
                >
                  List Another Vehicle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Sell Your Car</h1>
        <p className="text-sm text-white/40 mt-1">List your vehicle and reach thousands of buyers</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Premium Image Upload */}
        <div className="bg-white/5 rounded-xl border border-white/5 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-white/60">
              Vehicle Images *
              <span className="text-xs text-white/30 ml-2">({images.length}/10)</span>
            </label>
            {images.length > 0 && (
              <span className="text-xs text-white/40">Tap image to set as cover</span>
            )}
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {images.map((image) => (
              <div
                key={image.id}
                className={`relative group aspect-square rounded-lg overflow-hidden bg-white/5 border-2 transition-all cursor-pointer ${
                  image.isCover 
                    ? 'border-red-500 ring-2 ring-red-500/30' 
                    : 'border-white/10 hover:border-white/30'
                }`}
                onClick={() => setCoverImage(image.id)}
              >
                <img
                  src={image.preview}
                  alt="Vehicle preview"
                  className="w-full h-full object-cover"
                />
                {image.isCover && (
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-red-500/90 text-white text-[8px] font-medium rounded flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-white" />
                    Cover
                  </div>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeImage(image.id)
                  }}
                  className="absolute top-1 right-1 p-1 bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
                {!image.isCover && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-[10px] font-medium">Set as Cover</span>
                  </div>
                )}
              </div>
            ))}

            {images.length < 10 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-white/10 hover:border-white/30 transition-all flex flex-col items-center justify-center gap-1 hover:bg-white/5 group"
              >
                <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors flex items-center justify-center">
                  <Plus className="w-4 h-4 text-white/40 group-hover:text-white/60" />
                </div>
                <span className="text-[10px] text-white/30">Add Image</span>
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* Vehicle Details */}
        <div className="bg-white/5 rounded-xl border border-white/5 p-4 sm:p-6">
          <h3 className="text-sm font-medium text-white/60 mb-4">Vehicle Details</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-white/60 mb-1">Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                placeholder="e.g. 2023 Porsche 911 Turbo S"
              />
            </div>

            {/* Brand */}
            <div className="relative">
              <label className="block text-xs font-medium text-white/60 mb-1">Brand *</label>
              <div className="relative">
                <input
                  ref={brandInputRef}
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={(e) => handleBrandChange(e.target.value)}
                  onFocus={handleBrandFocus}
                  required
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors pr-8"
                  placeholder="e.g. Porsche"
                  autoComplete="off"
                />
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              </div>
              
              {showBrandSuggestions && brandSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-black/95 border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                  {brandSuggestions.map((brand: string) => (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => selectBrand(brand)}
                      className="w-full px-4 py-2 text-sm text-left text-white/80 hover:bg-white/5 transition-colors flex items-center gap-2"
                    >
                      <Search className="w-3 h-3 text-white/40" />
                      {brand}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Model */}
            <div className="relative">
              <label className="block text-xs font-medium text-white/60 mb-1">Model *</label>
              <div className="relative">
                <input
                  ref={modelInputRef}
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={(e) => handleModelChange(e.target.value)}
                  onFocus={handleModelFocus}
                  required
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors pr-8"
                  placeholder="e.g. 911 Turbo S"
                  autoComplete="off"
                />
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              </div>
              
              {showModelSuggestions && modelSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-black/95 border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                  {modelSuggestions.map((model: string) => (
                    <button
                      key={model}
                      type="button"
                      onClick={() => selectModel(model)}
                      className="w-full px-4 py-2 text-sm text-left text-white/80 hover:bg-white/5 transition-colors flex items-center gap-2"
                    >
                      <Search className="w-3 h-3 text-white/40" />
                      {model}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Trim */}
            <div className="relative">
              <label className="block text-xs font-medium text-white/60 mb-1">Trim (Optional)</label>
              <div className="relative">
                <input
                  ref={trimInputRef}
                  type="text"
                  name="trim"
                  value={formData.trim}
                  onChange={(e) => handleTrimChange(e.target.value)}
                  onFocus={handleTrimFocus}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors pr-8"
                  placeholder="e.g. Turbo S"
                  autoComplete="off"
                />
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              </div>
              
              {showTrimSuggestions && trimSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-black/95 border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                  {trimSuggestions.map((trim: string) => (
                    <button
                      key={trim}
                      type="button"
                      onClick={() => selectTrim(trim)}
                      className="w-full px-4 py-2 text-sm text-left text-white/80 hover:bg-white/5 transition-colors flex items-center gap-2"
                    >
                      <Search className="w-3 h-3 text-white/40" />
                      {trim}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Year */}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1">Year *</label>
              <select
                name="year"
                value={formData.year}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors appearance-none"
              >
                <option value="" className="bg-black">Select year</option>
                {years.map((year: number) => (
                  <option key={year} value={year} className="bg-black">{year}</option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1">Price ($) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min={0}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                placeholder="245000"
              />
            </div>

            {/* Mileage */}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1">Mileage</label>
              <input
                type="text"
                name="mileage"
                value={formData.mileage}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                placeholder="e.g. 4,200 mi"
              />
            </div>

            {/* Fuel Type */}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1">Fuel Type</label>
              <select
                name="fuelType"
                value={formData.fuelType}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors appearance-none"
              >
                <option value="" className="bg-black">Select fuel type</option>
                {fuelTypes.map((type: string) => (
                  <option key={type} value={type.toLowerCase()} className="bg-black">{type}</option>
                ))}
              </select>
            </div>

            {/* Transmission */}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1">Transmission</label>
              <select
                name="transmission"
                value={formData.transmission}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors appearance-none"
              >
                <option value="" className="bg-black">Select transmission</option>
                {transmissions.map((trans: string) => (
                  <option key={trans} value={trans.toLowerCase()} className="bg-black">{trans}</option>
                ))}
              </select>
            </div>

            {/* Exterior Color - Compact Scrollable */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-white/60 mb-2">Exterior Color</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => scrollColors('left', colorScrollRef)}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-black/80 rounded-full hover:bg-black/90 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-white/60" />
                </button>
                <div
                  ref={colorScrollRef}
                  className="flex gap-2 overflow-x-auto scrollbar-hide px-6 py-1"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {colorPalette.map((color: { name: string, hex: string }) => (
                    <button
                      key={`ext-${color.name}`}
                      type="button"
                      onClick={() => selectExteriorColor(color.name)}
                      className={`relative flex-shrink-0 w-8 h-8 rounded-full border-2 transition-all ${
                        formData.color === color.name 
                          ? 'border-red-500 scale-110 ring-2 ring-red-500/30' 
                          : 'border-white/20 hover:border-white/50 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      {formData.color === color.name && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-white drop-shadow-lg" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => scrollColors('right', colorScrollRef)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-black/80 rounded-full hover:bg-black/90 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-white/60" />
                </button>
              </div>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="w-full mt-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                placeholder="Or type color name"
              />
            </div>

            {/* Interior Color - Compact Scrollable */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-white/60 mb-2">Interior Color</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => scrollColors('left', interiorColorScrollRef)}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-black/80 rounded-full hover:bg-black/90 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-white/60" />
                </button>
                <div
                  ref={interiorColorScrollRef}
                  className="flex gap-2 overflow-x-auto scrollbar-hide px-6 py-1"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {colorPalette.map((color: { name: string, hex: string }) => (
                    <button
                      key={`int-${color.name}`}
                      type="button"
                      onClick={() => selectInteriorColor(color.name)}
                      className={`relative flex-shrink-0 w-8 h-8 rounded-full border-2 transition-all ${
                        formData.interiorColor === color.name 
                          ? 'border-red-500 scale-110 ring-2 ring-red-500/30' 
                          : 'border-white/20 hover:border-white/50 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      {formData.interiorColor === color.name && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-white drop-shadow-lg" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => scrollColors('right', interiorColorScrollRef)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-black/80 rounded-full hover:bg-black/90 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-white/60" />
                </button>
              </div>
              <input
                type="text"
                name="interiorColor"
                value={formData.interiorColor}
                onChange={handleChange}
                className="w-full mt-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                placeholder="Or type color name"
              />
            </div>

            {/* Engine Type with Suggestions */}
            <div className="relative">
              <label className="block text-xs font-medium text-white/60 mb-1">Engine Type</label>
              <div className="relative">
                <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  ref={engineInputRef}
                  type="text"
                  name="engineType"
                  value={formData.engineType}
                  onChange={(e) => handleEngineChange(e.target.value)}
                  onFocus={handleEngineFocus}
                  className="w-full pl-10 pr-8 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                  placeholder="e.g. V8, V6, Electric"
                  autoComplete="off"
                />
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              </div>
              
              {showEngineSuggestions && engineSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-black/95 border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                  {engineSuggestions.map((engine: string) => (
                    <button
                      key={engine}
                      type="button"
                      onClick={() => selectEngine(engine)}
                      className="w-full px-4 py-2 text-sm text-left text-white/80 hover:bg-white/5 transition-colors flex items-center gap-2"
                    >
                      <Search className="w-3 h-3 text-white/40" />
                      {engine}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* VIN Number */}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1">VIN Number</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  name="vin"
                  value={formData.vin}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                  placeholder="17-character VIN"
                />
              </div>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1">Condition *</label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors appearance-none"
              >
                <option value="" className="bg-black">Select condition</option>
                {conditions.map((condition: string) => (
                  <option key={condition} value={condition.toLowerCase()} className="bg-black">{condition}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors appearance-none"
              >
                <option value="" className="bg-black">Select category</option>
                {categories.map((category: string) => (
                  <option key={category} value={category.toLowerCase()} className="bg-black">{category}</option>
                ))}
              </select>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                  placeholder="Phone number"
                />
              </div>
              <p className="text-[10px] text-white/30 mt-1">This will be displayed for buyers to contact you</p>
            </div>

            {/* Location - Custom Location Selector */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-white/60 mb-2">Location *</label>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                {/* State Dropdown */}
                <div className="relative">
                  <label className="block text-[10px] text-white/40 mb-1">State</label>
                  <button
                    ref={stateButtonRef}
                    type="button"
                    onClick={toggleStateDropdown}
                    className={`w-full flex items-center justify-between px-3 py-2 bg-white/5 border rounded-xl text-sm transition-all ${
                      formData.state 
                        ? 'border-red-500/50 text-white bg-red-500/5' 
                        : 'border-white/10 text-white/60 hover:border-white/30'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-white/40" />
                      {formData.state || 'Select State'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${isStateDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isStateDropdownOpen && (
                    <div 
                      ref={stateDropdownRef}
                      className="absolute z-20 w-full mt-1 bg-black/95 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                    >
                      <div className="p-2 border-b border-white/5">
                        <input
                          type="text"
                          placeholder="Search states..."
                          value={stateSearch}
                          onChange={(e) => setStateSearch(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white/5 text-white text-xs rounded-lg border border-white/10 focus:border-red-500/50 focus:outline-none placeholder:text-white/30"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {isLoadingStates ? (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
                          </div>
                        ) : filteredStates.length === 0 ? (
                          <div className="text-center py-6 text-white/40 text-xs">
                            No states found
                          </div>
                        ) : (
                          filteredStates.map((state: string) => (
                            <button
                              key={state}
                              type="button"
                              onClick={() => selectState(state)}
                              className={`w-full px-4 py-2 text-sm text-left transition-colors flex items-center gap-2 ${
                                formData.state === state
                                  ? 'bg-red-500/10 text-red-500'
                                  : 'text-white/80 hover:bg-white/5'
                              }`}
                            >
                              {formData.state === state && <Check className="w-3.5 h-3.5" />}
                              {state}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* City Dropdown */}
                <div className="relative">
                  <label className="block text-[10px] text-white/40 mb-1">City</label>
                  <button
                    ref={cityButtonRef}
                    type="button"
                    onClick={toggleCityDropdown}
                    disabled={!formData.state}
                    className={`w-full flex items-center justify-between px-3 py-2 bg-white/5 border rounded-xl text-sm transition-all ${
                      !formData.state
                        ? 'border-white/5 text-white/30 cursor-not-allowed'
                        : formData.city 
                          ? 'border-red-500/50 text-white bg-red-500/5' 
                          : 'border-white/10 text-white/60 hover:border-white/30'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-white/40" />
                      {formData.city || (formData.state ? 'Select City' : 'Select State First')}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${isCityDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isCityDropdownOpen && formData.state && (
                    <div 
                      ref={cityDropdownRef}
                      className="absolute z-20 w-full mt-1 bg-black/95 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                    >
                      <div className="p-2 border-b border-white/5">
                        <input
                          type="text"
                          placeholder="Search cities..."
                          value={citySearch}
                          onChange={(e) => setCitySearch(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white/5 text-white text-xs rounded-lg border border-white/10 focus:border-red-500/50 focus:outline-none placeholder:text-white/30"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {isLoadingCities ? (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
                          </div>
                        ) : filteredCities.length === 0 ? (
                          <div className="text-center py-6 text-white/40 text-xs">
                            No cities found for this state
                          </div>
                        ) : (
                          filteredCities.map((city: string) => (
                            <button
                              key={city}
                              type="button"
                              onClick={() => selectCity(city)}
                              className={`w-full px-4 py-2 text-sm text-left transition-colors flex items-center gap-2 ${
                                formData.city === city
                                  ? 'bg-red-500/10 text-red-500'
                                  : 'text-white/80 hover:bg-white/5'
                              }`}
                            >
                              {formData.city === city && <Check className="w-3.5 h-3.5" />}
                              {city}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Selected location display */}
                {formData.state && formData.city && (
                  <div className="flex items-center gap-2 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-xs text-green-400">
                      Location selected: {formData.city}, {formData.state}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Full Address */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-white/60 mb-1">Full Address (Optional)</label>
              <div className="relative">
                <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  name="fullAddress"
                  value={formData.fullAddress}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                  placeholder="e.g. 24 Admiralty Way, Lekki, Lagos"
                />
              </div>
              <p className="text-[10px] text-white/30 mt-1">
                Enter the full address where the vehicle is located
              </p>
            </div>

            {/* Description - Rich Text Editor */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-white/60 mb-1.5">
                Description *
              </label>
              <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-red-500/50 transition-colors">
                <ReactQuill
                  theme="snow"
                  value={formData.description}
                  onChange={handleDescriptionChange}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Describe your vehicle in detail..."
                  className="text-white bg-transparent [&_.ql-toolbar]:border-white/10 [&_.ql-toolbar]:bg-white/5 [&_.ql-toolbar_.ql-stroke]:stroke-white/60 [&_.ql-toolbar_.ql-fill]:fill-white/60 [&_.ql-toolbar_.ql-picker-label]:text-white/60 [&_.ql-toolbar_.ql-picker-options]:bg-black [&_.ql-toolbar_.ql-picker-options]:border-white/10 [&_.ql-toolbar_.ql-picker-options_.ql-picker-item]:text-white/60 [&_.ql-toolbar_.ql-picker-options_.ql-picker-item:hover]:text-white [&_.ql-container]:border-none [&_.ql-editor]:min-h-[150px] [&_.ql-editor]:text-white [&_.ql-editor_.ql-blank]:text-white/30"
                />
              </div>
              <p className="text-[10px] text-white/30 mt-1">
                You can format your description with bold, italic, lists, and more
              </p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-red-500 hover:bg-red-600 rounded-xl font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-red-500/25"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Listing Vehicle...
            </>
          ) : (
            'List Your Vehicle'
          )}
        </button>
      </form>
    </div>
  )
}