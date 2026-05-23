import { motion } from 'framer-motion';
import { Database, Copy, ExternalLink, Shield, Code2, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../ThemeContext';

interface DbSetupScreenProps {
  onSkip: () => void;
  onComplete: () => void;
}

const SCHEMA_SQL = `-- Run this once in Supabase SQL Editor:

CREATE TABLE IF NOT EXISTS user_data (
  user_key TEXT PRIMARY KEY,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_users (
  user_key TEXT PRIMARY KEY,
  display TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  password TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_data' AND policyname='open_user_data') THEN
    CREATE POLICY "open_user_data" ON user_data FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='app_users' AND policyname='open_app_users') THEN
    CREATE POLICY "open_app_users" ON app_users FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

INSERT INTO app_users (user_key, display, role, password) VALUES
  ('admin', 'Admin', 'admin', '4520101818119'),
  ('rahas',  'Rahas',  'user',  'Rahas@2010')
ON CONFLICT (user_key) DO NOTHING;`;

const FILE_TEMPLATE = (url: string, key: string) =>
`export const SUPABASE_URL = '${url}';
export const SUPABASE_ANON_KEY = '${key}';
export const CLOUD_ENABLED = !!(SUPABASE_URL && SUPABASE_ANON_KEY);`;

export default function DbSetupScreen({ onSkip, onComplete }: DbSetupScreenProps) {
  const { theme } = useTheme();
  const isGlass = theme === 'glass';

  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedFile, setCopiedFile] = useState(false);

  const copyText = async (text: string, which: 'sql' | 'file') => {
    try {
      await navigator.clipboard.writeText(text);
      if (which === 'sql') { setCopiedSql(true); setTimeout(() => setCopiedSql(false), 2000); }
      else { setCopiedFile(true); setTimeout(() => setCopiedFile(false), 2000); }
    } catch {}
  };

  const fileContent = FILE_TEMPLATE(url.trim(), key.trim());
  const canCopyFile = !!(url.trim() && key.trim());

  const card = isGlass ? 'bg-white/50 rounded-2xl p-5 border border-gray-200/50 mb-3' : 'border border-[#e5e5e5] rounded-xl p-6 mb-4';
  const stepBubble = isGlass
    ? 'w-6 h-6 rounded-full bg-gradient-to-br from-gray-900 to-gray-700 text-white flex items-center justify-center text-xs font-bold shadow-md'
    : 'w-6 h-6 rounded-full bg-[#0f0f0f] text-white flex items-center justify-center text-xs font-bold';
  const title = isGlass ? 'font-bold text-gray-900' : 'font-semibold text-[#0f0f0f]';
  const sub = isGlass ? 'text-sm text-gray-500' : 'text-sm text-[#666]';
  const inp = isGlass
    ? 'w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200/80 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder:text-gray-300'
    : 'w-full px-3 py-2.5 border border-[#e5e5e5] rounded-lg bg-[#fafafa] text-sm font-mono focus:outline-none focus:border-[#0f0f0f] focus:bg-white focus:shadow-[0_0_0_3px_rgba(15,15,15,0.05)]';
  const btnCopy = isGlass
    ? 'px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1 backdrop-blur-sm'
    : 'px-2.5 py-1 bg-[#0f0f0f] text-white rounded text-xs font-medium hover:bg-[#333] transition-colors flex items-center gap-1';
  const btnPrimary = isGlass
    ? 'py-3 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 flex items-center justify-center gap-2 shadow-lg shadow-gray-900/15'
    : 'py-2.5 rounded-lg bg-[#0f0f0f] text-white font-semibold text-sm hover:bg-[#333] flex items-center justify-center gap-2';
  const btnSecondary = isGlass
    ? 'py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 flex items-center justify-center gap-2'
    : 'py-2.5 rounded-lg border border-[#e5e5e5] bg-white text-[#0f0f0f] font-semibold text-sm hover:bg-[#f5f5f5] flex items-center justify-center gap-2';

  const body = (
    <>
      {/* Step 1 */}
      <div className={card}>
        <div className="flex items-center gap-2 mb-2">
          <div className={stepBubble}>1</div>
          <h2 className={title}>Create a free Supabase project</h2>
        </div>
        <p className={`${sub} ml-8`}>
          Go to{' '}
          <a href="https://supabase.com" target="_blank" rel="noopener noreferrer"
            className="text-blue-500 hover:underline inline-flex items-center gap-1">
            supabase.com <ExternalLink className="w-3 h-3" />
          </a>{' '}
          → sign up → New Project. Wait ~2 min for it to be ready.
        </p>
      </div>

      {/* Step 2 */}
      <div className={card}>
        <div className="flex items-center gap-2 mb-2">
          <div className={stepBubble}>2</div>
          <h2 className={title}>Run this SQL in Supabase SQL Editor</h2>
        </div>
        <p className={`${sub} mb-3 ml-8`}>Creates both tables and seeds the default accounts:</p>
        <div className="relative ml-8">
          <pre className={`rounded-xl p-4 text-xs overflow-x-auto font-mono leading-relaxed ${isGlass ? 'bg-gray-900 text-gray-100' : 'bg-[#0f0f0f] text-gray-200'}`}>
            {SCHEMA_SQL}
          </pre>
          <button onClick={() => copyText(SCHEMA_SQL, 'sql')} className={`absolute top-2 right-2 ${btnCopy}`}>
            {copiedSql ? <><CheckCircle2 className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
          </button>
        </div>
      </div>

      {/* Step 3 */}
      <div className={card}>
        <div className="flex items-center gap-2 mb-3">
          <div className={stepBubble}>3</div>
          <h2 className={title}>Get your API keys</h2>
        </div>
        <p className={`${sub} mb-4 ml-8`}>
          In Supabase → <strong>Project Settings → API</strong>.
          Copy <em>Project URL</em> and <em>anon public key</em> and paste below:
        </p>
        <div className="ml-8 space-y-3">
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isGlass ? 'text-gray-500' : 'text-[#666]'}`}>Project URL</label>
            <input type="text" value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://xxxxxxxx.supabase.co" className={inp} />
          </div>
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isGlass ? 'text-gray-500' : 'text-[#666]'}`}>Anon Public Key</label>
            <input type="password" value={key} onChange={e => setKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." className={inp} />
          </div>
        </div>
      </div>

      {/* Step 4 */}
      <div className={card}>
        <div className="flex items-center gap-2 mb-2">
          <div className={stepBubble}>4</div>
          <h2 className={title}>Paste into the source file and rebuild</h2>
        </div>
        <p className={`${sub} mb-3 ml-8`}>
          Open <code className={`px-1 py-0.5 rounded text-[11px] ${isGlass ? 'bg-gray-100 text-gray-700' : 'bg-[#f5f5f5] text-[#0f0f0f]'}`}>src/db/supabase.ts</code>{' '}
          and replace it with this content (copy button below), then rebuild:
        </p>
        <div className="relative ml-8">
          <pre className={`rounded-xl p-4 text-xs overflow-x-auto font-mono leading-relaxed ${isGlass ? 'bg-gray-900 text-gray-100' : 'bg-[#0f0f0f] text-gray-200'}`}>
            {fileContent}
          </pre>
          <button
            onClick={() => copyText(fileContent, 'file')}
            disabled={!canCopyFile}
            className={`absolute top-2 right-2 ${btnCopy} disabled:opacity-40 disabled:cursor-not-allowed`}>
            {copiedFile ? <><CheckCircle2 className="w-3 h-3" /> Copied</> : <><Code2 className="w-3 h-3" /> Copy file</>}
          </button>
        </div>
        {!canCopyFile && (
          <p className={`ml-8 mt-2 text-xs ${isGlass ? 'text-gray-400' : 'text-[#999]'}`}>Fill in URL and key above to enable the copy button.</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-2">
        <button onClick={onSkip} className={btnSecondary}>Skip (local only)</button>
        <button onClick={onComplete} className={btnPrimary}>
          <CheckCircle2 className="w-4 h-4" /> Done, I've rebuilt
        </button>
      </div>

      <p className={`text-center text-[10px] mt-4 ${isGlass ? 'text-gray-400' : 'text-[#999]'}`}>
        <Shield className="w-3 h-3 inline mr-1" />
        Keys are baked into the build — every device connects automatically
      </p>
    </>
  );

  if (!isGlass) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-[#0f0f0f] rounded-xl flex items-center justify-center">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#0f0f0f]">Cloud Setup</h1>
              <p className="text-sm text-[#666]">One-time setup — works on all devices after rebuild</p>
            </div>
          </div>
          {body}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-mesh flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl" />
      </div>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative w-full max-w-2xl">
        <div className="glass-card p-6 md:p-8 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          <div className="flex items-center gap-3 mb-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
              className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Database className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cloud Setup</h1>
              <p className="text-sm text-gray-400 font-medium">One-time setup — works on all devices after rebuild</p>
            </div>
          </div>
          {body}
        </div>
      </motion.div>
    </div>
  );
}
