import { NextResponse } from 'next/server';
import { publicClient } from '@/lib/supabase';
export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({}));
  if (typeof email !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  await publicClient().from('subscribers').insert({ email: email.toLowerCase().slice(0, 200) });
  return NextResponse.json({ ok: true });
}
