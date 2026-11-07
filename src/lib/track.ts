'use client';
// One call fires: GA4 (gtag / GTM dataLayer) + Meta Pixel (browser) + Meta CAPI (server) with a shared event_id for dedup.

type Item = { id: string; name: string; price: number; qty?: number; variant?: string };
declare global { interface Window { dataLayer?: any[]; gtag?: (...a: any[]) => void; fbq?: (...a: any[]) => void; ttq?: any } }

const META: Record<string, string> = {
  view_item: 'ViewContent', add_to_cart: 'AddToCart', begin_checkout: 'InitiateCheckout', add_payment_info: 'AddPaymentInfo',
  purchase: 'Purchase', search: 'Search', add_to_wishlist: 'AddToWishlist', page_view: 'PageView',
};
const TT: Record<string, string> = { view_item: 'ViewContent', add_to_cart: 'AddToCart', begin_checkout: 'InitiateCheckout', purchase: 'CompletePayment', search: 'Search' };

export const newEventId = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random());

export function track(event: string, d: { items?: Item[]; value?: number; search?: string; order_id?: string; user?: { phone?: string; email?: string; name?: string; district?: string } } = {}, eventId = newEventId()) {
  if (typeof window === 'undefined') return eventId;
  const items = d.items || [];
  const value = d.value ?? items.reduce((s, i) => s + i.price * (i.qty || 1), 0);
  const ga = { currency: 'BDT', value, transaction_id: d.order_id, search_term: d.search,
    items: items.map((i) => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.qty || 1, item_variant: i.variant })) };

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({ event, event_id: eventId, ecommerce: ga });
  window.gtag?.('event', event, ga);

  const metaName = META[event];
  const custom = { content_ids: items.map((i) => i.id), content_type: 'product', contents: items.map((i) => ({ id: i.id, quantity: i.qty || 1 })),
    value, currency: 'BDT', num_items: items.reduce((s, i) => s + (i.qty || 1), 0), search_string: d.search };
  if (metaName) {
    window.fbq?.('track', metaName, custom, { eventID: eventId });
    fetch('/api/capi', { method: 'POST', headers: { 'content-type': 'application/json' }, keepalive: true,
      body: JSON.stringify({ event_name: metaName, event_id: eventId, url: location.href, custom, user: d.user }) }).catch(() => {});
  }
  if (TT[event]) window.ttq?.track(TT[event], { contents: custom.contents.map((c) => ({ content_id: c.id, quantity: c.quantity })), value, currency: 'BDT' }, { event_id: eventId });
  return eventId;
}

/** Save UTM / click ids from the landing URL so the order records its source. */
export function captureUtm() {
  try {
    const p = new URLSearchParams(location.search);
    const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid', 'ttclid'];
    const found = Object.fromEntries(keys.filter((k) => p.get(k)).map((k) => [k, p.get(k)]));
    if (Object.keys(found).length) localStorage.setItem('vest_utm', JSON.stringify({ ...found, landing: location.pathname, at: Date.now() }));
    if (found.fbclid && !document.cookie.includes('_fbc=')) document.cookie = `_fbc=fb.1.${Date.now()}.${found.fbclid}; path=/; max-age=7776000`;
  } catch {}
}
export function getUtm() { try { return JSON.parse(localStorage.getItem('vest_utm') || 'null'); } catch { return null; } }
