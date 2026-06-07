import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabase';
import { mapProductRow } from '@/lib/products';
import type { Product } from '@/types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
});

const SITE_URL = process.env.NEXT_PUBLIC_URL || 'https://www.march7.net';

async function fetchProductsForCheckout(): Promise<Map<string, Product>> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .neq('active', false);

  if (error || !data?.length) throw new Error('Could not load products. Please try again.');
  const map = new Map<string, Product>();
  for (const row of data) {
    const p = mapProductRow(row);
    map.set(p.id, p);
  }
  return map;
}

export async function POST(req: NextRequest) {
  try {
    const { items, userId, userEmail }: {
      items: { id: string; qty: number; image?: string | null }[];
      userId?: string;
      userEmail?: string;
    } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Look up authoritative prices server-side via admin client — bypasses cache
    const productMap = await fetchProductsForCheckout();

    const lineItems = items.map(item => {
      const baseId = item.id.split('--')[0];
      const product = productMap.get(baseId);
      if (!product) {
        console.error('[checkout] Unknown product:', baseId, '— available IDs:', [...productMap.keys()]);
        throw new Error(`Unknown product: ${baseId}`);
      }

      let price = product.price;
      let name = product.name;
      let image = product.image;

      if (product.isBundle && product.bundleItems?.length) {
        const bundleTotal = product.bundleItems.reduce((sum, bundleItemId) => {
          return sum + (productMap.get(bundleItemId)?.price ?? 0);
        }, 0);
        price = Math.round(bundleTotal * (1 - (product.bundleDiscount ?? 0) / 100) * 100) / 100;
        name = `🎁 ${product.name}`;
      } else if (item.id.includes('--')) {
        const variantSlug = item.id.split('--')[1];
        const variant = product.variants?.find(v =>
          v.color.toLowerCase().replace(/\s+/g, '-') === variantSlug
        );
        if (variant) {
          if (variant.price) price = variant.price;
          if (variant.images?.[0]) image = variant.images[0];
          name = `${product.name} — ${variant.color}`;
        }
      }

      const displayImage = image || item.image || null;

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name,
            ...(displayImage ? { images: [displayImage] } : {}),
          },
          unit_amount: Math.round(price * 100),
        },
        quantity: item.qty,
      };
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      success_url: `${SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/`,
      metadata: {
        user_id: userId || '',
        email: userEmail || '',
        cart: JSON.stringify(items.map(i => ({ id: i.id, qty: i.qty }))),
      },
      automatic_tax: { enabled: true },
      allow_promotion_codes: true,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'MX', 'GB', 'AU', 'DE', 'FR', 'ES', 'IT', 'BR'],
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
