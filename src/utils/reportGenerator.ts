import type { AppSettings } from '../types';

interface DayData {
  date: string;
  dayName: string;
  spell1: number;
  spell2: number;
  spell3: number;
  total: number;
  limit: number;
  isOver: boolean;
  excess: number;
  penalty: number;
}

function getReportData(settings: AppSettings): { days: DayData[]; totalWeek: number; avgDaily: number; overLimitDays: number; onTimeDays: number; behaviorScore: number; behaviorGrade: string; behaviorLabel: string } {
  const currentUser = JSON.parse(localStorage.getItem('screentime_user') || 'null');
  const key = currentUser?.key;
  const raw = localStorage.getItem(`screentime_state_${key}`) || '{}';
  let parsed: any = {};
  try { parsed = JSON.parse(raw); } catch {}

  const dailyData: Record<string, { spell1: number; spell2: number; spell3: number }> = parsed.dailyData || {};

  const days: DayData[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dk = d.toISOString().split('T')[0];
    const dd = dailyData[dk] || { spell1: 0, spell2: 0, spell3: 0 };
    const total = dd.spell1 + dd.spell2 + dd.spell3;
    const isOver = total > settings.maxTime;
    const excess = Math.max(0, total - settings.maxTime);
    const penalty = Math.round(excess * settings.penaltyRatio);
    days.push({
      date: dk,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      spell1: dd.spell1,
      spell2: dd.spell2,
      spell3: dd.spell3,
      total,
      limit: settings.maxTime,
      isOver,
      excess,
      penalty,
    });
  }

  const totalWeek = days.reduce((s, d) => s + d.total, 0);
  const trackedDays = days.filter(d => d.total > 0).length;
  const avgDaily = trackedDays ? Math.round(totalWeek / trackedDays) : 0;
  const overLimitDays = days.filter(d => d.total > settings.maxTime).length;
  const onTimeDays = days.filter(d => d.total > 0 && d.total <= settings.maxTime).length;

  // Behavior score
  const onTimePct = trackedDays > 0 ? onTimeDays / trackedDays : 0;
  const totalPenalty = days.reduce((s, d) => s + d.penalty, 0);
  const avgPenalty = trackedDays > 0 ? totalPenalty / trackedDays : 0;
  const onTimeScore = onTimePct * 60;
  const penaltyScore = Math.max(0, 40 - avgPenalty * 1.5);
  const score = Math.max(0, Math.min(100, Math.round(onTimeScore + penaltyScore)));
  let grade: string, label: string;
  if (score >= 90) { grade = 'A+'; label = 'Excellent'; }
  else if (score >= 80) { grade = 'A'; label = 'Great'; }
  else if (score >= 70) { grade = 'B'; label = 'Good'; }
  else if (score >= 60) { grade = 'C'; label = 'Fair'; }
  else if (score >= 50) { grade = 'D'; label = 'Needs Work'; }
  else { grade = 'F'; label = 'Poor'; }

  return { days, totalWeek, avgDaily, overLimitDays, onTimeDays, behaviorScore: score, behaviorGrade: grade, behaviorLabel: label };
}

function scoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#eab308';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

