'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db, fmt, when } from '@/lib/admin';
export default function Customers() {
  const [orders, setOrders] = useState<any[]>([]); const [subs, setSubs] = useState<any[]>([]); const [q, setQ] = useState(''); const [tab, setTab] = useState('customers');
  useEffect(() => {
    db.from('orders').select('id,order_no,customer_name,phone,email,district,total,status,created_at').order('created_at', { ascending: false }).limit(5000).then(({ data }) => setOrders(data || []));
    db.from('subscribers').select('*').order('created_at', { ascending: false }).then(({ data }) => setSubs(data || []));
  }, []);
  const map: Record<string, any> = {};
  orders.forEach((o) => {
    const k = o.phone.slice(-10); const c = (map[k] ||= { phone: o.phone, name: o.customer_name, email: o.email, district: o.district, orders: [], spent: 0, last: o.created_at });
    c.orders.push(o); if (!['cancelled', 'returned', 'refunded'].includes(o.status)) c.spent += o.total;
  });
  const list = Object.values(map).filter((c: any) => !q || `${c.name} ${c.phone}`.toLowerCase().includes(q.toLowerCase())).sort((a: any, b: any) => b.spent - a.spent);
  const seg = (c: any) => (c.orders.length >= 3 ? 'Loyal' : c.orders.length === 2 ? 'Repeat' : 'New');
  const csv = (rows: string[][], name: string) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')], { type: 'text/csv' })); a.download = name; a.click(); };
  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap justify-between items-end gap-3 mb-6">
        <h1 className="display text-6xl">Customers</h1>
        <div className="flex gap-1">{['customers', 'subscribers'].map((t) => <button key={t} onClick={() => setTab(t)} className={`meta px-3 py-2 ${tab === t ? 'bg-ink text-paper' : 'bg-card'}`}>{t} ({t === 'customers' ? list.length : subs.length})</button>)}</div>
      </div>
      {tab === 'customers' ? <>
        <div className="flex gap-2 mb-4"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or phone" className="input !h-11" />
          <button className="btn btn-ghost !h-11" onClick={() => csv([['Name', 'Phone', 'Email', 'District', 'Orders', 'Spent', 'Segment'], ...list.map((c: any) => [c.name, c.phone, c.email, c.district, c.orders.length, c.spent, seg(c)])], 'vest-customers.csv')}>Export</button></div>
        <div className="bg-card divide-y divide-warm">{list.map((c: any) => (
          <details key={c.phone} className="p-3">
            <summary className="flex flex-wrap gap-3 cursor-pointer items-center"><span className="font-medium flex-1">{c.name} <span className="opacity-60 font-normal">{c.phone} · {c.district}</span></span>
              <span className={`meta px-2 py-1 ${seg(c) === 'Loyal' ? 'bg-lime' : 'bg-paper'}`}>{seg(c)}</span><span className="text-sm">{c.orders.length} orders · {fmt(c.spent)}</span></summary>
            <div className="mt-2 text-sm">{c.orders.map((o: any) => <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex justify-between py-1 underline-offset-2 hover:underline"><span>#{o.order_no} · {o.status}</span><span>{fmt(o.total)} · {when(o.created_at)}</span></Link>)}</div>
          </details>
        ))}</div>
      </> : <>
        <button className="btn btn-ghost !h-11 mb-4" onClick={() => csv([['Email', 'Joined'], ...subs.map((s) => [s.email, s.created_at.slice(0, 10)])], 'vest-subscribers.csv')}>Export emails</button>
        <div className="bg-card divide-y divide-warm">{subs.map((s) => <div key={s.email} className="flex justify-between p-3 text-sm"><span>{s.email}</span><span className="opacity-60">{when(s.created_at)}</span></div>)}</div>
      </>}
    </div>
  );
}
