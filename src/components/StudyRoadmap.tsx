import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CalendarDays, Clock, BookOpen, Target, ChevronDown, ChevronUp, AlertTriangle, Trophy, RotateCcw, CheckCircle2, Circle, TrendingUp, Zap, Settings, ChevronRight, ArrowRight, Sparkles, GraduationCap, BarChart3 } from 'lucide-react';
import { cn } from '../lib/utils';
import { format, differenceInWeeks, differenceInDays, addWeeks, startOfWeek, isBefore } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import pyqsData from '../data/pyqs.json';
import { TOPIC_META, HEAT_COLORS } from '../data/roadmapData';
import { StreakTracker, MilestoneTimeline } from './StreakMilestone';
import { TopicHeatmap, RevisionPlanner } from './HeatmapRevision';

// ── Types ──────────────────────────────────────────────────────────────────────
interface PYQ { id: number; subject: string; topic: string; }
interface RoadmapProfile { examDate: string; level: 'beginner' | 'intermediate' | 'advanced'; hoursPerDay: number; createdAt: string; }
interface TopicProgress { [k: string]: boolean; }
interface WeekPlan { weekNumber: number; startDate: Date; endDate: Date; phase: string; subjects: { subject: string; topics: string[]; questionsCount: number; }[]; isRevision: boolean; isMock: boolean; isBuffer: boolean; }

// ── Constants ───────────────────────────────────────────────────────────────────
const SUBJECT_CONFIG = [
  { name: 'Reasoning', weight: 30, icon: '🧩', grad: 'from-purple-500 to-violet-600' },
  { name: 'General Science', weight: 25, icon: '🔬', grad: 'from-emerald-500 to-teal-600' },
  { name: 'Mathematics', weight: 25, icon: '📐', grad: 'from-blue-500 to-indigo-600' },
  { name: 'General Awareness', weight: 20, icon: '🌍', grad: 'from-amber-500 to-orange-600' },
];
const SK = 'rrb_roadmap_profile';
const PK = 'rrb_roadmap_progress';
const BLOCK_KW = ['Full revision', 'Take', 'Analyse', 'Catch', 'Revisit', 'Light', 'Time management'];
const isCheckable = (t: string) => !BLOCK_KW.some(kw => t.startsWith(kw));
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_TYPE = ['learn', 'learn', 'practice', 'practice', 'practice', 'revise', 'revise'] as const;

// ── Helpers ─────────────────────────────────────────────────────────────────────
function buildSyllabus(qs: PYQ[]) {
  const c: Record<string, Record<string, number>> = {};
  qs.forEach(q => { if (!c[q.subject]) c[q.subject] = {}; c[q.subject][q.topic] = (c[q.subject][q.topic] || 0) + 1; });
  const m: Record<string, { topic: string; count: number }[]> = {};
  Object.keys(c).forEach(s => { m[s] = Object.entries(c[s]).sort((a, b) => b[1] - a[1]).map(([topic, count]) => ({ topic, count })); });
  return m;
}

