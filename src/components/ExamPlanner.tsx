import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import {
  Calendar, ChevronLeft, ChevronRight, Flame, Target,
  X, Settings, Bell, TrendingUp, TrendingDown, Minus,
  Award, Clock, Download, RotateCcw, BarChart2, Star,
  CalendarDays, BookOpen, Zap, AlertTriangle, CheckCircle2,
  ClipboardList, Activity,
} from 'lucide-react';
import { cn } from '../lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Setup {
  examDate: string;
  category: 'General' | 'OBC' | 'SC' | 'ST';
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  dailyHours: '1-2 hrs' | '3-4 hrs' | '5+ hrs';
}

interface DayLog {
  status: 'studied' | 'partial' | 'missed' | '';
  notes: string;
  questions: number;
  mockScore: number | null;
  mockTaken: boolean;
  mockSubjects: { maths: number; reasoning: number; science: number; gk: number };
  mood: 'confident' | 'okay' | 'struggling' | 'overwhelmed' | '';
  hours: number;
  futurePlan?: string;
  isMockDay?: boolean;
}

interface MockScore {
  date: string;
  score: number;
  maths: number;
  reasoning: number;
  science: number;
  gk: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CUTOFFS: Record<string, number> = { General: 82, OBC: 77, SC: 70, ST: 65 };
const SAFE_ZONE = 85;

const SCHEDULE = [
  { day: 1,  maths: 'Number System',        reasoning: 'Analogy & Series',       science: 'Force & Motion',        gk: 'Indian History' },
  { day: 2,  maths: 'LCM & HCF',            reasoning: 'Classification',         science: 'Work & Energy',         gk: 'Geography of India' },
  { day: 3,  maths: 'Simplification',        reasoning: 'Coding-Decoding',        science: 'Gravity',               gk: 'Indian Polity' },
  { day: 4,  maths: 'Fractions & Decimals',  reasoning: 'Blood Relations',        science: 'Sound & Light',         gk: 'Indian Economy' },
  { day: 5,  maths: 'Square Roots',          reasoning: 'Direction & Distance',   science: 'Heat & Temperature',   gk: 'Current Affairs' },
  { day: 6,  maths: 'Percentage',            reasoning: 'Ranking & Arrangement',  science: 'Electricity',           gk: 'Sports & Awards' },
  { day: 7,  maths: 'REVISION + Mock',       reasoning: 'REVISION + Mock',        science: 'REVISION + Mock',       gk: 'REVISION + Mock' },
  { day: 8,  maths: 'Profit & Loss',         reasoning: 'Syllogism',              science: 'Magnetism',             gk: 'Indian Freedom Movement' },
  { day: 9,  maths: 'Discount',              reasoning: 'Statements & Arguments', science: 'Atomic Structure',      gk: 'World Geography' },
  { day: 10, maths: 'Simple Interest',       reasoning: 'Number Puzzles',         science: 'Chemical Reactions',    gk: 'Inventions & Discoveries' },
  { day: 11, maths: 'Compound Interest',     reasoning: 'Calendar & Clocks',      science: 'Acids & Bases',         gk: 'National Parks & Wildlife' },
  { day: 12, maths: 'Ratio & Proportion',    reasoning: 'Venn Diagrams',          science: 'Periodic Table',        gk: 'Rivers & Lakes' },
  { day: 13, maths: 'Average',               reasoning: 'Sitting Arrangements',   science: 'Metals & Non-Metals',   gk: 'Indian Art & Culture' },
  { day: 14, maths: 'REVISION + Mock',       reasoning: 'REVISION + Mock',        science: 'REVISION + Mock',       gk: 'REVISION + Mock' },
  { day: 15, maths: 'Time & Work',           reasoning: 'Matrix & Mirror Image',  science: 'Carbon Compounds',      gk: 'Science & Technology' },
  { day: 16, maths: 'Pipes & Cisterns',      reasoning: 'Paper Folding',          science: 'Plant Kingdom',         gk: 'Famous Personalities' },
  { day: 17, maths: 'Speed, Time & Distance',reasoning: 'Embedded Figures',       science: 'Animal Kingdom',        gk: 'Dams & Projects' },
  { day: 18, maths: 'Trains & Boats',        reasoning: 'Figure Completion',      science: 'Cell Structure',        gk: 'Climate & Weather' },
  { day: 19, maths: 'Mensuration 2D',        reasoning: 'Cube & Dice',            science: 'Human Nutrition',       gk: 'Indian Railways GK' },
  { day: 20, maths: 'Mensuration 3D',        reasoning: 'Logical Sequences',      science: 'Respiration',           gk: 'Constitution of India' },
  { day: 21, maths: 'REVISION + Mock',       reasoning: 'REVISION + Mock',        science: 'REVISION + Mock',       gk: 'REVISION + Mock' },
  { day: 22, maths: 'Algebra Basics',        reasoning: 'Arithmetic Reasoning',   science: 'Circulatory System',    gk: 'Awards & Prizes' },
  { day: 23, maths: 'Linear Equations',      reasoning: 'Analogies (Advanced)',   science: 'Skeletal System',       gk: 'India & World Orgs' },
  { day: 24, maths: 'Quadratic Equations',   reasoning: 'Series Completion',      science: 'Reproductive System',   gk: 'Defence & Space' },
  { day: 25, maths: 'Geometry Basics',       reasoning: 'Non-Verbal Analogies',   science: 'Nervous System',        gk: 'Minerals & Industries' },
  { day: 26, maths: 'Triangles & Circles',   reasoning: 'Pattern Completion',     science: 'Environment',           gk: 'Statistical Data' },
  { day: 27, maths: 'Co-ordinate Geometry',  reasoning: 'Jumbled Sentences',      science: 'Ecosystem & Pollution', gk: 'Important Days' },
  { day: 28, maths: 'REVISION + Mock',       reasoning: 'REVISION + Mock',        science: 'REVISION + Mock',       gk: 'REVISION + Mock' },
  { day: 29, maths: 'Trigonometry',          reasoning: 'Comprehensive Review',   science: 'Disease & Health',      gk: 'India at a Glance' },
  { day: 30, maths: 'Statistics',            reasoning: 'Speed Math Techniques',  science: 'Measurement Units',     gk: 'Full GK Revision' },
];

function getTopics(dayNum: number) {
  return SCHEDULE[(dayNum - 1) % SCHEDULE.length] || SCHEDULE[0];
}

function dateKey(d: Date) { return d.toISOString().slice(0, 10); }
function daysBetween(a: Date, b: Date) { return Math.round((b.getTime() - a.getTime()) / 86400000); }

// ─── Setup Screen ─────────────────────────────────────────────────────────────
function SetupScreen({ onSave }: { onSave: (s: Setup) => void }) {
  const [form, setForm] = useState<Partial<Setup>>({});

  return (
    <div className="max-w-lg mx-auto">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-primary to-primary-container rounded-2xl p-8 mb-6 text-white shadow-lg">
        <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mb-4">
          <Target size={28} />
        </div>
        <h2 className="text-2xl font-black mb-1">RRB Group D Planner</h2>
        <p className="text-white/70 text-sm">Set up your personalised prep plan and get started.</p>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high space-y-6">
        {/* Exam Date */}
        <div>
          <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">📅 Exam Date</label>
          <input type="date"
            className="w-full rounded-xl px-4 py-3 text-sm border border-surface-container-high bg-surface focus:outline-none focus:border-primary transition-colors"
            value={form.examDate || ''}
            onChange={e => setForm(p => ({ ...p, examDate: e.target.value }))} />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">🏷️ Category</label>
          <div className="grid grid-cols-4 gap-2">
            {(['General', 'OBC', 'SC', 'ST'] as const).map(c => (
              <button key={c} onClick={() => setForm(p => ({ ...p, category: c }))}
                className={cn('py-2.5 rounded-xl text-sm font-bold border-2 transition-all',
                  form.category === c
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-surface border-surface-container-high text-on-surface-variant hover:border-primary/40')}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Level */}
        <div>
          <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">📊 Current Level</label>
          <div className="grid grid-cols-3 gap-2">
            {(['Beginner', 'Intermediate', 'Advanced'] as const).map(l => (
              <button key={l} onClick={() => setForm(p => ({ ...p, level: l }))}
                className={cn('py-2.5 rounded-xl text-sm font-bold border-2 transition-all',
                  form.level === l
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-surface border-surface-container-high text-on-surface-variant hover:border-primary/40')}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Study Hours */}
        <div>
          <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">⏱️ Daily Study Hours</label>
          <div className="grid grid-cols-3 gap-2">
            {(['1-2 hrs', '3-4 hrs', '5+ hrs'] as const).map(h => (
              <button key={h} onClick={() => setForm(p => ({ ...p, dailyHours: h }))}
                className={cn('py-2.5 rounded-xl text-sm font-bold border-2 transition-all',
                  form.dailyHours === h
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-surface border-surface-container-high text-on-surface-variant hover:border-primary/40')}>
                {h}
              </button>
            ))}
          </div>
        </div>

        <button
          disabled={!form.examDate || !form.category || !form.level || !form.dailyHours}
          onClick={() => onSave(form as Setup)}
          className="w-full py-4 rounded-xl font-black text-white bg-primary hover:bg-primary/90 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed text-base">
          🚀 Start My Preparation
        </button>
      </div>
    </div>
  );
}

// ─── Main Planner ─────────────────────────────────────────────────────────────
export function ExamPlanner() {
  const [setup, setSetup] = useState<Setup | null>(() => {
    try { const s = localStorage.getItem('rrb_setup'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalMode, setModalMode] = useState<'past' | 'future'>('past');
  const [modalLog, setModalLog] = useState<Partial<DayLog>>({});
  const [activeTab, setActiveTab] = useState<'planner' | 'progress' | 'alerts' | 'settings'>('planner');
  const [resetConfirm, setResetConfirm] = useState(false);
  const [settingsForm, setSettingsForm] = useState<Partial<Setup>>({});

  const [dayLogs, setDayLogs] = useState<Record<string, DayLog>>(() => {
    const out: Record<string, DayLog> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (k.startsWith('rrb_day_')) {
        try { out[k.replace('rrb_day_', '')] = JSON.parse(localStorage.getItem(k)!); } catch {}
      }
    }
    return out;
  });
  const [mockScores, setMockScores] = useState<MockScore[]>(() => {
    try { const s = localStorage.getItem('rrb_mock_scores'); return s ? JSON.parse(s) : []; } catch { return []; }
  });

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const examDate = setup ? new Date(setup.examDate + 'T00:00:00') : null;
  const daysLeft = examDate ? daysBetween(today, examDate) : null;
  const cutoff = setup ? CUTOFFS[setup.category] : 82;

  const urgency = daysLeft == null ? 'calm' : daysLeft > 60 ? 'calm' : daysLeft > 30 ? 'warning' : 'danger';
  const urgencyColor = urgency === 'calm' ? 'text-primary' : urgency === 'warning' ? 'text-amber-600' : 'text-red-600';
  const urgencyBg = urgency === 'calm' ? 'from-primary to-primary-container' : urgency === 'warning' ? 'from-amber-500 to-orange-600' : 'from-red-500 to-red-700';

  const motivationalMsg = daysLeft == null ? '' : daysLeft > 60
    ? 'Great time to build strong foundations. Stay consistent!'
    : daysLeft > 30 ? 'Mid-phase — time to pick up speed. No days off!'
    : daysLeft > 15 ? 'Final stretch! Revise hard, mock test daily!'
    : 'Last push! Only mock tests and weak topics now!';

  // Streak
  const streak = useMemo(() => {
    let s = 0; const d = new Date(today);
    while (true) {
      const log = dayLogs[dateKey(d)];
      if (log?.status === 'studied') { s++; d.setDate(d.getDate() - 1); } else break;
    }
    return s;
  }, [dayLogs, today]);

  const totalStudied = Object.values(dayLogs).filter(l => l.status === 'studied').length;
  const totalQuestions = Object.values(dayLogs).reduce((a, l) => a + (l.questions || 0), 0);

  // Prep progress
  const prepStartDate = useMemo(() => {
    if (!examDate) return today;
    const d = new Date(examDate);
    d.setDate(d.getDate() - 90);
    return d;
  }, [examDate]);
  const totalPrepDays = examDate ? daysBetween(prepStartDate, examDate) : 90;
  const prepProgress = daysLeft != null ? Math.max(0, Math.min(100, Math.round((1 - daysLeft / totalPrepDays) * 100))) : 0;

  // Calendar
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();

  function getDayStatus(ds: string) {
    if (examDate && ds === dateKey(examDate)) return 'exam';
    const d = new Date(ds + 'T00:00:00');
    if (ds === dateKey(today)) return 'today';
    if (d > today) return 'future';
    return dayLogs[ds]?.status || 'empty';
  }

  // Weekly
  const weekDays = useMemo(() => {
    const dow = today.getDay();
    const mon = new Date(today);
    mon.setDate(today.getDate() - ((dow + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d; });
  }, [today]);
  const weekLogs = weekDays.map(d => dayLogs[dateKey(d)]);
  const weekStudied = weekLogs.filter(l => l?.status === 'studied').length;
  const weekQuestions = weekLogs.reduce((a, l) => a + (l?.questions || 0), 0);
  const weekHours = weekLogs.reduce((a, l) => a + (l?.hours || 0), 0);
  const weekMocks = weekLogs.filter(l => l?.mockTaken && l?.mockScore != null).map(l => l!.mockScore as number);
  const avgMock = weekMocks.length ? Math.round(weekMocks.reduce((a, b) => a + b, 0) / weekMocks.length) : null;

  // Charts
  const last10Mocks = mockScores.slice(-10).map(m => ({ date: m.date.slice(5), score: m.score }));
  const trendDir = last10Mocks.length >= 2
    ? last10Mocks.at(-1)!.score > last10Mocks.at(-2)!.score ? 'up'
    : last10Mocks.at(-1)!.score < last10Mocks.at(-2)!.score ? 'down' : 'stable'
    : 'stable';

  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - 13 + i);
    return { date: d.toLocaleDateString('en', { weekday: 'short' }).slice(0, 2), questions: dayLogs[dateKey(d)]?.questions || 0 };
  });

  const avgSubjectScores = mockScores.length ? {
    maths:     Math.round(mockScores.reduce((a, m) => a + m.maths, 0) / mockScores.length),
    reasoning: Math.round(mockScores.reduce((a, m) => a + m.reasoning, 0) / mockScores.length),
    science:   Math.round(mockScores.reduce((a, m) => a + m.science, 0) / mockScores.length),
    gk:        Math.round(mockScores.reduce((a, m) => a + m.gk, 0) / mockScores.length),
  } : { maths: 0, reasoning: 0, science: 0, gk: 0 };
  const lastMock = mockScores.at(-1);
  const subjectData = [
    { name: 'Maths', max: 25, last: lastMock?.maths || 0, avg: avgSubjectScores.maths },
    { name: 'Reasoning', max: 30, last: lastMock?.reasoning || 0, avg: avgSubjectScores.reasoning },
    { name: 'Science', max: 25, last: lastMock?.science || 0, avg: avgSubjectScores.science },
    { name: 'GK', max: 20, last: lastMock?.gk || 0, avg: avgSubjectScores.gk },
  ];
  const weakIdx = subjectData.reduce((wi, d, i) => (d.avg / d.max < subjectData[wi].avg / subjectData[wi].max) ? i : wi, 0);

  // Alerts
  const alerts = useMemo(() => {
    const list: { type: 'error' | 'warning' | 'success' | 'info'; msg: string }[] = [];
    let missedStreak = 0;
    for (let i = 1; i <= 5; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const l = dayLogs[dateKey(d)];
      if (!l || !l.status || l.status === 'missed') missedStreak++; else break;
    }
    if (missedStreak >= 2) list.push({ type: 'error', msg: `You've missed ${missedStreak} days! Don't break the chain!` });
    if (last10Mocks.length >= 3) {
      const last3 = last10Mocks.slice(-3);
      if (last3[2].score < last3[1].score && last3[1].score < last3[0].score)
        list.push({ type: 'warning', msg: 'Scores dropping — review weak topics!' });
    }
    const last3Q = [1, 2, 3].map(i => { const d = new Date(today); d.setDate(today.getDate() - i); return dayLogs[dateKey(d)]?.questions || 0; });
    if (last3Q.every(q => q < 20)) list.push({ type: 'warning', msg: 'Practice more PYQs — minimum 50/day recommended!' });
    if (daysLeft != null && daysLeft < 30 && weekMocks.length === 0)
      list.push({ type: 'error', msg: 'Take a mock test TODAY — exam is near!' });
    if (lastMock && lastMock.score > 85) list.push({ type: 'success', msg: "Excellent! You're in the safe zone. Stay consistent!" });
    if (mockScores.length > 0 && subjectData[weakIdx].avg / subjectData[weakIdx].max < 0.5)
      list.push({ type: 'error', msg: `${subjectData[weakIdx].name} is your danger zone. Practice it daily!` });
    if (list.length === 0) list.push({ type: 'info', msg: 'Stay consistent! Every day of preparation counts.' });
    return list;
  }, [dayLogs, last10Mocks, weekMocks, daysLeft, mockScores, today]);

  // Save
  const saveDayLog = useCallback((ds: string, log: DayLog) => {
    setDayLogs(p => ({ ...p, [ds]: log }));
    localStorage.setItem('rrb_day_' + ds, JSON.stringify(log));
    if (log.mockTaken && log.mockScore != null) {
      const entry: MockScore = { date: ds, score: log.mockScore, maths: log.mockSubjects?.maths || 0, reasoning: log.mockSubjects?.reasoning || 0, science: log.mockSubjects?.science || 0, gk: log.mockSubjects?.gk || 0 };
      setMockScores(prev => {
        const next = prev.some(m => m.date === ds) ? prev.map(m => m.date === ds ? entry : m) : [...prev, entry];
        next.sort((a, b) => a.date.localeCompare(b.date));
        localStorage.setItem('rrb_mock_scores', JSON.stringify(next));
        return next;
      });
    }
  }, []);

  function openDay(day: number) {
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    const ds = dateKey(date);
    setSelectedDate(date);
    setModalMode(date > today ? 'future' : 'past');
    setModalLog({ status: '', notes: '', questions: 0, mockScore: null, mockTaken: false, mockSubjects: { maths: 0, reasoning: 0, science: 0, gk: 0 }, mood: '', hours: 0, futurePlan: '', isMockDay: false, ...(dayLogs[ds] || {}) });
  }

  function saveModal() {
    if (!selectedDate) return;
    saveDayLog(dateKey(selectedDate), modalLog as DayLog);
    setSelectedDate(null);
  }

  // ─── If not set up ─────────────────────────────────────────────────────────
  if (!setup) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-on-surface-variant text-sm font-medium mb-1">Get started</p>
          <h2 className="text-3xl font-bold text-primary tracking-tight">Exam Planner Setup</h2>
        </div>
        <SetupScreen onSave={s => { setSetup(s); localStorage.setItem('rrb_setup', JSON.stringify(s)); }} />
      </div>
    );
  }

  // ─── Tabs ──────────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'planner', label: 'Planner', icon: Calendar },
    { id: 'progress', label: 'Progress', icon: Activity },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  const alertBadge = alerts.filter(a => a.type === 'error' || a.type === 'warning').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-on-surface-variant text-sm font-medium mb-1">Your preparation</p>
          <h2 className="text-3xl font-bold text-primary tracking-tight">Exam Planner</h2>
        </div>
        <div className="text-right">
          <p className="text-xs text-on-surface-variant font-medium">Category</p>
          <p className="font-black text-primary text-lg">{setup.category}</p>
        </div>
      </div>

      {/* ── Countdown Hero ──────────────────────────────────────────────────── */}
      <div className={cn('bg-gradient-to-br text-white rounded-2xl p-6 shadow-lg', urgencyBg)}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Exam Countdown</p>
            <p className="text-5xl font-black leading-none">
              {daysLeft != null ? daysLeft : '—'}
            </p>
            <p className="text-white/80 text-sm mt-1 font-medium">days left for RRB Group D</p>
          </div>
          <div className="bg-white/15 rounded-2xl p-4 text-right">
            <p className="text-white/60 text-xs font-bold mb-1">Target Cutoff</p>
            <p className="text-2xl font-black">{cutoff}</p>
            <p className="text-white/60 text-xs">Safe: 85+</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-white/60 mb-1.5">
            <span>Prep Progress</span>
            <span>{prepProgress}% completed</span>
          </div>
          <div className="h-2 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${prepProgress}%` }} />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { icon: '🔥', val: streak, label: 'Day Streak' },
            { icon: '✅', val: totalStudied, label: 'Days Studied' },
            { icon: '📝', val: totalQuestions, label: 'Qs Practiced' },
          ].map(s => (
            <div key={s.label} className="bg-white/15 rounded-xl p-3 text-center">
              <div className="text-xl mb-0.5">{s.icon}</div>
              <div className="text-lg font-black">{s.val}</div>
              <div className="text-[10px] text-white/60 font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        <p className="text-sm text-white/70 italic">{motivationalMsg}</p>
      </div>

      {/* ── Tab Bar ─────────────────────────────────────────────────────────── */}
      <div className="flex bg-surface-container-lowest rounded-2xl p-1 shadow-sm border border-surface-container-high gap-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn('flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all relative',
                isActive ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:bg-surface-container')}>
              <Icon size={15} />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.id === 'alerts' && alertBadge > 0 && !isActive && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {alertBadge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* PLANNER TAB                                                          */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'planner' && (
        <div className="space-y-6">
          {/* Calendar Card */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high overflow-hidden">
            {/* Month nav */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-container-high">
              <button onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                className="p-2 rounded-xl hover:bg-surface-container transition-colors text-on-surface-variant hover:text-primary">
                <ChevronLeft size={18} />
              </button>
              <h3 className="font-black text-primary text-base">
                {currentMonth.toLocaleDateString('en', { month: 'long', year: 'numeric' })}
              </h3>
              <button onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                className="p-2 rounded-xl hover:bg-surface-container transition-colors text-on-surface-variant hover:text-primary">
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="p-4">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <div key={d} className="text-center text-[11px] font-bold text-on-surface-variant py-1">{d}</div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const status = getDayStatus(ds);
                  const logDay = dayLogs[ds];
                  const isMockD = new Date(year, month, day).getDay() === 0 || logDay?.isMockDay;
                  const isExam = status === 'exam';
                  const isToday = status === 'today';

                  const cellCls = cn('aspect-square rounded-xl flex flex-col items-center justify-center relative text-xs font-bold transition-all cursor-pointer hover:scale-105 active:scale-95',
                    isExam ? 'bg-red-50 border-2 border-red-400 text-red-600 shadow-sm' :
                    isToday ? 'bg-primary text-white shadow-md' :
                    status === 'studied' ? 'bg-tertiary-fixed/30 text-primary border border-tertiary-fixed-dim' :
                    status === 'partial' ? 'bg-amber-100 text-amber-700 border border-amber-300' :
                    status === 'missed' ? 'bg-red-50 text-red-500 border border-red-200' :
                    'hover:bg-surface-container text-on-surface-variant');

                  return (
                    <button key={day} className={cellCls} onClick={() => openDay(day)}>
                      <span>{day}</span>
                      {isExam && <span className="text-[9px] leading-none">🎯</span>}
                      {!isExam && isMockD && <span className="text-[9px] leading-none">{isToday ? '📝' : '📝'}</span>}
                      {!isExam && !isMockD && status === 'studied' && <span className="text-[9px] leading-none">✓</span>}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-surface-container-high">
                {[
                  { cls: 'bg-tertiary-fixed/30 border border-tertiary-fixed-dim', label: 'Studied' },
                  { cls: 'bg-amber-100 border border-amber-300', label: 'Partial' },
                  { cls: 'bg-red-50 border border-red-200', label: 'Missed' },
                  { cls: 'bg-primary', label: 'Today' },
                  { cls: 'bg-surface-container border border-surface-container-high', label: 'Future' },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className={cn('w-3.5 h-3.5 rounded-md', l.cls)} />
                    <span className="text-[11px] font-medium text-on-surface-variant">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Weekly Summary Card */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high p-5">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2 mb-4">
              <Star size={18} className="text-secondary-container" /> This Week's Summary
            </h3>

            {/* 7 circles */}
            <div className="flex gap-2 mb-5">
              {weekDays.map((d, i) => {
                const l = weekLogs[i];
                const done = l?.status === 'studied';
                const partial = l?.status === 'partial';
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className={cn('w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-black transition-all',
                      done ? 'border-tertiary-fixed-dim bg-tertiary-fixed/20 text-primary' :
                      partial ? 'border-amber-400 bg-amber-50 text-amber-600' :
                      dateKey(d) === dateKey(today) ? 'border-primary bg-primary/10 text-primary' :
                      'border-surface-container-high text-on-surface-variant')}>
                      {done ? '✓' : partial ? '~' : d.getDate()}
                    </div>
                    <span className="text-[10px] font-bold text-on-surface-variant">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Days Studied', val: `${weekStudied}/7`, good: weekStudied >= 5 },
                { label: 'Questions', val: weekQuestions, good: weekQuestions >= 350 },
                { label: 'Study Hours', val: `${weekHours.toFixed(1)}h`, good: weekHours >= 14 },
                { label: 'Avg Mock', val: avgMock != null ? `${avgMock}/100` : 'N/A', good: avgMock != null && avgMock >= 75 },
              ].map(s => (
                <div key={s.label} className="bg-surface-container rounded-xl p-3">
                  <p className="text-[11px] text-on-surface-variant font-medium mb-1">{s.label}</p>
                  <p className={cn('text-xl font-black', s.good ? 'text-primary' : 'text-on-surface')}>{s.val}</p>
                </div>
              ))}
            </div>

            {/* Badge */}
            <div className={cn('text-center py-3 rounded-xl text-sm font-bold border',
              weekStudied === 7 ? 'bg-tertiary-fixed/20 border-tertiary-fixed-dim text-primary' :
              weekStudied >= 5 ? 'bg-amber-50 border-amber-200 text-amber-700' :
              'bg-red-50 border-red-200 text-red-600')}>
              {weekStudied === 7 ? '🏆 Perfect Week! You\'re unstoppable!'
                : weekStudied >= 5 ? '💪 Strong Week! One more push!'
                : '⚠️ Missed too many days. Get back on track!'}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* PROGRESS TAB                                                         */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'progress' && (
        <div className="space-y-6">
          {/* Mock Score Trend */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                <TrendingUp size={18} /> Mock Score Trend
              </h3>
              <span className={cn('text-sm font-bold px-3 py-1 rounded-full',
                trendDir === 'up' ? 'bg-tertiary-fixed/20 text-primary' :
                trendDir === 'down' ? 'bg-red-50 text-red-600' : 'bg-surface-container text-on-surface-variant')}>
                {trendDir === 'up' ? '📈 Improving' : trendDir === 'down' ? '📉 Declining' : '➡️ Stable'}
              </span>
            </div>
            {last10Mocks.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={last10Mocks} margin={{ left: -15, right: 5, top: 5, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-container)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-surface-container-high)', borderRadius: 12, color: 'var(--color-on-surface)', fontSize: 12 }} />
                  <ReferenceLine y={cutoff} stroke="#ef4444" strokeDasharray="4 4" label={{ value: `Cutoff ${cutoff}`, fill: '#ef4444', fontSize: 10, position: 'right' }} />
                  <ReferenceLine y={SAFE_ZONE} stroke="#22c55e" strokeDasharray="4 4" label={{ value: 'Safe 85', fill: '#22c55e', fontSize: 10, position: 'right' }} />
                  <Line type="monotone" dataKey="score" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ fill: 'var(--color-primary)', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex flex-col items-center justify-center gap-2 text-on-surface-variant">
                <BarChart2 size={32} className="opacity-30" />
                <p className="text-sm">Log mock tests from the calendar to see trends.</p>
              </div>
            )}
          </div>

          {/* Daily Questions */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high p-5">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2 mb-4">
              <ClipboardList size={18} /> Daily Questions (Last 14 Days)
            </h3>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={last14Days} margin={{ left: -15, right: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-container)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 9 }} />
                <YAxis tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-surface-container-high)', borderRadius: 12, color: 'var(--color-on-surface)', fontSize: 12 }} />
                <Bar dataKey="questions" radius={[5, 5, 0, 0]}>
                  {last14Days.map((d, i) => (
                    <Cell key={i} fill={d.questions > 50 ? '#22c55e' : d.questions >= 20 ? '#f59e0b' : d.questions > 0 ? '#ef4444' : 'var(--color-surface-container-high)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2 text-[11px] text-on-surface-variant">
              <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-green-500 inline-block" /> &gt;50 Qs</span>
              <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-amber-400 inline-block" /> 20–50 Qs</span>
              <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-red-400 inline-block" /> &lt;20 Qs</span>
            </div>
          </div>

          {/* Subject Breakdown */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                <BookOpen size={18} /> Subject-wise Scores
              </h3>
              {!lastMock && <p className="text-xs text-on-surface-variant">No mock data yet</p>}
            </div>
            <div className="space-y-4">
              {subjectData.map((d, i) => {
                const lastPct = Math.round((d.last / d.max) * 100);
                const avgPct = Math.round((d.avg / d.max) * 100);
                const isWeak = i === weakIdx && mockScores.length > 0;
                return (
                  <div key={d.name}>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className={cn('font-bold text-sm flex items-center gap-1.5', isWeak ? 'text-red-600' : 'text-primary')}>
                        {d.name} <span className="text-[11px] text-on-surface-variant font-normal">/{d.max}</span>
                        {isWeak && <span className="text-[10px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full font-bold">Weakest</span>}
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        Last: {d.last} · Avg: {d.avg}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="h-2.5 bg-surface-container-high rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${lastPct}%`, background: isWeak ? '#ef4444' : 'var(--color-primary)' }} />
                      </div>
                      <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500 opacity-50"
                          style={{ width: `${avgPct}%`, background: isWeak ? '#f97316' : '#22c55e' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-4 pt-3 border-t border-surface-container-high text-[11px] text-on-surface-variant">
              <span className="flex items-center gap-1.5"><span className="w-3 h-2.5 rounded bg-primary inline-block" /> Last test</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded bg-green-500 inline-block opacity-50" /> Average</span>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ALERTS TAB                                                           */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
              <Bell size={18} /> Smart Alerts
            </h3>
            <p className="text-sm text-on-surface-variant mt-0.5">Personalised nudges based on your progress.</p>
          </div>
          {alerts.map((a, i) => (
            <div key={i} className={cn('rounded-2xl p-4 border-l-4 shadow-sm',
              a.type === 'error' ? 'bg-red-50 border-red-500' :
              a.type === 'warning' ? 'bg-amber-50 border-amber-500' :
              a.type === 'success' ? 'bg-tertiary-fixed/20 border-tertiary-fixed-dim' :
              'bg-primary/5 border-primary/30')}>
              <div className="flex items-start gap-3">
                <div className={cn('mt-0.5 shrink-0',
                  a.type === 'error' ? 'text-red-500' : a.type === 'warning' ? 'text-amber-600' : a.type === 'success' ? 'text-primary' : 'text-primary')}>
                  {a.type === 'error' ? <AlertTriangle size={18} /> : a.type === 'success' ? <CheckCircle2 size={18} /> : a.type === 'warning' ? <AlertTriangle size={18} /> : <Zap size={18} />}
                </div>
                <p className={cn('text-sm font-semibold',
                  a.type === 'error' ? 'text-red-700' : a.type === 'warning' ? 'text-amber-700' : a.type === 'success' ? 'text-primary' : 'text-primary')}>
                  {a.msg}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SETTINGS TAB                                                         */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
              <Settings size={18} /> Settings
            </h3>
            <p className="text-sm text-on-surface-variant mt-0.5">Update your preferences anytime.</p>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high p-5 space-y-5">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Exam Date</label>
              <input type="date"
                className="w-full rounded-xl px-4 py-3 text-sm border border-surface-container-high bg-surface focus:outline-none focus:border-primary"
                defaultValue={setup.examDate}
                onChange={e => setSettingsForm(p => ({ ...p, examDate: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Category</label>
              <div className="grid grid-cols-4 gap-2">
                {(['General', 'OBC', 'SC', 'ST'] as const).map(c => (
                  <button key={c} onClick={() => setSettingsForm(p => ({ ...p, category: c }))}
                    className={cn('py-2.5 rounded-xl text-sm font-bold border-2 transition-all',
                      (settingsForm.category || setup.category) === c
                        ? 'bg-primary text-white border-primary' : 'bg-surface border-surface-container-high text-on-surface-variant hover:border-primary/40')}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Daily Study Hours</label>
              <div className="grid grid-cols-3 gap-2">
                {(['1-2 hrs', '3-4 hrs', '5+ hrs'] as const).map(h => (
                  <button key={h} onClick={() => setSettingsForm(p => ({ ...p, dailyHours: h }))}
                    className={cn('py-2.5 rounded-xl text-sm font-bold border-2 transition-all',
                      (settingsForm.dailyHours || setup.dailyHours) === h
                        ? 'bg-primary text-white border-primary' : 'bg-surface border-surface-container-high text-on-surface-variant hover:border-primary/40')}>
                    {h}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => {
              const u = { ...setup, ...settingsForm } as Setup;
              setSetup(u); localStorage.setItem('rrb_setup', JSON.stringify(u));
              setSettingsForm({});
              alert('Settings saved!');
            }}
              className="w-full py-3 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 transition-all shadow-sm">
              Save Changes
            </button>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high p-5 space-y-3">
            <button onClick={() => {
              const blob = new Blob([JSON.stringify({ setup, dayLogs, mockScores }, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = 'rrb_planner_backup.json'; a.click();
              URL.revokeObjectURL(url);
            }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-primary border border-surface-container-high hover:bg-surface-container transition-colors">
              <Download size={16} /> Export Progress as JSON
            </button>

            {!resetConfirm ? (
              <button onClick={() => setResetConfirm(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-error border border-error/20 hover:bg-red-50 transition-colors">
                <RotateCcw size={16} /> Reset All Data
              </button>
            ) : (
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <p className="text-sm font-bold text-red-700 mb-3">⚠️ This will delete ALL your progress. Are you sure?</p>
                <div className="flex gap-2">
                  <button onClick={() => {
                    for (let i = localStorage.length - 1; i >= 0; i--) {
                      const k = localStorage.key(i)!;
                      if (k.startsWith('rrb_')) localStorage.removeItem(k);
                    }
                    setSetup(null); setDayLogs({}); setMockScores([]); setResetConfirm(false);
                  }} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700">
                    Yes, Reset Everything
                  </button>
                  <button onClick={() => setResetConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-on-surface-variant border border-surface-container-high hover:bg-surface-container">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-on-surface-variant pb-2">RRB Group D Planner v1.0</p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* DAY MODAL                                                            */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setSelectedDate(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-h-[90vh] overflow-y-auto rounded-t-3xl shadow-2xl bg-surface-container-lowest border-t border-surface-container-high"
            onClick={e => e.stopPropagation()}>
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 sticky top-0 bg-surface-container-lowest z-10">
              <div className="w-10 h-1 rounded-full bg-surface-container-high" />
            </div>

            <div className="px-5 pb-10">
              {/* Header */}
              <div className="flex items-start justify-between mb-5 pt-1">
                <div>
                  <h3 className="text-xl font-black text-primary">
                    {selectedDate.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </h3>
                  <p className="text-sm text-on-surface-variant mt-0.5">
                    {modalMode === 'future'
                      ? `📅 ${daysBetween(today, selectedDate)} days from today`
                      : `Day ${Math.max(1, daysBetween(new Date(setup.examDate + 'T00:00:00'), selectedDate) + 1)} of preparation`}
                  </p>
                </div>
                <button onClick={() => setSelectedDate(null)}
                  className="p-2 rounded-xl hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Topic plan */}
              {(() => {
                const dayNum = Math.max(1, daysBetween(new Date(setup.examDate + 'T00:00:00'), selectedDate) + 1);
                const t = getTopics(dayNum);
                const subjects = [
                  { name: 'Maths', topic: t.maths, emoji: '📐', color: 'from-blue-500 to-indigo-600' },
                  { name: 'Reasoning', topic: t.reasoning, emoji: '🧠', color: 'from-purple-500 to-violet-600' },
                  { name: 'Science', topic: t.science, emoji: '🔬', color: 'from-emerald-500 to-teal-600' },
                  { name: 'GK', topic: t.gk, emoji: '🌏', color: 'from-amber-500 to-orange-600' },
                ];
                return (
                  <div className="mb-5">
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                      {modalMode === 'future' ? 'Suggested Plan' : "Today's Topics"}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {subjects.map(s => (
                        <div key={s.name} className="bg-surface-container rounded-xl p-3 border border-surface-container-high">
                          <div className="flex items-center gap-2 mb-1">
                            <span>{s.emoji}</span>
                            <span className="text-xs font-bold text-primary">{s.name}</span>
                            {s.topic.includes('REVISION') && (
                              <span className="ml-auto text-[9px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">HIGH</span>
                            )}
                          </div>
                          <p className="text-xs text-on-surface-variant leading-tight">{s.topic}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Divider */}
              <div className="border-t border-surface-container-high mb-5" />

              {modalMode === 'future' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Personal Goal / Note</label>
                    <textarea rows={3}
                      className="w-full rounded-xl px-4 py-3 text-sm border border-surface-container-high bg-surface focus:outline-none focus:border-primary resize-none"
                      placeholder="What do you plan to focus on this day?"
                      value={modalLog.futurePlan || ''}
                      onChange={e => setModalLog(p => ({ ...p, futurePlan: e.target.value }))} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-surface-container-high bg-surface">
                    <span className="text-sm font-bold text-primary">📝 Set as Mock Test Day</span>
                    <button onClick={() => setModalLog(p => ({ ...p, isMockDay: !p.isMockDay }))}
                      className={cn('w-12 h-6 rounded-full transition-all relative', modalLog.isMockDay ? 'bg-primary' : 'bg-surface-container-high')}>
                      <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all', modalLog.isMockDay ? 'left-[26px]' : 'left-0.5')} />
                    </button>
                  </div>
                  <p className="text-xs text-center text-on-surface-variant">
                    {examDate && `Study every day until then → ${daysBetween(today, selectedDate)} more study days until this date.`}
                  </p>
                  <button onClick={saveModal}
                    className="w-full py-3.5 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 transition-all shadow-sm">
                    Save Plan
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">What I Studied Today</label>
                    <textarea rows={3}
                      className="w-full rounded-xl px-4 py-3 text-sm border border-surface-container-high bg-surface focus:outline-none focus:border-primary resize-none"
                      placeholder="Topics covered, chapters read..."
                      value={modalLog.notes || ''}
                      onChange={e => setModalLog(p => ({ ...p, notes: e.target.value }))} />
                  </div>

                  {/* Questions + Mock toggle */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Questions Practiced</label>
                      <input type="number" min={0}
                        className="w-full rounded-xl px-4 py-2.5 text-sm border border-surface-container-high bg-surface focus:outline-none focus:border-primary"
                        value={modalLog.questions || 0}
                        onChange={e => setModalLog(p => ({ ...p, questions: parseInt(e.target.value) || 0 }))} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Mock Test?</label>
                      <button onClick={() => setModalLog(p => ({ ...p, mockTaken: !p.mockTaken }))}
                        className={cn('w-full py-2.5 rounded-xl text-sm font-bold border-2 transition-all',
                          modalLog.mockTaken ? 'bg-primary text-white border-primary' : 'bg-surface border-surface-container-high text-on-surface-variant')}>
                        {modalLog.mockTaken ? '✅ Yes, Taken' : 'No'}
                      </button>
                    </div>
                  </div>

                  {/* Mock scores */}
                  {modalLog.mockTaken && (
                    <div className="bg-surface-container rounded-xl p-4 border border-surface-container-high">
                      <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Mock Score Breakdown</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] text-on-surface-variant font-medium">Total Score (0–100)</label>
                          <input type="number" min={0} max={100}
                            className="w-full rounded-xl px-3 py-2 text-sm border border-surface-container-high bg-surface focus:outline-none focus:border-primary mt-1"
                            value={modalLog.mockScore ?? ''}
                            onChange={e => setModalLog(p => ({ ...p, mockScore: parseInt(e.target.value) || 0 }))} />
                        </div>
                        {[{ key: 'maths', label: 'Maths /25' }, { key: 'reasoning', label: 'Reasoning /30' }, { key: 'science', label: 'Science /25' }, { key: 'gk', label: 'GK /20' }].map(f => (
                          <div key={f.key}>
                            <label className="text-[11px] text-on-surface-variant font-medium">{f.label}</label>
                            <input type="number" min={0}
                              className="w-full rounded-xl px-3 py-2 text-sm border border-surface-container-high bg-surface focus:outline-none focus:border-primary mt-1"
                              value={(modalLog.mockSubjects as any)?.[f.key] ?? 0}
                              onChange={e => setModalLog(p => ({ ...p, mockSubjects: { ...(p.mockSubjects || { maths: 0, reasoning: 0, science: 0, gk: 0 }), [f.key]: parseInt(e.target.value) || 0 } }))} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mood */}
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Today's Mood</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[{ id: 'confident', emoji: '😊', label: 'Confident' }, { id: 'okay', emoji: '😐', label: 'Okay' }, { id: 'struggling', emoji: '😔', label: 'Struggling' }, { id: 'overwhelmed', emoji: '🤯', label: 'Overwhelmed' }].map(m => (
                        <button key={m.id} onClick={() => setModalLog(p => ({ ...p, mood: m.id as any }))}
                          className={cn('py-2.5 rounded-xl flex flex-col items-center gap-0.5 border-2 transition-all text-xs font-bold',
                            modalLog.mood === m.id ? 'border-primary bg-primary/5 text-primary' : 'border-surface-container-high text-on-surface-variant hover:border-primary/30')}>
                          <span className="text-xl">{m.emoji}</span>
                          <span>{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hours */}
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Study Hours</label>
                    <div className="flex flex-wrap gap-2">
                      {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4].map(h => (
                        <button key={h}
                          onClick={() => setModalLog(p => ({ ...p, hours: h }))}
                          className={cn('px-3.5 py-1.5 rounded-full text-xs font-bold border-2 transition-all',
                            modalLog.hours === h ? 'bg-primary text-white border-primary' : 'border-surface-container-high text-on-surface-variant hover:border-primary/40')}>
                          {h === 4 ? '4+' : h}h
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Mark Day Status</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'studied', label: '✅ Fully Studied', cls: 'border-tertiary-fixed-dim bg-tertiary-fixed/10 text-primary' },
                        { id: 'partial',  label: '🟡 Partial Study', cls: 'border-amber-400 bg-amber-50 text-amber-700' },
                        { id: 'missed',   label: '❌ Missed Today',  cls: 'border-red-400 bg-red-50 text-red-600' },
                      ].map(s => (
                        <button key={s.id} onClick={() => setModalLog(p => ({ ...p, status: s.id as any }))}
                          className={cn('py-2.5 rounded-xl text-xs font-bold border-2 transition-all',
                            modalLog.status === s.id ? s.cls : 'border-surface-container-high text-on-surface-variant hover:bg-surface-container')}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button onClick={saveModal}
                    className="w-full py-3.5 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 transition-all shadow-sm text-base">
                    💾 Save Day Log
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
