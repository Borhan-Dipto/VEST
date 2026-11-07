import Link from 'next/link';
import { getCollections } from '@/lib/data';
export const metadata = { title: 'Collections' };
export default async function Collections() {
  const cols = await getCollections();
  return (
    <div className="wrap pt-10">
      <h1 className="display text-7xl md:text-9xl">Collections</h1>
      <div className="grid md:grid-cols-2 gap-5 mt-10">
        {cols.map((c, i) => (
          <Link key={c.id} href={`/collections/${c.slug}`} className="relative aspect-[4/5] md:aspect-[5/4] overflow-hidden img-zoom">
            <img src={c.cover_url || ''} alt={c.title} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
            <div className="absolute bottom-0 p-6 text-paper"><span className="meta opacity-70">No. {String(i + 1).padStart(2, '0')}</span><h2 className="display text-5xl md:text-7xl">{c.title}</h2><p className="opacity-80 mt-2">{c.description}</p></div>
          </Link>
        ))}
      </div>
    </div>
  );
}
