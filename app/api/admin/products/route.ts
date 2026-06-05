import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = getSupabaseAdmin();

  const id = body.id || slugify(body.name);

  const { data, error } = await supabase
    .from('products')
    .insert({
      id,
      name: body.name,
      price: Number(body.price),
      old_price: body.old_price ? Number(body.old_price) : null,
      description: body.description || '',
      short_desc: body.short_desc || '',
      category: body.category || '',
      tags: body.tags || [],
      badge: body.badge || null,
      image: body.image || null,
      features: body.features || [],
      specs: body.specs || [],
      pros: body.pros || [],
      cons: body.cons || [],
      supplier_url: body.supplier_url || null,
      supplier_price: body.supplier_price ? Number(body.supplier_price) : null,
      images: body.images || [],
      free_shipping: body.free_shipping ?? false,
      active: body.active ?? true,
      sort_order: body.sort_order ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (fields.name !== undefined)           update.name = fields.name;
  if (fields.price !== undefined)          update.price = Number(fields.price);
  if (fields.old_price !== undefined)      update.old_price = fields.old_price ? Number(fields.old_price) : null;
  if (fields.description !== undefined)    update.description = fields.description;
  if (fields.short_desc !== undefined)     update.short_desc = fields.short_desc;
  if (fields.category !== undefined)       update.category = fields.category;
  if (fields.tags !== undefined)           update.tags = fields.tags;
  if (fields.badge !== undefined)          update.badge = fields.badge || null;
  if (fields.image !== undefined)          update.image = fields.image || null;
  if (fields.features !== undefined)       update.features = fields.features;
  if (fields.specs !== undefined)          update.specs = fields.specs;
  if (fields.pros !== undefined)           update.pros = fields.pros;
  if (fields.cons !== undefined)           update.cons = fields.cons;
  if (fields.supplier_url !== undefined)   update.supplier_url = fields.supplier_url || null;
  if (fields.supplier_price !== undefined) update.supplier_price = fields.supplier_price ? Number(fields.supplier_price) : null;
  if (fields.images !== undefined)         update.images = fields.images;
  if (fields.free_shipping !== undefined)  update.free_shipping = Boolean(fields.free_shipping);
  if (fields.active !== undefined)         update.active = fields.active;
  if (fields.sort_order !== undefined)     update.sort_order = fields.sort_order;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('products').update(update).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
