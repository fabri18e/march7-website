import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';
import { getSupabaseAdmin } from '@/lib/supabase';
import { mapProductRow } from '@/lib/products';
import type { Product } from '@/types';

export const runtime = 'nodejs';

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

function safeOfferId(base: string, colorSuffix?: string): string {
  if (colorSuffix) {
    const suffix = `--${colorSuffix}`;
    const trimmed = base.slice(0, 50 - suffix.length).replace(/-+$/, '');
    return `${trimmed}${suffix}`.slice(0, 50);
  }
  return base.slice(0, 50).replace(/-+$/, '');
}

function buildProduct(p: Product, variantColor?: string, variantPrice?: number, variantImage?: string) {
  const cleanId = p.id.replace(/-+$/, '');
  const colorSlug = variantColor?.toLowerCase().replace(/\s+/g, '-');
  const offerId = safeOfferId(cleanId, colorSlug);

  const salePrice = variantPrice ?? p.price;
  const regularPrice = p.oldPrice ?? null;
  const image = variantImage || p.image || p.images?.[0] || '';
  const description = (p.shortDesc || p.description || p.name).slice(0, 5000);

  const product: Record<string, unknown> = {
    offerId,
    title: variantColor ? `${p.name} — ${variantColor}` : p.name,
    description,
    link: `${SITE_URL}/products/${p.id}`,
    contentLanguage: 'en',
    targetCountry: 'US',
    channel: 'online',
    availability: 'in_stock',
    condition: 'new',
    brand: 'March7',
    price: { value: (regularPrice ?? salePrice).toFixed(2), currency: 'USD' },
  };

  if (image) product.imageLink = image;
  if (regularPrice) product.salePrice = { value: salePrice.toFixed(2), currency: 'USD' };
  if (variantColor) {
    product.itemGroupId = cleanId;
    product.color = variantColor;
  }
  if (p.freeShipping) {
    product.shipping = [{ country: 'US', service: 'Standard', price: { value: '0.00', currency: 'USD' } }];
  }

  return { offerId, product };
}

async function deleteFromMerchant(token: string, offerId: string) {
  const productId = `online:en:US:${offerId}`;
  const url = `https://shoppingcontent.googleapis.com/content/v2.1/${MERCHANT_ID}/products/${encodeURIComponent(productId)}`;
  await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function upsertToMerchant(token: string, product: Record<string, unknown>) {
  const url = `https://shoppingcontent.googleapis.com/content/v2.1/${MERCHANT_ID}/products`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
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

    // Build all tasks to run in parallel
    const tasks: { id: string; fn: () => Promise<unknown> }[] = [];

    for (const p of products) {
      if (p.variants && p.variants.length > 0) {
        // Delete stale no-color entry (fire-and-forget, won't block)
        const oldBaseId = p.id.replace(/-+$/, '').slice(0, 50).replace(/-+$/, '');
        tasks.push({ id: `delete:${oldBaseId}`, fn: () => deleteFromMerchant(token, oldBaseId) });

        // Default color version
        if (p.defaultColorLabel) {
          const baseImage = p.image || p.images?.[0] || p.variants?.[0]?.images?.[0] || undefined;
          const { offerId, product } = buildProduct(p, p.defaultColorLabel, p.price, baseImage);
          tasks.push({ id: offerId, fn: () => upsertToMerchant(token, product) });
        }

        // Each color variant
        for (const v of p.variants) {
          const { offerId, product } = buildProduct(p, v.color, v.price ?? p.price, v.images?.[0]);
          tasks.push({ id: offerId, fn: () => upsertToMerchant(token, product) });
        }
      } else {
        const { offerId, product } = buildProduct(p);
        tasks.push({ id: offerId, fn: () => upsertToMerchant(token, product) });
      }
    }

    // Run all tasks in parallel
    const settled = await Promise.allSettled(tasks.map(t => t.fn()));
    const results = tasks.map((t, i) => ({
      id: t.id,
      status: settled[i].status === 'fulfilled' ? 'ok' : String((settled[i] as PromiseRejectedResult).reason),
    })).filter(r => !r.id.startsWith('delete:'));

    const ok = results.filter(r => r.status === 'ok').length;
    const failed = results.filter(r => r.status !== 'ok');
    return NextResponse.json({ synced: ok, failed: failed.length, details: failed });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[sync-merchant]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
