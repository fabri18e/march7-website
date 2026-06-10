import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import sharp from 'sharp';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const maxSize = 20 * 1024 * 1024; // 20MB before compression
  if (file.size > maxSize) return NextResponse.json({ error: 'File too large (max 20MB)' }, { status: 400 });

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.type)) return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());

  // Resize to max 1200px and convert to WebP at 85% quality
  const compressed = await sharp(buffer)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, compressed, { contentType: 'image/webp', upsert: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
