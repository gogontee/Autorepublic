import type { MetadataRoute } from 'next'
import { supabaseServer } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://autorepublic.ng'

  // ==========================================
  // STATIC PAGES - Comprehensive list
  // ==========================================
  const staticRoutes = [
    // Home
    '',
    
    // Main navigation
    '/vehicles',
    '/luxury',
    '/evs',
    '/sports',
    '/collections',
    '/preorder',
    
    // Dashboard & User
    '/dashboard',
    '/dashboard/ads',
    '/dashboard/status',
    '/dashboard/sell',
    '/dashboard/store',
    '/garage',
    
    // Authentication
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    
    // Support & Legal
    '/support',
    '/contact',
    '/about',
    '/faq',
    '/research',
    '/finance',
    '/compare',
    '/sell',
    
    // Legal pages
    '/legals',
    '/legals/terms',
    '/legals/privacy',
    '/legals/cookies',
    '/legals/buyer-protection',
    
    // Vehicle categories
    '/vehicles/sedan',
    '/vehicles/suv',
    '/vehicles/truck',
    '/vehicles/van',
    '/vehicles/coupe',
    '/vehicles/convertible',
  ]

  const staticPages: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 
                     route.includes('/vehicles/') ? 'weekly' :
                     route.includes('/legals') ? 'monthly' : 'weekly',
    priority: route === '' ? 1.0 :
              route === '/vehicles' ? 0.9 :
              route === '/luxury' || route === '/evs' || route === '/sports' ? 0.8 :
              route.includes('/legals') ? 0.3 : 0.7,
  }))

  // ==========================================
  // DYNAMIC VEHICLE PAGES
  // ==========================================
  const { data: vehicles, error } = await supabaseServer
    .from('vehicles')
    .select('id, updated_at, created_at, brand, model, year')
    .eq('status', 'active')
    .or('Removed.is.null,Removed.eq.false')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Sitemap vehicle query failed:', error)
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

  // ==========================================
  // DYNAMIC CATEGORY PAGES (Optional)
  // If you have category pages with filtering
  // ==========================================
  const categoryPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/vehicles?condition=brand-new`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/vehicles?condition=foreign-used`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/vehicles?condition=local-used`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ]

  // ==========================================
  // COMBINE ALL PAGES
  // ==========================================
  return [...staticPages, ...vehiclePages, ...categoryPages]
}