import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';
import {
  Trophy, TrendingUp, TrendingDown, Target, AlertCircle, CheckCircle,
  BookOpen, FlaskConical, Brain, Globe, Clock, BarChart3, Star, Zap, Activity
} from 'lucide-react';
import { cn } from '../lib/utils';
import {
  loadPerformanceData,
  readLiveSession,
  getLiveStats,
  saveTestResult,
  recalculateOverall,
} from '../lib/performanceEngine';
export type { TestResult, PerformanceData, SubjectBreakdown } from '../lib/performanceEngine';
export { saveTestResult, recalculateOverall };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
};

const formatDate = (dateStr: string) => {
  try {
    const [d, m, y] = dateStr.split('-');
    return new Date(`${y}-${m}-${d}`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
};

const accuracyColor = (pct: number) => {
  if (pct >= 80) return '#16a34a';
  if (pct >= 60) return '#d97706';
  return '#dc2626';
};

const SUBJECT_META: Record<string, { icon: React.ComponentType<{ size?: number; className?: string }>; color: string; bg: string }> = {
  'Mathematics':       { icon: Target,       color: '#3b82f6', bg: 'bg-blue-50' },
  'Reasoning':         { icon: Brain,        color: '#8b5cf6', bg: 'bg-purple-50' },
  'General Science':   { icon: FlaskConical, color: '#10b981', bg: 'bg-emerald-50' },
  'General Awareness': { icon: Globe,        color: '#f59e0b', bg: 'bg-amber-50' },
};

// ─── Custom Tooltips ──────────────────────────────────────────────────────────

const LineTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const pct = payload[0].value;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-sm">
      <p className="font-bold text-slate-700 mb-1">{label}</p>
      <p className="font-black" style={{ color: pct >= 50 ? '#16a34a' : '#dc2626' }}>{pct}%</p>
    </div>
  );
};

const BarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const pct = payload[0].value;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-sm">
      <p className="font-bold text-slate-700 mb-1">{label}</p>
      <p className="font-black" style={{ color: accuracyColor(pct) }}>{pct}%</p>
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  bgColor: string;
  textColor: string;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
}

function StatCard({ label, value, icon: Icon, bgColor, textColor, subtext, trend }: StatCardProps) {
  return (
    <div className={cn('rounded-2xl p-5 text-white relative overflow-hidden shadow-md', bgColor)}>
      <div className="absolute right-4 top-4 opacity-20">
        <Icon size={48} />
      </div>
      <div className="relative z-10">
        <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">{label}</p>
        <div className="flex items-end gap-2">
          <p className="text-4xl font-black">{value}</p>
          {trend === 'up' && <TrendingUp size={20} className="mb-1 opacity-80" />}
          {trend === 'down' && <TrendingDown size={20} className="mb-1 opacity-80" />}
        </div>
        {subtext && <p className="text-xs opacity-70 mt-1 font-medium">{subtext}</p>}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
        <Trophy size={48} className="text-amber-500" />
      </div>
      <h2 className="text-2xl font-black text-slate-800 mb-2">No performance data yet</h2>
      <p className="text-slate-500 mb-8 max-w-sm">
        Complete a mock test or subject practice session to see your progress, accuracy, and weak areas here.
      </p>
      <button
        onClick={onNavigate}
        className="bg-[#002045] text-white px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#1a365d] transition-colors shadow-lg"
      >
        <Zap size={18} /> Start Practice Now
      </button>
    </div>
  );
}

// ─── Loading State ────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-72 bg-slate-200 rounded-2xl" />
        <div className="h-72 bg-slate-200 rounded-2xl" />
      </div>
    </div>
  );
}

// ─── Live Session Banner ──────────────────────────────────────────────────────

import type { PerformanceData } from '../lib/performanceEngine';

