import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://astrixai.app';
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/app/', '/admin/', '/godview/', '/api/'] },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
