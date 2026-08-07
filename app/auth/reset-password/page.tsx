'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError('Please enter your email address')
      return
    }

    setError('')
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setSubmitted(true)
      setLoading(false)
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link href="/auth/login" className="inline-flex items-center gap-2 text-white/40 hover:text-white/60 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Login</span>
        </Link>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Image
              src="/autorepublic.png"
              alt="Auto Republic"
              width={48}
              height={48}
              className="w-12 h-12 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-white">
            Reset Password
          </h1>
          <p className="text-sm text-white/40 mt-1">
            {!submitted 
              ? 'Enter your email to receive a reset link' 
              : 'Check your email for the reset link'
            }
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`w-full pl-10 pr-3 py-2.5 bg-white/5 border rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors ${
                    error ? 'border-red-500/50' : 'border-white/10'
                  }`}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-red-500 hover:bg-red-600 rounded-xl font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div className="text-center py-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <p className="text-white/60 text-sm mb-6">
              We've sent a password reset link to <span className="text-white font-medium">{email}</span>
              <br />
              Please check your email and follow the instructions.
            </p>
            <Link
              href="/auth/login"
              className="inline-block px-6 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-medium text-white transition-all"
            >
              Return to Login
            </Link>
          </div>
        )}

        {/* Signup Link */}
        {!submitted && (
          <p className="text-center text-sm text-white/40 mt-4">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-red-500 hover:text-red-400 font-medium transition-colors">
              Sign Up
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}