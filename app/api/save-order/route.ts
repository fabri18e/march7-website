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

    const orderItems = lineItems.data.map((item, i) => {
      const itemTotal = item.amount_total ?? item.amount_subtotal ?? 0;
      const qty = item.quantity ?? 1;
      return {
        product_id: cart[i]?.id ?? null,
        name: item.description ?? '',
        quantity: qty,
        unit_price: itemTotal / qty / 100,
        total: itemTotal / 100,
      };
    });

    // amount_total can be null with automatic_tax or promotions — fall back to PaymentIntent
    let totalAmount = session.amount_total
      ?? lineItems.data.reduce((sum, item) => sum + (item.amount_total ?? item.amount_subtotal ?? 0), 0);

    if (!totalAmount && session.payment_intent && typeof session.payment_intent === 'string') {
      const pi = await stripe.paymentIntents.retrieve(session.payment_intent);
      totalAmount = pi.amount;
    }

    const rawAddr = session.collected_information?.shipping_details;
    const shippingAddress = rawAddr ? { name: rawAddr.name ?? null, ...rawAddr.address } : null;

    const supabase = getSupabaseAdmin();

    // Check if order already exists — if so, skip email to avoid duplicates
    const { data: existing } = await supabase
      .from('orders')
      .select('id')
      .eq('stripe_session_id', session.id)
      .maybeSingle();

    const existingEmail = session.customer_details?.email || session.metadata?.email || '';
    const existingCode = session.id.replace('paypal_', '').slice(-10).toUpperCase();
    if (existing) return NextResponse.json({ ok: true, totalAmount, orderItems, email: existingEmail, orderCode: existingCode });

    const { error } = await supabase.from('orders').insert({
      stripe_session_id: session.id,
      user_id: session.metadata?.user_id || null,
      email: session.customer_details?.email || session.metadata?.email || '',
      total_amount: totalAmount,
      status: 'paid',
      items: orderItems,
      shipping_address: shippingAddress,
    });

    if (error) {
      console.error('[save-order]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send emails only on first insert
    const customerEmail = session.customer_details?.email || session.metadata?.email;
    if (customerEmail) {
      sendOrderConfirmation({
        to: customerEmail,
        orderId: session.id,
        items: orderItems,
        totalAmount,
      }).catch(err => console.error('[email:confirmation]', err));
    }
    sendAdminOrderAlert({
      orderId: session.id,
      email: customerEmail || '',
      items: orderItems,
      totalAmount,
      shippingAddress: session.collected_information?.shipping_details?.address as unknown as Record<string, string | null> ?? null,
    }).catch(err => console.error('[email:admin-alert]', err));

    const orderCode = session.id.replace('paypal_', '').slice(-10).toUpperCase();
    return NextResponse.json({ ok: true, totalAmount, orderItems, email: customerEmail || '', orderCode });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[save-order]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
