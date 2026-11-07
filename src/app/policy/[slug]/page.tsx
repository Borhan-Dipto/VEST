import { notFound } from 'next/navigation';
import { getSettings } from '@/lib/data';
export const revalidate = 60;
const get = async (slug: string) => ((await getSettings()).policies || {})[slug] as { title: string; body: string } | undefined;
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const p = await get((await params).slug); return p ? { title: p.title } : {}; }
export default async function Policy({ params }: { params: Promise<{ slug: string }> }) {
  const p = await get((await params).slug); if (!p) notFound();
  return <div className="wrap pt-10 max-w-3xl"><h1 className="display text-7xl">{p.title}</h1><div className="mt-8 space-y-4 text-lg">{p.body.split('\n').filter(Boolean).map((t, i) => <p key={i}>{t}</p>)}</div></div>;
}
