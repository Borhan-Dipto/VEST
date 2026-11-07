'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { db, fmt, when } from '@/lib/admin';

const RANGES: [string, number][] = [['Today', 0], ['7 days', 7], ['30 days', 30], ['All time', 3650]];

export default function Dashboard() {
  const [days, setDays] = useState(7);
  const [orders, setOrders] = useState<any[]>([]);
  const [low, setLow] = useState<any[]>([]);
  const [top, setTop] = useState<any[]>([]);

  useEffect(() => {
    const from = new Date(); from.setHours(0, 0, 0, 0); from.setDate(from.getDate() - days);
    db.from('orders').select('id,order_no,customer_name,phone,total,status,production_status,created_at').gte('created_at', from.toISOString()).order('created_at', { ascending: false }).limit(1000).then(({ data }) => setOrders(data || []));
    db.from('variants').select('sku,stock,size,color,product:products(title,slug,status)').lte('stock', 3).order('stock').limit(15).then(({ data }) => setLow((data || []).filter((v: any) => v.product?.status === 'published')));
    db.from('products').select('title,slug,sold_count,price').eq('status', 'published').order('sold_count', { ascending: false }).limit(5).then(({ data }) => setTop(data || []));
  }, [days]);

  const live = orders.filter((o) => !['cancelled', 'returned', 'refunded'].includes(o.status));
  const revenue = live.reduce((s, o) => s + o.total, 0);
  const count = (st: string) => orders.filter((o) => o.status === st).length;
  const phones = new Set(orders.map((o) => o.phone)).size;

  // Daily revenue bars
  const byDay: Record<string, number> = {};
  live.forEach((o) => { const k = o.created_at.slice(0, 10); byDay[k] = (byDay[k] || 0) + o.total; });
  const bars = Object.entries(byDay).sort().slice(-30);
  const max = Math.max(1, ...bars.map(([, v]) => v));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="display text-6xl">Dashboard</h1>
        <div className="flex gap-1">{RANGES.map(([t, d]) => <button key={t} onClick={() => setDays(d)} className={`meta px-3 py-2 ${days === d ? 'bg-ink text-paper' : 'bg-card'}`}>{t}</button>)}</div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[['Revenue', fmt(revenue)], ['Orders', orders.length], ['Avg. order', fmt(live.length ? Math.round(revenue / live.length) : 0)], ['Customers', phones],
          ['Pending', count('pending')], ['Processing', count('confirmed') + count('processing')], ['Shipped', count('shipped')], ['Cancelled', count('cancelled')]]
          .map(([k, v]) => <div key={k as string} className="bg-card p-4"><div className="meta opacity-60">{k}</div><div className="text-2xl md:text-3xl font-medium mt-1">{v}</div></div>)}
      </div>

      {!!bars.length && (
        <div className="bg-card p-4">
          <div className="meta opacity-60 mb-3">Daily revenue</div>
          <div className="flex items-end gap-1 h-32">{bars.map(([d, v]) => (
            <div key={d} className="flex-1 bg-ink hover:bg-signal relative group" style={{ height: `${(v / max) * 100}%` }}>
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 meta bg-ink text-paper px-1 hidden group-hover:block whitespace-nowrap">{d.slice(5)} · {fmt(v)}</span>
            </div>
          ))}</div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card p-4">
          <div className="flex justify-between mb-3"><span className="meta opacity-60">Recent orders</span><Link href="/admin/orders" className="meta underline">All orders</Link></div>
          <table className="w-full text-sm"><tbody>{orders.slice(0, 10).map((o) => (
            <tr key={o.id} className="border-t border-warm">
              <td className="py-2"><Link href={`/admin/orders/${o.id}`} className="font-medium underline">#{o.order_no}</Link></td>
              <td className="truncate max-w-[120px]">{o.customer_name}</td><td>{fmt(o.total)}</td>
              <td><span className="meta bg-paper px-2 py-1">{o.status}</span></td><td className="hidden sm:table-cell opacity-60">{when(o.created_at)}</td>
            </tr>
          ))}</tbody></table>
          {!orders.length && <p className="opacity-60 text-sm">No orders in this period.</p>}
        </div>
        <div className="space-y-6">
          <div className="bg-card p-4"><div className="meta opacity-60 mb-3">Best sellers</div>
            {top.map((p) => <div key={p.slug} className="flex justify-between text-sm py-1.5 border-t border-warm"><span>{p.title}</span><span className="opacity-60">{p.sold_count} sold</span></div>)}</div>
          <div className="bg-card p-4"><div className="meta opacity-60 mb-3">Low stock (≤3)</div>
            {low.map((v) => <div key={v.sku} className="flex justify-between text-sm py-1.5 border-t border-warm"><span>{v.product.title} <span className="opacity-60">{v.size}/{v.color}</span></span><span className={v.stock ? '' : 'text-signal'}>{v.stock}</span></div>)}
            {!low.length && <p className="text-sm opacity-60">All good.</p>}</div>
        </div>
      </div>
    </div>
  );
}
