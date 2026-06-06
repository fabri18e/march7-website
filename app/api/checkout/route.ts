import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
});

interface CartItem {
  id: string;
  name: string;
  price: number;
  image?: string | null;
  qty: number;
}

export async function POST(req: NextRequest) {
  try {
    const { items, userId, userEmail }: { items: CartItem[]; userId?: string; userEmail?: string } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_URL || 'https://www.march7.net';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: items.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            ...(item.image ? { images: [item.image] } : {}),
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.qty,
      })),
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/`,
      metadata: {
        user_id: userId || '',
        email: userEmail || '',
        cart: JSON.stringify(items.map(i => ({ id: i.id, qty: i.qty }))),
      },
      allow_promotion_codes: true,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'MX', 'GB', 'AU', 'DE', 'FR', 'ES', 'IT', 'BR'],
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
