import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X, AlertCircle } from 'lucide-react';
import { useTheme } from '../ThemeContext';

interface OverrideModalProps {
  isOpen: boolean;
  dateKey: string;
  onClose: () => void;
  onConfirm: (dateKey: string, password: string) => boolean;
}

export default function OverrideModal({ isOpen, dateKey, onClose, onConfirm }: OverrideModalProps) {
  const { theme, isDark } = useTheme();
  const isGlass = theme === 'glass';
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = () => {
    const result = onConfirm(dateKey, password);
    if (result) {
      setSuccess(true);
      setError(false);
      setTimeout(() => { setSuccess(false); setPassword(''); onClose(); }, 1200);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  const handleClose = () => { setPassword(''); setError(false); setSuccess(false); onClose(); };

  /* ───── CLASSIC THEME ───── */
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
              <h3 className="text-xl font-bold text-[#0f0f0f] mb-2">
                {success ? 'Block Removed!' : 'Admin Override'}
              </h3>
              <p className="text-sm text-[#666] mb-5">
                {success ? 'Penalty has been cleared' : 'Enter admin password to remove penalty block'}
              </p>

              {!success && (
                <>
                  <input type="password" value={password}
                    onChange={e => { setPassword(e.target.value); setError(false); }}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    placeholder="Password"
                    autoFocus
                    className={`w-full px-3.5 py-3 border rounded-lg text-base bg-[#fafafa] mb-1
                             focus:outline-none focus:bg-white transition-all
                             ${error ? 'border-[#ef4444] bg-[#fee2e2] focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]'
                                     : 'border-[#e5e5e5] focus:border-[#0f0f0f] focus:shadow-[0_0_0_3px_rgba(15,15,15,0.05)]'}`} />
                  {error && <p className="text-xs text-[#ef4444] font-medium mb-3">Incorrect password</p>}
                  {!error && <div className="mb-3" />}

                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleClose}
                      className="py-2.5 rounded-lg border border-[#e5e5e5] bg-white text-[#0f0f0f] font-semibold text-sm hover:bg-[#f5f5f5] transition-colors">
                      Cancel
                    </button>
                    <button onClick={handleSubmit}
                      className="py-2.5 rounded-lg bg-[#0f0f0f] text-white font-semibold text-sm hover:bg-[#333] transition-colors">
                      Confirm
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  /* ───── GLASS + DARK THEME ───── */
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
              <div className="flex justify-center mb-6">
                <motion.div
                  animate={success ? { scale: [1, 1.2, 1] } : error ? { x: [-5, 5, -5, 5, 0] } : {}}
                  className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg ${
                    success ? 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-green-500/25'
                    : error ? 'bg-gradient-to-br from-red-400 to-rose-500 shadow-red-500/25'
                    : isDark ? 'bg-gradient-to-br from-indigo-600 to-purple-700 shadow-indigo-600/25'
                    : 'bg-gradient-to-br from-gray-800 to-gray-900 shadow-gray-900/25'}`}>
                  {success ? <ShieldCheck className="w-8 h-8 text-white" />
                   : error ? <AlertCircle className="w-8 h-8 text-white" />
                   : <ShieldCheck className="w-8 h-8 text-white" />}
                </motion.div>
              </div>

              <h3 className={`text-xl font-bold text-center mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {success ? 'Block Removed!' : 'Admin Override'}
              </h3>
              <p className={`text-sm text-center mb-6 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                {success ? 'Penalty has been cleared for this day' : 'Enter admin credentials to remove penalty block'}
              </p>

              {!success && (
                <>
                  <div className="mb-6">
                    <input type="password" value={password}
                      onChange={e => { setPassword(e.target.value); setError(false); }}
                      onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                      placeholder="Enter admin password" autoFocus
                      className={`w-full px-5 py-4 rounded-2xl font-medium text-center text-lg tracking-widest
                               border-2 transition-all duration-300 placeholder:tracking-normal placeholder:text-sm
                               focus:outline-none ${
                                 isDark
                                   ? `bg-[#252540] text-white placeholder:text-gray-600 ${error
                                       ? 'border-red-500/50 bg-red-500/10 focus:ring-2 focus:ring-red-500/20'
                                       : 'border-[#2a2a3e] focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20'}`
                                   : `bg-gray-50 text-gray-900 placeholder:text-gray-300 ${error
                                       ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200'
                                       : 'border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-100'}`
                               }`} />
                    {error && (
                      <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-500 font-medium text-center mt-2">
                        Incorrect password. Try again.
                      </motion.p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <motion.button whileTap={{ scale: 0.97 }} onClick={handleClose}
                      className={`py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 ${
                        isDark ? 'bg-[#252540] text-gray-300 hover:bg-[#2a2a4a]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}>
                      Cancel
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit}
                      className={`py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 shadow-lg ${
                        isDark
                          ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20'
                          : 'bg-gray-900 text-white hover:bg-gray-800 shadow-gray-900/15'
                      }`}>
                      Confirm
                    </motion.button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
