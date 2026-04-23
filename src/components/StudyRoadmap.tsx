import React, { useState, useMemo, useCallback } from 'react';
import {
  CalendarDays, Clock, Target, ChevronDown, ChevronUp, AlertTriangle,
  CheckCircle2, Circle, TrendingUp, Zap, Settings, ArrowRight, Sparkles,
  GraduationCap, BarChart3, Trophy, BookOpen, RotateCcw, Lightbulb,
  Flame, Star, ChevronRight, Lock, MapPin, Users,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format, differenceInDays, addDays, parseISO, isBefore } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import pyqsData from '../data/pyqs.json';
import { TOPIC_META, HEAT_COLORS } from '../data/roadmapData';

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
    why: 'Highest marks (30), fastest to improve with practice — do first',
  },
  {
    name: 'Mathematics', marks: 25, icon: '📐',
    grad: 'from-blue-500 to-indigo-600', light: 'bg-blue-50',
    border: 'border-blue-200', text: 'text-blue-700',
    why: 'Formula-based — learn 1 trick per topic, do second',
  },
  {
    name: 'General Science', marks: 25, icon: '🔬',
    grad: 'from-emerald-500 to-teal-600', light: 'bg-emerald-50',
    border: 'border-emerald-200', text: 'text-emerald-700',
    why: 'NCERT 9-10 facts — direct questions, do third',
  },
  {
    name: 'General Awareness', marks: 20, icon: '🌍',
    grad: 'from-amber-500 to-orange-600', light: 'bg-amber-50',
    border: 'border-amber-200', text: 'text-amber-700',
    why: 'Memory-based — do last so facts are fresh for exam',
  },
];

// RRB Category cutoffs (approximate, based on 2022 data)
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
  { icon: '🎯', rule: 'One subject at a time — complete mastery before moving on', src: 'SSC CGL Rank 1 (Parth Garg) strategy' },
  { icon: '📊', rule: 'Prioritize by PYQ frequency — top 20% topics = 80% paper coverage', src: 'Pareto principle, RRB 2018-2024 data analysis' },
  { icon: '🔁', rule: 'Revise at Day 1, Day 7, Day 30 after learning (Ebbinghaus Forgetting Curve)', src: 'Memory retention science research' },
  { icon: '⏱', rule: '54 seconds max per Q — practice with timer from Day 1', src: 'RRB CBT official pattern: 90 min / 100 Qs' },
  { icon: '🌅', rule: 'Morning = Math/Reasoning (peak concentration). Evening = Science/GA (reading)', src: 'Circadian rhythm research for cognitive tasks' },
  { icon: '📝', rule: 'Weekly mini-mock (30 Qs in 27 min) from Week 2 — even if not all topics done', src: 'UPSC CSE topper Anudeep Durishetty method' },
  { icon: '🚩', rule: 'Flag every confusing Q → practice them Saturday (Weak Areas page)', src: 'Active recall methodology, Barbara Oakley' },
  { icon: '💯', rule: 'Accuracy first (aim 80%+), then build speed — never the other way', src: 'SSC CGL 100+ scorers interview analysis' },
];

