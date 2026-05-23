import { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, CheckCircle2, XCircle, Loader2, Copy, ExternalLink, Shield, CloudOff } from 'lucide-react';
import { saveSupabaseConfig } from '../db/config';
import { resetSupabaseClient } from '../db/client';
import { testConnection } from '../db/sync';
import { useTheme } from '../ThemeContext';

interface DbSetupScreenProps {
  onComplete: () => void;
  onSkip: () => void;
}

const SCHEMA_SQL = `-- Run this in your Supabase SQL Editor:

-- 1) Per-user app state
CREATE TABLE IF NOT EXISTS user_data (
  user_key TEXT PRIMARY KEY,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2) Cross-device login accounts
CREATE TABLE IF NOT EXISTS app_users (
  user_key TEXT PRIMARY KEY,
  display TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  password TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for this app demo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_data' AND policyname = 'Allow all access user_data'
  ) THEN
    CREATE POLICY "Allow all access user_data"
      ON user_data FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'app_users' AND policyname = 'Allow all access app_users'
  ) THEN
    CREATE POLICY "Allow all access app_users"
      ON app_users FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Seed default users (won't overwrite if they already exist)
INSERT INTO app_users (user_key, display, role, password)
VALUES
  ('admin', 'Admin', 'admin', '4520101818119'),
  ('rahas', 'Rahas', 'user', 'Rahas@2010')
ON CONFLICT (user_key) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_user_data_updated ON user_data(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_users_updated ON app_users(updated_at DESC);`;