export function generateReportHTML(userName: string, settings: AppSettings): string {
  const { days, totalWeek, avgDaily, overLimitDays, onTimeDays, behaviorScore, behaviorGrade, behaviorLabel } = getReportData(settings);
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const maxBarVal = Math.max(settings.maxTime, ...days.map(d => d.total)) || 60;
  const sc = scoreColor(behaviorScore);
  const circumference = 2 * Math.PI * 45;
  const dashOffset = circumference * (1 - behaviorScore / 100);

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Screen Time Report — ${userName}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a;padding:40px;max-width:900px;margin:auto;line-height:1.6}
h1{font-size:28px;font-weight:800;margin-bottom:4px}
.subtitle{color:#666;font-size:14px;margin-bottom:32px}
.section{margin-bottom:32px}
.section-title{font-size:16px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#555;border-bottom:2px solid #e5e5e5;padding-bottom:8px;margin-bottom:16px}
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
.stat-card{background:linear-gradient(135deg,#f8f8f8,#fff);border:1px solid #e5e5e5;border-radius:16px;padding:20px;text-align:center}
.stat-value{font-size:36px;font-weight:800}
.stat-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#999;margin-top:4px}
.blue .stat-value{color:#3b82f6}
.green .stat-value{color:#22c55e}
.red .stat-value{color:#ef4444}
.purple .stat-value{color:#8b5cf6}
.chart-container{display:flex;align-items:end;justify-content:space-between;gap:8px;height:200px;padding:10px 0;margin-bottom:8px}
.bar-group{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%}
.bar-stack{flex:1;width:100%;display:flex;flex-direction:column;justify-content:flex-end;gap:2px;position:relative}
.bar{border-radius:6px 6px 0 0;min-height:2px;transition:height 0.3s}
.bar-s1{background:linear-gradient(to top,#3b82f6,#60a5fa)}
.bar-s2{background:linear-gradient(to top,#8b5cf6,#a78bfa)}
.bar-s3{background:linear-gradient(to top,#f97316,#fbbf24)}
.bar-label{font-size:10px;font-weight:700;color:#999;text-transform:uppercase}
.bar-total{font-size:12px;font-weight:800}
.bar-over{color:#ef4444}
.bar-ok{color:#22c55e}
.limit-line{position:absolute;width:100%;border-top:2px dashed rgba(0,0,0,0.15);z-index:2}
.legend{display:flex;justify-content:center;gap:24px;margin-top:12px;font-size:12px;color:#666}
.legend-item{display:flex;align-items:center;gap:6px}
.legend-dot{width:12px;height:12px;border-radius:4px}
.behavior-card{display:flex;align-items:center;gap:32px;background:linear-gradient(135deg,#fafafa,#fff);border:1px solid #e5e5e5;border-radius:20px;padding:28px 32px}
.score-ring{position:relative;width:120px;height:120px;flex-shrink:0}
.score-text{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.score-number{font-size:36px;font-weight:900}
.score-max{font-size:11px;color:#999;font-weight:600}
.score-details h3{font-size:24px;font-weight:800;margin-bottom:4px}
.score-details .grade-label{font-size:14px;color:#666;margin-bottom:12px}
.score-bar{height:8px;border-radius:4px;background:linear-gradient(to right,#ef4444,#f97316,#eab308,#22c55e);margin-top:8px;position:relative}
.score-marker{position:absolute;top:-4px;width:16px;height:16px;border-radius:50%;background:white;border:3px solid;box-shadow:0 2px 4px rgba(0,0,0,0.2)}
table{width:100%;border-collapse:separate;border-spacing:0;font-size:13px;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5}
th{background:#1a1a1a;color:white;padding:12px 14px;text-align:left;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.5px}
td{padding:10px 14px;border-bottom:1px solid #f0f0f0}
tr:last-child td{border-bottom:none}
tr:nth-child(even) td{background:#fafafa}
.over{color:#ef4444;font-weight:700}
.ok{color:#22c55e;font-weight:600}
.spell-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:4px}
.footer{margin-top:40px;padding-top:16px;border-top:1px solid #e5e5e5;color:#999;font-size:11px;text-align:center}
@media print{body{padding:20px}@page{margin:15mm}}
</style></head><body>
<h1>📊 Screen Time Report</h1>
<p class="subtitle">Generated for <strong>${userName}</strong> on ${today}</p>

<div class="section">
  <div class="section-title">📈 Weekly Summary</div>
  <div class="stats-grid">
    <div class="stat-card blue"><div class="stat-value">${totalWeek}</div><div class="stat-label">Total Minutes</div></div>
    <div class="stat-card purple"><div class="stat-value">${avgDaily}</div><div class="stat-label">Avg Daily</div></div>
    <div class="stat-card green"><div class="stat-value">${onTimeDays}/7</div><div class="stat-label">On-Time Days</div></div>
    <div class="stat-card red"><div class="stat-value">${overLimitDays}</div><div class="stat-label">Over-Limit</div></div>
  </div>
</div>

<div class="section">
  <div class="section-title">📊 Spell-wise Daily Chart</div>
  <div class="chart-container">
    ${days.map(d => {
      const s1h = maxBarVal > 0 ? (d.spell1 / maxBarVal) * 100 : 0;
      const s2h = maxBarVal > 0 ? (d.spell2 / maxBarVal) * 100 : 0;
      const s3h = maxBarVal > 0 ? (d.spell3 / maxBarVal) * 100 : 0;
      const limitPct = maxBarVal > 0 ? (d.limit / maxBarVal) * 100 : 0;
      return `<div class="bar-group">
        <div class="bar-total ${d.isOver ? 'bar-over' : 'bar-ok'}">${d.total || '–'}</div>
        <div class="bar-stack">
          <div class="limit-line" style="bottom:${limitPct}%"></div>
          <div class="bar bar-s3" style="height:${s3h}%"></div>
          <div class="bar bar-s2" style="height:${s2h}%"></div>
          <div class="bar bar-s1" style="height:${s1h}%"></div>
        </div>
        <div class="bar-label">${d.dayName.split(',')[0].split(' ')[0]}</div>
      </div>`;
    }).join('')}
  </div>
  <div class="legend">
    <div class="legend-item"><div class="legend-dot" style="background:linear-gradient(135deg,#3b82f6,#60a5fa)"></div>Spell 1</div>
    <div class="legend-item"><div class="legend-dot" style="background:linear-gradient(135deg,#8b5cf6,#a78bfa)"></div>Spell 2</div>
    <div class="legend-item"><div class="legend-dot" style="background:linear-gradient(135deg,#f97316,#fbbf24)"></div>Spell 3</div>
    <div class="legend-item"><div class="legend-dot" style="border:2px dashed #ccc;background:transparent"></div>Daily Limit (${settings.maxTime}m)</div>
  </div>
</div>

<div class="section">
  <div class="section-title">🏆 Behavior Score</div>
  <div class="behavior-card">
    <div class="score-ring">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="45" fill="none" stroke="#f0f0f0" stroke-width="8"/>
        <circle cx="60" cy="60" r="45" fill="none" stroke="${sc}" stroke-width="8" stroke-linecap="round"
          stroke-dasharray="${circumference}" stroke-dashoffset="${dashOffset}"
          transform="rotate(-90 60 60)" style="filter:drop-shadow(0 0 4px ${sc}40)"/>
      </svg>
      <div class="score-text">
        <div class="score-number" style="color:${sc}">${behaviorScore}</div>
        <div class="score-max">/ 100</div>
      </div>
    </div>
    <div class="score-details">
      <h3 style="color:${sc}">${behaviorGrade}</h3>
      <div class="grade-label">${behaviorLabel}</div>
      <div style="font-size:13px;color:#666">
        <div>On-time rate: <strong>${onTimeDays > 0 ? Math.round((onTimeDays / Math.max(1, days.filter(d => d.total > 0).length)) * 100) : 0}%</strong></div>
        <div>Over-limit days: <strong style="color:#ef4444">${overLimitDays}</strong></div>
      </div>
      <div class="score-bar">
        <div class="score-marker" style="left:calc(${behaviorScore}% - 8px);border-color:${sc}"></div>
      </div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">📋 Detailed Breakdown</div>
  <table>
    <thead><tr><th>Date</th><th><span class="spell-dot" style="background:#3b82f6"></span>Spell 1</th><th><span class="spell-dot" style="background:#8b5cf6"></span>Spell 2</th><th><span class="spell-dot" style="background:#f97316"></span>Spell 3</th><th>Total</th><th>Limit</th><th>Status</th></tr></thead>
    <tbody>
      ${days.map(d => {
        const statusCls = d.total === 0 ? '' : d.isOver ? 'over' : 'ok';
        const statusText = d.total === 0 ? '—' : d.isOver ? `Over (+${d.excess})` : '✓ On Time';
        return `<tr><td><strong>${d.dayName}</strong></td><td>${d.spell1}</td><td>${d.spell2}</td><td>${d.spell3}</td><td><strong>${d.total}</strong></td><td>${d.limit}</td><td class="${statusCls}">${statusText}</td></tr>`;
      }).join('')}
    </tbody>
  </table>
</div>

<div class="section">
  <div class="section-title">⚙️ Settings</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px;color:#666">
    <div>Daily Limit: <strong>${settings.maxTime} min</strong></div>
    <div>Penalty Multiplier: <strong>${settings.penaltyRatio}×</strong></div>
    <div>Block Threshold: <strong>${settings.fullBlockThreshold} min</strong></div>
    <div>Carry Forward: <strong>${settings.carryForwardEnabled ? 'On' : 'Off'}</strong></div>
  </div>
</div>

<div class="footer">Screen Time Tracker — Report generated on ${today}</div>
</body></html>`;
}
