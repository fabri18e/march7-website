import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import {
  sendOrderProcessing,
  sendOrderShipped,
  sendOrderDelivered,
  sendOrderRefunded,
  sendOrderCancelled,
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
  const { orderId, ...fields } = body;

  const supabase = getSupabaseAdmin();

  // Fetch current order to get email + items
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  // Save changes
  const { error } = await supabase
    .from('orders')
    .update(fields)
    .eq('id', orderId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send lifecycle email based on new status (fire and forget)
  if (order && order.email && fields.status && fields.status !== order.status) {
    const emailData = {
      to: order.email,
      orderId: order.stripe_session_id,
      items: order.items ?? [],
      totalAmount: order.total_amount ?? 0,
    };

    const send =
      fields.status === 'processing' ? sendOrderProcessing(emailData) :
      fields.status === 'shipped' ? sendOrderShipped({
        ...emailData,
        trackingNumber: fields.tracking_number ?? order.tracking_number,
        trackingUrl: fields.tracking_url ?? order.tracking_url,
        estimatedDelivery: fields.estimated_delivery ?? order.estimated_delivery,
      }) :
      fields.status === 'delivered' ? sendOrderDelivered(emailData) :
      fields.status === 'refunded' ? sendOrderRefunded(emailData) :
      fields.status === 'cancelled' ? sendOrderCancelled(emailData) :
      null;

    if (send) {
      send.catch(err => console.error(`[email:${fields.status}]`, err));
    }
  } else if (order && !order.email && fields.status) {
    console.warn('[orders PATCH] No email on order, skipping lifecycle email', order.id);
  }

  // Also send shipped email if tracking number changed
  if (order && order.email && !fields.status && fields.tracking_number && order.status === 'shipped' && fields.tracking_number !== order.tracking_number) {
    sendOrderShipped({
      to: order.email,
      orderId: order.stripe_session_id,
      items: order.items,
      totalAmount: order.total_amount,
      trackingNumber: fields.tracking_number,
      trackingUrl: fields.tracking_url ?? order.tracking_url,
      estimatedDelivery: fields.estimated_delivery ?? order.estimated_delivery,
    }).catch(console.error);
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
