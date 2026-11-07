import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { getSettings } from '@/lib/data';

const sha = (v?: string) => (v ? createHash('sha256').update(v.trim().toLowerCase()).digest('hex') : undefined);
const phoneE164 = (p?: string) => { if (!p) return; const d = p.replace(/\D/g, ''); return d.startsWith('880') ? d : '88' + d.replace(/^88/, ''); };

// Meta Conversions API relay. Needs META_CAPI_TOKEN env + Pixel ID in admin tracking settings.
export async function POST(req: NextRequest) {
  const token = process.env.META_CAPI_TOKEN;
  const pixel = (await getSettings()).tracking?.pixel;
  if (!token || !pixel) return NextResponse.json({ skipped: true });
  const b = await req.json().catch(() => null);
  if (!b?.event_name || !b?.event_id) return NextResponse.json({ error: 'bad' }, { status: 400 });

  const ck = req.cookies;
  const [first, ...rest] = (b.user?.name || '').split(' ');
  const payload = {
    data: [{
      event_name: b.event_name, event_time: Math.floor(Date.now() / 1000), event_id: b.event_id,
      action_source: 'website', event_source_url: b.url,
      user_data: {
        client_ip_address: req.headers.get('x-forwarded-for')?.split(',')[0], client_user_agent: req.headers.get('user-agent'),
        fbp: ck.get('_fbp')?.value, fbc: ck.get('_fbc')?.value,
        ph: sha(phoneE164(b.user?.phone)), em: sha(b.user?.email), fn: sha(first), ln: sha(rest.join(' ')),
        ct: sha(b.user?.district?.replace(/\s/g, '')), country: sha('bd'),
      },
      custom_data: b.custom,
    }],
    ...(process.env.META_TEST_CODE ? { test_event_code: process.env.META_TEST_CODE } : {}),
  };
  const r = await fetch(`https://graph.facebook.com/v21.0/${pixel}/events?access_token=${token}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload),
  });
  return NextResponse.json({ ok: r.ok });
}
