'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

const slides = [
  {
    id: 1,
    title: 'Find Your Dream Car',
    subtitle: 'Premium selection of luxury and sports vehicles',
    cta: 'Browse Collection',
    route: '/collections',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1600&auto=format&fit=crop',
    gradient: 'from-red-600/80 to-purple-600/80',
    isLocal: false,
  },
  {
    id: 2,
    title: 'Electric Revolution',
    subtitle: 'Explore the future of driving with our EV collection',
    cta: 'View EVs',
    route: '/evs',
    image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=1600&auto=format&fit=crop',
    gradient: 'from-blue-600/80 to-cyan-600/80',
    isLocal: false,
  },
  {
    id: 3,
    title: 'Luxury Redefined',
    subtitle: 'Experience premium craftsmanship and performance',
    cta: 'Discover Luxury',
    route: '/luxury',
    image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1600&auto=format&fit=crop',
    gradient: 'from-amber-600/80 to-orange-600/80',
    isLocal: false,
  },
  {
    id: 4,
    title: 'Sports Performance',
    subtitle: 'Unleash the power of engineering excellence',
    cta: 'See Sports Cars',
    route: '/sports',
    image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1600&auto=format&fit=crop',
    gradient: 'from-red-600/80 to-pink-600/80',
    isLocal: false,
  }
]

export default function HeroSection() {
  const router = useRouter()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isAutoPlaying && !isHovering) {
      interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length)
      }, 5000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isAutoPlaying, isHovering])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const handleCtaClick = (route: string) => {
    router.push(route)
  }

  return (
    <section 
      className="relative w-full overflow-hidden"
      style={{ aspectRatio: '10/3' }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {/* Background Image Container */}
          <div className="absolute inset-0 w-full h-full">
            {slides[currentSlide].isLocal ? (
              // Local image - using standard img tag for GIF support
              <img
                src={slides[currentSlide].image}
                alt={slides[currentSlide].title}
                className="w-full h-full object-cover"
              />
            ) : (
              // Remote image - using Next.js Image
              <Image
                src={slides[currentSlide].image}
                alt={slides[currentSlide].title}
                fill
                className="object-cover"
                priority={currentSlide === 0}
              />
            )}
          </div>
          
          {/* Gradient Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-r ${slides[currentSlide].gradient}`} />

          {/* Dark Overlay for readability */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Content - Positioned above all overlays */}
          <div className="relative z-10 h-full flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="max-w-3xl"
              >
                {/* Title */}
                <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-2 sm:mb-3 leading-tight drop-shadow-lg">
                  {slides[currentSlide].title}
                </h1>

                {/* Subtitle - Hidden on mobile */}
                <p className="hidden sm:block text-base sm:text-lg md:text-xl text-white/90 mb-4 sm:mb-6 max-w-2xl drop-shadow-md">
                  {slides[currentSlide].subtitle}
                </p>

                {/* CTA Button - Smaller on mobile */}
                <button 
                  onClick={() => handleCtaClick(slides[currentSlide].route)}
                  className="group px-4 sm:px-8 py-2 sm:py-3 bg-white text-black hover:bg-white/90 rounded-full font-medium transition-all hover:scale-105 flex items-center gap-2 shadow-lg shadow-black/20 text-sm sm:text-base"
                >
                  {slides[currentSlide].cta}
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows - Desktop only */}
      <div className="hidden sm:flex absolute inset-0 items-center justify-between px-2 sm:px-4 pointer-events-none z-20">
        <button
          onClick={prevSlide}
          className="pointer-events-auto p-2 sm:p-3 bg-black/50 backdrop-blur-sm hover:bg-black/70 rounded-full text-white transition-all hover:scale-110 border border-white/10"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <button
          onClick={nextSlide}
          className="pointer-events-auto p-2 sm:p-3 bg-black/50 backdrop-blur-sm hover:bg-black/70 rounded-full text-white transition-all hover:scale-110 border border-white/10"
          aria-label="Next slide"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Slide Dots */}
      <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-1 sm:h-1.5 rounded-full transition-all duration-300 ${
              index === currentSlide ? 'w-6 sm:w-8 bg-white' : 'w-3 sm:w-4 bg-white/30'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Auto-Play Toggle - Desktop */}
      <button
        onClick={() => setIsAutoPlaying(!isAutoPlaying)}
        className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 hidden sm:flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-black/50 backdrop-blur-sm hover:bg-black/70 rounded-full text-xs text-white/70 transition-all border border-white/10 z-20"
        aria-label={isAutoPlaying ? 'Pause slideshow' : 'Play slideshow'}
      >
        {isAutoPlaying ? (
          <>
            <Pause className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span className="hidden sm:inline">Pause</span>
          </>
        ) : (
          <>
            <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span className="hidden sm:inline">Play</span>
          </>
        )}
      </button>

      {/* Mobile-specific aspect ratio override */}
      <style jsx>{`
        @media (max-width: 640px) {
          section {
            aspect-ratio: 10/4 !important;
          }
        }
      `}</style>
    </section>
  )
}