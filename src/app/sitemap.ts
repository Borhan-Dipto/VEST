import type { MetadataRoute } from 'next';
import { getProducts, getCollections } from '@/lib/data';
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
export const revalidate = 3600;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [ps, cs] = await Promise.all([getProducts(), getCollections()]);
  return [
    ...['', '/shop', '/collections'].map((u) => ({ url: SITE + u, changeFrequency: 'daily' as const, priority: 1 })),
    ...cs.map((c) => ({ url: `${SITE}/collections/${c.slug}`, priority: 0.8 })),
    ...ps.map((p) => ({ url: `${SITE}/product/${p.slug}`, lastModified: p.created_at, priority: 0.9 })),
  ];
}
