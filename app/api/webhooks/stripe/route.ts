import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sendAdminOrderAlert, sendAdminDisputeAlert, sendOrderRefunded } from '@/lib/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
});

export const dynamic = 'force-dynamic';

async function findOrderByPaymentIntent(paymentIntentId: string) {
  const sessions = await stripe.checkout.sessions.list({ payment_intent: paymentIntentId, limit: 1 });
  const sessionId = sessions.data[0]?.id;
  if (!sessionId) return null;
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from('orders').select('*').eq('stripe_session_id', sessionId).single();
  return data;
}

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

  // ── New order ──────────────────────────────────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
    const cart: { id: string; qty: number }[] = JSON.parse(session.metadata?.cart || '[]');

    const sd = session.collected_information?.shipping_details;
    const shippingAddress = sd ? { name: sd.name ?? null, ...sd.address } : null;
    const orderItems = lineItems.data.map((item, i) => ({
      product_id: cart[i]?.id ?? null,
      name: item.description ?? '',
      quantity: item.quantity ?? 1,
      unit_price: ((item.amount_total ?? 0) / (item.quantity ?? 1)) / 100,
      total: (item.amount_total ?? 0) / 100,
    }));

    const supabase = getSupabaseAdmin();
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

  // ── Chargeback filed ───────────────────────────────────────────────────────
  if (event.type === 'charge.dispute.created') {
    const dispute = event.data.object as Stripe.Dispute;
    const paymentIntentId = typeof dispute.payment_intent === 'string'
      ? dispute.payment_intent
      : dispute.payment_intent?.id;

    if (paymentIntentId) {
      const order = await findOrderByPaymentIntent(paymentIntentId);
      if (order) {
        const supabase = getSupabaseAdmin();
        await supabase.from('orders').update({ status: 'disputed' }).eq('id', order.id);

        sendAdminDisputeAlert({
          orderId: order.stripe_session_id,
          email: order.email,
          amount: dispute.amount,
          reason: dispute.reason,
          dueBy: (dispute as unknown as { evidence_due_by?: number }).evidence_due_by,
        }).catch(err => console.error('[dispute-alert]', err));

        console.log('[Webhook] Dispute created for order:', order.id);
      }
    }
  }

  // ── Chargeback resolved ────────────────────────────────────────────────────
  if (event.type === 'charge.dispute.closed') {
    const dispute = event.data.object as Stripe.Dispute;
    const paymentIntentId = typeof dispute.payment_intent === 'string'
      ? dispute.payment_intent
      : dispute.payment_intent?.id;

    if (paymentIntentId) {
      const order = await findOrderByPaymentIntent(paymentIntentId);
      if (order) {
        const supabase = getSupabaseAdmin();
        // Won: restore previous status. Lost: mark refunded (Stripe already returned the money).
        const newStatus = dispute.status === 'won' ? 'delivered' : 'refunded';
        await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
        console.log('[Webhook] Dispute closed (%s) for order:', dispute.status, order.id);
      }
    }
  }

  // ── Refund processed ──────────────────────────────────────────────────────
  if (event.type === 'charge.refunded') {
    const charge = event.data.object as Stripe.Charge;
    const paymentIntentId = typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : charge.payment_intent?.id;

    if (paymentIntentId) {
      const order = await findOrderByPaymentIntent(paymentIntentId);
      if (order) {
        const supabase = getSupabaseAdmin();
        await supabase.from('orders').update({ status: 'refunded' }).eq('id', order.id);

        sendOrderRefunded({
          to: order.email,
          orderId: order.stripe_session_id,
          items: order.items,
          totalAmount: order.total_amount,
        }).catch(err => console.error('[refund-email]', err));

        console.log('[Webhook] Refund processed for order:', order.id);
      }
    }
  }

  return NextResponse.json({ received: true });
}
