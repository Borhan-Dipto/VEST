import Link from 'next/link';
import type { Metadata } from 'next';
import { getProducts, getCollections, ShopQuery } from '@/lib/data';
import ProductCard from '@/components/ProductCard';

type SP = Promise<ShopQuery>;
export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const s = await searchParams;
  return { title: s.q ? `Search: ${s.q}` : 'Shop Graphic T-Shirts', description: 'Shop oversized graphic and DTF printed t-shirts in Bangladesh.', alternates: { canonical: '/shop' } };
}

export default async function Shop({ searchParams }: { searchParams: SP }) {
  const s = await searchParams;
  const [list, cols] = await Promise.all([getProducts(s), getCollections()]);
  const chips = Object.entries(s).filter(([k, v]) => v && k !== 'sort');
  const url = (patch: Partial<ShopQuery>) => '/shop?' + new URLSearchParams(Object.entries({ ...s, ...patch }).filter(([, v]) => v) as any).toString();
  const title = s.q ? `“${s.q}”` : s.collection ? cols.find((c) => c.slug === s.collection)?.title || 'Shop' : s.sort === 'popular' ? 'Best Sellers' : 'All Tees';

  return (
    <div className="wrap pt-10">
      <h1 className="display text-7xl md:text-9xl">{title}</h1>
      <p className="meta opacity-60 mt-3">{list.length} products</p>

      <form className="mt-8 grid grid-cols-2 md:grid-cols-6 gap-2 sticky top-16 z-30 bg-paper py-3 border-b border-ink/10">
        {s.q && <input type="hidden" name="q" value={s.q} />}
        <select name="collection" defaultValue={s.collection || ''} className="input !h-11 meta"><option value="">Collection</option>{cols.map((c) => <option key={c.id} value={c.slug}>{c.title}</option>)}</select>
        <select name="size" defaultValue={s.size || ''} className="input !h-11 meta"><option value="">Size</option>{['S', 'M', 'L', 'XL', 'XXL'].map((z) => <option key={z}>{z}</option>)}</select>
        <select name="color" defaultValue={s.color || ''} className="input !h-11 meta"><option value="">Color</option>{['Black', 'White'].map((z) => <option key={z}>{z}</option>)}</select>
        <select name="max" defaultValue={s.max || ''} className="input !h-11 meta"><option value="">Price</option><option value="800">Under ৳800</option><option value="1000">Under ৳1000</option><option value="1500">Under ৳1500</option></select>
        <select name="sort" defaultValue={s.sort || 'new'} className="input !h-11 meta"><option value="new">Newest</option><option value="popular">Popular</option><option value="price-asc">Price ↑</option><option value="price-desc">Price ↓</option></select>
        <button className="btn !h-11">Apply</button>
      </form>

      {!!chips.length && (
        <div className="flex flex-wrap gap-2 mt-4">
          {chips.map(([k, v]) => <Link key={k} href={url({ [k]: '' })} className="meta bg-ink text-paper px-3 py-1.5">{k}: {v} ✕</Link>)}
          <Link href="/shop" className="meta underline px-2 py-1.5">Clear all</Link>
        </div>
      )}

      {list.length ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-10 md:gap-x-5 mt-8">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      ) : (
        <div className="py-24 text-center">
          <p className="font-serif italic text-4xl">Nothing matches that.</p>
          <p className="mt-3 opacity-60">Try “night”, “typography” or browse everything.</p>
          <Link href="/shop" className="btn mt-6">See all tees</Link>
        </div>
      )}
    </div>
  );
}
