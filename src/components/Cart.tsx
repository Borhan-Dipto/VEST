'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Link from 'next/link';
import { track } from '@/lib/track';

export type Line = { variant_id: string; product_id: string; slug: string; title: string; size: string; color: string; price: number; image: string; qty: number; max: number };
type Ctx = {
  lines: Line[]; add: (l: Line) => void; setQty: (id: string, q: number) => void; remove: (id: string) => void; clear: () => void;
  open: boolean; setOpen: (o: boolean) => void; count: number; subtotal: number;
  wish: string[]; toggleWish: (slug: string, title?: string) => void;
};
const C = createContext<Ctx>(null as any);
export const useCart = () => useContext(C);
const load = (k: string) => { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch { return []; } };

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [wish, setWish] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => { setLines(load('vest_cart')); setWish(load('vest_wish')); setReady(true); }, []);
  useEffect(() => { if (ready) try { localStorage.setItem('vest_cart', JSON.stringify(lines)); localStorage.setItem('vest_wish', JSON.stringify(wish)); } catch {} }, [lines, wish, ready]);

  const add = (l: Line) => {
    setLines((ls) => {
      const ex = ls.find((x) => x.variant_id === l.variant_id);
      return ex ? ls.map((x) => (x === ex ? { ...x, qty: Math.min(x.qty + l.qty, x.max) } : x)) : [...ls, l];
    });
    track('add_to_cart', { items: [{ id: l.product_id, name: l.title, price: l.price, qty: l.qty, variant: `${l.size}/${l.color}` }] });
    setOpen(true);
  };
  const setQty = (id: string, q: number) => setLines((ls) => ls.map((x) => (x.variant_id === id ? { ...x, qty: Math.max(1, Math.min(q, x.max)) } : x)));
  const remove = (id: string) => setLines((ls) => ls.filter((x) => x.variant_id !== id));
  const toggleWish = (slug: string, title?: string) => setWish((w) => {
    if (w.includes(slug)) return w.filter((s) => s !== slug);
    track('add_to_wishlist', { items: [{ id: slug, name: title || slug, price: 0 }] });
    return [...w, slug];
  });
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const subtotal = lines.reduce((s, l) => s + l.qty * l.price, 0);

  return (
    <C.Provider value={{ lines, add, setQty, remove, clear: () => setLines([]), open, setOpen, count, subtotal, wish, toggleWish }}>
      {children}
      <Drawer />
    </C.Provider>
  );
}

function Drawer() {
  const { lines, open, setOpen, setQty, remove, subtotal } = useCart();
  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}>
      <div onClick={() => setOpen(false)} className={`absolute inset-0 bg-ink/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} />
      <aside className={`absolute right-0 top-0 h-full w-full max-w-md bg-paper flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-5 border-b border-warm">
          <span className="display text-3xl">Your Bag</span>
          <button onClick={() => setOpen(false)} className="meta">Close ✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {!lines.length && <p className="font-serif italic text-2xl">Nothing here yet.</p>}
          {lines.map((l) => (
            <div key={l.variant_id} className="flex gap-4">
              <img src={l.image} alt={l.title} className="w-20 h-24 object-cover bg-warm" />
              <div className="flex-1">
                <div className="flex justify-between"><span className="font-medium">{l.title}</span><span>৳{l.price * l.qty}</span></div>
                <div className="meta opacity-60 mt-1">{l.size} / {l.color}</div>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex border border-warm">
                    <button className="w-8 h-8" onClick={() => setQty(l.variant_id, l.qty - 1)}>−</button>
                    <span className="w-8 h-8 grid place-items-center text-sm">{l.qty}</span>
                    <button className="w-8 h-8" onClick={() => setQty(l.variant_id, l.qty + 1)}>+</button>
                  </div>
                  <button className="meta underline opacity-60" onClick={() => remove(l.variant_id)}>Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {!!lines.length && (
          <div className="p-5 border-t border-warm space-y-3">
            <div className="flex justify-between"><span className="meta">Subtotal</span><span className="font-medium">৳{subtotal}</span></div>
            <p className="text-xs opacity-60">Delivery charge calculated at checkout.</p>
            <Link href="/checkout" onClick={() => setOpen(false)} className="btn w-full">Checkout →</Link>
          </div>
        )}
      </aside>
    </div>
  );
}
