import { getSupabaseClient } from './client';
import type { AppState } from '../types';

export interface UserData {
  user_key: string;
  state: AppState;
  updated_at: string;
}

/**
 * Fetch user data from cloud. Returns null if user not found or on error.
 */
export async function fetchUserData(userKey: string): Promise<AppState | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('user_data')
      .select('state, updated_at')
      .eq('user_key', userKey)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found — new user
        return null;
      }
      console.error('Fetch error:', error);
      return null;
    }

    return data?.state || null;
  } catch (err) {
    console.error('Fetch exception:', err);
    return null;
  }
}

/**
 * Save user state to cloud. Returns true on success.
 */
export async function saveUserData(userKey: string, state: AppState): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('user_data')
      .upsert({
        user_key: userKey,
        state,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_key',
      });

    if (error) {
      console.error('Save error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Save exception:', err);
    return false;
  }
}

/**
 * Check cloud connection by trying a simple query.
 */
export async function testConnection(): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, error: 'Client not initialized' };

  try {
    const { error } = await client
      .from('user_data')
      .select('user_key')
      .limit(1);

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
