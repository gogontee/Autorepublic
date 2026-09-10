// app/robots.ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/dashboard/',
          '/auth/',
          '/payment/',
          '/api/',
          '/testads/',
          '/_next/',
          '/_vercel/',
          '/_static/',
          // Also block these if they exist
          '/garage/',
          '/checkout/',
          '/private/',
        ],
      },
      // Googlebot — same rules but explicitly declared (helps for clarity + GSC diagnostics)
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/dashboard/',
          '/auth/',
          '/payment/',
          '/api/',
          '/testads/',
          '/garage/',
          '/checkout/',
        ],
      },
      // Googlebot-Image — make sure blog/vehicle images are crawlable
      {
        userAgent: 'Googlebot-Image',
        allow: [
          '/blog/',
          '/vehicles/',
          '/images/',
          '/uploads/',
        ],
        disallow: ['/admin/', '/dashboard/', '/auth/'],
      },
      // Bingbot — many Nigeria users land via Bing/Edge, so worth being explicit
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/admin/',
          '/dashboard/',
          '/auth/',
          '/payment/',
          '/api/',
        ],
      },
    ],
    sitemap: 'https://autorepublic.ng/sitemap.xml',
    host: 'https://autorepublic.ng',
  }
}