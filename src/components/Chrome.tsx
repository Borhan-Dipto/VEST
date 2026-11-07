'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from './Cart';
import { captureUtm, track } from '@/lib/track';

const NAV = [['Shop', '/shop'], ['New Arrivals', '/shop?sort=new'], ['Collections', '/collections'], ['Best Sellers', '/shop?sort=popular']];

export function Header({ announce }: { announce?: { text?: string; show?: boolean } }) {
  const { count, setOpen, wish } = useCart();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [q, setQ] = useState('');
  const path = usePathname();
  const router = useRouter();
  useEffect(() => { setMenu(false); setSearch(false); }, [path]);
  useEffect(() => { captureUtm(); }, []);
  useEffect(() => { if (!path.startsWith('/admin')) track('page_view'); }, [path]);

  const go = (e: React.FormEvent) => { e.preventDefault(); if (!q.trim()) return; track('search', { search: q }); router.push(`/shop?q=${encodeURIComponent(q)}`); };
  if (path.startsWith('/admin') || path.startsWith('/invoice')) return null;

  return (
    <>
      {announce?.show !== false && announce?.text && <div className="bg-ink text-paper meta text-center py-2 px-4">{announce.text}</div>}
      <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur border-b border-ink/10">
        <div className="wrap h-16 flex items-center justify-between gap-2 sm:gap-4">
          <button className="lg:hidden meta h-9 px-2.5 sm:px-3 border border-ink/20 hover:border-ink" onClick={() => setMenu(!menu)} aria-label="Menu">{menu ? 'Close' : 'Menu'}</button>
          <Link href="/" className="brand-mark" aria-label="VEST home"><img src="/v-mark.png" alt="" width="34" height="26" /><span>VEST</span></Link>
          <nav className="hidden lg:flex gap-2 meta" aria-label="Main">{NAV.map(([t, h]) => { const on = !h.includes('?') && (path === h || path.startsWith(h + '/')); return <Link key={t} href={h} className={`h-9 px-3.5 inline-flex items-center border transition-colors ${on ? 'border-ink bg-ink text-paper' : 'border-ink/15 hover:border-ink hover:bg-card'}`}>{t}</Link>; })}</nav>
          <div className="flex items-center gap-2 sm:gap-3 meta">
            <button onClick={() => setSearch(!search)} aria-label="Search" className="h-9 w-9 sm:w-auto sm:px-3 grid sm:inline-flex place-items-center items-center border border-ink/20 hover:border-ink"><svg className="sm:hidden" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><span className="hidden sm:inline">Search</span></button>
            <Link href="/wishlist" className="hidden sm:inline-flex items-center h-9 px-3 border border-ink/20 hover:border-ink">Saved({wish.length})</Link>
            <button onClick={() => setOpen(true)} aria-label={`Bag, ${count} items`} className="h-9 px-2.5 sm:px-3 border border-ink bg-ink text-paper hover:bg-lime hover:text-ink whitespace-nowrap">Bag({count})</button>
          </div>
        </div>
        {search && (
          <form onSubmit={go} className="wrap pb-4">
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tees, collections, vibes…" className="input text-lg" />
          </form>
        )}
        {menu && (
          <nav className="lg:hidden border-t border-ink/10 wrap pt-2 pb-6 flex flex-col" aria-label="Mobile">
            {[...NAV, ['Saved', '/wishlist'], ['Track Order', '/track']].map(([t, h]) => <Link key={t} href={h} className="flex items-center justify-between py-3 border-b border-ink/10 display text-4xl hover:text-signal">{t}<span aria-hidden="true" className="font-sans text-2xl opacity-40">→</span></Link>)}
          </nav>
        )}
      </header>
    </>
  );
}

export function Footer({ social, line, credit }: { social?: Record<string, string>; line?: string; credit?: { show?: boolean; text?: string; link?: string } }) {
  const path = usePathname();
  const [done, setDone] = useState(false);
  if (path.startsWith('/admin') || path.startsWith('/invoice')) return null;
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
          <img src="/v-mark.png" alt="" width="52" height="40" className="mb-8" />
          <p className="display text-6xl md:text-8xl max-w-xl">{line || 'Never blend in.'}</p>
          <form onSubmit={sub} className="mt-8 flex gap-3 max-w-md">
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
            {social?.instagram && <a href={social.instagram} target="_blank" rel="noopener">Instagram</a>}{social?.whatsapp && <a href={`https://wa.me/${social.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener">WhatsApp</a>}{social?.facebook && <a href={social.facebook} target="_blank" rel="noopener">Facebook</a>}{social?.tiktok && <a href={social.tiktok}>TikTok</a>}
          </div>
        </div>
      </div>
      <div className="wrap py-6 border-t border-paper/10 meta opacity-50 flex justify-between"><span>© {new Date().getFullYear()} VEST</span><span>{credit?.show && credit.text ? (credit.link ? <a href={credit.link} target="_blank" rel="noopener" className="hover:opacity-100 underline-offset-4 hover:underline">{credit.text}</a> : credit.text) : 'Independent Graphic Apparel'}</span></div>
    </footer>
  );
}
