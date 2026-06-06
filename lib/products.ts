import { createClient } from '@supabase/supabase-js';
import productsData from '@/data/products.json';
import type { Product, ProductVariant } from '@/types';

const jsonProducts = productsData as unknown as Product[];

function mapRow(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    name: row.name as string,
    price: Number(row.price),
    oldPrice: row.old_price ? Number(row.old_price) : null,
    description: (row.description as string) || '',
    shortDesc: (row.short_desc as string) || '',
    category: (row.category as string) || '',
    tags: (row.tags as string[]) || [],
    badge: (row.badge as string) || null,
    image: (row.image as string) || null,
    features: (row.features as string[]) || [],
    specs: (row.specs as [string, string][]) || [],
    pros: (row.pros as string[]) || [],
    cons: (row.cons as string[]) || [],
    supplierUrl: (row.supplier_url as string) || null,
    supplierPrice: row.supplier_price ? Number(row.supplier_price) : null,
    images: (row.images as string[] | null) || [],
    freeShipping: Boolean(row.free_shipping),
    defaultColorLabel: (row.default_color_label as string) || null,
    defaultColorHex: (row.default_color_hex as string) || null,
    variants: (row.variants as ProductVariant[] | null) || [],
    isBundle: Boolean(row.is_bundle),
    bundleItems: (row.bundle_items as string[] | null) || [],
    bundleDiscount: row.bundle_discount ? Number(row.bundle_discount) : 0,
    reviews: (row.reviews as import('@/types').StaticReview[] | null) || [],
  };
}

export async function getAllProducts(): Promise<Product[]> {
  const result = await fetchSupabaseProducts();
  if (result.error) console.error('[products] Supabase error:', result.error);
  const supabaseProducts = result.data || [];
  const supabaseIds = new Set(supabaseProducts.map(p => p.id));
  const jsonOnly = jsonProducts.filter(p => !supabaseIds.has(p.id));
  return [...supabaseProducts, ...jsonOnly];
}

export async function fetchSupabaseProducts(): Promise<{ data: Product[] | null; error: string | null }> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { fetch: (url, opts) => fetch(url as RequestInfo, { ...(opts as RequestInit), next: { revalidate: 60 } } as RequestInit) } },
    );

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) return { data: null, error: error.message };
    return { data: (data || []).map(mapRow), error: null };
  } catch (e) {
    return { data: null, error: String(e) };
  }
}
