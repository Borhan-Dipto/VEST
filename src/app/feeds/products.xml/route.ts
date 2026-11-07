import { getProducts } from '@/lib/data';
// Product feed in Google Merchant / Meta Catalog format (RSS 2.0 + g: namespace). One item per variant.
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
export const revalidate = 3600;
const x = (s: any) => String(s ?? '').replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]!));
export async function GET() {
  // Meta/Google accept only JPG/PNG/WEBP/GIF — skip products without one (e.g. demo SVGs)
  const ok = (u = '') => /\.(jpe?g|png|webp|gif)(\?|$)/i.test(u);
  const ps = (await getProducts()).map((p) => ({ ...p, images: p.images.filter((i) => ok(i.url)) })).filter((p) => p.images.length && !p.tags?.includes('sample'));
  const abs = (u: string) => (u.startsWith('http') ? u : SITE + u);
  const items = ps.flatMap((p) => p.variants.map((v) => `<item><g:id>${x(v.sku)}</g:id><g:item_group_id>${x(p.id)}</g:item_group_id><g:title>${x(`${p.title} — ${v.color} ${v.size}`)}</g:title><g:description>${x(p.description || p.title)}</g:description><g:link>${x(`${SITE}/product/${p.slug}`)}</g:link><g:image_link>${x(abs(p.images[0]?.url || ''))}</g:image_link>${p.images.slice(1, 5).map((i) => `<g:additional_image_link>${x(abs(i.url))}</g:additional_image_link>`).join('')}<g:availability>${v.stock > 0 ? 'in_stock' : 'out_of_stock'}</g:availability><g:price>${p.compare_price && p.compare_price > p.price ? p.compare_price : p.price} BDT</g:price>${p.compare_price && p.compare_price > p.price ? `<g:sale_price>${p.price} BDT</g:sale_price>` : ''}<g:brand>VEST</g:brand><g:condition>new</g:condition><g:color>${x(v.color)}</g:color><g:size>${x(v.size)}</g:size><g:gender>unisex</g:gender><g:age_group>adult</g:age_group><g:google_product_category>212</g:google_product_category><g:product_type>${x(p.collection?.title || 'T-Shirts')}</g:product_type><g:identifier_exists>no</g:identifier_exists></item>`));
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><title>VEST</title><link>${SITE}</link><description>VEST product feed</description>${items.join('')}</channel></rss>`;
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
}
