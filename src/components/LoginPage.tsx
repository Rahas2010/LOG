import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Eye, EyeOff, LogIn, AlertCircle, User, Lock, Cloud, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import ThemeToggle from './ThemeToggle';
import { CLOUD_ENABLED } from '../db/supabase';
import type { UserRequest } from '../types';

// Submit a forgot-password request directly (user is not logged in)
function submitForgotPasswordRequest(username: string): { success: boolean; error?: string } {
  const key = username.toLowerCase().trim();
  if (!key) return { success: false, error: 'Enter your username' };

  // Check user exists
  const PASSWORDS_KEY = 'screentime_passwords';
  const DEFAULT_USERS: Record<string, any> = {
    admin: { password: 'Rahas@2010', role: 'admin', display: 'Rahas' },
    rahas: { password: '452010', role: 'user', display: 'Rahas Sharma' },
  };
  let passwords = { ...DEFAULT_USERS };
  try {
    const saved = localStorage.getItem(PASSWORDS_KEY);
    if (saved) passwords = { ...passwords, ...JSON.parse(saved) };
  } catch {}

  const entry = passwords[key];
  if (!entry) return { success: false, error: 'User not found' };
  if (entry.role === 'admin') return { success: false, error: 'Admin cannot use forgot password' };

  // Check if there's already a pending request
  const REQUESTS_KEY = 'screentime_requests';
  let requests: UserRequest[] = [];
  try {
    const saved = localStorage.getItem(REQUESTS_KEY);
    if (saved) requests = JSON.parse(saved);
  } catch {}

  const existing = requests.find(r => r.type === 'password_reset' && r.userKey === key && r.status === 'pending');
  if (existing) return { success: false, error: 'A password reset request is already pending' };

  const newReq: UserRequest = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: 'password_reset',
    userKey: key,
    userDisplay: entry.display,
    timestamp: new Date().toISOString(),
    status: 'pending',
    message: `Password reset requested from login page`,
  };
  requests.push(newReq);
  try { localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests)); } catch {}

  return { success: true };
}

