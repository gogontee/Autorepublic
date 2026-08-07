// app/support/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  MessageCircle, 
  Mail, 
  Phone, 
  Clock,
  Shield,
  HelpCircle,
  ShoppingCart,
  User,
  CreditCard,
  Megaphone,
  X
} from 'lucide-react'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import Link from 'next/link'
import { faqData, FAQItem } from '@/data/faq-data'
import { motion, AnimatePresence } from 'framer-motion'

type CategoryFilter = 'all' | 'general' | 'buying' | 'selling' | 'account' | 'payments' | 'advertising'

const categoryLabels: Record<CategoryFilter, string> = {
  all: 'All Questions',
  general: 'General',
  buying: 'Buying',
  selling: 'Selling',
  account: 'Account',
  payments: 'Payments & Wallet',
  advertising: 'Advertising'
}

const categoryIcons: Record<CategoryFilter, any> = {
  all: HelpCircle,
  general: Shield,
  buying: ShoppingCart,
  selling: ShoppingCart,
  account: User,
  payments: CreditCard,
  advertising: Megaphone
}

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filteredFaqs, setFilteredFaqs] = useState<FAQItem[]>(faqData)

  useEffect(() => {
    let filtered = faqData

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(faq => faq.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(faq =>
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query)
      )
    }

    setFilteredFaqs(filtered)
    setExpandedId(null)
  }, [searchQuery, selectedCategory])

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const clearSearch = () => {
    setSearchQuery('')
  }

  const getCategoryCount = (category: CategoryFilter) => {
    if (category === 'all') return faqData.length
    return faqData.filter(faq => faq.category === category).length
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="pb-24 md:pb-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <HelpCircle className="w-6 h-6 text-red-400" />
              <h1 className="text-2xl md:text-3xl font-bold text-white">Help & Support</h1>
            </div>
            <p className="text-sm text-white/40">
              Find answers to commonly asked questions. Can't find what you're looking for? Contact us directly.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for answers..."
              className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1 scrollbar-hide">
            {(['all', 'general', 'buying', 'selling', 'account', 'payments', 'advertising'] as CategoryFilter[]).map((category) => {
              const isActive = selectedCategory === category
              const Icon = categoryIcons[category]
              const count = getCategoryCount(category)
              
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {categoryLabels[category]}
                  <span className={`text-[8px] ${isActive ? 'text-white/80' : 'text-white/30'}`}>
                    ({count})
                  </span>
                </button>
              )
            })}
          </div>

          {/* FAQ List */}
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-xl border border-white/5">
              <HelpCircle className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">No results found</p>
              <p className="text-xs text-white/20 mt-1">Try adjusting your search or filter</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {filteredFaqs.map((faq) => {
                  const isExpanded = expandedId === faq.id
                  
                  return (
                    <motion.div
                      key={faq.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all overflow-hidden"
                    >
                      <button
                        onClick={() => toggleExpand(faq.id)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
                      >
                        <span className="text-xs sm:text-sm font-medium text-white pr-4">
                          {faq.question}
                        </span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[8px] text-white/20 bg-white/5 px-1.5 py-0.5 rounded-full">
                            {categoryLabels[faq.category as CategoryFilter]}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-white/40" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-white/40" />
                          )}
                        </div>
                      </button>
                      
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 pt-1 text-xs text-white/60 leading-relaxed border-t border-white/5">
                              {faq.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Still Need Help */}
          <div className="mt-8 bg-gradient-to-br from-red-500/10 via-red-600/5 to-transparent rounded-xl p-6 border border-red-500/20">
            <div className="text-center">
              <h3 className="text-sm font-semibold text-white mb-2">Still need help?</h3>
              <p className="text-xs text-white/40 mb-4">
                Our support team is here to assist you. Reach out to us and we'll get back to you within 24 hours.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/contact"
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-xs font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-red-500/25"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Contact Support
                </Link>
                <a
                  href="mailto:support@autorepublic.com"
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium text-white/80 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Email Us
                </a>
              </div>
              <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-white/30">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Mon-Fri, 8:00 AM - 6:00 PM (WAT)
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  +234 800 000 0000
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}