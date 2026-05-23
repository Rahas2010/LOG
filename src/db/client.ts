import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { loadSupabaseConfig } from './config';

let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = loadSupabaseConfig();
  if (!config || !config.url || !config.anonKey) {
    return null;
  }

  if (!clientInstance) {
    clientInstance = createClient(config.url, config.anonKey);
  }

  return clientInstance;
}

export function resetSupabaseClient(): void {
  clientInstance = null;
}
