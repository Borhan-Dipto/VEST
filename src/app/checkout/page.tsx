'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/components/Cart';
import { browserClient } from '@/lib/supabase';
import { track, newEventId, getUtm } from '@/lib/track';

const DIV: Record<string, string> = {
  Dhaka: 'Dhaka,Gazipur,Narayanganj,Narsingdi,Munshiganj,Manikganj,Tangail,Kishoreganj,Faridpur,Gopalganj,Madaripur,Rajbari,Shariatpur',
  Chattogram: 'Chattogram,Cox\'s Bazar,Cumilla,Feni,Brahmanbaria,Chandpur,Lakshmipur,Noakhali,Khagrachhari,Rangamati,Bandarban',
  Rajshahi: 'Rajshahi,Bogura,Joypurhat,Naogaon,Natore,Chapainawabganj,Pabna,Sirajganj',
  Khulna: 'Khulna,Bagerhat,Chuadanga,Jashore,Jhenaidah,Kushtia,Magura,Meherpur,Narail,Satkhira',
  Barishal: 'Barishal,Barguna,Bhola,Jhalokathi,Patuakhali,Pirojpur',
  Sylhet: 'Sylhet,Habiganj,Moulvibazar,Sunamganj',
  Rangpur: 'Rangpur,Dinajpur,Gaibandha,Kurigram,Lalmonirhat,Nilphamari,Panchagarh,Thakurgaon',
  Mymensingh: 'Mymensingh,Jamalpur,Netrokona,Sherpur',
};
const ERR: Record<string, string> = {
  INVALID_CUSTOMER: 'Please check your name, phone number (01XXXXXXXXX) and address.', EMPTY_CART: 'Your bag is empty.',
  INVALID_COUPON: 'That coupon is not valid for this order.', ITEM_UNAVAILABLE: 'An item is no longer available.', OUT_OF_STOCK: 'Some items just sold out. Please update your bag.',
};

