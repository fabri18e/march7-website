import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { mapProductRow, getAllProductVariants } from '@/lib/products';
import type { Product } from '@/types';

const SITE_URL = 'https://www.march7.net';
const BRAND = 'March7';

// Google product category IDs for tech accessories
const CATEGORY_MAP: Record<string, string> = {
  Audio: 'Electronics > Audio > Audio Components > Headphones & Headsets',
  Peripherals: 'Electronics > Electronics Accessories > Computer Accessories > Input Devices',
  Accessories: 'Electronics > Electronics Accessories',
  Gaming: 'Electronics > Video Games & Consoles > Video Game Accessories',
};

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function productToItems(p: Product): string {
  const baseUrl = `${SITE_URL}/products/${p.id.replace(/-+$/, '')}`;
  const category = CATEGORY_MAP[p.category] || 'Electronics > Electronics Accessories';
  const description = escapeXml((p.shortDesc || p.description || p.name).slice(0, 5000));

  // Products with variants generate one entry per color (including default)
  if (p.variants && p.variants.length > 0) {
    const cleanId = p.id.replace(/-+$/, '');
    const allVariants = getAllProductVariants(p);

    return allVariants.map(v => {
      const colorSlug = v.color.toLowerCase().replace(/\s+/g, '-');
      const image = v.images?.[0] || p.image || p.images?.[0] || '';
      const price = v.price.toFixed(2);
      const regularPrice = v.oldPrice ?? null;
      const variantId = `${cleanId}--${colorSlug}`;
      const link = v.isDefault ? baseUrl : `${baseUrl}?color=${encodeURIComponent(colorSlug)}`;

      return `
  <item>
    <g:id>${escapeXml(variantId)}</g:id>
    <g:title>${escapeXml(`${p.name} — ${v.color}`)}</g:title>
    <g:description>${description}</g:description>
    <g:link>${link}</g:link>
    ${image ? `<g:image_link>${escapeXml(image)}</g:image_link>` : ''}
    <g:availability>in stock</g:availability>
    <g:price>${regularPrice ? regularPrice.toFixed(2) : price} USD</g:price>
    ${regularPrice ? `<g:sale_price>${price} USD</g:sale_price>` : ''}
    <g:brand>${BRAND}</g:brand>
    <g:condition>new</g:condition>
    <g:google_product_category>${escapeXml(category)}</g:google_product_category>
    <g:item_group_id>${escapeXml(cleanId)}</g:item_group_id>
    <g:color>${escapeXml(v.color)}</g:color>
    ${p.freeShipping ? `<g:shipping><g:country>US</g:country><g:service>Standard</g:service><g:price>0 USD</g:price></g:shipping>` : ''}
  </item>`;
    }).join('');
  }

  // Single product (no variants)
  const image = p.image || p.images?.[0] || '';
  const price = p.price.toFixed(2);
  const oldPrice = p.oldPrice ?? null;

  return `
  <item>
    <g:id>${escapeXml(p.id.replace(/-+$/, ''))}</g:id>
    <g:title>${escapeXml(p.name)}</g:title>
    <g:description>${description}</g:description>
    <g:link>${baseUrl}</g:link>
    ${image ? `<g:image_link>${escapeXml(image)}</g:image_link>` : ''}
    <g:availability>in stock</g:availability>
    <g:price>${oldPrice ? oldPrice.toFixed(2) : price} USD</g:price>
    ${oldPrice ? `<g:sale_price>${price} USD</g:sale_price>` : ''}
    <g:brand>${BRAND}</g:brand>
    <g:condition>new</g:condition>
    <g:google_product_category>${escapeXml(category)}</g:google_product_category>
    ${p.freeShipping ? `<g:shipping><g:country>US</g:country><g:service>Standard</g:service><g:price>0 USD</g:price></g:shipping>` : ''}
  </item>`;
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .neq('active', false)
      .neq('is_bundle', true)
      .order('sort_order', { ascending: true });

    if (error) throw new Error(error.message);

    const products: Product[] = (data || []).map(mapProductRow);

    const itemsXml = products.map(productToItems).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>March7 Products</title>
    <link>${SITE_URL}</link>
    <description>Factory-direct tech accessories — March7 product catalog</description>
    ${itemsXml}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
