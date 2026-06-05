import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import {
  sendOrderProcessing,
  sendOrderShipped,
  sendOrderDelivered,
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
  if (order && fields.status && fields.status !== order.status) {
    const emailData = {
      to: order.email,
      orderId: order.stripe_session_id,
      items: order.items,
      totalAmount: order.total_amount,
    };

    if (fields.status === 'processing') {
      sendOrderProcessing(emailData).catch(console.error);
    } else if (fields.status === 'shipped') {
      sendOrderShipped({
        ...emailData,
        trackingNumber: fields.tracking_number ?? order.tracking_number,
        trackingUrl: fields.tracking_url ?? order.tracking_url,
        estimatedDelivery: fields.estimated_delivery ?? order.estimated_delivery,
      }).catch(console.error);
    } else if (fields.status === 'delivered') {
      sendOrderDelivered(emailData).catch(console.error);
    }
  }

  // Also send shipped email if tracking info is added without status change
  if (order && !fields.status && fields.tracking_number && order.status === 'shipped') {
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