/** Strategy tier based on available days */
function getStrategyTier(days: number): { label: string; topics: number; desc: string; color: string } {
  if (days >= 90) return { label: '🟢 Comprehensive', topics: 25, desc: 'All topics, full depth + 3 revision rounds', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  if (days >= 60) return { label: '🔵 Focused', topics: 18, desc: 'Top-18 PYQ topics per subject + 2 revision rounds', color: 'text-blue-700 bg-blue-50 border-blue-200' };
  if (days >= 30) return { label: '🟡 Rapid', topics: 10, desc: 'Top-10 topics only + weekly mocks from Day 1', color: 'text-amber-700 bg-amber-50 border-amber-200' };
  return { label: '🔴 Emergency', topics: 5, desc: 'Top-5 highest-frequency topics + daily mocks', color: 'text-red-700 bg-red-50 border-red-200' };
}

const SK = 'rrb_roadmap_profile';
const CK = 'rrb_day_completions';

// ── Helpers ────────────────────────────────────────────────────────────────────
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

// ── Plan Generator ─────────────────────────────────────────────────────────────
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

  // Budget: 72% study, 13% revision, 15% mock (more mocks = higher score in short time)
  const studyBudget = Math.floor(totalDays * 0.72);
  const revBudget   = Math.floor(totalDays * 0.13);
  const mockBudget  = totalDays - studyBudget - revBudget;

  // Per-subject day allocation weighted by marks × difficulty
  const totalW = SUBJECT_ORDER.reduce((s, sub) => s + sub.marks * (DIFFICULTY[sub.name] || 1), 0);
  const subAlloc = SUBJECT_ORDER.map(sub => ({
    ...sub,
    days: Math.max(2, Math.floor(studyBudget * (sub.marks * (DIFFICULTY[sub.name] || 1)) / totalW)),
  }));

  const plans: DayPlan[] = [];
  let dayNum = 1;

  // ── Phase 1–4: One subject fully, then next ───────────────────────────────
  for (let pi = 0; pi < subAlloc.length; pi++) {
    const sub = subAlloc[pi];
    const subName = sub.name;

    // Pick topics: PYQ-sorted, top N based on strategy tier
    const topics = (syllabus[subName] || []).slice(0, tier.topics);
    const alloted = sub.days;
    const phaseNum = pi + 1;

    let dayInPhase = 0;
    let daysSinceRev = 0;
    let ti = 0;

    // Phase kickoff day
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
        `${subName} = ${sub.marks} marks in RRB Group D — ${sub.why}`,
        `Strategy: ${tier.label} — study top ${tier.topics} PYQ-frequency topics`,
        `Today target: understand scope. Don't worry about getting all correct.`,
      ],
    });
    dayInPhase++;
    daysSinceRev++;

    while (dayInPhase < alloted - 1 && ti < topics.length) {
      const topic = topics[ti];

      // Spaced revision every 7 days within subject
      if (daysSinceRev >= 7 && ti >= 2) {
        const revTopics = topics.slice(Math.max(0, ti - 3), ti).map(t => t.topic).join(' + ');
        plans.push({
          dayNumber: dayNum++,
          subject: subName,
          topic: 'Spaced Revision',
          targetQ: qPerDay,
          instruction: `🔁 Day-7 Revision (Ebbinghaus Rule): Re-solve ${qPerDay} PYQs from: ${revTopics}. Focus only on your wrong/flagged questions. Skip what you already score 90%+.`,
          type: 'revise',
          phase: phaseNum,
          phaseLabel: subName,
          topicFreq: 0,
          tips: [
            'Without revision in 7 days, you forget 70% (Ebbinghaus curve)',
            'Revising at Day 7 restores retention to 90%+',
            'Use Weak Areas 🚩 list to target the right questions',
          ],
        });
        dayInPhase++;
        daysSinceRev = 0;
      }

      if (dayInPhase >= alloted - 1) break;

      // Days for this topic: tier-based
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
            : `⚡ Master "${topic.topic}": Solve ${qTarget} PYQs at exam speed (≤54s each). After each 10: check accuracy. Revisit wrong answers immediately. Target: ≥80%.`,
          type: isFirst ? 'learn' : 'practice',
          phase: phaseNum,
          phaseLabel: subName,
          topicFreq: topic.count,
          tips: [
            `"${topic.topic}" — ${topic.count} PYQs in dataset ${isHighPriority ? '🔥 Very High Priority (40+ PYQs)' : isMedPriority ? '⚡ High Priority (20+ PYQs)' : '✅ Standard'}`,
            ...(TOPIC_META[topic.topic]?.tips?.slice(0, 2) ?? []),
          ],
        });
        dayInPhase++;
        daysSinceRev++;
      }
      ti++;
    }

    // Phase-end mini mock
    plans.push({
      dayNumber: dayNum++,
      subject: subName,
      topic: `${subName} Phase Test`,
      targetQ: 25,
      instruction: `📝 ${subName} Phase Test: 25 Qs in 22 min (timer on, no notes, simulate exam). Analyze every wrong answer by topic. Score target: ${CATEGORY_CUTOFF[profile.category]?.safe ?? 70}%+ to move on confidently.`,
      type: 'mock',
      phase: phaseNum,
      phaseLabel: subName,
      topicFreq: 0,
      milestone: `✅ Phase ${phaseNum} Complete — ${subName} DONE!`,
      tips: [
        '≥80% = Excellent! Move to next subject',
        '60–80% = Good. Note 3 weak topics for revision phase',
        '<60% = Spend 2 more days on your 3 weakest topics before moving',
      ],
    });
  }

  // ── Phase 5: Mixed Revision ───────────────────────────────────────────────
  const revRota = SUBJECT_ORDER.map(s => s.name);
  for (let d = 0; d < revBudget; d++) {
    const subName = revRota[d % revRota.length];
    plans.push({
      dayNumber: dayNum++,
      subject: subName,
      topic: 'Final Revision',
      targetQ: qPerDay,
      instruction: `🔁 Final Revision — ${subName}: ONLY practice your Weak Areas 🚩 flagged questions + topics where accuracy was <70%. Skip strong topics. Simulate exam time.`,
      type: 'revise',
      phase: 5,
      phaseLabel: 'Mixed Revision',
      topicFreq: 0,
      tips: [
        'Skip what you know. Double down on weak spots.',
        'Recommended: 30 min Weak Areas practice + 30 min timed PYQs',
        `Target cutoff: ${CATEGORY_CUTOFF[profile.category]?.safe ?? 70}/100 (${CATEGORY_CUTOFF[profile.category]?.label ?? 'General'})`,
      ],
    });
  }

  // ── Phase 6: Full CBT Mocks ───────────────────────────────────────────────
  for (let d = 0; d < mockBudget; d++) {
    const isLast = d === mockBudget - 1;
    plans.push({
      dayNumber: dayNum++,
      subject: 'All Subjects',
      topic: isLast ? '🏆 EXAM DAY — You Are Ready!' : `Full CBT Mock ${d + 1}`,
      targetQ: isLast ? 0 : 100,
      instruction: isLast
        ? `🏅 Exam Day preparation: Light breakfast, reach 30 min early. Read all 100 Qs in 5 min first pass. Attempt easy ones first. Don't spend >2 min on any single Q. Trust your preparation — YOU ARE READY!`
        : `📝 Full Mock ${d + 1}: 100 Qs / 90 min — no breaks, real exam simulation. Post-mock: calculate accuracy per subject, note top-3 wrong topics. Target: ${CATEGORY_CUTOFF[profile.category]?.safe ?? 70}+/100`,
      type: isLast ? 'buffer' : 'mock',
      phase: 6,
      phaseLabel: 'Full Mocks',
      topicFreq: 0,
      milestone: isLast ? `🎯 ${profile.zone} — All the best in your exam!` : undefined,
      tips: isLast
        ? ['8 hours sleep tonight', 'Documents ready?', 'Hall ticket + ID + pen printed?']
        : [
          `${profile.zone}: Check zone-specific cutoff trends for ${CATEGORY_CUTOFF[profile.category]?.label ?? 'General'}`,
          `Reasoning 22+, Maths 17+, Science 17+, GA 14+ = safe score for ${CATEGORY_CUTOFF[profile.category]?.label ?? 'General'}`,
          'After each mock: 1 hour analysis > 3 hours studying',
        ],
    });
  }

  return plans;
}

