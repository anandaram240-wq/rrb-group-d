import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, Flame, Target, Plus, Trash2, BookOpen, Zap, BarChart3, ChevronRight, TrendingUp, Award, Brain, MapPin } from 'lucide-react';
import { format, subDays } from 'date-fns';
import pyqsData from '../data/pyqs.json';
import { SubjectDistribution } from './SubjectDistribution';

interface PYQ { id: number; subject: string; topic: string; question: string; options: string[]; correctAnswer: number; difficulty: string; }
interface Goal { id: string; text: string; completed: boolean; }
interface DashboardProps { userName: string; onNavigateTo?: (tab: string) => void; }

const SUBJECT_CONFIG = {
  'Mathematics':       { icon: '➗', color: '#3b82f6', bg: 'linear-gradient(135deg,#3b82f6,#6366f1)', light: '#eff6ff', emoji: '📐' },
  'Reasoning':         { icon: '🧠', color: '#8b5cf6', bg: 'linear-gradient(135deg,#8b5cf6,#6366f1)', light: '#f5f3ff', emoji: '🧩' },
  'General Science':   { icon: '🔬', color: '#10b981', bg: 'linear-gradient(135deg,#10b981,#0d9488)', light: '#f0fdf4', emoji: '⚗️' },
  'General Awareness': { icon: '🌍', color: '#f59e0b', bg: 'linear-gradient(135deg,#f59e0b,#ef4444)', light: '#fffbeb', emoji: '📰' },
} as const;

