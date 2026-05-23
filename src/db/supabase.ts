/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║          PASTE YOUR SUPABASE CREDENTIALS HERE               ║
 * ║  These are baked into the build — all devices get them      ║
 * ║  automatically without any per-device setup.                ║
 * ║                                                             ║
 * ║  1. Go to https://supabase.com → your project               ║
 * ║  2. Project Settings → API                                  ║
 * ║  3. Copy "Project URL" and "anon public" key                ║
 * ║  4. Paste below and save                                    ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

export const SUPABASE_URL = '';   // e.g. 'https://abcxyz.supabase.co'
export const SUPABASE_ANON_KEY = ''; // e.g. 'eyJhbGci...'

/**
 * True only when both credentials are provided.
 * When false, the app works fully offline (localStorage only).
 */
export const CLOUD_ENABLED = !!(SUPABASE_URL && SUPABASE_ANON_KEY);
