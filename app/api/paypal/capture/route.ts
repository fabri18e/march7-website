import { NextRequest, NextResponse } from 'next/server';
import { capturePayPalOrder } from '@/lib/paypal';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAllProducts } from '@/lib/products';

const SITE_URL = process.env.NEXT_PUBLIC_URL || 'https://www.march7.net';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const userId = searchParams.get('userId') || null;
  const email = searchParams.get('email') || '';
  const cartRaw = searchParams.get('cart') || '[]';

  if (!token) return NextResponse.redirect(`${SITE_URL}/?error=missing_token`);

  try {
    const capture = await capturePayPalOrder(token);
    if (capture.status !== 'COMPLETED') {
      return NextResponse.redirect(`${SITE_URL}/?error=payment_failed`);
    }

    // Use the actual amount PayPal captured — never trust URL param for price
    const capturedValue = capture.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value;
    const totalCents = capturedValue ? Math.round(parseFloat(capturedValue) * 100) : 0;

    // Validate cart items against server-side product catalog
    const rawCart: { id: string; name?: string; qty: number }[] = JSON.parse(decodeURIComponent(cartRaw));
    const allProducts = await getAllProducts();
    const productMap = new Map(allProducts.map(p => [p.id, p]));

    const orderItems = rawCart.map(i => {
      const baseId = i.id.split('--')[0];
      const product = productMap.get(baseId);
      const name = product?.name ?? i.name ?? baseId;
      // Server-side price lookup
      let unitPrice = product?.price ?? 0;
      if (product && i.id.includes('--')) {
        const variantSlug = i.id.split('--')[1];
        const variant = product.variants?.find(v =>
          v.color.toLowerCase().replace(/\s+/g, '-') === variantSlug
        );
        if (variant?.price) unitPrice = variant.price;
      }
      return {
        product_id: baseId,
        name,
        quantity: i.qty,
        unit_price: unitPrice,
        total: unitPrice * i.qty,
      };
    });

    const supabase = getSupabaseAdmin();
    await supabase.from('orders').insert({
      stripe_session_id: `paypal_${token}`,
      user_id: userId || null,
      email,
      total_amount: totalCents,
      status: 'paid',
      items: orderItems,
    });

    return NextResponse.redirect(`${SITE_URL}/success`);
  } catch (err) {
    console.error('[PayPal capture]', err);
    return NextResponse.redirect(`${SITE_URL}/?error=capture_failed`);
  }
}
