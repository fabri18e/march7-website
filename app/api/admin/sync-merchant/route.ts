import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';

export const runtime = 'nodejs';
import { getSupabaseAdmin } from '@/lib/supabase';
import { mapProductRow } from '@/lib/products';
import type { Product } from '@/types';

const MERCHANT_ID = '5805305411';
const DATA_SOURCE_ID = '10670973311';
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

function toMicros(amount: number): string {
  return String(Math.round(amount * 1_000_000));
}

function buildProductInput(p: Product, variantColor?: string, variantPrice?: number, variantImage?: string) {
  const cleanId = p.id.replace(/-+$/, '');
  const offerId = variantColor
    ? `${cleanId}--${variantColor.toLowerCase().replace(/\s+/g, '-')}`
    : cleanId;

  const salePrice = variantPrice ?? p.price;
  const regularPrice = p.oldPrice ?? null;
  const image = variantImage || p.image || p.images?.[0] || '';
  const description = (p.shortDesc || p.description || p.name).slice(0, 5000);

  const input: Record<string, unknown> = {
    name: `accounts/${MERCHANT_ID}/productInputs/${offerId}`,
    offerId,
    contentLanguage: 'en',
    feedLabel: 'US',
    title: variantColor ? `${p.name} — ${variantColor}` : p.name,
    description,
    link: `${SITE_URL}/products/${cleanId}`,
    availability: 'in_stock',
    condition: 'new',
    brand: 'March7',
    price: {
      amountMicros: toMicros(regularPrice ?? salePrice),
      currencyCode: 'USD',
    },
    ...(image ? { imageLink: image } : {}),
  };

  if (regularPrice) {
    input.salePrice = { amountMicros: toMicros(salePrice), currencyCode: 'USD' };
  }

  if (variantColor) {
    input.itemGroupId = cleanId;
    input.color = variantColor;
  }

  if (p.freeShipping) {
    input.shipping = [{ country: 'US', service: 'Standard', price: { amountMicros: '0', currencyCode: 'USD' } }];
  }

  return input;
}

async function upsertToMerchant(token: string, input: Record<string, unknown>) {
  const dataSource = `accounts/${MERCHANT_ID}/dataSources/${DATA_SOURCE_ID}`;
  const url = `https://merchantapi.googleapis.com/products/v1/accounts/${MERCHANT_ID}/productInputs:insert?dataSource=${encodeURIComponent(dataSource)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json?.error || json));
  return json;
}

export async function POST(req: NextRequest) {
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
          const input = buildProductInput(p, v.color, v.price ?? p.price, v.images?.[0]);
          try {
            await upsertToMerchant(token, input);
            results.push({ id: input.offerId, status: 'ok' });
          } catch (e) {
            results.push({ id: input.offerId, status: String(e) });
          }
        }
      } else {
        const input = buildProductInput(p);
        try {
          await upsertToMerchant(token, input);
          results.push({ id: input.offerId, status: 'ok' });
        } catch (e) {
          results.push({ id: input.offerId, status: String(e) });
        }
      }
    }

    const ok = results.filter(r => r.status === 'ok').length;
    const failed = results.filter(r => r.status !== 'ok');

    return NextResponse.json({ synced: ok, failed: failed.length, details: failed, all: results });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[sync-merchant]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
