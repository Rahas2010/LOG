import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Gift, AlertTriangle, Ban, BarChart3 } from 'lucide-react';
import type { PenaltyInfo, DailyData } from '../types';
import { useTheme } from '../ThemeContext';

interface StatsPanelProps {
  penaltyInfo: PenaltyInfo;
  dailyData: DailyData;
  isBlocked: boolean;
  isFullBlock: boolean;
  blockedMinutes: number;
}

/* ═══════════════════════════════════════
   CLASSIC STAT CARD
   ═══════════════════════════════════════ */
function ClassicStatCard({ label, value, unit, variant }: {
  label: string; value: number; unit: string;
  variant?: 'default' | 'accent' | 'danger' | 'success' | 'warning';
}) {
  const styles: Record<string, string> = {
    default: 'bg-white border-[#e5e5e5]',
    accent: 'bg-[#f5f5f5] border-[#0f0f0f]',
    danger: 'bg-[#fee2e2] border-[#ef4444]',
    success: 'bg-[#f0fdf4] border-[#22c55e]',
    warning: 'bg-orange-50 border-orange-300',
  };
  const labelColors: Record<string, string> = {
    default: 'text-[#666]', accent: 'text-[#666]', danger: 'text-[#991b1b]',
    success: 'text-[#166534]', warning: 'text-orange-700',
  };
  const valueColors: Record<string, string> = {
    default: 'text-[#0f0f0f]', accent: 'text-[#0f0f0f]', danger: 'text-[#ef4444]',
    success: 'text-[#22c55e]', warning: 'text-orange-500',
  };
  const v = variant || 'default';
  return (
    <div className={`border rounded-xl p-5 ${styles[v]}`}>
      <div className={`text-xs font-semibold uppercase tracking-wider mb-3 ${labelColors[v]}`}>{label}</div>
      <div className={`text-3xl font-bold ${valueColors[v]}`}>{value}</div>
      <div className="text-xs text-[#666] mt-1">{unit}</div>
    </div>
  );
}

/* ═══════════════════════════════════════
   GLASS / DARK STAT CARD
   ═══════════════════════════════════════ */
