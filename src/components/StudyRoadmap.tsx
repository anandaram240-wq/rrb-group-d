import React, { useState, useMemo, useCallback } from 'react';
import {
  CalendarDays, Clock, Target, ChevronDown, ChevronUp, AlertTriangle,
  CheckCircle2, Circle, TrendingUp, Zap, ArrowRight, Sparkles,
  GraduationCap, BarChart3, Trophy, BookOpen, RotateCcw, Lightbulb,
  Flame, Star, Lock, MapPin, Users, Brain, Swords, FlaskConical,
  Globe, ChevronRight, Info,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format, differenceInDays, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import pyqsData from '../data/pyqs.json';
import { TOPIC_META, HEAT_COLORS, REVISION_PLAN } from '../data/roadmapData';

// ── Types ──────────────────────────────────────────────────────────────────────
interface PYQ { id: number; subject: string; topic: string; }
interface Profile {
  examDate: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  hoursPerDay: number;
  createdAt: string;
  category: 'general' | 'obc' | 'sc' | 'st';
  zone: string;
}
interface DayPlan {
  dayNumber: number;
  subject: string;
  topic: string;
  targetQ: number;
  instruction: string;
  type: 'learn' | 'practice' | 'revise' | 'mock' | 'buffer';
  phase: number;
  phaseLabel: string;
  topicFreq: number;
  tips: string[];
  milestone?: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────
const SUBJECT_ORDER = [
  {
    name: 'Reasoning', marks: 30, icon: '🧩',
    grad: 'from-purple-500 to-violet-600', light: 'bg-purple-50',
    border: 'border-purple-200', text: 'text-purple-700',
    why: 'Highest marks (30) — fastest to improve with daily practice',
    lucide: Brain,
  },
  {
    name: 'Mathematics', marks: 25, icon: '📐',
    grad: 'from-blue-500 to-indigo-600', light: 'bg-blue-50',
    border: 'border-blue-200', text: 'text-blue-700',
    why: 'Formula-based — 1 trick per topic gives 80%+ accuracy',
    lucide: Swords,
  },
  {
    name: 'General Science', marks: 25, icon: '🔬',
    grad: 'from-emerald-500 to-teal-600', light: 'bg-emerald-50',
    border: 'border-emerald-200', text: 'text-emerald-700',
    why: 'NCERT 9-10 direct facts — 70% questions are straight recall',
    lucide: FlaskConical,
  },
  {
    name: 'General Awareness', marks: 20, icon: '🌍',
    grad: 'from-amber-500 to-orange-600', light: 'bg-amber-50',
    border: 'border-amber-200', text: 'text-amber-700',
    why: 'Memory-based — revise last so facts stay freshest for exam',
    lucide: Globe,
  },
];

const CATEGORY_CUTOFF: Record<string, { min: number; safe: number; label: string; color: string }> = {
  general: { min: 65, safe: 72, label: 'General/UR', color: 'text-blue-700' },
  obc:     { min: 60, safe: 67, label: 'OBC/NCWL',  color: 'text-violet-700' },
  sc:      { min: 55, safe: 62, label: 'SC',         color: 'text-emerald-700' },
  st:      { min: 50, safe: 58, label: 'ST',         color: 'text-amber-700' },
};

const RRB_ZONES = [
  'RRB Ahmedabad','RRB Ajmer','RRB Allahabad','RRB Bangalore',
  'RRB Bhopal','RRB Bhubaneswar','RRB Bilaspur','RRB Chandigarh',
  'RRB Chennai','RRB Gorakhpur','RRB Guwahati','RRB Jammu-Srinagar',
  'RRB Kolkata','RRB Malda','RRB Mumbai','RRB Muzaffarpur',
  'RRB Patna','RRB Ranchi','RRB Secunderabad','RRB Siliguri',
  'RRB Thiruvananthapuram',
];

const DIFFICULTY: Record<string, number> = {
  Reasoning: 1.2, Mathematics: 1.3, 'General Science': 0.85, 'General Awareness': 0.7,
};

// Topper-sourced strategies (SSC CGL, UPSC, RRB toppers)
const TOPPER_STRATEGIES = [
  { icon: '🎯', rule: 'One subject at a time — full mastery before moving on', src: 'SSC CGL Rank 1 (Parth Garg) strategy' },
  { icon: '📊', rule: 'Top 20% PYQ topics = 80% of the paper — always prioritise by frequency', src: 'Pareto principle applied to RRB 2018-2024 PYQ data' },
  { icon: '🔁', rule: 'Revise on Day 1, Day 7, Day 30 after learning (Ebbinghaus Forgetting Curve)', src: 'Memory retention science — proven to boost recall to 90%+' },
  { icon: '⏱', rule: '54 seconds max per Q — practice with timer from Day 1', src: 'RRB CBT official pattern: 90 min / 100 Qs' },
  { icon: '🌅', rule: 'Morning = Maths/Reasoning (peak focus). Evening = Science/GA (reading)', src: 'Circadian rhythm research for cognitive performance' },
  { icon: '📝', rule: 'Weekly mini-mock (30 Qs / 27 min) from Week 2 — even if topics not done', src: 'UPSC topper Anudeep Durishetty method' },
  { icon: '🚩', rule: 'Flag confusing Qs immediately → practice them every Saturday', src: 'Active recall methodology — Barbara Oakley, "Learning How to Learn"' },
  { icon: '💯', rule: 'Accuracy first (80%+), THEN build speed — never the other way around', src: 'SSC CGL 100+ scorers interview analysis, 2021–2024' },
  { icon: '📖', rule: 'Short explanation reading for Science/GK — never memorise, understand', src: 'RRB Group D 2022 topper interviews — direct question strategy' },
  { icon: '🧮', rule: 'For Maths: note 1 formula + 1 shortcut per topic in a dedicated sheet', src: 'SSC CGL Rank 3 Nishant Dixit — formula book method' },
];

// Subject-wise sub-target scores
const SUB_TARGETS: Record<string, Record<string, number>> = {
  general: { Reasoning: 22, Mathematics: 18, 'General Science': 18, 'General Awareness': 14 },
  obc:     { Reasoning: 20, Mathematics: 17, 'General Science': 16, 'General Awareness': 14 },
  sc:      { Reasoning: 18, Mathematics: 15, 'General Science': 15, 'General Awareness': 14 },
  st:      { Reasoning: 16, Mathematics: 14, 'General Science': 14, 'General Awareness': 14 },
};

/** Strategy tier based on available days */
function getStrategyTier(days: number): { label: string; topics: number; desc: string; color: string } {
  if (days >= 90) return { label: '🟢 Comprehensive', topics: 25, desc: 'All topics, full depth + 3 revision rounds', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  if (days >= 60) return { label: '🔵 Focused', topics: 18, desc: 'Top-18 PYQ topics per subject + 2 revision rounds', color: 'text-blue-700 bg-blue-50 border-blue-200' };
  if (days >= 30) return { label: '🟡 Rapid', topics: 10, desc: 'Top-10 topics only + weekly mocks from Day 1', color: 'text-amber-700 bg-amber-50 border-amber-200' };
  return { label: '🔴 Emergency', topics: 5, desc: 'Top-5 highest-frequency topics + daily mocks', color: 'text-red-700 bg-red-50 border-red-200' };
}

const SK = 'rrb_roadmap_profile';
const CK = 'rrb_day_completions';

// ── Helpers ─────────────────────────────────────────────────────────────────────
function buildSyllabus(qs: PYQ[]) {
  const c: Record<string, Record<string, number>> = {};
  qs.forEach(q => {
    if (!c[q.subject]) c[q.subject] = {};
    c[q.subject][q.topic] = (c[q.subject][q.topic] || 0) + 1;
  });
  const m: Record<string, { topic: string; count: number }[]> = {};
  Object.keys(c).forEach(s => {
    m[s] = Object.entries(c[s]).sort((a, b) => b[1] - a[1]).map(([topic, count]) => ({ topic, count }));
  });
  return m;
}

function loadCompletions(): Set<number> {
  try { return new Set(JSON.parse(localStorage.getItem(CK) || '[]')); }
  catch { return new Set(); }
}
function saveCompletions(s: Set<number>) {
  localStorage.setItem(CK, JSON.stringify([...s]));
}

// ── Plan Generator ──────────────────────────────────────────────────────────────
function generatePlan(
  profile: Profile,
  syllabus: Record<string, { topic: string; count: number }[]>
): DayPlan[] {
  const startDate = parseISO(profile.createdAt);
  const examDate = parseISO(profile.examDate);
  const totalDays = Math.max(7, differenceInDays(examDate, startDate));
  const tier = getStrategyTier(totalDays);

  const qPerDay = profile.hoursPerDay >= 6 ? 60
    : profile.hoursPerDay >= 4 ? 45
    : profile.hoursPerDay >= 2 ? 30 : 20;

  const studyBudget = Math.floor(totalDays * 0.72);
  const revBudget   = Math.floor(totalDays * 0.13);
  const mockBudget  = totalDays - studyBudget - revBudget;

  const totalW = SUBJECT_ORDER.reduce((s, sub) => s + sub.marks * (DIFFICULTY[sub.name] || 1), 0);
  const subAlloc = SUBJECT_ORDER.map(sub => ({
    ...sub,
    days: Math.max(2, Math.floor(studyBudget * (sub.marks * (DIFFICULTY[sub.name] || 1)) / totalW)),
  }));

  const plans: DayPlan[] = [];
  let dayNum = 1;

  for (let pi = 0; pi < subAlloc.length; pi++) {
    const sub = subAlloc[pi];
    const subName = sub.name;
    const topics = (syllabus[subName] || []).slice(0, tier.topics);
    const alloted = sub.days;
    const phaseNum = pi + 1;

    let dayInPhase = 0;
    let daysSinceRev = 0;
    let ti = 0;

    plans.push({
      dayNumber: dayNum++,
      subject: subName,
      topic: `${subName} — Kickoff`,
      targetQ: 15,
      instruction: `🚀 Phase ${phaseNum} begins: ${subName}! Solve 15 spread-out PYQs across ALL ${subName} topics to identify your baseline. Mark every Q you're unsure about with 🚩.`,
      type: 'learn',
      phase: phaseNum,
      phaseLabel: subName,
      topicFreq: topics.reduce((s, t) => s + t.count, 0),
      tips: [
        `${subName} = ${sub.marks} marks — ${sub.why}`,
        `Strategy: ${tier.label} — top ${tier.topics} PYQ-frequency topics`,
        `Today: understand the scope. Don't worry if accuracy is low.`,
      ],
    });
    dayInPhase++;
    daysSinceRev++;

    while (dayInPhase < alloted - 1 && ti < topics.length) {
      const topic = topics[ti];

      if (daysSinceRev >= 7 && ti >= 2) {
        const revTopics = topics.slice(Math.max(0, ti - 3), ti).map(t => t.topic).join(' + ');
        plans.push({
          dayNumber: dayNum++,
          subject: subName,
          topic: 'Spaced Revision',
          targetQ: qPerDay,
          instruction: `🔁 Day-7 Revision (Ebbinghaus Rule): Re-solve ${qPerDay} PYQs from: ${revTopics}. Focus only on wrong/flagged questions. Skip what you score 90%+.`,
          type: 'revise',
          phase: phaseNum,
          phaseLabel: subName,
          topicFreq: 0,
          tips: [
            'Without revision at Day 7, you forget 70% of what you studied',
            'Target: get accuracy above 80% on previously wrong questions',
            'Use your 🚩 flagged list as the revision queue',
          ],
        });
        dayInPhase++;
        daysSinceRev = 0;
      }

      if (dayInPhase >= alloted - 1) break;

      const topicDays = topic.count >= 50 ? 3 : topic.count >= 25 ? 2 : 1;
      const isHighPriority = topic.count >= 40;
      const isMedPriority = topic.count >= 20;

      for (let d = 0; d < topicDays && dayInPhase < alloted - 1; d++) {
        const isFirst = d === 0;
        const qTarget = isFirst
          ? Math.min(topic.count, Math.floor(qPerDay * 0.5))
          : Math.min(topic.count, qPerDay);

        plans.push({
          dayNumber: dayNum++,
          subject: subName,
          topic: topic.topic,
          targetQ: qTarget,
          instruction: isFirst
            ? `📖 Learn "${topic.topic}" (${subName}): Study concept + formula (20 min max) → Solve first ${qTarget} PYQs → Note 1 speed trick → Flag 🚩 any confusing Q`
            : `⚡ Master "${topic.topic}": Solve ${qTarget} PYQs at exam speed (≤54s each). After every 10 Qs: check accuracy. Revisit wrong answers immediately. Target: ≥80%.`,
          type: isFirst ? 'learn' : 'practice',
          phase: phaseNum,
          phaseLabel: subName,
          topicFreq: topic.count,
          tips: [
            `"${topic.topic}" — ${topic.count} PYQs in dataset ${isHighPriority ? '🔥 Very High Priority' : isMedPriority ? '⚡ High Priority' : '✅ Standard'}`,
            ...(TOPIC_META[topic.topic]?.tips?.slice(0, 2) ?? []),
          ],
        });
        dayInPhase++;
        daysSinceRev++;
      }
      ti++;
    }

    plans.push({
      dayNumber: dayNum++,
      subject: subName,
      topic: `${subName} Phase Test`,
      targetQ: 25,
      instruction: `📝 ${subName} Phase Test: 25 Qs in 22 min (timer on, no notes, exam simulation). Analyse every wrong answer. Score target: ≥${CATEGORY_CUTOFF['general']?.safe ?? 70}% to move confidently.`,
      type: 'mock',
      phase: phaseNum,
      phaseLabel: subName,
      topicFreq: 0,
      milestone: `✅ Phase ${phaseNum} Complete — ${subName} DONE!`,
      tips: [
        '≥80% → Excellent! Move to next subject',
        '60–80% → Good. Note 3 weak topics for revision phase',
        '<60% → Spend 2 extra days on weakest 3 topics before moving',
      ],
    });
  }

  // Phase 5: Mixed Revision
  const revRota = SUBJECT_ORDER.map(s => s.name);
  for (let d = 0; d < revBudget; d++) {
    const subName = revRota[d % revRota.length];
    plans.push({
      dayNumber: dayNum++,
      subject: subName,
      topic: 'Final Revision',
      targetQ: qPerDay,
      instruction: `🔁 Final Revision — ${subName}: ONLY practice your 🚩 Weak Areas flagged questions + topics where accuracy was <70%. Skip strong topics. Simulate exam time.`,
      type: 'revise',
      phase: 5,
      phaseLabel: 'Mixed Revision',
      topicFreq: 0,
      tips: [
        'Skip what you know well. Double down on weak spots.',
        '30 min Weak Areas practice + 30 min timed PYQs = optimal session',
        `Target cutoff: ${CATEGORY_CUTOFF['general']?.safe ?? 70}/100`,
      ],
    });
  }

  // Phase 6: Full CBT Mocks
  for (let d = 0; d < mockBudget; d++) {
    const isLast = d === mockBudget - 1;
    plans.push({
      dayNumber: dayNum++,
      subject: 'All Subjects',
      topic: isLast ? '🏆 EXAM DAY — You Are Ready!' : `Full CBT Mock ${d + 1}`,
      targetQ: isLast ? 0 : 100,
      instruction: isLast
        ? `🏅 Exam Day: Light breakfast, reach 30 min early. Read all 100 Qs quickly (5 min first pass). Attempt easy Qs first. Don't spend >2 min on any Q. Trust your preparation!`
        : `📝 Full Mock ${d + 1}: 100 Qs / 90 min — no breaks, real exam simulation. Post-mock: calculate accuracy per subject, note top-3 wrong topics. Analysis = 1 hr minimum.`,
      type: isLast ? 'buffer' : 'mock',
      phase: 6,
      phaseLabel: 'Full Mocks',
      topicFreq: 0,
      milestone: isLast ? `🎯 Good luck at ${profile.zone}!` : undefined,
      tips: isLast
        ? ['8 hours sleep tonight', 'Hall ticket + ID ready?', 'Arrive 30 min early']
        : [
          'After each mock: 1 hour analysis > 3 hours more studying',
          'Reasoning 22+, Maths 18+, Science 18+, GA 14+ = safe zone',
          'Eliminate 2 wrong options first — boosts 50% guessing to 70%',
        ],
    });
  }

  return plans;
}

// ── PYQ Frequency Heatmap ───────────────────────────────────────────────────────
function FrequencyHeatmap({ syllabus }: { syllabus: Record<string, { topic: string; count: number }[]> }) {
  const [activeSubject, setActiveSubject] = useState(SUBJECT_ORDER[0].name);
  const sub = SUBJECT_ORDER.find(s => s.name === activeSubject)!;
  const topics = (syllabus[activeSubject] || []).slice(0, 12);
  const maxCount = topics[0]?.count || 1;
  const totalPYQs = topics.reduce((s, t) => s + t.count, 0);

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high shadow-sm overflow-hidden">
      <div className="p-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-primary flex items-center gap-2 text-sm">
            <BarChart3 size={16} className="text-primary" /> PYQ Frequency Analysis — Top Topics
          </h3>
          <span className="text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full font-mono">
            {totalPYQs} PYQs shown
          </span>
        </div>
        {/* Subject tabs */}
        <div className="flex gap-1 flex-wrap mb-4">
          {SUBJECT_ORDER.map(s => (
            <button
              key={s.name}
              onClick={() => setActiveSubject(s.name)}
              className={cn(
                'text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all',
                activeSubject === s.name
                  ? `bg-gradient-to-r ${s.grad} text-white shadow-sm`
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              )}
            >
              {s.icon} {s.name.replace('General ', 'Gen. ')}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-5 space-y-2">
        {topics.map((t, i) => {
          const pct = Math.round((t.count / maxCount) * 100);
          const meta = TOPIC_META[t.topic];
          const heat = meta?.heat ?? (t.count >= 100 ? 'heavy' : t.count >= 40 ? 'medium' : 'light');
          const hc = HEAT_COLORS[heat];
          return (
            <div key={t.topic} className="group">
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn('text-[9px] font-black w-4 text-center shrink-0', hc.text)}>
                    #{i + 1}
                  </span>
                  <span className="text-xs font-semibold text-on-surface truncate">{t.topic}</span>
                  <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0', hc.bg, hc.text)}>
                    {heat === 'heavy' ? '🔥' : heat === 'medium' ? '⚡' : '✅'} {hc.label}
                  </span>
                </div>
                <span className="text-[11px] font-black text-on-surface shrink-0 ml-2">{t.count}</span>
              </div>
              <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                <motion.div
                  className={cn('h-full rounded-full bg-gradient-to-r', sub.grad)}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, delay: i * 0.04 }}
                />
              </div>
              {meta?.tips?.[0] && (
                <p className="text-[10px] text-on-surface-variant mt-0.5 pl-6 line-clamp-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  💡 {meta.tips[0]}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Subject Mastery Overview ────────────────────────────────────────────────────
function SubjectMasteryOverview({
  plan, completions, category,
}: {
  plan: DayPlan[]; completions: Set<number>; category: string;
}) {
  const targets = SUB_TARGETS[category] ?? SUB_TARGETS.general;

  const subStats = SUBJECT_ORDER.map(sub => {
    const subDays = plan.filter(d => d.subject === sub.name);
    const done = subDays.filter(d => completions.has(d.dayNumber)).length;
    const pct = subDays.length > 0 ? Math.round((done / subDays.length) * 100) : 0;
    const learnDone = subDays.filter(d => d.type === 'learn' && completions.has(d.dayNumber)).length;
    const totalLearn = subDays.filter(d => d.type === 'learn').length;
    return { ...sub, done, total: subDays.length, pct, learnDone, totalLearn };
  });

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high shadow-sm p-5">
      <h3 className="font-black text-primary flex items-center gap-2 text-sm mb-4">
        <Trophy size={16} className="text-amber-500" /> Subject Mastery Overview
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {subStats.map(s => (
          <div key={s.name} className={cn('rounded-xl p-3 border', s.light, s.border)}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{s.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={cn('text-xs font-black truncate', s.text)}>{s.name.replace('General ', 'G. ')}</p>
                <p className="text-[10px] text-on-surface-variant">{s.marks} marks</p>
              </div>
              <span className={cn('text-sm font-black', s.text)}>{s.pct}%</span>
            </div>
            <div className="h-2 bg-white/60 rounded-full overflow-hidden mb-2">
              <motion.div
                className={cn('h-full rounded-full bg-gradient-to-r', s.grad)}
                initial={{ width: 0 }}
                animate={{ width: `${s.pct}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-on-surface-variant">
              <span>{s.done}/{s.total} days</span>
              <span className="font-bold">Target: {targets[s.name]}/{s.marks}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 7-Day Pre-Exam Sprint ───────────────────────────────────────────────────────
function PreExamSprint({ daysLeft }: { daysLeft: number }) {
  const [open, setOpen] = useState(daysLeft <= 14);
  if (daysLeft > 30) return null;

  return (
    <div className={cn(
      'rounded-2xl border-2 overflow-hidden',
      daysLeft <= 7 ? 'border-red-400' : 'border-amber-300'
    )}>
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'w-full flex items-center gap-3 p-4 text-left',
          daysLeft <= 7 ? 'bg-red-50' : 'bg-amber-50'
        )}
      >
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg shrink-0',
          daysLeft <= 7 ? 'bg-red-500' : 'bg-amber-500'
        )}>
          🔥
        </div>
        <div className="flex-1">
          <p className={cn('font-black text-sm', daysLeft <= 7 ? 'text-red-700' : 'text-amber-700')}>
            {daysLeft <= 7 ? `🚨 EXAM IN ${daysLeft} DAYS — Final Sprint!` : `⚡ ${daysLeft} Days Left — Pre-Exam Sprint Plan`}
          </p>
          <p className="text-[11px] text-on-surface-variant">7-day topper revision schedule</p>
        </div>
        {open ? <ChevronUp size={16} className="text-on-surface-variant shrink-0" /> : <ChevronDown size={16} className="text-on-surface-variant shrink-0" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-2 bg-surface-container-lowest">
              {REVISION_PLAN.map(day => {
                const typeColor: Record<string, string> = {
                  revise: 'bg-amber-100 text-amber-800 border-amber-200',
                  practice: 'bg-blue-100 text-blue-800 border-blue-200',
                };
                return (
                  <div key={day.day} className={cn('flex items-start gap-3 p-3 rounded-xl border', typeColor[day.type] ?? 'bg-surface-container border-surface-container-high')}>
                    <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center font-black text-xs shrink-0">
                      D-{8 - day.day}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-black">{day.label}</p>
                      <p className="text-[10px] mt-0.5 opacity-80">{day.focus}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {day.topics.map(t => (
                          <span key={t} className="text-[9px] font-bold bg-white/50 px-1.5 py-0.5 rounded">{t}</span>
                        ))}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold shrink-0">{day.hours}h</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Today Card ──────────────────────────────────────────────────────────────────
function TodayCard({ day, isCompleted, onToggle, profile }: {
  day: DayPlan | null; isCompleted: boolean; onToggle: () => void; profile: Profile;
}) {
  if (!day) {
    return (
      <div className="bg-tertiary/10 rounded-2xl p-6 border border-tertiary/20 text-center">
        <Trophy size={28} className="text-tertiary mx-auto mb-2" />
        <p className="font-black text-primary text-lg">All Days Complete! 🎉</p>
        <p className="text-sm text-on-surface-variant mt-1">Rest and do light revision. You're exam-ready!</p>
      </div>
    );
  }
  const sub = SUBJECT_ORDER.find(s => s.name === day.subject);
  const typeColors: Record<string, string> = {
    learn: 'from-blue-500 to-indigo-600', practice: 'from-purple-500 to-violet-600',
    revise: 'from-amber-500 to-orange-500', mock: 'from-red-500 to-pink-600', buffer: 'from-slate-400 to-slate-500',
  };
  const typeLabel: Record<string, string> = {
    learn: '📖 LEARN', practice: '⚡ PRACTICE', revise: '🔁 REVISE', mock: '📝 MOCK', buffer: '🛡 BUFFER',
  };
  const cutoff = CATEGORY_CUTOFF[profile.category];
  const subTargets = SUB_TARGETS[profile.category] ?? SUB_TARGETS.general;
  const meta = TOPIC_META[day.topic];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-2xl overflow-hidden shadow-md border',
        isCompleted ? 'border-tertiary/30 bg-tertiary/5' : (sub?.border ?? 'border-primary/20')
      )}
    >
      <div className={cn('h-1.5 bg-gradient-to-r', sub?.grad ?? 'from-primary to-primary-container')} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-xl">{sub?.icon ?? '📚'}</span>
              <span className={cn('text-xs font-black px-2.5 py-1 rounded-full text-white bg-gradient-to-r', typeColors[day.type])}>
                {typeLabel[day.type]}
              </span>
              <span className="text-xs font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                Day {day.dayNumber} · Phase {day.phase}
              </span>
              {day.topicFreq > 0 && (
                <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full',
                  day.topicFreq >= 50 ? 'bg-red-100 text-red-700' :
                  day.topicFreq >= 25 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                )}>
                  {day.topicFreq >= 50 ? '🔥' : day.topicFreq >= 25 ? '⚡' : '✅'} {day.topicFreq} PYQs
                </span>
              )}
              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', cutoff.color, 'bg-surface-container border-surface-container-high')}>
                🎯 Target: {cutoff.safe}/100
              </span>
            </div>
            <h3 className="text-xl font-black text-primary mb-0.5">{day.topic}</h3>
            <p className={cn('text-sm font-medium mb-3', sub?.text ?? 'text-on-surface-variant')}>
              {day.subject}{profile.zone && profile.zone !== 'Not selected' ? ` · ${profile.zone}` : ''}
            </p>

            <p className="text-sm text-on-surface leading-relaxed bg-surface-container rounded-xl p-4 mb-3">
              {day.instruction}
            </p>

            {/* Sub-subject target */}
            {day.subject !== 'All Subjects' && (
              <div className="flex flex-wrap gap-2 mb-3">
                {SUBJECT_ORDER.map(s => (
                  <div key={s.name} className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border',
                    s.name === day.subject ? `${s.light} ${s.border} ${s.text}` : 'bg-surface-container border-surface-container-high text-on-surface-variant/60'
                  )}>
                    {s.icon} {s.name.replace('General ', '')}:
                    <span className="font-black">{subTargets[s.name]}/{s.marks}</span>
                  </div>
                ))}
              </div>
            )}

            {day.targetQ > 0 && (
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1.5 text-sm font-bold text-primary">
                  <Target size={14} /> {day.targetQ} questions today
                </div>
                <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                  <Clock size={12} /> ~{Math.round(day.targetQ * 54 / 60)} min at exam speed
                </div>
              </div>
            )}

            {/* Tips from topic meta */}
            {day.tips.slice(0, 3).map((tip, i) => (
              <p key={i} className="text-xs text-on-surface-variant flex items-start gap-1.5 mb-0.5">
                <Lightbulb size={10} className="text-amber-500 shrink-0 mt-0.5" />{tip}
              </p>
            ))}

            {/* Extra meta tip if available */}
            {meta?.tips?.[2] && (
              <p className="text-xs text-primary/70 flex items-start gap-1.5 mt-1">
                <Info size={10} className="text-primary/60 shrink-0 mt-0.5" />{meta.tips[2]}
              </p>
            )}
          </div>
          <button
            onClick={onToggle}
            className={cn(
              'shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-sm',
              isCompleted ? 'bg-tertiary text-white shadow-md' : 'bg-surface-container-high text-on-surface-variant hover:bg-primary/10 hover:text-primary'
            )}
            title={isCompleted ? 'Mark incomplete' : 'Mark done'}
          >
            {isCompleted ? <CheckCircle2 size={28} /> : <Circle size={28} />}
          </button>
        </div>
        {day.milestone && (
          <div className="mt-3 bg-tertiary/10 border border-tertiary/20 rounded-xl p-3 text-center">
            <p className="text-sm font-black text-tertiary">{day.milestone}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Day Row ─────────────────────────────────────────────────────────────────────
function DayRow({ day, isCompleted, isToday, onToggle }: {
  day: DayPlan; isCompleted: boolean; isToday: boolean; onToggle: (n: number) => void;
}) {
  const typeColor: Record<string, string> = {
    learn: 'text-blue-600 bg-blue-50', practice: 'text-purple-600 bg-purple-50',
    revise: 'text-amber-600 bg-amber-50', mock: 'text-red-600 bg-red-50', buffer: 'text-slate-500 bg-slate-50',
  };
  const typeIcon: Record<string, string> = { learn: '📖', practice: '⚡', revise: '🔁', mock: '📝', buffer: '🛡' };

  return (
    <div className={cn(
      'flex items-start gap-3 px-4 py-3 rounded-xl transition-all border',
      isToday ? 'border-primary bg-primary/5 shadow-sm' :
        isCompleted ? 'border-tertiary/20 bg-tertiary/5 opacity-75' :
          'border-transparent hover:border-surface-container-high hover:bg-surface-container-low'
    )}>
      <button onClick={() => onToggle(day.dayNumber)} className="shrink-0 mt-0.5">
        {isCompleted
          ? <CheckCircle2 size={18} className="text-tertiary" />
          : <Circle size={18} className={isToday ? 'text-primary' : 'text-on-surface-variant/40 hover:text-primary'} />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {isToday && <span className="text-[9px] font-black bg-primary text-white px-2 py-0.5 rounded-full animate-pulse">TODAY</span>}
          <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', typeColor[day.type] ?? 'text-primary bg-primary/10')}>
            {typeIcon[day.type]} {day.type.toUpperCase()}
          </span>
          {day.topicFreq > 0 && <span className="text-[9px] text-on-surface-variant">{day.topicFreq} PYQs</span>}
        </div>
        <p className={cn('text-sm font-semibold mt-0.5', isCompleted ? 'line-through text-on-surface-variant' : 'text-on-surface')}>
          {day.topic}
        </p>
        <p className="text-[11px] text-on-surface-variant mt-0.5 line-clamp-1">{day.instruction.split(':')[0]}</p>
        {day.milestone && <p className="text-[11px] font-black text-tertiary mt-1">{day.milestone}</p>}
      </div>
      <div className="text-right shrink-0">
        <p className="text-[10px] font-bold text-on-surface-variant">Day {day.dayNumber}</p>
        {day.targetQ > 0 && <p className="text-[9px] text-on-surface-variant">{day.targetQ}Q</p>}
      </div>
    </div>
  );
}

// ── Phase Card ──────────────────────────────────────────────────────────────────
function PhaseCard({ phaseNum, phaseLabel, days, completions, todayDayNum, onToggle, isLocked }: {
  phaseNum: number; phaseLabel: string; days: DayPlan[];
  completions: Set<number>; todayDayNum: number; onToggle: (n: number) => void; isLocked: boolean;
}) {
  const sub = SUBJECT_ORDER.find(s => s.name === phaseLabel);
  const phaseMeta: Record<number, any> = {
    5: { icon: '🔁', grad: 'from-amber-500 to-orange-500', light: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
    6: { icon: '📝', grad: 'from-red-500 to-pink-600', light: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
  };
  const meta = sub ?? phaseMeta[phaseNum] ?? { icon: '📚', grad: 'from-primary to-primary-container', light: 'bg-surface-container', border: 'border-surface-container-high', text: 'text-primary' };

  const doneDays = days.filter(d => completions.has(d.dayNumber)).length;
  const pct = days.length > 0 ? Math.round((doneDays / days.length) * 100) : 0;
  const isDone = doneDays === days.length;
  const hasCurrent = days.some(d => d.dayNumber === todayDayNum);
  const phaseIcons: Record<number, string> = { 1: '🧩', 2: '📐', 3: '🔬', 4: '🌍', 5: '🔁', 6: '📝' };
  const [expanded, setExpanded] = useState(hasCurrent);

  // High-frequency topic count for this phase
  const highFreqTopics = days.filter(d => d.topicFreq >= 50).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: phaseNum * 0.04 }}
      className={cn(
        'rounded-2xl border-2 overflow-hidden',
        hasCurrent ? 'border-primary shadow-md' : isDone ? 'border-tertiary/40' :
          isLocked ? 'border-surface-container-high opacity-60' : (meta.border ?? 'border-surface-container-high')
      )}
    >
      <button
        onClick={() => !isLocked && setExpanded(e => !e)}
        className={cn('w-full flex items-center gap-3 p-4 text-left', hasCurrent ? 'bg-primary/5' : isDone ? 'bg-tertiary/5' : (meta.light ?? 'bg-surface-container-lowest'))}
      >
        <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shrink-0 bg-gradient-to-br shadow-sm', meta.grad ?? 'from-primary to-primary-container')}>
          {isDone ? '✅' : isLocked ? <Lock size={18} /> : phaseIcons[phaseNum] ?? phaseNum}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={cn('font-black text-sm', meta.text ?? 'text-primary')}>Phase {phaseNum} — {phaseLabel}</p>
            {hasCurrent && <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-bold animate-pulse">CURRENT</span>}
            {isDone && <span className="text-[10px] bg-tertiary text-white px-2 py-0.5 rounded-full font-bold">COMPLETE</span>}
            {isLocked && <span className="text-[10px] bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full font-bold">LOCKED</span>}
            {highFreqTopics > 0 && !isLocked && (
              <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold">
                🔥 {highFreqTopics} high-freq
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex-1 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
              <div className={cn('h-full rounded-full transition-all', isDone ? 'bg-tertiary' : 'bg-gradient-to-r ' + (meta.grad ?? 'from-primary to-primary-container'))} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] font-bold text-on-surface-variant shrink-0">{doneDays}/{days.length} days · {pct}%</span>
          </div>
        </div>
        {!isLocked && (expanded ? <ChevronUp size={15} className="text-on-surface-variant shrink-0" /> : <ChevronDown size={15} className="text-on-surface-variant shrink-0" />)}
      </button>

      <AnimatePresence>
        {expanded && !isLocked && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-1.5 bg-surface-container-lowest">
              {days.map(d => (
                <DayRow key={d.dayNumber} day={d} isCompleted={completions.has(d.dayNumber)} isToday={d.dayNumber === todayDayNum} onToggle={onToggle} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Onboarding Wizard ───────────────────────────────────────────────────────────
function OnboardingWizard({ onComplete }: { onComplete: (p: Profile) => void }) {
  const [step, setStep] = useState(0);
  const [examDate, setExamDate] = useState('');
  const [category, setCategory] = useState<Profile['category']>('general');
  const [zone, setZone] = useState('');
  const [level, setLevel] = useState<Profile['level']>('beginner');
  const [hours, setHours] = useState(3);
  const today = format(new Date(), 'yyyy-MM-dd');
  const daysLeft = examDate ? differenceInDays(new Date(examDate), new Date()) : 0;
  const valid = examDate && new Date(examDate) > new Date();
  const tier = examDate ? getStrategyTier(daysLeft) : null;
  const cutoff = CATEGORY_CUTOFF[category];

  const CATS = [
    { id: 'general' as const, label: 'General / UR', icon: '👤', cut: CATEGORY_CUTOFF.general },
    { id: 'obc' as const,     label: 'OBC / NCWL',  icon: '👥', cut: CATEGORY_CUTOFF.obc },
    { id: 'sc' as const,      label: 'SC',           icon: '📋', cut: CATEGORY_CUTOFF.sc },
    { id: 'st' as const,      label: 'ST',           icon: '📋', cut: CATEGORY_CUTOFF.st },
  ];
  const LEVELS = [
    { id: 'beginner' as const, icon: '🌱', label: 'Beginner', desc: 'Just starting RRB prep' },
    { id: 'intermediate' as const, icon: '📘', label: 'Intermediate', desc: 'Covered basics, need practice' },
    { id: 'advanced' as const, icon: '🚀', label: 'Advanced', desc: 'Need revision & full mocks' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto py-8">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-container rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <GraduationCap size={36} className="text-white" />
        </div>
        <h2 className="text-3xl font-black text-primary">Top 1% Roadmap</h2>
        <p className="text-sm text-on-surface-variant mt-1">Personalised day-by-day plan — built from SSC CGL, RRB & UPSC topper strategies + PYQ frequency data</p>
      </div>

      {/* Step dots */}
      <div className="flex justify-center gap-2 mb-6">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={cn('h-1.5 rounded-full transition-all duration-500', i <= step ? 'w-12 bg-primary' : 'w-6 bg-surface-container-high')} />
        ))}
      </div>

      <div className="bg-surface-container-lowest rounded-2xl p-7 shadow-sm border border-surface-container-high">
        <AnimatePresence mode="wait">

          {/* Step 0: Exam date */}
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <h3 className="text-lg font-bold text-primary flex items-center gap-2 mb-5">
                <CalendarDays size={21} /> When is your RRB Group D exam?
              </h3>
              <input type="date" value={examDate} min={today} onChange={e => setExamDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-surface-container-high bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              {tier && (
                <div className={cn('mt-3 p-3 rounded-xl border text-sm', tier.color)}>
                  <p className="font-black">{daysLeft} days — Strategy: {tier.label}</p>
                  <p className="text-xs mt-0.5 opacity-80">{tier.desc}</p>
                </div>
              )}
              <button disabled={!valid} onClick={() => setStep(1)}
                className={cn('w-full mt-5 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2', valid ? 'bg-primary text-white hover:bg-primary/90 shadow-md' : 'bg-surface-container text-on-surface-variant cursor-not-allowed')}>
                Continue <ArrowRight size={15} />
              </button>
            </motion.div>
          )}

          {/* Step 1: Category & Zone */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <h3 className="text-lg font-bold text-primary flex items-center gap-2 mb-2">
                <Users size={21} /> Your reservation category?
              </h3>
              <p className="text-xs text-on-surface-variant mb-4">Sets your score target and sub-subject cutoffs throughout the roadmap</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {CATS.map(c => (
                  <button key={c.id} onClick={() => setCategory(c.id)}
                    className={cn('flex flex-col items-start p-3 rounded-xl border-2 text-left transition-all', category === c.id ? 'border-primary bg-primary/5' : 'border-surface-container-high hover:border-primary/30')}>
                    <div className="flex items-center gap-2 mb-1">
                      <span>{c.icon}</span>
                      <span className="font-bold text-sm text-primary">{c.label}</span>
                      {category === c.id && <CheckCircle2 size={14} className="text-primary ml-auto" />}
                    </div>
                    <p className="text-[10px] text-on-surface-variant">Cutoff: ~{c.cut.min}–{c.cut.safe}/100</p>
                  </button>
                ))}
              </div>
              <div className={cn('p-3 rounded-xl border mb-4 text-sm', cutoff.color, 'border-current/20 bg-current/5')}>
                <p className="font-black">{cutoff.label} target: {cutoff.safe}/100</p>
                <p className="text-xs mt-0.5 opacity-80">Sub-targets: R:{SUB_TARGETS[category].Reasoning} | M:{SUB_TARGETS[category].Mathematics} | S:{SUB_TARGETS[category]['General Science']} | GA:{SUB_TARGETS[category]['General Awareness']}</p>
              </div>
              <label className="text-xs font-bold text-on-surface-variant block mb-1 flex items-center gap-1">
                <MapPin size={12} /> RRB Zone (optional)
              </label>
              <select value={zone} onChange={e => setZone(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-surface-container-high bg-surface text-sm focus:outline-none mb-1">
                <option value="">Select your RRB zone…</option>
                {RRB_ZONES.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setStep(0)} className="flex-1 py-3 rounded-xl font-bold text-sm text-on-surface-variant border border-surface-container-high hover:bg-surface-container">Back</button>
                <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl font-bold text-sm bg-primary text-white hover:bg-primary/90 shadow-md flex items-center justify-center gap-2">Continue <ArrowRight size={15} /></button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Level */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <h3 className="text-lg font-bold text-primary flex items-center gap-2 mb-5">
                <Target size={21} /> Your current preparation level?
              </h3>
              <div className="space-y-2">
                {LEVELS.map(l => (
                  <button key={l.id} onClick={() => setLevel(l.id)}
                    className={cn('w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all', level === l.id ? 'border-primary bg-primary/5' : 'border-surface-container-high hover:border-primary/30')}>
                    <span className="text-2xl">{l.icon}</span>
                    <div><p className="font-bold text-sm text-primary">{l.label}</p><p className="text-xs text-on-surface-variant">{l.desc}</p></div>
                    {level === l.id && <CheckCircle2 size={18} className="text-primary ml-auto" />}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl font-bold text-sm text-on-surface-variant border border-surface-container-high hover:bg-surface-container">Back</button>
                <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl font-bold text-sm bg-primary text-white hover:bg-primary/90 shadow-md flex items-center justify-center gap-2">Continue <ArrowRight size={15} /></button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Hours */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <h3 className="text-lg font-bold text-primary flex items-center gap-2 mb-5">
                <Clock size={21} /> Daily study hours?
              </h3>
              <div className="bg-surface-container rounded-2xl p-5 text-center mb-4">
                <p className="text-5xl font-black text-primary mb-1">{hours}</p>
                <p className="text-sm text-on-surface-variant mb-3">hours / day</p>
                <input type="range" min={1} max={10} value={hours} onChange={e => setHours(Number(e.target.value))} className="w-full accent-primary" />
                <div className="flex justify-between text-xs text-on-surface-variant mt-1"><span>1 hr</span><span>5 hrs</span><span>10 hrs</span></div>
              </div>
              <div className="bg-primary/5 rounded-xl p-3 border border-primary/10 space-y-1 mb-4">
                <p className="text-xs"><span className="font-bold text-primary">Daily target:</span> {hours >= 6 ? 60 : hours >= 4 ? 45 : hours >= 2 ? 30 : 20} questions/day</p>
                <p className="text-xs text-on-surface-variant"><span className="font-bold text-primary">Strategy:</span> {getStrategyTier(daysLeft).label} — {getStrategyTier(daysLeft).topics} topics/subject</p>
                <p className="text-xs text-on-surface-variant"><span className="font-bold text-primary">Zone:</span> {zone || 'Not selected'} · <span className="font-bold text-primary">Category:</span> {cutoff.label}</p>
                <p className="text-xs text-on-surface-variant"><span className="font-bold text-primary">Sub-targets:</span> R:{SUB_TARGETS[category].Reasoning} | M:{SUB_TARGETS[category].Mathematics} | S:{SUB_TARGETS[category]['General Science']} | GA:{SUB_TARGETS[category]['General Awareness']}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl font-bold text-sm text-on-surface-variant border border-surface-container-high hover:bg-surface-container">Back</button>
                <button
                  onClick={() => onComplete({ examDate, level, hoursPerDay: hours, createdAt: new Date().toISOString(), category, zone: zone || 'Not selected' })}
                  className="flex-1 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-primary to-primary-container text-white hover:opacity-90 shadow-lg flex items-center justify-center gap-2">
                  <Sparkles size={14} /> Generate My Roadmap
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── StudyRoadmap (Main) ─────────────────────────────────────────────────────────
export function StudyRoadmap() {
  const allQ = pyqsData as PYQ[];
  const syllabus = useMemo(() => buildSyllabus(allQ), []);

  const [profile, setProfile] = useState<Profile | null>(() => {
    try { return JSON.parse(localStorage.getItem(SK) || 'null'); } catch { return null; }
  });
  const [completions, setCompletions] = useState<Set<number>>(loadCompletions);
  const [activeTab, setActiveTab] = useState<'plan' | 'heatmap' | 'mastery' | 'rules'>('plan');

  React.useEffect(() => { if (profile) localStorage.setItem(SK, JSON.stringify(profile)); }, [profile]);
  React.useEffect(() => { saveCompletions(completions); }, [completions]);

  const plan = useMemo(() => profile ? generatePlan(profile, syllabus) : [], [profile, syllabus]);

  const todayDayNum = useMemo(() => {
    if (!profile) return 1;
    const days = differenceInDays(new Date(), parseISO(profile.createdAt)) + 1;
    return Math.max(1, Math.min(days, plan.length));
  }, [profile, plan]);

  const todayPlan = useMemo(() => plan.find(d => d.dayNumber === todayDayNum) ?? null, [plan, todayDayNum]);

  const toggleDay = useCallback((dayNum: number) => {
    setCompletions(prev => {
      const next = new Set(prev);
      if (next.has(dayNum)) next.delete(dayNum); else next.add(dayNum);
      return next;
    });
  }, []);

  const phases = useMemo(() => {
    const map: Record<number, { label: string; days: DayPlan[] }> = {};
    for (const day of plan) {
      if (!map[day.phase]) map[day.phase] = { label: day.phaseLabel, days: [] };
      map[day.phase].days.push(day);
    }
    return Object.entries(map).map(([num, val]) => ({ phase: parseInt(num), ...val }));
  }, [plan]);

  const overallPct = plan.length > 0 ? Math.round((completions.size / plan.length) * 100) : 0;
  const daysLeft = profile ? differenceInDays(parseISO(profile.examDate), new Date()) : 0;
  const streakDays = useMemo(() => {
    let streak = 0;
    for (let d = todayDayNum; d >= 1; d--) {
      if (completions.has(d)) streak++; else break;
    }
    return streak;
  }, [completions, todayDayNum]);

  const todayTip = TOPPER_STRATEGIES[todayDayNum % TOPPER_STRATEGIES.length];
  const tier = profile ? getStrategyTier(differenceInDays(parseISO(profile.examDate), parseISO(profile.createdAt))) : null;

  if (!profile) {
    return <OnboardingWizard onComplete={p => setProfile(p)} />;
  }

  const cutoff = CATEGORY_CUTOFF[profile.category];

  const TABS = [
    { id: 'plan' as const, label: 'Plan', icon: <CalendarDays size={14} /> },
    { id: 'heatmap' as const, label: 'PYQ Frequency', icon: <BarChart3 size={14} /> },
    { id: 'mastery' as const, label: 'Mastery', icon: <Trophy size={14} /> },
    { id: 'rules' as const, label: 'Topper Rules', icon: <Star size={14} /> },
  ];

  return (
    <div className="space-y-5 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-primary flex items-center gap-2">
            <CalendarDays size={26} /> Top 1% Study Roadmap
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {[
              { label: profile.level, icon: '📘' },
              { label: `${profile.hoursPerDay} hrs/day`, icon: '⏱' },
              { label: cutoff.label, icon: '🎯' },
              { label: profile.zone !== 'Not selected' ? profile.zone : '', icon: '📍' },
              { label: tier?.label ?? '', icon: '' },
            ].filter(t => t.label).map(tag => (
              <span key={tag.label} className="text-xs font-bold text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full">
                {tag.icon} {tag.label}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn('flex items-center gap-3 px-5 py-3 rounded-xl border shadow-sm',
            daysLeft <= 7 ? 'bg-red-50 border-red-200' : daysLeft <= 30 ? 'bg-amber-50 border-amber-200' : 'bg-surface-container-lowest border-surface-container-high'
          )}>
            {daysLeft <= 7 ? <AlertTriangle size={18} className="text-error" /> : <CalendarDays size={18} className="text-primary" />}
            <div>
              <p className={cn('text-2xl font-black', daysLeft <= 7 ? 'text-error' : 'text-primary')}>{daysLeft}</p>
              <p className="text-[10px] font-bold uppercase text-on-surface-variant tracking-wider">Days Left</p>
            </div>
          </div>
          <button
            onClick={() => { if (window.confirm('Reset roadmap? All progress will be lost.')) { localStorage.removeItem(SK); localStorage.removeItem(CK); setProfile(null); setCompletions(new Set()); } }}
            className="p-3 rounded-xl bg-surface-container hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors"
            title="Reset roadmap"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Category + Sub-target bar */}
      <div className="bg-surface-container-lowest rounded-xl p-4 border border-surface-container-high shadow-sm">
        <div className="flex flex-wrap items-center gap-4 mb-3">
          <div>
            <p className="text-xs font-bold text-on-surface-variant mb-0.5">Your Target ({cutoff.label})</p>
            <p className="text-2xl font-black text-primary">{cutoff.safe}<span className="text-sm font-normal text-on-surface-variant">/100</span></p>
          </div>
          <div className="flex-1 max-w-sm">
            <div className="flex items-center justify-between text-[10px] text-on-surface-variant mb-1">
              <span>Min: {cutoff.min}</span><span>Safe: {cutoff.safe}</span><span>Excellent: 80+</span>
            </div>
            <div className="h-3 bg-surface-container-high rounded-full overflow-hidden relative">
              <div className="h-full bg-gradient-to-r from-red-400 via-amber-400 to-emerald-400 rounded-full w-full" />
              <div className="absolute top-0 bottom-0 w-0.5 bg-white" style={{ left: `${cutoff.min}%` }} />
              <div className="absolute top-0 bottom-0 w-0.5 bg-white" style={{ left: `${cutoff.safe}%` }} />
            </div>
          </div>
        </div>
        {/* Sub-targets */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SUBJECT_ORDER.map(s => {
            const t = SUB_TARGETS[profile.category]?.[s.name] ?? 0;
            return (
              <div key={s.name} className={cn('flex items-center gap-2 p-2.5 rounded-lg border', s.light, s.border)}>
                <span className="text-base">{s.icon}</span>
                <div>
                  <p className={cn('text-[10px] font-bold', s.text)}>{s.name.replace('General ', 'G. ')}</p>
                  <p className="text-sm font-black text-on-surface">{t}<span className="text-[10px] font-normal text-on-surface-variant">/{s.marks}</span></p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Overall Progress', value: `${overallPct}%`, icon: <BarChart3 size={14} />, color: 'text-primary' },
          { label: 'Days Done', value: `${completions.size}/${plan.length}`, icon: <CheckCircle2 size={14} />, color: 'text-tertiary' },
          { label: 'Streak', value: `${streakDays} days 🔥`, icon: <Flame size={14} />, color: 'text-amber-600' },
          { label: `Today: Day ${todayDayNum}`, value: todayPlan?.phaseLabel ?? 'Done!', icon: <Star size={14} />, color: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className="bg-surface-container-lowest rounded-xl p-4 border border-surface-container-high shadow-sm">
            <div className={cn('flex items-center gap-1.5 mb-1', s.color)}>
              {s.icon}<p className="text-[10px] font-bold uppercase tracking-wider">{s.label}</p>
            </div>
            <p className={cn('text-xl font-black', s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Overall progress bar */}
      <div className="bg-surface-container-lowest rounded-xl p-4 border border-surface-container-high shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold text-primary">Overall Progress</p>
          <p className="text-sm font-black text-primary">{overallPct}%</p>
        </div>
        <div className="h-3 bg-surface-container-high rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-primary to-tertiary" initial={{ width: 0 }} animate={{ width: `${overallPct}%` }} transition={{ duration: 1 }} />
        </div>
        <p className="text-[10px] text-on-surface-variant mt-2">{plan.length - completions.size} days remaining · {tier?.label} strategy · {tier?.topics} topics/subject</p>
      </div>

      {/* Pre-exam sprint (shows when ≤30 days) */}
      <PreExamSprint daysLeft={daysLeft} />

      {/* Topper tip of the day */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200 flex items-start gap-3">
        <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
          <Lightbulb size={18} className="text-amber-600" />
        </div>
        <div>
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-0.5">Topper Tip of the Day</p>
          <p className="text-sm font-bold text-amber-900">{todayTip.icon} {todayTip.rule}</p>
          <p className="text-[10px] text-amber-700/80 mt-0.5">— {todayTip.src}</p>
        </div>
      </div>

      {/* Today's Plan */}
      <div>
        <h3 className="font-black text-primary flex items-center gap-2 mb-3">
          <Zap size={17} className="text-amber-500" /> Today's Plan — Day {todayDayNum}
        </h3>
        <TodayCard day={todayPlan} isCompleted={todayPlan ? completions.has(todayPlan.dayNumber) : false} onToggle={() => todayPlan && toggleDay(todayPlan.dayNumber)} profile={profile} />
      </div>

      {/* Tab Navigator */}
      <div className="flex gap-1 bg-surface-container rounded-2xl p-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all',
              activeTab === tab.id
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            )}
          >
            {tab.icon} <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">

        {/* Plan Tab */}
        {activeTab === 'plan' && (
          <motion.div key="plan" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-primary flex items-center gap-2"><BookOpen size={17} /> Full Phase Plan</h3>
              <p className="text-xs text-on-surface-variant">{phases.length} phases · {plan.length} days total</p>
            </div>
            {phases.map(({ phase, label, days }) => {
              const prevPhase = phases.find(p => p.phase === phase - 1);
              const prevDone = !prevPhase || prevPhase.days.every(d => completions.has(d.dayNumber));
              const isLocked = phase > 1 && !prevDone && !days.some(d => completions.has(d.dayNumber) || d.dayNumber <= todayDayNum);
              return <PhaseCard key={phase} phaseNum={phase} phaseLabel={label} days={days} completions={completions} todayDayNum={todayDayNum} onToggle={toggleDay} isLocked={isLocked} />;
            })}
          </motion.div>
        )}

        {/* Heatmap Tab */}
        {activeTab === 'heatmap' && (
          <motion.div key="heatmap" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="mb-3 bg-primary/5 rounded-xl p-3 border border-primary/10">
              <p className="text-xs font-bold text-primary mb-0.5">📊 Why PYQ Frequency Matters</p>
              <p className="text-xs text-on-surface-variant">Top 20% high-frequency topics cover 80% of exam paper (Pareto Law). Focus here first for maximum marks with minimum time.</p>
            </div>
            <FrequencyHeatmap syllabus={syllabus} />
          </motion.div>
        )}

        {/* Mastery Tab */}
        {activeTab === 'mastery' && (
          <motion.div key="mastery" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <SubjectMasteryOverview plan={plan} completions={completions} category={profile.category} />
            {/* Subject priority order explanation */}
            <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high p-5">
              <h3 className="font-black text-primary text-sm mb-3 flex items-center gap-2">
                <TrendingUp size={16} /> Why This Subject Order? (Topper Strategy)
              </h3>
              <div className="space-y-2">
                {SUBJECT_ORDER.map((s, i) => (
                  <div key={s.name} className={cn('flex items-start gap-3 p-3 rounded-xl border', s.light, s.border)}>
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm shrink-0 bg-gradient-to-br', s.grad)}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm">{s.icon}</span>
                        <p className={cn('text-sm font-black', s.text)}>{s.name}</p>
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', s.light, s.text, s.border, 'border')}>{s.marks} marks</span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5">{s.why}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Topper Rules Tab */}
        {activeTab === 'rules' && (
          <motion.div key="rules" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="bg-surface-container-lowest rounded-2xl p-6 border border-surface-container-high shadow-sm">
              <h3 className="font-black text-primary flex items-center gap-2 mb-4 text-sm">
                <Trophy size={17} className="text-amber-500" /> Top 10 Rules — SSC CGL, RRB & UPSC Toppers
              </h3>
              <div className="space-y-3">
                {TOPPER_STRATEGIES.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-lg shrink-0">{s.icon}</div>
                    <div>
                      <p className="text-xs font-black text-primary">{s.rule}</p>
                      <p className="text-[10px] text-on-surface-variant leading-relaxed mt-0.5 italic">— {s.src}</p>
                    </div>
                    <span className="text-[10px] font-black text-on-surface-variant shrink-0 w-5 text-center">#{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
