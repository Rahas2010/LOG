import { useState } from 'react';
import { motion } from 'framer-motion';
import { Monitor, Sparkles, LogOut, Shield, Settings2 } from 'lucide-react';
import Calendar from './components/Calendar';
import SpellInput from './components/SpellInput';
import StatsPanel from './components/StatsPanel';
import OverrideModal from './components/OverrideModal';
import ThemeToggle from './components/ThemeToggle';
import LoginPage from './components/LoginPage';
import WeeklyChart from './components/WeeklyChart';
import BehaviorScore from './components/BehaviorScore';
import DbSetupScreen from './components/DbSetupScreen';
import SyncStatusIndicator from './components/SyncStatusIndicator';
import SettingsPanel from './components/SettingsPanel';
import { ThemeProvider, useTheme } from './ThemeContext';
import { AuthProvider, useAuth } from './AuthContext';
import { useStore, getDateKey } from './useStore';
import { isSupabaseConfigured } from './db/config';

function Dashboard() {
  const { theme } = useTheme();
  const isGlass = theme === 'glass';
  const { user, logout, isAdmin } = useAuth();

  const userKey = user?.key || null;

  const {
    state, syncStatus, lastSynced, cloudEnabled,
    selectDate, setMonth, getDailyData,
    updateSpells, resetSpells, overrideBlock, getPenaltyInfo, isBlocked,
    getWeeklyStats, getBehaviorScore,
    updateSettings, resetAllData, replaceState, forceSync,
  } = useStore(userKey);

  const [showOverride, setShowOverride] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const selectedData = getDailyData(state.selectedDate);
  const penaltyInfo = getPenaltyInfo(state.selectedDate);
  const blockStatus = isBlocked(state.selectedDate);
  const weeklyStats = getWeeklyStats();
  const behaviorScore = getBehaviorScore();

  const handleOverride = (dateKey: string, password: string): boolean => {
    return overrideBlock(dateKey, password);
  };

  const todayKey = getDateKey(new Date());
  const todayPenalty = getPenaltyInfo(todayKey);
  const isFutureSelected = state.selectedDate > todayKey;

  const userInitial = user?.username?.charAt(0).toUpperCase() || '?';

  const syncIndicator = (
    <SyncStatusIndicator
      status={syncStatus}
      lastSynced={lastSynced}
      cloudEnabled={cloudEnabled}
    />
  );

  /* ════════════════════════════════════
     CLASSIC LAYOUT
     ════════════════════════════════════ */
  if (!isGlass) {
    return (
      <div className="min-h-screen bg-white text-[#0f0f0f]" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
        <div className="max-w-[1400px] mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-1">Screen Time</h1>
              <p className="text-base text-[#666]">Track daily usage and manage penalties</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-[#666] hidden sm:block">
                Today: <strong>{todayPenalty.totalTime}</strong> / {todayPenalty.effectiveLimit} min
              </div>
              {syncIndicator}
              <ThemeToggle />
              <button onClick={() => setShowSettings(true)} title="Settings"
                className="w-9 h-9 rounded-lg border border-[#e5e5e5] bg-white hover:bg-[#f5f5f5] flex items-center justify-center transition-colors text-[#666] hover:text-[#0f0f0f]">
                <Settings2 className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 border border-[#e5e5e5] rounded-lg px-3 py-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                  isAdmin ? 'bg-[#0f0f0f]' : 'bg-[#666]'
                }`}>
                  {userInitial}
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-semibold leading-tight">{user?.username}</div>
                  <div className="text-[10px] text-[#999] leading-tight">{isAdmin ? 'Admin' : 'User'}</div>
                </div>
                <button onClick={logout} title="Sign out"
                  className="ml-1 p-1.5 rounded-md hover:bg-[#f5f5f5] transition-colors text-[#999] hover:text-[#0f0f0f]">
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
            <div className="space-y-6">
              <SpellInput
                dateKey={state.selectedDate}
                dailyData={selectedData}
                isFullyBlocked={blockStatus.fullBlock}
                blockedMinutes={blockStatus.minutes}
                effectiveLimit={penaltyInfo.effectiveLimit}
                isFutureDate={isFutureSelected}
                onUpdate={updateSpells}
                onReset={resetSpells}
                onOverride={() => setShowOverride(true)}
                isAdmin={isAdmin}
              />
              <Calendar
                month={state.currentMonth}
                year={state.currentYear}
                selectedDate={state.selectedDate}
                blockedDates={state.blockedDates}
                onSelectDate={selectDate}
                onChangeMonth={setMonth}
              />
            </div>

            <div className="space-y-6">
              <StatsPanel
                penaltyInfo={penaltyInfo}
                dailyData={selectedData}
                isBlocked={blockStatus.blocked}
                isFullBlock={blockStatus.fullBlock}
                blockedMinutes={blockStatus.minutes}
              />
              <BehaviorScore
                score={behaviorScore.score}
                grade={behaviorScore.grade}
                label={behaviorScore.label}
                onTimePct={behaviorScore.onTimePct}
                avgPenalty={behaviorScore.avgPenalty}
              />
            </div>
          </div>

          <div className="mt-6">
            <WeeklyChart stats={weeklyStats} />
          </div>
        </div>

        <OverrideModal
          isOpen={showOverride}
          dateKey={state.selectedDate}
          onClose={() => setShowOverride(false)}
          onConfirm={handleOverride}
        />

        <SettingsPanel
          isOpen={showSettings}
          settings={state.settings}
          cloudEnabled={cloudEnabled}
          lastSynced={lastSynced}
          onClose={() => setShowSettings(false)}
          onSaveSettings={updateSettings}
          onResetData={resetAllData}
          onReplaceData={replaceState}
          onForceSync={forceSync}
          onReconfigureCloud={() => window.location.reload()}
        />
      </div>
    );
  }

  /* ════════════════════════════════════
     GLASS LAYOUT
     ════════════════════════════════════ */
  return (
    <div className="min-h-screen gradient-mesh">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="sticky top-0 z-30 backdrop-blur-2xl bg-white/70 border-b border-gray-200/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center shadow-lg shadow-gray-900/15">
                <Monitor className="w-4.5 h-4.5 text-white" />
              </div>
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-gray-900">Screen Time</h1>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex items-center gap-2 bg-gray-100/80 rounded-full px-3.5 py-1.5">
                <Sparkles className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs font-semibold text-gray-600">
                  {todayPenalty.totalTime} / {todayPenalty.effectiveLimit} min
                </span>
              </div>
              <div className={`w-2 h-2 rounded-full ${
                todayPenalty.totalTime > todayPenalty.effectiveLimit ? 'bg-red-500 animate-pulse' : 'bg-green-500'
              }`} />

              {syncIndicator}
              <ThemeToggle />
              <button onClick={() => setShowSettings(true)} title="Settings"
                className="w-9 h-9 rounded-full bg-white/60 hover:bg-white border border-gray-200/50 flex items-center justify-center transition-all text-gray-500 hover:text-gray-900 hover:scale-105 active:scale-95">
                <Settings2 className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 bg-white/60 backdrop-blur-xl border border-gray-200/50 rounded-full pl-1.5 pr-2 py-1.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-md ${
                  isAdmin
                    ? 'bg-gradient-to-br from-gray-900 to-gray-700'
                    : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                }`}>
                  {userInitial}
                </div>
                <div className="hidden sm:block pr-1">
                  <div className="text-xs font-semibold text-gray-800 leading-tight">{user?.username}</div>
                  <div className="flex items-center gap-1">
                    {isAdmin && <Shield className="w-2.5 h-2.5 text-gray-400" />}
                    <span className="text-[9px] text-gray-400 font-medium leading-tight">{isAdmin ? 'Admin' : 'User'}</span>
                  </div>
                </div>
                <button onClick={logout} title="Sign out"
                  className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-200/60 transition-colors text-gray-400 hover:text-gray-700">
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-6">
            <SpellInput
              dateKey={state.selectedDate}
              dailyData={selectedData}
              isFullyBlocked={blockStatus.fullBlock}
              blockedMinutes={blockStatus.minutes}
              effectiveLimit={penaltyInfo.effectiveLimit}
              isFutureDate={isFutureSelected}
              onUpdate={updateSpells}
              onReset={resetSpells}
              onOverride={() => setShowOverride(true)}
              isAdmin={isAdmin}
            />
            <Calendar
              month={state.currentMonth}
              year={state.currentYear}
              selectedDate={state.selectedDate}
              blockedDates={state.blockedDates}
              onSelectDate={selectDate}
              onChangeMonth={setMonth}
            />
          </div>

          <div className="lg:col-span-7 space-y-4">
            <StatsPanel
              penaltyInfo={penaltyInfo}
              dailyData={selectedData}
              isBlocked={blockStatus.blocked}
              isFullBlock={blockStatus.fullBlock}
              blockedMinutes={blockStatus.minutes}
            />
            <BehaviorScore
              score={behaviorScore.score}
              grade={behaviorScore.grade}
              label={behaviorScore.label}
              onTimePct={behaviorScore.onTimePct}
              avgPenalty={behaviorScore.avgPenalty}
            />
          </div>
        </div>

        <div className="mt-6">
          <WeeklyChart stats={weeklyStats} />
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="mt-12 text-center">
          <p className="text-xs text-gray-400 font-medium">
            Exceeding limit incurs 1.5× penalty • Penalty ≥ 60 min fully blocks next day &amp; carries forward • Penalty &lt; 60 min reduces next day's limit
          </p>
        </motion.div>
      </main>

      <OverrideModal
        isOpen={showOverride}
        dateKey={state.selectedDate}
        onClose={() => setShowOverride(false)}
        onConfirm={handleOverride}
      />

      <SettingsPanel
        isOpen={showSettings}
        settings={state.settings}
        cloudEnabled={cloudEnabled}
        lastSynced={lastSynced}
        onClose={() => setShowSettings(false)}
        onSaveSettings={updateSettings}
        onResetData={resetAllData}
        onReplaceData={replaceState}
        onForceSync={forceSync}
        onReconfigureCloud={() => window.location.reload()}
      />
    </div>
  );
}

function AppInner() {
  const { user } = useAuth();
  const [setupVersion, setSetupVersion] = useState(0); // bumped when setup completes → forces remount

  if (!user) {
    return <LoginPage />;
  }

  const configured = isSupabaseConfigured();
  const skipped = localStorage.getItem('screentime_setup_skipped') === 'true';

  // First-time user with no cloud config → show setup
  if (!configured && !skipped) {
    return (
      <DbSetupScreen
        onComplete={() => {
          setSetupVersion(v => v + 1);
        }}
        onSkip={() => {
          localStorage.setItem('screentime_setup_skipped', 'true');
          setSetupVersion(v => v + 1);
        }}
      />
    );
  }

  return <Dashboard key={`dash-${setupVersion}`} />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </ThemeProvider>
  );
}