function GlassStatCard({ label, value, unit, icon: Icon, gradient, delay, accent, isDark }: {
  label: string; value: number | string; unit: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string; delay: number; accent?: string; isDark?: boolean;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={isDark ? 'dark-card p-5 group' : 'glass-card p-5 group'}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{label}</p>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-extrabold tracking-tight ${accent || (isDark ? 'text-white' : 'text-gray-900')}`}>{value}</span>
        <span className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{unit}</span>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════ */
export default function StatsPanel({ penaltyInfo, dailyData, isBlocked, isFullBlock, blockedMinutes }: StatsPanelProps) {
  const { theme, isDark } = useTheme();
  const isGlass = theme === 'glass';
  const { totalTime, effectiveLimit, bonusTime, excessTime, penaltyMinutes, carryForward } = penaltyInfo;

  const progressPercent = effectiveLimit > 0
    ? Math.min(100, (totalTime / effectiveLimit) * 100)
    : (totalTime > 0 ? 100 : 0);
  const isOver = totalTime > effectiveLimit;

  const barData = useMemo(() => {
    const values = [dailyData.spell1, dailyData.spell2, dailyData.spell3];
    const labels = ['Spell 1', 'Spell 2', 'Spell 3'];
    const maxVal = effectiveLimit > 0 ? effectiveLimit : 60;
    return labels.map((label, i) => ({
      label,
      value: values[i],
      percent: values[i] > 0 ? Math.min(100, (values[i] / maxVal) * 100) : 0,
    }));
  }, [dailyData, effectiveLimit]);

  /* ═══ PENALTY BREAKDOWN (shared) ═══ */
  const PenaltyBreakdown = () => {
    if (penaltyMinutes <= 0) return null;

    const rows = [
      { l: "Today's limit", r: `${effectiveLimit} min`, bold: false },
      { l: 'Total used', r: `${totalTime} min`, bold: false },
      { l: 'Excess time', r: `${excessTime} min`, bold: false, accent: true },
      { l: 'Multiplier', r: '× 1.5', bold: false },
    ];

    if (!isGlass && !isDark) {
      return (
        <div className="bg-white border border-[#e5e5e5] rounded-xl p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#666] mb-3">Penalty Breakdown</div>
          <div className="space-y-2">
            {rows.map((r, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-[#666]">{r.l}</span>
                <span className={`font-semibold ${r.accent ? 'text-orange-500' : 'text-[#0f0f0f]'}`}>{r.r}</span>
              </div>
            ))}
            <div className="border-t border-[#e5e5e5] pt-2 flex justify-between text-sm">
              <span className="font-bold text-[#0f0f0f]">Total penalty</span>
              <span className="font-bold text-[#ef4444]">{penaltyMinutes} min</span>
            </div>
            {isFullBlock && (
              <div className="flex justify-between text-sm">
                <span className="text-[#666]">Next day</span>
                <span className="text-xs font-bold text-[#ef4444] bg-[#fee2e2] px-2 py-0.5 rounded-full">FULLY BLOCKED</span>
              </div>
            )}
            {carryForward > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#666]">Carried forward</span>
                <span className="font-bold text-purple-500">{carryForward} min →</span>
              </div>
            )}
            {penaltyMinutes > 0 && !isFullBlock && (
              <div className="flex justify-between text-sm">
                <span className="text-[#666]">Next day limit</span>
                <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                  {effectiveLimit + blockedMinutes} − {penaltyMinutes} = {effectiveLimit + blockedMinutes - penaltyMinutes} MIN
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className={isDark ? 'dark-card p-5' : 'glass-card p-5'}>
        <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Penalty Breakdown</p>
        <div className="space-y-2.5">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{r.l}</span>
              <span className={`text-sm font-semibold ${r.accent ? 'text-orange-500' : (isDark ? 'text-white' : 'text-gray-900')}`}>{r.r}</span>
            </div>
          ))}
          <div className={`border-t pt-2.5 flex items-center justify-between ${isDark ? 'border-[#2a2a3e]' : 'border-gray-100'}`}>
            <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Total penalty</span>
            <span className="text-sm font-bold text-red-500">{penaltyMinutes} min</span>
          </div>
          {isFullBlock && (
            <>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Next day</span>
                <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">FULLY BLOCKED</span>
              </div>
              {carryForward > 0 && (
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Carried forward</span>
                  <span className="text-sm font-bold text-purple-500">{carryForward} min →</span>
                </div>
              )}
            </>
          )}
          {penaltyMinutes > 0 && penaltyMinutes < 60 && (
            <div className="flex items-center justify-between">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Next day limit</span>
              <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                60 − {penaltyMinutes} = {60 - penaltyMinutes} MIN
              </span>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  /* ═══════════════════════════════════
     CLASSIC THEME
     ═══════════════════════════════════ */
  if (!isGlass && !isDark) {
    return (
      <div className="space-y-5">
        {(isBlocked || isFullBlock) && (
          <div className={`border rounded-xl p-4 flex items-center gap-3 ${
            isFullBlock ? 'bg-[#fee2e2] border-[#ef4444]' : 'bg-orange-50 border-orange-300'
          }`}>
            <Ban className={`w-5 h-5 flex-shrink-0 ${isFullBlock ? 'text-[#ef4444]' : 'text-orange-500'}`} />
            <div>
              <p className={`text-sm font-bold ${isFullBlock ? 'text-[#991b1b]' : 'text-orange-700'}`}>
                {isFullBlock ? 'This Day is Fully Blocked' : `${blockedMinutes} Min Blocked`}
              </p>
              <p className="text-xs text-[#666] mt-0.5">
                  {isFullBlock ? 'Penalty from previous day' : `Limit: ${effectiveLimit + blockedMinutes} → ${effectiveLimit} min`}
              </p>
            </div>
          </div>
        )}

        <div className="bg-[#f0f9ff] border border-[#bfdbfe] rounded-lg p-4 text-sm text-[#1e40af]">
          Total: <strong>{totalTime}</strong> / {effectiveLimit} min
          {blockedMinutes > 0 && !isFullBlock && (
            <span className="ml-1 text-orange-600">(reduced from {effectiveLimit + blockedMinutes} by {blockedMinutes} min penalty)</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <ClassicStatCard label="Total Time" value={totalTime} unit="minutes" variant={isOver ? 'danger' : 'accent'} />
          <ClassicStatCard label="Bonus Time" value={bonusTime} unit="minutes available" variant="success" />
          <ClassicStatCard label="Excess Time" value={excessTime} unit="minutes over limit" variant={excessTime > 0 ? 'warning' : 'default'} />
          <ClassicStatCard label="Penalty" value={penaltyMinutes} unit="minutes blocked tomorrow" variant={penaltyMinutes > 0 ? 'danger' : 'default'} />
        </div>

        <PenaltyBreakdown />
      </div>
    );
  }

  /* ═══════════════════════════════════
     GLASS + DARK THEME
     ═══════════════════════════════════ */
  return (
    <div className="space-y-4">
      {(isBlocked || isFullBlock) && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className={isDark ? 'dark-card overflow-hidden' : 'glass-card overflow-hidden'}>
          <div className={`p-5 ${isFullBlock
            ? 'bg-gradient-to-r from-red-500/10 to-red-600/5 border-l-4 border-red-500'
            : 'bg-gradient-to-r from-orange-500/10 to-orange-600/5 border-l-4 border-orange-500'}`}>
            <div className="flex items-center gap-3">
              <Ban className={`w-5 h-5 flex-shrink-0 ${isFullBlock ? 'text-red-500' : 'text-orange-500'}`} />
              <div>
                <p className={`text-sm font-bold ${isFullBlock ? 'text-red-700' : 'text-orange-700'}`}>
                  {isFullBlock ? 'This Day is Fully Blocked' : `${blockedMinutes} Min Blocked`}
                </p>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  {isFullBlock ? 'Penalty carried from previous day — no screen time allowed' : `Limit reduced from 60 → ${effectiveLimit} min`}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Ring */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className={`${isDark ? 'dark-card' : 'glass-card'} p-6 flex flex-col items-center justify-center`}>
          <div className="relative w-36 h-36 mb-4">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke={isDark ? '#252540' : '#f3f4f6'} strokeWidth="7" />
              <motion.circle cx="60" cy="60" r="52" fill="none"
                stroke={isOver ? '#FF3B30' : '#34C759'} strokeWidth="7" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 52}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - progressPercent / 100) }}
                transition={{ duration: 1, ease: 'easeOut' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span key={totalTime} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className={`text-3xl font-extrabold tracking-tight ${isOver ? 'text-red-500' : (isDark ? 'text-white' : 'text-gray-900')}`}>
                {totalTime}
              </motion.span>
              <span className={`text-[10px] font-semibold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>of {effectiveLimit} min</span>
            </div>
          </div>
          <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Total Usage</p>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {isOver ? `${excessTime} min over limit` : `${bonusTime} min remaining`}
          </p>
          {blockedMinutes > 0 && !isFullBlock && (
            <p className="text-[10px] text-orange-500 font-semibold mt-1">
              Limit: {effectiveLimit + blockedMinutes} − {blockedMinutes} penalty = {effectiveLimit} min
            </p>
          )}
        </motion.div>

        {/* Bar Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }} className={`${isDark ? 'dark-card' : 'glass-card'} p-6 flex flex-col`}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Breakdown</p>
          </div>
          <div className="flex-1 flex items-end gap-3 justify-center pb-2">
            {barData.map((bar, i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-1">
                <span className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{bar.value}</span>
                <div className={`w-full rounded-xl overflow-hidden flex flex-col justify-end ${isDark ? 'bg-[#252540]' : 'bg-gray-100'}`} style={{ height: '100px' }}>
                  <motion.div initial={{ height: 0 }}
                    animate={{ height: `${Math.min(100, bar.percent)}%` }}
                    transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: 'easeOut' }}
                    className={`w-full rounded-xl ${
                      i === 0 ? 'bg-gradient-to-t from-blue-500 to-cyan-400' :
                      i === 1 ? 'bg-gradient-to-t from-purple-500 to-pink-400' :
                      'bg-gradient-to-t from-orange-500 to-amber-400'}`} />
                </div>
                <span className={`text-[10px] font-semibold uppercase ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{bar.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <GlassStatCard isDark={isDark} label="Limit" value={effectiveLimit} unit="min" icon={Gift}
          gradient={blockedMinutes > 0 && !isFullBlock ? 'from-orange-400 to-amber-500' : 'from-green-400 to-emerald-500'}
          delay={0.1} accent={effectiveLimit < 60 ? 'text-orange-500' : 'text-green-600'} />
        <GlassStatCard isDark={isDark} label="Bonus" value={bonusTime} unit="min" icon={Gift}
          gradient="from-green-400 to-emerald-500" delay={0.15}
          accent={bonusTime > 0 ? 'text-green-600' : (isDark ? 'text-gray-600' : 'text-gray-300')} />
        <GlassStatCard isDark={isDark} label="Excess" value={excessTime} unit="min" icon={TrendingUp}
          gradient="from-amber-400 to-orange-500" delay={0.2}
          accent={excessTime > 0 ? 'text-orange-500' : (isDark ? 'text-gray-600' : 'text-gray-300')} />
        <GlassStatCard isDark={isDark} label="Penalty" value={penaltyMinutes} unit="min" icon={AlertTriangle}
          gradient="from-red-400 to-rose-500" delay={0.25}
          accent={penaltyMinutes > 0 ? 'text-red-500' : (isDark ? 'text-gray-600' : 'text-gray-300')} />
      </div>

      <PenaltyBreakdown />
    </div>
  );
}
