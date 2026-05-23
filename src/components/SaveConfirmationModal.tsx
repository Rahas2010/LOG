import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, Lock, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';

interface SaveConfirmationModalProps {
  isOpen: boolean;
  actionLabel?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function SaveConfirmationModal({ isOpen, actionLabel = 'save this entry', onClose, onConfirm }: SaveConfirmationModalProps) {
  const { verifyPassword, user } = useAuth();
  const { theme, isDark } = useTheme();
  const isGlass = theme === 'glass';

  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = () => {
    if (verifyPassword(password)) {
      setPassword('');
      setError(false);
      onConfirm();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError(false);
    onClose();
  };

  /* ══════ CLASSIC ══════ */
  if (!isGlass && !isDark) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-xl p-8 shadow-2xl">
              <button onClick={handleClose}
                className="absolute top-4 right-4 text-[#999] hover:text-[#0f0f0f] transition-colors">
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-xl font-bold text-[#0f0f0f] mb-2">Confirm Action</h3>
              <p className="text-sm text-[#666] mb-5">
                Enter your password to {actionLabel}
              </p>

              <label className="block text-sm font-semibold text-[#0f0f0f] mb-2">
                Password <span className="text-[#999] font-normal">({user?.username})</span>
              </label>
              <div className="relative mb-1">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(false); }}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  autoFocus
                  placeholder="Your password"
                  className={`w-full pl-11 pr-12 py-3 border rounded-lg text-base font-medium transition-all
                    ${error
                      ? 'border-[#ef4444] bg-[#fee2e2] focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]'
                      : 'border-[#e5e5e5] bg-[#fafafa] focus:border-[#0f0f0f] focus:bg-white focus:shadow-[0_0_0_3px_rgba(15,15,15,0.05)]'
                    } focus:outline-none`}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#666]">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-xs text-[#ef4444] font-medium mb-3 flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3" /> Incorrect password
                </motion.p>
              )}
              {!error && <div className="mb-3" />}

              <div className="grid grid-cols-2 gap-3 mt-2">
                <button onClick={handleClose}
                  className="py-2.5 rounded-lg border border-[#e5e5e5] bg-white text-[#0f0f0f] font-semibold text-sm hover:bg-[#f5f5f5]">
                  Cancel
                </button>
                <button onClick={handleSubmit}
                  className="py-2.5 rounded-lg bg-[#0f0f0f] text-white font-semibold text-sm hover:bg-[#333]">
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  /* ══════ GLASS + DARK ══════ */
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={`absolute inset-0 ${isDark ? 'bg-black/60 backdrop-blur-md' : 'bg-black/30 backdrop-blur-md'}`} onClick={handleClose} />
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden ${
              isDark
                ? 'bg-[#1a1a2e]/95 backdrop-blur-2xl shadow-black/30'
                : 'bg-white/95 backdrop-blur-2xl shadow-black/10'
            }`}>
            <button onClick={handleClose}
              className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors z-10 ${
                isDark ? 'bg-[#252540] hover:bg-[#2a2a4a]' : 'bg-gray-100 hover:bg-gray-200'
              }`}>
              <X className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>

            <div className="p-8">
              <div className="flex justify-center mb-5">
                <motion.div animate={error ? { x: [-5, 5, -5, 5, 0] } : {}}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                    error
                      ? 'bg-gradient-to-br from-red-400 to-rose-500 shadow-red-500/25'
                      : isDark
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/25'
                        : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/25'
                  }`}>
                  <ShieldCheck className="w-7 h-7 text-white" />
                </motion.div>
              </div>

              <h3 className={`text-xl font-bold text-center mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Confirm Action</h3>
              <p className={`text-sm text-center mb-6 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Enter your password to {actionLabel}
              </p>

              <div className="mb-5">
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Password <span className={isDark ? 'text-gray-600' : 'text-gray-400'}>({user?.username})</span>
                </label>
                <div className="relative">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(false); }}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    autoFocus
                    placeholder="Your password"
                    className={`w-full pl-12 pr-12 py-3.5 rounded-2xl font-medium text-base
                              border-2 transition-all duration-300 focus:outline-none ${
                                isDark
                                  ? `bg-[#252540] text-white placeholder:text-gray-600 ${error
                                      ? 'border-red-500/50 bg-red-500/10 focus:ring-2 focus:ring-red-500/20'
                                      : 'border-[#2a2a3e] focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20'}`
                                  : `bg-gray-50 text-gray-900 placeholder:text-gray-300 ${error
                                      ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200'
                                      : 'border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-100'}`
                              }`}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-600 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'}`}>
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {error && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-500 font-medium text-center mt-2 flex items-center justify-center gap-1.5">
                    <AlertCircle className="w-3 h-3" /> Incorrect password
                  </motion.p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleClose}
                  className={`py-3.5 rounded-2xl font-semibold text-sm ${
                    isDark ? 'bg-[#252540] text-gray-300 hover:bg-[#2a2a4a]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                  Cancel
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit}
                  className={`py-3.5 rounded-2xl font-semibold text-sm shadow-lg ${
                    isDark
                      ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20'
                      : 'bg-gray-900 text-white hover:bg-gray-800 shadow-gray-900/15'
                  }`}>
                  Confirm
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
