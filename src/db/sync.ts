import { getSupabaseClient } from './client';
import type { AppState } from '../types';
import type { UserRole } from '../AuthContext';

export interface UserData {
  user_key: string;
  state: AppState;
  updated_at: string;
}

export interface CloudUser {
  user_key: string;
  display: string;
  role: UserRole;
  password: string;
  updated_at?: string;
}

/** Fetch user data from cloud. */
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
      if (error.code === 'PGRST116') return null;
      console.error('Fetch error:', error);
      return null;
    }
    return data?.state || null;
  } catch (err) {
    console.error('Fetch exception:', err);
    return null;
  }
}

/** Save user state to cloud. */
export async function saveUserData(userKey: string, state: AppState): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('user_data')
      .upsert(
        {
          user_key: userKey,
          state,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_key' }
      );

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

/** Fetch all cloud users for cross-device login. */
export async function fetchCloudUsers(): Promise<Record<string, { password: string; role: UserRole; display: string }> | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('app_users')
      .select('user_key, display, role, password');

    if (error) {
      console.error('Fetch users error:', error);
      return null;
    }

    const map: Record<string, { password: string; role: UserRole; display: string }> = {};
    for (const row of (data || []) as CloudUser[]) {
      map[row.user_key] = {
        password: row.password,
        role: row.role,
        display: row.display,
      };
    }
    return map;
  } catch (err) {
    console.error('Fetch users exception:', err);
    return null;
  }
}

/** Update one user's password in cloud. */
export async function saveCloudPassword(userKey: string, newPassword: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('app_users')
      .update({ password: newPassword, updated_at: new Date().toISOString() })
      .eq('user_key', userKey);

    if (error) {
      console.error('Save cloud password error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Save cloud password exception:', err);
    return false;
  }
}

/** Check cloud connection by ensuring both required tables exist. */
export async function testConnection(): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, error: 'Client not initialized' };

  try {
    const userDataCheck = await client.from('user_data').select('user_key').limit(1);
    if (userDataCheck.error) return { ok: false, error: `user_data: ${userDataCheck.error.message}` };

    const appUsersCheck = await client.from('app_users').select('user_key').limit(1);
    if (appUsersCheck.error) return { ok: false, error: `app_users: ${appUsersCheck.error.message}` };

    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
