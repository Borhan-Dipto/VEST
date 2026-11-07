import Link from 'next/link';
import { getProducts, getCollections, getSettings } from '@/lib/data';
import ProductCard from '@/components/ProductCard';

export const revalidate = 60;

export default async function Home() {
  const [s, fresh, best, cols] = await Promise.all([getSettings(), getProducts({ limit: 8 }), getProducts({ sort: 'popular', limit: 4 }), getCollections()]);
  const h = s.hero || {}, ed = s.editorial || {}, mq: string[] = s.marquee?.items || [];

  return (
    <>
      {/* HERO */}
      <section className="wrap pt-6 md:pt-10">
        <div className="flex justify-between meta opacity-60 mb-4"><span>{h.kicker}</span><span className="hidden sm:inline">Dhaka, BD — Ships nationwide</span></div>
        <div className="grid md:grid-cols-12 gap-6 items-end">
          <h1 className="display reveal md:col-span-7 text-[19vw] md:text-[10.5vw] lg:text-[9.5rem]">
            {h.title}<br /><span className="text-signal">{h.title2}</span>
          </h1>
          <div className="md:col-span-5 relative aspect-[4/5] md:aspect-[3/4] overflow-hidden img-zoom">
            <img src={h.image} alt="VEST campaign" className="absolute inset-0 w-full h-full object-cover" />
            <span className="absolute bottom-3 left-3 meta bg-lime px-2 py-1">Drop 01 / Live now</span>
          </div>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row gap-6 sm:items-center justify-between border-t border-ink pt-6">
          <p className="font-serif italic text-2xl md:text-3xl max-w-xl">{h.text}</p>
          <Link href={h.link || '/shop'} className="btn shrink-0">{h.cta} →</Link>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="mt-16 bg-lime overflow-hidden py-4 border-y border-ink">
        <div className="marquee">{[...mq, ...mq, ...mq, ...mq].map((t, i) => <span key={i} className="display text-4xl md:text-6xl px-6 whitespace-nowrap">{t} ✦</span>)}</div>
      </div>

      {/* NEW ARRIVALS */}
      <section className="wrap mt-20">
        <div className="flex items-end justify-between mb-8">
          <h2 className="display text-6xl md:text-8xl">New<br />Arrivals</h2>
          <Link href="/shop?sort=new" className="meta underline underline-offset-4">View all ({fresh.length}+)</Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-10 md:gap-x-5">
          {fresh.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>

      {/* COLLECTIONS — asymmetric editorial grid */}
      <section className="wrap mt-28">
        <div className="flex justify-between items-baseline mb-8"><h2 className="display text-6xl md:text-8xl">Collections</h2><span className="meta opacity-60">{String(cols.length).padStart(2, '0')} stories</span></div>
        <div className="grid grid-cols-2 md:grid-cols-12 gap-3 md:gap-5">
          {cols.map((c, i) => (
            <Link key={c.id} href={`/collections/${c.slug}`}
              className={`group relative overflow-hidden img-zoom ${['md:col-span-7 aspect-[4/5] md:aspect-[16/11]', 'md:col-span-5 aspect-[4/5] md:aspect-auto', 'md:col-span-5 aspect-[4/5]', 'md:col-span-7 aspect-[4/5] md:aspect-auto'][i % 4]}`}>
              <img src={c.cover_url || ''} alt={c.title} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
              <div className="absolute bottom-0 p-4 md:p-6 text-paper">
                <span className="meta opacity-70">No. {String(i + 1).padStart(2, '0')}</span>
                <h3 className="display text-3xl md:text-6xl">{c.title}</h3>
                <p className="hidden md:block text-sm opacity-80 mt-2 max-w-sm">{c.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* EDITORIAL */}
      <section className="mt-28 bg-ink text-paper">
        <div className="wrap py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div className="aspect-[4/5] overflow-hidden"><img src={ed.image} alt="" className="w-full h-full object-cover" /></div>
          <div>
            <span className="meta text-lime">Editorial — Issue 01</span>
            <h2 className="display text-6xl md:text-8xl mt-4">{ed.title}</h2>
            <p className="font-serif italic text-2xl md:text-3xl mt-6 opacity-80">{ed.text}</p>
            <Link href={ed.link || '/shop'} className="btn !bg-lime !text-ink mt-8">{ed.cta} →</Link>
          </div>
        </div>
      </section>

      {/* BEST SELLERS */}
      <section className="wrap mt-28">
        <div className="flex items-end justify-between mb-8">
          <h2 className="display text-6xl md:text-8xl">Best<span className="font-serif italic normal-case text-5xl md:text-7xl"> sellers</span></h2>
          <Link href="/shop?sort=popular" className="meta underline underline-offset-4">Shop all</Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-10 md:gap-x-5">{best.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      </section>

      {/* STATEMENT */}
      <section className="wrap mt-28 text-center">
        <p className="display text-[16vw] md:text-[11rem]">Wear what<br />you <span className="text-signal">feel.</span></p>
        <p className="meta mt-6 opacity-60">VEST — Independent Graphic Apparel · DTF printed · 180 GSM cotton</p>
      </section>
    </>
  );
}
