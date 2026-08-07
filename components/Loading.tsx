'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

interface LoadingProps {
  fullScreen?: boolean
  text?: string
}

export default function Loading({ fullScreen = true, text = 'Loading...' }: LoadingProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-6">
      {/* Logo with spinning ring */}
      <div className="relative">
        {/* Logo */}
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative z-10"
        >
          <Image
            src="/autorepublic.svg"
            alt="Auto Republic"
            width={64}
            height={64}
            className="w-16 h-16 object-contain"
            priority
          />
        </motion.div>
        
        {/* Spinning ring - Outer */}
        <motion.div
          animate={{
            rotate: 360
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute inset-0 -m-2 rounded-full border-2 border-transparent border-t-red-500 border-r-red-500/50"
        />
        
        {/* Spinning ring - Inner (opposite direction) */}
        <motion.div
          animate={{
            rotate: -360
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute inset-0 -m-4 rounded-full border-2 border-transparent border-b-red-500/30 border-l-red-500/20"
        />
        
        {/* Glow effect */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 -m-6 bg-red-500 rounded-full blur-2xl opacity-20"
        />
      </div>
      
      {/* Loading text with dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-1"
      >
        <span className="text-sm text-white/60">{text}</span>
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
          className="text-white/60"
        >
          .
        </motion.span>
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
          className="text-white/60"
        >
          .
        </motion.span>
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0.8 }}
          className="text-white/60"
        >
          .
        </motion.span>
      </motion.div>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        {content}
      </div>
    )
  }

  return content
}