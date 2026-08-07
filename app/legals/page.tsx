// app/legals/page.tsx
'use client'

import { Shield, FileText, BookOpen, AlertCircle, ChevronRight, CreditCard } from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'

export default function LegalsPage() {
  const legalItems = [
    {
      icon: Shield,
      title: 'Terms of Service',
      description: 'Understand the rules and guidelines for using Auto Republic',
      href: '/legals/terms'
    },
    {
      icon: FileText,
      title: 'Privacy Policy',
      description: 'Learn how we protect and handle your personal information',
      href: '/legals/privacy'
    },
    {
      icon: AlertCircle,
      title: 'Buyer Protection Policy',
      description: 'Your rights and protections when buying through Auto Republic',
      href: '/legals/buyer-protection'
    },
    {
      icon: BookOpen,
      title: 'Cookie Policy',
      description: 'How we use cookies to enhance your browsing experience',
      href: '/legals/cookies'
    }
  ]

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="pb-24 md:pb-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Shield className="w-6 h-6 text-red-400" />
              <h1 className="text-2xl md:text-3xl font-bold text-white">Legal</h1>
            </div>
            <p className="text-sm text-white/40">Your rights, our responsibilities, and everything in between.</p>
          </div>

          {/* Safety Notice - Updated */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-yellow-400">⚠️ Buyer Safety Notice</h4>
                <p className="text-[10px] text-yellow-400/70 mt-1 leading-relaxed">
                  Inspect before you pay. Always physically inspect the vehicle and ensure you are 
                  satisfied before making any payment. Never pay online to a seller claiming to represent 
                  Auto Republic. We do not collect payments on behalf of approved sellers.
                </p>
                <p className="text-[9px] text-yellow-400/50 mt-2">
                  Official promotions only. Payments for Auto Republic special offers or promotions 
                  will only be deducted from Users Wallet.
                </p>
              </div>
            </div>
          </div>

          {/* Payment Information - New */}
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-green-400">💳 Payment Information</h4>
                <p className="text-[10px] text-green-400/70 mt-1 leading-relaxed">
                  <span className="font-medium">Ad payments</span> are securely deducted directly from your 
                  Auto Republic wallet balance. We do not request physical cash payments or direct 
                  bank transfers for platform services.
                </p>
                <p className="text-[9px] text-green-400/50 mt-2">
                  In rare situations, special promotions may require alternative payment methods, 
                  which will always be communicated through our official channels. 
                  <span className="font-medium text-green-400/70"> Auto Republic never requests payment via unverified third-party platforms.</span>
                </p>
              </div>
            </div>
          </div>

          {/* Legal Documents */}
          <div className="space-y-3">
            {legalItems.map((item, index) => {
              const Icon = item.icon
              return (
                <Link
                  key={index}
                  href={item.href}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/10 rounded-lg">
                      <Icon className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white group-hover:text-white/90 transition-colors">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-white/30">{item.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
                </Link>
              )
            })}
          </div>

          {/* Contact Support */}
          <div className="mt-6 text-center bg-white/5 rounded-xl p-4 border border-white/5">
            <p className="text-xs text-white/40">
              Have questions?{' '}
              <Link href="/contact" className="text-red-400 hover:text-red-300 transition-colors">
                Contact our support team
              </Link>
            </p>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}