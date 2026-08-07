import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/providers/AuthProvider'
import GlobalRouteLoader from '@/components/GlobalRouteLoader'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Auto Republic',
  description: 'Your premium auto sales hub',
  icons: {
    icon: '/autorepublic.svg',
    shortcut: '/autorepublic.svg',
    apple: '/autorepublic.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
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
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Auto Republic" />
      </head>
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