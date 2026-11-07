'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { browserClient } from '@/lib/supabase';
import { orderCode, parseOrder } from '@/lib/order';

const STEPS: [string, string, string][] = [
  ['received', 'Order placed', 'We have received your order.'],
  ['verified', 'Confirmed', 'Order confirmed and design checked.'],
  ['printing', 'Printing', 'Your tee is being DTF printed.'],
  ['qc', 'Quality check', 'Print and fabric inspected by hand.'],
  ['packaging', 'Packed', 'Packed and ready for the courier.'],
  ['dispatched', 'On the way', 'Handed to the courier for delivery.'],
];
const BADGE: Record<string, string> = { pending: 'Awaiting confirmation', confirmed: 'Confirmed', processing: 'In production', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled', returned: 'Returned', refunded: 'Refunded' };
const tk = (n: number) => '৳' + (n || 0).toLocaleString('en-IN');
const when = (d: string) => new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

function Track() {
  const sp = useSearchParams();
  const [no, setNo] = useState(sp.get('no') ? orderCode(sp.get('no')!) : '');
  const [ph, setPh] = useState('');
  const [r, setR] = useState<any>(undefined);
  const [busy, setBusy] = useState(false);

  useEffect(() => { try { const last = JSON.parse(sessionStorage.getItem('vest_last') || 'null'); if (last?.phone) setPh(last.phone); } catch {} }, []);

  const go = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { data } = await browserClient().rpc('track_order', { p_no: parseOrder(no), p_phone: ph });
    setR(data || null); setBusy(false);
  };

  const delivered = r?.status === 'delivered';
  const stopped = ['cancelled', 'returned', 'refunded'].includes(r?.status);
  const at = r ? (delivered ? STEPS.length : STEPS.findIndex(([k]) => k === r.production_status)) : -1;
  const stamp = (k: string) => r?.logs?.find((l: any) => l.action === `production → ${k}`)?.at || (k === 'received' ? r?.created_at : null);

  return (
    <div className="wrap pt-12 pb-8 max-w-4xl">
      <span className="meta opacity-60">Order status</span>
      <h1 className="display text-6xl md:text-8xl mt-2">Track your order</h1>
      <p className="mt-4 opacity-70 max-w-xl">Enter the order number from your confirmation (e.g. <b>VST-100042</b>) and the phone number you ordered with.</p>

      <form onSubmit={go} className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 mt-8">
        <label className="block"><span className="meta opacity-60 block mb-1.5">Order number</span>
          <input required value={no} onChange={(e) => setNo(e.target.value.toUpperCase())} placeholder="VST-100042" className="input font-mono tracking-wider" /></label>
        <label className="block"><span className="meta opacity-60 block mb-1.5">Phone number</span>
          <input required value={ph} onChange={(e) => setPh(e.target.value)} placeholder="01XXXXXXXXX" inputMode="tel" className="input" /></label>
        <button disabled={busy} className="btn sm:self-end">{busy ? 'Checking…' : 'Track order'}</button>
      </form>

      {r === null && <div className="mt-8 border border-signal/40 bg-signal/5 p-5"><p className="font-medium">No order found.</p><p className="text-sm opacity-70 mt-1">Check the order number and use the same phone number you ordered with.</p></div>}

      {r && (
        <div className="mt-10 grid md:grid-cols-[1fr_320px] gap-6">
          <section className="bg-card p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-warm">
              <div>
                <div className="meta opacity-60">Order</div>
                <div className="font-mono text-2xl md:text-3xl font-medium tracking-wider mt-1">{orderCode(r.order_no)}</div>
                <div className="text-sm opacity-60 mt-1">Placed {when(r.created_at)} · Hi {r.customer_name}</div>
              </div>
              <span className={`meta px-3 py-2 ${stopped ? 'bg-signal text-ink' : delivered ? 'bg-ink text-paper' : 'bg-lime'}`}>{BADGE[r.status] || r.status}</span>
            </div>

            {stopped ? (
              <p className="mt-6">This order was <b>{r.status}</b>. Contact us if you have any questions.</p>
            ) : (
              <ol className="mt-8 relative">
                {[...STEPS, ['delivered', 'Delivered', 'Enjoy your new tee.'] as [string, string, string]].map(([k, t, d], i) => {
                  const done = i <= at || (k === 'delivered' && delivered), now = i === at && !delivered;
                  const ts = stamp(k);
                  return (
                    <li key={k} className="flex gap-4 pb-7 last:pb-0 relative">
                      {i < STEPS.length && <span className={`absolute left-[11px] top-7 bottom-0 w-0.5 ${i < at || delivered ? 'bg-ink' : 'bg-warm'}`} />}
                      <span className={`relative z-10 w-6 h-6 shrink-0 rounded-full grid place-items-center text-xs ${done ? 'bg-ink text-paper' : 'bg-paper border-2 border-warm'} ${now ? 'ring-4 ring-lime' : ''}`}>{done ? '✓' : ''}</span>
                      <div className={done ? '' : 'opacity-40'}>
                        <div className="font-medium">{t}{now && <span className="meta bg-lime px-2 py-0.5 ml-2 align-middle">Now</span>}</div>
                        <div className="text-sm opacity-70">{d}</div>
                        {done && ts && <div className="meta opacity-50 mt-1">{when(ts)}</div>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
            {r.courier_ref && <div className="mt-8 p-4 bg-paper text-sm"><span className="meta opacity-60">Courier tracking ID</span><div className="font-mono font-medium mt-1">{r.courier_ref}</div></div>}
          </section>

          <aside className="space-y-4">
            <div className="bg-card p-5">
              <div className="meta opacity-60 mb-3">Items</div>
              {r.items.map((i: any, k: number) => (
                <div key={k} className="flex justify-between gap-3 py-2 border-t border-warm text-sm first:border-0">
                  <span>{i.qty}× {i.title}<span className="block opacity-60">{i.size} / {i.color}</span></span><span>{tk(i.price * i.qty)}</span>
                </div>
              ))}
              <dl className="text-sm mt-3 pt-3 border-t border-ink space-y-1">
                <div className="flex justify-between"><dt className="opacity-70">Subtotal</dt><dd>{tk(r.subtotal)}</dd></div>
                {!!r.discount && <div className="flex justify-between"><dt className="opacity-70">Discount</dt><dd>−{tk(r.discount)}</dd></div>}
                <div className="flex justify-between"><dt className="opacity-70">Delivery ({r.district})</dt><dd>{r.shipping ? tk(r.shipping) : 'Free'}</dd></div>
                <div className="flex justify-between font-medium text-base pt-1"><dt>Total {r.payment_status !== 'paid' && '(COD)'}</dt><dd>{tk(r.total)}</dd></div>
              </dl>
            </div>
            <a href={`/invoice/${orderCode(r.order_no)}?dl=1#${encodeURIComponent(ph)}`} target="_blank" className="btn w-full">Download invoice (PDF)</a>
            <Link href="/shop" className="btn btn-ghost w-full">Continue shopping</Link>
          </aside>
        </div>
      )}
    </div>
  );
}
export default function Page() { return <Suspense><Track /></Suspense>; }
