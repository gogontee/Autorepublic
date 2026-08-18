// app/preorder/page.tsx
'use client'

import { motion } from 'framer-motion'
import { Clock, Car, Shield, Truck, CheckCircle, ArrowRight, Calendar, Users, Star, MapPin } from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import Ads from '@/components/Ads'

export default function PreOrderPage() {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      {/* Ads Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <Ads className="rounded-2xl overflow-hidden shadow-lg shadow-red-500/5" />
      </div>

      <main className="pb-24 md:pb-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Coming Soon Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center mb-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-full">
              <Clock className="w-4 h-4 text-red-400 animate-pulse" />
              <span className="text-xs font-medium text-red-400 uppercase tracking-wider">Coming Soon</span>
            </div>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3">
              Pre-Order Vehicles
            </h1>
            <p className="text-base sm:text-lg text-white/60 max-w-2xl mx-auto">
              Reserve your dream vehicle from trusted dealers before they arrive.
              Track every stage of delivery until your car is in your hands.
            </p>
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
          >
            {[
              {
                icon: Shield,
                title: 'Trusted Dealers',
                description: 'All dealers are verified and trusted partners'
              },
              {
                icon: Truck,
                title: 'Track Delivery',
                description: 'Real-time tracking from order to delivery'
              },
              {
                icon: CheckCircle,
                title: 'Secure Transaction',
                description: 'Your payment is protected every step of the way'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                className="bg-white/5 rounded-xl p-4 border border-white/5 text-center"
              >
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-2">
                  <feature.icon className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">{feature.title}</h3>
                <p className="text-xs text-white/40">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Coming Soon Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-white/5 p-8 sm:p-12 mb-8 overflow-hidden"
          >
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-red-500/5 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 text-center">
              <div className="text-6xl sm:text-7xl mb-4">🚗</div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Pre-Order Experience
              </h2>
              <p className="text-white/60 max-w-lg mx-auto mb-6">
                We're building the most seamless way to pre-order vehicles in Nigeria.
                Get notified when we launch.
              </p>

              {/* Coming Soon Steps */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-red-400">1</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white">Browse</p>
                    <p className="text-[10px] text-white/40">Find your dream car</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-red-400">2</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white">Reserve</p>
                    <p className="text-[10px] text-white/40">Secure with deposit</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-red-400">3</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white">Track</p>
                    <p className="text-[10px] text-white/40">Delivery updates</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {/* Notify Me Button - Coming Soon */}
            <button
              disabled
              className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white/40 cursor-not-allowed flex items-center gap-2 text-sm font-medium"
            >
              <Clock className="w-4 h-4" />
              Notify Me When Live
            </button>

            {/* Explore Vehicles Button */}
            <Link
              href="/vehicles"
              className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-xl text-white text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-red-500/25 flex items-center gap-2"
            >
              <Car className="w-4 h-4" />
              Explore Vehicles
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Bottom Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8 text-center"
          >
            <p className="text-xs text-white/20">
              Pre-order feature is currently in development. Check back soon!
            </p>
          </motion.div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}