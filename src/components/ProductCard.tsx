'use client';
import Link from 'next/link';
import { useState } from 'react';
import type { Product } from '@/lib/data';
import { useCart } from './Cart';

const SWATCH: Record<string, string> = { Black: '#111', White: '#fff', Grey: '#9a9a9a', Navy: '#1d2a44', Cream: '#efe6d2' };

export default function ProductCard({ p, big }: { p: Product; big?: boolean }) {
  const { add, wish, toggleWish } = useCart();
  const [quick, setQuick] = useState(false);
  const colors = [...new Set(p.variants.map((v) => v.color))];
  const color = colors[0];
  const off = p.compare_price && p.compare_price > p.price ? Math.round((1 - p.price / p.compare_price) * 100) : 0;
  const img = p.images[0]?.url, img2 = p.images[1]?.url;
  const soldOut = !p.variants.some((v) => v.stock > 0);

  return (
    <div className="group relative">
      <Link href={`/product/${p.slug}`} className={`block relative overflow-hidden bg-card ${big ? 'aspect-[4/5]' : 'aspect-[4/5]'}`}>
        {img && <img src={img} alt={p.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-0" />}
        {img2 && <img src={img2} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100" />}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {p.badge && <span className={`meta px-2 py-1 ${p.badge === 'LIMITED' ? 'bg-signal text-ink' : 'bg-lime text-ink'}`}>{p.badge}</span>}
          {off > 0 && <span className="meta px-2 py-1 bg-ink text-paper">−{off}%</span>}
          {soldOut && <span className="meta px-2 py-1 bg-warm">Sold out</span>}
        </div>
      </Link>
      <button onClick={() => toggleWish(p.slug, p.title)} aria-label="Save" className="absolute top-3 right-3 w-9 h-9 grid place-items-center bg-paper/80 text-lg">
        {wish.includes(p.slug) ? '♥' : '♡'}
      </button>
      {!soldOut && (
        <div className={`absolute left-3 right-3 bottom-[76px] transition-all ${quick ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100 pointer-events-none md:group-hover:pointer-events-auto'} ${quick ? 'pointer-events-auto' : ''}`}>
          <div className="bg-paper p-2 flex gap-1 flex-wrap justify-center">
            {p.variants.filter((v) => v.color === color).map((v) => (
              <button key={v.id} disabled={v.stock < 1}
                onClick={() => { add({ variant_id: v.id, product_id: p.id, slug: p.slug, title: p.title, size: v.size, color: v.color, price: p.price, image: img, qty: 1, max: v.stock }); setQuick(false); }}
                className="meta w-10 h-9 border border-ink/20 hover:bg-ink hover:text-paper disabled:opacity-30 disabled:line-through">{v.size}</button>
            ))}
          </div>
        </div>
      )}
      <div className="pt-3 flex justify-between gap-3">
        <div>
          <Link href={`/product/${p.slug}`} className="font-medium leading-tight">{p.title}</Link>
          <div className="flex gap-1.5 mt-2">{colors.map((c) => <span key={c} title={c} className="w-3 h-3 rounded-full border border-ink/30" style={{ background: SWATCH[c] || c }} />)}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-medium">৳{p.price}</div>
          {off > 0 && <div className="text-sm line-through opacity-40">৳{p.compare_price}</div>}
          {!soldOut && <button onClick={() => setQuick(!quick)} className="md:hidden meta underline mt-1">+ Add</button>}
        </div>
      </div>
    </div>
  );
}
