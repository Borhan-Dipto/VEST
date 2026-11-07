'use client';
import { use, useEffect, useRef, useState } from 'react';
import { browserClient } from '@/lib/supabase';
import { orderCode, parseOrder } from '@/lib/order';

const INK = '#0B0B0F', GOLD = '#B89B5E', MUTED = '#6B6B70', LINE = '#E4E0D6';
const tk = (n: number) => 'Tk ' + (n || 0).toLocaleString('en-IN');
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

// Phone is passed in the URL hash (#01XXXXXXXXX) so it never reaches server logs.
export default function Invoice({ params }: { params: Promise<{ no: string }> }) {
  const { no } = use(params);
  const [o, setO] = useState<any>(undefined);
  const [biz, setBiz] = useState<any>({});
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const phone = decodeURIComponent(location.hash.slice(1));
    const db = browserClient();
    db.from('settings').select('value').eq('key', 'business').single().then(({ data }) => setBiz(data?.value || {}));
    db.rpc('invoice_data', { p_no: parseOrder(no), p_phone: phone }).then(({ data }) => setO(data || null));
  }, [no]);

  const download = async () => {
    if (!ref.current) return; setBusy(true);
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas-pro'), import('jspdf')]);
    const canvas = await html2canvas(ref.current, { scale: 2, backgroundColor: '#ffffff' });
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const w = 210, h = (canvas.height * w) / canvas.width;
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, w, Math.min(h, 297));
    pdf.save(`VEST-Invoice-${orderCode(o.order_no)}.pdf`);
    setBusy(false);
  };
  useEffect(() => { if (o && new URLSearchParams(location.search).get('dl') === '1') download(); }, [o]);

  if (o === undefined) return <div className="min-h-screen grid place-items-center meta">Loading invoice…</div>;
  if (o === null) return <div className="min-h-screen grid place-items-center text-center p-6"><div><p className="display text-5xl">Invoice not found</p><p className="mt-3 opacity-60">Open it from your order tracking page.</p><a href="/track" className="btn mt-6">Track order</a></div></div>;

  const paid = o.payment_status === 'paid';
  const due = paid ? 0 : o.total;
  const addr = [o.address, o.area, o.district, o.division].filter(Boolean).filter((x: string, i: number, a: string[]) => a.findIndex((y) => y.trim().toLowerCase() === x.trim().toLowerCase()) === i && !(i > 0 && String(o.address).toLowerCase().includes(x.trim().toLowerCase()))).join(', ');
  useEffect(() => { if (o) document.title = `Invoice ${orderCode(o.order_no)} — VEST`; }, [o]);

  return (
    <div style={{ background: '#EDEAE3', minHeight: '100vh', padding: '24px 12px' }}>
      <style>{`@media print { .no-print{display:none!important} body{background:#fff} @page{size:A4;margin:0} }`}</style>
      <div className="no-print" style={{ maxWidth: 794, margin: '0 auto 16px', display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button onClick={() => window.print()} className="btn btn-ghost">Print</button>
        <button onClick={download} disabled={busy} className="btn">{busy ? 'Preparing PDF…' : 'Download PDF'}</button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <div ref={ref} style={{ width: 794, minHeight: 1123, margin: '0 auto', background: '#fff', color: INK, fontFamily: "'Jost','Space Grotesk',system-ui,sans-serif", boxSizing: 'border-box', padding: '56px 60px', position: 'relative' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 300, fontSize: 40, letterSpacing: '0.32em' }}>VEST</div>
              <div style={{ width: 36, height: 1, background: GOLD, margin: '12px 0' }} />
              <div style={{ fontSize: 10, letterSpacing: '0.28em', color: GOLD }}>WEAR YOUR OWN STORY</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 28, fontWeight: 500, letterSpacing: '0.2em' }}>INVOICE</div>
              <div style={{ marginTop: 10, fontSize: 13, color: MUTED, lineHeight: 1.7 }}>
                <div><b style={{ color: INK }}>{orderCode(o.order_no)}</b></div>
                <div>Date: {fmtDate(o.created_at)}</div>
              </div>
              <div style={{ display: 'inline-block', marginTop: 10, padding: '5px 12px', fontSize: 11, letterSpacing: '0.18em', fontWeight: 500, border: `1px solid ${paid ? '#2E7D4F' : GOLD}`, color: paid ? '#2E7D4F' : '#8A6D2F' }}>
                {paid ? 'PAID' : 'CASH ON DELIVERY'}
              </div>
            </div>
          </div>

          {/* Parties */}
          <div style={{ display: 'flex', gap: 40, marginTop: 44, paddingTop: 28, borderTop: `1px solid ${LINE}` }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.24em', color: MUTED, marginBottom: 10 }}>BILLED TO</div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{o.customer_name}</div>
              <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.7, marginTop: 4 }}>{o.phone}{o.email && <><br />{o.email}</>}<br />{addr}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.24em', color: MUTED, marginBottom: 10 }}>FROM</div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{biz.name || 'VEST'}</div>
              <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.7, marginTop: 4 }}>{biz.website}{biz.email && <><br />{biz.email}</>}{biz.phone && <><br />{biz.phone}</>}{biz.address && <><br />{biz.address}</>}</div>
            </div>
          </div>

          {/* Items */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 40, fontSize: 13 }}>
            <thead>
              <tr style={{ background: INK, color: '#F5F1E8', textAlign: 'left' }}>
                {['#', 'ITEM', 'SIZE / COLOUR', 'QTY', 'PRICE', 'AMOUNT'].map((h, i) => (
                  <th key={h} style={{ padding: '12px 14px', fontSize: 10, letterSpacing: '0.18em', fontWeight: 500, textAlign: i >= 3 ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {o.items.map((it: any, i: number) => (
                <tr key={i} style={{ borderBottom: `1px solid ${LINE}` }}>
                  <td style={{ padding: '14px', color: MUTED }}>{String(i + 1).padStart(2, '0')}</td>
                  <td style={{ padding: '14px' }}><div style={{ fontWeight: 500 }}>{it.title}</div>{it.sku && <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{it.sku}</div>}</td>
                  <td style={{ padding: '14px', color: MUTED }}>{it.size} / {it.color}</td>
                  <td style={{ padding: '14px', textAlign: 'right' }}>{it.qty}</td>
                  <td style={{ padding: '14px', textAlign: 'right' }}>{tk(it.price)}</td>
                  <td style={{ padding: '14px', textAlign: 'right', fontWeight: 500 }}>{tk(it.price * it.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
            <div style={{ width: 300, fontSize: 13 }}>
              {[['Subtotal', tk(o.subtotal)], ...(o.discount ? [[`Discount${o.coupon_code ? ` (${o.coupon_code})` : ''}`, '− ' + tk(o.discount)]] : []), ['Delivery charge', o.shipping ? tk(o.shipping) : 'Free']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: MUTED }}><span>{k}</span><span style={{ color: INK }}>{v}</span></div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', marginTop: 6, borderTop: `2px solid ${INK}`, fontSize: 16, fontWeight: 500 }}><span>Total</span><span>{tk(o.total)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: paid ? '#EEF6F0' : '#F7F2E7', fontWeight: 500 }}><span>{paid ? 'Amount paid' : 'Amount due on delivery'}</span><span>{tk(paid ? o.total : due)}</span></div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ position: 'absolute', left: 60, right: 60, bottom: 48 }}>
            {o.courier_ref && <div style={{ fontSize: 12, color: MUTED, marginBottom: 16 }}>Courier tracking: <b style={{ color: INK }}>{o.courier_ref}</b></div>}
            <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontFamily: "'Instrument Serif','Playfair Display',Georgia,serif", fontStyle: 'italic', fontSize: 20 }}>{biz.invoice_note || 'Thank you for shopping with VEST.'}</div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 6 }}>Track your order any time at {biz.website || 'vestbd.vercel.app'}/track</div>
              </div>
              <div style={{ fontSize: 10, letterSpacing: '0.2em', color: GOLD }}>VEST — {orderCode(o.order_no)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
