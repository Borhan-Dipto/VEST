'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/components/Cart';
import ProductCard from '@/components/ProductCard';
export default function Wish() {
  const { wish } = useCart();
  const [list, setList] = useState<any[]>([]); const [recent, setRecent] = useState<any[]>([]);
  useEffect(() => {
    const r = (() => { try { return JSON.parse(localStorage.getItem('vest_recent') || '[]'); } catch { return []; } })();
    fetch('/api/products?slugs=' + [...wish, ...r].join(',')).then((x) => x.json()).then((all) => {
      setList(all.filter((p: any) => wish.includes(p.slug))); setRecent(all.filter((p: any) => r.includes(p.slug) && !wish.includes(p.slug)).slice(0, 4));
    });
  }, [wish.join()]);
  return (
    <div className="wrap pt-10">
      <h1 className="display text-7xl md:text-9xl">Saved</h1>
      {!wish.length && <p className="font-serif italic text-3xl mt-6">Tap ♡ on any tee to save it here. <Link href="/shop" className="underline">Browse</Link></p>}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-10 md:gap-x-5 mt-8">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      {!!recent.length && <><h2 className="display text-5xl mt-20 mb-8">Recently viewed</h2><div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-10 md:gap-x-5">{recent.map((p) => <ProductCard key={p.id} p={p} />)}</div></>}
    </div>
  );
}