function generateWeeklyPlan(profile: RoadmapProfile, syl: Record<string, { topic: string; count: number }[]>): WeekPlan[] {
  const today = new Date();
  const total = Math.max(1, differenceInWeeks(new Date(profile.examDate), today));
  const buf = Math.min(4, Math.max(1, Math.floor(total * 0.12)));
  const mock = Math.min(3, Math.max(1, Math.floor(total * 0.10)));
  const rev = Math.min(3, Math.max(1, Math.floor(total * 0.10)));
  const study = Math.max(1, total - buf - mock - rev);
  const ord = SUBJECT_CONFIG.map(sc => ({ ...sc, topics: syl[sc.name] || [] }));
  const tw = ord.reduce((s, x) => s + x.weight, 0);
  const alloc = ord.map(s => ({ ...s, aw: Math.max(1, Math.round((s.weight / tw) * study)) }));
  const plans: WeekPlan[] = [];
  let wc = 1;
  const base = startOfWeek(today, { weekStartsOn: 1 });
  alloc.forEach(sub => {
    const tpw = Math.max(1, Math.ceil(sub.topics.length / sub.aw));
    for (let w = 0; w < sub.aw; w++) {
      const wt = sub.topics.slice(w * tpw, w * tpw + tpw);
      if (!wt.length) continue;
      plans.push({ weekNumber: wc, startDate: addWeeks(base, wc - 1), endDate: addWeeks(base, wc), phase: `Study – ${sub.name}`, subjects: [{ subject: sub.name, topics: wt.map(t => t.topic), questionsCount: wt.reduce((s, t) => s + t.count, 0) }], isRevision: false, isMock: false, isBuffer: false });
      wc++;
    }
  });
  for (let r = 0; r < rev; r++) { plans.push({ weekNumber: wc, startDate: addWeeks(base, wc - 1), endDate: addWeeks(base, wc), phase: 'Revision Sprint', subjects: ord.map(s => ({ subject: s.name, topics: ['Full revision – all topics'], questionsCount: 0 })), isRevision: true, isMock: false, isBuffer: false }); wc++; }
  for (let m = 0; m < mock; m++) { plans.push({ weekNumber: wc, startDate: addWeeks(base, wc - 1), endDate: addWeeks(base, wc), phase: 'Mock Test Series', subjects: [{ subject: 'Full Mock Tests', topics: [`Take ${2 + m} full-length tests`, 'Analyse every mistake', 'Time management drills'], questionsCount: 0 }], isRevision: false, isMock: true, isBuffer: false }); wc++; }
  for (let b = 0; b < buf; b++) { plans.push({ weekNumber: wc, startDate: addWeeks(base, wc - 1), endDate: addWeeks(base, wc), phase: 'Buffer & Final Prep', subjects: [{ subject: 'Flex Week', topics: ['Catch up pending topics', 'Revisit flagged Qs', 'Light practice only'], questionsCount: 0 }], isRevision: false, isMock: false, isBuffer: true }); wc++; }
  return plans;
}

function genDaily(topics: string[], hpd: number) {
  const ts = topics.filter(Boolean).length ? topics : ['General Revision'];
  return DAYS.map((day, di) => {
    const topic = ts[di % ts.length];
    const type = DAY_TYPE[di];
    const meta = TOPIC_META[topic];
    const task = type === 'learn' ? `Learn ${topic}` : type === 'practice' ? `Practice ${meta?.pyqCount ?? 20} PYQ-type Qs` : `Revise & review ${topic}`;
    return { day, topic, task, hours: Math.round(hpd * 0.7 * 10) / 10, type };
  });
}

