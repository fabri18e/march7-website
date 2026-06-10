import { NextRequest, NextResponse } from 'next/server';
import { createPayPalOrder } from '@/lib/paypal';

export async function POST(req: NextRequest) {
  try {
    const { items, userId, userEmail } = await req.json();
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_URL || 'https://www.march7.net';

    const { id, approveUrl } = await createPayPalOrder(
      items,
      `${origin}/api/paypal/capture?userId=${userId || ''}&email=${encodeURIComponent(userEmail || '')}&cart=${encodeURIComponent(JSON.stringify(items))}`,
      `${origin}/`
    );

    return NextResponse.json({ id, approveUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'PayPal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
