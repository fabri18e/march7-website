import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// GET /api/reviews?productId=xxx  OR  /api/reviews?all=true (admin)
export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get('productId');
  const all = req.nextUrl.searchParams.get('all');

  const supabase = getSupabaseAdmin();

  if (all === 'true') {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, product_id, name, email, rating, text, images, verified, display_date, created_at')
      .order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ reviews: data || [] });
  }

  if (!productId) return NextResponse.json({ error: 'Missing productId' }, { status: 400 });

  const { data, error } = await supabase
    .from('reviews')
    .select('id, product_id, name, rating, text, images, verified, display_date, created_at')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reviews: data || [] });
}

// POST /api/reviews
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { productId, name, email, rating, text, images } = body;

  if (!productId || !name?.trim() || !email?.trim() || !rating || !text?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be 1–5' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Check for existing review from this email on this product
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('product_id', productId)
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'You already reviewed this product.' }, { status: 409 });
  }

  // Verify purchase: only allow reviews from customers with a delivered order
  const { data: order } = await supabase
    .from('orders')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .eq('status', 'delivered')
    .limit(1)
    .maybeSingle();

  if (!order) {
    return NextResponse.json(
      { error: 'Only customers with a delivered order can leave a review.' },
      { status: 403 }
    );
  }

  const verified = true;

  const { data: review, error: insertError } = await supabase
    .from('reviews')
    .insert({
      product_id: productId,
      email: email.toLowerCase().trim(),
      name: name.trim(),
      rating,
      text: text.trim(),
      images: images || [],
      verified,
    })
    .select('id, product_id, name, rating, text, images, verified, created_at')
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  return NextResponse.json({ review });
}

// PATCH /api/reviews — admin: update verified and/or display_date
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, verified, display_date } = body;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (typeof verified === 'boolean') update.verified = verified;
  if (display_date !== undefined) update.display_date = display_date || null;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('reviews')
    .update(update)
    .eq('id', id)
    .select('id, product_id, name, email, rating, text, images, verified, display_date, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ review: data });
}

// DELETE /api/reviews?id=xxx&email=xxx
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  const email = req.nextUrl.searchParams.get('email');
  if (!id || !email) return NextResponse.json({ error: 'Missing id or email' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', id)
    .eq('email', email.toLowerCase().trim());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
