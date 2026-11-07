import { NextResponse } from 'next/server';
import { serverClient } from '@/lib/supabase';
import { buildHashtags } from '@/lib/hashtags';

// Posts a published product to the Facebook Page and Instagram (admin only).
// Needs env: META_PAGE_ID, META_PAGE_TOKEN (System User token), META_IG_ID.
export const maxDuration = 60;
const G = 'https://graph.facebook.com/v21.0';
const SITE = process.env.NEXT_PUBLIC_SITE_URL || '';

// The stored System User token is exchanged for the Page's own token (needed to post on the Page).
let pageToken: string | null = null;
async function getPageToken() {
  if (pageToken) return pageToken;
  const r = await fetch(`${G}/${process.env.META_PAGE_ID}?fields=access_token&access_token=${process.env.META_PAGE_TOKEN}`).then((x) => x.json());
  pageToken = r.access_token || process.env.META_PAGE_TOKEN!;
  return pageToken;
}
async function call(path: string, params: Record<string, string>, usePage = false) {
  const token: string = usePage ? (await getPageToken()) as string : process.env.META_PAGE_TOKEN!;
  const r = await fetch(`${G}/${path}`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ ...params, access_token: token }) });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error?.error_user_msg || j.error?.message || `Meta error ${r.status}`);
  return j;
}
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function igReady(id: string) {
  for (let i = 0; i < 10; i++) {
    const r = await fetch(`${G}/${id}?fields=status_code&access_token=${process.env.META_PAGE_TOKEN}`).then((x) => x.json());
    if (r.status_code === 'FINISHED') return;
    if (r.status_code === 'ERROR') throw new Error('Instagram could not process an image (use JPG, ratio between 4:5 and 1.91:1)');
    await wait(1500);
  }
}

export async function POST(req: Request) {
  const db = await serverClient();
  const { data: admin } = await db.rpc('is_admin');
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { product_id, force } = await req.json().catch(() => ({}));

  const { PAGE, TOKEN, IG } = { PAGE: process.env.META_PAGE_ID, TOKEN: process.env.META_PAGE_TOKEN, IG: process.env.META_IG_ID };
  if (!PAGE || !TOKEN) return NextResponse.json({ skipped: 'Social posting is not connected yet.' });

  const [{ data: p }, { data: cfg }] = await Promise.all([
    db.from('products').select('*, images:product_images(url,sort), collection:collections(title), variants(color)').eq('id', product_id).single(),
    db.from('settings').select('value').eq('key', 'social_post').single(),
  ]);
  const c = cfg?.value || {};
  if (!p) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  if (!c.enabled) return NextResponse.json({ skipped: 'Auto-post is turned off in Website settings.' });
  if (p.status !== 'published') return NextResponse.json({ skipped: 'Only published products are posted.' });
  if (p.social_skip && !force) return NextResponse.json({ skipped: 'This product is set to not post on socials.' });
  if (p.social_posted_at && !force) return NextResponse.json({ skipped: 'Already posted.' });

  const abs = (u: string) => (u.startsWith('http') ? u : SITE + u);
  const imgs = p.images.sort((a: any, b: any) => a.sort - b.sort).map((i: any) => abs(i.url)).filter((u: string) => /\.(jpe?g|png)(\?|$)/i.test(u)).slice(0, 10);
  if (!imgs.length) return NextResponse.json({ error: 'Add at least one JPG/PNG image first.' }, { status: 400 });

  const link = `${SITE}/product/${p.slug}`;
  const tags = buildHashtags({ ...p, colors: [...new Set<string>((p.variants || []).map((v: any) => v.color))] }, c);
  const fill = (t: string, cta = '', ht = '') => String(t || '')
    .replaceAll('{title}', p.title).replaceAll('{price}', String(p.price))
    .replaceAll('{compare}', p.compare_price ? `৳${p.compare_price}` : '').replaceAll('{description}', p.description || '')
    .replaceAll('{cta}', cta).replaceAll('{link}', link).replaceAll('{hashtags}', ht).replace(/\n{3,}/g, '\n\n').trim();
  const inComment = c.link_in_comment !== false;
  // Link goes in the first comment (Facebook reduces reach of posts with links in the caption)
  const fbCaption = fill(c.caption || '{title}\n{cta}', inComment ? (c.fb_cta || '👇 Order link in the comments') : `🛒 Order now: ${link}`, tags.facebook.join(' '));
  const igCaption = fill(c.caption || '{title}\n{cta}', c.ig_cta || '🔗 Order via the link in our bio', tags.instagram.join(' '));
  const comment = fill(c.comment || '🛒 Order now: {link}');

  const out: any = {}, errors: string[] = [];
  if (c.facebook !== false) {
    try {
      if (imgs.length === 1) out.facebook = (await call(`${PAGE}/photos`, { url: imgs[0], message: fbCaption }, true)).post_id;
      else {
        const ids = [];
        for (const u of imgs) ids.push((await call(`${PAGE}/photos`, { url: u, published: 'false' }, true)).id);
        const params: Record<string, string> = { message: fbCaption };
        ids.forEach((id, i) => (params[`attached_media[${i}]`] = JSON.stringify({ media_fbid: id })));
        out.facebook = (await call(`${PAGE}/feed`, params, true)).id;
      }
      if (inComment && out.facebook) {
        try { out.facebook_comment = (await call(`${out.facebook}/comments`, { message: comment }, true)).id; }
        catch (e: any) { errors.push('Facebook comment: ' + e.message); }
      }
    } catch (e: any) { errors.push('Facebook: ' + e.message); }
  }
  if (IG && c.instagram !== false) {
    try {
      let creation: string;
      if (imgs.length === 1) creation = (await call(`${IG}/media`, { image_url: imgs[0], caption: igCaption })).id;
      else {
        const kids = [];
        for (const u of imgs) kids.push((await call(`${IG}/media`, { image_url: u, is_carousel_item: 'true' })).id);
        for (const k of kids) await igReady(k);
        creation = (await call(`${IG}/media`, { media_type: 'CAROUSEL', children: kids.join(','), caption: igCaption })).id;
      }
      await igReady(creation);
      out.instagram = (await call(`${IG}/media_publish`, { creation_id: creation })).id;
      if (inComment) { try { out.instagram_comment = (await call(`${out.instagram}/comments`, { message: comment })).id; } catch (e: any) { errors.push('Instagram comment: ' + e.message); } }
    } catch (e: any) { errors.push('Instagram: ' + e.message); }
  }

  if (out.facebook || out.instagram) await db.from('products').update({ social_posted_at: new Date().toISOString(), social_ref: out }).eq('id', p.id);
  return NextResponse.json({ ok: !errors.length, posted: out, errors });
}
