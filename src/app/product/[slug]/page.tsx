import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProduct, getProducts, getSettings } from '@/lib/data';
import ProductCard from '@/components/ProductCard';
import BuyBox from './BuyBox';

type P = { params: Promise<{ slug: string }> };
export const revalidate = 60;
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  if (!p) return {};
  const title = p.seo_title || `${p.title} — Graphic T-Shirt`;
  const description = p.seo_desc || `${p.description || ''} DTF printed ${p.fit} tee, ${p.gsm} GSM. ৳${p.price}. Cash on delivery in Bangladesh.`;
  return { title, description, alternates: { canonical: `/product/${p.slug}` },
    openGraph: { title, description, images: p.images.slice(0, 1).map((i) => ({ url: i.url })), type: 'website' } };
}

export default async function ProductPage({ params }: P) {
  const p = await getProduct((await params).slug);
  if (!p) notFound();
  const info = (await getSettings()).product_info || {};
  const related = (await getProducts({ collection: p.collection?.slug, limit: 5 })).filter((x) => x.id !== p.id).slice(0, 4);
  const inStock = p.variants.some((v) => v.stock > 0);
  const ld = {
    '@context': 'https://schema.org', '@type': 'Product', name: p.title, description: p.description, sku: p.variants[0]?.sku,
    image: p.images.map((i) => (i.url.startsWith('http') ? i.url : SITE + i.url)), brand: { '@type': 'Brand', name: 'VEST' },
    offers: { '@type': 'Offer', priceCurrency: 'BDT', price: p.price, url: `${SITE}/product/${p.slug}`,
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', itemCondition: 'https://schema.org/NewCondition' },
  };

  return (
    <div className="wrap pt-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <BuyBox p={p} chart={info.size_chart} note={info.size_note} />
      <section className="mt-20 grid md:grid-cols-3 gap-10 border-t border-ink pt-10">
        <div><h3 className="meta mb-3">Fabric & Print</h3><p>{p.fabric}, {p.gsm} GSM. {p.fit} fit. {info.print}</p></div>
        <div><h3 className="meta mb-3">Care</h3><p>{info.care}</p></div>
        <div><h3 className="meta mb-3">Delivery & Exchange</h3><p>{info.delivery}</p></div>
      </section>
      {!!related.length && (
        <section className="mt-24">
          <h2 className="display text-5xl md:text-7xl mb-8">You might also like</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-10 md:gap-x-5">{related.map((r) => <ProductCard key={r.id} p={r} />)}</div>
        </section>
      )}
    </div>
  );
}
