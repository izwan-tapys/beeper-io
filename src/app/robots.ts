import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://beepme.pro'
  
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/partner', '/partner/terms', '/privacy', '/login'],
      disallow: [
        '/admin',
        '/dashboard',
        '/ads-manager',
        '/api/',
        '/pager/',
        '/promo-poster/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
