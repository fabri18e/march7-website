const PIXEL_ID = process.env.TIKTOK_PIXEL_ID || 'D8IF6UBC77UB4KU2F500';
const ACCESS_TOKEN = process.env.TIKTOK_ACCESS_TOKEN || '';
const API_URL = 'https://business-api.tiktok.com/open_api/v1.3/event/track/';

async function sha256(str: string): Promise<string> {
  const { createHash } = await import('crypto');
  return createHash('sha256').update(str.toLowerCase().trim()).digest('hex');
}

interface PurchaseData {
  email?: string | null;
  value: number;
  currency?: string;
  orderId?: string;
  items?: { id: string; name: string; price: number; quantity: number }[];
}

export async function tiktokServerPurchase(data: PurchaseData) {
  if (!ACCESS_TOKEN) return;

  const hashedEmail = data.email ? await sha256(data.email) : undefined;

  const payload = {
    pixel_code: PIXEL_ID,
    event_source: 'web',
    event_source_id: PIXEL_ID,
    data: [{
      event: 'PlaceAnOrder',
      event_time: Math.floor(Date.now() / 1000),
      event_id: data.orderId || undefined,
      user: {
        ...(hashedEmail ? { email: hashedEmail } : {}),
      },
      properties: {
        value: data.value,
        currency: data.currency || 'USD',
        contents: (data.items || []).map(i => ({
          content_id: i.id,
          content_type: 'product',
          content_name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
      },
      page: { url: 'https://www.march7.net/success' },
    }],
  };

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Access-Token': ACCESS_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('[tiktok-server]', err);
    }
  } catch (err) {
    console.error('[tiktok-server]', err);
  }
}
