import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/providers/AuthProvider'
import GlobalRouteLoader from '@/components/GlobalRouteLoader'
import StructuredData from '@/components/StructuredData'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://www.autorepublic.ng'),

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
      url: 'https://www.autorepublic.ng',
    },
  ],

  creator: 'AutoRepublic',
  publisher: 'AutoRepublic',

  alternates: {
    canonical: 'https://www.autorepublic.ng',
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

  // ==========================================
  // COMPREHENSIVE FAVICON CONFIGURATION
  // ==========================================
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/autorepublic.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
    shortcut: [
      { url: '/autorepublic.svg' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/autorepublic.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
    other: [
      {
        rel: 'manifest',
        url: '/site.webmanifest',
      },
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#ef4444',
      },
    ],
  },

  // ==========================================
  // APPLE WEB APP
  // ==========================================
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AutoRepublic',
  },

  // ==========================================
  // OPEN GRAPH / SOCIAL SHARING
  // ==========================================
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: 'https://www.autorepublic.ng',
    siteName: 'AutoRepublic',
    title: 'AutoRepublic — Buy & Sell Vehicles in Nigeria',
    description:
      'Buy and sell vehicles in Nigeria with AutoRepublic. Explore used, foreign-used, brand-new, electric, luxury and other vehicles.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AutoRepublic - Your Destination for Better Vehicles',
        type: 'image/png',
      },
    ],
  },

  // ==========================================
  // TWITTER CARD
  // ==========================================
  twitter: {
    card: 'summary_large_image',
    title: 'AutoRepublic — Buy & Sell Vehicles in Nigeria',
    description:
      'Buy and sell vehicles in Nigeria with AutoRepublic. Explore used, foreign-used, brand-new, electric, luxury and other vehicles.',
    images: [
      {
        url: '/og-image.png',
        alt: 'AutoRepublic - Your Destination for Better Vehicles',
      },
    ],
  },

  // ==========================================
  // VERIFICATION FOR GOOGLE SEARCH CONSOLE
  // ==========================================
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || '',
  },

  // ==========================================
  // OTHER METADATA
  // ==========================================
  category: 'automotive',
  classification: 'Vehicle Marketplace',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  colorScheme: 'dark light',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Additional meta tags for better SEO */}
        <meta name="author" content="AutoRepublic" />
        <meta name="robots" content="index, follow" />
        <meta name="revisit-after" content="1 days" />
        
        {/* Google Search Console verification - fallback */}
        {process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION && (
          <meta name="google-site-verification" content={process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION} />
        )}
        
        {/* MS Application Tile */}
        <meta name="msapplication-TileColor" content="#0a0a0a" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* PWA manifest */}
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Preconnect to external resources for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} bg-black text-white`}>
        <StructuredData />

        <AuthProvider>
          <GlobalRouteLoader>
            {children}
          </GlobalRouteLoader>
        </AuthProvider>
      </body>
    </html>
  )
} 