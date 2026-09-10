import type { MetadataRoute } from 'next'
import { supabaseServer } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://autorepublic.ng'
  const now = new Date()

  // ==========================================
  // STATIC PAGES - Only indexable, public pages
  // ==========================================
  // NOTE: Excluded on purpose:
  //  - /auth/*         → login/register flows, no SEO value
  //  - /dashboard/*    → private, requires auth
  //  - /garage         → private
  //  - /legals/*       → keep only if public and useful; low priority
  const staticRoutes: {
    path: string
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
    priority: number
  }[] = [
    // Home
    { path: '', changeFrequency: 'daily', priority: 1.0 },

    // Main navigation
    { path: '/vehicles', changeFrequency: 'hourly', priority: 0.95 },
    { path: '/luxury', changeFrequency: 'daily', priority: 0.9 },
    { path: '/evs', changeFrequency: 'daily', priority: 0.9 },
    { path: '/sports', changeFrequency: 'daily', priority: 0.9 },
    { path: '/collections', changeFrequency: 'daily', priority: 0.85 },
    { path: '/distress', changeFrequency: 'hourly', priority: 0.85 },
    { path: '/preorder', changeFrequency: 'weekly', priority: 0.7 },

    // Content / research / blog (VERY important for discovery)
    { path: '/blog', changeFrequency: 'daily', priority: 0.95 },
    { path: '/research', changeFrequency: 'daily', priority: 0.9 },

    // Support / trust
    { path: '/support', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/contact', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/about', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/faq', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/finance', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/compare', changeFrequency: 'weekly', priority: 0.6 },
    { path: '/sell', changeFrequency: 'monthly', priority: 0.7 },

    // Legal (low priority; keep indexable so Google can verify trust signals)
    { path: '/legals', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/legals/terms', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/legals/privacy', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/legals/cookies', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/legals/buyer-protection', changeFrequency: 'yearly', priority: 0.3 },

    // Vehicle categories
    { path: '/vehicles/sedan', changeFrequency: 'weekly', priority: 0.6 },
    { path: '/vehicles/suv', changeFrequency: 'weekly', priority: 0.6 },
    { path: '/vehicles/truck', changeFrequency: 'weekly', priority: 0.6 },
    { path: '/vehicles/van', changeFrequency: 'weekly', priority: 0.6 },
    { path: '/vehicles/coupe', changeFrequency: 'weekly', priority: 0.6 },
    { path: '/vehicles/convertible', changeFrequency: 'weekly', priority: 0.6 },
  ]

  const staticPages: MetadataRoute.Sitemap = staticRoutes.map((r) => ({
    url: `${baseUrl}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))

  // ==========================================
  // DYNAMIC VEHICLE PAGES
  // ==========================================
  const { data: vehicles, error: vehiclesError } = await supabaseServer
    .from('vehicles')
    .select('id, updated_at, created_at')
    .eq('status', 'active')
    .or('Removed.is.null,Removed.eq.false')
    .order('created_at', { ascending: false })

  if (vehiclesError) {
    console.error('Sitemap vehicle query failed:', vehiclesError)
  }

  const vehiclePages: MetadataRoute.Sitemap = (vehicles ?? []).map((v) => ({
    url: `${baseUrl}/vehicles/${v.id}`,
    lastModified: new Date(v.updated_at || v.created_at || now),
    changeFrequency: 'daily',
    priority: 0.9,
  }))

  // ==========================================
  // DYNAMIC BLOG POSTS  ← THE KEY ADDITION
  // ==========================================
  const { data: blogs, error: blogsError } = await supabaseServer
    .from('blogs')
    .select('slug, updated_at, published_at, is_featured')
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  if (blogsError) {
    console.error('Sitemap blog query failed:', blogsError)
  }

  const blogPages: MetadataRoute.Sitemap = (blogs ?? [])
    .filter((b) => !!b.slug)
    .map((b) => ({
      url: `${baseUrl}/blog/${b.slug}`,
      lastModified: new Date(b.updated_at || b.published_at || now),
      changeFrequency: 'weekly',
      // Featured posts get slightly higher priority
      priority: b.is_featured ? 0.85 : 0.75,
    }))

  // ==========================================
  // OPTIONAL: Category filter pages
  // ==========================================
  const categoryPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/vehicles?condition=brand-new`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/vehicles?condition=foreign-used`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/vehicles?condition=local-used`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ]

  // ==========================================
  // COMBINE ALL PAGES
  // ==========================================
  return [
    ...staticPages,
    ...blogPages,   // ← blog posts now included
    ...vehiclePages,
    ...categoryPages,
  ]
}