import { NextRequest, NextResponse } from 'next/server';
import { createPayPalOrder } from '@/lib/paypal';

export async function POST(req: NextRequest) {
  try {
    const { items, userId, userEmail } = await req.json();
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

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
