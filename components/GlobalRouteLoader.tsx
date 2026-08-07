'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Loading from './Loading'

export default function GlobalRouteLoader({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [pathname])

  return (
    <>
      {loading && <Loading fullScreen text="Loading..." />}
      <div style={{ display: loading ? 'none' : 'block' }}>
        {children}
      </div>
    </>
  )
}