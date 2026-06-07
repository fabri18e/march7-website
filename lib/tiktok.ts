/* eslint-disable @typescript-eslint/no-explicit-any */
function ttq() {
  return typeof window !== 'undefined' ? (window as any).ttq : null;
}

async function sha256(str: string): Promise<string> {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str.toLowerCase().trim()));
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function tiktokIdentify(email?: string | null, userId?: string | null) {
  const t = ttq();
  if (!t) return;
  const payload: Record<string, string> = {};
  if (email) payload.email = await sha256(email);
  if (userId) payload.external_id = await sha256(userId);
  if (Object.keys(payload).length) t.identify(payload);
}

export function tiktokViewContent(id: string, name: string, price: number) {
  ttq()?.track('ViewContent', {
    contents: [{ content_id: id, content_type: 'product', content_name: name, num_items: 1 }],
    value: price,
    currency: 'USD',
  });
}

export function tiktokAddToCart(id: string, name: string, price: number) {
  ttq()?.track('AddToCart', {
    contents: [{ content_id: id, content_type: 'product', content_name: name }],
    value: price,
    currency: 'USD',
  });
}

export function tiktokInitiateCheckout(value: number, items: { id: string; name: string }[]) {
  ttq()?.track('InitiateCheckout', {
    contents: items.map(i => ({ content_id: i.id.split('--')[0], content_type: 'product', content_name: i.name })),
    value,
    currency: 'USD',
  });
}

export function tiktokPurchase(value: number) {
  ttq()?.track('PlaceAnOrder', {
    contents: [],
    value,
    currency: 'USD',
  });
}

export function tiktokSearch(query: string) {
  ttq()?.track('Search', {
    contents: [],
    search_string: query,
    value: 0,
    currency: 'USD',
  });
}

export function tiktokCompleteRegistration() {
  ttq()?.track('CompleteRegistration', {
    contents: [],
    value: 0,
    currency: 'USD',
  });
}
