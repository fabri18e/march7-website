import { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_URL || 'https://www.march7.net';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/account', '/orders', '/success'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
