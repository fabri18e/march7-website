import { NextRequest, NextResponse } from 'next/server';
import { sendCustomEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  const { to, subject, message } = await req.json();

  if (!to || !subject || !message) {
    return NextResponse.json({ error: 'Missing to, subject or message' }, { status: 400 });
  }

  try {
    await sendCustomEmail({ to, subject, message });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to send';
    console.error('[send-email]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
