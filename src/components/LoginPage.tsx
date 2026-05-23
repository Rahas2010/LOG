import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Eye, EyeOff, LogIn, AlertCircle, User, Lock } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import ThemeToggle from './ThemeToggle';

export default function LoginPage() {
  const { login } = useAuth();
  const { theme } = useTheme();
  const isGlass = theme === 'glass';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
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
    setTimeout(() => {
      const result = login(username, password, confirm);
      if (!result.success) {
        setError(result.error || 'Login failed');
      }
      setLoading(false);
    }, 500);
  };

  /* ═══════════════ CLASSIC ═══════════════ */
  if (!isGlass) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="fixed top-6 right-6 z-50"><ThemeToggle /></div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }} className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-[#0f0f0f] rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Monitor className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-[#0f0f0f] tracking-tight">Screen Time</h1>
            <p className="text-[#666] text-sm mt-2">Sign in to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#0f0f0f] mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
                <input type="text" value={username}
                  onChange={e => { setUsername(e.target.value); setError(''); }}
                  placeholder="Enter username" autoFocus
                  className="w-full pl-11 pr-4 py-3 border border-[#e5e5e5] rounded-lg bg-[#fafafa] text-[#0f0f0f] font-medium
                           focus:outline-none focus:border-[#0f0f0f] focus:bg-white focus:shadow-[0_0_0_3px_rgba(15,15,15,0.05)]
                           transition-all placeholder:text-[#bbb]" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0f0f0f] mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
                <input type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="Enter password"
                  className="w-full pl-11 pr-12 py-3 border border-[#e5e5e5] rounded-lg bg-[#fafafa] text-[#0f0f0f] font-medium
                           focus:outline-none focus:border-[#0f0f0f] focus:bg-white focus:shadow-[0_0_0_3px_rgba(15,15,15,0.05)]
                           transition-all placeholder:text-[#bbb]" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#666]">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0f0f0f] mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
                <input type={showConfirm ? 'text' : 'password'} value={confirm}
                  onChange={e => { setConfirm(e.target.value); setError(''); }}
                  placeholder="Re-enter password"
                  className="w-full pl-11 pr-12 py-3 border border-[#e5e5e5] rounded-lg bg-[#fafafa] text-[#0f0f0f] font-medium
                           focus:outline-none focus:border-[#0f0f0f] focus:bg-white focus:shadow-[0_0_0_3px_rgba(15,15,15,0.05)]
                           transition-all placeholder:text-[#bbb]" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#666]">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="flex items-center gap-2 text-[#ef4444] text-sm font-medium bg-[#fee2e2] border border-[#ef4444]/20 rounded-lg px-4 py-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-lg bg-[#0f0f0f] text-white font-semibold text-sm
                       hover:bg-[#333] transition-all disabled:opacity-60 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (<><LogIn className="w-4 h-4" /> Sign In</>)}
            </button>
          </form>

          <p className="text-center text-xs text-[#999] mt-8">
            Data is stored locally on this device
          </p>
        </motion.div>
      </div>
    );
  }

  /* ═══════════════ GLASS ═══════════════ */
  return (
    <div className="min-h-screen gradient-mesh flex items-center justify-center p-4">
      <div className="fixed top-6 right-6 z-50"><ThemeToggle /></div>

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-200/10 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative w-full max-w-md">
        <div className="glass-card p-8 md:p-10 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

          <div className="text-center mb-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
              className="w-16 h-16 bg-gradient-to-br from-gray-900 to-gray-700 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-gray-900/20">
              <Monitor className="w-7 h-7 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome Back</h1>
            <p className="text-gray-400 text-sm mt-1.5 font-medium">Sign in to Screen Time</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={username}
                  onChange={e => { setUsername(e.target.value); setError(''); }}
                  placeholder="Enter username" autoFocus
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-200/80
                           text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-gray-900/10
                           focus:border-gray-300 focus:bg-white transition-all placeholder:text-gray-300" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="Enter password"
                  className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-gray-50 border border-gray-200/80
                           text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-gray-900/10
                           focus:border-gray-300 focus:bg-white transition-all placeholder:text-gray-300" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type={showConfirm ? 'text' : 'password'} value={confirm}
                  onChange={e => { setConfirm(e.target.value); setError(''); }}
                  placeholder="Re-enter password"
                  className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-gray-50 border border-gray-200/80
                           text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-gray-900/10
                           focus:border-gray-300 focus:bg-white transition-all placeholder:text-gray-300" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  className="flex items-center gap-2.5 text-red-600 text-sm font-medium bg-red-50 rounded-2xl px-4 py-3 border border-red-200/50">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gray-900 text-white font-semibold text-sm
                       hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/15
                       disabled:opacity-60 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2 mt-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (<><LogIn className="w-4 h-4" /> Sign In</>)}
            </motion.button>
          </form>

          <p className="text-center text-xs text-gray-400 font-medium mt-6">
            Data is stored locally on this device
          </p>
        </div>
      </motion.div>
    </div>
  );
}
