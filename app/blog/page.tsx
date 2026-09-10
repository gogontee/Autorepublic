import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import Ads from '@/components/Ads'

export const metadata: Metadata = {
  title: 'AutoRepublic Blog — Car Reviews, Buying Guides & Auto News',
  description:
    'Browse expert car reviews, buying guides, EV insights, maintenance tips, and the latest automotive news from AutoRepublic.',
  alternates: { canonical: 'https://autorepublic.ng/blog' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'AutoRepublic Blog — Car Reviews, Buying Guides & Auto News',
    description:
      'Expert car reviews, buying guides, EV insights, and the latest automotive news from AutoRepublic.',
    url: 'https://autorepublic.ng/blog',
    siteName: 'AutoRepublic',
    type: 'website',
  },
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const revalidate = 3600

export default async function BlogIndexPage() {
  const { data: blogs } = await supabase
    .from('blogs')
    .select('id, title, slug, excerpt, cover_image, category, published_at, author')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(100)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'AutoRepublic Blog',
    url: 'https://autorepublic.ng/blog',
    blogPost: (blogs || []).map((b) => ({
      '@type': 'BlogPosting',
      headline: b.title,
      url: `https://autorepublic.ng/blog/${b.slug}`,
      datePublished: b.published_at,
      author: { '@type': 'Person', name: b.author || 'AutoRepublic' },
      image: b.cover_image,
    })),
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />

      {/* Ads Section - Below Header (same pattern as your other pages) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <Ads className="rounded-2xl overflow-hidden shadow-lg shadow-red-500/5" />
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="pt-2 md:pt-4 pb-24 md:pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            AutoRepublic Blog
          </h1>
          <p className="text-sm text-white/40 mb-6">
            Expert car reviews, buying guides, EV insights, and the latest automotive news.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {blogs?.map((b) => (
              <Link
                key={b.id}
                href={`/blog/${b.slug}`}
                className="group block rounded-xl overflow-hidden bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition"
              >
                {b.cover_image ? (
                  <img
                    src={b.cover_image}
                    alt={b.title}
                    className="w-full h-40 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-40 sm:h-48 bg-gradient-to-br from-gray-800 to-gray-900" />
                )}
                <div className="p-3 sm:p-4">
                  <span className="text-[10px] sm:text-xs font-medium text-red-400">
                    {b.category || 'General'}
                  </span>
                  <h2 className="text-sm sm:text-base font-semibold text-white mt-1 line-clamp-2 group-hover:text-red-400 transition-colors">
                    {b.title}
                  </h2>
                  <p className="text-xs text-white/60 mt-1.5 line-clamp-2">
                    {b.excerpt}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {(!blogs || blogs.length === 0) && (
            <div className="text-center py-16">
              <p className="text-white/40">No articles published yet.</p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}