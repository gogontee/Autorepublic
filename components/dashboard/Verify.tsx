'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  Camera,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  X,
  Lock,
  FileCheck,
  Clock,
  RotateCcw,
  UserCheck,
  CreditCard,
  Users,
  Globe
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface VerifyProps {
  userData?: {
    user: any
    profile: any
    session: any
  }
  isOpen?: boolean
  onClose?: () => void
  onVerified?: () => void
}

type Step = 'intro' | 'selfie' | 'id-select' | 'id-upload' | 'submitting' | 'success' | 'already-submitted'

const ID_TYPES = [
  { id: 'nin', label: 'NIN (National ID)', icon: CreditCard, hint: 'National Identification Number slip/card' },
  { id: 'drivers_license', label: "Driver's License", icon: FileCheck, hint: 'Valid Nigerian driver\'s license' },
  { id: 'voters_card', label: 'Voter\'s Card', icon: Users, hint: 'Permanent Voter\'s Card (PVC)' },
  { id: 'international_passport', label: 'International Passport', icon: Globe, hint: 'Nigerian international passport data page' },
] as const

export default function Verify({ userData, isOpen = true, onClose, onVerified }: VerifyProps) {
  const { user, profile } = userData || {}

  const [step, setStep] = useState<Step>('intro')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Selfie capture
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // ID upload
  const [idType, setIdType] = useState<string>('')
  const [idFile, setIdFile] = useState<File | null>(null)
  const [idPreview, setIdPreview] = useState<string | null>(null)
  const idFileInputRef = useRef<HTMLInputElement>(null)

  // ==========================================
  // Check if user already has a pending/approved request
  // ==========================================
  useEffect(() => {
    if (!user?.id) return
    const check = async () => {
      const { data, error } = await supabase
        .from('verify')
        .select('status')
        .eq('user_id', user.id)
        .in('status', ['pending', 'approved'])
        .maybeSingle()

      if (!error && data) {
        setStep('already-submitted')
      }
    }
    check()
  }, [user?.id])

  // ==========================================
  // CAMERA LOGIC
  // ==========================================
  const startCamera = useCallback(async () => {
    setCameraError('')
    setCameraActive(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',  // front camera for selfie
          width: { ideal: 720 },
          height: { ideal: 720 },
        },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch (err: any) {
      console.error('Camera error:', err)
      setCameraError(
        err?.name === 'NotAllowedError'
          ? 'Camera access was denied. Please allow camera access in your browser settings.'
          : err?.name === 'NotFoundError'
          ? 'No camera found on this device.'
          : 'Could not start the camera. Please try uploading a photo instead.'
      )
      setCameraActive(false)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }, [])

  // Cleanup camera on unmount or when leaving the selfie step
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  // Stop camera when step changes away from selfie
  useEffect(() => {
    if (step !== 'selfie') {
      stopCamera()
    }
  }, [step, stopCamera])

  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current

    const size = Math.min(video.videoWidth, video.videoHeight)
    canvas.width = 720
    canvas.height = 720

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Center crop to a square
    const sx = (video.videoWidth - size) / 2
    const sy = (video.videoHeight - size) / 2
    ctx.drawImage(video, sx, sy, size, size, 0, 0, 720, 720)

    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: 'image/jpeg' })
        setSelfieFile(file)
        setSelfiePreview(URL.createObjectURL(blob))
        stopCamera()
      },
      'image/jpeg',
      0.9
    )
  }

  const retakeSelfie = () => {
    if (selfiePreview) URL.revokeObjectURL(selfiePreview)
    setSelfieFile(null)
    setSelfiePreview(null)
    startCamera()
  }

  // Fallback: user uploads selfie from gallery (in case camera fails)
  const handleSelfieUploadFallback = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }
    setSelfieFile(file)
    setSelfiePreview(URL.createObjectURL(file))
    stopCamera()
  }

  // ==========================================
  // ID UPLOAD
  // ==========================================
  const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }
    setError('')
    setIdFile(file)
    setIdPreview(URL.createObjectURL(file))
  }

  const resetIdUpload = () => {
    if (idPreview) URL.revokeObjectURL(idPreview)
    setIdFile(null)
    setIdPreview(null)
    if (idFileInputRef.current) idFileInputRef.current.value = ''
  }

  // ==========================================
  // SUBMISSION
  // ==========================================
  const handleSubmit = async () => {
    if (!user?.id || !selfieFile || !idFile || !idType) {
      setError('Please complete all steps')
      return
    }

    setSubmitting(true)
    setError('')
    setStep('submitting')

    try {
      const ts = Date.now()
      const selfiePath = `${user.id}/selfie-${ts}.jpg`
      const idExt = idFile.name.split('.').pop() || 'jpg'
      const idPath = `${user.id}/id-${ts}.${idExt}`

      // Upload selfie
      const { error: selfieError } = await supabase.storage
        .from('verifications')
        .upload(selfiePath, selfieFile, { cacheControl: '3600', upsert: false })

      if (selfieError) throw new Error(`Selfie upload failed: ${selfieError.message}`)

      // Upload ID
      const { error: idError } = await supabase.storage
        .from('verifications')
        .upload(idPath, idFile, { cacheControl: '3600', upsert: false })

      if (idError) throw new Error(`ID upload failed: ${idError.message}`)

      // Insert verification row (paths only — the bucket is private, so we don't
      // store public URLs. Admin reads via signed URLs.)
      const { error: insertError } = await supabase
        .from('verify')
        .insert({
          user_id: user.id,
          selfie_url: selfiePath,
          id_type: idType,
          id_card_url: idPath,
          status: 'pending',
        })

      if (insertError) throw new Error(`Submission failed: ${insertError.message}`)

      setStep('success')
      if (onVerified) onVerified()
    } catch (err: any) {
      console.error('Verification submit error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
      setStep('id-upload')
    } finally {
      setSubmitting(false)
    }
  }

  // ==========================================
  // CLEANUP
  // ==========================================
  useEffect(() => {
    return () => {
      if (selfiePreview) URL.revokeObjectURL(selfiePreview)
      if (idPreview) URL.revokeObjectURL(idPreview)
    }
  }, [selfiePreview, idPreview])

  // ==========================================
  // RENDER
  // ==========================================
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 bg-black/30 backdrop-blur-[2px]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="relative w-full max-w-md bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Progress bar */}
        {step !== 'already-submitted' && (
          <div className="h-1 bg-white/5">
            <motion.div
              className="h-full bg-red-500"
              initial={{ width: '0%' }}
              animate={{
                width:
                  step === 'intro' ? '10%'
                  : step === 'selfie' ? '35%'
                  : step === 'id-select' ? '60%'
                  : step === 'id-upload' ? '85%'
                  : step === 'submitting' ? '95%'
                  : '100%',
              }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        )}

        {/* Close button */}
        {onClose && step !== 'submitting' && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-white/50" />
          </button>
        )}

        <div className="p-6">
          <AnimatePresence mode="wait">

            {/* ============ INTRO ============ */}
            {step === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/20 flex items-center justify-center">
                    <Shield className="w-8 h-8 text-red-400" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-white text-center mb-2">
                  Verify Your Identity
                </h2>
                <p className="text-sm text-white/60 text-center leading-relaxed mb-5">
                  To keep AutoRepublic safe for everyone, we need to verify your identity before you start selling.
                </p>

                <div className="space-y-2.5 mb-6">
                  <div className="flex items-start gap-2.5 p-3 bg-white/5 rounded-xl border border-white/5">
                    <Lock className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-white">Your data is confidential</p>
                      <p className="text-[11px] text-white/50 mt-0.5">
                        Your ID and selfie will <span className="text-white/80 font-medium">never</span> be shown publicly on AutoRepublic. Only our verification team sees them.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 bg-white/5 rounded-xl border border-white/5">
                    <UserCheck className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-white">Why we verify</p>
                      <p className="text-[11px] text-white/50 mt-0.5">
                        Verification protects buyers and sellers from fraud, scams, and fake listings.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 bg-white/5 rounded-xl border border-white/5">
                    <Clock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-white">Takes about 2 minutes</p>
                      <p className="text-[11px] text-white/50 mt-0.5">
                        You'll take a selfie, upload a valid ID, and we'll review within 24 hours.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setStep('selfie')}
                  className="w-full py-3 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-red-500/25 flex items-center justify-center gap-2"
                >
                  Start Verification
                  <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* ============ SELFIE ============ */}
            {step === 'selfie' && (
              <motion.div
                key="selfie"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Camera className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Take a selfie</h2>
                    <p className="text-[11px] text-white/40">Look directly at the camera in good lighting</p>
                  </div>
                </div>

                {error && (
                  <div className="mb-3 p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {cameraError && (
                  <div className="mb-3 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-xs flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>{cameraError}</span>
                  </div>
                )}

                <div className="relative aspect-square w-full bg-black rounded-xl overflow-hidden border border-white/10 mb-4">
                  {!selfiePreview && cameraActive && (
                    <>
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                        autoPlay
                      />
                      {/* Circular overlay guide */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-4/5 aspect-square rounded-full border-2 border-white/30 border-dashed" />
                      </div>
                    </>
                  )}

                  {!selfiePreview && !cameraActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                      <Camera className="w-12 h-12 text-white/20" />
                      <p className="text-xs text-white/40">Camera not started</p>
                    </div>
                  )}

                  {selfiePreview && (
                    <img
                      src={selfiePreview}
                      alt="Selfie preview"
                      className="w-full h-full object-cover"
                    />
                  )}

                  <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* Actions */}
                {!selfiePreview && !cameraActive && (
                  <div className="space-y-2">
                    <button
                      onClick={startCamera}
                      className="w-full py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-medium text-white transition-all flex items-center justify-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      Open Camera
                    </button>
                    <label className="w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-medium text-white/60 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      Upload from gallery instead
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleSelfieUploadFallback}
                      />
                    </label>
                  </div>
                )}

                {!selfiePreview && cameraActive && (
                  <button
                    onClick={captureSelfie}
                    className="w-full py-3 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-medium text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/25"
                  >
                    <Camera className="w-4 h-4" />
                    Capture Selfie
                  </button>
                )}

                {selfiePreview && (
                  <div className="space-y-2">
                    <button
                      onClick={() => setStep('id-select')}
                      className="w-full py-3 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-medium text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/25"
                    >
                      Looks Good, Continue
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={retakeSelfie}
                      className="w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-medium text-white/60 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Retake
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* ============ ID SELECT ============ */}
            {step === 'id-select' && (
              <motion.div
                key="id-select"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <FileCheck className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Choose your ID type</h2>
                    <p className="text-[11px] text-white/40">Select one valid government-issued ID</p>
                  </div>
                </div>

                <div className="space-y-2 mb-5">
                  {ID_TYPES.map((t) => {
                    const Icon = t.icon
                    const isSelected = idType === t.id
                    return (
                      <button
                        key={t.id}
                        onClick={() => setIdType(t.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                          isSelected
                            ? 'bg-red-500/10 border-red-500/40'
                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-red-500/20' : 'bg-white/5'
                        }`}>
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-red-400' : 'text-white/50'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-white/80'}`}>
                            {t.label}
                          </p>
                          <p className="text-[10px] text-white/40 mt-0.5">{t.hint}</p>
                        </div>
                        {isSelected && (
                          <CheckCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        )}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => setStep('id-upload')}
                  disabled={!idType}
                  className={`w-full py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    idType
                      ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25'
                      : 'bg-white/5 text-white/30 cursor-not-allowed'
                  }`}
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* ============ ID UPLOAD ============ */}
            {step === 'id-upload' && (
              <motion.div
                key="id-upload"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Upload className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Upload your ID</h2>
                    <p className="text-[11px] text-white/40">
                      {ID_TYPES.find((t) => t.id === idType)?.label || 'Your selected ID'}
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="mb-3 p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="aspect-[16/10] w-full bg-white/5 rounded-xl border-2 border-dashed border-white/10 overflow-hidden mb-4">
                  {idPreview ? (
                    <img
                      src={idPreview}
                      alt="ID preview"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/[0.02] transition-colors">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                        <Upload className="w-5 h-5 text-white/40" />
                      </div>
                      <p className="text-sm text-white/60">Tap to upload</p>
                      <p className="text-[10px] text-white/30">JPG, PNG, or WebP · max 5MB</p>
                      <input
                        ref={idFileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleIdUpload}
                      />
                    </label>
                  )}
                </div>

                {idPreview && (
                  <div className="mb-4 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-[11px] flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>Your ID has been added. Make sure all text is clearly visible.</span>
                  </div>
                )}

                <div className="space-y-2">
                  <button
                    onClick={handleSubmit}
                    disabled={!idFile}
                    className={`w-full py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      idFile
                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25'
                        : 'bg-white/5 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    Submit for Verification
                  </button>
                  {idPreview && (
                    <button
                      onClick={resetIdUpload}
                      className="w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-medium text-white/60 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Choose different file
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* ============ SUBMITTING ============ */}
            {step === 'submitting' && (
              <motion.div
                key="submitting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-8 text-center"
              >
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-red-400 animate-spin" />
                  </div>
                </div>
                <h2 className="text-base font-bold text-white mb-1">Submitting your documents</h2>
                <p className="text-xs text-white/50">This will only take a moment...</p>
              </motion.div>
            )}

            {/* ============ SUCCESS ============ */}
            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="flex justify-center mb-4"
                >
                  <div className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-emerald-400" />
                  </div>
                </motion.div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Verification Submitted! 🎉
                </h2>
                <p className="text-sm text-white/60 leading-relaxed mb-5">
                  Our team will review your documents and get back to you within <span className="text-white font-medium">24 hours</span>.
                  You'll receive a notification once you're approved and can start selling on AutoRepublic.
                </p>

                <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl mb-5 text-left">
                  <div className="flex items-start gap-2.5">
                    <Lock className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-emerald-400 font-medium">Your data stays private</p>
                      <p className="text-[11px] text-white/50 mt-0.5">
                        We never share your ID or selfie. It's used only for identity verification.
                      </p>
                    </div>
                  </div>
                </div>

                {onClose && (
                  <button
                    onClick={onClose}
                    className="w-full py-3 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-medium text-white transition-all shadow-lg shadow-red-500/25"
                  >
                    Got it, thanks
                  </button>
                )}
              </motion.div>
            )}

            {/* ============ ALREADY SUBMITTED ============ */}
            {step === 'already-submitted' && (
              <motion.div
                key="already"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
                    <Clock className="w-8 h-8 text-amber-400" />
                  </div>
                </div>
                <h2 className="text-lg font-bold text-white mb-2">
                  Verification in Progress
                </h2>
                <p className="text-sm text-white/60 leading-relaxed mb-5">
                  You already have a pending verification request. Our team will review it within 24 hours
                  and notify you once you're verified.
                </p>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium text-white/60 hover:text-white transition-all"
                  >
                    Close
                  </button>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}