import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import sharp from 'sharp';

export const runtime = 'nodejs';
export const maxDuration = 60;

const ADMIN_SECRET = process.env.ADMIN_SECRET || '';
const BUCKET = 'product-images';
const SKIP_BELOW_KB = 80;

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret') || '';
  if (ADMIN_SECRET && secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const { data: files, error: listError } = await supabase.storage
    .from(BUCKET)
    .list('', { limit: 500 });

  if (listError) return NextResponse.json({ error: listError.message }, { status: 500 });

  let compressed = 0;
  let skipped = 0;
  const failed: string[] = [];

  for (const file of files || []) {
    if (!file.name || file.name === '.emptyFolderPlaceholder') continue;

    try {
      const { data: blob, error: downloadError } = await supabase.storage
        .from(BUCKET)
        .download(file.name);

      if (downloadError || !blob) { failed.push(file.name); continue; }

      const buffer = Buffer.from(await blob.arrayBuffer());

      if (buffer.length < SKIP_BELOW_KB * 1024) { skipped++; continue; }

      const result = await sharp(buffer)
        .resize(1000, 1000, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(file.name, result, { contentType: 'image/webp', upsert: true });

      if (uploadError) { failed.push(file.name); continue; }

      compressed++;
    } catch {
      failed.push(file.name);
    }
  }

  return NextResponse.json({ compressed, skipped, failed, total: (files || []).length });
}
