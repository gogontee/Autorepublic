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
        ],
      },
      // Optional: Googlebot-specific rules (if you want different behavior for Google)
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/dashboard/',
          '/auth/',
          '/payment/',
          '/api/',
        ],
        // Googlebot can handle Next.js internal files, so we don't block them
      },
    ],
    sitemap: 'https://autorepublic.ng/sitemap.xml',
    host: 'https://autorepublic.ng',
  }
}