// ── Today Card ─────────────────────────────────────────────────────────────────
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

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-2xl overflow-hidden shadow-md border',
        isCompleted ? 'border-tertiary/30 bg-tertiary/5' : (sub?.border ?? 'border-primary/20')
      )}
    >
      <div className={cn('h-1 bg-gradient-to-r', sub?.grad ?? 'from-primary to-primary-container')} />
      <div className="p-6">
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
              {/* Category badge */}
              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', cutoff.color, 'bg-surface-container border-surface-container-high')}>
                🎯 Target: {cutoff.safe}/100 ({cutoff.label})
              </span>
            </div>
            <h3 className="text-xl font-black text-primary mb-1">{day.topic}</h3>
            <p className={cn('text-sm font-medium mb-4', sub?.text ?? 'text-on-surface-variant')}>
              {day.subject}{profile.zone && ` · ${profile.zone}`}
            </p>
            <p className="text-sm text-on-surface leading-relaxed bg-surface-container rounded-xl p-4 mb-4">
              {day.instruction}
            </p>
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
            {day.tips.slice(0, 2).map((tip, i) => (
              <p key={i} className="text-xs text-on-surface-variant flex items-start gap-1.5 mb-0.5">
                <Lightbulb size={10} className="text-amber-500 shrink-0 mt-0.5" />{tip}
              </p>
            ))}
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