export default function Checkout() {
  const { lines, subtotal, clear } = useCart();
  const router = useRouter();
  const [f, setF] = useState({ customer_name: '', phone: '', email: '', division: 'Dhaka', district: 'Dhaka', area: '', address: '', note: '' });
  const [ship, setShip] = useState({ inside: 70, outside: 130, free_over: null as number | null });
  const [code, setCode] = useState(''); const [cp, setCp] = useState<any>(null); const [cpMsg, setCpMsg] = useState('');
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const [eventId] = useState(newEventId);
  const db = useMemo(() => browserClient(), []);
  const items = lines.map((l) => ({ id: l.product_id, name: l.title, price: l.price, qty: l.qty, variant: `${l.size}/${l.color}` }));

  useEffect(() => {
    db.from('settings').select('value').eq('key', 'shipping').single().then(({ data }) => data && setShip(data.value));
    if (lines.length) track('begin_checkout', { items });
  }, [lines.length]);

  let delivery = f.district === 'Dhaka' ? ship.inside : ship.outside;
  if (ship.free_over && subtotal >= ship.free_over) delivery = 0;
  const discount = cp?.type === 'percent' ? Math.floor((subtotal * cp.value) / 100) : cp?.type === 'fixed' ? Math.min(cp.value, subtotal) : 0;
  if (cp?.type === 'free_ship') delivery = 0;
  const total = subtotal - discount + delivery;
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value, ...(k === 'division' ? { district: DIV[e.target.value].split(',')[0] } : {}) });

  const applyCoupon = async () => {
    const { data } = await db.rpc('check_coupon', { p_code: code, p_sub: subtotal });
    setCp(data); setCpMsg(data ? 'Coupon applied ✓' : 'Invalid or expired coupon');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true);
    track('add_payment_info', { items, value: total });
    const { data, error } = await db.rpc('place_order', { p: {
      ...f, payment_method: 'cod', coupon_code: cp?.code || '', event_id: eventId, utm: getUtm(),
      items: lines.map((l) => ({ variant_id: l.variant_id, qty: l.qty })),
    } });
    if (error) { setBusy(false); const k = Object.keys(ERR).find((x) => error.message.includes(x)); return setErr(k ? ERR[k] : 'Something went wrong. Please try again.'); }
    track('purchase', { items, value: data.total, order_id: String(data.order_no), user: { phone: f.phone, email: f.email, name: f.customer_name, district: f.district } }, eventId);
    try { sessionStorage.setItem('vest_last', JSON.stringify({ ...data, phone: f.phone })); } catch {}
    clear();
    router.push(`/order/${data.order_no}`);
  };

  if (!lines.length) return <div className="wrap py-24 text-center"><p className="font-serif italic text-4xl">Your bag is empty.</p><Link href="/shop" className="btn mt-6">Shop tees</Link></div>;

  return (
    <form onSubmit={submit} className="wrap pt-10 grid md:grid-cols-12 gap-10">
      <div className="md:col-span-7 space-y-4">
        <h1 className="display text-7xl">Checkout</h1>
        <p className="meta opacity-60">No account needed · Cash on delivery</p>
        <input required placeholder="Full name *" value={f.customer_name} onChange={set('customer_name')} className="input" autoComplete="name" />
        <div className="grid sm:grid-cols-2 gap-3">
          <input required placeholder="Phone (01XXXXXXXXX) *" inputMode="tel" pattern="(\+?88)?01[3-9][0-9]{8}" value={f.phone} onChange={set('phone')} className="input" autoComplete="tel" />
          <input type="email" placeholder="Email (optional)" value={f.email} onChange={set('email')} className="input" autoComplete="email" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <select value={f.division} onChange={set('division')} className="input">{Object.keys(DIV).map((d) => <option key={d}>{d}</option>)}</select>
          <select value={f.district} onChange={set('district')} className="input">{DIV[f.division].split(',').map((d) => <option key={d}>{d}</option>)}</select>
        </div>
        <input placeholder="Area / Thana" value={f.area} onChange={set('area')} className="input" />
        <textarea required placeholder="Full address (house, road, area) *" value={f.address} onChange={set('address')} className="input !h-24 py-3" autoComplete="street-address" />
        <input placeholder="Delivery note (optional)" value={f.note} onChange={set('note')} className="input" />
        <div className="border border-ink p-4 flex items-center gap-3"><span className="w-4 h-4 rounded-full bg-ink" /><div><div className="font-medium">Cash on Delivery</div><div className="text-sm opacity-60">Pay when you receive. bKash/Nagad coming soon.</div></div></div>
      </div>

      <aside className="md:col-span-5 md:sticky md:top-24 self-start bg-card p-5 md:p-6">
        <h2 className="meta mb-4">Order summary</h2>
        <div className="space-y-4 max-h-72 overflow-y-auto">{lines.map((l) => (
          <div key={l.variant_id} className="flex gap-3"><img src={l.image} alt="" className="w-14 h-16 object-cover bg-warm" />
            <div className="flex-1 text-sm"><div className="font-medium">{l.title}</div><div className="opacity-60">{l.size} / {l.color} × {l.qty}</div></div><span className="text-sm">৳{l.price * l.qty}</span></div>
        ))}</div>
        <div className="flex gap-2 mt-5"><input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Coupon code" className="input !h-11" /><button type="button" onClick={applyCoupon} className="btn btn-ghost !h-11">Apply</button></div>
        {cpMsg && <p className="meta mt-2">{cpMsg}</p>}
        <dl className="mt-5 space-y-2 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>৳{subtotal}</dd></div>
          {!!discount && <div className="flex justify-between text-signal"><dt>Discount</dt><dd>−৳{discount}</dd></div>}
          <div className="flex justify-between"><dt>Delivery ({f.district === 'Dhaka' ? 'Inside' : 'Outside'} Dhaka)</dt><dd>{delivery ? `৳${delivery}` : 'Free'}</dd></div>
          <div className="flex justify-between text-lg font-medium border-t border-warm pt-3"><dt>Total</dt><dd>৳{total}</dd></div>
        </dl>
        {err && <p className="text-signal text-sm mt-4">{err}</p>}
        <button disabled={busy} className="btn w-full mt-5">{busy ? 'Placing order…' : `Confirm order — ৳${total}`}</button>
        <p className="text-xs opacity-60 mt-3">By ordering you agree to our <Link href="/policy/terms" className="underline">terms</Link>.</p>
      </aside>
    </form>
  );
}
