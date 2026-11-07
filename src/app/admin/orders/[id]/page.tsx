'use client';
import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { db, fmt, when, STATUS, PROD } from '@/lib/admin';
import { orderCode } from '@/lib/order';

export default function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [o, setO] = useState<any>(null); const [logs, setLogs] = useState<any[]>([]); const [msg, setMsg] = useState('');
  const load = () => {
    db.from('orders').select('*, items:order_items(*)').eq('id', id).single().then(({ data }) => setO(data));
    db.from('order_logs').select('*').eq('order_id', id).order('created_at', { ascending: false }).then(({ data }) => setLogs(data || []));
  };
  useEffect(load, [id]);
  if (!o) return <p className="meta">Loading…</p>;

  const set = (k: string, v: any) => setO({ ...o, [k]: v });
  const save = async (patch?: any) => {
    const p = patch || { status: o.status, production_status: o.production_status, payment_status: o.payment_status, courier_ref: o.courier_ref, admin_note: o.admin_note,
      customer_name: o.customer_name, phone: o.phone, address: o.address, district: o.district, area: o.area, shipping: o.shipping, total: o.subtotal - o.discount + o.shipping };
    const { error } = await db.from('orders').update(p).eq('id', id);
    setMsg(error ? error.message : 'Saved ✓'); load();
  };

  return (
    <div className="max-w-5xl">
      <style>{`@media print { aside, .no-print { display: none !important } main { padding: 0 !important } .print-only { display: block !important } }`}</style>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6 no-print">
        <div><Link href="/admin/orders" className="meta underline">← Orders</Link><h1 className="display text-5xl mt-1">Order <span className="font-mono">{orderCode(o.order_no)}</span></h1><p className="meta opacity-60">{when(o.created_at)} · {o.payment_method.toUpperCase()}</p></div>
        <div className="flex gap-2 items-center">{msg && <span className="meta">{msg}</span>}
          <a href={`tel:${o.phone}`} className="btn btn-ghost !h-11">Call</a>
          <a href={`/invoice/${orderCode(o.order_no)}?dl=1#${encodeURIComponent(o.phone)}`} target="_blank" className="btn btn-ghost !h-11">Download invoice</a>
          <button onClick={() => save()} className="btn !h-11">Save</button></div>
      </div>

      {/* Invoice header for print */}
      <div className="hidden print-only mb-6"><p className="display text-5xl">VEST</p><p>Invoice #{o.order_no} · {new Date(o.created_at).toLocaleDateString('en-GB')}</p></div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-card p-4">
            <div className="meta mb-3">Items</div>
            {o.items.map((i: any) => (
              <div key={i.id} className="flex justify-between py-2 border-t border-warm text-sm">
                <span>{i.qty}× {i.title} <span className="opacity-60">{i.size} / {i.color}</span></span><span>{fmt(i.price * i.qty)}</span>
              </div>
            ))}
            <dl className="text-sm mt-3 space-y-1 border-t border-ink pt-3">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{fmt(o.subtotal)}</dd></div>
              {!!o.discount && <div className="flex justify-between"><dt>Discount {o.coupon_code && `(${o.coupon_code})`}</dt><dd>−{fmt(o.discount)}</dd></div>}
              <div className="flex justify-between items-center"><dt>Delivery</dt><dd><input type="number" value={o.shipping} onChange={(e) => set('shipping', +e.target.value)} className="w-20 text-right border border-warm px-1 no-print" /><span className="hidden print-only">{fmt(o.shipping)}</span></dd></div>
              <div className="flex justify-between font-medium text-lg"><dt>Total {o.payment_status !== 'paid' && '(COD)'}</dt><dd>{fmt(o.subtotal - o.discount + o.shipping)}</dd></div>
            </dl>
          </section>
          <section className="bg-card p-4 space-y-3">
            <div className="meta">Customer & delivery</div>
            <div className="grid sm:grid-cols-2 gap-3">
              <input value={o.customer_name} onChange={(e) => set('customer_name', e.target.value)} className="input" />
              <input value={o.phone} onChange={(e) => set('phone', e.target.value)} className="input" />
              <input value={o.district} onChange={(e) => set('district', e.target.value)} className="input" placeholder="District" />
              <input value={o.area || ''} onChange={(e) => set('area', e.target.value)} className="input" placeholder="Area" />
            </div>
            <textarea value={o.address} onChange={(e) => set('address', e.target.value)} className="input !h-20 py-3" />
            {o.email && <p className="text-sm">Email: {o.email}</p>}
            {o.note && <p className="text-sm bg-lime/40 p-2">Customer note: {o.note}</p>}
          </section>
        </div>

        <div className="space-y-6 no-print">
          <section className="bg-card p-4 space-y-3">
            <label className="block"><span className="meta opacity-60">Order status</span><select value={o.status} onChange={(e) => set('status', e.target.value)} className="input mt-1">{STATUS.map((s) => <option key={s}>{s}</option>)}</select></label>
            <label className="block"><span className="meta opacity-60">DTF production</span><select value={o.production_status} onChange={(e) => set('production_status', e.target.value)} className="input mt-1">{PROD.map((s) => <option key={s}>{s}</option>)}</select></label>
            <label className="block"><span className="meta opacity-60">Payment</span><select value={o.payment_status} onChange={(e) => set('payment_status', e.target.value)} className="input mt-1">{['unpaid', 'paid', 'refunded'].map((s) => <option key={s}>{s}</option>)}</select></label>
            <label className="block"><span className="meta opacity-60">Courier tracking / consignment ID</span><input value={o.courier_ref || ''} onChange={(e) => set('courier_ref', e.target.value)} className="input mt-1" /></label>
            <label className="block"><span className="meta opacity-60">Internal note</span><textarea value={o.admin_note || ''} onChange={(e) => set('admin_note', e.target.value)} className="input mt-1 !h-20 py-2" /></label>
            <p className="text-xs opacity-60">Cancelling an order returns its items to stock automatically.</p>
          </section>
          {o.utm && <section className="bg-card p-4 text-sm"><div className="meta mb-2">Traffic source</div>{Object.entries(o.utm).filter(([k]) => k !== 'at').map(([k, v]) => <div key={k} className="flex justify-between gap-2"><span className="opacity-60">{k}</span><span className="truncate">{String(v)}</span></div>)}</section>}
          <section className="bg-card p-4 text-sm"><div className="meta mb-2">Activity</div>{logs.map((l) => <div key={l.id} className="flex justify-between py-1 border-t border-warm"><span>{l.action}</span><span className="opacity-60">{when(l.created_at)}</span></div>)}</section>
        </div>
      </div>
    </div>
  );
}
