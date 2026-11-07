'use client';
import { useEffect, useState } from 'react';
import { db, upload, slugify, refreshSite } from '@/lib/admin';
const NEW = { title: '', slug: '', description: '', cover_url: '', sort: 0, active: true };
export default function Collections() {
  const [list, setList] = useState<any[]>([]); const [ed, setEd] = useState<any>(null); const [msg, setMsg] = useState('');
  const load = () => db.from('collections').select('*, products(count)').order('sort').then(({ data }) => setList(data || []));
  useEffect(() => { load(); }, []);
  const save = async () => {
    const { id, products, created_at, ...row } = ed; if (!row.title || !row.slug) return setMsg('Title and URL are required');
    const { error } = id ? await db.from('collections').update(row).eq('id', id) : await db.from('collections').insert(row);
    if (error) return setMsg(error.message); setEd(null); setMsg(''); refreshSite(); load();
  };
  const del = async (c: any) => { if (!confirm(`Delete "${c.title}"? Products stay but lose this collection.`)) return; await db.from('collections').delete().eq('id', c.id); refreshSite(); load(); };
  return (
    <div className="max-w-4xl">
      <div className="flex justify-between items-end mb-6"><h1 className="display text-6xl">Collections</h1><button onClick={() => setEd({ ...NEW, sort: list.length + 1 })} className="btn">+ New</button></div>
      {ed && (
        <div className="bg-card p-4 mb-6 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <input placeholder="Title (e.g. AFTER DARK)" value={ed.title} onChange={(e) => setEd({ ...ed, title: e.target.value, slug: ed.id ? ed.slug : slugify(e.target.value) })} className="input" />
            <input placeholder="URL slug" value={ed.slug} onChange={(e) => setEd({ ...ed, slug: slugify(e.target.value) })} className="input" />
          </div>
          <textarea placeholder="Short description" value={ed.description || ''} onChange={(e) => setEd({ ...ed, description: e.target.value })} className="input !h-20 py-3" />
          <div className="flex flex-wrap gap-3 items-center">
            {ed.cover_url && <img src={ed.cover_url} alt="" className="w-20 h-24 object-cover" />}
            <label className="btn btn-ghost !h-10 cursor-pointer">Cover image<input type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) setEd({ ...ed, cover_url: await upload(f, 'collections') }); }} /></label>
            <label className="text-sm">Order <input type="number" value={ed.sort} onChange={(e) => setEd({ ...ed, sort: +e.target.value })} className="input !h-10 !w-20 ml-1" /></label>
            <label className="text-sm flex gap-2 items-center"><input type="checkbox" checked={ed.active} onChange={(e) => setEd({ ...ed, active: e.target.checked })} /> Visible</label>
          </div>
          {msg && <p className="text-signal text-sm">{msg}</p>}
          <div className="flex gap-2"><button onClick={save} className="btn">Save</button><button onClick={() => setEd(null)} className="btn btn-ghost">Cancel</button></div>
        </div>
      )}
      <div className="bg-card divide-y divide-warm">{list.map((c) => (
        <div key={c.id} className="flex items-center gap-3 p-3">
          {c.cover_url ? <img src={c.cover_url} alt="" className="w-12 h-14 object-cover" /> : <div className="w-12 h-14 bg-warm" />}
          <div className="flex-1"><div className="font-medium">{c.title} {!c.active && <span className="meta opacity-60">(hidden)</span>}</div><div className="text-sm opacity-60">/collections/{c.slug} · {c.products?.[0]?.count || 0} products · order {c.sort}</div></div>
          <button onClick={() => setEd(c)} className="meta underline">Edit</button><button onClick={() => del(c)} className="meta text-signal underline">Delete</button>
        </div>
      ))}</div>
    </div>
  );
}
