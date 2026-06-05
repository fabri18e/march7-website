import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client (singleton)
let client: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!client) client = createClient(url, anonKey);
  return client;
}

// Server/webhook client with service role (bypasses RLS)
export function getSupabaseAdmin() {
  return createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
