// components/InstallPrompt.tsx
'use client'
import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<any>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('pwa-prompt-dismissed') === 'true') {
      setDismissed(true)
      return
    }
    const handler = (e: any) => {
      e.preventDefault()
      setDeferred(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (dismissed || !deferred) return null

  const install = async () => {
    deferred.prompt()
    const { outcome } = await deferred.userChoice
    if (outcome === 'accepted') setDeferred(null)
  }

  const dismiss = () => {
    setDismissed(true)
    localStorage.setItem('pwa-prompt-dismissed', 'true')
  }

  return (
    <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-40 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl">
      <div className="flex items-start gap-3">
        <Download className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-white">Install AutoRepublic</p>
          <p className="text-xs text-white/40 mt-0.5">Add to your home screen for quick access</p>
        </div>
        <button onClick={dismiss} className="p-1 hover:bg-white/10 rounded-lg">
          <X className="w-4 h-4 text-white/40" />
        </button>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={install}
          className="flex-1 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-xs font-medium text-white transition-colors"
        >
          Install
        </button>
        <button
          onClick={dismiss}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium text-white/60 transition-colors"
        >
          Not now
        </button>
      </div>
    </div>
  )
}