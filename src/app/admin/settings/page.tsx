'use client';
import { useEffect, useState } from 'react';
import { db, upload, refreshSite } from '@/lib/admin';

// Every storefront setting, in display order. Fields are rendered automatically from the stored value's shape.
const SECTIONS: [string, string, string][] = [
  ['announce', 'Top announcement bar', 'The thin black bar above the header.'],
  ['hero', 'Homepage hero', 'First thing visitors see. Use a tall (3:4) image.'],
  ['marquee', 'Scrolling text strip', 'One line per item.'],
  ['editorial', 'Homepage editorial block', 'Big story section on black background.'],
  ['statement', 'Big statement & footer line', ''],
  ['shipping', 'Delivery charges (৳)', 'inside = Dhaka district, outside = rest of Bangladesh. free_over = free delivery above this subtotal (leave empty to disable).'],
  ['product_info', 'Product page text & size chart', 'Size chart rows: size, chest (in), length (in).'],
  ['options', 'Sizes & colours', 'Available choices when creating products and in shop filters. One per line.'],
  ['tracking', 'Tracking & pixels', 'gtm = GTM-XXXX · ga4 = G-XXXX · pixel = Meta Pixel ID (numbers) · tiktok = TikTok Pixel ID. Meta Conversions API token is set on the server (ask your developer once).'],
  ['seo', 'Site SEO', 'Default title and description for Google and link previews.'],
  ['social', 'Social links & contact', 'Full URLs, e.g. https://instagram.com/yourpage'],
  ['policies', 'Policy pages', 'Each new line becomes a paragraph.'],
  ['social_post', 'Social auto-post', 'Posts each product to Facebook & Instagram when you publish it. Placeholders: {title} {price} {compare} {description} {link} {hashtags} {cta}. {cta} becomes the Facebook/Instagram call-to-action line below.'],
  ['business', 'Business info (shown on invoices)', 'Name, contact and the thank-you note printed on every invoice.'],
  ['credit', 'Footer developer credit', 'Untick Show to hide it. Note: showing the same credit as another site can link the two brands.'],
];
const LABEL: Record<string, string> = { kicker: 'Small top label', title: 'Headline', title2: 'Headline line 2 (orange)', text: 'Text', cta: 'Button text', link: 'Button link', image: 'Image', show: 'Show',
  line1: 'Statement line 1', line2: 'Statement line 2 (orange)', sub: 'Small text under statement', footer: 'Footer big line', inside: 'Inside Dhaka', outside: 'Outside Dhaka', free_over: 'Free delivery over',
  care: 'Care instructions', delivery: 'Delivery & exchange text', print: 'Print description', size_note: 'Size guide note', size_chart: 'Size chart', items: 'Items', sizes: 'Sizes', colors: 'Colours', body: 'Text', description: 'Description', name: 'Business name', phone: 'Phone', email: 'Email', website: 'Website', address: 'Address', invoice_note: 'Invoice thank-you note', enabled: 'Auto-post is on', facebook: 'Post to Facebook', instagram: 'Post to Instagram', caption: 'Caption template', hashtags: 'Brand hashtags (always added)', hashtag_pool: 'Popular hashtag pool (rotated per post)', fb_max: 'Max hashtags on Facebook', ig_max: 'Max hashtags on Instagram', link_in_comment: 'Put the order link in the first comment (recommended)', comment: 'First comment text', fb_cta: 'Facebook {cta} text', ig_cta: 'Instagram {cta} text' };
const NUMERIC = new Set(['inside', 'outside', 'free_over']);

