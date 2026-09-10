/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com'],
  },

  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.autorepublic.ng' }],
        destination: 'https://autorepublic.ng/:path*',
        permanent: true, // 301 — tells Google this is the canonical version
      },
    ]
  },
}

module.exports = nextConfig