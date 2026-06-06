import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sendAdminOrderAlert } from '@/lib/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
});

// Stripe requires raw body for signature verification — disable body parsing
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // Fetch actual line items from Stripe
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });

    const cart: { id: string; qty: number }[] = JSON.parse(session.metadata?.cart || '[]');

    const sd = (session as { shipping_details?: { name?: string; address?: Record<string, string> } }).shipping_details;
    const shippingAddress = sd ? { name: sd.name ?? null, ...(sd.address ?? {}) } : null;
    const orderItems = lineItems.data.map((item, i) => ({
      product_id: cart[i]?.id ?? null,
      name: item.description ?? '',
      quantity: item.quantity ?? 1,
      unit_price: ((item.amount_total ?? 0) / (item.quantity ?? 1)) / 100,
      total: (item.amount_total ?? 0) / 100,
    }));

    const supabase = getSupabaseAdmin();
    // Upsert so the webhook always wins: if save-order already inserted without address,
    // this update sets the address. If this runs first, save-order will ignoreDuplicates.
    const { error } = await supabase.from('orders').upsert({
      stripe_session_id: session.id,
      user_id: session.metadata?.user_id || null,
      email: session.customer_details?.email || session.metadata?.email || '',
      total_amount: session.amount_total || 0,
      status: 'paid',
      items: orderItems,
      shipping_address: shippingAddress,
    }, { onConflict: 'stripe_session_id', ignoreDuplicates: false });

    if (error) {
      console.error('[Webhook] Failed to save order:', error.message);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }

    sendAdminOrderAlert({
      orderId: session.id,
      email: session.customer_details?.email || session.metadata?.email || '',
      items: orderItems,
      totalAmount: session.amount_total || 0,
      shippingAddress: shippingAddress,
    }).catch(err => console.error('[admin-alert]', err));

    console.log('[Webhook] Order saved:', session.id);
  }

  return NextResponse.json({ received: true });
}
