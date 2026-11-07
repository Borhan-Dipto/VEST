'use client';
import { browserClient } from './supabase';

export const db = browserClient();

/** Refresh the public site right after an admin save (instead of waiting for the 60s cache). */
export const refreshSite = () => fetch('/api/revalidate', { method: 'POST' }).catch(() => {});

export const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Upload an image to storage and return its public URL. */
export async function upload(file: File, folder = 'products') {
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
