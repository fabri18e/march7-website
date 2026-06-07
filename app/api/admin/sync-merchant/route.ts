import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';
import { getSupabaseAdmin } from '@/lib/supabase';
import { mapProductRow } from '@/lib/products';
import type { Product } from '@/types';

const MERCHANT_ID = '5805305411';
const SITE_URL = 'https://www.march7.net';
const ADMIN_SECRET = process.env.ADMIN_SECRET || '';

async function getAuthToken(): Promise<string> {
  const keyRaw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyRaw) throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_KEY env variable');

  const credentials = JSON.parse(keyRaw);
  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/content'],
  });
  const client = await auth.getClient();
  const tokenRes = await client.getAccessToken();
  if (!tokenRes.token) throw new Error('Could not get Google auth token');
  return tokenRes.token;
}

function buildProductPayload(p: Product, variantColor?: string, variantPrice?: number, variantImage?: string) {
  const cleanId = p.id.replace(/-+$/, '');
  const offerId = variantColor
    ? `${cleanId}--${variantColor.toLowerCase().replace(/\s+/g, '-')}`
    : cleanId;

  const title = variantColor ? `${p.name} — ${variantColor}` : p.name;
  const price = variantPrice ?? p.price;
  const image = variantImage || p.image || p.images?.[0] || '';
  const link = `${SITE_URL}/products/${cleanId}`;
  const description = (p.shortDesc || p.description || p.name).slice(0, 5000);

  const payload: Record<string, unknown> = {
    offerId,
    title,
    description,
    link,
    availability: 'in_stock',
    condition: 'new',
    brand: 'March7',
    contentLanguage: 'en',
    targetCountry: 'US',
    channel: 'online',
    price: { value: price.toFixed(2), currency: 'USD' },
    ...(image ? { imageLink: image } : {}),
  };

  if (p.oldPrice) {
    payload.salePrice = { value: price.toFixed(2), currency: 'USD' };
    payload.price = { value: p.oldPrice.toFixed(2), currency: 'USD' };
  }

  if (variantColor) {
    payload.itemGroupId = cleanId;
    payload.color = variantColor;
  }

  if (p.freeShipping) {
    payload.shipping = [{ country: 'US', service: 'Standard', price: { value: '0.00', currency: 'USD' } }];
  }

  return payload;
}

async function upsertToMerchant(token: string, payload: Record<string, unknown>) {
  const url = `https://shoppingcontent.googleapis.com/content/v2.1/${MERCHANT_ID}/products`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json?.error || json));
  return json;
}

export async function POST(req: NextRequest) {
  // Protect endpoint with admin secret
  const secret = req.headers.get('x-admin-secret') || '';
  if (ADMIN_SECRET && secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const token = await getAuthToken();

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .neq('active', false)
      .neq('is_bundle', true);

    if (error) throw new Error(error.message);

    const products: Product[] = (data || []).map(mapProductRow);

    const results: { id: string; status: string }[] = [];

    for (const p of products) {
      if (p.variants && p.variants.length > 0) {
        for (const v of p.variants) {
          const payload = buildProductPayload(p, v.color, v.price ?? p.price, v.images?.[0]);
          try {
            await upsertToMerchant(token, payload);
            results.push({ id: payload.offerId as string, status: 'ok' });
          } catch (e) {
            results.push({ id: payload.offerId as string, status: String(e) });
          }
        }
      } else {
        const payload = buildProductPayload(p);
        try {
          await upsertToMerchant(token, payload);
          results.push({ id: payload.offerId as string, status: 'ok' });
        } catch (e) {
          results.push({ id: payload.offerId as string, status: String(e) });
        }
      }
    }

    const ok = results.filter(r => r.status === 'ok').length;
    const failed = results.filter(r => r.status !== 'ok');

    return NextResponse.json({ synced: ok, failed: failed.length, details: failed });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[sync-merchant]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
