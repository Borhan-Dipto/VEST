'use client';
import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { orderCode } from '@/lib/order';
export default function Done({ params }: { params: Promise<{ no: string }> }) {
  const { no } = use(params);
  const [o, setO] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => { try { setO(JSON.parse(sessionStorage.getItem('vest_last') || 'null')); } catch {} }, []);
  const code = orderCode(no);
  const copy = () => { navigator.clipboard?.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <div className="wrap py-20 max-w-2xl text-center">
      <span className="meta bg-lime px-3 py-1.5">Order confirmed</span>
      <h1 className="display text-7xl md:text-9xl mt-6">Thank you.</h1>
      <p className="font-serif italic text-2xl md:text-3xl mt-4">Your order is in.</p>
      <div className="mt-10 bg-card p-6 md:p-8 text-left">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><div className="meta opacity-60">Order number</div><div className="font-mono text-3xl font-medium tracking-wider mt-1">{code}</div></div>
          <button onClick={copy} className="btn btn-ghost !h-10">{copied ? 'Copied ✓' : 'Copy'}</button>
        </div>
        {o && <div className="mt-6 pt-6 border-t border-warm grid grid-cols-2 gap-4 text-sm">
          <div><div className="meta opacity-60">Total</div><div className="text-lg font-medium mt-1">৳{o.total}</div></div>
          <div><div className="meta opacity-60">Payment</div><div className="text-lg font-medium mt-1">Cash on delivery</div></div>
        </div>}
        <p className="text-sm opacity-70 mt-6">We will call {o?.phone || 'you'} to confirm. Save your order number to track it any time.</p>
      </div>
      <div className="flex flex-wrap gap-3 justify-center mt-8">
        <Link href={`/track?no=${no}`} className="btn btn-ghost">Track order</Link>
        {o?.phone && <a href={`/invoice/${code}?dl=1#${encodeURIComponent(o.phone)}`} target="_blank" className="btn btn-ghost">Download invoice</a>}
        <Link href="/shop" className="btn">Keep shopping</Link>
      </div>
    </div>
  );
}
