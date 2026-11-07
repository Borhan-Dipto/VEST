import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/data';
// Used by wishlist / recently viewed (client) to fetch cards by slug.
export async function GET(req: Request) {
  const slugs = new URL(req.url).searchParams.get('slugs')?.split(',').filter(Boolean).slice(0, 40) || [];
  const all = await getProducts();
  return NextResponse.json(all.filter((p) => slugs.includes(p.slug)));
}
