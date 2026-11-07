import { publicClient } from './supabase';

export type Variant = { id: string; size: string; color: string; sku: string; stock: number };
export type Product = {
  id: string; slug: string; title: string; description: string | null; price: number; compare_price: number | null;
  badge: string | null; fabric: string | null; gsm: number | null; fit: string | null; tags: string[]; sold_count: number;
  featured: boolean; created_at: string; seo_title: string | null; seo_desc: string | null;
  collection: { slug: string; title: string } | null;
  images: { url: string; sort: number }[]; variants: Variant[];
};
export type Collection = { id: string; slug: string; title: string; description: string | null; cover_url: string | null };

const SELECT = '*, collection:collections(slug,title), images:product_images(url,sort), variants(id,size,color,sku,stock)';
const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

function tidy(p: any): Product {
  p.images = (p.images || []).sort((a: any, b: any) => a.sort - b.sort);
  p.variants = (p.variants || []).sort((a: any, b: any) => SIZES.indexOf(a.size) - SIZES.indexOf(b.size));
  return p;
}

export type ShopQuery = { q?: string; collection?: string; size?: string; color?: string; min?: string; max?: string; sort?: string; stock?: string };

export async function getProducts(o: ShopQuery & { limit?: number; featured?: boolean } = {}) {
  const db = publicClient();
  let q = db.from('products').select(SELECT).eq('status', 'published');
  if (o.q) q = q.or(`title.ilike.%${o.q.replace(/[%,()]/g, '')}%,tags.cs.{${o.q.toLowerCase().replace(/[^a-z0-9-]/g, '')}}`);
  if (o.collection) {
    const { data: c } = await db.from('collections').select('id').eq('slug', o.collection).single();
    if (c) q = q.eq('collection_id', c.id);
  }
  if (o.min) q = q.gte('price', +o.min);
  if (o.max) q = q.lte('price', +o.max);
  if (o.featured) q = q.eq('featured', true);
  const sort = o.sort || 'new';
  q = sort === 'price-asc' ? q.order('price') : sort === 'price-desc' ? q.order('price', { ascending: false })
    : sort === 'popular' ? q.order('sold_count', { ascending: false }) : q.order('created_at', { ascending: false });
  if (o.limit) q = q.limit(o.limit);
  const { data } = await q;
  let list = (data || []).map(tidy);
  if (o.size || o.color || o.stock) {
    list = list.filter((p) => p.variants.some((v) =>
      (!o.size || v.size === o.size) && (!o.color || v.color === o.color) && (!o.stock || v.stock > 0)));
  }
  return list;
}

export async function getProduct(slug: string) {
  const { data } = await publicClient().from('products').select(SELECT).eq('slug', slug).eq('status', 'published').single();
  return data ? tidy(data) : null;
}

export async function getCollections(): Promise<Collection[]> {
  const { data } = await publicClient().from('collections').select('*').eq('active', true).order('sort');
  return data || [];
}

export async function getSettings(): Promise<Record<string, any>> {
  const { data } = await publicClient().from('settings').select('key,value').eq('public', true);
  return Object.fromEntries((data || []).map((r) => [r.key, r.value]));
}

export const taka = (n: number) => '৳' + n.toLocaleString('en-IN');
export const offPct = (p: Product) => (p.compare_price && p.compare_price > p.price ? Math.round((1 - p.price / p.compare_price) * 100) : 0);