// ── OnboardingWizard ────────────────────────────────────────────────────────────
function OnboardingWizard({ onComplete }: { onComplete: (p: RoadmapProfile) => void }) {
  const [step, setStep] = useState(0);
  const [examDate, setExamDate] = useState('');
  const [level, setLevel] = useState<RoadmapProfile['level']>('beginner');
  const [hours, setHours] = useState(3);
  const TODAY_STR = format(new Date(), 'yyyy-MM-dd');
  const valid = examDate && new Date(examDate) > new Date();
  const LEVELS = [
    { id: 'beginner' as const, icon: '🌱', label: 'Beginner', desc: 'Just starting RRB preparation' },
    { id: 'intermediate' as const, icon: '📘', label: 'Intermediate', desc: 'Covered basics, need practice' },
    { id: 'advanced' as const, icon: '🚀', label: 'Advanced', desc: 'Need revision & full mocks' },
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-container rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg"><GraduationCap size={36} className="text-white" /></div>
        <h2 className="text-3xl font-black text-primary">Study Roadmap</h2>
        <p className="text-sm text-on-surface-variant mt-1">Build your personalised RRB Group D prep plan</p>
      </div>
      <div className="flex justify-center gap-2 mb-6">{[0,1,2].map(i => <div key={i} className={cn('h-1.5 rounded-full transition-all duration-500', i <= step ? 'w-12 bg-primary' : 'w-6 bg-surface-container-high')} />)}</div>
      <div className="bg-surface-container-lowest rounded-2xl p-7 shadow-sm border border-surface-container-high">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <h3 className="text-lg font-bold text-primary flex items-center gap-2 mb-5"><CalendarDays size={21} /> When is your exam?</h3>
              <input type="date" value={examDate} min={TODAY_STR} onChange={e => setExamDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-surface-container-high bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
              {examDate && <p className="text-sm text-on-surface-variant mt-3 flex items-center gap-2"><Clock size={13} /> {differenceInDays(new Date(examDate), new Date())} days to prepare</p>}
              <button disabled={!valid} onClick={() => setStep(1)} className={cn('w-full mt-5 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all', valid ? 'bg-primary text-white hover:bg-primary/90 shadow-md' : 'bg-surface-container text-on-surface-variant cursor-not-allowed')}>Continue <ArrowRight size={15} /></button>
            </motion.div>
          )}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <h3 className="text-lg font-bold text-primary flex items-center gap-2 mb-5"><Target size={21} /> Your current level?</h3>
              <div className="space-y-2">
                {LEVELS.map(l => (
                  <button key={l.id} onClick={() => setLevel(l.id)} className={cn('w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all', level === l.id ? 'border-primary bg-primary/5' : 'border-surface-container-high hover:border-primary/30')}>
                    <span className="text-2xl">{l.icon}</span>
                    <div><p className="font-bold text-sm text-primary">{l.label}</p><p className="text-xs text-on-surface-variant">{l.desc}</p></div>
                    {level === l.id && <CheckCircle2 size={18} className="text-primary ml-auto" />}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setStep(0)} className="flex-1 py-3 rounded-xl font-bold text-sm text-on-surface-variant border border-surface-container-high hover:bg-surface-container">Back</button>
                <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl font-bold text-sm bg-primary text-white hover:bg-primary/90 shadow-md flex items-center justify-center gap-2">Continue <ArrowRight size={15} /></button>
              </div>
            </motion.div>
          )}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <h3 className="text-lg font-bold text-primary flex items-center gap-2 mb-5"><Clock size={21} /> Daily study hours?</h3>
              <div className="bg-surface-container rounded-2xl p-5 text-center mb-4">
                <p className="text-5xl font-black text-primary mb-1">{hours}</p>
                <p className="text-sm text-on-surface-variant mb-3">hours / day</p>
                <input type="range" min={1} max={10} value={hours} onChange={e => setHours(Number(e.target.value))} className="w-full accent-primary" />
                <div className="flex justify-between text-xs text-on-surface-variant mt-1"><span>1 hr</span><span>5 hrs</span><span>10 hrs</span></div>
              </div>
              <p className="text-xs text-on-surface-variant bg-primary/5 rounded-xl p-3 border border-primary/10"><span className="font-bold text-primary">📊 Estimated: </span>{Math.round(hours * differenceInDays(new Date(examDate), new Date()))} total study hours</p>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl font-bold text-sm text-on-surface-variant border border-surface-container-high hover:bg-surface-container">Back</button>
                <button onClick={() => onComplete({ examDate, level, hoursPerDay: hours, createdAt: new Date().toISOString() })} className="flex-1 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-primary to-primary-container text-white hover:opacity-90 shadow-lg flex items-center justify-center gap-2"><Sparkles size={14} /> Generate Roadmap</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── WeekCard ────────────────────────────────────────────────────────────────────
function WeekCard({ week, tp, onToggle, cwn, hpd }: { week: WeekPlan; tp: TopicProgress; onToggle: (k: string) => void; cwn: number; hpd: number }) {
  const [exp, setExp] = useState(week.weekNumber === cwn);
  const [showSched, setShowSched] = useState(false);
  const isCur = week.weekNumber === cwn;
  const isPast = week.weekNumber < cwn;
  const allKeys = week.subjects.flatMap(s => s.topics.filter(t => isCheckable(t)).map(t => `${s.subject}::${t}`));
  const doneCount = allKeys.filter(k => tp[k]).length;
  const pct = allKeys.length > 0 ? Math.round((doneCount / allKeys.length) * 100) : 0;
  const behind = isPast && allKeys.length > 0 && pct < 100;
  const phaseGrad = week.isRevision ? 'from-amber-500 to-orange-500' : week.isMock ? 'from-red-500 to-pink-500' : week.isBuffer ? 'from-slate-400 to-slate-500' : 'from-primary to-primary-container';
  const phaseIcon = week.isRevision ? '🔁' : week.isMock ? '📝' : week.isBuffer ? '🛡️' : '📖';
  const allTopics = week.subjects.flatMap(s => s.topics.filter(t => isCheckable(t)));
  const daily = genDaily(allTopics, hpd);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: week.weekNumber * 0.03 }}
      className={cn('rounded-xl border-2 overflow-hidden', isCur ? 'border-primary shadow-md bg-primary/[0.02]' : behind ? 'border-red-300/60 bg-red-50/20' : isPast ? 'border-tertiary/30 bg-tertiary/[0.03]' : 'border-surface-container-high bg-surface-container-lowest')}>
      <button onClick={() => setExp(!exp)} className="w-full flex items-center justify-between p-4 text-left">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0 bg-gradient-to-br shadow-sm', phaseGrad)}>{week.weekNumber}</div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold text-sm text-primary">{phaseIcon} Week {week.weekNumber} — {week.phase}</p>
              {isCur && <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-bold animate-pulse">CURRENT</span>}
              {behind && <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">⚠ BEHIND</span>}
              {isPast && !behind && allKeys.length > 0 && <span className="text-[10px] bg-tertiary text-white px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><CheckCircle2 size={9} /> DONE</span>}
            </div>
            <p className="text-[11px] text-on-surface-variant mt-0.5">{format(week.startDate, 'MMM d')} – {format(week.endDate, 'MMM d')}{allKeys.length > 0 ? ` · ${doneCount}/${allKeys.length} topics` : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {allKeys.length > 0 && <div className="hidden sm:flex items-center gap-2"><div className="w-16 h-1.5 bg-surface-container-high rounded-full overflow-hidden"><div className={cn('h-full rounded-full transition-all', behind ? 'bg-red-400' : 'bg-tertiary')} style={{ width: `${pct}%` }} /></div><span className="text-[10px] font-bold">{pct}%</span></div>}
          {exp ? <ChevronUp size={15} className="text-on-surface-variant" /> : <ChevronDown size={15} className="text-on-surface-variant" />}
        </div>
      </button>
      <AnimatePresence>
        {exp && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3">
              {behind && <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2"><AlertTriangle size={13} className="text-red-500 mt-0.5 shrink-0" /><p className="text-xs text-red-700 font-medium">Behind schedule! Complete {allKeys.length - doneCount} remaining topic(s) to stay on track.</p></div>}
              {week.subjects.map((sub, si) => (
                <div key={si} className="space-y-1.5">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{sub.subject}{sub.questionsCount > 0 ? ` · ${sub.questionsCount} PYQs` : ''}</p>
                  {sub.topics.map((topic, ti) => {
                    const key = `${sub.subject}::${topic}`;
                    const checkable = isCheckable(topic);
                    const done = tp[key];
                    const meta = TOPIC_META[topic];
                    return (
                      <div key={ti}>
                        <button onClick={() => checkable && onToggle(key)} className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all group', done ? 'bg-green-50' : 'hover:bg-surface-container', !checkable && 'cursor-default')}>
                          {checkable ? (done ? <CheckCircle2 size={16} className="text-tertiary shrink-0" /> : <Circle size={16} className="text-on-surface-variant/40 shrink-0 group-hover:text-primary" />) : <ChevronRight size={14} className="text-on-surface-variant/40 shrink-0" />}
                          <span className={cn('text-sm flex-1', done && 'text-on-surface-variant line-through')}>{topic}</span>
                          {meta && <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ml-1', HEAT_COLORS[meta.heat].bg, HEAT_COLORS[meta.heat].text)}>{meta.pyqCount}Q</span>}
                        </button>
                        {meta && !done && checkable && (
                          <div className="ml-9 space-y-0.5 mb-1">{meta.tips.slice(0, 2).map((tip, i) => <p key={i} className="text-[10px] text-on-surface-variant leading-relaxed">{tip}</p>)}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
              {!week.isRevision && !week.isMock && !week.isBuffer && (
                <div className="pt-2 border-t border-surface-container">
                  <button onClick={() => setShowSched(x => !x)} className="text-xs font-bold text-primary flex items-center gap-1.5 hover:underline">
                    <CalendarDays size={13} /> {showSched ? 'Hide' : 'Show'} Daily Schedule (Mon–Sun)
                  </button>
                  {showSched && (
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {daily.map((d, i) => (
                        <div key={i} className={cn('flex items-start gap-2 p-2.5 rounded-lg border text-[11px]', d.type === 'learn' ? 'bg-blue-50 border-blue-200' : d.type === 'practice' ? 'bg-purple-50 border-purple-200' : 'bg-amber-50 border-amber-200')}>
                          <span className="font-black w-7 shrink-0 text-on-surface">{d.day}</span>
                          <div><p className="font-semibold text-on-surface leading-tight">{d.task}</p><p className="text-on-surface-variant">{d.hours}h · <span className="font-bold capitalize">{d.type}</span></p></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── SubjectProgressBar ──────────────────────────────────────────────────────────
function SubjectProgressBar({ subject, total, done, icon, weight, grad }: { subject: string; total: number; done: number; icon: string; weight: number; grad: string }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="bg-surface-container-lowest rounded-xl p-4 border border-surface-container-high shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2"><span className="text-xl">{icon}</span><div><p className="text-sm font-bold text-primary">{subject}</p><p className="text-[10px] text-on-surface-variant">{done}/{total} topics done</p></div></div>
        <span className="text-xs font-black text-on-surface-variant">{weight}%</span>
      </div>
      <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
        <motion.div className={cn('h-full rounded-full bg-gradient-to-r', grad)} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
      </div>
      <div className="flex justify-between mt-1"><span className="text-[10px] text-on-surface-variant">Progress</span><span className="text-[10px] font-bold text-primary">{pct}%</span></div>
    </div>
  );
}

// ── ScoreEstimator ──────────────────────────────────────────────────────────────
function ScoreEstimator({ profile, progressPct }: { profile: RoadmapProfile; progressPct: number }) {
  const bonus = profile.level === 'advanced' ? 20 : profile.level === 'intermediate' ? 10 : 0;
  const score = Math.min(100, Math.max(0, Math.round(progressPct * 0.85 + bonus)));
  const g = score >= 80 ? { l: 'Excellent', c: 'text-tertiary' } : score >= 60 ? { l: 'Good', c: 'text-blue-600' } : score >= 40 ? { l: 'Average', c: 'text-amber-600' } : { l: 'Needs Work', c: 'text-error' };
  return (
    <div className="bg-surface-container-lowest rounded-xl p-5 border border-surface-container-high shadow-sm">
      <h4 className="text-sm font-bold text-primary flex items-center gap-2 mb-4"><TrendingUp size={16} /> Score Potential</h4>
      <div className="flex items-center justify-center gap-5">
        <div className="relative">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" className="stroke-surface-container-high" /><motion.circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" strokeLinecap="round" className="stroke-primary" strokeDasharray={264} initial={{ strokeDashoffset: 264 }} animate={{ strokeDashoffset: 264 - (264 * score) / 100 }} transition={{ duration: 1.5 }} /></svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-xl font-black text-primary">{score}</span><span className="text-[9px] text-on-surface-variant">/100</span></div>
        </div>
        <div><p className={cn('text-sm font-black', g.c)}>{g.l}</p><p className="text-[10px] text-on-surface-variant mt-1 max-w-[120px]">Based on {Math.round(progressPct)}% coverage & {profile.level} level</p></div>
      </div>
    </div>
  );
}

// ── SettingsPanel ───────────────────────────────────────────────────────────────
function SettingsPanel({ profile, onUpdate, onReset }: { profile: RoadmapProfile; onUpdate: (p: RoadmapProfile) => void; onReset: () => void }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(profile.examDate);
  const [hrs, setHrs] = useState(profile.hoursPerDay);
  const [lv, setLv] = useState(profile.level);
  const changed = date !== profile.examDate || hrs !== profile.hoursPerDay || lv !== profile.level;
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-sm overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between p-4">
        <div className="flex items-center gap-2"><Settings size={16} className="text-on-surface-variant" /><span className="text-sm font-bold text-primary">Roadmap Settings</span></div>
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3">
              <div><label className="text-xs font-bold text-on-surface-variant block mb-1">Exam Date</label><input type="date" value={date} min={format(new Date(), 'yyyy-MM-dd')} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-surface-container-high bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
              <div><label className="text-xs font-bold text-on-surface-variant block mb-1">Study Hours/Day: {hrs}</label><input type="range" min={1} max={10} value={hrs} onChange={e => setHrs(Number(e.target.value))} className="w-full accent-primary" /></div>
              <div><label className="text-xs font-bold text-on-surface-variant block mb-1">Level</label><select value={lv} onChange={e => setLv(e.target.value as any)} className="w-full px-3 py-2 rounded-lg border border-surface-container-high bg-surface text-sm focus:outline-none"><option value="beginner">🌱 Beginner</option><option value="intermediate">📘 Intermediate</option><option value="advanced">🚀 Advanced</option></select></div>
              <div className="flex gap-2">
                {changed && <button onClick={() => onUpdate({ ...profile, examDate: date, hoursPerDay: hrs, level: lv })} className="flex-1 py-2 rounded-lg font-bold text-sm bg-primary text-white flex items-center justify-center gap-1.5"><Sparkles size={13} /> Regenerate</button>}
                <button onClick={onReset} className="py-2 px-3 rounded-lg font-bold text-sm text-error border border-error/20 hover:bg-error/5 flex items-center gap-1.5"><RotateCcw size={13} /> Reset</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── StudyRoadmap (Main) ─────────────────────────────────────────────────────────
export function StudyRoadmap() {
  const allQ = pyqsData as PYQ[];
  const syllabus = useMemo(() => buildSyllabus(allQ), []);
  const [profile, setProfile] = useState<RoadmapProfile | null>(() => { try { return JSON.parse(localStorage.getItem(SK) || 'null'); } catch { return null; } });
  const [tp, setTp] = useState<TopicProgress>(() => { try { return JSON.parse(localStorage.getItem(PK) || '{}'); } catch { return {}; } });
  useEffect(() => { if (profile) localStorage.setItem(SK, JSON.stringify(profile)); }, [profile]);
  useEffect(() => { localStorage.setItem(PK, JSON.stringify(tp)); }, [tp]);
  const weeklyPlan = useMemo(() => profile ? generateWeeklyPlan(profile, syllabus) : [], [profile, syllabus]);
  const cwn = useMemo(() => { const t = new Date(); for (const w of weeklyPlan) { if (!isBefore(t, w.startDate) && isBefore(t, w.endDate)) return w.weekNumber; } return 1; }, [weeklyPlan]);
  const sp = useMemo(() => {
    const r: Record<string, { total: number; done: number }> = {};
    Object.entries(syllabus).forEach(([sub, ts]) => { r[sub] = { total: ts.length, done: ts.filter(t => tp[`${sub}::${t.topic}`]).length }; });
    return r;
  }, [syllabus, tp]);
  const overallPct = useMemo(() => { const t = Object.values(sp).reduce((s, v) => s + v.total, 0); const d = Object.values(sp).reduce((s, v) => s + v.done, 0); return t > 0 ? (d / t) * 100 : 0; }, [sp]);
  const behind = useMemo(() => weeklyPlan.filter(w => { if (w.weekNumber >= cwn) return false; const keys = w.subjects.flatMap(s => s.topics.filter(t => isCheckable(t)).map(t => `${s.subject}::${t}`)); return keys.length > 0 && keys.some(k => !tp[k]); }).length, [weeklyPlan, cwn, tp]);
  const daysLeft = profile ? differenceInDays(new Date(profile.examDate), new Date()) : 0;
  const toggle = useCallback((k: string) => setTp(prev => ({ ...prev, [k]: !prev[k] })), []);

  if (!profile) return <div className="max-w-4xl mx-auto py-8"><OnboardingWizard onComplete={p => setProfile(p)} /></div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-primary flex items-center gap-2"><CalendarDays size={27} /> Study Roadmap</h2>
          <p className="text-sm text-on-surface-variant mt-1">{differenceInWeeks(new Date(profile.examDate), new Date())} weeks · {profile.level} level · {profile.hoursPerDay} hrs/day</p>
        </div>
        <div className={cn('flex items-center gap-3 px-5 py-3 rounded-xl border shadow-sm', daysLeft <= 14 ? 'bg-red-50 border-red-200' : daysLeft <= 30 ? 'bg-amber-50 border-amber-200' : 'bg-surface-container-lowest border-surface-container-high')}>
          {daysLeft <= 14 ? <AlertTriangle size={19} className="text-error" /> : <CalendarDays size={19} className="text-primary" />}
          <div><p className={cn('text-2xl font-black', daysLeft <= 14 ? 'text-error' : 'text-primary')}>{daysLeft}</p><p className="text-[10px] font-bold uppercase text-on-surface-variant tracking-wider">Days Left</p></div>
        </div>
      </div>

      {/* Streak */}
      <StreakTracker />

      {/* Behind warning */}
      {behind > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={19} className="text-error mt-0.5 shrink-0" />
          <div><p className="font-bold text-sm text-error">⚠️ Behind on {behind} week{behind > 1 ? 's' : ''}!</p><p className="text-xs text-red-700/80 mt-0.5">Some past weeks have incomplete topics. Use buffer weeks to catch up.</p></div>
        </motion.div>
      )}

      {/* Milestone */}
      <MilestoneTimeline progressPct={overallPct} />

      {/* Subject progress */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {SUBJECT_CONFIG.map(cfg => { const s = sp[cfg.name] || { total: 0, done: 0 }; return <SubjectProgressBar key={cfg.name} subject={cfg.name} total={s.total} done={s.done} icon={cfg.icon} weight={cfg.weight} grad={cfg.grad} />; })}
      </div>

      {/* Heatmap */}
      <TopicHeatmap />

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between"><h3 className="font-bold text-primary flex items-center gap-2"><BookOpen size={17} /> Weekly Schedule</h3><p className="text-xs text-on-surface-variant">Week {cwn} of {weeklyPlan.length}</p></div>
          {weeklyPlan.map(w => <WeekCard key={w.weekNumber} week={w} tp={tp} onToggle={toggle} cwn={cwn} hpd={profile.hoursPerDay} />)}
        </div>
        <div className="space-y-4">
          <ScoreEstimator profile={profile} progressPct={overallPct} />
          <div className="bg-surface-container-lowest rounded-xl p-5 border border-surface-container-high shadow-sm">
            <h4 className="text-sm font-bold text-primary flex items-center gap-2 mb-4"><BarChart3 size={16} /> Overall Progress</h4>
            <div className="text-center mb-3"><p className="text-4xl font-black text-primary">{Math.round(overallPct)}%</p><p className="text-xs text-on-surface-variant">syllabus covered</p></div>
            <div className="h-3 bg-surface-container-high rounded-full overflow-hidden"><motion.div className="h-full rounded-full bg-gradient-to-r from-primary to-tertiary" initial={{ width: 0 }} animate={{ width: `${overallPct}%` }} transition={{ duration: 1.2 }} /></div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-5 border border-surface-container-high shadow-sm space-y-2">
            <h4 className="text-sm font-bold text-primary flex items-center gap-2 mb-2"><Zap size={15} /> Quick Stats</h4>
            {[
              { label: 'Study Hours Left', value: `${Math.round(profile.hoursPerDay * daysLeft)}h` },
              { label: 'Exam Date', value: format(new Date(profile.examDate), 'MMM d, yyyy') },
              { label: 'Level', value: profile.level.charAt(0).toUpperCase() + profile.level.slice(1) },
              { label: 'Total Weeks', value: `${weeklyPlan.length} weeks` },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between py-1.5 border-b border-surface-container last:border-0">
                <span className="text-xs text-on-surface-variant">{s.label}</span>
                <span className="text-xs font-bold text-primary">{s.value}</span>
              </div>
            ))}
          </div>
          <SettingsPanel profile={profile} onUpdate={p => setProfile(p)} onReset={() => { localStorage.removeItem(SK); localStorage.removeItem(PK); setProfile(null); setTp({}); }} />
        </div>
      </div>

      {/* Revision Planner */}
      <RevisionPlanner />
    </div>
  );
}
