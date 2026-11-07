'use client';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db, upload, slugify, refreshSite, postToSocials } from '@/lib/admin';

const BLANK = { title: '', slug: '', description: '', price: 850, compare_price: null as number | null, collection_id: '', badge: '', fabric: '100% Cotton', gsm: 180, fit: 'Oversized',
  status: 'draft', featured: false, tags: [] as string[], seo_title: '', seo_desc: '', social_skip: false };
type Img = { url: string };

export default function ProductEdit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === 'new';
  const router = useRouter();
  const [p, setP] = useState<any>(BLANK);
  const [imgs, setImgs] = useState<Img[]>([]);
  const [stock, setStock] = useState<Record<string, number>>({}); // key "size|color"
  const [skus, setSkus] = useState<Record<string, string>>({});
  const [sizes, setSizes] = useState<string[]>([]); const [colors, setColors] = useState<string[]>([]);
  const [opt, setOpt] = useState<{ sizes: string[]; colors: string[] }>({ sizes: [], colors: [] });
  const [cols, setCols] = useState<any[]>([]);
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(''); const [up, setUp] = useState(false);
  const [defStock, setDefStock] = useState(10);
  const [social, setSocial] = useState('');

  useEffect(() => {
    db.from('collections').select('id,title').order('sort').then(({ data }) => setCols(data || []));
    db.from('settings').select('value').eq('key', 'options').single().then(({ data }) => {
      const o = data?.value || { sizes: ['S', 'M', 'L', 'XL', 'XXL'], colors: ['Black'] }; setOpt(o);
      if (isNew) { setSizes(o.sizes); setColors(o.colors.slice(0, 1)); }
    });
    if (isNew) return;
    db.from('products').select('*, images:product_images(url,sort), variants(size,color,stock,sku)').eq('id', id).single().then(({ data }) => {
      if (!data) return;
      const { images, variants, ...rest } = data;
      setP({ ...BLANK, ...rest, collection_id: rest.collection_id || '', badge: rest.badge || '', seo_title: rest.seo_title || '', seo_desc: rest.seo_desc || '' });
      setImgs(images.sort((a: any, b: any) => a.sort - b.sort));
      setStock(Object.fromEntries(variants.map((v: any) => [`${v.size}|${v.color}`, v.stock])));
      setSkus(Object.fromEntries(variants.map((v: any) => [`${v.size}|${v.color}`, v.sku])));
      setSizes([...new Set<string>(variants.map((v: any) => v.size))]); setColors([...new Set<string>(variants.map((v: any) => v.color))]);
    });
  }, [id]);

  const set = (k: string, v: any) => setP((x: any) => ({ ...x, [k]: v, ...(k === 'title' && (isNew || !x.slug) ? { slug: slugify(v) } : {}) }));
  const toggle = (arr: string[], v: string, fn: (a: string[]) => void) => fn(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const allSizes = [...new Set([...opt.sizes, ...sizes])], allColors = [...new Set([...opt.colors, ...colors])];

  const addImages = async (files: FileList | null) => {
    if (!files?.length) return; setUp(true);
    try { const urls = await Promise.all([...files].map((f) => upload(f))); setImgs((x) => [...x, ...urls.map((url) => ({ url }))]); }
    catch (e: any) { setMsg('Upload failed: ' + e.message); }
    setUp(false);
  };
  const move = (i: number, d: number) => setImgs((x) => { const a = [...x]; const j = i + d; if (j < 0 || j >= a.length) return a; [a[i], a[j]] = [a[j], a[i]]; return a; });

  const save = async (asCopy = false) => {
    (document.activeElement as HTMLElement | null)?.blur?.(); await new Promise((r) => setTimeout(r, 0));
    if (!p.title || !p.slug || !p.price) return setMsg('Title, URL and price are required.');
    if (!sizes.length || !colors.length) return setMsg('Pick at least one size and one colour.');
    setBusy(true); setMsg('');
    const row = { ...p, slug: asCopy ? `${p.slug}-copy-${Date.now() % 10000}` : p.slug, title: asCopy ? `${p.title} (copy)` : p.title, status: asCopy ? 'draft' : p.status,
      collection_id: p.collection_id || null, badge: p.badge || null, compare_price: p.compare_price || null, seo_title: p.seo_title || null, seo_desc: p.seo_desc || null };
    delete row.id; delete row.created_at; delete row.sold_count; delete row.social_posted_at; delete row.social_ref;
    const q = isNew || asCopy ? db.from('products').insert(row).select('id').single() : db.from('products').update(row).eq('id', id).select('id').single();
    const { data, error } = await q;
    if (error) { setBusy(false); return setMsg(error.message.includes('duplicate') ? 'That URL (slug) is already used by another product.' : error.message); }
    const pid = data.id;

    await db.from('product_images').delete().eq('product_id', pid);
    if (imgs.length) await db.from('product_images').insert(imgs.map((im, i) => ({ product_id: pid, url: im.url, sort: i })));

    const code = row.slug.replace(/-/g, '').toUpperCase().slice(0, 12);
    const want = sizes.flatMap((s) => colors.map((c) => ({ product_id: pid, size: s, color: c,
      sku: (!asCopy && skus[`${s}|${c}`]) || `${code}-${c.slice(0, 2).toUpperCase()}-${s}`, stock: stock[`${s}|${c}`] ?? defStock })));
    const { error: ve } = await db.from('variants').upsert(want, { onConflict: 'product_id,size,color' });
    if (ve) { setBusy(false); return setMsg('Variant error: ' + ve.message); }
    if (!isNew && !asCopy) {
      const { data: existing } = await db.from('variants').select('id,size,color').eq('product_id', pid);
      for (const v of existing || []) if (!sizes.includes(v.size) || !colors.includes(v.color)) {
        const { error: de } = await db.from('variants').delete().eq('id', v.id);
        if (de) await db.from('variants').update({ stock: 0 }).eq('id', v.id); // has past orders → keep, zero stock
      }
    }
    refreshSite(); setBusy(false); setMsg('Saved ✓');
    if (row.status === 'published' && !row.social_skip && (isNew || asCopy || !p.social_posted_at)) {
      setSocial('Posting to Facebook & Instagram…');
      postToSocials(pid).then((m) => { setSocial(m); if (m.includes('✓')) setP((x: any) => ({ ...x, social_posted_at: new Date().toISOString() })); });
    }
    if (isNew || asCopy) router.replace(`/admin/products/${pid}`);
  };

  const archive = async () => { if (!confirm('Archive this product? It will be hidden from the shop (orders history is kept).')) return; await db.from('products').update({ status: 'archived' }).eq('id', id); refreshSite(); router.push('/admin/products'); };

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div><Link href="/admin/products" className="meta underline">← Products</Link><h1 className="display text-5xl mt-1">{isNew ? 'New product' : p.title || 'Product'}</h1></div>
        <div className="flex gap-2 items-center">
          {msg && <span className={`meta ${msg.includes('✓') ? '' : 'text-signal'}`}>{msg}</span>}
          {!isNew && <a href={`/product/${p.slug}`} target="_blank" className="btn btn-ghost !h-11">View ↗</a>}
          {!isNew && <button onClick={() => save(true)} className="btn btn-ghost !h-11">Duplicate</button>}
          <button disabled={busy} onClick={() => save()} className="btn !h-11">{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-card p-4 space-y-3">
            <L t="Title *"><input value={p.title} onChange={(e) => set('title', e.target.value)} className="input" /></L>
            <L t="Description"><textarea value={p.description || ''} onChange={(e) => set('description', e.target.value)} className="input !h-28 py-3" /></L>
            <div className="grid grid-cols-2 gap-3">
              <L t="Price ৳ *"><input type="number" value={p.price} onChange={(e) => set('price', +e.target.value)} className="input" /></L>
              <L t="Compare-at price ৳ (for discount)"><input type="number" value={p.compare_price || ''} onChange={(e) => set('compare_price', e.target.value ? +e.target.value : null)} className="input" /></L>
            </div>
          </section>

          <section className="bg-card p-4">
            <div className="flex justify-between items-center mb-3"><span className="meta">Images — first is the main image, second shows on hover</span>
              <label className="btn btn-ghost !h-10 cursor-pointer">{up ? 'Uploading…' : '+ Add images'}<input type="file" accept="image/*" multiple hidden onChange={(e) => addImages(e.target.files)} /></label></div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">{imgs.map((im, i) => (
              <div key={im.url + i} className="relative group bg-warm aspect-[4/5]">
                <img src={im.url} alt="" className="w-full h-full object-cover" />
                {i === 0 && <span className="absolute top-1 left-1 meta bg-lime px-1">Main</span>}
                <div className="absolute bottom-0 inset-x-0 flex bg-ink/80 text-paper meta">
                  <button className="flex-1 py-1" onClick={() => move(i, -1)}>←</button><button className="flex-1 py-1" onClick={() => move(i, 1)}>→</button>
                  <button className="flex-1 py-1 text-signal" onClick={() => setImgs(imgs.filter((_, j) => j !== i))}>✕</button>
                </div>
              </div>
            ))}</div>
            {!imgs.length && <p className="text-sm opacity-60">Add front, back and close-up photos.</p>}
          </section>

          <section className="bg-card p-4 space-y-4">
            <div className="meta">Variants & stock</div>
            <div><div className="text-sm mb-1.5">Sizes</div><div className="flex flex-wrap gap-1.5">{allSizes.map((s) => <Chip key={s} on={sizes.includes(s)} onClick={() => toggle(sizes, s, setSizes)}>{s}</Chip>)}</div></div>
            <div><div className="text-sm mb-1.5">Colours <span className="opacity-60">(add new sizes/colours in Website → Options)</span></div><div className="flex flex-wrap gap-1.5">{allColors.map((c) => <Chip key={c} on={colors.includes(c)} onClick={() => toggle(colors, c, setColors)}>{c}</Chip>)}</div></div>
            {isNew && <L t="Default stock for each variant"><input type="number" value={defStock} onChange={(e) => setDefStock(+e.target.value)} className="input !w-32" /></L>}
            <div className="overflow-x-auto"><table className="text-sm"><thead><tr><th className="text-left pr-3 meta">Stock</th>{sizes.map((s) => <th key={s} className="meta px-1">{s}</th>)}</tr></thead>
              <tbody>{colors.map((c) => <tr key={c}><td className="pr-3 py-1">{c}</td>{sizes.map((s) => (
                <td key={s} className="px-1 py-1"><input type="number" min={0} value={stock[`${s}|${c}`] ?? defStock} onChange={(e) => setStock({ ...stock, [`${s}|${c}`]: Math.max(0, +e.target.value) })} className="input !h-9 !w-16 !px-2 text-center" /></td>
              ))}</tr>)}</tbody></table></div>
          </section>

          <section className="bg-card p-4 space-y-3">
            <div className="meta">SEO (optional — auto-generated if empty)</div>
            <L t="URL slug"><div className="flex items-center gap-1"><span className="text-sm opacity-60">/product/</span><input value={p.slug} onChange={(e) => set('slug', slugify(e.target.value))} className="input" /></div></L>
            <L t="SEO title"><input value={p.seo_title} onChange={(e) => set('seo_title', e.target.value)} className="input" /></L>
            <L t="SEO description"><textarea value={p.seo_desc} onChange={(e) => set('seo_desc', e.target.value)} className="input !h-20 py-3" /></L>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-card p-4 space-y-3">
            <L t="Status"><select value={p.status} onChange={(e) => set('status', e.target.value)} className="input"><option value="draft">Draft (hidden)</option><option value="published">Published (live)</option><option value="archived">Archived</option></select></L>
            <L t="Collection"><select value={p.collection_id} onChange={(e) => set('collection_id', e.target.value)} className="input"><option value="">— None —</option>{cols.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select></L>
            <L t="Badge"><select value={p.badge} onChange={(e) => set('badge', e.target.value)} className="input"><option value="">None</option>{['NEW', 'TRENDING', 'BEST SELLER', 'LIMITED'].map((b) => <option key={b}>{b}</option>)}</select></L>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={p.featured} onChange={(e) => set('featured', e.target.checked)} /> Featured</label>
            <L t="Tags (comma separated — used in search)"><input defaultValue={(p.tags || []).join(', ')} key={p.id || 'new'} onBlur={(e) => set('tags', e.target.value.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean))} className="input" placeholder="night, typography, oversized" /></L>
          </section>
          <section className="bg-card p-4 space-y-3">
            <L t="Fabric"><input value={p.fabric || ''} onChange={(e) => set('fabric', e.target.value)} className="input" /></L>
            <div className="grid grid-cols-2 gap-2">
              <L t="GSM"><input type="number" value={p.gsm || ''} onChange={(e) => set('gsm', +e.target.value)} className="input" /></L>
              <L t="Fit"><select value={p.fit || ''} onChange={(e) => set('fit', e.target.value)} className="input">{['Oversized', 'Regular', 'Boxy', 'Slim'].map((f) => <option key={f}>{f}</option>)}</select></L>
            </div>
          </section>
          <section className="bg-card p-4 space-y-3">
            <div className="meta">Social media</div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!p.social_skip} onChange={(e) => set('social_skip', !e.target.checked)} /> Auto-post to Facebook & Instagram when published</label>
            <p className="text-sm opacity-60">{p.social_posted_at ? `Posted on ${new Date(p.social_posted_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}` : 'Not posted yet'}</p>
            {social && <p className={`text-sm ${social.includes('fail') || social.includes('Facebook:') || social.includes('Instagram:') ? 'text-signal' : ''}`}>{social}</p>}
            {!isNew && p.status === 'published' && <button type="button" onClick={async () => { setSocial('Posting…'); const m = await postToSocials(id, true); setSocial(m); if (m.includes('✓')) setP((x: any) => ({ ...x, social_posted_at: new Date().toISOString() })); }} className="btn btn-ghost !h-10 w-full">{p.social_posted_at ? 'Post again' : 'Post to socials now'}</button>}
          </section>
          {!isNew && <button onClick={archive} className="meta text-signal underline">Archive product</button>}
        </div>
      </div>
    </div>
  );
}

const L = ({ t, children }: { t: string; children: React.ReactNode }) => <label className="block"><span className="meta opacity-60 block mb-1">{t}</span>{children}</label>;
const Chip = ({ on, onClick, children }: any) => <button type="button" onClick={onClick} className={`meta px-3 h-9 border ${on ? 'bg-ink text-paper border-ink' : 'border-warm'}`}>{children}</button>;