export default function Settings() {
  const [s, setS] = useState<Record<string, any>>({});
  const [open, setOpen] = useState('hero');
  const [msg, setMsg] = useState<Record<string, string>>({});
  useEffect(() => { db.from('settings').select('key,value').then(({ data }) => setS(Object.fromEntries((data || []).map((r) => [r.key, r.value])))); }, []);

  const save = async (key: string) => {
    const { error } = await db.from('settings').upsert({ key, value: s[key], public: key !== 'social_post' });
    setMsg({ ...msg, [key]: error ? error.message : 'Saved ✓ — live in a few seconds' });
    if (!error) refreshSite();
  };

  return (
    <div className="max-w-3xl">
      <h1 className="display text-6xl mb-2">Website</h1>
      <p className="opacity-60 mb-6">Edit everything shown on the site. Click a section, change it, press Save.</p>
      <div className="space-y-2">
        {SECTIONS.map(([key, title, help]) => (
          <div key={key} className="bg-card">
            <button onClick={() => setOpen(open === key ? '' : key)} className="w-full flex justify-between p-4 text-left"><span className="font-medium">{title}</span><span className="meta">{open === key ? '−' : '+'}</span></button>
            {open === key && s[key] !== undefined && (
              <div className="px-4 pb-4 space-y-3">
                {help && <p className="text-sm opacity-60">{help}</p>}
                <Field name={key} value={s[key]} onChange={(v) => setS({ ...s, [key]: v })} />
                <div className="flex items-center gap-3"><button onClick={() => save(key)} className="btn">Save</button>{msg[key] && <span className="meta">{msg[key]}</span>}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ name, value, onChange }: { name: string; value: any; onChange: (v: any) => void }) {
  const label = LABEL[name] || name;
  if (typeof value === 'boolean') return <label className="flex gap-2 items-center text-sm"><input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} /> {label}</label>;
  if (NUMERIC.has(name) || typeof value === 'number')
    return <L t={label}><input type="number" value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : +e.target.value)} className="input !w-40" /></L>;
  if (name === 'image') return (
    <L t={label}><div className="flex items-center gap-3">
      {value && <img src={value} alt="" className="w-20 h-24 object-cover bg-warm" />}
      <label className="btn btn-ghost !h-10 cursor-pointer">Upload<input type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) onChange(await upload(f, 'site')); }} /></label>
      <input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="or paste image URL" className="input" /></div></L>
  );
  if (Array.isArray(value) && value.every((v) => Array.isArray(v))) return (
    <L t={label}><div className="space-y-1">{value.map((row: any[], i: number) => (
      <div key={i} className="flex gap-1">{row.map((c, j) => <input key={j} value={c} onChange={(e) => { const n = value.map((r: any[]) => [...r]); n[i][j] = j === 0 ? e.target.value : +e.target.value || e.target.value; onChange(n); }} className="input !h-9 !w-24" />)}
        <button onClick={() => onChange(value.filter((_: any, k: number) => k !== i))} className="meta text-signal px-2">✕</button></div>
    ))}<button onClick={() => onChange([...value, value[0] ? value[0].map(() => '') : ['', '', '']])} className="meta underline">+ Add row</button></div></L>
  );
  if (Array.isArray(value)) return <L t={`${label} (one per line)`}><textarea value={value.join('\n')} onChange={(e) => onChange(e.target.value.split('\n').map((x) => x.trim()).filter(Boolean))} className="input !h-28 py-3" /></L>;
  if (value && typeof value === 'object') return (
    <div className={name.length && typeof Object.values(value)[0] === 'object' && !Array.isArray(Object.values(value)[0]) ? 'space-y-4' : 'space-y-3'}>
      {Object.entries(value).map(([k, v]) => (
        v && typeof v === 'object' && !Array.isArray(v)
          ? <fieldset key={k} className="border border-warm p-3 space-y-3"><legend className="meta px-1">{k}</legend><Field name={k} value={v} onChange={(nv) => onChange({ ...value, [k]: nv })} /></fieldset>
          : <Field key={k} name={k} value={v} onChange={(nv) => onChange({ ...value, [k]: nv })} />
      ))}
    </div>
  );
  const long = ['text', 'body', 'care', 'delivery', 'print', 'description', 'caption'].includes(name) || String(value || '').length > 70;
  return <L t={label}>{long ? <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} className="input !h-24 py-3" /> : <input value={value || ''} onChange={(e) => onChange(e.target.value)} className="input" />}</L>;
}
const L = ({ t, children }: { t: string; children: React.ReactNode }) => <label className="block"><span className="meta opacity-60 block mb-1">{t}</span>{children}</label>;
