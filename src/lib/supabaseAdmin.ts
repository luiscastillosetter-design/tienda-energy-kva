import 'server-only';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/** Cliente Supabase con service role. Solo para código de servidor (rutas API). */
export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY no definida: usando anon key como respaldo temporal.');
  }
  client = createClient(url, serviceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '', {
    auth: { persistSession: false },
  });
  return client;
}
