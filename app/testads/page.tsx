// app/testads/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RefreshCw, ChevronLeft, ChevronRight, Eye, EyeOff, AlertCircle } from 'lucide-react'
import Ads from '@/components/Ads'
import { supabase } from '@/lib/supabase/client'

export default function TestAdsPage() {
  const [showAds, setShowAds] = useState(true)
  const [autoPlay, setAutoPlay] = useState(true)
  const [interval, setInterval] = useState(5000)
  const [showControls, setShowControls] = useState(true)
  const [adsCount, setAdsCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState<any[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    fetchAdStats()
  }, [])

  const fetchAdStats = async () => {
    try {
      const now = new Date().toISOString()
      
      const { data, error } = await supabase
        .from('ads')
        .select('id, approval, pause, start_time, end_time, video, image, text, created_at')
        .eq('approval', true)
        .eq('pause', false)
        .lte('start_time', now)
        .gte('end_time', now)

      if (error) {
        console.error('Error fetching ads:', error)
        setLoading(false)
        return
      }

      const validAds = data?.filter(ad => 
        ad.video || ad.image || ad.text
      ) || []

      setAdsCount(validAds.length)
      setDebugInfo(validAds)
      setLoading(false)
    } catch (err) {
      console.error('Error:', err)
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchAdStats()
    // Force re-render by toggling and back
    setShowAds(false)
    setTimeout(() => setShowAds(true), 100)
  }

  if (!isClient) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600/10 to-transparent border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-white">Ads Test Page</h1>
          <p className="text-sm text-white/40">Test and debug your ad display component</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Controls Panel */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAds(!showAds)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  showAds 
                    ? 'bg-red-500 text-white' 
                    : 'bg-white/10 text-white/40 hover:bg-white/20'
                }`}
              >
                {showAds ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span className="ml-2">{showAds ? 'Visible' : 'Hidden'}</span>
              </button>

              <button
                onClick={() => setAutoPlay(!autoPlay)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  autoPlay 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-white/10 text-white/40 hover:bg-white/20'
                }`}
              >
                {autoPlay ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                {autoPlay ? 'Auto-Play ON' : 'Auto-Play OFF'}
              </button>

              <button
                onClick={handleRefresh}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white/60 hover:text-white transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>

              <button
                onClick={() => setShowControls(!showControls)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  showControls 
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                    : 'bg-white/10 text-white/40 hover:bg-white/20'
                }`}
              >
                {showControls ? 'Controls ON' : 'Controls OFF'}
              </button>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <label className="text-sm text-white/40">Interval:</label>
              <select
                value={interval}
                onChange={(e) => setInterval(Number(e.target.value))}
                className="bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-red-500/50"
              >
                <option value={3000}>3s</option>
                <option value={5000}>5s</option>
                <option value={7000}>7s</option>
                <option value={10000}>10s</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ads Display */}
        {showAds && (
          <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden mb-6">
            <Ads 
              autoPlay={autoPlay}
              interval={interval}
              showControls={showControls}
              className="w-full"
            />
          </div>
        )}

        {/* Stats Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Stats */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-4">
            <h3 className="text-sm font-medium text-white/60 mb-3">Statistics</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-white/40">Total Active Ads</span>
                <span className="text-white font-medium">{loading ? '...' : adsCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Auto-Play</span>
                <span className={`font-medium ${autoPlay ? 'text-green-400' : 'text-red-400'}`}>
                  {autoPlay ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Switch Interval</span>
                <span className="text-white font-medium">{interval/1000}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Controls</span>
                <span className={`font-medium ${showControls ? 'text-blue-400' : 'text-gray-400'}`}>
                  {showControls ? 'Visible' : 'Hidden'}
                </span>
              </div>
            </div>
          </div>

          {/* Debug Info */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-4">
            <h3 className="text-sm font-medium text-white/60 mb-3">Debug Information</h3>
            {loading ? (
              <div className="text-white/40 text-sm">Loading ad data...</div>
            ) : debugInfo.length === 0 ? (
              <div className="flex items-start gap-2 text-yellow-400/60 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p>No active ads found</p>
                  <p className="text-white/30 text-xs mt-1">
                    Check that ads have approval: true, pause: false, and are within date range
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {debugInfo.map((ad, index) => (
                  <div key={ad.id} className="text-xs bg-white/5 rounded-lg p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Ad #{index + 1}</span>
                      <span className="text-white/40">
                        {ad.video ? '🎬 Video' : ad.image ? '🖼️ Image' : '📝 Text'}
                      </span>
                    </div>
                    <div className="text-white/30 text-[10px] mt-1 truncate">
                      ID: {ad.id} • {new Date(ad.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-white/5 rounded-2xl border border-white/10 p-4">
          <h3 className="text-sm font-medium text-white/60 mb-2">How to Test</h3>
          <ul className="space-y-1 text-xs text-white/40">
            <li>• <strong className="text-white/60">Visibility:</strong> Toggle the ad visibility</li>
            <li>• <strong className="text-white/60">Auto-Play:</strong> Turn auto-rotation on/off</li>
            <li>• <strong className="text-white/60">Interval:</strong> Change the switching speed</li>
            <li>• <strong className="text-white/60">Controls:</strong> Show/hide navigation controls</li>
            <li>• <strong className="text-white/60">Refresh:</strong> Reload ads from database</li>
          </ul>
          <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-xs text-yellow-400/60">
              💡 Check the browser console for debug logs from the Ads component
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}