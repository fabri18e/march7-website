import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')?.toLowerCase().trim();
  const code = req.nextUrl.searchParams.get('order')?.toUpperCase().trim().replace(/^#/, '');

  if (!email || !code) {
    return NextResponse.json({ error: 'Missing email or order number' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Fetch all orders for this email, then match the order code on the server
  const { data, error } = await supabase
    .from('orders')
    .select('id, stripe_session_id, email, total_amount, status, items, shipping_address, tracking_number, tracking_url, estimated_delivery, created_at')
    .eq('email', email)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });

  const order = (data ?? []).find(o =>
    o.stripe_session_id.replace('paypal_', '').slice(-8).toUpperCase() === code ||
    o.stripe_session_id.replace('paypal_', '').slice(-10).toUpperCase() === code
  );

  if (!order) {
    return NextResponse.json({ error: 'No order found. Check your email and order number.' }, { status: 404 });
  }

  return NextResponse.json({ order });
}
