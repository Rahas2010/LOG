import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Settings2, Clock, AlertTriangle, Shield, Database,
  Download, Upload, Trash2, RefreshCw, Cloud, Eye, EyeOff,
  Code2, RotateCcw, Save, CheckCircle2, AlertCircle, Wrench,
  UserPlus, Edit3, ShieldCheck, ChevronDown, FileText, Mail,
} from 'lucide-react';
import type { AppSettings } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import { useTheme } from '../ThemeContext';
import { useAuth } from '../AuthContext';
import type { UserRole } from '../AuthContext';
import { CLOUD_ENABLED } from '../db/supabase';

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
type SecuritySection = 'passwords' | 'addUser' | 'changeUsername' | 'changeRole';

/* ────────────────────────────────────────────
   PDF REPORT GENERATOR (pure HTML → print)
   ──────────────────────────────────────────── */
function generateReportHTML(userName: string, settings: AppSettings): string {
  const currentUser = JSON.parse(localStorage.getItem('screentime_user') || 'null');
  const key = currentUser?.key;
  const raw = localStorage.getItem(`screentime_state_${key}`) || '{}';
  let parsed: any = {};
  try { parsed = JSON.parse(raw); } catch {}

  const dailyData: Record<string, { spell1: number; spell2: number; spell3: number }> = parsed.dailyData || {};

  // Last 7 days
  const days: { date: string; spell1: number; spell2: number; spell3: number; total: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const dd = dailyData[key] || { spell1: 0, spell2: 0, spell3: 0 };
    days.push({ date: key, spell1: dd.spell1, spell2: dd.spell2, spell3: dd.spell3, total: dd.spell1 + dd.spell2 + dd.spell3 });
  }

  const totalWeek = days.reduce((s, d) => s + d.total, 0);
  const avgDaily = days.length ? Math.round(totalWeek / days.length) : 0;
  const overLimitDays = days.filter(d => d.total > settings.maxTime).length;
  const onTimeDays = days.filter(d => d.total > 0 && d.total <= settings.maxTime).length;

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Screen Time Report — ${userName}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a;padding:40px;max-width:800px;margin:auto;line-height:1.6}
h1{font-size:28px;font-weight:800;margin-bottom:4px}
.subtitle{color:#666;font-size:14px;margin-bottom:32px}
.section{margin-bottom:28px}
.section-title{font-size:16px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#555;border-bottom:2px solid #e5e5e5;padding-bottom:8px;margin-bottom:16px}
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
.stat-card{background:#f8f8f8;border:1px solid #e5e5e5;border-radius:12px;padding:16px;text-align:center}
.stat-value{font-size:32px;font-weight:800;color:#0f0f0f}
.stat-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#999;margin-top:4px}
.stat-danger .stat-value{color:#ef4444}
.stat-success .stat-value{color:#22c55e}
.stat-warning .stat-value{color:#f97316}
table{width:100%;border-collapse:collapse;font-size:14px}
th{background:#0f0f0f;color:white;padding:10px 14px;text-align:left;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.5px}
td{padding:10px 14px;border-bottom:1px solid #e5e5e5}
tr:nth-child(even) td{background:#fafafa}
.over{color:#ef4444;font-weight:700}
.ok{color:#22c55e;font-weight:600}
.footer{margin-top:40px;padding-top:16px;border-top:1px solid #e5e5e5;color:#999;font-size:11px;text-align:center}
.settings-list{columns:2;font-size:13px;color:#666}
.settings-list li{margin-bottom:6px}
@media print{body{padding:20px}h1{font-size:22px}.stats-grid{grid-template-columns:repeat(4,1fr)}}
</style></head><body>
<h1>📊 Screen Time Report</h1>
<p class="subtitle">Generated for <strong>${userName}</strong> on ${today}</p>

<div class="section">
  <div class="section-title">Weekly Summary (Last 7 Days)</div>
  <div class="stats-grid">
    <div class="stat-card"><div class="stat-value">${totalWeek}</div><div class="stat-label">Total Minutes</div></div>
    <div class="stat-card"><div class="stat-value">${avgDaily}</div><div class="stat-label">Avg Daily (min)</div></div>
    <div class="stat-card ${onTimeDays >= 5 ? 'stat-success' : 'stat-warning'}"><div class="stat-value">${onTimeDays}</div><div class="stat-label">On-Time Days</div></div>
    <div class="stat-card ${overLimitDays > 0 ? 'stat-danger' : 'stat-success'}"><div class="stat-value">${overLimitDays}</div><div class="stat-label">Over-Limit Days</div></div>
  </div>
</div>

<div class="section">
  <div class="section-title">Daily Breakdown</div>
  <table>
    <thead><tr><th>Date</th><th>Spell 1</th><th>Spell 2</th><th>Spell 3</th><th>Total</th><th>Status</th></tr></thead>
    <tbody>
      ${days.map(d => {
        const over = d.total > settings.maxTime;
        const statusCls = d.total === 0 ? '' : over ? 'over' : 'ok';
        const statusText = d.total === 0 ? '—' : over ? `Over (+${d.total - settings.maxTime})` : 'On Time';
        const dateLabel = new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        return `<tr><td>${dateLabel}</td><td>${d.spell1}</td><td>${d.spell2}</td><td>${d.spell3}</td><td><strong>${d.total}</strong></td><td class="${statusCls}">${statusText}</td></tr>`;
      }).join('')}
    </tbody>
  </table>
</div>

<div class="section">
  <div class="section-title">Current Settings</div>
  <ul class="settings-list">
    <li><strong>Daily Limit:</strong> ${settings.maxTime} min</li>
    <li><strong>Penalty Multiplier:</strong> ${settings.penaltyRatio}×</li>
    <li><strong>Full Block Threshold:</strong> ${settings.fullBlockThreshold} min</li>
    <li><strong>Carry Forward:</strong> ${settings.carryForwardEnabled ? 'Enabled' : 'Disabled'}</li>
  </ul>
</div>

<div class="footer">
  Screen Time Tracker — Report generated automatically on ${today}
</div>
</body></html>`;
}

export default function SettingsPanel({
  isOpen, settings, cloudEnabled, lastSynced,
  onClose, onSaveSettings, onResetData, onReplaceData, onForceSync, onReconfigureCloud
}: SettingsPanelProps) {
  const { theme, isDark } = useTheme();
  const isGlass = theme === 'glass';
  const { isAdmin, changePassword, getAllUsers, addUser, changeUsername, changeUserRole, user } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('time');
  const [draft, setDraft] = useState<AppSettings>(settings);
  const [saved, setSaved] = useState(false);
  const [busyPasswordKey, setBusyPasswordKey] = useState<string | null>(null);

  const [adminPw, setAdminPw] = useState('');
  const [adminPwConfirm, setAdminPwConfirm] = useState('');
  const [userPasswords, setUserPasswords] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [securitySection, setSecuritySection] = useState<SecuritySection>('passwords');

  const [newUserKey, setNewUserKey] = useState('');
  const [newUserDisplay, setNewUserDisplay] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('user');
  const [addUserBusy, setAddUserBusy] = useState(false);
  const [addUserMessage, setAddUserMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [editUsernameKey, setEditUsernameKey] = useState('');
  const [editUsernameValue, setEditUsernameValue] = useState('');
  const [editUsernameBusy, setEditUsernameBusy] = useState(false);
  const [editUsernameMessage, setEditUsernameMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [editRoleKey, setEditRoleKey] = useState('');
  const [editRoleValue, setEditRoleValue] = useState<UserRole>('user');
  const [editRoleBusy, setEditRoleBusy] = useState(false);
  const [editRoleMessage, setEditRoleMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Report
  const [emailTo, setEmailTo] = useState('');
  const [reportMessage, setReportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
  const users = useMemo(() => getAllUsers(), [getAllUsers, addUserMessage, editUsernameMessage, editRoleMessage]);

  const securityTabs: Array<{ id: SecuritySection; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'passwords', label: 'Passwords', icon: Shield },
    { id: 'addUser', label: 'Add User', icon: UserPlus },
    { id: 'changeUsername', label: 'Username', icon: Edit3 },
    { id: 'changeRole', label: 'Role', icon: ShieldCheck },
  ];

  // ── Dark-aware style helpers ──
  const inputCls = isDark
    ? 'w-full px-4 py-3 rounded-xl bg-[#252540] border border-[#2a2a3e] text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all'
    : isGlass
      ? 'w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200/80 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all'
      : 'w-full px-3 py-2.5 border border-[#e5e5e5] rounded-lg bg-[#fafafa] text-[#0f0f0f] font-semibold focus:outline-none focus:border-[#0f0f0f] focus:bg-white focus:shadow-[0_0_0_3px_rgba(15,15,15,0.05)] transition-all';

  const selectCls = isDark
    ? 'w-full px-4 py-3 rounded-xl bg-[#252540] border border-[#2a2a3e] text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all appearance-none cursor-pointer'
    : isGlass
      ? 'w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200/80 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-all appearance-none cursor-pointer'
      : 'w-full px-3 py-2.5 border border-[#e5e5e5] rounded-lg bg-[#fafafa] text-[#0f0f0f] font-semibold focus:outline-none focus:border-[#0f0f0f] transition-all appearance-none cursor-pointer';

  const primaryBtnCls = isDark
    ? 'bg-indigo-600 text-white hover:bg-indigo-500'
    : isGlass
      ? 'bg-gray-900 text-white hover:bg-gray-800'
      : 'bg-[#0f0f0f] text-white hover:bg-[#333]';

  const cardCls = isDark
    ? 'p-4 rounded-xl bg-[#252540]/60 border border-[#2a2a3e]'
    : isGlass
      ? 'p-4 rounded-xl bg-gray-900/5 border border-gray-200/50'
      : 'p-4 rounded-xl bg-[#fafafa] border border-[#e5e5e5]';

  const labelCls = isDark ? 'text-gray-500' : isGlass ? 'text-gray-500' : 'text-[#666]';
  const headingCls = isDark ? 'text-white' : isGlass ? 'text-gray-900' : 'text-[#0f0f0f]';

  const secSubTabCls = (active: boolean) => isDark
    ? `px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${active ? 'bg-indigo-600 text-white shadow-sm' : 'bg-[#252540] text-gray-500 hover:bg-[#2a2a4a] hover:text-gray-300'}`
    : isGlass
      ? `px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${active ? 'bg-gray-900 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'}`
      : `px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${active ? 'bg-[#0f0f0f] text-white' : 'bg-[#f5f5f5] text-[#999] hover:bg-[#eee] hover:text-[#666]'}`;

  const secondaryBtnCls = isDark
    ? 'bg-[#252540] hover:bg-[#2a2a4a] border border-[#2a2a3e] text-gray-300'
    : isGlass
      ? 'bg-white/60 hover:bg-white border border-gray-200/50 text-gray-700'
      : 'bg-white border border-[#e5e5e5] text-[#0f0f0f] hover:bg-[#f5f5f5]';

  // ── Handlers ──

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
    if (!adminPw.trim()) { setPwMessage({ type: 'error', text: 'Password cannot be empty' }); return; }
    if (adminPw !== adminPwConfirm) { setPwMessage({ type: 'error', text: 'Passwords do not match' }); return; }
    if (adminPw.length < 6) { setPwMessage({ type: 'error', text: 'Password must be at least 6 characters' }); return; }
    setBusyPasswordKey('admin');
    const ok = await changePassword('admin', adminPw);
    setBusyPasswordKey(null);
    if (ok) { setPwMessage({ type: 'success', text: 'Admin password updated' }); setAdminPw(''); setAdminPwConfirm(''); }
    else { setPwMessage({ type: 'error', text: 'Failed to update password' }); }
  };

  const handleChangeUserPassword = async (userKey: string) => {
    const newPw = userPasswords[userKey];
    if (!newPw || !newPw.trim()) { setPwMessage({ type: 'error', text: 'Password cannot be empty' }); return; }
    if (newPw.length < 6) { setPwMessage({ type: 'error', text: 'Password must be at least 6 characters' }); return; }
    setBusyPasswordKey(userKey);
    const ok = await changePassword(userKey, newPw);
    setBusyPasswordKey(null);
    if (ok) { setPwMessage({ type: 'success', text: `${users.find(u => u.key === userKey)?.display || userKey}'s password updated` }); setUserPasswords(prev => ({ ...prev, [userKey]: '' })); }
    else { setPwMessage({ type: 'error', text: 'Failed to update password' }); }
  };

  const handleAddUser = async () => {
    setAddUserMessage(null);
    if (!newUserKey.trim()) { setAddUserMessage({ type: 'error', text: 'Login key is required' }); return; }
    if (!newUserDisplay.trim()) { setAddUserMessage({ type: 'error', text: 'Display name is required' }); return; }
    if (!newUserPassword.trim()) { setAddUserMessage({ type: 'error', text: 'Password is required' }); return; }
    if (newUserPassword.length < 6) { setAddUserMessage({ type: 'error', text: 'Password must be at least 6 characters' }); return; }
    setAddUserBusy(true);
    const result = await addUser(newUserKey, newUserDisplay, newUserPassword, newUserRole);
    setAddUserBusy(false);
    if (result.success) { setAddUserMessage({ type: 'success', text: `User "${newUserDisplay.trim()}" added` }); setNewUserKey(''); setNewUserDisplay(''); setNewUserPassword(''); setNewUserRole('user'); }
    else { setAddUserMessage({ type: 'error', text: result.error || 'Failed' }); }
  };

  const handleChangeUsername = async () => {
    setEditUsernameMessage(null);
    if (!editUsernameKey) { setEditUsernameMessage({ type: 'error', text: 'Select a user' }); return; }
    if (!editUsernameValue.trim()) { setEditUsernameMessage({ type: 'error', text: 'Name cannot be empty' }); return; }
    setEditUsernameBusy(true);
    const result = await changeUsername(editUsernameKey, editUsernameValue);
    setEditUsernameBusy(false);
    if (result.success) { setEditUsernameMessage({ type: 'success', text: `Updated to "${editUsernameValue.trim()}"` }); setEditUsernameValue(''); setEditUsernameKey(''); }
    else { setEditUsernameMessage({ type: 'error', text: result.error || 'Failed' }); }
  };

  const handleChangeRole = async () => {
    setEditRoleMessage(null);
    if (!editRoleKey) { setEditRoleMessage({ type: 'error', text: 'Select a user' }); return; }
    if (editRoleKey === 'admin') { setEditRoleMessage({ type: 'error', text: 'Cannot change admin role' }); return; }
    setEditRoleBusy(true);
    const result = await changeUserRole(editRoleKey, editRoleValue);
    setEditRoleBusy(false);
    if (result.success) { const display = users.find(u => u.key === editRoleKey)?.display || editRoleKey; setEditRoleMessage({ type: 'success', text: `${display} is now ${editRoleValue === 'admin' ? 'an Admin' : 'a User'}` }); setEditRoleKey(''); setEditRoleValue('user'); }
    else { setEditRoleMessage({ type: 'error', text: result.error || 'Failed' }); }
  };

  // ── Report handlers ──
  const handleDownloadPDF = () => {
    const html = generateReportHTML(user?.username || 'User', settings);
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      // Auto-trigger print dialog (which allows Save as PDF)
      setTimeout(() => win.print(), 500);
    }
    setReportMessage({ type: 'success', text: 'Report opened — use Print → Save as PDF' });
  };

  const handleEmailReport = () => {
    if (!emailTo.trim() || !emailTo.includes('@')) {
      setReportMessage({ type: 'error', text: 'Enter a valid email address' });
      return;
    }
    // Generate summary for email body
    const currentUser = JSON.parse(localStorage.getItem('screentime_user') || 'null');
    const key = currentUser?.key;
    const raw = localStorage.getItem(`screentime_state_${key}`) || '{}';
    let parsed: any = {};
    try { parsed = JSON.parse(raw); } catch {}
    const dailyData = parsed.dailyData || {};

    let body = `Screen Time Report for ${user?.username || 'User'}%0A%0A`;
    body += `Generated: ${new Date().toLocaleDateString()}%0A%0A`;
    body += `=== Last 7 Days ===%0A`;
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dk = d.toISOString().split('T')[0];
      const dd = dailyData[dk] || { spell1: 0, spell2: 0, spell3: 0 };
      const total = dd.spell1 + dd.spell2 + dd.spell3;
      const dateLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      body += `${dateLabel}: ${total} min${total > settings.maxTime ? ' (OVER LIMIT)' : ''}%0A`;
    }
    body += `%0ADaily Limit: ${settings.maxTime} min%0APenalty Multiplier: ${settings.penaltyRatio}x`;

    const subject = encodeURIComponent(`Screen Time Report — ${user?.username || 'User'} — ${new Date().toLocaleDateString()}`);
    window.open(`mailto:${emailTo}?subject=${subject}&body=${body}`, '_self');
    setReportMessage({ type: 'success', text: `Email client opened for ${emailTo}` });
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
    localStorage.removeItem('screentime_setup_skipped');
    onReconfigureCloud();
  };

  const handleShowDebug = () => {
    const currentUser = JSON.parse(localStorage.getItem('screentime_user') || 'null');
    const key = currentUser?.key;
    const data = localStorage.getItem(`screentime_state_${key}`) || '{}';
    try { setDebugText(JSON.stringify(JSON.parse(data), null, 2)); } catch { setDebugText(data); }
    setShowDebug(true);
  };

  const handleClose = () => { setDraft(settings); onClose(); };

  const content = (
    <>
      {activeTab === 'time' && (
        <motion.div key="time" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
          <Field label="Max Daily Time" hint="Minutes allowed per day" icon={Clock}><input type="number" min={1} max={480} value={draft.maxTime} onChange={e => setDraft({ ...draft, maxTime: Math.max(1, parseInt(e.target.value) || 1) })} className={inputCls} /></Field>
          <Field label="Penalty Multiplier" hint="Excess time × this ratio" icon={AlertTriangle}><input type="number" min={0} max={10} step={0.1} value={draft.penaltyRatio} onChange={e => setDraft({ ...draft, penaltyRatio: Math.max(0, parseFloat(e.target.value) || 0) })} className={inputCls} /></Field>
          <Field label="Full Block Threshold" hint="Penalty >= this triggers full day block" icon={AlertTriangle}><input type="number" min={1} max={480} value={draft.fullBlockThreshold} onChange={e => setDraft({ ...draft, fullBlockThreshold: Math.max(1, parseInt(e.target.value) || 1) })} className={inputCls} /></Field>
          <Field label="Carry Forward" hint="Carry excess penalty to next days" icon={AlertTriangle}><button onClick={() => setDraft({ ...draft, carryForwardEnabled: !draft.carryForwardEnabled })} className={`relative w-12 h-7 rounded-full transition-colors ${draft.carryForwardEnabled ? 'bg-green-500' : (isDark ? 'bg-[#2a2a3e]' : 'bg-gray-300')}`}><motion.div animate={{ x: draft.carryForwardEnabled ? 22 : 2 }} className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md" /></button></Field>
          <div className="flex gap-2 pt-3">
            <button onClick={handleSaveTime} className={`flex-1 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${primaryBtnCls}`}>{saved ? <><CheckCircle2 className="w-4 h-4" /> Saved</> : <><Save className="w-4 h-4" /> Save Changes</>}</button>
            <button onClick={handleResetSettings} className={`py-2.5 px-4 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all ${
              isDark ? 'bg-[#252540] text-gray-300 hover:bg-[#2a2a4a]' : isGlass ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'border border-[#e5e5e5] text-[#0f0f0f] hover:bg-[#f5f5f5]'
            }`}><RotateCcw className="w-4 h-4" /> Defaults</button>
          </div>
        </motion.div>
      )}

      {activeTab === 'security' && isAdmin && (
        <motion.div key="security" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {securityTabs.map(st => {
              const Icon = st.icon;
              return (<button key={st.id} onClick={() => setSecuritySection(st.id)} className={secSubTabCls(securitySection === st.id)}><span className="flex items-center gap-1.5"><Icon className="w-3 h-3" />{st.label}</span></button>);
            })}
          </div>

          <AnimatePresence mode="wait">
            {securitySection === 'passwords' && (
              <motion.div key="pw" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-4">
                <div className={cardCls}>
                  <h3 className={`text-sm font-bold mb-3 ${headingCls}`}>Admin Password</h3>
                  <div className="space-y-2">
                    <PasswordInput label="New password" value={adminPw} onChange={setAdminPw} show={showPasswords['admin-new']} onToggle={() => setShowPasswords(p => ({ ...p, 'admin-new': !p['admin-new'] }))} />
                    <PasswordInput label="Confirm" value={adminPwConfirm} onChange={setAdminPwConfirm} show={showPasswords['admin-confirm']} onToggle={() => setShowPasswords(p => ({ ...p, 'admin-confirm': !p['admin-confirm'] }))} />
                    <button onClick={handleChangeAdminPassword} className={`w-full py-2 rounded-lg font-semibold text-sm ${primaryBtnCls}`}>{busyPasswordKey === 'admin' ? 'Updating...' : 'Update Admin Password'}</button>
                  </div>
                </div>
                {users.filter(u => u.role === 'user').map(u => (
                  <div key={u.key} className={cardCls}>
                    <h3 className={`text-sm font-bold mb-3 ${headingCls}`}>{u.display}'s Password</h3>
                    <div className="space-y-2">
                      <PasswordInput label="New password" value={userPasswords[u.key] || ''} onChange={v => setUserPasswords(p => ({ ...p, [u.key]: v }))} show={showPasswords[u.key]} onToggle={() => setShowPasswords(p => ({ ...p, [u.key]: !p[u.key] }))} />
                      <button onClick={() => handleChangeUserPassword(u.key)} className={`w-full py-2 rounded-lg font-semibold text-sm ${primaryBtnCls}`}>{busyPasswordKey === u.key ? 'Updating...' : 'Update'}</button>
                    </div>
                  </div>
                ))}
                {pwMessage && <MessageBanner message={pwMessage} />}
              </motion.div>
            )}

            {securitySection === 'addUser' && (
              <motion.div key="add" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-4">
                <div className={cardCls}>
                  <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${headingCls}`}><UserPlus className="w-4 h-4" /> Add New User</h3>
                  <div className="space-y-3">
                    <div><label className={`block text-xs font-semibold mb-1 ${labelCls}`}>Login Key</label><input type="text" placeholder="e.g. john" value={newUserKey} onChange={e => setNewUserKey(e.target.value)} className={inputCls} /><p className={`text-[10px] mt-0.5 ${labelCls}`}>Lowercase key used to log in</p></div>
                    <div><label className={`block text-xs font-semibold mb-1 ${labelCls}`}>Display Name</label><input type="text" placeholder="e.g. John Doe" value={newUserDisplay} onChange={e => setNewUserDisplay(e.target.value)} className={inputCls} /></div>
                    <div><label className={`block text-xs font-semibold mb-1 ${labelCls}`}>Password</label><PasswordInput label="" value={newUserPassword} onChange={setNewUserPassword} show={showPasswords['new-user']} onToggle={() => setShowPasswords(p => ({ ...p, 'new-user': !p['new-user'] }))} /><p className={`text-[10px] mt-0.5 ${labelCls}`}>Minimum 6 characters</p></div>
                    <div><label className={`block text-xs font-semibold mb-1 ${labelCls}`}>Role</label><div className="relative"><select value={newUserRole} onChange={e => setNewUserRole(e.target.value as UserRole)} className={selectCls}><option value="user">User</option><option value="admin">Admin</option></select><ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${labelCls}`} /></div></div>
                    <button onClick={handleAddUser} disabled={addUserBusy} className={`w-full py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${primaryBtnCls}`}>{addUserBusy ? 'Adding...' : <><UserPlus className="w-4 h-4" /> Add User</>}</button>
                  </div>
                </div>
                {addUserMessage && <MessageBanner message={addUserMessage} />}
                <UserList users={users} headingCls={headingCls} labelCls={labelCls} cardCls={cardCls} isDark={isDark} />
              </motion.div>
            )}

            {securitySection === 'changeUsername' && (
              <motion.div key="uname" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-4">
                <div className={cardCls}>
                  <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${headingCls}`}><Edit3 className="w-4 h-4" /> Change Display Name</h3>
                  <div className="space-y-3">
                    <div><label className={`block text-xs font-semibold mb-1 ${labelCls}`}>Select User</label><div className="relative"><select value={editUsernameKey} onChange={e => { setEditUsernameKey(e.target.value); const u = users.find(u => u.key === e.target.value); setEditUsernameValue(u?.display || ''); }} className={selectCls}><option value="">Choose a user...</option>{users.map(u => (<option key={u.key} value={u.key}>{u.display} ({u.key})</option>))}</select><ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${labelCls}`} /></div></div>
                    {editUsernameKey && (<><div><label className={`block text-xs font-semibold mb-1 ${labelCls}`}>New Display Name</label><input type="text" value={editUsernameValue} onChange={e => setEditUsernameValue(e.target.value)} className={inputCls} /></div><button onClick={handleChangeUsername} disabled={editUsernameBusy} className={`w-full py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${primaryBtnCls}`}>{editUsernameBusy ? 'Updating...' : <><Edit3 className="w-4 h-4" /> Update Username</>}</button></>)}
                  </div>
                </div>
                {editUsernameMessage && <MessageBanner message={editUsernameMessage} />}
              </motion.div>
            )}

            {securitySection === 'changeRole' && (
              <motion.div key="role" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-4">
                <div className={cardCls}>
                  <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${headingCls}`}><ShieldCheck className="w-4 h-4" /> Change User Role</h3>
                  <div className="space-y-3">
                    <div><label className={`block text-xs font-semibold mb-1 ${labelCls}`}>Select User</label><div className="relative"><select value={editRoleKey} onChange={e => { setEditRoleKey(e.target.value); const u = users.find(u => u.key === e.target.value); setEditRoleValue(u?.role || 'user'); }} className={selectCls}><option value="">Choose a user...</option>{users.filter(u => u.key !== 'admin').map(u => (<option key={u.key} value={u.key}>{u.display} ({u.key}) — {u.role}</option>))}</select><ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${labelCls}`} /></div><p className={`text-[10px] mt-0.5 ${labelCls}`}>The primary admin cannot be changed</p></div>
                    {editRoleKey && (<><div><label className={`block text-xs font-semibold mb-1 ${labelCls}`}>New Role</label><div className="flex gap-2">
                      <button onClick={() => setEditRoleValue('user')} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all border ${editRoleValue === 'user' ? 'bg-blue-50 border-blue-300 text-blue-700' : (isDark ? 'bg-[#252540] border-[#2a2a3e] text-gray-500' : 'bg-white border-gray-200 text-gray-400')}`}>User</button>
                      <button onClick={() => setEditRoleValue('admin')} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all border ${editRoleValue === 'admin' ? 'bg-amber-50 border-amber-300 text-amber-700' : (isDark ? 'bg-[#252540] border-[#2a2a3e] text-gray-500' : 'bg-white border-gray-200 text-gray-400')}`}>Admin</button>
                    </div></div><button onClick={handleChangeRole} disabled={editRoleBusy} className={`w-full py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${primaryBtnCls}`}>{editRoleBusy ? 'Updating...' : <><ShieldCheck className="w-4 h-4" /> Update Role</>}</button></>)}
                  </div>
                </div>
                {editRoleMessage && <MessageBanner message={editRoleMessage} />}
                <UserList users={users} headingCls={headingCls} labelCls={labelCls} cardCls={cardCls} isDark={isDark} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {activeTab === 'data' && (
        <motion.div key="data" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
          {/* ═══ REPORT SECTION ═══ */}
          <div className={cardCls}>
            <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${headingCls}`}><FileText className="w-4 h-4" /> Generate Report</h3>
            <div className="space-y-2.5">
              <button onClick={handleDownloadPDF} className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${secondaryBtnCls}`}>
                <FileText className="w-4 h-4" /> Download PDF Report
              </button>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="parent@email.com"
                  value={emailTo}
                  onChange={e => setEmailTo(e.target.value)}
                  className={inputCls}
                />
                <button onClick={handleEmailReport} className={`px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all whitespace-nowrap ${primaryBtnCls}`}>
                  <Mail className="w-4 h-4" /> Send
                </button>
              </div>
              <p className={`text-[10px] ${labelCls}`}>Opens your email client with the report summary</p>
            </div>
            {reportMessage && <div className="mt-2"><MessageBanner message={reportMessage} /></div>}
          </div>

          <button onClick={handleExport} className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${secondaryBtnCls}`}><Download className="w-4 h-4" /> Export Data as JSON</button>
          <button onClick={() => fileInputRef.current?.click()} className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${secondaryBtnCls}`}><Upload className="w-4 h-4" /> Import from JSON</button>
          <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={handleImport} className="hidden" />
          {importMessage && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-sm font-medium rounded-lg px-3 py-2 flex items-center gap-2 ${importMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{importMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}{importMessage.text}</motion.div>}
          <button onClick={handleResetData} className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all border ${isDark ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200/50'}`}><Trash2 className="w-4 h-4" /> Reset All Logged Data</button>
        </motion.div>
      )}

      {activeTab === 'cloud' && (
        <motion.div key="cloud" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
          <div className={cardCls}>
            <div className="flex items-center gap-2 mb-2"><Cloud className={`w-4 h-4 ${cloudEnabled ? 'text-green-500' : (isDark ? 'text-gray-600' : 'text-gray-400')}`} /><span className={`text-sm font-bold ${headingCls}`}>Status: {cloudEnabled ? 'Connected' : 'Not configured'}</span></div>
            {lastSynced && <p className={`text-xs ${labelCls}`}>Last synced: {lastSynced.toLocaleString()}</p>}
            <p className={`text-xs mt-2 ${labelCls}`}>When cloud is enabled, passwords and data sync across devices.</p>
          </div>
          <button onClick={onForceSync} disabled={!cloudEnabled} className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${secondaryBtnCls}`}><RefreshCw className="w-4 h-4" /> Force Sync Now</button>
          <button onClick={handleReconfigure} className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${secondaryBtnCls}`}><Settings2 className="w-4 h-4" /> {CLOUD_ENABLED ? 'View Supabase Setup Guide' : 'Set up Supabase'}</button>
        </motion.div>
      )}

      {activeTab === 'advanced' && (
        <motion.div key="advanced" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
          <button onClick={handleShowDebug} className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${secondaryBtnCls}`}><Code2 className="w-4 h-4" /> {showDebug ? 'Hide' : 'Show'} Debug Info</button>
          {showDebug && <pre className={`text-[10px] p-3 rounded-lg overflow-auto max-h-60 font-mono ${isDark ? 'bg-[#0f0f17] text-gray-300 border border-[#2a2a3e]' : isGlass ? 'bg-gray-900 text-gray-100' : 'bg-[#0f0f0f] text-gray-100'}`}>{debugText}</pre>}
          <div className={`p-4 rounded-xl text-xs ${isDark ? 'bg-[#252540]/60 text-gray-500 border border-[#2a2a3e]' : isGlass ? 'bg-gray-900/5 text-gray-500' : 'bg-[#fafafa] text-[#666]'}`}><p className="font-semibold mb-2">Current Settings</p><ul className="space-y-1 font-mono"><li>maxTime: {settings.maxTime}</li><li>penaltyRatio: {settings.penaltyRatio}</li><li>fullBlockThreshold: {settings.fullBlockThreshold}</li><li>carryForward: {settings.carryForwardEnabled ? 'on' : 'off'}</li></ul></div>
        </motion.div>
      )}
    </>
  );

  // ── Modal wrapper ──
  const modalBg = isDark ? 'bg-[#1a1a2e]' : isGlass ? 'bg-white/95 backdrop-blur-2xl' : 'bg-white';
  const modalBorder = isDark ? 'border-[#2a2a3e]' : isGlass ? '' : '';
  const modalShadow = isDark ? 'shadow-black/40' : 'shadow-black/10';
  const headerBorder = isDark ? 'border-[#2a2a3e]' : isGlass ? 'border-gray-200/50' : 'border-[#e5e5e5]';
  const tabBarBg = isDark ? 'bg-[#151528]' : isGlass ? 'bg-gray-50/50' : '';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={`absolute inset-0 ${isDark ? 'bg-black/60 backdrop-blur-md' : isGlass ? 'bg-black/30 backdrop-blur-md' : 'bg-black/50'}`} onClick={handleClose} />
          <motion.div
            initial={{ opacity: 0, scale: isDark || isGlass ? 0.9 : 0.95, y: isDark || isGlass ? 20 : 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: isDark || isGlass ? 0.9 : 0.95, y: isDark || isGlass ? 20 : 10 }}
            transition={isDark || isGlass ? { type: 'spring', damping: 25, stiffness: 300 } : undefined}
            className={`relative w-full max-w-lg rounded-${isDark || isGlass ? '3xl' : 'xl'} shadow-2xl ${modalShadow} max-h-[85vh] flex flex-col overflow-hidden ${modalBg} ${modalBorder}`}
          >
            <div className={`flex items-center justify-between p-5 border-b ${headerBorder}`}>
              <div className="flex items-center gap-2.5">
                {(isDark || isGlass) && (
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-md ${
                    isDark ? 'bg-gradient-to-br from-indigo-600 to-purple-700 shadow-indigo-600/20' : 'bg-gradient-to-br from-gray-900 to-gray-700 shadow-gray-900/20'
                  }`}><Settings2 className="w-4 h-4 text-white" /></div>
                )}
                {!isDark && !isGlass && <Settings2 className="w-5 h-5 text-[#0f0f0f]" />}
                <h2 className={`text-lg font-bold ${headingCls}`}>Settings</h2>
              </div>
              <button onClick={handleClose} className={`${isDark || isGlass ? 'w-8 h-8 rounded-full flex items-center justify-center' : ''} ${
                isDark ? 'bg-[#252540] hover:bg-[#2a2a4a] text-gray-400' : isGlass ? 'bg-gray-100 hover:bg-gray-200 text-gray-500' : 'text-[#999] hover:text-[#0f0f0f]'
              } transition-colors`}><X className={`${isDark || isGlass ? 'w-4 h-4' : 'w-5 h-5'}`} /></button>
            </div>
            <div className={`flex border-b ${headerBorder} overflow-x-auto ${tabBarBg}`}>
              {visibleTabs.map(t => {
                const Icon = t.icon;
                const active = activeTab === t.id;
                return (
                  <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-all ${
                    active
                      ? (isDark ? 'text-white border-b-2 border-indigo-500 bg-[#1a1a2e]' : isGlass ? 'text-gray-900 border-b-2 border-gray-900 bg-white' : 'text-[#0f0f0f] border-b-2 border-[#0f0f0f]')
                      : (isDark ? 'text-gray-500 hover:text-gray-300' : isGlass ? 'text-gray-500 hover:text-gray-700' : 'text-[#999] hover:text-[#666]')
                  }`}>
                    <Icon className="w-3.5 h-3.5" /> {t.label}
                  </button>
                );
              })}
            </div>
            <div className="p-5 overflow-y-auto"><AnimatePresence mode="wait">{content}</AnimatePresence></div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════
   HELPER COMPONENTS
   ═══════════════════════════════════ */

function Field({ label, hint, icon: Icon, children }: { label: string; hint: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode; }) {
  const { theme, isDark } = useTheme();
  const isGlass = theme === 'glass';
  return <div className={`p-4 rounded-xl ${isDark ? 'bg-[#252540]/60 border border-[#2a2a3e]' : isGlass ? 'bg-gray-900/5 border border-gray-200/50' : 'bg-[#fafafa] border border-[#e5e5e5]'}`}><div className="flex items-center justify-between gap-3"><div className="flex-1"><div className="flex items-center gap-2"><Icon className={`w-3.5 h-3.5 ${isDark ? 'text-gray-600' : isGlass ? 'text-gray-400' : 'text-[#999]'}`} /><label className={`text-sm font-bold ${isDark ? 'text-white' : isGlass ? 'text-gray-900' : 'text-[#0f0f0f]'}`}>{label}</label></div><p className={`text-xs mt-0.5 ml-5 ${isDark ? 'text-gray-600' : isGlass ? 'text-gray-400' : 'text-[#999]'}`}>{hint}</p></div><div className="w-32">{children}</div></div></div>;
}

function PasswordInput({ label, value, onChange, show, onToggle }: { label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void; }) {
  const { theme, isDark } = useTheme();
  const isGlass = theme === 'glass';
  const cls = isDark
    ? 'w-full pl-3 pr-10 py-2.5 rounded-xl bg-[#252540] border border-[#2a2a3e] text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30'
    : isGlass
      ? 'w-full pl-3 pr-10 py-2.5 rounded-xl bg-gray-50 border border-gray-200/80 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10'
      : 'w-full pl-3 pr-10 py-2 border border-[#e5e5e5] rounded-lg bg-white text-sm focus:outline-none focus:border-[#0f0f0f]';
  return <div>{label && <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-500' : isGlass ? 'text-gray-500' : 'text-[#666]'}`}>{label}</label>}<div className="relative"><input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)} className={cls} /><button type="button" onClick={onToggle} className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-600' : isGlass ? 'text-gray-400' : 'text-[#999]'}`}>{show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>;
}

function MessageBanner({ message }: { message: { type: 'success' | 'error'; text: string } }) {
  const { isDark } = useTheme();
  return (
    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
      className={`text-sm font-medium rounded-lg px-3 py-2.5 flex items-center gap-2 ${
        message.type === 'success'
          ? (isDark ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-green-50 text-green-700 border border-green-200')
          : (isDark ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-600 border border-red-200')
      }`}
    >
      {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {message.text}
    </motion.div>
  );
}

function UserList({ users, headingCls, labelCls, cardCls, isDark }: { users: Array<{ key: string; display: string; role: UserRole }>; headingCls: string; labelCls: string; cardCls: string; isDark: boolean }) {
  return (
    <div className={cardCls}>
      <h3 className={`text-xs font-bold mb-2 ${headingCls}`}>Current Users</h3>
      <div className="space-y-1.5">
        {users.map(u => (
          <div key={u.key} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${isDark ? 'bg-[#1a1a2e]' : 'bg-white/50'}`}>
            <div>
              <span className={`font-semibold ${headingCls}`}>{u.display}</span>
              <span className={`ml-1.5 ${labelCls}`}>({u.key})</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
              u.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
            }`}>{u.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
