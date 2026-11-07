'use client';
import { useEffect, useState } from 'react';
import { db } from '@/lib/admin';
const NEW = { code: '', type: 'percent', value: 10, min_total: 0, expires_at: '', active: true };
export default function Coupons() {
  const [list, setList] = useState<any[]>([]); const [f, setF] = useState<any>(NEW); const [msg, setMsg] = useState('');
  const load = () => db.from('coupons').select('*').order('code').then(({ data }) => setList(data || []));
  useEffect(() => { load(); }, []);
  const save = async () => {
    if (!f.code) return setMsg('Code required');
    const { error } = await db.from('coupons').upsert({ ...f, code: f.code.toUpperCase().replace(/\s/g, ''), expires_at: f.expires_at || null });
    if (error) return setMsg(error.message); setF(NEW); setMsg(''); load();
  };
  const desc = (c: any) => c.type === 'percent' ? `${c.value}% off` : c.type === 'fixed' ? `৳${c.value} off` : 'Free delivery';
  return (
    <div className="max-w-4xl">
      <h1 className="display text-6xl mb-6">Coupons</h1>
      <div className="bg-card p-4 grid sm:grid-cols-6 gap-2 items-end mb-6">
        <label className="sm:col-span-2"><span className="meta opacity-60">Code</span><input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} placeholder="VEST10" className="input" /></label>
        <label><span className="meta opacity-60">Type</span><select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} className="input"><option value="percent">% off</option><option value="fixed">৳ off</option><option value="free_ship">Free delivery</option></select></label>
        <label><span className="meta opacity-60">Value</span><input type="number" value={f.value} onChange={(e) => setF({ ...f, value: +e.target.value })} className="input" disabled={f.type === 'free_ship'} /></label>
        <label><span className="meta opacity-60">Min order ৳</span><input type="number" value={f.min_total} onChange={(e) => setF({ ...f, min_total: +e.target.value })} className="input" /></label>
        <label><span className="meta opacity-60">Expires</span><input type="date" value={f.expires_at?.slice(0, 10) || ''} onChange={(e) => setF({ ...f, expires_at: e.target.value })} className="input" /></label>
        <button onClick={save} className="btn sm:col-span-6">Save coupon</button>
        {msg && <p className="text-signal text-sm sm:col-span-6">{msg}</p>}
      </div>
      <div className="bg-card divide-y divide-warm">{list.map((c) => (
        <div key={c.code} className="flex flex-wrap items-center gap-3 p-3">
          <span className="font-mono font-medium bg-lime px-2">{c.code}</span><span className="flex-1 text-sm">{desc(c)}{c.min_total ? ` · min ৳${c.min_total}` : ''}{c.expires_at ? ` · until ${c.expires_at.slice(0, 10)}` : ''}</span>
          <label className="text-sm flex gap-1 items-center"><input type="checkbox" checked={c.active} onChange={async (e) => { await db.from('coupons').update({ active: e.target.checked }).eq('code', c.code); load(); }} /> Active</label>
          <button onClick={() => setF({ ...c, expires_at: c.expires_at || '' })} className="meta underline">Edit</button>
          <button onClick={async () => { if (confirm('Delete coupon?')) { await db.from('coupons').delete().eq('code', c.code); load(); } }} className="meta text-signal underline">Delete</button>
        </div>
      ))}{!list.length && <p className="p-4 opacity-60 text-sm">No coupons yet.</p>}</div>
    </div>
  );
}
