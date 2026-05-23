/**
 * Cloud config — all derived from the hardcoded supabase.ts file.
 * No longer reads from localStorage; credentials are baked into the build.
 */
import { CLOUD_ENABLED, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function loadSupabaseConfig(): SupabaseConfig | null {
  if (!CLOUD_ENABLED) return null;
  return { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY };
}

export function saveSupabaseConfig(_config: SupabaseConfig): void {
  // no-op — config is hardcoded in supabase.ts
}

export function clearSupabaseConfig(): void {
  // no-op — can't clear hardcoded config at runtime
  // to disable cloud, set SUPABASE_URL = '' in supabase.ts and rebuild
}

export function isSupabaseConfigured(): boolean {
  return CLOUD_ENABLED;
}
