import { notFound } from 'next/navigation';
const P: Record<string, [string, string[]]> = {
  shipping: ['Shipping', ['We deliver all over Bangladesh with cash on delivery.', 'Inside Dhaka: 1–3 working days. Outside Dhaka: 3–5 working days.', 'Delivery charges are shown at checkout before you confirm your order.', 'Every tee is DTF printed after your order is confirmed, so please allow the stated time.']],
  returns: ['Returns & Exchange', ['Wrong size? Exchange within 3 days of delivery. The tee must be unworn, unwashed and with tags.', 'If you receive a damaged or wrong item, contact us within 48 hours with photos and we will replace it free.', 'Delivery charge for size exchange is paid by the customer.', 'Refunds are given for items we cannot replace.']],
  privacy: ['Privacy Policy', ['We collect your name, phone, address and optional email only to process and deliver your order.', 'We use cookies and analytics/advertising tools (such as Google Analytics and Meta Pixel) to understand site usage and show relevant ads.', 'We never sell your personal data. Contact us to view or delete your data.']],
  terms: ['Terms & Conditions', ['Prices are in BDT and may change without notice.', 'Orders may be cancelled if we cannot confirm them by phone.', 'Colours may vary slightly from screen to actual product.', 'By placing an order you agree to these terms.']],
};
export function generateStaticParams() { return Object.keys(P).map((slug) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const p = P[(await params).slug]; return p ? { title: p[0] } : {}; }
export default async function Policy({ params }: { params: Promise<{ slug: string }> }) {
  const p = P[(await params).slug]; if (!p) notFound();
  return <div className="wrap pt-10 max-w-3xl"><h1 className="display text-7xl">{p[0]}</h1><div className="mt-8 space-y-4 text-lg">{p[1].map((t) => <p key={t}>{t}</p>)}</div></div>;
}
