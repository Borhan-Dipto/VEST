'use client';
import { browserClient } from './supabase';

export const db = browserClient();

/** Refresh the public site right after an admin save (instead of waiting for the 60s cache). */
export const refreshSite = () => fetch('/api/revalidate', { method: 'POST' }).catch(() => {});

export const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Upload an image to storage and return its public URL. */
async function toJpeg(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') return file;
  const img = await createImageBitmap(file);
  let w = img.width, h = img.height; const s = Math.min(1, 2000 / Math.max(w, h)); w = Math.round(w * s); h = Math.round(h * s);
  let cw = w, ch = h; if (w / h < 0.8) cw = Math.round(h * 0.8); if (w / h > 1.91) ch = Math.round(w / 1.91);
  const c = document.createElement('canvas'); c.width = cw; c.height = ch;
  const x = c.getContext('2d')!; x.fillStyle = '#F5F2EC'; x.fillRect(0, 0, cw, ch); x.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  const blob: Blob = await new Promise((r) => c.toBlob((b) => r(b!), 'image/jpeg', 0.9));
  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
}

export async function upload(original: File, folder = 'products') {
  const file = folder === 'site' ? original : await toJpeg(original).catch(() => original);
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await db.storage.from('media').upload(path, file, { cacheControl: '31536000', contentType: file.type });
  if (error) throw error;
  return db.storage.from('media').getPublicUrl(path).data.publicUrl;
}

export const STATUS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded'];
export const PROD = ['received', 'verified', 'printing', 'qc', 'packaging', 'dispatched'];
export const fmt = (n: number) => '৳' + (n || 0).toLocaleString('en-IN');
export const when = (d: string) => new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Ask the server to post a product to Facebook + Instagram. Returns a short status line. */
export async function postToSocials(product_id: string, force = false) {
  const r = await fetch('/api/social/publish', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ product_id, force }) });
  const j = await r.json().catch(() => ({}));
  if (j.skipped) return j.skipped as string;
  if (j.error) return 'Social post failed: ' + j.error;
  const done = [j.posted?.facebook && 'Facebook', j.posted?.instagram && 'Instagram'].filter(Boolean).join(' + ');
  return (done ? `Posted to ${done} ✓` : '') + (j.errors?.length ? ' · ' + j.errors.join(' · ') : '');
}
