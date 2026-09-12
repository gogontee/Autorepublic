'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

// Inner component that actually reads search params
function ConfirmContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Verifying your email...')

  useEffect(() => {
    const confirmEmail = async () => {
      const code = searchParams?.get('code')
      const errorDescription = searchParams?.get('error_description')

      if (errorDescription) {
        setStatus('error')
        setMessage(errorDescription)
        return
      }

      if (!code) {
        setStatus('error')
        setMessage('Missing confirmation code')
        return
      }

      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
          setStatus('error')
          setMessage(error.message)
          return
        }

        setStatus('success')
        setMessage('Your email has been confirmed!')

        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } catch (err: any) {
        setStatus('error')
        setMessage(err.message || 'Something went wrong')
      }
    }

    confirmEmail()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="flex items-center justify-center mb-6">
          <Image
            src="/autorepublic.png"
            alt="AutoRepublic"
            width={48}
            height={48}
            className="w-12 h-12 object-contain"
          />
        </div>

        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Confirming your email</h1>
            <p className="text-sm text-white/40">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Email confirmed!</h1>
            <p className="text-sm text-white/40 mb-6">{message}</p>
            <p className="text-xs text-white/30">Redirecting to your dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Confirmation failed</h1>
            <p className="text-sm text-white/40 mb-6">{message}</p>
            <Link
              href="/auth/login"
              className="inline-block px-6 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-medium text-white transition-colors"
            >
              Back to Login
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

// Default export wraps the inner component in Suspense
export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center px-4">
          <div className="w-full max-w-md text-center">
            <div className="flex items-center justify-center mb-6">
              <Image
                src="/autorepublic.png"
                alt="AutoRepublic"
                width={48}
                height={48}
                className="w-12 h-12 object-contain"
              />
            </div>
            <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Confirming your email</h1>
            <p className="text-sm text-white/40">Verifying your email...</p>
          </div>
        </div>
      }
    >
      <ConfirmContent />
    </Suspense>
  )
}