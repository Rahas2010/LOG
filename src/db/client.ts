import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, CLOUD_ENABLED } from './supabase';

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!CLOUD_ENABLED) return null;
  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _client;
}

// kept for compatibility — no-op when using hardcoded credentials
export function resetSupabaseClient(): void {
  _client = null;
}
