import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import {
  sendOrderProcessing,
  sendOrderShipped,
  sendOrderDelivered,
  sendOrderRefunded,
  sendOrderCancelled,
  sendEmailCorrected,
  sendOrderReminder,
  sendAddressChanged,
} from '@/lib/email';

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { orderId, action, ...fields } = body;

  const supabase = getSupabaseAdmin();

  // Fetch current order to get email + items
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  // Reminder — no DB update needed
  if (action === 'reminder' && order) {
    try {
      await sendOrderReminder({
        to: order.email,
        orderId: order.stripe_session_id,
        items: order.items ?? [],
        totalAmount: order.total_amount ?? 0,
        status: order.status,
      });
    } catch (err) {
      console.error('[email:reminder]', err);
      return NextResponse.json({ error: 'Failed to send reminder' }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  // Save changes
  const { error } = await supabase
    .from('orders')
    .update(fields)
    .eq('id', orderId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (order && order.email) {
    const emailData = {
      to: order.email,
      orderId: order.stripe_session_id,
      items: order.items ?? [],
      totalAmount: order.total_amount ?? 0,
    };

    // Lifecycle email on status change
    if (fields.status && fields.status !== order.status) {
      try {
        if (fields.status === 'processing') await sendOrderProcessing(emailData);
        else if (fields.status === 'shipped') await sendOrderShipped({
          ...emailData,
          trackingNumber: fields.tracking_number ?? order.tracking_number,
          trackingUrl: fields.tracking_url ?? order.tracking_url,
          estimatedDelivery: fields.estimated_delivery ?? order.estimated_delivery,
        });
        else if (fields.status === 'delivered') await sendOrderDelivered(emailData);
        else if (fields.status === 'refunded') await sendOrderRefunded(emailData);
        else if (fields.status === 'cancelled') await sendOrderCancelled(emailData);
      } catch (err) {
        console.error(`[email:${fields.status}]`, err);
      }
    }

    // Shipping address changed — notify customer
    if (fields.shipping_address && order.email) {
      try {
        await sendAddressChanged({
          to: order.email,
          orderId: order.stripe_session_id,
          newAddress: fields.shipping_address,
        });
      } catch (err) {
        console.error('[email:address-changed]', err);
      }
    }

    // Email corrected by admin — notify the new address
    if (fields.email && fields.email !== order.email) {
      try {
        await sendEmailCorrected({
          to: fields.email,
          orderId: order.stripe_session_id,
          items: order.items ?? [],
          totalAmount: order.total_amount ?? 0,
          oldEmail: order.email,
        });
      } catch (err) {
        console.error('[email:corrected]', err);
      }
    }

    // Shipped email when tracking number changes
    if (!fields.status && fields.tracking_number && order.status === 'shipped' && fields.tracking_number !== order.tracking_number) {
      try {
        await sendOrderShipped({
          ...emailData,
          items: order.items,
          totalAmount: order.total_amount,
          trackingNumber: fields.tracking_number,
          trackingUrl: fields.tracking_url ?? order.tracking_url,
          estimatedDelivery: fields.estimated_delivery ?? order.estimated_delivery,
        });
      } catch (err) {
        console.error('[email:tracking-update]', err);
      }
    }
  } else if (order && !order.email && fields.status) {
    console.warn('[orders PATCH] No email on order, skipping lifecycle email', order.id);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('orders').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
