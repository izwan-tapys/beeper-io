import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://beepme.pro'
  const lastModified = new Date()

  const routes = [
    '',
    '/partner',
    '/partner/terms',
    '/privacy',
    '/login',
  ]

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }))
}
