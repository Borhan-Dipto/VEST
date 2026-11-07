'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { browserClient } from '@/lib/supabase';
const STEPS = ['received', 'verified', 'printing', 'qc', 'packaging', 'dispatched'];
const LABEL: Record<string, string> = { received: 'Order received', verified: 'Design verified', printing: 'Printing', qc: 'Quality check', packaging: 'Packaging', dispatched: 'Dispatched' };
function T() {
  const sp = useSearchParams();
  const [no, setNo] = useState(sp.get('no') || ''); const [ph, setPh] = useState('');
  const [r, setR] = useState<any>(undefined);
  const go = async (e: React.FormEvent) => { e.preventDefault(); const { data } = await browserClient().rpc('track_order', { p_no: +no, p_phone: ph }); setR(data); };
  const at = r ? STEPS.indexOf(r.production_status) : -1;
  return (
    <div className="wrap pt-10 max-w-2xl">
      <h1 className="display text-7xl">Track order</h1>
      <form onSubmit={go} className="grid sm:grid-cols-3 gap-2 mt-8">
        <input required value={no} onChange={(e) => setNo(e.target.value)} placeholder="Order number" inputMode="numeric" className="input" />
        <input required value={ph} onChange={(e) => setPh(e.target.value)} placeholder="Phone number" inputMode="tel" className="input" />
        <button className="btn">Track</button>
      </form>
      {r === null && <p className="mt-6 text-signal">No order found with that number and phone.</p>}
      {r && (
        <div className="mt-10 bg-card p-6">
          <div className="flex justify-between"><span className="display text-4xl">#{r.order_no}</span><span className="meta bg-ink text-paper px-2 py-1 self-start">{r.status}</span></div>
          <ol className="mt-6 space-y-3">{STEPS.map((s, i) => (
            <li key={s} className={`flex items-center gap-3 ${i <= at ? '' : 'opacity-30'}`}><span className={`w-3 h-3 rounded-full ${i <= at ? 'bg-lime ring-2 ring-ink' : 'bg-warm'}`} />{LABEL[s]}</li>
          ))}</ol>
          <p className="meta mt-6 opacity-60">Total ৳{r.total} · Placed {new Date(r.created_at).toLocaleDateString('en-GB')}</p>
        </div>
      )}
    </div>
  );
}
export default function Page() { return <Suspense><T /></Suspense>; }
