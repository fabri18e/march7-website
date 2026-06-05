import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sendOrderConfirmation, sendAdminOrderAlert } from '@/lib/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
});

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 100 });
    const cart: { id: string; qty: number }[] = JSON.parse(session.metadata?.cart || '[]');

    const orderItems = lineItems.data.map((item, i) => ({
      product_id: cart[i]?.id ?? null,
      name: item.description ?? '',
      quantity: item.quantity ?? 1,
      unit_price: ((item.amount_total ?? 0) / (item.quantity ?? 1)) / 100,
      total: (item.amount_total ?? 0) / 100,
    }));

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('orders').insert({
      stripe_session_id: session.id,
      user_id: session.metadata?.user_id || null,
      email: session.customer_details?.email || session.metadata?.email || '',
      total_amount: session.amount_total || 0,
      status: 'paid',
      items: orderItems,
    });

    // Duplicate = already saved by webhook, that's fine
    if (error && !error.message.includes('duplicate') && !error.code?.includes('23505')) {
      console.error('[save-order]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fire and forget: confirmation to customer + alert to admin
    const customerEmail = session.customer_details?.email || session.metadata?.email;
    if (!error) {
      if (customerEmail) {
        sendOrderConfirmation({
          to: customerEmail,
          orderId: session.id,
          items: orderItems,
          totalAmount: session.amount_total || 0,
        }).catch(err => console.error('[email:confirmation]', err));
      }
      sendAdminOrderAlert({
        orderId: session.id,
        email: customerEmail || '',
        items: orderItems,
        totalAmount: session.amount_total || 0,
        shippingAddress: (session as { shipping_details?: { address?: Record<string, string> } }).shipping_details?.address ?? null,
      }).catch(err => console.error('[email:admin-alert]', err));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[save-order]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