export default function DbSetupScreen({ onComplete, onSkip }: DbSetupScreenProps) {
  const { theme } = useTheme();
  const isGlass = theme === 'glass';

  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const handleCopySchema = async () => {
    try {
      await navigator.clipboard.writeText(SCHEMA_SQL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleTest = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setTestResult({ ok: false, error: 'Please enter both URL and key' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    saveSupabaseConfig({ url: url.trim(), anonKey: anonKey.trim() });
    resetSupabaseClient();
    const result = await testConnection();
    setTestResult(result);
    setTesting(false);
  };

  const handleSave = async () => {
    if (!testResult?.ok) return;
    setSaving(true);
    saveSupabaseConfig({ url: url.trim(), anonKey: anonKey.trim() });
    resetSupabaseClient();
    setTimeout(() => {
      setSaving(false);
      onComplete();
    }, 600);
  };

  if (!isGlass) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-2xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#0f0f0f] rounded-xl flex items-center justify-center">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#0f0f0f]">Cloud + Login Setup</h1>
                <p className="text-sm text-[#666]">Sync account data and login across devices</p>
              </div>
            </div>
            <button onClick={onSkip} className="text-sm text-[#666] hover:text-[#0f0f0f] transition-colors flex items-center gap-1.5">
              <CloudOff className="w-4 h-4" /> Skip
            </button>
          </div>

          <div className="border border-[#e5e5e5] rounded-xl p-6 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-[#0f0f0f] text-white flex items-center justify-center text-xs font-bold">1</div>
              <h2 className="font-semibold text-[#0f0f0f]">Create a free Supabase project</h2>
            </div>
            <p className="text-sm text-[#666] mb-3">
              Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">supabase.com <ExternalLink className="w-3 h-3" /></a>
              {' '}and create a project.
            </p>
          </div>

          <div className="border border-[#e5e5e5] rounded-xl p-6 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-[#0f0f0f] text-white flex items-center justify-center text-xs font-bold">2</div>
              <h2 className="font-semibold text-[#0f0f0f]">Run this SQL in Supabase</h2>
            </div>
            <p className="text-sm text-[#666] mb-3">This creates cloud state + cloud login accounts:</p>
            <div className="relative">
              <pre className="bg-[#fafafa] border border-[#e5e5e5] rounded-lg p-4 text-xs text-[#333] overflow-x-auto font-mono">{SCHEMA_SQL}</pre>
              <button onClick={handleCopySchema} className="absolute top-2 right-2 px-2.5 py-1 bg-[#0f0f0f] text-white rounded text-xs font-medium hover:bg-[#333] transition-colors flex items-center gap-1">
                {copied ? <><CheckCircle2 className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
              </button>
            </div>
          </div>

          <div className="border border-[#e5e5e5] rounded-xl p-6 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-[#0f0f0f] text-white flex items-center justify-center text-xs font-bold">3</div>
              <h2 className="font-semibold text-[#0f0f0f]">Enter your credentials</h2>
            </div>
            <p className="text-sm text-[#666] mb-4">Copy <strong>Project URL</strong> and <strong>anon public key</strong> from Project Settings → API.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#0f0f0f] mb-1.5">Project URL</label>
                <input type="text" value={url} onChange={e => { setUrl(e.target.value); setTestResult(null); }} placeholder="https://xxxxxxxx.supabase.co" className="w-full px-3 py-2.5 border border-[#e5e5e5] rounded-lg bg-[#fafafa] text-sm font-mono focus:outline-none focus:border-[#0f0f0f] focus:bg-white focus:shadow-[0_0_0_3px_rgba(15,15,15,0.05)]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0f0f0f] mb-1.5">Anon Public Key</label>
                <input type="password" value={anonKey} onChange={e => { setAnonKey(e.target.value); setTestResult(null); }} placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." className="w-full px-3 py-2.5 border border-[#e5e5e5] rounded-lg bg-[#fafafa] text-sm font-mono focus:outline-none focus:border-[#0f0f0f] focus:bg-white focus:shadow-[0_0_0_3px_rgba(15,15,15,0.05)]" />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button onClick={handleTest} disabled={testing} className="flex-1 py-2.5 rounded-lg border border-[#e5e5e5] bg-white text-[#0f0f0f] font-semibold text-sm hover:bg-[#f5f5f5] disabled:opacity-60 flex items-center justify-center gap-2">
                  {testing ? <><Loader2 className="w-4 h-4 animate-spin" /> Testing...</> : 'Test Connection'}
                </button>
                <button onClick={handleSave} disabled={!testResult?.ok || saving} className="flex-1 py-2.5 rounded-lg bg-[#0f0f0f] text-white font-semibold text-sm hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><CheckCircle2 className="w-4 h-4" /> Save & Continue</>}
                </button>
              </div>
              {testResult && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className={`text-sm font-medium rounded-lg px-3 py-2.5 flex items-center gap-2 ${testResult.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-[#fee2e2] text-[#991b1b] border border-[#ef4444]/30'}`}>
                  {testResult.ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  {testResult.ok ? 'Connection successful!' : `Failed: ${testResult.error}`}
                </motion.div>
              )}
            </div>
          </div>

          <div className="text-center text-xs text-[#999]">
            Default cloud users: <strong>admin</strong> and <strong>rahas</strong>. Their passwords sync across devices too.
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-mesh flex items-center justify-center p-4 relative">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl" />
      </div>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative w-full max-w-2xl">
        <div className="glass-card p-6 md:p-8 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }} className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Database className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Cloud + Login Setup</h1>
                <p className="text-sm text-gray-400 font-medium">Sync account data and login across devices</p>
              </div>
            </div>
            <button onClick={onSkip} className="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100">
              <CloudOff className="w-4 h-4" /> Skip
            </button>
          </div>

          <div className="bg-white/50 rounded-2xl p-5 mb-3 border border-gray-200/50">
            <div className="flex items-center gap-2 mb-2"><div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-900 to-gray-700 text-white flex items-center justify-center text-xs font-bold shadow-md">1</div><h2 className="font-bold text-gray-900">Create a free Supabase project</h2></div>
            <p className="text-sm text-gray-500 mb-2 ml-8">Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">supabase.com <ExternalLink className="w-3 h-3" /></a> and create a project.</p>
          </div>

          <div className="bg-white/50 rounded-2xl p-5 mb-3 border border-gray-200/50">
            <div className="flex items-center gap-2 mb-2"><div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-900 to-gray-700 text-white flex items-center justify-center text-xs font-bold shadow-md">2</div><h2 className="font-bold text-gray-900">Run this SQL</h2></div>
            <p className="text-sm text-gray-500 mb-3 ml-8">This creates cloud state and cross-device login accounts:</p>
            <div className="relative ml-8">
              <pre className="bg-gray-900 rounded-xl p-4 text-xs text-gray-100 overflow-x-auto font-mono leading-relaxed">{SCHEMA_SQL}</pre>
              <button onClick={handleCopySchema} className="absolute top-2 right-2 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1 backdrop-blur-sm">
                {copied ? <><CheckCircle2 className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
              </button>
            </div>
          </div>

          <div className="bg-white/50 rounded-2xl p-5 border border-gray-200/50">
            <div className="flex items-center gap-2 mb-3"><div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-900 to-gray-700 text-white flex items-center justify-center text-xs font-bold shadow-md">3</div><h2 className="font-bold text-gray-900">Your credentials</h2></div>
            <p className="text-sm text-gray-500 mb-4 ml-8">From <strong className="text-gray-700">Settings → API</strong>:</p>
            <div className="space-y-3 ml-8">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Project URL</label>
                <input type="text" value={url} onChange={e => { setUrl(e.target.value); setTestResult(null); }} placeholder="https://xxxxxxxx.supabase.co" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200/80 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder:text-gray-300" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Anon Public Key</label>
                <input type="password" value={anonKey} onChange={e => { setAnonKey(e.target.value); setTestResult(null); }} placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200/80 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder:text-gray-300" />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleTest} disabled={testing} className="py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 disabled:opacity-60 flex items-center justify-center gap-2">{testing ? <><Loader2 className="w-4 h-4 animate-spin" /> Testing</> : 'Test'}</motion.button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={!testResult?.ok || saving} className="py-3 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-gray-900/15">{saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving</> : <><CheckCircle2 className="w-4 h-4" /> Continue</>}</motion.button>
              </div>
              {testResult && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className={`text-sm font-medium rounded-xl px-4 py-3 flex items-center gap-2 ${testResult.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                  {testResult.ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  {testResult.ok ? 'Connected successfully!' : `Failed: ${testResult.error}`}
                </motion.div>
              )}
            </div>
          </div>

          <p className="text-center text-[10px] text-gray-400 font-medium mt-5"><Shield className="w-3 h-3 inline mr-1" />Default cloud users are seeded: admin and rahas</p>
        </div>
      </motion.div>
    </div>
  );
}
