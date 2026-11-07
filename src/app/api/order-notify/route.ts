import { NextResponse } from 'next/server';
import { publicClient } from '@/lib/supabase';
import { orderCode } from '@/lib/order';

// Called by the database right after a new order is saved. Emails the owner.
// Needs env: HOOK_SECRET, RESEND_API_KEY, NOTIFY_EMAIL.
const esc = (s: any) => String(s ?? '').replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]!));
const tk = (n: number) => 'Tk ' + (n || 0).toLocaleString('en-IN');

export async function POST(req: Request) {
  if (!process.env.HOOK_SECRET || req.headers.get('x-hook-secret') !== process.env.HOOK_SECRET) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { order_no, phone } = await req.json().catch(() => ({}));
  const { data: o } = await publicClient().rpc('invoice_data', { p_no: order_no, p_phone: phone });
  if (!o) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (!process.env.RESEND_API_KEY || !process.env.NOTIFY_EMAIL) return NextResponse.json({ skipped: 'email not configured' });

  const SITE = process.env.NEXT_PUBLIC_SITE_URL || '';
  const code = orderCode(o.order_no);
  const rows = o.items.map((i: any) => `<tr><td style="padding:8px 0;border-bottom:1px solid #eee">${i.qty}× <b>${esc(i.title)}</b><br><span style="color:#777">${esc(i.size)} / ${esc(i.color)}</span></td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${tk(i.price * i.qty)}</td></tr>`).join('');
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#0B0B0F">
    <div style="background:#0B0B0F;color:#F5F1E8;padding:20px 24px;letter-spacing:6px;font-size:20px">VEST <span style="color:#C9A961;font-size:12px;letter-spacing:2px">NEW ORDER</span></div>
    <div style="padding:24px;border:1px solid #eee;border-top:0">
      <p style="font-size:22px;margin:0 0 4px"><b>${code}</b> — ${tk(o.total)}</p>
      <p style="color:#777;margin:0 0 20px">${o.payment_status === 'paid' ? 'Paid' : 'Cash on delivery'} · ${new Date(o.created_at).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' })}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}
        <tr><td style="padding:6px 0;color:#777">Delivery</td><td style="text-align:right">${o.shipping ? tk(o.shipping) : 'Free'}</td></tr>
        ${o.discount ? `<tr><td style="padding:6px 0;color:#777">Discount ${esc(o.coupon_code || '')}</td><td style="text-align:right">− ${tk(o.discount)}</td></tr>` : ''}
        <tr><td style="padding:10px 0;font-weight:bold;border-top:2px solid #0B0B0F">Total</td><td style="text-align:right;font-weight:bold;border-top:2px solid #0B0B0F">${tk(o.total)}</td></tr></table>
      <h3 style="margin:24px 0 8px;font-size:14px;letter-spacing:2px">CUSTOMER</h3>
      <p style="margin:0;line-height:1.6">${esc(o.customer_name)}<br><a href="tel:${esc(o.phone)}">${esc(o.phone)}</a>${o.email ? `<br>${esc(o.email)}` : ''}<br>${esc([o.address, o.area, o.district].filter(Boolean).join(', '))}</p>
      <p style="margin:24px 0 0"><a href="${SITE}/admin/orders" style="background:#0B0B0F;color:#F5F1E8;padding:12px 20px;text-decoration:none;display:inline-block">Open in admin</a>
      &nbsp;<a href="https://wa.me/88${String(o.phone).replace(/\D/g, '').replace(/^88/, '')}" style="color:#1F8A4C">WhatsApp customer</a></p>
    </div></div>`;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: process.env.NOTIFY_FROM || 'VEST Orders <onboarding@resend.dev>', to: process.env.NOTIFY_EMAIL.split(','), subject: `🛒 New order ${code} — ${tk(o.total)} (${o.district})`, html }),
  });
  return NextResponse.json({ ok: r.ok });
}
