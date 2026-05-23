export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

const CONFIG_KEY = 'screentime_supabase_config';

export function loadSupabaseConfig(): SupabaseConfig | null {
  try {
    const saved = localStorage.getItem(CONFIG_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return null;
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch {}
}

export function clearSupabaseConfig(): void {
  try {
    localStorage.removeItem(CONFIG_KEY);
  } catch {}
}

export function isSupabaseConfigured(): boolean {
  const config = loadSupabaseConfig();
  return !!(config && config.url && config.anonKey);
}
