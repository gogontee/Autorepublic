'use client'

import { useState } from 'react'
import { GitCompare, Newspaper } from 'lucide-react'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import CompareVehicles from '@/components/CompareVehicles'
import AutoUpdates from '@/components/AutoUpdates'
import Ads from '@/components/Ads'

export default function ResearchPage() {
  const [activeTab, setActiveTab] = useState<'compare' | 'blog'>('blog')

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      {/* Ads Section - Below Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <Ads className="rounded-2xl overflow-hidden shadow-lg shadow-red-500/5" />
      </div>
      
      <main className="pt-2 md:pt-4 pb-24 md:pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Research & Blog</h1>
              <p className="text-sm text-white/40 mt-1">
                Compare vehicles, read expert reviews, and stay informed
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Tab Switcher */}
              <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
                <button
                  onClick={() => setActiveTab('compare')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    activeTab === 'compare'
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                      : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  <GitCompare className="w-4 h-4" />
                  Compare Vehicles
                </button>
                <button
                  onClick={() => setActiveTab('blog')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    activeTab === 'blog'
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                      : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  <Newspaper className="w-4 h-4" />
                  Auto Updates
                </button>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'compare' ? (
            <CompareVehicles />
          ) : (
            <AutoUpdates />
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}