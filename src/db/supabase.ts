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

export const SUPABASE_URL = 'https://wixblcishuheruxzzcbh.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpeGJsY2lzaHVoZXJ1eHp6Y2JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1MzQyOTQsImV4cCI6MjA5NTExMDI5NH0.nC3E_lqWeBPnutMMpa7iA_8jdvN9wkA73xdYzna8lTc';
export const CLOUD_ENABLED = !!(SUPABASE_URL && SUPABASE_ANON_KEY);