/* eslint-disable @typescript-eslint/no-explicit-any */
function ttq() {
  return typeof window !== 'undefined' ? (window as any).ttq : null;
}

export function tiktokViewContent(id: string, name: string, price: number) {
  ttq()?.track('ViewContent', { content_id: id, content_name: name, content_type: 'product', value: price, currency: 'USD' });
}

export function tiktokAddToCart(id: string, name: string, price: number) {
  ttq()?.track('AddToCart', { content_id: id, content_name: name, content_type: 'product', value: price, currency: 'USD' });
}

export function tiktokInitiateCheckout(value: number) {
  ttq()?.track('InitiateCheckout', { value, currency: 'USD' });
}

export function tiktokPurchase(value: number) {
  ttq()?.track('Purchase', { value, currency: 'USD' });
}

export function tiktokSearch(query: string) {
  ttq()?.track('Search', { query });
}

export function tiktokCompleteRegistration() {
  ttq()?.track('CompleteRegistration');
}
