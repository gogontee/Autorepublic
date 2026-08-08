import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/providers/AuthProvider'
import GlobalRouteLoader from '@/components/GlobalRouteLoader'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://autorepublic.ng'),

  title: {
    default: 'AutoRepublic — Buy & Sell Vehicles in Nigeria',
    template: '%s | AutoRepublic',
  },

  description:
    'AutoRepublic is a Nigerian vehicle marketplace for buying and selling used, foreign-used, brand-new, electric, luxury and other vehicles.',

  applicationName: 'AutoRepublic',

  keywords: [
    'AutoRepublic',
    'Auto Republic',
    'cars for sale in Nigeria',
    'buy cars in Nigeria',
    'sell cars in Nigeria',
    'used cars Nigeria',
    'foreign used cars Nigeria',
    'brand new cars Nigeria',
    'vehicle marketplace Nigeria',
    'cars marketplace Nigeria',
    'electric vehicles Nigeria',
    'luxury cars Nigeria',
  ],

  authors: [
    {
      name: 'AutoRepublic',
      url: 'https://autorepublic.ng',
    },
  ],

  creator: 'AutoRepublic',
  publisher: 'AutoRepublic',

  alternates: {
    canonical: 'https://autorepublic.ng',
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },

  icons: {
    icon: '/autorepublic.svg',
    shortcut: '/autorepublic.svg',
    apple: '/autorepublic.svg',
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AutoRepublic',
  },

  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: 'https://autorepublic.ng',
    siteName: 'AutoRepublic',
    title: 'AutoRepublic — Buy & Sell Vehicles in Nigeria',
    description:
      'Buy and sell vehicles in Nigeria with AutoRepublic. Explore used, foreign-used, brand-new, electric, luxury and other vehicles.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0a0a0a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white`}>
        <AuthProvider>
  <GlobalRouteLoader>
    {children}
  </GlobalRouteLoader>
</AuthProvider>
      </body>
    </html>
  )
}