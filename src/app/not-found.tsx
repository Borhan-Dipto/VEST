import Link from 'next/link';
export default function NotFound() { return <div className="wrap py-24 text-center"><p className="display text-[30vw] md:text-[16rem]">404</p><p className="font-serif italic text-3xl">Signal lost.</p><Link href="/shop" className="btn mt-8">Back to the shop</Link></div>; }
