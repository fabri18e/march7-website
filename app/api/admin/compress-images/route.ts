import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import sharp from 'sharp';

export const runtime = 'nodejs';

const ADMIN_SECRET = process.env.ADMIN_SECRET || '';
const BUCKET = 'product-images';
const SKIP_BELOW_KB = 80;

// GET: list all files in bucket
export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret') || '';
  if (ADMIN_SECRET && secret !== ADMIN_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { data: files, error } = await supabase.storage.from(BUCKET).list('', { limit: 500 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const names = (files || [])
    .map(f => f.name)
    .filter(n => n && n !== '.emptyFolderPlaceholder');

  return NextResponse.json({ files: names });
}

// POST: compress a single file by name
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret') || '';
  if (ADMIN_SECRET && secret !== ADMIN_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { filename } = await req.json();
  if (!filename) return NextResponse.json({ error: 'Missing filename' }, { status: 400 });

  const supabase = getSupabaseAdmin();

  const { data: blob, error: downloadError } = await supabase.storage.from(BUCKET).download(filename);
  if (downloadError || !blob) return NextResponse.json({ status: 'failed', reason: downloadError?.message });

  const buffer = Buffer.from(await blob.arrayBuffer());

  if (buffer.length < SKIP_BELOW_KB * 1024)
    return NextResponse.json({ status: 'skipped' });

  const result = await sharp(buffer)
    .resize(1000, 1000, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filename, result, { contentType: 'image/webp', upsert: true });

  if (uploadError) return NextResponse.json({ status: 'failed', reason: uploadError.message });

  return NextResponse.json({ status: 'ok' });
}