export default function LoginPage() {
  const { login } = useAuth();
  const { theme, isDark } = useTheme();
  const isGlass = theme === 'glass';
  const cloudConfigured = CLOUD_ENABLED;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || !confirm.trim()) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    const result = await login(username, password, confirm);
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
    setLoading(false);
  };

  const handleForgotSubmit = () => {
    setForgotError('');
    const result = submitForgotPasswordRequest(forgotUsername);
    if (result.success) {
      setForgotSuccess(true);
    } else {
      setForgotError(result.error || 'Failed');
    }
  };

  const helperText = cloudConfigured
    ? 'Cloud login enabled — your account works across devices'
    : 'Local login only until cloud is configured';

  /* ══════ CLASSIC ══════ */
  if (!isGlass && !isDark) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="fixed top-6 right-6 z-50"><ThemeToggle /></div>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-[#0f0f0f] rounded-2xl flex items-center justify-center mx-auto mb-5"><Monitor className="w-8 h-8 text-white" /></div>
            <h1 className="text-3xl font-bold text-[#0f0f0f] tracking-tight">Screen Time</h1>
            <p className="text-[#666] text-sm mt-2">Sign in to continue</p>
            <p className="text-xs mt-3 text-[#999] flex items-center justify-center gap-1.5"><Cloud className="w-3 h-3" /> {helperText}</p>
          </div>

          <AnimatePresence mode="wait">
            {showForgot ? (
              <motion.div key="forgot" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <button onClick={() => { setShowForgot(false); setForgotSuccess(false); setForgotError(''); }} className="flex items-center gap-2 text-sm text-[#666] hover:text-[#0f0f0f] transition-colors"><ArrowLeft className="w-4 h-4" /> Back to login</button>
                <div className="bg-[#fafafa] border border-[#e5e5e5] rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4"><KeyRound className="w-5 h-5 text-[#0f0f0f]" /><h3 className="text-lg font-bold text-[#0f0f0f]">Forgot Password</h3></div>
                  {forgotSuccess ? (
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg p-4"><CheckCircle2 className="w-5 h-5" /><div><p className="font-semibold text-sm">Request submitted!</p><p className="text-xs mt-0.5">Ask your admin to check the Requests tab in Settings.</p></div></div>
                  ) : (
                    <>
                      <p className="text-sm text-[#666] mb-4">Enter your username and we'll send a reset request to your admin.</p>
                      <input type="text" value={forgotUsername} onChange={e => { setForgotUsername(e.target.value); setForgotError(''); }} placeholder="Your username" className="w-full px-3.5 py-3 border border-[#e5e5e5] rounded-lg bg-white text-[#0f0f0f] font-medium focus:outline-none focus:border-[#0f0f0f] mb-3" />
                      {forgotError && <p className="text-xs text-red-500 font-medium mb-3 flex items-center gap-1.5"><AlertCircle className="w-3 h-3" />{forgotError}</p>}
                      <button onClick={handleForgotSubmit} className="w-full py-2.5 rounded-lg bg-[#0f0f0f] text-white font-semibold text-sm hover:bg-[#333]">Submit Reset Request</button>
                    </>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.form key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#0f0f0f] mb-2">Username</label>
                  <div className="relative"><User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" /><input type="text" value={username} onChange={e => { setUsername(e.target.value); setError(''); }} placeholder="Enter username" autoFocus className="w-full pl-11 pr-4 py-3 border border-[#e5e5e5] rounded-lg bg-[#fafafa] text-[#0f0f0f] font-medium focus:outline-none focus:border-[#0f0f0f] focus:bg-white focus:shadow-[0_0_0_3px_rgba(15,15,15,0.05)] transition-all placeholder:text-[#bbb]" /></div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#0f0f0f] mb-2">Password</label>
                  <div className="relative"><Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" /><input type={showPass ? 'text' : 'password'} value={password} onChange={e => { setPassword(e.target.value); setError(''); }} placeholder="Enter password" className="w-full pl-11 pr-12 py-3 border border-[#e5e5e5] rounded-lg bg-[#fafafa] text-[#0f0f0f] font-medium focus:outline-none focus:border-[#0f0f0f] focus:bg-white focus:shadow-[0_0_0_3px_rgba(15,15,15,0.05)] transition-all placeholder:text-[#bbb]" /><button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#666]">{showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#0f0f0f] mb-2">Confirm Password</label>
                  <div className="relative"><Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" /><input type={showConfirm ? 'text' : 'password'} value={confirm} onChange={e => { setConfirm(e.target.value); setError(''); }} placeholder="Re-enter password" className="w-full pl-11 pr-12 py-3 border border-[#e5e5e5] rounded-lg bg-[#fafafa] text-[#0f0f0f] font-medium focus:outline-none focus:border-[#0f0f0f] focus:bg-white focus:shadow-[0_0_0_3px_rgba(15,15,15,0.05)] transition-all placeholder:text-[#bbb]" /><button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#666]">{showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div>
                </div>
                <AnimatePresence>{error && (<motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex items-center gap-2 text-[#ef4444] text-sm font-medium bg-[#fee2e2] border border-[#ef4444]/20 rounded-lg px-4 py-3"><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</motion.div>)}</AnimatePresence>
                <button type="submit" disabled={loading} className="w-full py-3 rounded-lg bg-[#0f0f0f] text-white font-semibold text-sm hover:bg-[#333] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">{loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><LogIn className="w-4 h-4" /> Sign In</>}</button>
                <button type="button" onClick={() => setShowForgot(true)} className="w-full text-center text-xs text-[#999] hover:text-[#666] transition-colors py-1 flex items-center justify-center gap-1.5"><KeyRound className="w-3 h-3" /> Forgot Password?</button>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="text-center text-xs text-[#999] mt-8">{cloudConfigured ? 'Passwords and data sync through the cloud' : 'Configure cloud to sync login across devices'}</p>
        </motion.div>
      </div>
    );
  }

  /* ══════ GLASS + DARK ══════ */
  const inputCls = isDark
    ? 'w-full pl-12 pr-4 py-3.5 rounded-2xl bg-[#252540] border border-[#2a2a3e] text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all placeholder:text-gray-600'
    : 'w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white transition-all placeholder:text-gray-300';

  const inputPwCls = isDark
    ? 'w-full pl-12 pr-12 py-3.5 rounded-2xl bg-[#252540] border border-[#2a2a3e] text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all placeholder:text-gray-600'
    : 'w-full pl-12 pr-12 py-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white transition-all placeholder:text-gray-300';

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-[#0f0f17] dark-gradient-mesh' : 'gradient-mesh'}`}>
      <div className="fixed top-6 right-6 z-50"><ThemeToggle /></div>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-indigo-500/10' : 'bg-purple-300/20'}`} />
        <div className={`absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-purple-500/10' : 'bg-blue-300/20'}`} />
      </div>
      <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }} className="relative w-full max-w-md">
        <div className={`${isDark ? 'dark-card' : 'glass-card'} p-8 md:p-10 overflow-hidden`}>
          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${isDark ? 'from-indigo-500 via-purple-500 to-pink-500' : 'from-blue-500 via-purple-500 to-pink-500'}`} />
          <div className="text-center mb-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }} className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-xl ${isDark ? 'bg-gradient-to-br from-indigo-600 to-purple-700 shadow-indigo-600/20' : 'bg-gradient-to-br from-gray-900 to-gray-700 shadow-gray-900/20'}`}><Monitor className="w-7 h-7 text-white" /></motion.div>
            <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{showForgot ? 'Reset Password' : 'Welcome Back'}</h1>
            <p className={`text-sm mt-1.5 font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{showForgot ? 'Request a password reset from admin' : 'Sign in to Screen Time'}</p>
            {!showForgot && <p className={`text-[11px] mt-3 font-medium flex items-center justify-center gap-1.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}><Cloud className="w-3.5 h-3.5" /> {helperText}</p>}
          </div>

          <AnimatePresence mode="wait">
            {showForgot ? (
              <motion.div key="forgot" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <button onClick={() => { setShowForgot(false); setForgotSuccess(false); setForgotError(''); }} className={`flex items-center gap-2 text-sm transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-700'}`}><ArrowLeft className="w-4 h-4" /> Back to login</button>
                {forgotSuccess ? (
                  <div className={`flex items-center gap-3 rounded-2xl p-5 ${isDark ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-200'}`}>
                    <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                    <div>
                      <p className={`font-semibold text-sm ${isDark ? 'text-green-400' : 'text-green-700'}`}>Request submitted!</p>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-green-500/70' : 'text-green-600'}`}>Ask your admin to check the Requests tab in Settings.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Enter your username and a reset request will be sent to admin.</p>
                    <div className="relative">
                      <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                      <input type="text" value={forgotUsername} onChange={e => { setForgotUsername(e.target.value); setForgotError(''); }} placeholder="Your username" autoFocus className={inputCls} />
                    </div>
                    {forgotError && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-xs font-medium flex items-center gap-1.5 ${isDark ? 'text-red-400' : 'text-red-500'}`}><AlertCircle className="w-3 h-3" />{forgotError}</motion.div>}
                    <motion.button whileTap={{ scale: 0.97 }} onClick={handleForgotSubmit} className={`w-full py-3.5 rounded-2xl font-semibold text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${isDark ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20' : 'bg-gray-900 text-white hover:bg-gray-800 shadow-gray-900/15'}`}><KeyRound className="w-4 h-4" /> Submit Reset Request</motion.button>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.form key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Username</label>
                  <div className="relative"><User className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} /><input type="text" value={username} onChange={e => { setUsername(e.target.value); setError(''); }} placeholder="Enter username" autoFocus className={inputCls} /></div>
                </div>
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Password</label>
                  <div className="relative"><Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} /><input type={showPass ? 'text' : 'password'} value={password} onChange={e => { setPassword(e.target.value); setError(''); }} placeholder="Enter password" className={inputPwCls} /><button type="button" onClick={() => setShowPass(!showPass)} className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-600 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'}`}>{showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div>
                </div>
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Confirm Password</label>
                  <div className="relative"><Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} /><input type={showConfirm ? 'text' : 'password'} value={confirm} onChange={e => { setConfirm(e.target.value); setError(''); }} placeholder="Re-enter password" className={inputPwCls} /><button type="button" onClick={() => setShowConfirm(!showConfirm)} className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-600 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'}`}>{showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div>
                </div>
                <AnimatePresence>{error && (<motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -8, height: 0 }} className={`flex items-center gap-2.5 text-red-500 text-sm font-medium rounded-2xl px-4 py-3 border ${isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200/50'}`}><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</motion.div>)}</AnimatePresence>
                <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={loading} className={`w-full py-3.5 rounded-2xl font-semibold text-sm transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 ${isDark ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20' : 'bg-gray-900 text-white hover:bg-gray-800 shadow-gray-900/15'}`}>{loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><LogIn className="w-4 h-4" /> Sign In</>}</motion.button>
                <button type="button" onClick={() => setShowForgot(true)} className={`w-full text-center text-xs py-1 flex items-center justify-center gap-1.5 transition-colors ${isDark ? 'text-gray-600 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'}`}><KeyRound className="w-3 h-3" /> Forgot Password?</button>
              </motion.form>
            )}
          </AnimatePresence>

          <p className={`text-center text-xs font-medium mt-6 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{cloudConfigured ? 'Passwords and data sync through the cloud' : 'Configure cloud to sync login across devices'}</p>
        </div>
      </motion.div>
    </div>
  );
}
