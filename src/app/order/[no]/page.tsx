'use client';
import Link from 'next/link';
import { use, useEffect, useState } from 'react';
export default function Done({ params }: { params: Promise<{ no: string }> }) {
  const { no } = use(params);
  const [o, setO] = useState<any>(null);
  useEffect(() => { try { setO(JSON.parse(sessionStorage.getItem('vest_last') || 'null')); } catch {} }, []);
  return (
    <div className="wrap py-20 text-center">
      <span className="meta bg-lime px-3 py-1.5">Order confirmed</span>
      <h1 className="display text-7xl md:text-9xl mt-6">Thank you.</h1>
      <p className="font-serif italic text-3xl mt-4">Order #{no} is in.</p>
      {o && <p className="mt-6 opacity-70">Total ৳{o.total} — pay cash on delivery. We will call {o.phone} to confirm.</p>}
      <div className="flex gap-3 justify-center mt-10"><Link href={`/track?no=${no}`} className="btn btn-ghost">Track order</Link><Link href="/shop" className="btn">Keep shopping</Link></div>
    </div>
  );
}
