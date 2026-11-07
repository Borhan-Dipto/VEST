'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { db, fmt, when, STATUS, PROD } from '@/lib/admin';

export default function Orders() {
  const [list, setList] = useState<any[]>([]);
  const [st, setSt] = useState(''); const [pr, setPr] = useState(''); const [q, setQ] = useState('');
  const [sel, setSel] = useState<string[]>([]);

  const load = () => {
    let x = db.from('orders').select('*, items:order_items(title,size,color,qty)').order('created_at', { ascending: false }).limit(500);
    if (st) x = x.eq('status', st); if (pr) x = x.eq('production_status', pr);
    x.then(({ data }) => setList(data || []));
  };
  useEffect(() => { load(); }, [st, pr]);

  const shown = list.filter((o) => !q || `${o.order_no} ${o.customer_name} ${o.phone}`.toLowerCase().includes(q.toLowerCase()));
  const update = async (ids: string[], patch: any) => { await db.from('orders').update(patch).in('id', ids); setSel([]); load(); };

  const csv = () => {
    const rows = shown.filter((o) => !sel.length || sel.includes(o.id));
    const head = ['Invoice', 'Name', 'Phone', 'Address', 'District', 'Area', 'COD Amount', 'Items', 'Note', 'Status', 'Date', 'Source'];
    const body = rows.map((o) => [o.order_no, o.customer_name, o.phone, o.address, o.district, o.area || '', o.payment_status === 'paid' ? 0 : o.total,
      o.items.map((i: any) => `${i.title} ${i.size}/${i.color} x${i.qty}`).join('; '), o.note || '', o.status, o.created_at.slice(0, 10), o.utm?.utm_source || '']);
    const text = [head, ...body].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + text], { type: 'text/csv' })); a.download = `vest-orders-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-end gap-3 mb-6">
        <h1 className="display text-6xl">Orders <span className="text-3xl opacity-40">{shown.length}</span></h1>
        <button onClick={csv} className="btn btn-ghost !h-11">Export CSV{sel.length ? ` (${sel.length})` : ''}</button>
      </div>
      <div className="grid sm:grid-cols-3 gap-2 mb-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order #, name, phone" className="input !h-11" />
        <select value={st} onChange={(e) => setSt(e.target.value)} className="input !h-11"><option value="">All order status</option>{STATUS.map((s) => <option key={s}>{s}</option>)}</select>
        <select value={pr} onChange={(e) => setPr(e.target.value)} className="input !h-11"><option value="">All production status</option>{PROD.map((s) => <option key={s}>{s}</option>)}</select>
      </div>
      {!!sel.length && (
        <div className="flex flex-wrap gap-2 items-center mb-3 bg-lime p-2">
          <span className="meta px-2">{sel.length} selected →</span>
          <select onChange={(e) => e.target.value && update(sel, { status: e.target.value })} defaultValue="" className="input !h-9 !w-auto"><option value="">Set status</option>{STATUS.map((s) => <option key={s}>{s}</option>)}</select>
          <select onChange={(e) => e.target.value && update(sel, { production_status: e.target.value })} defaultValue="" className="input !h-9 !w-auto"><option value="">Set production</option>{PROD.map((s) => <option key={s}>{s}</option>)}</select>
        </div>
      )}
      <div className="bg-card overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead className="meta opacity-60 text-left"><tr>
            <th className="p-3 w-8"><input type="checkbox" checked={!!shown.length && sel.length === shown.length} onChange={(e) => setSel(e.target.checked ? shown.map((o) => o.id) : [])} /></th>
            <th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Production</th><th>Date</th></tr></thead>
          <tbody>{shown.map((o) => (
            <tr key={o.id} className="border-t border-warm align-top">
              <td className="p-3"><input type="checkbox" checked={sel.includes(o.id)} onChange={(e) => setSel(e.target.checked ? [...sel, o.id] : sel.filter((x) => x !== o.id))} /></td>
              <td className="py-3"><Link href={`/admin/orders/${o.id}`} className="font-medium underline">#{o.order_no}</Link></td>
              <td className="py-3">{o.customer_name}<div className="opacity-60">{o.phone} · {o.district}</div></td>
              <td className="py-3 max-w-[200px]">{o.items.map((i: any, k: number) => <div key={k} className="truncate">{i.qty}× {i.title} <span className="opacity-60">{i.size}/{i.color}</span></div>)}</td>
              <td className="py-3">{fmt(o.total)}</td>
              <td className="py-3"><select value={o.status} onChange={(e) => update([o.id], { status: e.target.value })} className="h-8 px-1 border border-warm bg-paper">{STATUS.map((s) => <option key={s}>{s}</option>)}</select></td>
              <td className="py-3"><select value={o.production_status} onChange={(e) => update([o.id], { production_status: e.target.value })} className="h-8 px-1 border border-warm bg-paper">{PROD.map((s) => <option key={s}>{s}</option>)}</select></td>
              <td className="py-3 opacity-60 whitespace-nowrap pr-3">{when(o.created_at)}</td>
            </tr>
          ))}</tbody>
        </table>
        {!shown.length && <p className="p-6 opacity-60">No orders yet.</p>}
      </div>
    </div>
  );
}
