import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const email = searchParams.get('email');
  const productId = searchParams.get('productId');

  const supabase = getSupabaseAdmin();

  // Email-based check (guest): requires a delivered order
  if (email) {
    const { data } = await supabase
      .from('orders')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .eq('status', 'delivered')
      .limit(1)
      .maybeSingle();
    return NextResponse.json({ purchased: !!data });
  }

  if (!userId || !productId) {
    return NextResponse.json({ purchased: false });
  }

  const { data } = await supabase
    .from('orders')
    .select('items')
    .eq('user_id', userId)
    .not('status', 'in', '("refunded","cancelled")');

  const purchased = data?.some((order: { items?: { product_id?: string }[] }) =>
    order.items?.some(item => item.product_id === productId)
  ) ?? false;

  return NextResponse.json({ purchased });
}
