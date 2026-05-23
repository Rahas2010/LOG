import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Settings2, Clock, AlertTriangle, Shield, Database,
  Download, Upload, Trash2, RefreshCw, Cloud, Eye, EyeOff,
  Code2, RotateCcw, Save, CheckCircle2, AlertCircle, Wrench,
} from 'lucide-react';
import type { AppSettings } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import { useTheme } from '../ThemeContext';
import { useAuth } from '../AuthContext';
import { clearSupabaseConfig, isSupabaseConfigured } from '../db/config';

interface SettingsPanelProps {
  isOpen: boolean;
  settings: AppSettings;
  cloudEnabled: boolean;
  lastSynced: Date | null;
  onClose: () => void;
  onSaveSettings: (settings: AppSettings) => void;
  onResetData: () => void;
  onReplaceData: (data: any) => void;
  onForceSync: () => void;
  onReconfigureCloud: () => void;
}

type Tab = 'time' | 'security' | 'data' | 'cloud' | 'advanced';

export default function SettingsPanel({
  isOpen, settings, cloudEnabled, lastSynced,
  onClose, onSaveSettings, onResetData, onReplaceData, onForceSync, onReconfigureCloud
}: SettingsPanelProps) {
  const { theme } = useTheme();
  const isGlass = theme === 'glass';
  const { isAdmin, changePassword, getAllUsers } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('time');
  const [draft, setDraft] = useState<AppSettings>(settings);
  const [saved, setSaved] = useState(false);
  const [busyPasswordKey, setBusyPasswordKey] = useState<string | null>(null);

  const [adminPw, setAdminPw] = useState('');
  const [adminPwConfirm, setAdminPwConfirm] = useState('');
  const [userPasswords, setUserPasswords] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [showDebug, setShowDebug] = useState(false);
  const [debugText, setDebugText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const tabs: Array<{ id: Tab; label: string; icon: React.ComponentType<{ className?: string }>; adminOnly?: boolean }> = [
    { id: 'time', label: 'Time', icon: Clock },
    { id: 'security', label: 'Security', icon: Shield, adminOnly: true },
    { id: 'data', label: 'Data', icon: Database },
    { id: 'cloud', label: 'Cloud', icon: Cloud },
    { id: 'advanced', label: 'Advanced', icon: Wrench },
  ];

  const visibleTabs = tabs.filter(t => !t.adminOnly || isAdmin);
  const users = useMemo(() => getAllUsers(), [getAllUsers]);

  const handleSaveTime = () => {
    onSaveSettings(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleResetSettings = () => {
    setDraft(DEFAULT_SETTINGS);
    onSaveSettings(DEFAULT_SETTINGS);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleChangeAdminPassword = async () => {
    if (!adminPw.trim()) {
      setPwMessage({ type: 'error', text: 'Password cannot be empty' });
      return;
    }
    if (adminPw !== adminPwConfirm) {
      setPwMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    if (adminPw.length < 6) {
      setPwMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    setBusyPasswordKey('admin');
    const ok = await changePassword('admin', adminPw);
    setBusyPasswordKey(null);
    if (ok) {
      setPwMessage({ type: 'success', text: 'Admin password updated in cloud/local cache' });
      setAdminPw('');
      setAdminPwConfirm('');
    } else {
      setPwMessage({ type: 'error', text: 'Failed to update password' });
    }
  };

  const handleChangeUserPassword = async (userKey: string) => {
    const newPw = userPasswords[userKey];
    if (!newPw || !newPw.trim()) {
      setPwMessage({ type: 'error', text: 'Password cannot be empty' });
      return;
    }
    if (newPw.length < 6) {
      setPwMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    setBusyPasswordKey(userKey);
    const ok = await changePassword(userKey, newPw);
    setBusyPasswordKey(null);
    if (ok) {
      setPwMessage({ type: 'success', text: `${users.find(u => u.key === userKey)?.display || userKey}'s password updated` });
      setUserPasswords(prev => ({ ...prev, [userKey]: '' }));
    } else {
      setPwMessage({ type: 'error', text: 'Failed to update password' });
    }
  };

  const handleExport = () => {
    const currentUser = JSON.parse(localStorage.getItem('screentime_user') || 'null');
    const key = currentUser?.key;
    const data = localStorage.getItem(`screentime_state_${key}`) || '{}';
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `screentime-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (!parsed.dailyData) throw new Error('Invalid format');
        onReplaceData(parsed);
        setImportMessage({ type: 'success', text: 'Data imported successfully' });
        setTimeout(() => setImportMessage(null), 2500);
      } catch {
        setImportMessage({ type: 'error', text: 'Invalid file format' });
        setTimeout(() => setImportMessage(null), 2500);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to delete ALL logged time? This cannot be undone.')) {
      onResetData();
    }
  };

  const handleReconfigure = () => {
    if (confirm('This will clear your Supabase config. You will need to set it up again. Continue?')) {
      clearSupabaseConfig();
      localStorage.removeItem('screentime_setup_skipped');
      onReconfigureCloud();
    }
  };

  const handleShowDebug = () => {
    const currentUser = JSON.parse(localStorage.getItem('screentime_user') || 'null');
    const key = currentUser?.key;
    const data = localStorage.getItem(`screentime_state_${key}`) || '{}';
    try { setDebugText(JSON.stringify(JSON.parse(data), null, 2)); } catch { setDebugText(data); }
    setShowDebug(true);
  };

  const handleClose = () => {
    setDraft(settings);
    onClose();
  };

  const inputCls = isGlass
    ? 'w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200/80 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all'
    : 'w-full px-3 py-2.5 border border-[#e5e5e5] rounded-lg bg-[#fafafa] text-[#0f0f0f] font-semibold focus:outline-none focus:border-[#0f0f0f] focus:bg-white focus:shadow-[0_0_0_3px_rgba(15,15,15,0.05)] transition-all';

  const content = (
    <>
      {activeTab === 'time' && (
        <motion.div key="time" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
          <Field label="Max Daily Time" hint="Minutes allowed per day" icon={Clock}><input type="number" min={1} max={480} value={draft.maxTime} onChange={e => setDraft({ ...draft, maxTime: Math.max(1, parseInt(e.target.value) || 1) })} className={inputCls} /></Field>
          <Field label="Penalty Multiplier" hint="Excess time × this ratio" icon={AlertTriangle}><input type="number" min={0} max={10} step={0.1} value={draft.penaltyRatio} onChange={e => setDraft({ ...draft, penaltyRatio: Math.max(0, parseFloat(e.target.value) || 0) })} className={inputCls} /></Field>
          <Field label="Full Block Threshold" hint="Penalty >= this triggers full day block" icon={AlertTriangle}><input type="number" min={1} max={480} value={draft.fullBlockThreshold} onChange={e => setDraft({ ...draft, fullBlockThreshold: Math.max(1, parseInt(e.target.value) || 1) })} className={inputCls} /></Field>
          <Field label="Carry Forward" hint="Carry excess penalty to next days" icon={AlertTriangle}><button onClick={() => setDraft({ ...draft, carryForwardEnabled: !draft.carryForwardEnabled })} className={`relative w-12 h-7 rounded-full transition-colors ${draft.carryForwardEnabled ? 'bg-green-500' : 'bg-gray-300'}`}><motion.div animate={{ x: draft.carryForwardEnabled ? 22 : 2 }} className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md" /></button></Field>
          <div className="flex gap-2 pt-3">
            <button onClick={handleSaveTime} className={`flex-1 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${isGlass ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-[#0f0f0f] text-white hover:bg-[#333]'}`}>{saved ? <><CheckCircle2 className="w-4 h-4" /> Saved</> : <><Save className="w-4 h-4" /> Save Changes</>}</button>
            <button onClick={handleResetSettings} className={`py-2.5 px-4 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all ${isGlass ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'border border-[#e5e5e5] text-[#0f0f0f] hover:bg-[#f5f5f5]'}`}><RotateCcw className="w-4 h-4" /> Defaults</button>
          </div>
        </motion.div>
      )}

      {activeTab === 'security' && isAdmin && (
        <motion.div key="security" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
          <div className={`p-4 rounded-xl ${isGlass ? 'bg-gray-900/5 border border-gray-200/50' : 'bg-[#fafafa] border border-[#e5e5e5]'}`}>
            <h3 className={`text-sm font-bold mb-3 ${isGlass ? 'text-gray-900' : 'text-[#0f0f0f]'}`}>Admin Password</h3>
            <div className="space-y-2">
              <PasswordInput label="New password" value={adminPw} onChange={setAdminPw} show={showPasswords['admin-new']} onToggle={() => setShowPasswords(p => ({ ...p, 'admin-new': !p['admin-new'] }))} />
              <PasswordInput label="Confirm" value={adminPwConfirm} onChange={setAdminPwConfirm} show={showPasswords['admin-confirm']} onToggle={() => setShowPasswords(p => ({ ...p, 'admin-confirm': !p['admin-confirm'] }))} />
              <button onClick={handleChangeAdminPassword} className={`w-full py-2 rounded-lg font-semibold text-sm ${isGlass ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-[#0f0f0f] text-white hover:bg-[#333]'}`}>
                {busyPasswordKey === 'admin' ? 'Updating...' : 'Update Admin Password'}
              </button>
            </div>
          </div>

          {users.filter(u => u.role === 'user').map(u => (
            <div key={u.key} className={`p-4 rounded-xl ${isGlass ? 'bg-gray-900/5 border border-gray-200/50' : 'bg-[#fafafa] border border-[#e5e5e5]'}`}>
              <h3 className={`text-sm font-bold mb-3 ${isGlass ? 'text-gray-900' : 'text-[#0f0f0f]'}`}>{u.display}'s Password</h3>
              <div className="space-y-2">
                <PasswordInput label="New password" value={userPasswords[u.key] || ''} onChange={v => setUserPasswords(p => ({ ...p, [u.key]: v }))} show={showPasswords[u.key]} onToggle={() => setShowPasswords(p => ({ ...p, [u.key]: !p[u.key] }))} />
                <button onClick={() => handleChangeUserPassword(u.key)} className={`w-full py-2 rounded-lg font-semibold text-sm ${isGlass ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-[#0f0f0f] text-white hover:bg-[#333]'}`}>
                  {busyPasswordKey === u.key ? 'Updating...' : 'Update'}
                </button>
              </div>
            </div>
          ))}

          {pwMessage && <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className={`text-sm font-medium rounded-lg px-3 py-2.5 flex items-center gap-2 ${pwMessage.type === 'success' ? (isGlass ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-green-50 text-green-700') : (isGlass ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-[#fee2e2] text-[#991b1b]')}`}>{pwMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}{pwMessage.text}</motion.div>}
        </motion.div>
      )}

      {activeTab === 'data' && (
        <motion.div key="data" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
          <button onClick={handleExport} className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${isGlass ? 'bg-white/60 hover:bg-white border border-gray-200/50 text-gray-700' : 'bg-white border border-[#e5e5e5] text-[#0f0f0f] hover:bg-[#f5f5f5]'}`}><Download className="w-4 h-4" /> Export Data as JSON</button>
          <button onClick={() => fileInputRef.current?.click()} className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${isGlass ? 'bg-white/60 hover:bg-white border border-gray-200/50 text-gray-700' : 'bg-white border border-[#e5e5e5] text-[#0f0f0f] hover:bg-[#f5f5f5]'}`}><Upload className="w-4 h-4" /> Import from JSON</button>
          <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={handleImport} className="hidden" />
          {importMessage && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-sm font-medium rounded-lg px-3 py-2 flex items-center gap-2 ${importMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{importMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}{importMessage.text}</motion.div>}
          <button onClick={handleResetData} className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200/50 transition-all"><Trash2 className="w-4 h-4" /> Reset All Logged Data</button>
        </motion.div>
      )}

      {activeTab === 'cloud' && (
        <motion.div key="cloud" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
          <div className={`p-4 rounded-xl ${isGlass ? 'bg-gray-900/5 border border-gray-200/50' : 'bg-[#fafafa] border border-[#e5e5e5]'}`}>
            <div className="flex items-center gap-2 mb-2"><Cloud className={`w-4 h-4 ${cloudEnabled ? 'text-green-500' : 'text-gray-400'}`} /><span className={`text-sm font-bold ${isGlass ? 'text-gray-900' : 'text-[#0f0f0f]'}`}>Status: {cloudEnabled ? 'Connected' : 'Not configured'}</span></div>
            {lastSynced && <p className={`text-xs ${isGlass ? 'text-gray-500' : 'text-[#666]'}`}>Last synced: {lastSynced.toLocaleString()}</p>}
            <p className={`text-xs mt-2 ${isGlass ? 'text-gray-500' : 'text-[#666]'}`}>When cloud is enabled, passwords and data sync across devices.</p>
          </div>
          <button onClick={onForceSync} disabled={!cloudEnabled} className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${isGlass ? 'bg-white/60 hover:bg-white border border-gray-200/50 text-gray-700' : 'bg-white border border-[#e5e5e5] text-[#0f0f0f] hover:bg-[#f5f5f5]'}`}><RefreshCw className="w-4 h-4" /> Force Sync Now</button>
          <button onClick={handleReconfigure} className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${isGlass ? 'bg-white/60 hover:bg-white border border-gray-200/50 text-gray-700' : 'bg-white border border-[#e5e5e5] text-[#0f0f0f] hover:bg-[#f5f5f5]'}`}><Settings2 className="w-4 h-4" /> {isSupabaseConfigured() ? 'Reconfigure Supabase' : 'Set up Supabase'}</button>
        </motion.div>
      )}

      {activeTab === 'advanced' && (
        <motion.div key="advanced" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
          <button onClick={handleShowDebug} className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${isGlass ? 'bg-white/60 hover:bg-white border border-gray-200/50 text-gray-700' : 'bg-white border border-[#e5e5e5] text-[#0f0f0f] hover:bg-[#f5f5f5]'}`}><Code2 className="w-4 h-4" /> {showDebug ? 'Hide' : 'Show'} Debug Info</button>
          {showDebug && <pre className={`text-[10px] p-3 rounded-lg overflow-auto max-h-60 font-mono ${isGlass ? 'bg-gray-900 text-gray-100' : 'bg-[#0f0f0f] text-gray-100'}`}>{debugText}</pre>}
          <div className={`p-4 rounded-xl text-xs ${isGlass ? 'bg-gray-900/5 text-gray-500' : 'bg-[#fafafa] text-[#666]'}`}><p className="font-semibold mb-2">Current Settings</p><ul className="space-y-1 font-mono"><li>maxTime: {settings.maxTime}</li><li>penaltyRatio: {settings.penaltyRatio}</li><li>fullBlockThreshold: {settings.fullBlockThreshold}</li><li>carryForward: {settings.carryForwardEnabled ? 'on' : 'off'}</li></ul></div>
        </motion.div>
      )}
    </>
  );

  if (!isGlass) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between p-5 border-b border-[#e5e5e5]"><div className="flex items-center gap-2"><Settings2 className="w-5 h-5 text-[#0f0f0f]" /><h2 className="text-lg font-bold text-[#0f0f0f]">Settings</h2></div><button onClick={handleClose} className="text-[#999] hover:text-[#0f0f0f]"><X className="w-5 h-5" /></button></div>
              <div className="flex border-b border-[#e5e5e5] overflow-x-auto">{visibleTabs.map(t => { const Icon = t.icon; const active = activeTab === t.id; return <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors ${active ? 'text-[#0f0f0f] border-b-2 border-[#0f0f0f]' : 'text-[#999] hover:text-[#666]'}`}><Icon className="w-3.5 h-3.5" /> {t.label}</button>; })}</div>
              <div className="p-5 overflow-y-auto"><AnimatePresence mode="wait">{content}</AnimatePresence></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/30 backdrop-blur-md" onClick={handleClose} />
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-black/10 max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-200/50"><div className="flex items-center gap-2.5"><div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center shadow-md shadow-gray-900/20"><Settings2 className="w-4 h-4 text-white" /></div><h2 className="text-lg font-bold text-gray-900">Settings</h2></div><button onClick={handleClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"><X className="w-4 h-4 text-gray-500" /></button></div>
            <div className="flex border-b border-gray-200/50 overflow-x-auto bg-gray-50/50">{visibleTabs.map(t => { const Icon = t.icon; const active = activeTab === t.id; return <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-all ${active ? 'text-gray-900 border-b-2 border-gray-900 bg-white' : 'text-gray-500 hover:text-gray-700'}`}><Icon className="w-3.5 h-3.5" /> {t.label}</button>; })}</div>
            <div className="p-5 overflow-y-auto"><AnimatePresence mode="wait">{content}</AnimatePresence></div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, hint, icon: Icon, children }: { label: string; hint: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode; }) {
  const { theme } = useTheme();
  const isGlass = theme === 'glass';
  return <div className={`p-4 rounded-xl ${isGlass ? 'bg-gray-900/5 border border-gray-200/50' : 'bg-[#fafafa] border border-[#e5e5e5]'}`}><div className="flex items-center justify-between gap-3"><div className="flex-1"><div className="flex items-center gap-2"><Icon className={`w-3.5 h-3.5 ${isGlass ? 'text-gray-400' : 'text-[#999]'}`} /><label className={`text-sm font-bold ${isGlass ? 'text-gray-900' : 'text-[#0f0f0f]'}`}>{label}</label></div><p className={`text-xs mt-0.5 ml-5 ${isGlass ? 'text-gray-400' : 'text-[#999]'}`}>{hint}</p></div><div className="w-32">{children}</div></div></div>;
}

function PasswordInput({ label, value, onChange, show, onToggle }: { label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void; }) {
  const { theme } = useTheme();
  const isGlass = theme === 'glass';
  const cls = isGlass ? 'w-full pl-3 pr-10 py-2.5 rounded-xl bg-gray-50 border border-gray-200/80 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10' : 'w-full pl-3 pr-10 py-2 border border-[#e5e5e5] rounded-lg bg-white text-sm focus:outline-none focus:border-[#0f0f0f]';
  return <div><label className={`block text-xs font-semibold mb-1 ${isGlass ? 'text-gray-500' : 'text-[#666]'}`}>{label}</label><div className="relative"><input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)} className={cls} /><button type="button" onClick={onToggle} className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${isGlass ? 'text-gray-400' : 'text-[#999]'}`}>{show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>;
}
