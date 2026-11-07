// Builds a relevant, rotating hashtag set per product (same result on preview and on posting).
const tag = (s: string) => {
  const t = String(s).replace(/^#/, '').split(/[^\p{L}\p{N}]+/u).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join('');
  return t ? '#' + t : '';
};
const split = (s?: string | null) => (s || '').split(/[\s,]+/).map((x) => x.trim()).filter(Boolean);
function seeded(seed: string) { let h = 2166136261; for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296); }

export type TagInput = { id: string; tags?: string[]; fit?: string | null; extra_hashtags?: string | null; collection?: { title: string } | null; colors?: string[] };
export type TagConfig = { hashtags?: string; hashtag_pool?: string; fb_max?: number; ig_max?: number };

export function buildHashtags(p: TagInput, c: TagConfig) {
  const brand = split(c.hashtags).map(tag);
  const extra = split(p.extra_hashtags).map(tag);
  const derived = [
    ...(p.tags || []).map(tag),
    p.collection?.title ? tag(p.collection.title) : '',
    p.fit ? tag(`${p.fit} Tee`) : '',
    ...(p.colors || []).slice(0, 2).map((col) => tag(`${col} Tshirt`)),
  ];
  const rnd = seeded(p.id);
  const pool = split(c.hashtag_pool).map(tag).map((t) => [rnd(), t] as const).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  const uniq = (list: string[]) => { const seen = new Set<string>(); return list.filter((t) => t && !seen.has(t.toLowerCase()) && seen.add(t.toLowerCase())); };
  const pick = (max: number, derivedCount: number) => uniq([...brand, ...extra, ...uniq(derived).slice(0, derivedCount), ...pool]).slice(0, Math.max(max, brand.length + extra.length));
  return { facebook: pick(c.fb_max ?? 5, 2), instagram: pick(c.ig_max ?? 10, 4) };
}
