// components/legal/Policy.tsx
'use client'

import { FileText, AlertCircle, Shield, Lock, Eye, Database, Mail, Clock } from 'lucide-react'
import Link from 'next/link'

interface PolicyProps {
  title: string
  lastUpdated: string
  children: React.ReactNode
}

export default function Policy({ title, lastUpdated, children }: PolicyProps) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-red-500/10 rounded-xl">
          <Shield className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">{title}</h1>
          <p className="text-[10px] text-white/30">Last Updated: {lastUpdated}</p>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {children}
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-white/5">
        <p className="text-[10px] text-white/20 text-center">
          If you have any questions about this policy, please{' '}
          <Link href="/contact" className="text-red-400 hover:text-red-300 transition-colors">
            contact us
          </Link>
        </p>
      </div>
    </div>
  )
}

// Reusable policy sections
export function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
      <h3 className="text-sm font-semibold text-white mb-2">{title}</h3>
      <div className="text-xs text-white/60 leading-relaxed space-y-2">
        {children}
      </div>
    </div>
  )
}

export function PolicyList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 mt-1">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-2 text-xs text-white/60">
          <span className="text-red-400 mt-0.5">•</span>
          {item}
        </li>
      ))}
    </ul>
  )
}

export function PolicyNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex items-start gap-2">
      <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
      <div className="text-xs text-yellow-400/80">{children}</div>
    </div>
  )
}