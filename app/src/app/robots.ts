import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://getpodbrain.ai'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/episodes/',
          '/upload/',
          '/vocabulary/',
          '/settings/',
          '/experts/',
          '/support/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
