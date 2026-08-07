// app/about/page.tsx
'use client'

import { Users, Shield, Award, Globe, Heart, Star, Car, Zap, FileText, Mail, Lock, TrendingUp, ShoppingBag, Sparkles } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'

export default function AboutPage() {
  const features = [
    {
      icon: Shield,
      title: 'Trust & Safety',
      description: 'We promote safer vehicle purchases through seller verification, listing standards, buyer education, and fraud awareness.'
    },
    {
      icon: Users,
      title: 'Community Driven',
      description: 'A growing community of vehicle buyers, private sellers, and dealerships building Nigeria\'s automotive marketplace.'
    },
    {
      icon: Award,
      title: 'Marketplace Standards',
      description: 'Vehicle listings are monitored for compliance with our marketplace standards, helping improve listing quality and transparency.'
    },
    {
      icon: Globe,
      title: 'Nationwide Reach',
      description: 'Helping buyers discover vehicles from sellers across Nigeria, regardless of location.'
    },
    {
      icon: Zap,
      title: 'Built for Growth',
      description: 'From smart advertising to future escrow protection and installment purchasing, Auto Republic is continuously evolving to make vehicle commerce safer and easier.'
    }
  ]

  const benefits = [
    {
      icon: Car,
      title: 'List for Free',
      description: 'Publish your vehicle listing in minutes and reach buyers across Nigeria through one growing automotive marketplace.'
    },
    {
      icon: TrendingUp,
      title: 'Buyer Funnel',
      description: 'Our buyer funnel helps connect genuine enquiries with sellers, increasing visibility and improving opportunities to close successful sales.'
    },
    {
      icon: ShoppingBag,
      title: 'Seller Growth',
      description: 'Auto Republic provides advertising, promotion tools, and growing marketplace exposure to help sellers reach more qualified buyers.'
    }
  ]

  const legalLinks = [
    { icon: Shield, label: 'Buyer Protection', href: '/legals/buyer-protection' },
    { icon: Lock, label: 'Privacy Policy', href: '/legals/privacy' },
    { icon: FileText, label: 'Terms of Use', href: '/legals/terms' },
    { icon: Star, label: 'Cookie Policy', href: '/legals/cookies' },
  ]

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="pb-24 md:pb-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Hero Section */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Image
                src="/autorepublic.png"
                alt="Auto Republic"
                width={48}
                height={48}
                className="w-10 h-10 md:w-12 md:h-12 object-contain"
              />
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Auto <span className="text-red-500">Republic</span>
              </h1>
            </div>
            <p className="text-sm text-white/40 max-w-2xl mx-auto">
              Where Vehicles Meet Their Next Owner
            </p>
            <p className="text-xs text-white/30 max-w-2xl mx-auto mt-2">
              Nigeria's modern automotive marketplace where vehicle sellers connect with serious buyers across Nigeria. Discover, compare, and advertise vehicles with confidence.
            </p>
          </div>

          {/* Mission Statement */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-red-400" />
              <h2 className="text-sm font-semibold text-white">Our Mission</h2>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              Auto Republic exists to simplify the way Nigerians buy and sell vehicles. Our mission is to build a transparent, reliable, and technology-driven marketplace where sellers can showcase their vehicles and buyers can confidently discover, compare, and make informed purchasing decisions. We continuously develop innovative tools that make vehicle advertising, discovery, and future transactions easier for everyone.
            </p>
          </div>

          {/* Why Auto Republic */}
          <div className="bg-gradient-to-br from-red-500/10 via-red-600/5 to-transparent rounded-xl p-6 border border-red-500/20 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-red-400" />
              <h2 className="text-sm font-semibold text-white">Why Auto Republic?</h2>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              Auto Republic is more than a classifieds website. We're building an automotive ecosystem where vehicle advertising, discovery, promotions, seller growth, and future buying experiences come together on one platform. Whether you're selling one vehicle or managing an entire dealership, Auto Republic provides the tools to help you reach more buyers.
            </p>
          </div>

          {/* Key Benefits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <div key={index} className="bg-gradient-to-br from-red-500/10 via-red-600/5 to-transparent rounded-xl p-4 border border-red-500/20 hover:border-red-500/40 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-red-500/20 rounded-lg">
                      <Icon className="w-3.5 h-3.5 text-red-400" />
                    </div>
                    <h3 className="text-xs font-semibold text-white">{benefit.title}</h3>
                  </div>
                  <p className="text-[10px] text-white/50 leading-relaxed">{benefit.description}</p>
                </div>
              )
            })}
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-red-500/10 rounded-lg">
                      <Icon className="w-3.5 h-3.5 text-red-400" />
                    </div>
                    <h3 className="text-xs font-semibold text-white">{feature.title}</h3>
                  </div>
                  <p className="text-[10px] text-white/40 leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>

          {/* Values */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/5 mb-6">
            <h3 className="text-sm font-semibold text-white mb-4">Our Values</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-2">
                  <Shield className="w-4 h-4 text-red-400" />
                </div>
                <p className="text-xs font-medium text-white">Trust</p>
                <p className="text-[8px] text-white/30">Transparency first.</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-2">
                  <Star className="w-4 h-4 text-red-400" />
                </div>
                <p className="text-xs font-medium text-white">Quality</p>
                <p className="text-[8px] text-white/30">Marketplace Standards</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-2">
                  <Zap className="w-4 h-4 text-red-400" />
                </div>
                <p className="text-xs font-medium text-white">Innovation</p>
                <p className="text-[8px] text-white/30">Building the future of vehicle commerce.</p>
              </div>
            </div>
          </div>

          {/* Legal & Contact Section */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/5">
            <h3 className="text-sm font-semibold text-white mb-4">Legal & Support</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {legalLinks.map((link, index) => {
                const Icon = link.icon
                return (
                  <Link
                    key={index}
                    href={link.href}
                    className="flex flex-col items-center gap-1.5 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all group"
                  >
                    <Icon className="w-4 h-4 text-white/40 group-hover:text-red-400 transition-colors" />
                    <span className="text-[8px] text-white/40 group-hover:text-white/60 transition-colors text-center">
                      {link.label}
                    </span>
                  </Link>
                )
              })}
              <Link
                href="/contact"
                className="flex flex-col items-center gap-1.5 p-3 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-all group"
              >
                <Mail className="w-4 h-4 text-red-400" />
                <span className="text-[8px] text-white/60 group-hover:text-white/80 transition-colors text-center">
                  Contact Us
                </span>
              </Link>
            </div>
            <p className="text-[8px] text-white/20 text-center mt-4">
              By using Auto Republic, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}