'use client'

import { ReactNode } from 'react'
import Header from './Header'
import BottomNav from './BottomNav'

interface LayoutWrapperProps {
  children: ReactNode
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="pb-24 md:pb-6">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}