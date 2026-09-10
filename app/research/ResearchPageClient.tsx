import type { Metadata } from 'next'
import ResearchPageClient from './ResearchPageClient'

export const metadata: Metadata = {
  title: 'Research & Auto Updates | AutoRepublic',
  description:
    'Compare vehicles side-by-side and read expert car reviews, buying guides, EV insights, maintenance tips, and the latest automotive news on AutoRepublic.',
  keywords: [
    'car research Nigeria',
    'compare cars',
    'car reviews',
    'auto blog Nigeria',
    'buying guide',
    'electric vehicles Nigeria',
    'car news Africa',
    'AutoRepublic blog',
  ],
  alternates: {
    canonical: 'https://autorepublic.ng/research',
  },
  openGraph: {
    title: 'Research & Auto Updates | AutoRepublic',
    description:
      'Compare vehicles and read expert automotive insights, reviews, and news from AutoRepublic.',
    url: 'https://autorepublic.ng/research',
    siteName: 'AutoRepublic',
    type: 'website',
    images: [
      {
        url: 'https://autorepublic.ng/og-research.jpg',
        width: 1200,
        height: 630,
        alt: 'AutoRepublic Research & Auto Updates',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Research & Auto Updates | AutoRepublic',
    description:
      'Compare vehicles and read expert automotive insights, reviews, and news.',
    images: ['https://autorepublic.ng/og-research.jpg'],
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
}

export default function ResearchPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'AutoRepublic Research & Auto Updates',
    description:
      'Expert automotive insights, vehicle comparisons, reviews, and news.',
    url: 'https://autorepublic.ng/research',
    isPartOf: {
      '@type': 'WebSite',
      name: 'AutoRepublic',
      url: 'https://autorepublic.ng',
    },
    publisher: {
      '@type': 'Organization',
      name: 'AutoRepublic',
      logo: {
        '@type': 'ImageObject',
        url: 'https://autorepublic.ng/logo.png',
      },
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ResearchPageClient />
    </>
  )
}