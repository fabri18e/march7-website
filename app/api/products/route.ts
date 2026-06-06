import { NextResponse } from 'next/server';
import { fetchSupabaseProducts } from '@/lib/products';
import productsData from '@/data/products.json';
import type { Product } from '@/types';

const jsonProducts = productsData as unknown as Product[];

export async function GET() {
  const { data: supabaseProducts, error } = await fetchSupabaseProducts();

  if (error) {
    // Return JSON fallback but expose the error so it's visible in DevTools Network tab
    return NextResponse.json(
      { products: jsonProducts, _supabaseError: error },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const supabaseIds = new Set((supabaseProducts || []).map(p => p.id));
  const jsonOnly = jsonProducts.filter(p => !supabaseIds.has(p.id));
  const products = [...(supabaseProducts || []), ...jsonOnly];

  return NextResponse.json({ products }, {
    headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=30' },
  });
}
