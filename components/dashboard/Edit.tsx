// components/dashboard/Edit.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
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
  ChevronRight
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

interface EditProps {
  vehicleId: string
  onClose?: () => void
  onSuccess?: () => void
  onReturnToStore?: () => void
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
const categories = ['Sedan', 'SUV', 'Sports', 'Luxury', 'Electric', 'Truck', 'Van', 'Coupe', 'Convertible', 'Hatchback', 'Wagon']

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

// Quill modules configuration - REMOVED link, image, and code-block
const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ color: [] }, { background: [] }],
    ['clean']
  ],
}

// Removed 'link', 'image', and 'code-block' from formats
const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'color', 'background'
]

export default function Edit({ vehicleId, onClose, onSuccess, onReturnToStore }: EditProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [images, setImages] = useState<ImageFile[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  
  // Refs for autocomplete
  const brandInputRef = useRef<HTMLInputElement>(null)
  const modelInputRef = useRef<HTMLInputElement>(null)
  const trimInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const engineInputRef = useRef<HTMLInputElement>(null)
  const colorScrollRef = useRef<HTMLDivElement>(null)
  const interiorColorScrollRef = useRef<HTMLDivElement>(null)

  // Autocomplete states
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

  const [formData, setFormData] = useState({
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
    phone: '',
  })

  // Fetch vehicle data
  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .eq('id', vehicleId)
          .single()

        if (error) {
          setError('Failed to load vehicle data')
          setLoading(false)
          return
        }

        if (data) {
          setFormData({
            title: data.title || '',
            brand: data.brand || '',
            model: data.model || '',
            trim: data.trim || '',
            year: data.year?.toString() || '',
            price: data.price?.toString() || '',
            mileage: data.mileage || '',
            fuelType: data.fuel_type || '',
            transmission: data.transmission || '',
            color: data.color || '',
            interiorColor: data.interior_color || '',
            engineType: data.engine_type || '',
            vin: data.vin || '',
            description: data.description || '',
            condition: data.condition || '',
            category: data.category || '',
            city: data.city || '',
            state: data.state || '',
            country: data.country || '',
            phone: data.phone || '',
          })
          
          // Set existing images
          if (data.images && data.images.length > 0) {
            setExistingImages(data.images)
          }
          
          // Create image objects from existing images
          const imageFiles: ImageFile[] = data.images?.map((url: string, index: number) => ({
            file: null as any,
            preview: url,
            id: `existing-${index}`,
            isCover: index === 0
          })) || []
          
          setImages(imageFiles)
        }
        setLoading(false)
      } catch (err) {
        console.error('Error fetching vehicle:', err)
        setError('An unexpected error occurred')
        setLoading(false)
      }
    }

    if (vehicleId) {
      fetchVehicle()
      fetchAllBrands()
    }
  }, [vehicleId])

  // Fetch all brands
  const fetchAllBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('vehiclelist')
        .select('brand')
        .order('brand')

      if (error) throw error

      const uniqueBrands = [...new Set(data.map(item => item.brand))]
      setAllBrands(uniqueBrands)
    } catch (err) {
      console.error('Error fetching brands:', err)
    }
  }

  // Fetch models for brand
  useEffect(() => {
    const fetchModelsForBrand = async () => {
      if (!formData.brand) {
        setAllModels([])
        return
      }

      try {
        const { data, error } = await supabase
          .from('vehiclelist')
          .select('model')
          .eq('brand', formData.brand)
          .order('model')

        if (error) throw error

        const uniqueModels = [...new Set(data.map(item => item.model))]
        setAllModels(uniqueModels)
      } catch (err) {
        console.error('Error fetching models:', err)
      }
    }

    fetchModelsForBrand()
  }, [formData.brand])

  // Fetch trims for model
  useEffect(() => {
    const fetchTrimsForModel = async () => {
      if (!formData.model) {
        setAllTrims([])
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
        }
      } catch (err) {
        console.error('Error fetching trims:', err)
      }
    }

    fetchTrimsForModel()
  }, [formData.model])

  // Handle brand input
  const handleBrandFocus = () => {
    if (allBrands.length > 0) {
      setBrandSuggestions(allBrands)
      setShowBrandSuggestions(true)
    }
  }

  const handleBrandChange = (value: string) => {
    setFormData(prev => ({ ...prev, brand: value }))
    if (value.length > 0) {
      const filtered = allBrands.filter(brand => 
        brand.toLowerCase().includes(value.toLowerCase())
      )
      setBrandSuggestions(filtered)
      setShowBrandSuggestions(filtered.length > 0)
    } else {
      setBrandSuggestions(allBrands)
      setShowBrandSuggestions(allBrands.length > 0)
    }
  }

  const selectBrand = (brand: string) => {
    setFormData(prev => ({ ...prev, brand }))
    setShowBrandSuggestions(false)
    setBrandSuggestions([])
    setFormData(prev => ({ ...prev, model: '', trim: '' }))
  }

  // Handle model input
  const handleModelFocus = () => {
    if (formData.brand && allModels.length > 0) {
      setModelSuggestions(allModels)
      setShowModelSuggestions(true)
    }
  }

  const handleModelChange = (value: string) => {
    setFormData(prev => ({ ...prev, model: value }))
    if (value.length > 0) {
      const filtered = allModels.filter(model => 
        model.toLowerCase().includes(value.toLowerCase())
      )
      setModelSuggestions(filtered)
      setShowModelSuggestions(filtered.length > 0)
    } else {
      setModelSuggestions(allModels)
      setShowModelSuggestions(allModels.length > 0)
    }
  }

  const selectModel = (model: string) => {
    setFormData(prev => ({ ...prev, model }))
    setShowModelSuggestions(false)
    setModelSuggestions([])
    setFormData(prev => ({ ...prev, trim: '' }))
  }

  // Handle trim input
  const handleTrimFocus = () => {
    if (formData.model && allTrims.length > 0) {
      setTrimSuggestions(allTrims)
      setShowTrimSuggestions(true)
    }
  }

  const handleTrimChange = (value: string) => {
    setFormData(prev => ({ ...prev, trim: value }))
    if (value.length > 0) {
      const filtered = allTrims.filter(trim => 
        trim.toLowerCase().includes(value.toLowerCase())
      )
      setTrimSuggestions(filtered)
      setShowTrimSuggestions(filtered.length > 0)
    } else {
      setTrimSuggestions(allTrims)
      setShowTrimSuggestions(allTrims.length > 0)
    }
  }

  const selectTrim = (trim: string) => {
    setFormData(prev => ({ ...prev, trim }))
    setShowTrimSuggestions(false)
    setTrimSuggestions([])
  }

  // Handle engine input
  const handleEngineFocus = () => {
    setEngineSuggestions(engineTypes)
    setShowEngineSuggestions(true)
  }

  const handleEngineChange = (value: string) => {
    setFormData(prev => ({ ...prev, engineType: value }))
    if (value.length > 0) {
      const filtered = engineTypes.filter(type => 
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
    setFormData(prev => ({ ...prev, engineType: engine }))
    setShowEngineSuggestions(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  // Handle description change for rich text
  const handleDescriptionChange = (value: string) => {
    setFormData(prev => ({ ...prev, description: value }))
    if (error) setError('')
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
    setImages(prev => [...prev, ...newImages])
  }

  const removeImage = (id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id)
      const removed = prev.find(img => img.id === id)
      if (removed && removed.preview.startsWith('blob:')) {
        URL.revokeObjectURL(removed.preview)
      }
      
      if (removed?.isCover && filtered.length > 0) {
        filtered[0].isCover = true
      }
      
      return filtered
    })
  }

  const setCoverImage = (id: string) => {
    setImages(prev => prev.map(img => ({
      ...img,
      isCover: img.id === id
    })))
  }

  const scrollColors = (direction: 'left' | 'right', ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      const scrollAmount = 120
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const selectExteriorColor = (colorName: string) => {
    setFormData(prev => ({ ...prev, color: colorName }))
  }

  const selectInteriorColor = (colorName: string) => {
    setFormData(prev => ({ ...prev, interiorColor: colorName }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      // Upload new images
      const uploadedUrls: string[] = []
      let coverImageUrl = ''
      
      // Keep existing images that haven't been removed
      const existingImageUrls = images
        .filter(img => img.id.startsWith('existing-'))
        .map(img => img.preview)

      // Upload new images
      const newImages = images.filter(img => !img.id.startsWith('existing-'))
      
      for (const image of newImages) {
        if (!image.file) continue
        const fileExt = image.file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('vehicle-images')
          .upload(fileName, image.file)

        if (uploadError) {
          throw new Error(`Failed to upload image: ${uploadError.message}`)
        }

        const { data: urlData } = supabase.storage
          .from('vehicle-images')
          .getPublicUrl(fileName)

        uploadedUrls.push(urlData.publicUrl)
        if (image.isCover) {
          coverImageUrl = urlData.publicUrl
        }
      }

      // Combine existing and new images
      const allImageUrls = [...existingImageUrls, ...uploadedUrls]
      
      // If no cover image was uploaded, check if any existing image is cover
      if (!coverImageUrl && allImageUrls.length > 0) {
        const coverImage = images.find(img => img.isCover)
        if (coverImage) {
          coverImageUrl = coverImage.preview
        } else {
          coverImageUrl = allImageUrls[0]
        }
      }

      const { error: updateError } = await supabase
        .from('vehicles')
        .update({
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
          images: allImageUrls,
          cover_image: coverImageUrl,
          city: formData.city || null,
          state: formData.state || null,
          country: formData.country || null,
          phone: formData.phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', vehicleId)

      if (updateError) {
        throw new Error(`Failed to update listing: ${updateError.message}`)
      }

      // Show success modal
      setShowSuccessModal(true)
      
      // Call onSuccess callback if provided
      if (onSuccess) onSuccess()

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
      setSubmitting(false)
    }
  }

  const handleSuccessClose = () => {
    setShowSuccessModal(false)
    setSubmitting(false)
    // Call the return to store callback first
    if (onReturnToStore) {
      onReturnToStore()
    }
    // Then close the edit modal
    if (onClose) onClose()
    // Finally refresh the page
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        <span className="text-white/60 ml-3">Loading vehicle details...</span>
      </div>
    )
  }

  if (error && !loading) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-white/60">{error}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-white text-sm font-medium transition-colors"
          >
            Close
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Success Modal - Center Screen Popup */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 max-w-md w-full border border-white/10 shadow-2xl animate-in zoom-in duration-300">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <ThumbsUp className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Vehicle Updated! 🎉</h2>
              <p className="text-sm text-white/60 mb-2">
                Your vehicle listing has been successfully updated.
              </p>
              <p className="text-sm text-white/40 mb-6">
                The changes have been saved and your listing is now updated.
              </p>
              <div className="border-t border-white/5 my-4" />
              <div className="bg-white/5 rounded-xl p-4 mb-6 text-left">
                <p className="text-xs text-white/40 mb-1">Updated Listing</p>
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
              </div>
              <button
                onClick={handleSuccessClose}
                className="w-full px-4 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Return to My Store
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload */}
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
                  {brandSuggestions.map((brand) => (
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
                  {modelSuggestions.map((model) => (
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
                  {trimSuggestions.map((trim) => (
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
                {years.map((year) => (
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
                {fuelTypes.map((type) => (
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
                {transmissions.map((trans) => (
                  <option key={trans} value={trans.toLowerCase()} className="bg-black">{trans}</option>
                ))}
              </select>
            </div>

            {/* Exterior Color */}
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
                  {colorPalette.map((color) => (
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

            {/* Interior Color */}
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
                  {colorPalette.map((color) => (
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

            {/* Engine Type */}
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
                  {engineSuggestions.map((engine) => (
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
                {conditions.map((condition) => (
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
                {categories.map((category) => (
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

            {/* Location */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-white/60 mb-1">Location</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                    placeholder="City"
                  />
                </div>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                  placeholder="State"
                />
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                  placeholder="Country"
                />
              </div>
            </div>

            {/* Description - Rich Text Editor (without link, image, and code-block) */}
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
                You can format your description with bold, italic, lists, and colors
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-medium text-white/60 hover:text-white transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3 bg-red-500 hover:bg-red-600 rounded-xl font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-red-500/25"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}