function LiveSessionBanner() {
  const [live, setLive] = useState<{ answered: number; correct: number; accuracy: number; type: string; subject: string } | null>(null);

  useEffect(() => {
    const check = () => {
      const session = readLiveSession();
      if (!session) { setLive(null); return; }
      const stats = getLiveStats();
      if (stats) setLive({ ...stats, type: session.type, subject: session.subject });
      else setLive(null);
    };
    check();
    const id = setInterval(check, 2000); // refresh every 2 sec
    return () => clearInterval(id);
  }, []);

  if (!live) return null;

  return (
    <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4 animate-pulse-slow">
      <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
      <div className="flex-1">
        <p className="text-xs font-black text-green-800">
          LIVE — {live.type} in Progress
          <span className="font-normal text-green-600 ml-2">{live.subject}</span>
        </p>
        <p className="text-[10px] text-green-600 mt-0.5">
          {live.answered} answered • {live.correct} correct • {live.accuracy}% accuracy — saved automatically
        </p>
      </div>
      <Activity size={16} className="text-green-600 shrink-0" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface PerformanceTrackerProps {
  onNavigateTo?: (tab: string) => void;
}

export default function PerformanceTracker({ onNavigateTo }: PerformanceTrackerProps) {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  // Reload from storage every 3 seconds to pick up live data
  useEffect(() => {
    const load = async () => {
      try {
        const result = await loadPerformanceData();
        setData(result);
      } catch (e) {
        console.error('Load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, []);

  if (loading) return <LoadingSkeleton />;

  if (!data || data.tests.length === 0) {
    return (
      <>
        <LiveSessionBanner />
        <EmptyState onNavigate={() => onNavigateTo?.('practice')} />
      </>
    );
  }

  const { tests, overall } = data;
  const recent5 = [...tests].reverse().slice(0, 5);
  const last10 = tests.slice(-10);
  const prevScore = tests.length >= 2 ? tests[tests.length - 2].percentage : null;
  const lastScore = overall.last_score_percentage;
  const isImproved = prevScore !== null ? lastScore >= prevScore : true;

  // Line chart data
  const trendData = last10.map((t, i) => ({
    name: `Test ${tests.indexOf(t) + 1}`,
    score: t.percentage,
    type: t.type,
  }));

  const lineColor = (last10[last10.length - 1]?.percentage ?? 0) >= 50 ? '#16a34a' : '#dc2626';

  // Bar chart: subject accuracy
  const subjectOrder = ['Mathematics', 'Reasoning', 'General Science', 'General Awareness'];
  const barData = subjectOrder
    .filter(s => overall.subject_accuracy[s] !== undefined)
    .map(subj => ({
      subject: subj === 'General Science' ? 'Science' : subj === 'General Awareness' ? 'GK' : subj,
      fullSubject: subj,
      accuracy: overall.subject_accuracy[subj] ?? 0,
    }));

  // Weak areas (< 60%)
  const weakTopics = Object.entries(overall.topic_accuracy)
    .filter(([, acc]) => acc < 60)
    .sort(([, a], [, b]) => a - b)
    .slice(0, 8);

  const weakSubjects = Object.entries(overall.subject_accuracy)
    .filter(([, acc]) => acc < 60)
    .sort(([, a], [, b]) => a - b);

  // Strong areas (> 80%)
  const strongTopics = Object.entries(overall.topic_accuracy)
    .filter(([, acc]) => acc >= 80)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  const strongSubjects = Object.entries(overall.subject_accuracy)
    .filter(([, acc]) => acc >= 80)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="space-y-6 pb-8">

      {/* ── Live Session Indicator ─────────────────────────────────── */}
      <LiveSessionBanner />

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-[#002045] tracking-tight">Performance Tracker</h2>
          <p className="text-slate-500 text-sm mt-1">
            {overall.total_tests} test{overall.total_tests !== 1 ? 's' : ''} • {overall.total_questions.toLocaleString()} questions attempted
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Overall Accuracy</p>
          <p className="text-4xl font-black" style={{ color: accuracyColor(overall.overall_accuracy) }}>
            {overall.overall_accuracy}%
          </p>
        </div>
      </div>

      {/* ── SECTION 1: Stat Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tests Taken"
          value={overall.total_tests}
          icon={BookOpen}
          bgColor="bg-[#1a237e]"
          textColor="text-white"
          subtext={`${overall.total_questions} total questions`}
        />
        <StatCard
          label="Overall Accuracy"
          value={`${overall.overall_accuracy}%`}
          icon={Target}
          bgColor={overall.overall_accuracy >= 60 ? 'bg-green-700' : 'bg-red-700'}
          textColor="text-white"
          subtext={`${overall.total_correct} correct answers`}
        />
        <StatCard
          label="Best Score"
          value={`${overall.best_score_percentage}%`}
          icon={Star}
          bgColor="bg-amber-600"
          textColor="text-white"
          subtext="Personal record"
        />
        <StatCard
          label="Last Score"
          value={`${lastScore}%`}
          icon={isImproved ? TrendingUp : TrendingDown}
          bgColor={isImproved ? 'bg-green-600' : 'bg-red-600'}
          textColor="text-white"
          subtext={prevScore !== null ? `Was ${prevScore}% previous` : 'First test!'}
          trend={isImproved ? 'up' : 'down'}
        />
      </div>

      {/* ── SECTION 2 & 3: Charts ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Score Trend Line Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-[#002045]" />
            <h3 className="font-black text-[#002045] text-sm">Score Trend</h3>
            <span className="text-xs text-slate-400 ml-auto">Last {last10.length} tests</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
                axisLine={false} 
                tickLine={false}
              />
              <YAxis 
                domain={[0, 100]} 
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
                axisLine={false} 
                tickLine={false}
              />
              <Tooltip content={<LineTooltip />} />
              <ReferenceLine 
                y={50} 
                stroke="#f59e0b" 
                strokeDasharray="5 5" 
                strokeWidth={2}
                label={{ value: 'RRB Cutoff ~50%', position: 'insideTopRight', fontSize: 9, fill: '#f59e0b', fontWeight: 700 }} 
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke={lineColor}
                strokeWidth={3}
                dot={{ r: 5, fill: lineColor, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7, fill: lineColor, strokeWidth: 2, stroke: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Subject Accuracy Bar Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={18} className="text-[#002045]" />
            <h3 className="font-black text-[#002045] text-sm">Subject-Wise Accuracy</h3>
          </div>
          {barData.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-slate-400 text-sm">
              No subject data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="subject" 
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} 
                  axisLine={false} 
                  tickLine={false}
                />
                <YAxis 
                  domain={[0, 100]} 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
                  axisLine={false} 
                  tickLine={false}
                />
                <Tooltip content={<BarTooltip />} />
                <Bar dataKey="accuracy" radius={[6, 6, 0, 0]} maxBarSize={60}
                  label={{ position: 'top', fontSize: 10, fontWeight: 700, formatter: (v: number) => `${v}%` }}>
                  {barData.map((entry, index) => (
                    <Cell key={index} fill={accuracyColor(entry.accuracy)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          {/* Legend */}
          <div className="flex items-center gap-4 mt-2 justify-center text-[10px] font-bold text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-600 inline-block"></span>Strong (≥80%)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-600 inline-block"></span>Average (60-80%)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-600 inline-block"></span>Weak (&lt;60%)</span>
          </div>
        </div>
      </div>

      {/* ── SECTION 4: Subject Accuracy Cards ───────────────────────── */}
      {barData.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {subjectOrder.filter(s => overall.subject_accuracy[s] !== undefined).map(subj => {
            const acc = overall.subject_accuracy[subj] ?? 0;
            const meta = SUBJECT_META[subj];
            const Icon = meta?.icon ?? Target;
            return (
              <div key={subj} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', meta?.bg ?? 'bg-slate-100')}>
                    <Icon size={16} style={{ color: meta?.color ?? '#64748b' }} />
                  </div>
                  <p className="text-xs font-bold text-slate-600 leading-tight">
                    {subj === 'General Science' ? 'Sci.' : subj === 'General Awareness' ? 'GK' : subj}
                  </p>
                </div>
                <p className="text-2xl font-black" style={{ color: accuracyColor(acc) }}>{acc}%</p>
                <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${acc}%`, backgroundColor: accuracyColor(acc) }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── SECTION 5: Weak & Strong Areas ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Weak Areas */}
        <div className="bg-white rounded-2xl shadow-sm border-2 border-red-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={18} className="text-red-500" />
            <h3 className="font-black text-red-700 text-sm">Weak Areas</h3>
            <span className="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-bold border border-red-200 ml-auto">
              Below 60%
            </span>
          </div>

          {weakSubjects.length === 0 && weakTopics.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle size={32} className="text-green-500 mb-2" />
              <p className="font-bold text-green-700 text-sm">Great! No weak areas yet</p>
              <p className="text-xs text-slate-400 mt-1">Keep it up!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {weakSubjects.map(([subj, acc]) => (
                <div key={subj} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertCircle size={13} className="text-red-500 shrink-0" />
                    <span className="text-sm font-bold text-red-800 truncate">{subj}</span>
                    <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold border border-red-200 shrink-0">Subject</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-sm font-black text-red-700">{acc}%</span>
                    <span className="text-[9px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">Needs Work</span>
                  </div>
                </div>
              ))}
              {weakTopics.map(([topic, acc]) => (
                <div key={topic} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertCircle size={13} className="text-red-400 shrink-0" />
                    <span className="text-sm font-semibold text-red-700 truncate">{topic}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-sm font-black text-red-700">{acc}%</span>
                    <span className="text-[9px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">Needs Work</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Strong Areas */}
        <div className="bg-white rounded-2xl shadow-sm border-2 border-green-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={18} className="text-green-500" />
            <h3 className="font-black text-green-700 text-sm">Strong Areas</h3>
            <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-bold border border-green-200 ml-auto">
              Above 80%
            </span>
          </div>

          {strongSubjects.length === 0 && strongTopics.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Target size={32} className="text-slate-300 mb-2" />
              <p className="font-bold text-slate-500 text-sm">Keep practicing to build strong areas</p>
              <p className="text-xs text-slate-400 mt-1">Score above 80% consistently to unlock</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {strongSubjects.map(([subj, acc]) => (
                <div key={subj} className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle size={13} className="text-green-500 shrink-0" />
                    <span className="text-sm font-bold text-green-800 truncate">{subj}</span>
                    <span className="text-[9px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded font-bold border border-green-200 shrink-0">Subject</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-sm font-black text-green-700">{acc}%</span>
                    <span className="text-[9px] bg-green-600 text-white px-2 py-0.5 rounded-full font-bold">Strong</span>
                  </div>
                </div>
              ))}
              {strongTopics.map(([topic, acc]) => (
                <div key={topic} className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle size={13} className="text-green-400 shrink-0" />
                    <span className="text-sm font-semibold text-green-700 truncate">{topic}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-sm font-black text-green-700">{acc}%</span>
                    <span className="text-[9px] bg-green-600 text-white px-2 py-0.5 rounded-full font-bold">Strong</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION 6: Recent Tests Table ────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex items-center gap-2 p-5 border-b border-slate-100">
          <Clock size={18} className="text-[#002045]" />
          <h3 className="font-black text-[#002045] text-sm">Recent Tests</h3>
          <span className="text-xs text-slate-400 ml-auto">Last 5 sessions</span>
        </div>

        {recent5.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="font-bold">No tests yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <th className="px-5 py-3 text-left">Date</th>
                  <th className="px-5 py-3 text-left">Type</th>
                  <th className="px-5 py-3 text-left">Subject / Topic</th>
                  <th className="px-5 py-3 text-center">Score</th>
                  <th className="px-5 py-3 text-center">Accuracy</th>
                  <th className="px-5 py-3 text-center">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recent5.map((t, i) => (
                  <tr key={t.test_id} className={cn('hover:bg-slate-50 transition-colors', i === 0 && 'bg-blue-50/30')}>
                    <td className="px-5 py-4 text-slate-600 font-medium whitespace-nowrap text-xs">
                      {i === 0 && <span className="bg-[#1a237e] text-white text-[9px] px-1.5 py-0.5 rounded font-bold mr-1.5">Latest</span>}
                      {formatDate(t.date)}
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn(
                        'text-[10px] font-bold px-2.5 py-1 rounded-full border',
                        t.type === 'Mock Test'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                      )}>
                        {t.type}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600 text-xs max-w-[160px] truncate">
                      {t.subject === 'All' ? 'Full Mock' : `${t.subject}${t.topic !== 'All' ? ` › ${t.topic}` : ''}`}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="font-black text-[#002045]">{t.score}</span>
                      <span className="text-slate-400 text-xs">/{t.total}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={cn(
                        'font-black text-sm px-2.5 py-1 rounded-xl',
                        t.percentage >= 60 ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
                      )}>
                        {t.percentage}%
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center text-slate-500 text-xs font-mono whitespace-nowrap">
                      {formatTime(t.time_seconds)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
