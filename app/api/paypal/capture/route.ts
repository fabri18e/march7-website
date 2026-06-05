import { NextRequest, NextResponse } from 'next/server';
import { capturePayPalOrder } from '@/lib/paypal';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const token = searchParams.get('token'); // PayPal order ID
  const userId = searchParams.get('userId') || null;
  const email = searchParams.get('email') || '';
  const cartRaw = searchParams.get('cart') || '[]';

  if (!token) return NextResponse.redirect(`${origin}/?error=missing_token`);

  try {
    const capture = await capturePayPalOrder(token);
    if (capture.status !== 'COMPLETED') {
      return NextResponse.redirect(`${origin}/?error=payment_failed`);
    }

    const cart = JSON.parse(decodeURIComponent(cartRaw));
    const total = cart.reduce((s: number, i: { price: number; qty: number }) => s + i.price * i.qty, 0);

    const supabase = getSupabaseAdmin();
    await supabase.from('orders').insert({
      stripe_session_id: `paypal_${token}`,
      user_id: userId || null,
      email,
      total_amount: Math.round(total * 100),
      status: 'paid',
      items: cart.map((i: { id: string; name: string; price: number; qty: number }) => ({
        product_id: i.id,
        name: i.name,
        quantity: i.qty,
        unit_price: i.price,
        total: i.price * i.qty,
      })),
    });

    return NextResponse.redirect(`${origin}/success`);
  } catch (err) {
    console.error('[PayPal capture]', err);
    return NextResponse.redirect(`${origin}/?error=capture_failed`);
  }
}
