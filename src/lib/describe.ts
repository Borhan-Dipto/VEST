// Writes a product description from its own details (no AI service needed). Same input → same text.
type In = { title: string; collection?: string; fit?: string | null; fabric?: string | null; gsm?: number | null; tags?: string[]; colors?: string[] };
const pick = <T,>(arr: T[], seed: number) => arr[seed % arr.length];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const VIBE: Record<string, string> = {
  night: 'late-night city walks', anime: 'anime and art lovers', retro: 'a throwback, vintage feel', minimal: 'a clean, minimal look', typography: 'type lovers who like to say it loud',
  street: 'everyday street style', abstract: 'people who wear art', colorful: 'days that need a little colour', meme: 'the group chat', music: 'gigs, festivals and long playlists',
  black: 'an easy all-black fit', basic: 'everyday rotation', pink: 'a soft but bold statement', monochrome: 'sharp black-and-white styling', duo: 'matching with your crew',
};

export function describe(p: In) {
  const seed = [...p.title].reduce((a, c) => a + c.charCodeAt(0), 0);
  const fit = (p.fit || 'Oversized').toLowerCase();
  const title = p.title.replace(/\b\w+/g, (w) => w[0] + w.slice(1).toLowerCase());
  const coll = p.collection ? ` from the ${p.collection.replace(/\b\w+/g, (w) => w[0] + w.slice(1).toLowerCase())} collection` : '';
  const fabric = `${p.fabric || '100% cotton'}${p.gsm ? `, ${p.gsm} GSM` : ''}`;
  const tags = (p.tags || []).filter((t) => t !== 'sample');
  const vibe = tags.map((t) => VIBE[t.toLowerCase()]).find(Boolean);
  const colors = (p.colors || []).filter(Boolean);

  const open = pick([
    `${title} is a ${fit} graphic tee${coll}, made for people who let their clothes do the talking.`,
    `Meet ${title} — a ${fit} statement tee${coll} with a print you will not see everywhere.`,
    `${title} brings a bold graphic to a ${fit} cut${coll}. Simple to wear, impossible to ignore.`,
    `Built around one strong design, ${title} is a ${fit} tee${coll} that turns a basic outfit into a look.`,
  ], seed);
  const print = pick([
    'The design is DTF printed for sharp detail and rich colour that stays flexible and lasts wash after wash.',
    'Every piece is DTF printed, so the graphic stays crisp, vivid and soft to the touch — no cracking, no fading.',
    'We use DTF printing for clean lines and deep colour that move with the fabric and survive the laundry.',
  ], seed >> 1);
  const feel = pick([
    `Cut from ${fabric} for a soft feel and a shape that holds all day.`,
    `Made in ${fabric}: breathable, comfortable and built for everyday wear in Bangladesh weather.`,
    `The ${fabric} fabric feels soft, drapes well and keeps its shape after every wash.`,
  ], seed >> 2);
  const style = vibe ? `Perfect for ${vibe}.` : pick(['Pair it with denim, cargos or shorts.', 'Wear it with jeans, joggers or layered under an overshirt.', 'Easy to style — from campus to weekend plans.'], seed >> 3);
  const col = colors.length ? ` Available in ${colors.join(' and ').toLowerCase()}.` : '';
  return `${open} ${print} ${feel} ${style}${col}`.replace(/\s+/g, ' ').trim();
}

export const seoDescription = (p: In & { price: number }) =>
  `${cap((p.fit || 'oversized').toLowerCase())} DTF printed graphic tee — ${p.title}. ${p.gsm || 180} GSM cotton. ৳${p.price}. Cash on delivery all over Bangladesh.`;
