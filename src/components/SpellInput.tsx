import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, RotateCcw, ShieldAlert, Save, Lock, Timer, CalendarClock, SendHorizontal, Info } from 'lucide-react';
import type { DailyData } from '../types';
import { useTheme } from '../ThemeContext';
import { useAuth } from '../AuthContext';
import SaveConfirmationModal from './SaveConfirmationModal';

interface SpellInputProps {
  dateKey: string;
  dailyData: DailyData;
  isFullyBlocked: boolean;
  blockedMinutes: number;
  effectiveLimit: number;
  isAdmin: boolean;
  isFutureDate: boolean;
  onUpdate: (dateKey: string, data: DailyData) => void;
  onReset: (dateKey: string) => void;
  onOverride: () => void;
}

export default function SpellInput({
  dateKey, dailyData, isFullyBlocked, blockedMinutes, effectiveLimit, isAdmin, isFutureDate, onUpdate, onReset, onOverride
}: SpellInputProps) {
  const { theme, isDark } = useTheme();
  const isGlass = theme === 'glass';
  const { submitRequest } = useAuth();

  const [spell1, setSpell1] = useState(dailyData.spell1 || 0);
  const [spell2, setSpell2] = useState(dailyData.spell2 || 0);
  const [spell3, setSpell3] = useState(dailyData.spell3 || 0);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    setSpell1(dailyData.spell1 || 0);
    setSpell2(dailyData.spell2 || 0);
    setSpell3(dailyData.spell3 || 0);
    setRequestSent(false);
  }, [dailyData, dateKey]);

  const requestSave = () => {
    if (isFutureDate || isFullyBlocked) return;
    if (isAdmin) {
      setShowSaveConfirm(true);
    } else {
      // User: submit for admin approval
      submitRequest('edit_approval', {
        dateKey,
        spellData: { spell1, spell2, spell3 },
      });
      setRequestSent(true);
      setTimeout(() => setRequestSent(false), 3000);
    }
  };

  const confirmSave = () => {
    onUpdate(dateKey, { spell1, spell2, spell3 });
    setShowSaveConfirm(false);
  };

  const requestReset = () => {
    if (isFutureDate) return;
    if (isAdmin) {
      setShowResetConfirm(true);
    }
    // Users cannot reset — only admin
  };

  const confirmReset = () => {
    setSpell1(0);
    setSpell2(0);
    setSpell3(0);
    onReset(dateKey);
    setShowResetConfirm(false);
  };

  const formatDate = (key: string) => {
    const d = new Date(key + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const total = spell1 + spell2 + spell3;
  const isOverLimit = total > effectiveLimit;
  const disableEditing = isFutureDate || isFullyBlocked;

  // Users can edit the inputs but submit goes to admin for approval
  const userReadOnly = !isAdmin && isFutureDate;

  const futureBannerClassic = isFutureDate && (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-5 flex items-center gap-3">
      <CalendarClock className="w-4 h-4 text-blue-700 flex-shrink-0" />
      <div>
        <p className="text-sm font-semibold text-blue-700">Future date is view-only</p>
        <p className="text-xs text-blue-600">You can't add or reset time for tomorrow or later dates.</p>
      </div>
    </div>
  );

  const futureBannerGlassDark = isFutureDate && (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mx-6 md:mx-8 mt-4">
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <CalendarClock className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-white text-sm font-semibold">Future date is view-only</p>
          <p className="text-white/70 text-xs">Limits for the next day can't be added manually.</p>
        </div>
      </div>
    </motion.div>
  );

  const userInfoBanner = !isAdmin && !isFutureDate && !isFullyBlocked && (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
      isDark ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
        : isGlass ? 'bg-blue-50 text-blue-600 border border-blue-200/50'
        : 'bg-blue-50 text-blue-700 border border-blue-200'
    }`}>
      <Info className="w-3.5 h-3.5 flex-shrink-0" />
      <span>Your edits will be sent to admin for approval</span>
    </div>
  );

  const modals = (
    <>
      <SaveConfirmationModal
        isOpen={showSaveConfirm}
        actionLabel="save this time entry"
        onClose={() => setShowSaveConfirm(false)}
        onConfirm={confirmSave}
      />
      <SaveConfirmationModal
        isOpen={showResetConfirm}
        actionLabel="reset this time entry"
        onClose={() => setShowResetConfirm(false)}
        onConfirm={confirmReset}
      />
    </>
  );

  /* ───── CLASSIC THEME ───── */
  if (!isGlass && !isDark) {
    return (
      <>
        <div className="bg-white border border-[#e5e5e5] rounded-xl p-7 transition-all duration-300 hover:border-[#d0d0d0] hover:shadow-sm">
          <div className="text-lg font-semibold text-[#0f0f0f] mb-1">Log Time</div>
          <div className="text-sm text-[#666] mb-5">{formatDate(dateKey)}</div>

          {futureBannerClassic}
          {userInfoBanner && <div className="mb-5">{userInfoBanner}</div>}

          {isFullyBlocked && (
            <div className="bg-[#fee2e2] border border-[#ef4444] rounded-lg p-4 mb-5 flex items-center gap-3">
              <Lock className="w-4 h-4 text-[#991b1b] flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#991b1b]">Day is Fully Blocked</p>
                <p className="text-xs text-[#991b1b]/70">No screen time allowed due to penalty</p>
              </div>
            </div>
          )}

          {!isFullyBlocked && blockedMinutes > 0 && (
            <div className="bg-orange-50 border border-orange-300 rounded-lg p-4 mb-5 flex items-center gap-3">
              <Timer className="w-4 h-4 text-orange-700 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-orange-700">{blockedMinutes} min blocked</p>
                <p className="text-xs text-orange-600">Available time: {effectiveLimit} min</p>
              </div>
            </div>
          )}

          {!isFullyBlocked && (
            <>
              <div className="grid grid-cols-3 gap-4 mb-5">
                {[
                  { label: 'Spell 1', value: spell1, setter: setSpell1 },
                  { label: 'Spell 2', value: spell2, setter: setSpell2 },
                  { label: 'Spell 3', value: spell3, setter: setSpell3 },
                ].map(s => (
                  <div key={s.label}>
                    <label className="block text-sm font-semibold text-[#0f0f0f] mb-2">{s.label}</label>
                    <input
                      type="number"
                      value={s.value || ''}
                      min={0}
                      placeholder="0"
                      readOnly={userReadOnly}
                      disabled={userReadOnly}
                      onChange={e => s.setter(Math.max(0, parseInt(e.target.value) || 0))}
                      className={`w-full px-3 py-2.5 border border-[#e5e5e5] rounded-lg text-base bg-[#fafafa] font-medium transition-all ${
                        userReadOnly ? 'opacity-60 cursor-not-allowed' : 'focus:outline-none focus:border-[#0f0f0f] focus:bg-white focus:shadow-[0_0_0_3px_rgba(15,15,15,0.05)]'
                      }`}
                    />
                  </div>
                ))}
              </div>

              <div className={`text-center text-sm font-semibold mb-4 ${isOverLimit ? 'text-[#ef4444]' : 'text-[#666]'}`}>
                Total: {total} / {effectiveLimit} min
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <button
                  onClick={requestSave}
                  disabled={disableEditing || requestSent}
                  className={`py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                    requestSent ? 'bg-green-500 text-white' : 'bg-[#0f0f0f] text-white hover:bg-[#333]'
                  }`}
                >
                  {requestSent ? <>✓ Sent</> : isAdmin ? 'Update' : <><SendHorizontal className="w-4 h-4" /> Submit</>}
                </button>
                {isAdmin && (
                  <button
                    onClick={requestReset}
                    disabled={isFutureDate}
                    className="py-2.5 rounded-lg border border-[#e5e5e5] bg-white text-[#0f0f0f] font-semibold text-sm hover:bg-[#f5f5f5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Reset
                  </button>
                )}
                {!isAdmin && (
                  <div className="py-2.5 rounded-lg border border-[#e5e5e5] bg-[#fafafa] text-[#999] font-semibold text-sm flex items-center justify-center cursor-not-allowed opacity-50">
                    Reset
                  </div>
                )}
              </div>
            </>
          )}

          {isAdmin && (
            <button onClick={onOverride}
              className="w-full py-2.5 rounded-lg bg-[#ef4444] text-white font-semibold text-sm hover:bg-[#dc2626] transition-colors flex items-center justify-center gap-2">
              <ShieldAlert className="w-4 h-4" /> Admin Override
            </button>
          )}
        </div>
        {modals}
      </>
    );
  }

  /* ───── GLASS + DARK THEME ───── */
  return (
    <>
      <div className={isDark ? 'dark-card overflow-hidden' : 'glass-card overflow-hidden'}>
        <div className="px-6 pt-6 md:px-8 md:pt-8 pb-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${
                isDark
                  ? 'bg-gradient-to-br from-indigo-600 to-purple-700 shadow-indigo-600/20'
                  : 'bg-gradient-to-br from-gray-900 to-gray-700 shadow-gray-900/15'
              }`}>
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Log Time</h2>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{formatDate(dateKey)}</p>
              </div>
            </div>
          </div>
        </div>

        {futureBannerGlassDark}

        {isFullyBlocked && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mx-6 md:mx-8 mt-4">
            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Lock className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Day is Fully Blocked</p>
                <p className="text-white/70 text-xs">No screen time allowed due to penalty carry-forward</p>
              </div>
            </div>
          </motion.div>
        )}

        {!isFullyBlocked && blockedMinutes > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mx-6 md:mx-8 mt-4">
            <div className="bg-gradient-to-r from-orange-400 to-orange-500 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Timer className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{blockedMinutes} min blocked</p>
                <p className="text-white/70 text-xs">Available time reduced to {effectiveLimit} min today</p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="p-6 md:p-8 space-y-5">
          {userInfoBanner}

          {!isFullyBlocked && (
            <>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Spell 1', value: spell1, setter: setSpell1, gradient: 'from-blue-500 to-cyan-500' },
                  { label: 'Spell 2', value: spell2, setter: setSpell2, gradient: 'from-purple-500 to-pink-500' },
                  { label: 'Spell 3', value: spell3, setter: setSpell3, gradient: 'from-orange-500 to-amber-500' },
                ].map((spell) => (
                  <div key={spell.label} className="space-y-2">
                    <label className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{spell.label}</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={spell.value || ''}
                        min={0}
                        placeholder="0"
                        readOnly={userReadOnly}
                        disabled={userReadOnly}
                        onChange={(e) => spell.setter(Math.max(0, parseInt(e.target.value) || 0))}
                        className={`w-full px-4 py-3.5 rounded-2xl font-semibold text-lg transition-all duration-200 ${
                          isDark
                            ? `bg-[#252540] border border-[#2a2a3e] text-white placeholder:text-gray-600 ${
                                userReadOnly ? 'opacity-60 cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 focus:bg-[#1f1f38]'
                              }`
                            : `bg-gray-50 border border-gray-200/80 text-gray-900 placeholder:text-gray-300 ${
                                userReadOnly ? 'opacity-60 cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white'
                              }`
                        }`}
                      />
                      <div className={`absolute top-0 left-0 w-full h-0.5 rounded-t-2xl bg-gradient-to-r ${spell.gradient} opacity-60`} />
                    </div>
                    <p className={`text-xs text-center font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{spell.value || 0} min</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center py-2">
                <div className={`flex items-center gap-2 rounded-full px-5 py-2 transition-colors duration-200 ${
                  isOverLimit
                    ? (isDark ? 'bg-red-500/15' : 'bg-red-100')
                    : (isDark ? 'bg-[#252540]' : 'bg-gray-100')
                }`}>
                  <span className={`text-sm font-bold ${isOverLimit ? 'text-red-500' : (isDark ? 'text-white' : 'text-gray-900')}`}>{total}</span>
                  <span className={`text-xs ${isOverLimit ? 'text-red-400' : (isDark ? 'text-gray-500' : 'text-gray-400')}`}>/ {effectiveLimit} min</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <motion.button whileTap={{ scale: disableEditing || requestSent ? 1 : 0.97 }} onClick={requestSave}
                  disabled={disableEditing || requestSent}
                  className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${
                    requestSent
                      ? 'bg-green-500 text-white shadow-green-500/20 !opacity-100'
                      : isDark
                        ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20'
                        : 'bg-gray-900 text-white hover:bg-gray-800 shadow-gray-900/15'
                  }`}>
                  {requestSent ? <>✓ Sent for Approval</> : isAdmin ? <><Save className="w-4 h-4" /> Save</> : <><SendHorizontal className="w-4 h-4" /> Submit</>}
                </motion.button>
                {isAdmin ? (
                  <motion.button whileTap={{ scale: isFutureDate ? 1 : 0.97 }} onClick={requestReset}
                    disabled={isFutureDate}
                    className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 border disabled:opacity-40 disabled:cursor-not-allowed ${
                      isDark
                        ? 'bg-[#252540] text-gray-300 hover:bg-[#2a2a4a] border-[#2a2a3e]'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200/50'
                    }`}>
                    <RotateCcw className="w-4 h-4" /> Reset
                  </motion.button>
                ) : (
                  <div className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm border opacity-40 cursor-not-allowed ${
                    isDark ? 'bg-[#252540] text-gray-500 border-[#2a2a3e]' : 'bg-gray-100 text-gray-400 border-gray-200/50'
                  }`}>
                    <RotateCcw className="w-4 h-4" /> Reset
                  </div>
                )}
              </div>
            </>
          )}

          {isAdmin && (
            <motion.button whileTap={{ scale: 0.97 }} onClick={onOverride}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 border ${
                isDark
                  ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20'
                  : 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200/50'
              }`}>
              <ShieldAlert className="w-4 h-4" /> Admin Override
            </motion.button>
          )}
        </div>
      </div>
      {modals}
    </>
  );
}
