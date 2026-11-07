import { notFound } from 'next/navigation';
import { getCollections, getProducts } from '@/lib/data';
import ProductCard from '@/components/ProductCard';
type P = { params: Promise<{ slug: string }> };
export const revalidate = 60;
export async function generateMetadata({ params }: P) {
  const { slug } = await params; const c = (await getCollections()).find((x) => x.slug === slug);
  return c ? { title: `${c.title} Collection`, description: c.description, alternates: { canonical: `/collections/${slug}` } } : {};
}
export default async function Col({ params }: P) {
  const { slug } = await params;
  const c = (await getCollections()).find((x) => x.slug === slug);
  if (!c) notFound();
  const list = await getProducts({ collection: slug });
  return (
    <>
      <section className="relative h-[60vh] min-h-[380px] overflow-hidden">
        <img src={c.cover_url || ''} alt={c.title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
        <div className="wrap relative h-full flex flex-col justify-end pb-10 text-paper">
          <span className="meta opacity-70">Collection · {list.length} pieces</span>
          <h1 className="display text-7xl md:text-[10rem]">{c.title}</h1>
          <p className="font-serif italic text-2xl max-w-xl">{c.description}</p>
        </div>
      </section>
      <div className="wrap grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-10 md:gap-x-5 mt-10">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div>
    </>
  );
}
