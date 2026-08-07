'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface Ad {
  id: number
  user_id: string
  video: string | null
  image: string | null
  text: string | null
  ads_link: string | null
  approval: boolean
  pause: boolean
  start_time: string
  end_time: string
  created_at: string
  updated_at: string
  click_count: number
  view_count: number
}

interface AdsProps {
  autoPlay?: boolean
  interval?: number
  showControls?: boolean
  className?: string
  shuffleInterval?: number
}

export default function Ads({ 
  autoPlay = true, 
  interval = 5000, 
  showControls = true,
  className = '',
  shuffleInterval = 30000
}: AdsProps) {
  const [allAds, setAllAds] = useState<Ad[]>([])
  const [displayOrder, setDisplayOrder] = useState<number[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay)
  const [isPaused, setIsPaused] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [showAd, setShowAd] = useState(true)
  const [videoDuration, setVideoDuration] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isSwitchingRef = useRef(false)
  const isTrackingClickRef = useRef(false)
  const isTrackingViewRef = useRef(false)
  const trackedViewsRef = useRef<Set<number>>(new Set())

  // Get the appropriate display duration for the current ad
  const getAdDuration = useCallback((ad: Ad): number => {
    if (ad.video) {
      return videoDuration > 0 ? videoDuration * 1000 : 10000
    } else if (ad.image) {
      return 10000
    } else {
      return 5000
    }
  }, [videoDuration])

  // Generate display order - simple sequential order
  const generateDisplayOrder = useCallback((ads: Ad[]) => {
    if (ads.length === 0) return []
    return ads.map((_, index) => index)
  }, [])

  // Track ad view (only once per session per ad)
  const trackAdView = useCallback(async (adId: number) => {
    // Skip if already tracked this session
    if (trackedViewsRef.current.has(adId)) {
      console.log(`👁️ View already tracked for ad ${adId} in this session`)
      return
    }
    
    if (isTrackingViewRef.current) return
    
    isTrackingViewRef.current = true

    try {
      console.log('👁️ Tracking view for ad:', adId)
      
      const { data: currentAd, error: fetchError } = await supabase
        .from('ads')
        .select('view_count')
        .eq('id', adId)
        .single()

      if (fetchError) {
        console.error('Error fetching current view count:', fetchError)
        isTrackingViewRef.current = false
        return
      }

      const currentCount = currentAd?.view_count || 0
      const newCount = currentCount + 1

      const { error: updateError } = await supabase
        .from('ads')
        .update({ view_count: newCount })
        .eq('id', adId)

      if (updateError) {
        console.error('Error updating view count:', updateError)
      } else {
        console.log('✅ View count updated successfully:', newCount)
        
        // Mark as tracked for this session
        trackedViewsRef.current.add(adId)
        
        // Update local state
        setAllAds(prevAds => 
          prevAds.map(ad => 
            ad.id === adId 
              ? { ...ad, view_count: newCount }
              : ad
          )
        )
      }
    } catch (err) {
      console.error('Error tracking view:', err)
    } finally {
      isTrackingViewRef.current = false
    }
  }, [])

  // Track ad click
  const trackAdClick = useCallback(async (adId: number) => {
    if (isTrackingClickRef.current) return
    isTrackingClickRef.current = true

    try {
      console.log('📊 Tracking click for ad:', adId)
      
      const { data: currentAd, error: fetchError } = await supabase
        .from('ads')
        .select('click_count')
        .eq('id', adId)
        .single()

      if (fetchError) {
        console.error('Error fetching current click count:', fetchError)
        isTrackingClickRef.current = false
        return
      }

      const currentCount = currentAd?.click_count || 0
      const newCount = currentCount + 1

      const { error: updateError } = await supabase
        .from('ads')
        .update({ click_count: newCount })
        .eq('id', adId)

      if (updateError) {
        console.error('Error updating click count:', updateError)
      } else {
        console.log('✅ Click count updated successfully:', newCount)
        
        setAllAds(prevAds => 
          prevAds.map(ad => 
            ad.id === adId 
              ? { ...ad, click_count: newCount }
              : ad
          )
        )
      }
    } catch (err) {
      console.error('Error tracking click:', err)
    } finally {
      isTrackingClickRef.current = false
    }
  }, [])

  // Track view when ad is displayed
  useEffect(() => {
    if (displayOrder.length > 0 && !loading) {
      const currentAd = allAds[displayOrder[currentIndex]]
      if (currentAd) {
        // Only track if not already tracked this session
        if (!trackedViewsRef.current.has(currentAd.id)) {
          trackAdView(currentAd.id)
        }
      }
    }
  }, [currentIndex, displayOrder, allAds, loading, trackAdView])

  // Fetch ads
  useEffect(() => {
    const fetchAds = async () => {
      try {
        const now = new Date().toISOString()
        
        const { data, error } = await supabase
          .from('ads')
          .select('*')
          .eq('approval', true)
          .eq('pause', false)
          .lte('start_time', now)
          .gte('end_time', now)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching ads:', error)
          setError('Failed to load ads')
          setLoading(false)
          return
        }

        const validAds = data?.filter(ad => 
          ad.video || ad.image || ad.text
        ) || []

        console.log('📢 Ads loaded:', validAds.length)

        setAllAds(validAds)
        
        if (validAds.length > 0) {
          const order = generateDisplayOrder(validAds)
          setDisplayOrder(order)
          setCurrentIndex(0)
        }
        
        setLoading(false)
      } catch (err) {
        console.error('Error:', err)
        setError('An unexpected error occurred')
        setLoading(false)
      }
    }

    fetchAds()
  }, [generateDisplayOrder])

  // Handle video metadata load
  const handleVideoMetadata = useCallback(() => {
    if (videoRef.current) {
      const duration = videoRef.current.duration
      if (duration > 0) {
        setVideoDuration(duration)
        console.log('🎬 Video duration:', duration, 'seconds')
      }
    }
  }, [])

  // Handle video ended event
  const handleVideoEnded = useCallback(() => {
    if (displayOrder.length > 1 && isAutoPlaying && !isPaused && !isSwitchingRef.current) {
      console.log('🎬 Video ended, switching to next ad')
      isSwitchingRef.current = true
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      
      setCurrentIndex((prev) => {
        const next = (prev + 1) % displayOrder.length
        return next
      })
      
      setTimeout(() => {
        isSwitchingRef.current = false
      }, 500)
    }
  }, [displayOrder.length, isAutoPlaying, isPaused])

  // Setup interval function
  const setupInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (!isAutoPlaying || isPaused || displayOrder.length <= 1) {
      return
    }

    const currentAd = allAds[displayOrder[currentIndex]]
    if (!currentAd) return

    if (currentAd.video) {
      console.log('🎬 Video ad, waiting for video to end')
      return
    }

    const duration = getAdDuration(currentAd)
    console.log(`⏱️ ${currentAd.image ? 'Image' : 'Text'} ad, switching in ${duration/1000}s`)

    intervalRef.current = setInterval(() => {
      if (!isSwitchingRef.current) {
        isSwitchingRef.current = true
        setCurrentIndex((prev) => {
          const next = (prev + 1) % displayOrder.length
          console.log(`🔄 Switching to ad ${next + 1}/${displayOrder.length}`)
          return next
        })
        setTimeout(() => {
          isSwitchingRef.current = false
        }, 300)
      }
    }, duration)
  }, [isAutoPlaying, isPaused, displayOrder, allAds, currentIndex, getAdDuration])

  // Auto-play slides with dynamic timing
  useEffect(() => {
    setupInterval()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [setupInterval])

  // Handle video playback
  useEffect(() => {
    if (videoRef.current && displayOrder.length > 0) {
      const currentAd = allAds[displayOrder[currentIndex]]
      if (currentAd?.video) {
        if (isPaused) {
          videoRef.current.pause()
        } else {
          videoRef.current.play().catch(() => {})
        }
      }
    }
  }, [currentIndex, isPaused, displayOrder, allAds])

  // Re-setup interval when currentIndex changes
  useEffect(() => {
    const currentAd = allAds[displayOrder[currentIndex]]
    if (currentAd && !currentAd.video) {
      setupInterval()
    }
  }, [currentIndex, allAds, displayOrder, setupInterval])

  const closeAd = useCallback(() => {
    setShowAd(false)
  }, [])

  const handleCtaClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (displayOrder.length === 0) return
    const currentAd = allAds[displayOrder[currentIndex]]
    
    if (currentAd) {
      await trackAdClick(currentAd.id)
      
      if (currentAd.ads_link) {
        window.open(currentAd.ads_link, '_blank', 'noopener,noreferrer')
      }
    }
  }, [displayOrder, allAds, currentIndex, trackAdClick])

  const handleRunAdClick = useCallback(() => {
    window.location.href = '/ads'
  }, [])

  if (loading) {
    return null
  }

  if (error || allAds.length === 0 || displayOrder.length === 0 || !showAd) {
    return null
  }

  const currentAdIndex = displayOrder[currentIndex]
  const currentAd = allAds[currentAdIndex]
  const hasLink = currentAd?.ads_link
  const hasVideo = currentAd?.video
  const hasImage = currentAd?.image
  const hasText = currentAd?.text

  return (
    <div className={`relative w-full overflow-hidden bg-black/90 backdrop-blur-sm ${className}`}>
      {/* Close Button */}
      <button
        onClick={closeAd}
        className="absolute top-1 right-1 z-20 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white/60 hover:text-white transition-colors"
        aria-label="Close ad"
      >
        <X className="w-3 h-3" />
      </button>

      {/* Ad Content */}
      <div className="relative w-full" style={{ aspectRatio: '10/1.5' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ 
              duration: 0.5, 
              ease: "easeInOut",
              opacity: { duration: 0.3 }
            }}
            className="absolute inset-0"
          >
            <div className="absolute inset-0">
              {/* Video Ad - NOT clickable */}
              {hasVideo && (
                <video
                  ref={videoRef}
                  src={currentAd.video!}
                  className="w-full h-full object-cover"
                  muted={isMuted}
                  playsInline
                  autoPlay={!isPaused}
                  onLoadedMetadata={handleVideoMetadata}
                  onEnded={handleVideoEnded}
                />
              )}

              {/* Image Ad - NOT clickable */}
              {!hasVideo && hasImage && (
                <img
                  src={currentAd.image!}
                  alt={currentAd.text || 'Advertisement'}
                  className="w-full h-full object-cover"
                />
              )}

              {/* If only text, show a gradient background */}
              {!hasVideo && !hasImage && hasText && (
                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
              )}

              {/* Gradient overlay for text readability */}
              {hasText && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              )}
            </div>

            {/* Text/Caption with CTA buttons */}
            {hasText && (
              <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 z-10">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[10px] sm:text-xs md:text-sm font-medium text-white drop-shadow-lg line-clamp-2 flex-1 min-w-[60%]">
                    {currentAd.text}
                  </p>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    {hasLink && (
                      <button
                        onClick={handleCtaClick}
                        className="px-2 py-1 bg-red-500/80 hover:bg-red-500 rounded-lg text-[8px] sm:text-[10px] font-medium text-white transition-all hover:scale-[1.05] active:scale-[0.95] flex items-center gap-1"
                      >
                        <span>Learn More</span>
                        <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      </button>
                    )}
                    <button
                      onClick={handleRunAdClick}
                      className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-[7px] sm:text-[9px] font-medium text-white/60 hover:text-white transition-all flex items-center gap-1 whitespace-nowrap"
                    >
                      <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <span className="hidden xs:inline">Run this ad</span>
                      <span className="xs:hidden">Run ad like this</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Sponsored Tag - Top Left */}
            <div className="absolute top-1 left-1.5 z-10">
              <span className="px-1.5 py-0.5 bg-black/50 backdrop-blur-sm rounded-full text-[8px] text-white/40">
                Sponsored
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}