// ── Day Row ────────────────────────────────────────────────────────────────────
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

// ── Phase Card ─────────────────────────────────────────────────────────────────
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

// ── Onboarding Wizard ──────────────────────────────────────────────────────────
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
        <h2 className="text-3xl font-black text-primary">Study Roadmap</h2>
        <p className="text-sm text-on-surface-variant mt-1">Personalised day-by-day plan — SSC/RRB/UPSC topper strategy</p>
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
              <p className="text-xs text-on-surface-variant mb-4">Sets your score target throughout the roadmap</p>
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
                <p className="font-black">{cutoff.label} category target: {cutoff.safe}/100</p>
                <p className="text-xs mt-0.5 opacity-80">Min passing: ~{cutoff.min} · Safe score: {cutoff.safe}+</p>
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-primary flex items-center gap-2">
            <CalendarDays size={26} /> Study Roadmap
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {[
              { label: profile.level, icon: '📘' },
              { label: `${profile.hoursPerDay} hrs/day`, icon: '⏱' },
              { label: cutoff.label, icon: '🎯' },
              { label: profile.zone, icon: '📍' },
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

      {/* Category target bar */}
      <div className="bg-surface-container-lowest rounded-xl p-4 border border-surface-container-high shadow-sm flex flex-wrap items-center gap-4">
        <div>
          <p className="text-xs font-bold text-on-surface-variant mb-0.5">Your Target Score ({cutoff.label})</p>
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
        <div className="text-xs text-on-surface-variant">
          <p><span className="font-bold text-red-500">●</span> Min: {cutoff.min}</p>
          <p><span className="font-bold text-emerald-500">●</span> Safe: {cutoff.safe}+</p>
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

      {/* Progress bar */}
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

      {/* Daily topper tip */}
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

      {/* Phase List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-primary flex items-center gap-2"><BookOpen size={17} /> Full Phase Plan</h3>
          <p className="text-xs text-on-surface-variant">{phases.length} phases · {plan.length} days total</p>
        </div>
        <div className="space-y-3">
          {phases.map(({ phase, label, days }) => {
            const prevPhase = phases.find(p => p.phase === phase - 1);
            const prevDone = !prevPhase || prevPhase.days.every(d => completions.has(d.dayNumber));
            const isLocked = phase > 1 && !prevDone && !days.some(d => completions.has(d.dayNumber) || d.dayNumber <= todayDayNum);
            return <PhaseCard key={phase} phaseNum={phase} phaseLabel={label} days={days} completions={completions} todayDayNum={todayDayNum} onToggle={toggleDay} isLocked={isLocked} />;
          })}
        </div>
      </div>

      {/* Topper Strategies */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 border border-surface-container-high shadow-sm">
        <h3 className="font-black text-primary flex items-center gap-2 mb-4">
          <Trophy size={17} className="text-amber-500" /> Top Rules — SSC CGL, RRB, UPSC Toppers
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TOPPER_STRATEGIES.map(s => (
            <div key={s.rule} className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-low">
              <span className="text-xl shrink-0">{s.icon}</span>
              <div>
                <p className="text-xs font-black text-primary">{s.rule}</p>
                <p className="text-[10px] text-on-surface-variant leading-relaxed mt-0.5 italic">— {s.src}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
