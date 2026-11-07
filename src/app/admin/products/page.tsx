'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { db, fmt, refreshSite } from '@/lib/admin';

export default function Products() {
  const [list, setList] = useState<any[]>([]);
  const [q, setQ] = useState(''); const [st, setSt] = useState('');
  const load = () => db.from('products').select('id,slug,title,price,status,badge,featured,sold_count,created_at,images:product_images(url,sort),variants(stock),collection:collections(title)').order('created_at', { ascending: false }).then(({ data }) => setList(data || []));
  useEffect(() => { load(); }, []);

  const shown = list.filter((p) => (!st || p.status === st) && (!q || p.title.toLowerCase().includes(q.toLowerCase())));
  const setStatus = async (id: string, status: string) => { await db.from('products').update({ status }).eq('id', id); refreshSite(); load(); };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-end gap-3 mb-6">
        <h1 className="display text-6xl">Products <span className="text-3xl opacity-40">{list.length}</span></h1>
        <Link href="/admin/products/new" className="btn">+ New product</Link>
      </div>
      <div className="flex gap-2 mb-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className="input !h-11" />
        <select value={st} onChange={(e) => setSt(e.target.value)} className="input !h-11 !w-40"><option value="">All status</option><option>published</option><option>draft</option><option>archived</option></select>
      </div>
      <div className="bg-card divide-y divide-warm">
        {shown.map((p) => {
          const stock = p.variants.reduce((s: number, v: any) => s + v.stock, 0);
          const img = p.images.sort((a: any, b: any) => a.sort - b.sort)[0]?.url;
          return (
            <div key={p.id} className="flex items-center gap-3 p-3">
              {img ? <img src={img} alt="" className="w-12 h-14 object-cover bg-warm" /> : <div className="w-12 h-14 bg-warm" />}
              <Link href={`/admin/products/${p.id}`} className="flex-1 min-w-0">
                <div className="font-medium truncate">{p.title} {p.badge && <span className="meta bg-lime px-1.5 ml-1">{p.badge}</span>}</div>
                <div className="text-sm opacity-60">{fmt(p.price)} · {p.collection?.title || 'No collection'} · {p.sold_count} sold</div>
              </Link>
              <span className={`meta hidden sm:block ${stock === 0 ? 'text-signal' : stock < 10 ? 'text-ink' : 'opacity-60'}`}>{stock} in stock</span>
              <select value={p.status} onChange={(e) => setStatus(p.id, e.target.value)} className={`meta h-9 px-2 border border-warm ${p.status === 'published' ? 'bg-lime' : 'bg-paper'}`}>
                <option>published</option><option>draft</option><option>archived</option>
              </select>
            </div>
          );
        })}
        {!shown.length && <p className="p-6 opacity-60">No products.</p>}
      </div>
    </div>
  );
}
