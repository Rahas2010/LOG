import { useState, useCallback, useEffect, useRef } from 'react';
import type { DailyData, AppState, PenaltyInfo, AppSettings } from './types';
import { DEFAULT_SETTINGS } from './types';
import { fetchUserData, saveUserData } from './db/sync';
import { isSupabaseConfigured } from './db/config';
import { verifyAdminPassword } from './AuthContext';

export type SyncStatus = 'idle' | 'loading' | 'syncing' | 'synced' | 'error' | 'offline' | 'cloud-only';

function getDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function defaultState(): AppState {
  const now = new Date();
  return {
    dailyData: {},
    blockedDates: {},
    selectedDate: getDateKey(now),
    currentMonth: now.getMonth(),
    currentYear: now.getFullYear(),
    settings: DEFAULT_SETTINGS,
  };
}

function loadState(userKey: string | null): AppState {
  try {
    const key = userKey ? `screentime_state_${userKey}` : 'screentime_state_legacy';
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with defaults so old states get new fields
      return { ...defaultState(), ...parsed, settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) } };
    }
  } catch {}
  return defaultState();
}

function saveState(userKey: string | null, state: AppState) {
  try {
    const key = userKey ? `screentime_state_${userKey}` : 'screentime_state_legacy';
    localStorage.setItem(key, JSON.stringify(state));
  } catch {}
}

function getEffectiveLimit(blockedVal: number | undefined, maxTime: number): number {
  if (blockedVal === undefined || blockedVal === 0) return maxTime;
  if (blockedVal === -1) return 0;
  return Math.max(0, maxTime - blockedVal);
}

