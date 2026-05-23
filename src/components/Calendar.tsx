import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { getDateKey } from '../useStore';
import { useTheme } from '../ThemeContext';

interface CalendarProps {
  month: number;
  year: number;
  selectedDate: string;
  blockedDates: Record<string, number>;
  onSelectDate: (dateKey: string) => void;
  onChangeMonth: (month: number, year: number) => void;
}

const WEEKDAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEKDAYS_FULL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Calendar({
  month, year, selectedDate, blockedDates, onSelectDate, onChangeMonth
}: CalendarProps) {
  const { theme, isDark } = useTheme();
  const isGlass = theme === 'glass';
  const todayKey = getDateKey(new Date());

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const result: { date: Date; key: string; isCurrentMonth: boolean }[] = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      result.push({
        date: new Date(current),
        key: getDateKey(current),
        isCurrentMonth: current.getMonth() === month,
      });
      current.setDate(current.getDate() + 1);
    }

    if (result.length > 35 && result.slice(35).every(d => !d.isCurrentMonth)) {
      return result.slice(0, 35);
    }
    return result;
  }, [month, year]);

  const prevMonth = () => {
    if (month === 0) onChangeMonth(11, year - 1);
    else onChangeMonth(month - 1, year);
  };

  const nextMonth = () => {
    if (month === 11) onChangeMonth(0, year + 1);
    else onChangeMonth(month + 1, year);
  };

  const getBlockInfo = (key: string) => {
    const val = blockedDates[key];
    if (val === undefined || val === 0) return null;
    if (val === -1) return 'full';
    return 'partial';
  };

  const weekdays = (isGlass || isDark) ? WEEKDAYS_SHORT : WEEKDAYS_FULL;

  /* ───── CLASSIC THEME ───── */
  if (!isGlass && !isDark) {
    return (
      <div className="bg-white border border-[#e5e5e5] rounded-xl p-7 transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <span className="text-lg font-semibold text-[#0f0f0f]">
            {MONTH_NAMES[month]} {year}
          </span>
          <div className="flex gap-2">
            <button onClick={prevMonth}
              className="px-3 py-1.5 text-sm border border-[#e5e5e5] rounded-lg bg-white hover:bg-[#f5f5f5] transition-colors font-medium">
              ←
            </button>
            <button onClick={nextMonth}
              className="px-3 py-1.5 text-sm border border-[#e5e5e5] rounded-lg bg-white hover:bg-[#f5f5f5] transition-colors font-medium">
              →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-3">
          {weekdays.map((d, i) => (
            <div key={i} className="text-center text-xs font-semibold text-[#666] py-2">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map(({ key, date, isCurrentMonth }) => {
            const isSelected = key === selectedDate;
            const isToday = key === todayKey;
            const isFuture = key > todayKey;
            const blockInfo = getBlockInfo(key);

            let cls = 'aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer border ';

            if (!isCurrentMonth) {
              cls += 'text-[#ccc] border-transparent cursor-default';
            } else if (isSelected && blockInfo === 'full') {
              cls += 'bg-[#fee2e2] border-[#ef4444] text-[#991b1b] font-bold';
            } else if (isSelected && blockInfo === 'partial') {
              cls += 'bg-orange-100 border-orange-400 text-orange-800 font-bold';
            } else if (isSelected) {
              cls += 'bg-[#0f0f0f] text-white border-[#0f0f0f]';
            } else if (blockInfo === 'full') {
              cls += 'bg-[#fee2e2] border-[#ef4444] text-[#991b1b] font-semibold';
            } else if (blockInfo === 'partial') {
              cls += 'bg-orange-50 border-orange-300 text-orange-700';
            } else if (isFuture) {
              cls += 'border-[#e5e5e5] text-[#999] bg-[#fafafa]';
            } else {
              cls += 'border-[#e5e5e5] hover:border-[#0f0f0f] hover:bg-[#f5f5f5]';
            }

            if (isToday && !isSelected) cls += ' ring-2 ring-[#0f0f0f]';

            return (
              <button key={key}
                onClick={() => isCurrentMonth && onSelectDate(key)}
                className={cls}>
                {date.getDate()}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 mt-5 pt-4 border-t border-[#e5e5e5] text-xs text-[#666]">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 bg-[#0f0f0f] rounded-sm" />Selected
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 bg-[#fee2e2] border border-[#ef4444] rounded-sm" />Full Block
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 bg-orange-50 border border-orange-300 rounded-sm" />Partial
          </div>
        </div>
      </div>
    );
  }

  /* ───── GLASS + DARK THEME ───── */
  return (
    <div className={isDark ? 'dark-card p-6 md:p-8' : 'glass-card p-6 md:p-8'}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{MONTH_NAMES[month]}</h2>
          <p className={`text-sm font-medium mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{year}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth}
            className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-200 hover:scale-105 active:scale-95 ${
              isDark
                ? 'bg-[#252540] hover:bg-[#2a2a4a] border-[#2a2a3e]'
                : 'bg-white/60 hover:bg-white border-gray-200/50'
            }`}>
            <ChevronLeft className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
          </button>
          <button onClick={nextMonth}
            className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-200 hover:scale-105 active:scale-95 ${
              isDark
                ? 'bg-[#252540] hover:bg-[#2a2a4a] border-[#2a2a3e]'
                : 'bg-white/60 hover:bg-white border-gray-200/50'
            }`}>
            <ChevronRight className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekdays.map((day, i) => (
          <div key={i} className={`text-center text-xs font-semibold py-2 uppercase tracking-wider ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map(({ key, date, isCurrentMonth }) => {
          const isSelected = key === selectedDate;
          const isToday = key === todayKey;
          const blockInfo = getBlockInfo(key);

          return (
            <motion.button key={key} whileTap={{ scale: 0.9 }}
              onClick={() => isCurrentMonth && onSelectDate(key)}
              className={`
                relative aspect-square rounded-2xl flex flex-col items-center justify-center text-sm font-medium
                transition-all duration-200 cursor-pointer
                ${!isCurrentMonth ? (isDark ? 'text-gray-700 cursor-default' : 'text-gray-300 cursor-default') : ''}
                ${isCurrentMonth && !isSelected && !blockInfo ? (isDark ? 'text-gray-300 hover:bg-[#252540]' : 'text-gray-700 hover:bg-white/80') : ''}
                ${isSelected && !blockInfo ? (isDark ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-gray-900 text-white shadow-lg shadow-gray-900/20') : ''}
                ${isSelected && blockInfo === 'full' ? 'bg-red-500 text-white shadow-lg shadow-red-500/25' : ''}
                ${isSelected && blockInfo === 'partial' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' : ''}
                ${!isSelected && blockInfo === 'full' ? (isDark ? 'bg-red-500/15 text-red-400 border border-red-500/30' : 'bg-red-50 text-red-600 border border-red-200/60') : ''}
                ${!isSelected && blockInfo === 'partial' ? (isDark ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' : 'bg-orange-50 text-orange-600 border border-orange-200/60') : ''}
                ${isToday && !isSelected ? (isDark ? 'ring-2 ring-indigo-500/40 ring-offset-1 ring-offset-[#1a1a2e]' : 'ring-2 ring-gray-900/20 ring-offset-1') : ''}
              `}>
              <span className="relative z-10">{date.getDate()}</span>
              {blockInfo && !isSelected && (
                <div className={`absolute bottom-1.5 w-1 h-1 rounded-full ${blockInfo === 'full' ? 'bg-red-400' : 'bg-orange-400'}`} />
              )}
            </motion.button>
          );
        })}
      </div>

      <div className={`flex items-center gap-5 mt-6 pt-5 border-t ${isDark ? 'border-[#2a2a3e]' : 'border-gray-100'}`}>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isDark ? 'bg-indigo-600' : 'bg-gray-900'}`} />
          <span className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <span className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Full Block</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-400" />
          <span className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Partial</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ring-2 ring-offset-1 bg-transparent ${
            isDark ? 'ring-indigo-500/40 ring-offset-[#1a1a2e]' : 'ring-gray-900/30'
          }`} />
          <span className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Today</span>
        </div>
      </div>
    </div>
  );
}