export function Dashboard({ userName, onNavigateTo }: DashboardProps) {
  const today = new Date();
  const allQuestions = pyqsData as PYQ[];
  const firstName = userName.split(' ')[0];

  const stats = useMemo(() => {
    const subjectMap: Record<string, { count: number; topics: Set<string> }> = {};
    allQuestions.forEach(q => {
      if (!subjectMap[q.subject]) subjectMap[q.subject] = { count: 0, topics: new Set() };
      subjectMap[q.subject].count++;
      subjectMap[q.subject].topics.add(q.topic);
    });
    return {
      subjectMap,
      total: allQuestions.length,
      easy: allQuestions.filter(q => q.difficulty === 'easy').length,
      medium: allQuestions.filter(q => q.difficulty === 'medium').length,
      hard: allQuestions.filter(q => q.difficulty === 'hard').length,
    };
  }, []);

  const [goals, setGoals] = useState<Goal[]>(() => {
    try { return JSON.parse(localStorage.getItem('rrb_goals') || '[]'); } catch { return []; }
  });
  const [newGoalText, setNewGoalText] = useState('');
  useEffect(() => { localStorage.setItem('rrb_goals', JSON.stringify(goals)); }, [goals]);

  const [streakData, setStreakData] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem('rrb_streak') || '{}'); } catch { return {}; }
  });
  const currentStreak = useMemo(() => {
    let streak = 0; let d = new Date(); d.setHours(0,0,0,0);
    while (streakData[format(d, 'yyyy-MM-dd')]) { streak++; d = subDays(d, 1); }
    return streak;
  }, [streakData]);
  useEffect(() => {
    const k = format(today, 'yyyy-MM-dd');
    if (!streakData[k]) { const u = { ...streakData, [k]: 1 }; setStreakData(u); localStorage.setItem('rrb_streak', JSON.stringify(u)); }
  }, []);

  const streakDays = Array.from({ length: 35 }).map((_, i) => {
    const date = subDays(today, 34 - i);
    return { date, active: !!(streakData[format(date, 'yyyy-MM-dd')] || 0) };
  });

  const completedCount = goals.filter(g => g.completed).length;
  const pct = goals.length > 0 ? Math.round((completedCount / goals.length) * 100) : 0;

  const quotes = [
    { q: '"Success is the sum of small efforts, repeated day in and day out."', a: '— Robert Collier' },
    { q: '"Discipline is the bridge between goals and accomplishment."', a: '— Jim Rohn' },
    { q: '"The expert in anything was once a beginner."', a: '— Helen Hayes' },
  ];
  const quote = quotes[new Date().getDay() % quotes.length];

  return (
    <div className="space-y-6 pb-8">

      {/* ── PREMIUM HERO BANNER ──────────────────────────────────── */}
      <div
        className="relative rounded-3xl overflow-hidden text-white shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 70%, #0f172a 100%)', minHeight: 200 }}
      >
        {/* Glow orbs */}
        <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #818cf8, transparent)' }} />
        <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #c084fc, transparent)' }} />
        <div className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #fbbf24, transparent)' }} />

        <div className="relative p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left: Greeting */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center text-sm">👋</div>
                <span className="text-indigo-300 text-xs font-bold uppercase tracking-widest">Welcome back</span>
              </div>
              <h1 className="text-3xl font-black mb-1 tracking-tight">{firstName}</h1>
              <p className="text-indigo-300 text-sm italic max-w-xs">"{quote.q.replace(/"/g, '')}"</p>
              <p className="text-indigo-400 text-[11px] mt-1 font-bold">{quote.a}</p>
            </div>

            {/* Right: 4 stat pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3">
              {[
                { label: 'Total PYQs', value: stats.total.toLocaleString(), icon: '📚', color: '#818cf8' },
                { label: 'Easy', value: stats.easy.toLocaleString(), icon: '✅', color: '#34d399' },
                { label: 'Medium', value: stats.medium.toLocaleString(), icon: '⚡', color: '#fbbf24' },
                { label: 'Hard', value: stats.hard.toLocaleString(), icon: '🔥', color: '#f87171' },
              ].map(s => (
                <div
                  key={s.label}
                  className="rounded-2xl border px-4 py-3 text-center"
                  style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.12)' }}
                >
                  <div className="text-base mb-0.5">{s.icon}</div>
                  <p className="text-lg font-black" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── SUBJECT CARDS ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(stats.subjectMap).map(([subject, data]) => {
          const cfg = SUBJECT_CONFIG[subject as keyof typeof SUBJECT_CONFIG];
          if (!cfg) return null;
          return (
            <div
              key={subject}
              className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lg cursor-pointer hover:scale-[1.03] transition-transform active:scale-[0.98]"
              style={{ background: cfg.bg }}
              onClick={() => onNavigateTo?.('practice')}
            >
              {/* Watermark icon */}
              <div className="absolute -bottom-3 -right-3 text-6xl opacity-15 pointer-events-none">{cfg.emoji}</div>
              <div className="relative">
                <div className="text-2xl mb-2">{cfg.icon}</div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1 leading-tight">{subject}</p>
                <p className="text-3xl font-black leading-none mb-1">{data.count.toLocaleString()}</p>
                <p className="text-[11px] text-white/70">{data.topics.size} Topics</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── QUICK ACTIONS ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Zap, label: 'Quick Practice', desc: 'Topic-wise PYQ drills', tab: 'practice', from: '#6366f1', to: '#8b5cf6' },
          { icon: BookOpen, label: 'Full Mock Test', desc: '100 Qs · 90 Min · Real CBT', tab: 'papers', from: '#0ea5e9', to: '#06b6d4' },
          { icon: BarChart3, label: 'Analytics', desc: 'Deep performance insights', tab: 'analytics', from: '#10b981', to: '#0d9488' },
        ].map(a => (
          <button
            key={a.label}
            onClick={() => onNavigateTo?.(a.tab)}
            className="group relative overflow-hidden rounded-2xl p-5 text-left text-white shadow-lg hover:shadow-xl hover:scale-[1.03] transition-all active:scale-[0.98]"
            style={{ background: `linear-gradient(135deg, ${a.from}, ${a.to})` }}
          >
            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-20" style={{ background: 'rgba(255,255,255,0.3)' }} />
            <a.icon size={26} className="mb-3 relative z-10 group-hover:scale-110 transition-transform" />
            <p className="font-black text-sm mb-0.5 relative z-10">{a.label}</p>
            <p className="text-[11px] text-white/70 relative z-10">{a.desc}</p>
            <ChevronRight size={16} className="absolute bottom-4 right-4 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── LEFT: DAILY GOALS + STREAK ────────────────────────── */}
        <div className="lg:col-span-1 space-y-5">

          {/* Goals card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 pt-5 pb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                    <Target size={16} className="text-white" />
                  </div>
                  <h3 className="font-black text-slate-800 text-sm">Daily Goals</h3>
                </div>
                {goals.length > 0 && (
                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {completedCount}/{goals.length}
                  </span>
                )}
              </div>

              {/* Goal progress arc */}
              {goals.length > 0 && (
                <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="relative shrink-0">
                    <svg width="44" height="44" viewBox="0 0 44 44" className="-rotate-90">
                      <circle cx="22" cy="22" r="16" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                      <circle cx="22" cy="22" r="16" fill="none" stroke="#6366f1" strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 16 * pct / 100} ${2 * Math.PI * 16 * (1 - pct / 100)}`}
                        style={{ transition: 'stroke-dasharray 0.6s ease' }}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-indigo-700">{pct}%</span>
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-700">{completedCount} of {goals.length} done</p>
                    <p className="text-[10px] text-slate-400">{goals.length - completedCount} remaining</p>
                  </div>
                </div>
              )}

              {/* Add goal input */}
              <form onSubmit={e => { e.preventDefault(); if (!newGoalText.trim()) return; setGoals([...goals, { id: Date.now().toString(), text: newGoalText.trim(), completed: false }]); setNewGoalText(''); }} className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newGoalText}
                  onChange={e => setNewGoalText(e.target.value)}
                  placeholder="Add a new goal..."
                  className="flex-1 text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
                />
                <button type="submit" className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 hover:opacity-90 transition" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  <Plus size={16} />
                </button>
              </form>

              {/* Goal list */}
              <div className="space-y-2">
                {goals.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-4 italic">Set your first daily goal above! 🎯</p>
                ) : goals.map(goal => (
                  <div
                    key={goal.id}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border group transition-all ${goal.completed ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 hover:border-indigo-300'}`}
                  >
                    <button onClick={() => setGoals(goals.map(g => g.id === goal.id ? { ...g, completed: !g.completed } : g))} className="shrink-0">
                      {goal.completed
                        ? <CheckCircle2 size={17} className="text-emerald-500" />
                        : <div className="w-[17px] h-[17px] rounded-full border-2 border-slate-300 hover:border-indigo-400 transition-colors" />
                      }
                    </button>
                    <p className={`text-xs font-medium flex-1 ${goal.completed ? 'text-emerald-700 line-through opacity-70' : 'text-slate-700'}`}>{goal.text}</p>
                    <button onClick={() => setGoals(goals.filter(g => g.id !== goal.id))} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-400">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Streak card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}>
                  <Flame size={16} className="text-white" />
                </div>
                <h3 className="font-black text-slate-800 text-sm">Consistency</h3>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black" style={{ color: currentStreak > 0 ? '#f59e0b' : '#94a3b8' }}>{currentStreak}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Day Streak</p>
              </div>
            </div>

            {/* Activity grid — 5 rows × 7 cols */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {streakDays.map((day, i) => (
                <div
                  key={i}
                  title={format(day.date, 'MMM d')}
                  className="aspect-square rounded-md transition-all"
                  style={{ background: day.active ? 'linear-gradient(135deg,#f59e0b,#ef4444)' : '#f1f5f9' }}
                />
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>Last 35 days</span>
              <span>{format(subDays(today, 34), 'MMM d')} – {format(today, 'MMM d')}</span>
            </div>

            {/* More roadmap/planner buttons */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              {[
                { label: '📍 Roadmap', tab: 'roadmap', color: '#6366f1' },
                { label: '📅 Planner', tab: 'planner', color: '#0ea5e9' },
              ].map(b => (
                <button
                  key={b.tab}
                  onClick={() => onNavigateTo?.(b.tab)}
                  className="text-xs font-bold py-2 rounded-xl border transition-all hover:opacity-80"
                  style={{ color: b.color, borderColor: b.color + '33', background: b.color + '0f' }}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: SUBJECT QUICK JUMP ─────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100" style={{ background: 'linear-gradient(135deg,#f8faff,#f0f4ff)' }}>
              <div className="flex items-center gap-2 mb-0.5">
                <Brain size={18} className="text-indigo-600" />
                <h3 className="font-black text-slate-800 text-sm">Subject Quick Jump</h3>
              </div>
              <p className="text-[11px] text-slate-400">Choose a subject and start mastering or test yourself</p>
            </div>

            {/* Subject rows */}
            <div className="divide-y divide-slate-50">
              {([
                { subject: 'Mathematics', icon: '➗', grad: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: '#3b82f6' },
                { subject: 'Reasoning', icon: '🧠', grad: 'linear-gradient(135deg,#8b5cf6,#6366f1)', color: '#8b5cf6' },
                { subject: 'General Science', icon: '🔬', grad: 'linear-gradient(135deg,#10b981,#0d9488)', color: '#10b981' },
                { subject: 'General Awareness', icon: '🌍', grad: 'linear-gradient(135deg,#f59e0b,#ef4444)', color: '#f59e0b' },
              ] as const).map(({ subject, icon, grad, color }) => {
                const data = stats.subjectMap[subject];
                const pctBar = data ? Math.round((data.count / stats.total) * 100) : 0;
                return (
                  <div key={subject} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/80 transition-colors group">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-md" style={{ background: grad }}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-black text-sm text-slate-800 truncate">{subject}</p>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white shrink-0" style={{ background: color }}>
                          {data?.count.toLocaleString() ?? 0} PYQs
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pctBar}%`, background: grad }} />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">{data?.topics.size ?? 0} Topics · {pctBar}% of database</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onNavigateTo?.('practice')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-white hover:opacity-90 transition-all active:scale-95 shadow-sm"
                        style={{ background: grad }}
                      >
                        <BookOpen size={11} /> Practice
                      </button>
                      <button
                        onClick={() => onNavigateTo?.('papers')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black border transition-all active:scale-95 hover:bg-slate-50"
                        style={{ color, borderColor: color + '44' }}
                      >
                        <TrendingUp size={11} /> Mock
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer CTA */}
            <div className="px-5 py-4 border-t border-slate-100" style={{ background: 'linear-gradient(135deg,#f8faff,#f0f4ff)' }}>
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2">
                  <Award size={16} className="text-amber-500 shrink-0" />
                  <p className="text-xs font-bold text-slate-600">Check your weak areas to focus on what matters most</p>
                </div>
                <button
                  onClick={() => onNavigateTo?.('weakareas')}
                  className="text-xs font-black px-3 py-2 rounded-xl text-white shrink-0 hover:opacity-90 transition-all"
                  style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}
                >
                  Weak Areas →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subject Distribution */}
      <SubjectDistribution />
    </div>
  );
}