export function useStore(userKey: string | null) {
  const [state, setState] = useState<AppState>(() => loadState(userKey));
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const cloudEnabled = isSupabaseConfigured() && !!userKey;

  useEffect(() => {
    setState(loadState(userKey));
    setSyncStatus('idle');
    setLastSynced(null);
  }, [userKey]);

  const initialSyncDone = useRef<string | null>(null);
  useEffect(() => {
    if (!cloudEnabled || !userKey) return;
    if (initialSyncDone.current === userKey) return;
    initialSyncDone.current = userKey;

    let cancelled = false;
    (async () => {
      setSyncStatus('loading');
      const cloudState = await fetchUserData(userKey);
      if (cancelled) return;

      if (cloudState) {
        const merged: AppState = { ...defaultState(), ...cloudState, settings: { ...DEFAULT_SETTINGS, ...(cloudState.settings || {}) } };
        setState(merged);
        saveState(userKey, merged);
        setSyncStatus('synced');
        setLastSynced(new Date());
      } else {
        const localState = loadState(userKey);
        const hasData = Object.keys(localState.dailyData).length > 0;
        if (hasData) {
          setSyncStatus('syncing');
          const ok = await saveUserData(userKey, localState);
          if (cancelled) return;
          setSyncStatus(ok ? 'synced' : 'error');
          if (ok) setLastSynced(new Date());
        } else {
          setSyncStatus('synced');
          setLastSynced(new Date());
        }
      }
    })();
    return () => { cancelled = true; };
  }, [userKey, cloudEnabled]);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingStateRef = useRef<AppState | null>(null);

  const scheduleCloudSave = useCallback((newState: AppState) => {
    if (!cloudEnabled || !userKey) return;
    pendingStateRef.current = newState;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      if (!pendingStateRef.current || !userKey) return;
      setSyncStatus('syncing');
      const ok = await saveUserData(userKey, pendingStateRef.current);
      setSyncStatus(ok ? 'synced' : 'error');
      if (ok) setLastSynced(new Date());
      pendingStateRef.current = null;
    }, 800);
  }, [cloudEnabled, userKey]);

  const updateState = useCallback((updater: (prev: AppState) => AppState) => {
    setState(prev => {
      const next = updater(prev);
      saveState(userKey, next);
      scheduleCloudSave(next);
      return next;
    });
  }, [userKey, scheduleCloudSave]);

  const selectDate = useCallback((dateKey: string) => {
    updateState(s => ({ ...s, selectedDate: dateKey }));
  }, [updateState]);

  const setMonth = useCallback((month: number, year: number) => {
    updateState(s => ({ ...s, currentMonth: month, currentYear: year }));
  }, [updateState]);

  const getDailyData = useCallback((dateKey: string): DailyData => {
    return state.dailyData[dateKey] || { spell1: 0, spell2: 0, spell3: 0 };
  }, [state.dailyData]);

  const recalculateBlocks = useCallback((dailyData: Record<string, DailyData>, settings: AppSettings): Record<string, number> => {
    const blocked: Record<string, number> = {};
    const dates = Object.keys(dailyData).sort();
    const { maxTime, penaltyRatio, fullBlockThreshold, carryForwardEnabled } = settings;

    for (const dateKey of dates) {
      const data = dailyData[dateKey];
      const total = data.spell1 + data.spell2 + data.spell3;
      const effectiveLimit = getEffectiveLimit(blocked[dateKey], maxTime);
      const excess = Math.max(0, total - effectiveLimit);
      const penalty = Math.round(excess * penaltyRatio);

      if (penalty > 0) {
        const nextDate = new Date(dateKey + 'T00:00:00');
        nextDate.setDate(nextDate.getDate() + 1);
        const nextKey = getDateKey(nextDate);

        if (penalty >= fullBlockThreshold) {
          blocked[nextKey] = -1;
          if (carryForwardEnabled) {
            let remaining = penalty - fullBlockThreshold;
            const carryDate = new Date(nextDate);
            while (remaining > 0) {
              carryDate.setDate(carryDate.getDate() + 1);
              const carryKey = getDateKey(carryDate);
              if (remaining >= fullBlockThreshold) {
                blocked[carryKey] = -1;
                remaining -= fullBlockThreshold;
              } else {
                if (blocked[carryKey] !== -1) {
                  blocked[carryKey] = (blocked[carryKey] || 0) + remaining;
                  if (blocked[carryKey] >= fullBlockThreshold) {
                    const overflow = blocked[carryKey] - fullBlockThreshold;
                    blocked[carryKey] = -1;
                    remaining = overflow;
                    continue;
                  }
                }
                remaining = 0;
              }
            }
          }
        } else {
          if (blocked[nextKey] === -1) {
            // already fully blocked
          } else {
            blocked[nextKey] = (blocked[nextKey] || 0) + penalty;
            if (blocked[nextKey] >= fullBlockThreshold) {
              const overflow = blocked[nextKey] - fullBlockThreshold;
              blocked[nextKey] = -1;
              if (carryForwardEnabled && overflow > 0) {
                const overflowDate = new Date(nextKey + 'T00:00:00');
                overflowDate.setDate(overflowDate.getDate() + 1);
                const overflowKey = getDateKey(overflowDate);
                if (blocked[overflowKey] !== -1) {
                  blocked[overflowKey] = (blocked[overflowKey] || 0) + overflow;
                }
              }
            }
          }
        }
      }
    }
    return blocked;
  }, []);

  const updateSpells = useCallback((dateKey: string, data: DailyData) => {
    updateState(s => {
      const newDailyData = { ...s.dailyData, [dateKey]: data };
      const newBlocked = recalculateBlocks(newDailyData, s.settings);
      return { ...s, dailyData: newDailyData, blockedDates: newBlocked };
    });
  }, [updateState, recalculateBlocks]);

  const resetSpells = useCallback((dateKey: string) => {
    updateState(s => {
      const newDailyData = { ...s.dailyData };
      delete newDailyData[dateKey];
      const newBlocked = recalculateBlocks(newDailyData, s.settings);
      return { ...s, dailyData: newDailyData, blockedDates: newBlocked };
    });
  }, [updateState, recalculateBlocks]);

  const overrideBlock = useCallback((dateKey: string, password: string): boolean => {
    if (!verifyAdminPassword(password)) return false;
    updateState(s => {
      const newBlocked = { ...s.blockedDates };
      delete newBlocked[dateKey];
      return { ...s, blockedDates: newBlocked };
    });
    return true;
  }, [updateState]);

  const isBlocked = useCallback((dateKey: string): { blocked: boolean; fullBlock: boolean; minutes: number } => {
    const val = state.blockedDates[dateKey];
    if (val === undefined || val === 0) return { blocked: false, fullBlock: false, minutes: 0 };
    if (val === -1) return { blocked: true, fullBlock: true, minutes: state.settings.maxTime };
    return { blocked: true, fullBlock: false, minutes: val };
  }, [state.blockedDates, state.settings.maxTime]);

  const getPenaltyInfo = useCallback((dateKey: string): PenaltyInfo => {
    const data = getDailyData(dateKey);
    const total = data.spell1 + data.spell2 + data.spell3;
    const blockVal = state.blockedDates[dateKey];
    const effectiveLimit = getEffectiveLimit(blockVal, state.settings.maxTime);
    const bonusTime = Math.max(0, effectiveLimit - total);
    const excessTime = Math.max(0, total - effectiveLimit);
    const penaltyMinutes = Math.round(excessTime * state.settings.penaltyRatio);
    const isFullBlock = penaltyMinutes >= state.settings.fullBlockThreshold;
    const carryForward = isFullBlock ? penaltyMinutes - state.settings.fullBlockThreshold : 0;
    return { totalTime: total, effectiveLimit, bonusTime, excessTime, penaltyMinutes, isFullBlock, carryForward };
  }, [getDailyData, state.blockedDates, state.settings]);

  const getWeeklyStats = useCallback(() => {
    const today = new Date();
    const days: Array<{
      dateKey: string; label: string; dayName: string;
      totalTime: number; excessTime: number; bonusTime: number;
      penaltyMinutes: number; effectiveLimit: number;
      isOnTime: boolean; hasData: boolean;
    }> = [];
    let totalScreenTime = 0, totalPenalty = 0, totalBonus = 0, onTimeDays = 0, trackedDays = 0;

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = getDateKey(d);
      const info = getPenaltyInfoInternal(key, state.blockedDates, state.dailyData, state.settings);
      const hasData = !!state.dailyData[key];
      const isOnTime = hasData && info.excessTime === 0;

      days.push({
        dateKey: key, label: d.getDate().toString(),
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        totalTime: info.totalTime, excessTime: info.excessTime,
        bonusTime: info.bonusTime, penaltyMinutes: info.penaltyMinutes,
        effectiveLimit: info.effectiveLimit, isOnTime, hasData,
      });
      totalScreenTime += info.totalTime;
      totalPenalty += info.penaltyMinutes;
      totalBonus += info.bonusTime;
      if (hasData) { trackedDays += 1; if (isOnTime) onTimeDays += 1; }
    }
    return {
      days, totalScreenTime, totalPenalty, totalBonus,
      onTimeDays, trackedDays,
      avgScreenTime: trackedDays > 0 ? Math.round(totalScreenTime / trackedDays) : 0,
    };
  }, [state.blockedDates, state.dailyData, state.settings]);

  const getBehaviorScore = useCallback(() => {
    const stats = getWeeklyStats();
    if (stats.trackedDays === 0) {
      return { score: 0, grade: 'N/A', label: 'No data yet', onTimePct: 0, avgPenalty: 0 };
    }
    const onTimePct = stats.onTimeDays / stats.trackedDays;
    const avgPenalty = stats.totalPenalty / stats.trackedDays;
    const onTimeScore = onTimePct * 60;
    const penaltyScore = Math.max(0, 40 - avgPenalty * 1.5);
    const clamped = Math.max(0, Math.min(100, Math.round(onTimeScore + penaltyScore)));
    let grade: string, label: string;
    if (clamped >= 90) { grade = 'A+'; label = 'Excellent'; }
    else if (clamped >= 80) { grade = 'A'; label = 'Great'; }
    else if (clamped >= 70) { grade = 'B'; label = 'Good'; }
    else if (clamped >= 60) { grade = 'C'; label = 'Fair'; }
    else if (clamped >= 50) { grade = 'D'; label = 'Needs Work'; }
    else { grade = 'F'; label = 'Poor'; }
    return { score: clamped, grade, label, onTimePct: Math.round(onTimePct * 100), avgPenalty: Math.round(avgPenalty) };
  }, [getWeeklyStats]);

  const updateSettings = useCallback((newSettings: AppSettings) => {
    updateState(s => {
      const newBlocked = recalculateBlocks(s.dailyData, newSettings);
      return { ...s, settings: newSettings, blockedDates: newBlocked };
    });
  }, [updateState, recalculateBlocks]);

  const resetAllData = useCallback(() => {
    updateState(s => ({ ...defaultState(), selectedDate: getDateKey(new Date()), settings: s.settings }));
  }, [updateState]);

  const replaceState = useCallback((newState: AppState) => {
    updateState(() => ({ ...defaultState(), ...newState, settings: { ...DEFAULT_SETTINGS, ...(newState.settings || {}) } }));
  }, [updateState]);

  const forceSync = useCallback(async () => {
    if (!cloudEnabled || !userKey) return;
    setSyncStatus('syncing');
    const ok = await saveUserData(userKey, state);
    setSyncStatus(ok ? 'synced' : 'error');
    if (ok) setLastSynced(new Date());
  }, [cloudEnabled, userKey, state]);

  return {
    state, syncStatus, lastSynced, cloudEnabled,
    selectDate, setMonth, getDailyData,
    updateSpells, resetSpells, overrideBlock,
    getPenaltyInfo, isBlocked, getWeeklyStats, getBehaviorScore,
    updateSettings, resetAllData, replaceState, forceSync,
  };
}

function getPenaltyInfoInternal(
  dateKey: string,
  blockedDates: Record<string, number>,
  dailyData: Record<string, { spell1: number; spell2: number; spell3: number }>,
  settings: AppSettings
) {
  const data = dailyData[dateKey] || { spell1: 0, spell2: 0, spell3: 0 };
  const total = data.spell1 + data.spell2 + data.spell3;
  const blockVal = blockedDates[dateKey];
  const effectiveLimit = getEffectiveLimit(blockVal, settings.maxTime);
  const bonusTime = Math.max(0, effectiveLimit - total);
  const excessTime = Math.max(0, total - effectiveLimit);
  const penaltyMinutes = Math.round(excessTime * settings.penaltyRatio);
  return { totalTime: total, effectiveLimit, bonusTime, excessTime, penaltyMinutes };
}

export { getDateKey };
