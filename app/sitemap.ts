import type { MetadataRoute } from 'next'
import { supabaseServer } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://autorepublic.ng'

  const staticRoutes = [
    '',
    '/about',
    '/collections',
    '/compare',
    '/contact',
    '/evs',
    '/finance',
    '/legals',
    '/legals/buyer-protection',
    '/legals/cookies',
    '/legals/privacy',
    '/legals/terms',
    '/luxury',
    '/research',
    '/sell',
    '/sports',
    '/support',
    '/vehicles',
  ]

  const staticPages: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : 0.8,
  }))

  // Get active vehicles that are publicly available
  const { data: vehicles, error } = await supabaseServer
    .from('vehicles')
    .select('id, updated_at, created_at')
    .eq('status', 'active')

  if (error) {
    console.error('Sitemap vehicle query failed:', error)

    // Still return the static sitemap if the database query fails
    return staticPages
  }

  const vehiclePages: MetadataRoute.Sitemap = (vehicles ?? []).map(
    (vehicle) => ({
      url: `${baseUrl}/vehicles/${vehicle.id}`,
      lastModified: new Date(
        vehicle.updated_at || vehicle.created_at || new Date()
      ),
      changeFrequency: 'daily',
      priority: 0.9,
    })
  )

  return [...staticPages, ...vehiclePages]
}