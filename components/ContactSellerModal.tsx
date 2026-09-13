'use client'

import { useState } from 'react'
import {
  X,
  Phone,
  Mail,
  MessageCircle,
  ChevronRight,
  Send,
  User,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import BuyerNotice from '@/components/BuyerNotice'
import { supabase } from '@/lib/supabase/client'

interface ContactSellerModalProps {
  isOpen: boolean
  onClose: () => void
  /** Optional vehicle info — pass these when you want to display which car the buyer is enquiring about */
  vehicleTitle?: string
  vehicleId?: string
  vehicleCarCode?: string
}

export default function ContactSellerModal({
  isOpen,
  onClose,
  vehicleTitle,
  vehicleId,
  vehicleCarCode,
}: ContactSellerModalProps) {
  // Form state
  const [name, setName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState(false)

  if (!isOpen) return null

  // Build the vehicle link for WhatsApp / prefilled message
  const vehicleUrl =
    typeof window !== 'undefined' && vehicleId
      ? `${window.location.origin}/vehicles/${vehicleId}`
      : vehicleId
      ? `/vehicles/${vehicleId}`
      : ''

  // Compose a readable label: "2018 Toyota Camry (AR-1042)"
  const vehicleLabel = vehicleTitle
    ? vehicleCarCode
      ? `${vehicleTitle} (${vehicleCarCode})`
      : vehicleTitle
    : vehicleCarCode
    ? `Vehicle ${vehicleCarCode}`
    : 'this vehicle'

  const whatsappMessage = `Hi, I'm interested in ${vehicleLabel}:\n\n${vehicleUrl}`

  const whatsappHref = `https://wa.me/2349161888244?text=${encodeURIComponent(
    whatsappMessage
  )}`

  const handleClose = () => {
    // Reset form when closing
    setName('')
    setWhatsapp('')
    setMessage('')
    setFormError('')
    setFormSuccess(false)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    // Validation
    if (!name.trim()) {
      setFormError('Please enter your name')
      return
    }
    if (!whatsapp.trim()) {
      setFormError('Please enter your WhatsApp number')
      return
    }
    if (!message.trim()) {
      setFormError('Please enter a message')
      return
    }
    if (!vehicleId) {
      setFormError('Vehicle information is missing')
      return
    }

    setSubmitting(true)

    try {
      const { error } = await supabase.from('contact_seller').insert({
        vehicle_id: vehicleId,
        name: name.trim(),
        whatsapp: whatsapp.trim(),
        message: message.trim(),
      })

      if (error) {
        console.error('Contact seller insert error:', error)
        setFormError('Failed to send message. Please try again.')
        setSubmitting(false)
        return
      }

      setFormSuccess(true)
      setSubmitting(false)

      // Auto-close after showing success briefly
      setTimeout(() => {
        handleClose()
      }, 2500)
    } catch (err) {
      console.error('Contact seller error:', err)
      setFormError('An unexpected error occurred')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-3 sm:p-4 lg:p-6 max-w-4xl w-full border border-white/10 shadow-2xl animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-sm sm:text-base lg:text-xl font-bold text-white">
            Contact Seller
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Vehicle context strip */}
        {vehicleTitle && (
          <div className="mb-3 sm:mb-4 px-3 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
            <p className="text-[11px] sm:text-xs text-white/60 truncate">
              Enquiring about:{' '}
              <span className="text-white/90 font-medium">{vehicleTitle}</span>
              {vehicleCarCode && (
                <span className="ml-1.5 font-mono text-red-400">
                  {vehicleCarCode}
                </span>
              )}
            </p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* ============ LEFT: Buyer Notice ============ */}
          <div className="lg:w-1/2">
            <div className="text-sm text-white/60 mb-3 hidden lg:block">
              <p className="font-medium text-white/80">Before you proceed:</p>
            </div>
            <BuyerNotice variant="modal" onClose={() => {}} />
          </div>

          {/* ============ RIGHT: Contact options + form ============ */}
          <div className="lg:w-1/2">
            {/* Quick contact icons */}
            <div className="space-y-2 sm:space-y-3">
              <a
                href="tel:09161888244"
                className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 hover:border-white/10"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs sm:text-sm lg:text-base font-medium text-white">
                    Call Seller
                  </p>
                  <p className="text-[8px] sm:text-xs text-white/40">
                    Direct call connection
                  </p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/30" />
              </a>

              {/* WhatsApp with prefilled vehicle link */}
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 hover:border-white/10"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs sm:text-sm lg:text-base font-medium text-white">
                    WhatsApp
                  </p>
                  <p className="text-[8px] sm:text-xs text-white/40">
                    Vehicle link included automatically
                  </p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/30" />
              </a>

              <a
                href={`mailto:info@autorepublic.com?subject=${encodeURIComponent(
                  vehicleTitle
                    ? `Enquiry: ${vehicleLabel}`
                    : 'Vehicle Enquiry'
                )}&body=${encodeURIComponent(whatsappMessage)}`}
                className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 hover:border-white/10"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs sm:text-sm lg:text-base font-medium text-white">
                    Email
                  </p>
                  <p className="text-[8px] sm:text-xs text-white/40">
                    Send a message
                  </p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/30" />
              </a>
            </div>

            {/* Divider with "or" */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] sm:text-xs text-white/30 uppercase tracking-wider">
                or send a message
              </span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* ============ CONTACT FORM ============ */}
            {formSuccess ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-emerald-400">
                  Message sent!
                </p>
                <p className="text-xs text-emerald-400/70 mt-1">
                  The seller will get back to you soon.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                {formError && (
                  <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="block text-[10px] sm:text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
                    Your Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs sm:text-sm placeholder:text-white/25 focus:outline-none focus:border-red-500/50 focus:bg-white/[0.07] transition-colors"
                      disabled={submitting}
                    />
                  </div>
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="block text-[10px] sm:text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
                    Your WhatsApp Number
                  </label>
                  <div className="relative">
                    <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                    <input
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="e.g. +234 901 234 5678"
                      className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs sm:text-sm placeholder:text-white/25 focus:outline-none focus:border-red-500/50 focus:bg-white/[0.07] transition-colors"
                      disabled={submitting}
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-[10px] sm:text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    placeholder="Hi, I'm interested in this vehicle. Is it still available?"
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs sm:text-sm placeholder:text-white/25 focus:outline-none focus:border-red-500/50 focus:bg-white/[0.07] transition-colors resize-none"
                    disabled={submitting}
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 sm:py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs sm:text-sm font-medium text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Availability note */}
            <div className="mt-4 p-2.5 sm:p-3 bg-white/5 rounded-xl border border-white/5">
              <p className="text-[10px] sm:text-xs text-white/30 text-center">
                Our team is available Monday - Friday, 9AM - 6PM
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Buyer Notice */}
        <div className="lg:hidden mt-6 pt-6 border-t border-white/10">
          <BuyerNotice variant="modal" onClose={() => {}} />
        </div>
      </div>
    </div>
  )
}