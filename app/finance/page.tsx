'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  CreditCard, 
  Calendar, 
  Shield, 
  Banknote, 
  BadgeCheck,
  Sparkles
} from 'lucide-react'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import Image from 'next/image'
import Link from 'next/link'

export default function FinancePage() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="pt-14 md:pt-16 pb-24 md:pb-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 md:mb-12"
          >
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Image
                  src="/autorepublic.png"
                  alt="Auto Republic"
                  width={80}
                  height={80}
                  className="w-16 h-16 md:w-20 md:h-20 object-contain"
                />
                {/* Glow effect */}
                <div className="absolute inset-0 -m-4 bg-red-500/10 rounded-full blur-2xl" />
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3">
              Drive Today.
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400">
                Pay Your Way.
              </span>
            </h1>
            
            <p className="text-sm sm:text-base md:text-lg text-white/60 max-w-2xl mx-auto">
              Get access to vehicle financing, flexible payment options, and pre-approved 
              auto loans through our trusted finance partners.
            </p>
          </motion.div>

          {/* Coming Soon Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.95 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative overflow-hidden"
          >
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-orange-500/10 rounded-2xl" />
            
            {/* Coming Soon Content */}
            <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 md:p-12 text-center">
              {/* Coming Soon Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 rounded-full border border-red-500/30 mb-6">
                <Sparkles className="w-4 h-4 text-red-400" />
                <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Coming Soon</span>
              </div>

              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
                  <CreditCard className="w-10 h-10 text-red-500" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-white mb-3">
                Auto Finance Solutions
              </h2>
              
              <p className="text-sm text-white/60 max-w-md mx-auto mb-6">
                We're building a seamless financing experience to help you get behind the 
                wheel of your dream car. Stay tuned!
              </p>

              {/* Features Preview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <Banknote className="w-6 h-6 text-red-400 mx-auto mb-2" />
                  <p className="text-xs text-white/60">Flexible Loans</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <Calendar className="w-6 h-6 text-red-400 mx-auto mb-2" />
                  <p className="text-xs text-white/60">Easy Payments</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <BadgeCheck className="w-6 h-6 text-red-400 mx-auto mb-2" />
                  <p className="text-xs text-white/60">Pre-Approved</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <Shield className="w-6 h-6 text-red-400 mx-auto mb-2" />
                  <p className="text-xs text-white/60">Trusted Partners</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 p-6 bg-white/5 rounded-xl border border-white/5 text-center"
          >
            <p className="text-sm text-white/60">
              Have questions about financing?
            </p>
            <Link 
              href="/contact"
              className="inline-block mt-2 text-sm text-red-500 hover:text-red-400 transition-colors font-medium"
            >
              Contact our finance team →
            </Link>
          </motion.div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}