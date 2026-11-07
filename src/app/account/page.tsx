import Link from 'next/link';
export const metadata = { title: 'Account' };
export default function Account() {
  return (
    <div className="wrap pt-10 max-w-2xl">
      <h1 className="display text-7xl">Account</h1>
      <p className="font-serif italic text-3xl mt-6">Customer accounts are coming soon.</p>
      <p className="mt-3 opacity-70">You don’t need an account to order — check out as a guest and track any order with your order number and phone.</p>
      <Link href="/track" className="btn mt-8">Track an order</Link>
    </div>
  );
}
