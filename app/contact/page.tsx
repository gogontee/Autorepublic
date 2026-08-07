// app/contact/page.tsx
'use client'

import { Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Mail, Phone, MapPin, Send, MessageCircle, Clock, Globe, CheckCircle } from 'lucide-react'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import { supabase } from '@/lib/supabase/client'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  // Get current user session
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUserId(session.user.id)
          setUserEmail(session.user.email || null)
          
          // Pre-fill email if user is authenticated
          if (session.user.email) {
            setFormData(prev => ({ ...prev, email: session.user.email || '' }))
          }
          
          // Fetch user profile for name
          const { data: profile } = await supabase
            .from('users')
            .select('first_name, last_name')
            .eq('user_id', session.user.id)
            .single()
          
          if (profile) {
            const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
            if (fullName) {
              setFormData(prev => ({ ...prev, name: fullName }))
            }
          }
        }
      } catch (err) {
        console.error('Error getting user:', err)
      }
    }
    
    getUser()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Insert into mailbox table
      const { data, error: insertError } = await supabase
        .from('mailbox')
        .insert({
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
          user_id: userId,
          status: 'pending'
        })
        .select()

      if (insertError) {
        console.error('Error submitting message:', insertError)
        setError('Failed to send message. Please try again.')
        setLoading(false)
        return
      }

      console.log('Message sent successfully:', data)
      setSubmitted(true)
      setFormData({ name: '', email: '', subject: '', message: '' })
      setLoading(false)
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSubmitted(false)
      }, 5000)
      
    } catch (err) {
      console.error('Error:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="pb-24 md:pb-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Contact Us</h1>
            <p className="text-sm text-white/40 mt-2">We're here to help. Reach out to us anytime.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Contact Information */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <h3 className="text-sm font-semibold text-white mb-4">Get in Touch</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-red-500/10 rounded-lg">
                      <Mail className="w-3.5 h-3.5 text-red-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40">Email</p>
                      <a href="mailto:support@autorepublic.com" className="text-xs text-white/80 hover:text-white transition-colors">
                        support@autorepublic.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-red-500/10 rounded-lg">
                      <Phone className="w-3.5 h-3.5 text-red-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40">Phone</p>
                      <a href="tel:+2348000000000" className="text-xs text-white/80 hover:text-white transition-colors">
                        +234 800 000 0000
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-red-500/10 rounded-lg">
                      <MapPin className="w-3.5 h-3.5 text-red-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40">Address</p>
                      <p className="text-xs text-white/60">
                        Lagos, Nigeria
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-red-500/10 rounded-lg">
                      <Clock className="w-3.5 h-3.5 text-red-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40">Support Hours</p>
                      <p className="text-xs text-white/60">
                        Mon - Fri: 8:00 AM - 6:00 PM (WAT)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <h4 className="text-xs font-semibold text-white/60 mb-3">Quick Links</h4>
                <div className="space-y-2">
                  <a href="/about" className="flex items-center gap-2 text-xs text-white/40 hover:text-white/60 transition-colors">
                    <Globe className="w-3 h-3" />
                    About Auto Republic
                  </a>
                  <a href="/legals" className="flex items-center gap-2 text-xs text-white/40 hover:text-white/60 transition-colors">
                    <Globe className="w-3 h-3" />
                    Terms & Conditions
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white/5 rounded-xl p-6 border border-white/5">
                <h3 className="text-sm font-semibold text-white mb-4">Send Us a Message</h3>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}
                
                {submitted ? (
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-green-400 text-sm font-medium">✓ Your message has been sent successfully!</p>
                        <p className="text-white/40 text-xs mt-1">We'll get back to you within 24 hours.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-medium text-white/40 mb-1">Full Name</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                          placeholder="Awajima Daniel"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-white/40 mb-1">Email Address</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                          placeholder="awajima@example.com"
                        />
                        {userEmail && (
                          <p className="text-[8px] text-white/20 mt-1">
                            Using your registered email: {userEmail}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-white/40 mb-1">Subject</label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                        placeholder="How can we help?"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-white/40 mb-1">Message</label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={4}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors resize-none"
                        placeholder="Tell us what's on your mind..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 bg-red-500 hover:bg-red-600 rounded-lg text-sm font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/25"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Message
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}