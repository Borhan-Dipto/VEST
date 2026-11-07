'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from './Cart';
import { captureUtm, track } from '@/lib/track';

const NAV = [['Shop', '/shop'], ['New Arrivals', '/shop?sort=new'], ['Collections', '/collections'], ['Best Sellers', '/shop?sort=popular']];

export function Header() {
  const { count, setOpen, wish } = useCart();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [q, setQ] = useState('');
  const path = usePathname();
  const router = useRouter();
  useEffect(() => { setMenu(false); setSearch(false); }, [path]);
  useEffect(() => { captureUtm(); }, []);
  useEffect(() => { track('page_view'); }, [path]);

  const go = (e: React.FormEvent) => { e.preventDefault(); if (!q.trim()) return; track('search', { search: q }); router.push(`/shop?q=${encodeURIComponent(q)}`); };
  if (path.startsWith('/admin')) return null;

  return (
    <>
      <div className="bg-ink text-paper meta text-center py-2">Cash on delivery all over Bangladesh · Free exchange within 3 days</div>
      <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur border-b border-ink/10">
        <div className="wrap h-16 flex items-center justify-between gap-4">
          <button className="md:hidden meta" onClick={() => setMenu(!menu)} aria-label="Menu">{menu ? 'Close' : 'Menu'}</button>
          <Link href="/" className="display text-4xl tracking-tight">VEST<sup className="text-xs align-top font-mono">™</sup></Link>
          <nav className="hidden md:flex gap-8 meta">{NAV.map(([t, h]) => <Link key={t} href={h} className="hover:underline underline-offset-4">{t}</Link>)}</nav>
          <div className="flex items-center gap-4 meta">
            <button onClick={() => setSearch(!search)} aria-label="Search">Search</button>
            <Link href="/wishlist" className="hidden sm:inline">Saved({wish.length})</Link>
            <Link href="/account" className="hidden sm:inline">Account</Link>
            <button onClick={() => setOpen(true)} className="bg-ink text-paper px-3 py-1.5">Bag({count})</button>
          </div>
        </div>
        {search && (
          <form onSubmit={go} className="wrap pb-4">
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tees, collections, vibes…" className="input text-lg" />
          </form>
        )}
        {menu && (
          <nav className="md:hidden border-t border-ink/10 wrap py-6 flex flex-col gap-3">
            {[...NAV, ['Saved', '/wishlist'], ['Account', '/account'], ['Track Order', '/track']].map(([t, h]) => <Link key={t} href={h} className="display text-5xl">{t}</Link>)}
          </nav>
        )}
      </header>
    </>
  );
}

export function Footer({ social }: { social?: Record<string, string> }) {
  const path = usePathname();
  const [done, setDone] = useState(false);
  if (path.startsWith('/admin')) return null;
  const sub = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get('email');
    await fetch('/api/subscribe', { method: 'POST', body: JSON.stringify({ email }) });
    setDone(true);
  };
  return (
    <footer className="bg-ink text-paper mt-24">
      <div className="wrap py-16 grid gap-12 md:grid-cols-2">
        <div>
          <p className="display text-6xl md:text-8xl">Never<br />blend in.</p>
          <form onSubmit={sub} className="mt-8 flex max-w-md">
            <input name="email" type="email" required placeholder="Email for drop alerts" className="input !bg-transparent !border-paper/30 text-paper" />
            <button className="btn !bg-lime !text-ink shrink-0">{done ? 'Joined ✓' : 'Join'}</button>
          </form>
        </div>
        <div className="grid grid-cols-2 gap-8 meta">
          <div className="flex flex-col gap-3 opacity-80">
            <span className="opacity-50">Shop</span>
            <Link href="/shop">All Tees</Link><Link href="/collections">Collections</Link><Link href="/shop?sort=popular">Best Sellers</Link><Link href="/wishlist">Saved</Link>
          </div>
          <div className="flex flex-col gap-3 opacity-80">
            <span className="opacity-50">Help</span>
            <Link href="/track">Track Order</Link><Link href="/policy/shipping">Shipping</Link><Link href="/policy/returns">Returns & Exchange</Link>
            <Link href="/policy/privacy">Privacy</Link><Link href="/policy/terms">Terms</Link>
            {social?.instagram && <a href={social.instagram}>Instagram</a>}{social?.facebook && <a href={social.facebook}>Facebook</a>}{social?.tiktok && <a href={social.tiktok}>TikTok</a>}
          </div>
        </div>
      </div>
      <div className="wrap py-6 border-t border-paper/10 meta opacity-50 flex justify-between"><span>© {new Date().getFullYear()} VEST</span><span>Independent Graphic Apparel</span></div>
    </footer>
  );
}
