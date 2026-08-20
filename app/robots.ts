// app/robots.ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
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
    sitemap: 'https://autorepublic.ng/sitemap.xml',
    host: 'https://autorepublic.ng',
  }
}