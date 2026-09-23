import type { MetadataRoute } from 'next';

const publicRoutes = ['', '/pricing', '/contact', '/login', '/signup', '/privacy', '/terms', '/refund'];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://astrix.ai';
  return publicRoutes.map((path) => ({
    url: `${baseUrl}${path}`,
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : 0.6,
  }));
}
