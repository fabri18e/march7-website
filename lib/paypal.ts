const BASE = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getAccessToken(): Promise<string> {
  const creds = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  return data.access_token;
}

export interface PayPalItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export async function createPayPalOrder(
  items: PayPalItem[],
  returnUrl: string,
  cancelUrl: string
) {
  const token = await getAccessToken();
  const total = items.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2);

  const res = await fetch(`${BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: total,
          breakdown: {
            item_total: { currency_code: 'USD', value: total },
          },
        },
        items: items.map(i => ({
          name: i.name,
          quantity: String(i.qty),
          unit_amount: { currency_code: 'USD', value: i.price.toFixed(2) },
        })),
      }],
      application_context: {
        return_url: returnUrl,
        cancel_url: cancelUrl,
        brand_name: 'March7',
        user_action: 'PAY_NOW',
      },
    }),
  });

  const data = await res.json();
  const approveUrl = data.links?.find((l: { rel: string; href: string }) => l.rel === 'approve')?.href;
  return { id: data.id, approveUrl };
}

export async function capturePayPalOrder(orderId: string) {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return res.json();
}
