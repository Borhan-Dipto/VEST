import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { serverClient } from '@/lib/supabase';
// Admin-only: clears the storefront cache so edits show instantly.
export async function POST() {
  const db = await serverClient();
  const { data } = await db.rpc('is_admin');
  if (!data) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  revalidatePath('/', 'layout');
  return NextResponse.json({ ok: true });
}
