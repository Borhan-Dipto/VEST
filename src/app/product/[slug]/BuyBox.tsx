'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Product } from '@/lib/data';
import { useCart } from '@/components/Cart';
import { track } from '@/lib/track';


export default function BuyBox({ p, chart = [], note }: { p: Product; chart?: (string | number)[][]; note?: string }) {
  const { add, wish, toggleWish } = useCart();
  const router = useRouter();
  const colors = [...new Set(p.variants.map((v) => v.color))];
  const [color, setColor] = useState(colors[0]);
  const [size, setSize] = useState('');
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const [guide, setGuide] = useState(false);
  const [err, setErr] = useState('');
  const v = p.variants.find((x) => x.color === color && x.size === size);
  const off = p.compare_price && p.compare_price > p.price ? Math.round((1 - p.price / p.compare_price) * 100) : 0;

  useEffect(() => {
    track('view_item', { items: [{ id: p.id, name: p.title, price: p.price }] });
    try { const r = JSON.parse(localStorage.getItem('vest_recent') || '[]').filter((s: string) => s !== p.slug); localStorage.setItem('vest_recent', JSON.stringify([p.slug, ...r].slice(0, 12))); } catch {}
  }, [p.id]);

  const go = (buyNow: boolean) => {
    if (!v) return setErr('Select a size first');
    add({ variant_id: v.id, product_id: p.id, slug: p.slug, title: p.title, size: v.size, color: v.color, price: p.price, image: p.images[0]?.url, qty, max: v.stock });
    if (buyNow) router.push('/checkout');
  };

  return (
    <div className="grid md:grid-cols-12 gap-8 md:gap-12">
      <div className="md:col-span-7">
        <div className="flex md:grid md:grid-cols-2 gap-2 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0">
          {p.images.map((im, i) => (
            <button key={im.url} onClick={() => setImg(i)} className={`snap-center shrink-0 w-[85%] md:w-auto aspect-[4/5] bg-card overflow-hidden ${i === 0 ? 'md:col-span-2 md:aspect-[5/4]' : ''}`}>
              <img src={im.url} alt={`${p.title} view ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      <div className="md:col-span-5 md:sticky md:top-24 self-start">
        <div className="meta opacity-60">{p.collection?.title} · {p.variants[0]?.sku.split('-')[0]}</div>
        <h1 className="display text-6xl md:text-7xl mt-2">{p.title}</h1>
        <div className="flex items-baseline gap-3 mt-4">
          <span className="text-2xl font-medium">৳{p.price}</span>
          {off > 0 && <><span className="line-through opacity-40">৳{p.compare_price}</span><span className="meta bg-signal px-2 py-1">Save {off}%</span></>}
        </div>
        <p className="mt-5 opacity-80">{p.description}</p>

        <div className="mt-8">
          <div className="meta mb-2">Colour — {color}</div>
          <div className="flex gap-2">{colors.map((c) => (
            <button key={c} onClick={() => { setColor(c); setSize(''); }} className={`meta px-4 h-10 border ${c === color ? 'bg-ink text-paper border-ink' : 'border-ink/20'}`}>{c}</button>
          ))}</div>
        </div>
        <div className="mt-6">
          <div className="flex justify-between meta mb-2"><span>Size {size && `— ${size}`}</span><button onClick={() => setGuide(true)} className="underline">Size guide</button></div>
          <div className="grid grid-cols-5 gap-2">{p.variants.filter((x) => x.color === color).map((x) => (
            <button key={x.id} disabled={x.stock < 1} onClick={() => { setSize(x.size); setErr(''); setQty(1); }}
              className={`h-12 border meta disabled:opacity-30 disabled:line-through ${x.size === size ? 'bg-ink text-paper border-ink' : 'border-ink/20 hover:border-ink'}`}>{x.size}</button>
          ))}</div>
          {v && v.stock <= 5 && <p className="meta text-signal mt-2">Only {v.stock} left</p>}
          {err && <p className="meta text-signal mt-2">{err}</p>}
        </div>

        <div className="mt-6 flex gap-2">
          <div className="flex border border-ink/20 shrink-0">
            <button className="w-11 h-12" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
            <span className="w-8 grid place-items-center">{qty}</span>
            <button className="w-11 h-12" onClick={() => setQty(Math.min(v?.stock || 10, qty + 1))}>+</button>
          </div>
          <button onClick={() => go(false)} className="btn flex-1">Add to bag</button>
          <button onClick={() => toggleWish(p.slug, p.title)} className="btn btn-ghost !px-4" aria-label="Save">{wish.includes(p.slug) ? '♥' : '♡'}</button>
        </div>
        <button onClick={() => go(true)} className="btn !bg-lime !text-ink w-full mt-2">Buy now — Cash on delivery</button>

        <ul className="mt-6 space-y-2 text-sm opacity-80">
          <li>✦ {p.fit} fit · {p.gsm} GSM · {p.fabric}</li><li>✦ DTF print — vivid, flexible, wash-safe</li><li>✦ Delivery 1–5 days · Exchange within 3 days</li>
        </ul>
      </div>

      {/* sticky mobile CTA */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-paper border-t border-ink/10 p-3 flex gap-2">
        <div className="flex-1"><div className="font-medium">{p.title}</div><div className="meta">৳{p.price} {size && `· ${size}`}</div></div>
        <button onClick={() => go(false)} className="btn">Add to bag</button>
      </div>

      {guide && (
        <div className="fixed inset-0 z-50 bg-ink/50 grid place-items-center p-4" onClick={() => setGuide(false)}>
          <div className="bg-paper p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between mb-4"><span className="display text-4xl">Size guide</span><button onClick={() => setGuide(false)} className="meta">✕</button></div>
            <table className="w-full text-left"><thead className="meta"><tr><th className="py-2">Size</th><th>Chest (in)</th><th>Length (in)</th></tr></thead>
              <tbody>{chart.map(([s, c, l]) => <tr key={s} className="border-t border-warm"><td className="py-2 font-medium">{s}</td><td>{c}</td><td>{l}</td></tr>)}</tbody></table>
            {note && <p className="text-sm opacity-60 mt-4">{note}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
