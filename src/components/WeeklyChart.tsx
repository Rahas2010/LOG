import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, Award, AlertTriangle } from 'lucide-react';
import { useTheme } from '../ThemeContext';

interface WeeklyStats {
  days: Array<{
    dateKey: string;
    label: string;
    dayName: string;
    totalTime: number;
    excessTime: number;
    bonusTime: number;
    penaltyMinutes: number;
    effectiveLimit: number;
    isOnTime: boolean;
    hasData: boolean;
  }>;
  totalScreenTime: number;
  totalPenalty: number;
  totalBonus: number;
  onTimeDays: number;
  trackedDays: number;
  avgScreenTime: number;
}

interface WeeklyChartProps {
  stats: WeeklyStats;
}

export default function WeeklyChart({ stats }: WeeklyChartProps) {
  const { theme } = useTheme();
  const isGlass = theme === 'glass';

  const maxVal = useMemo(() => {
    const m = Math.max(60, ...stats.days.map(d => Math.max(d.totalTime, d.effectiveLimit, d.penaltyMinutes + d.effectiveLimit)));
    return Math.ceil(m / 10) * 10;
  }, [stats]);

  const summaryCards = [
    {
      label: 'Total Screen Time',
      value: stats.totalScreenTime,
      unit: 'min',
      icon: Clock,
      color: 'blue',
      gradient: 'from-blue-500 to-cyan-500',
      classicBg: 'bg-blue-50',
      classicText: 'text-blue-700',
    },
    {
      label: 'On-Time Days',
      value: stats.onTimeDays,
      unit: `/ ${stats.trackedDays}`,
      icon: Award,
      color: 'green',
      gradient: 'from-green-500 to-emerald-500',
      classicBg: 'bg-green-50',
      classicText: 'text-green-700',
    },
    {
      label: 'Total Penalties',
      value: stats.totalPenalty,
      unit: 'min',
      icon: AlertTriangle,
      color: 'red',
      gradient: 'from-red-500 to-rose-500',
      classicBg: 'bg-red-50',
      classicText: 'text-red-700',
    },
    {
      label: 'Avg Daily',
      value: stats.avgScreenTime,
      unit: 'min',
      icon: TrendingUp,
      color: 'purple',
      gradient: 'from-purple-500 to-violet-500',
      classicBg: 'bg-purple-50',
      classicText: 'text-purple-700',
    },
  ];

  /* ══════ CLASSIC ══════ */
  if (!isGlass) {
    return (
      <div className="bg-white border border-[#e5e5e5] rounded-xl p-7">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-[#0f0f0f]">Weekly Overview</h3>
          <p className="text-sm text-[#666] mt-0.5">Last 7 days performance</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {summaryCards.map((card, i) => (
            <div key={i} className={`${card.classicBg} border border-[#e5e5e5] rounded-lg p-3`}>
              <div className="flex items-center gap-2 mb-2">
                <card.icon className={`w-3.5 h-3.5 ${card.classicText}`} />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#666]">{card.label}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-xl font-bold ${card.classicText}`}>{card.value}</span>
                <span className="text-[10px] text-[#666]">{card.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Bar Chart */}
        <div className="border-t border-[#e5e5e5] pt-5">
          <div className="flex items-end justify-between gap-2" style={{ height: '180px' }}>
            {stats.days.map((day, i) => {
              const totalHeight = maxVal > 0 ? (day.totalTime / maxVal) * 100 : 0;
              const limitHeight = maxVal > 0 ? (day.effectiveLimit / maxVal) * 100 : 0;

              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full">
                  <div className="relative flex-1 w-full flex items-end justify-center">
                    {/* Limit line */}
                    <div className="absolute w-full border-t border-dashed border-[#0f0f0f]/20"
                      style={{ bottom: `${limitHeight}%` }} />
                    {/* Total bar */}
                    {day.hasData && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${totalHeight}%` }}
                        transition={{ duration: 0.6, delay: i * 0.05, ease: 'easeOut' }}
                        className={`w-full max-w-[28px] rounded-t-md ${
                          day.isOnTime ? 'bg-[#0f0f0f]' : 'bg-[#ef4444]'
                        }`}
                      />
                    )}
                    {/* Penalty indicator */}
                    {day.penaltyMinutes > 0 && (
                      <div className="absolute -top-5 text-[9px] font-bold text-[#ef4444]">
                        -{day.penaltyMinutes}
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <div className={`text-xs font-bold ${day.isOnTime ? 'text-[#0f0f0f]' : day.hasData ? 'text-[#ef4444]' : 'text-[#ccc]'}`}>
                      {day.totalTime || '–'}
                    </div>
                    <div className="text-[10px] text-[#999] font-medium">{day.dayName}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-5 mt-5 text-xs text-[#666]">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-[#0f0f0f] rounded-sm" />
              <span>On-time</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-[#ef4444] rounded-sm" />
              <span>Over limit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 border-t border-dashed border-[#0f0f0f]/30" />
              <span>Daily limit</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ══════ GLASS ══════ */
  return (
    <div className="glass-card p-6 md:p-8">
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-500/20">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Weekly Overview</h3>
            <p className="text-xs text-gray-400 font-medium">Last 7 days performance</p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {summaryCards.map((card, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white/60 rounded-2xl p-3 border border-gray-200/50">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center`}>
                <card.icon className="w-3 h-3 text-white" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{card.label}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-gray-900">{card.value}</span>
              <span className="text-[10px] text-gray-400 font-medium">{card.unit}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <div className="border-t border-gray-200/50 pt-5">
        <div className="flex items-end justify-between gap-2" style={{ height: '180px' }}>
          {stats.days.map((day, i) => {
            const totalHeight = maxVal > 0 ? (day.totalTime / maxVal) * 100 : 0;
            const limitHeight = maxVal > 0 ? (day.effectiveLimit / maxVal) * 100 : 0;

            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full">
                <div className="relative flex-1 w-full flex items-end justify-center">
                  {/* Limit line */}
                  <div className="absolute w-full border-t border-dashed border-gray-400/40"
                    style={{ bottom: `${limitHeight}%` }} />
                  {/* Total bar */}
                  {day.hasData && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${totalHeight}%` }}
                      transition={{ duration: 0.6, delay: i * 0.05, ease: 'easeOut' }}
                      className={`w-full max-w-[28px] rounded-t-xl shadow-md ${
                        day.isOnTime
                          ? 'bg-gradient-to-t from-green-500 to-emerald-400 shadow-green-500/20'
                          : 'bg-gradient-to-t from-red-500 to-orange-400 shadow-red-500/20'
                      }`}
                    />
                  )}
                  {day.penaltyMinutes > 0 && (
                    <motion.div initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + i * 0.05 }}
                      className="absolute -top-5 px-1.5 py-0.5 rounded-full bg-red-500 text-[9px] font-bold text-white shadow-md shadow-red-500/30">
                      -{day.penaltyMinutes}
                    </motion.div>
                  )}
                </div>
                <div className="text-center">
                  <div className={`text-xs font-bold ${
                    day.isOnTime ? 'text-green-600' : day.hasData ? 'text-red-500' : 'text-gray-300'
                  }`}>
                    {day.totalTime || '–'}
                  </div>
                  <div className="text-[10px] text-gray-400 font-semibold">{day.dayName}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-5 mt-6 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-gradient-to-t from-green-500 to-emerald-400 rounded-sm" />
            <span className="font-medium">On-time</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-gradient-to-t from-red-500 to-orange-400 rounded-sm" />
            <span className="font-medium">Over limit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 border-t border-dashed border-gray-400/60" />
            <span className="font-medium">Daily limit</span>
          </div>
        </div>
      </div>
    </div>
  );
}
