import React, { useState, useMemo, useCallback } from 'react';
import {
  CalendarDays, Clock, Target, ChevronDown, ChevronUp, AlertTriangle,
  CheckCircle2, Circle, TrendingUp, Zap, Settings, ArrowRight, Sparkles,
  GraduationCap, BarChart3, Trophy, BookOpen, RotateCcw, Lightbulb,
  Flame, Star, ChevronRight, Lock
} from 'lucide-react';
import { cn } from '../lib/utils';
import {
  format, differenceInDays, addDays, parseISO, isSameDay, isBefore
} from 'date-fns';
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
    border: 'border-purple-200', text: 'text-purple-700', ring: 'text-purple-500',
    desc: 'Pattern recognition & logical thinking — highest marks, fastest to improve',
  },
  {
    name: 'Mathematics', marks: 25, icon: '📐',
    grad: 'from-blue-500 to-indigo-600', light: 'bg-blue-50',
    border: 'border-blue-200', text: 'text-blue-700', ring: 'text-blue-500',
    desc: 'Formula-based — learn tricks, not long methods',
  },
  {
    name: 'General Science', marks: 25, icon: '🔬',
    grad: 'from-emerald-500 to-teal-600', light: 'bg-emerald-50',
    border: 'border-emerald-200', text: 'text-emerald-700', ring: 'text-emerald-500',
    desc: 'NCERT Class 9-10 — facts and direct answers',
  },
  {
    name: 'General Awareness', marks: 20, icon: '🌍',
    grad: 'from-amber-500 to-orange-600', light: 'bg-amber-50',
    border: 'border-amber-200', text: 'text-amber-700', ring: 'text-amber-500',
    desc: 'Static GK — do last, memory-based, 2-3 reads enough',
  },
];

const DIFFICULTY: Record<string, number> = {
  Reasoning: 1.2, Mathematics: 1.3, 'General Science': 0.85, 'General Awareness': 0.7,
};

const TOPPER_TIPS = [
  { tip: 'Complete one subject fully before starting next — no topic hopping', icon: '🎯', src: 'SSC CGL Rank 1 topper strategy' },
  { tip: 'Solve 40+ PYQs per day minimum — RRB repeats 70% patterns', icon: '📊', src: 'RRB 2018-2024 analysis' },
  { tip: 'Revise after 7 days + 30 days — Ebbinghaus Forgetting Curve', icon: '🔁', src: 'Memory science research' },
  { tip: 'Max 54 seconds/question in RRB CBT — time every practice session', icon: '⏱', src: 'RRB official exam pattern' },
  { tip: 'Morning = Maths/Reasoning (hardest). Evening = GA/Science (reading)', icon: '🌅', src: 'Circadian rhythm research' },
  { tip: 'First build accuracy (80%+). Then build speed. Order matters.', icon: '🏗', src: 'SSC topper methodology' },
  { tip: 'Flag confusing questions — revisit in dedicated Weak Areas sessions', icon: '🚩', src: 'UPSC topper note-making method' },
  { tip: '80/20 Rule: Top 20% topics cover 80% of marks — focus there first', icon: '💡', src: 'Pareto principle for exams' },
];

const SK = 'rrb_roadmap_profile';
const CK = 'rrb_day_completions'; // JSON array of completed dayNumbers: [1,3,5,...]

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

// ── Plan Generator — Topper "One Subject at a Time" Strategy ──────────────────
function generatePlan(
  profile: Profile,
  syllabus: Record<string, { topic: string; count: number }[]>
): DayPlan[] {
  const startDate = parseISO(profile.createdAt);
  const examDate = parseISO(profile.examDate);
  const totalDays = Math.max(7, differenceInDays(examDate, startDate));

  const qPerDay = profile.hoursPerDay >= 6 ? 60
    : profile.hoursPerDay >= 4 ? 45
    : profile.hoursPerDay >= 2 ? 30 : 20;

  // 75% study, 12% revision, 13% mock
  const studyBudget = Math.floor(totalDays * 0.75);
  const revBudget = Math.floor(totalDays * 0.12);
  const mockBudget = totalDays - studyBudget - revBudget;

  // Per-subject study day allocation (proportional to marks × difficulty)
  const totalWeight = SUBJECT_ORDER.reduce(
    (s, sub) => s + sub.marks * (DIFFICULTY[sub.name] || 1), 0
  );
  const subDayAlloc = SUBJECT_ORDER.map(sub => ({
    ...sub,
    days: Math.max(3, Math.floor(studyBudget * (sub.marks * (DIFFICULTY[sub.name] || 1)) / totalWeight)),
  }));

  const plans: DayPlan[] = [];
  let dayNum = 1;

  // ── Phase 1–4: One subject completely, then next ──────────────────────────
  for (let pi = 0; pi < subDayAlloc.length; pi++) {
    const sub = subDayAlloc[pi];
    const subName = sub.name;
    const topics = (syllabus[subName] || []).slice(0, 25); // top 25 PYQ-freq topics
    const alloted = sub.days;
    const phaseNum = pi + 1;

    let dayInPhase = 0;
    let daysSinceLastRevision = 0;
    let ti = 0;

    // Day 1 of subject = orientation + baseline
    plans.push({
      dayNumber: dayNum++,
      subject: subName,
      topic: `${subName} Kickoff`,
      targetQ: 15,
      instruction: `🚀 Phase ${phaseNum} Start — ${subName}! Read PYQ frequency list, solve 15 sample PYQs across ALL ${subName} topics to find your current weak areas`,
      type: 'learn',
      phase: phaseNum,
      phaseLabel: subName,
      topicFreq: topics.reduce((s, t) => s + t.count, 0),
      tips: [
        `${subName} = ${sub.marks} marks out of 100 in RRB Group D`,
        `Strategy: Master every topic in this subject before moving to ${SUBJECT_ORDER[pi + 1]?.name ?? 'revision'}`,
        `Topper rule: Track accuracy per topic — never leave a topic at <70% accuracy`,
      ],
    });
    dayInPhase++;
    daysSinceLastRevision++;

    // Topic by topic
    while (dayInPhase < alloted - 1 && ti < topics.length) {
      const topic = topics[ti];

      // Insert spaced revision every 7 days
      if (daysSinceLastRevision >= 7 && ti >= 2) {
        const revTopics = topics.slice(Math.max(0, ti - 3), ti).map(t => t.topic).join(' → ');
        plans.push({
          dayNumber: dayNum++,
          subject: subName,
          topic: 'Spaced Revision',
          targetQ: qPerDay,
          instruction: `🔁 Spaced Revision (7-Day Rule): Re-solve ${qPerDay} PYQs from: ${revTopics}. Focus ONLY on questions you got wrong before`,
          type: 'revise',
          phase: phaseNum,
          phaseLabel: subName,
          topicFreq: 0,
          tips: [
            'Forgetting curve: Without revision, you lose 70% memory in 24 hours',
            'Revising at day 7 boosts retention to 90%+',
            'Flag any still-confusing Q with the 🚩 button',
          ],
        });
        dayInPhase++;
        daysSinceLastRevision = 0;
      }

      if (dayInPhase >= alloted - 1) break;

      // Assign days to this topic based on PYQ count
      const topicDays = topic.count >= 60 ? 3 : topic.count >= 25 ? 2 : 1;

      for (let d = 0; d < topicDays && dayInPhase < alloted - 1; d++) {
        const isFirst = d === 0;
        const qTarget = isFirst
          ? Math.min(topic.count, Math.floor(qPerDay * 0.55))
          : Math.min(topic.count, qPerDay);

        plans.push({
          dayNumber: dayNum++,
          subject: subName,
          topic: topic.topic,
          targetQ: qTarget,
          instruction: isFirst
            ? `📖 Learn "${topic.topic}": Study formula/concept (20 min) → Solve first ${qTarget} PYQs → Note speed tricks → Flag confusing Qs 🚩`
            : `⚡ Master "${topic.topic}": Solve ${qTarget} PYQs at exam speed (54s each) → Review every wrong answer → Target accuracy ≥80%`,
          type: isFirst ? 'learn' : 'practice',
          phase: phaseNum,
          phaseLabel: subName,
          topicFreq: topic.count,
          tips: [
            `"${topic.topic}" appears ${topic.count}× in RRB PYQ database — ${topic.count >= 40 ? '🔥 Very High Priority' : topic.count >= 20 ? '⚡ High Priority' : '✅ Medium Priority'}`,
            ...(TOPIC_META[topic.topic]?.tips?.slice(0, 2) ?? []),
          ],
        });
        dayInPhase++;
        daysSinceLastRevision++;
      }
      ti++;
    }

    // Phase-end mini mock
    plans.push({
      dayNumber: dayNum++,
      subject: subName,
      topic: `${subName} Phase Test`,
      targetQ: 25,
      instruction: `📝 ${subName} Phase Test: Solve 25 Qs in 22 min (exam conditions, no notes). Analyze wrong answers. Only move to next subject if accuracy ≥70%`,
      type: 'mock',
      phase: phaseNum,
      phaseLabel: subName,
      topicFreq: 0,
      milestone: `✅ Phase ${phaseNum} — ${subName} Complete!`,
      tips: [
        '≥80% = Excellent! Move on confidently',
        '60-80% = Good. Note weak spots and revise during mixed revision phase',
        '<60% = Spend 2 more days on weakest 3 topics before moving',
      ],
    });
  }

  // ── Phase 5: Mixed Revision (all subjects rotate) ─────────────────────────
  const revRota = SUBJECT_ORDER.map(s => s.name);
  for (let d = 0; d < revBudget; d++) {
    const subName = revRota[d % revRota.length];
    plans.push({
      dayNumber: dayNum++,
      subject: subName,
      topic: 'Final Revision',
      targetQ: qPerDay,
      instruction: `🔁 Final Revision — ${subName}: Solve ${qPerDay} PYQs from YOUR WEAK AREAS only. Re-do all flagged questions. Any topic <70% accuracy gets extra time`,
      type: 'revise',
      phase: 5,
      phaseLabel: 'Mixed Revision',
      topicFreq: 0,
      tips: [
        'Only revise weak topics — skip what you score 85%+ on',
        'Mix subjects daily in revision phase for exam simulation',
        'Timed revision: 54 sec per question max',
      ],
    });
  }

  // ── Phase 6: Full CBT Mocks ───────────────────────────────────────────────
  for (let d = 0; d < mockBudget; d++) {
    const isLast = d === mockBudget - 1;
    plans.push({
      dayNumber: dayNum++,
      subject: 'All Subjects',
      topic: isLast ? '🏆 EXAM DAY' : `Full CBT Mock ${d + 1}`,
      targetQ: isLast ? 0 : 100,
      instruction: isLast
        ? `🏆 EXAM DAY: Light breakfast, reach early, no new study tonight. Trust your preparation. Read questions carefully. You are READY!`
        : `📝 Full Mock ${d + 1} — 100 Qs in 90 min. Real exam conditions (no breaks, no help). After: analyze each wrong answer topic-wise. Target: 70+ score`,
      type: isLast ? 'buffer' : 'mock',
      phase: 6,
      phaseLabel: 'Full Mocks',
      topicFreq: 0,
      milestone: isLast ? `🎯 YOU ARE EXAM READY!` : undefined,
      tips: isLast
        ? ['Sleep 8 hours', 'Keep documents ready', 'Believe in yourself']
        : [
          'Simulate real exam: no looking back, timed',
          'Target: Reasoning 22+, Maths 17+, Science 17+, GA 14+',
          'After mock: 1 hour analysis = more useful than 3 hours studying',
        ],
    });
  }

  return plans;
}

// ── TodayCard ──────────────────────────────────────────────────────────────────
function TodayCard({
  day, isCompleted, onToggle, profile,
}: {
  day: DayPlan | null;
  isCompleted: boolean;
  onToggle: () => void;
  profile: Profile;
}) {
  if (!day) {
    return (
      <div className="bg-gradient-to-r from-tertiary/10 to-primary/10 rounded-2xl p-6 border border-primary/10">
        <p className="font-bold text-primary">🎉 All study days completed! Rest and revise lightly today.</p>
      </div>
    );
  }
  const sub = SUBJECT_ORDER.find(s => s.name === day.subject);
  const typeColors: Record<string, string> = {
    learn: 'from-blue-500 to-indigo-600',
    practice: 'from-purple-500 to-violet-600',
    revise: 'from-amber-500 to-orange-500',
    mock: 'from-red-500 to-pink-600',
    buffer: 'from-slate-400 to-slate-500',
  };
  const typeLabel: Record<string, string> = {
    learn: '📖 LEARN', practice: '⚡ PRACTICE', revise: '🔁 REVISE',
    mock: '📝 MOCK TEST', buffer: '🛡️ BUFFER',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-2xl overflow-hidden shadow-md border',
        isCompleted ? 'border-tertiary/30 bg-tertiary/5' : sub?.border ?? 'border-primary/20'
      )}
    >
      <div className={cn('bg-gradient-to-r p-1', sub?.grad ?? 'from-primary to-primary-container')} />
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-xl">{sub?.icon ?? '📚'}</span>
              <span className={cn('text-xs font-black px-2.5 py-1 rounded-full text-white bg-gradient-to-r', typeColors[day.type] ?? 'from-primary to-primary-container')}>
                {typeLabel[day.type]}
              </span>
              <span className="text-xs font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                Day {day.dayNumber} · Phase {day.phase}
              </span>
              {day.topicFreq > 0 && (
                <span className={cn(
                  'text-[10px] font-black px-2 py-0.5 rounded-full',
                  day.topicFreq >= 50 ? 'bg-red-100 text-red-700' :
                    day.topicFreq >= 25 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                )}>
                  {day.topicFreq >= 50 ? '🔥' : day.topicFreq >= 25 ? '⚡' : '✅'} {day.topicFreq} PYQs
                </span>
              )}
            </div>
            <h3 className="text-xl font-black text-primary mb-1">{day.topic}</h3>
            <p className={cn('text-sm font-medium mb-4', sub?.text ?? 'text-on-surface-variant')}>{day.subject}</p>
            <p className="text-sm text-on-surface leading-relaxed bg-surface-container rounded-xl p-4 mb-4">
              {day.instruction}
            </p>
            {day.targetQ > 0 && (
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1.5 text-sm font-bold text-primary">
                  <Target size={15} />
                  Target: {day.targetQ} questions
                </div>
                <div className="flex items-center gap-1.5 text-sm text-on-surface-variant">
                  <Clock size={14} />
                  ~{Math.round(day.targetQ * 54 / 60)} min (exam speed)
                </div>
              </div>
            )}
            {day.tips.length > 0 && (
              <div className="space-y-1">
                {day.tips.slice(0, 2).map((tip, i) => (
                  <p key={i} className="text-xs text-on-surface-variant flex items-start gap-1.5">
                    <Lightbulb size={11} className="text-amber-500 shrink-0 mt-0.5" />
                    {tip}
                  </p>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onToggle}
            className={cn(
              'shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-sm',
              isCompleted
                ? 'bg-tertiary text-white shadow-md'
                : 'bg-surface-container-high text-on-surface-variant hover:bg-primary/10 hover:text-primary'
            )}
            title={isCompleted ? 'Mark as incomplete' : 'Mark as done'}
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

// ── DayRow ──────────────────────────────────────────────────────────────────────
function DayRow({
  day, isCompleted, isToday, onToggle,
}: {
  day: DayPlan; isCompleted: boolean; isToday: boolean; onToggle: (n: number) => void;
}) {
  const typeColor: Record<string, string> = {
    learn: 'text-blue-600 bg-blue-50',
    practice: 'text-purple-600 bg-purple-50',
    revise: 'text-amber-600 bg-amber-50',
    mock: 'text-red-600 bg-red-50',
    buffer: 'text-slate-500 bg-slate-50',
  };
  const typeIcon: Record<string, string> = {
    learn: '📖', practice: '⚡', revise: '🔁', mock: '📝', buffer: '🛡️',
  };

  return (
    <div className={cn(
      'flex items-start gap-3 px-4 py-3 rounded-xl transition-all border',
      isToday ? 'border-primary bg-primary/5 shadow-sm' :
        isCompleted ? 'border-tertiary/20 bg-tertiary/5 opacity-80' :
          'border-transparent hover:border-surface-container-high hover:bg-surface-container-low'
    )}>
      <button
        onClick={() => onToggle(day.dayNumber)}
        className="shrink-0 mt-0.5"
      >
        {isCompleted
          ? <CheckCircle2 size={18} className="text-tertiary" />
          : <Circle size={18} className={isToday ? 'text-primary' : 'text-on-surface-variant/40 hover:text-primary'} />
        }
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {isToday && <span className="text-[9px] font-black bg-primary text-white px-2 py-0.5 rounded-full animate-pulse">TODAY</span>}
          <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', typeColor[day.type] ?? 'text-primary bg-primary/10')}>
            {typeIcon[day.type]} {day.type.toUpperCase()}
          </span>
          {day.topicFreq > 0 && (
            <span className="text-[9px] text-on-surface-variant">
              {day.topicFreq} PYQs
            </span>
          )}
        </div>
        <p className={cn('text-sm font-semibold mt-0.5', isCompleted ? 'line-through text-on-surface-variant' : 'text-on-surface')}>
          {day.topic}
        </p>
        <p className="text-[11px] text-on-surface-variant mt-0.5 line-clamp-1">{day.instruction.split(':')[0]}</p>
        {day.milestone && (
          <p className="text-[11px] font-black text-tertiary mt-1">{day.milestone}</p>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className="text-[10px] font-bold text-on-surface-variant">Day {day.dayNumber}</p>
        {day.targetQ > 0 && <p className="text-[9px] text-on-surface-variant">{day.targetQ}Q</p>}
      </div>
    </div>
  );
}

// ── PhaseCard ───────────────────────────────────────────────────────────────────
function PhaseCard({
  phaseNum, phaseLabel, days, completions, todayDayNum, onToggle, isLocked,
}: {
  phaseNum: number; phaseLabel: string; days: DayPlan[];
  completions: Set<number>; todayDayNum: number; onToggle: (n: number) => void; isLocked: boolean;
}) {
  const sub = SUBJECT_ORDER.find(s => s.name === phaseLabel);
  const phaseMeta: Record<number, { icon: string; grad: string; light: string; border: string; text: string }> = {
    5: { icon: '🔁', grad: 'from-amber-500 to-orange-500', light: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
    6: { icon: '📝', grad: 'from-red-500 to-pink-600', light: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
  };
  const meta = sub ?? phaseMeta[phaseNum] ?? {
    icon: '📚', grad: 'from-primary to-primary-container', light: 'bg-surface-container',
    border: 'border-surface-container-high', text: 'text-primary',
  };

  const totalDays = days.length;
  const doneDays = days.filter(d => completions.has(d.dayNumber)).length;
  const pct = totalDays > 0 ? Math.round((doneDays / totalDays) * 100) : 0;
  const isStarted = doneDays > 0;
  const isDone = doneDays === totalDays;
  const hasCurrent = days.some(d => d.dayNumber === todayDayNum);
  const firstDayNum = days[0]?.dayNumber ?? 0;
  const isPast = firstDayNum > 0 && firstDayNum < todayDayNum && !hasCurrent;

  const [expanded, setExpanded] = useState(hasCurrent);

  const phaseIcons: Record<number, string> = { 1: '🧩', 2: '📐', 3: '🔬', 4: '🌍', 5: '🔁', 6: '📝' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: phaseNum * 0.05 }}
      className={cn(
        'rounded-2xl border-2 overflow-hidden',
        hasCurrent ? 'border-primary shadow-md' :
          isDone ? 'border-tertiary/40' :
            isLocked ? 'border-surface-container-high opacity-60' :
              (meta as any).border ?? 'border-surface-container-high'
      )}
    >
      <button
        onClick={() => !isLocked && setExpanded(e => !e)}
        className={cn(
          'w-full flex items-center gap-3 p-4 text-left',
          hasCurrent ? 'bg-primary/5' :
            isDone ? 'bg-tertiary/5' :
              (meta as any).light ?? 'bg-surface-container-lowest'
        )}
      >
        {/* Phase circle */}
        <div className={cn(
          'w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shrink-0 bg-gradient-to-br shadow-sm',
          (meta as any).grad ?? 'from-primary to-primary-container'
        )}>
          {isDone ? '✅' : isLocked ? <Lock size={18} /> : phaseIcons[phaseNum] ?? phaseNum}
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={cn('font-black text-sm', (meta as any).text ?? 'text-primary')}>
              Phase {phaseNum} — {phaseLabel}
            </p>
            {hasCurrent && <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-bold animate-pulse">CURRENT</span>}
            {isDone && <span className="text-[10px] bg-tertiary text-white px-2 py-0.5 rounded-full font-bold">COMPLETE</span>}
            {isLocked && <span className="text-[10px] bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full font-bold">LOCKED</span>}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex-1 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', 
                  isDone ? 'bg-tertiary' : 'bg-gradient-to-r ' + ((meta as any).grad ?? 'from-primary to-primary-container'))}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-on-surface-variant shrink-0">
              {doneDays}/{totalDays} days · {pct}%
            </span>
          </div>
        </div>
        {!isLocked && (expanded ? <ChevronUp size={15} className="text-on-surface-variant shrink-0" /> : <ChevronDown size={15} className="text-on-surface-variant shrink-0" />)}
      </button>

      <AnimatePresence>
        {expanded && !isLocked && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-1.5 bg-surface-container-lowest">
              {days.map(d => (
                <DayRow
                  key={d.dayNumber}
                  day={d}
                  isCompleted={completions.has(d.dayNumber)}
                  isToday={d.dayNumber === todayDayNum}
                  onToggle={onToggle}
                />
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
  const [level, setLevel] = useState<Profile['level']>('beginner');
  const [hours, setHours] = useState(3);
  const today = format(new Date(), 'yyyy-MM-dd');
  const valid = examDate && new Date(examDate) > new Date();
  const daysLeft = examDate ? differenceInDays(new Date(examDate), new Date()) : 0;

  const LEVELS = [
    { id: 'beginner' as const, icon: '🌱', label: 'Beginner', desc: 'Just starting RRB preparation' },
    { id: 'intermediate' as const, icon: '📘', label: 'Intermediate', desc: 'Covered basics, need more practice' },
    { id: 'advanced' as const, icon: '🚀', label: 'Advanced', desc: 'Need revision & full mocks' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto py-8">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-container rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <GraduationCap size={36} className="text-white" />
        </div>
        <h2 className="text-3xl font-black text-primary">Study Roadmap</h2>
        <p className="text-sm text-on-surface-variant mt-1">Personalised day-by-day RRB Group D prep plan</p>
        <p className="text-xs text-primary/70 mt-1 font-bold">SSC/UPSC topper strategy — one subject at a time ✓</p>
      </div>

      <div className="flex justify-center gap-2 mb-6">
        {[0, 1, 2].map(i => (
          <div key={i} className={cn('h-1.5 rounded-full transition-all duration-500', i <= step ? 'w-12 bg-primary' : 'w-6 bg-surface-container-high')} />
        ))}
      </div>

      <div className="bg-surface-container-lowest rounded-2xl p-7 shadow-sm border border-surface-container-high">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <h3 className="text-lg font-bold text-primary flex items-center gap-2 mb-5">
                <CalendarDays size={21} /> When is your RRB Group D exam?
              </h3>
              <input
                type="date" value={examDate} min={today}
                onChange={e => setExamDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-surface-container-high bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              {examDate && (
                <div className="mt-3 bg-primary/5 rounded-xl p-3 border border-primary/10">
                  <p className="text-sm font-bold text-primary">{daysLeft} days to prepare</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Strategy: {daysLeft >= 60 ? '✅ Enough for full preparation' : daysLeft >= 30 ? '⚡ Focused strategy needed' : '🔥 Rapid revision mode'}
                  </p>
                </div>
              )}
              <button
                disabled={!valid}
                onClick={() => setStep(1)}
                className={cn('w-full mt-5 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2', valid ? 'bg-primary text-white hover:bg-primary/90 shadow-md' : 'bg-surface-container text-on-surface-variant cursor-not-allowed')}
              >Continue <ArrowRight size={15} /></button>
            </motion.div>
          )}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <h3 className="text-lg font-bold text-primary flex items-center gap-2 mb-5">
                <Target size={21} /> Your current level?
              </h3>
              <div className="space-y-2">
                {LEVELS.map(l => (
                  <button
                    key={l.id}
                    onClick={() => setLevel(l.id)}
                    className={cn('w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all', level === l.id ? 'border-primary bg-primary/5' : 'border-surface-container-high hover:border-primary/30')}
                  >
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
                <p className="text-xs text-on-surface-variant"><span className="font-bold text-primary">📊 Daily target:</span> {hours >= 6 ? 60 : hours >= 4 ? 45 : hours >= 2 ? 30 : 20} questions/day</p>
                <p className="text-xs text-on-surface-variant"><span className="font-bold text-primary">📅 Total study hours:</span> {Math.round(hours * daysLeft)} hours available</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl font-bold text-sm text-on-surface-variant border border-surface-container-high hover:bg-surface-container">Back</button>
                <button
                  onClick={() => onComplete({ examDate, level, hoursPerDay: hours, createdAt: new Date().toISOString() })}
                  className="flex-1 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-primary to-primary-container text-white hover:opacity-90 shadow-lg flex items-center justify-center gap-2"
                >
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

  // Persist profile
  React.useEffect(() => {
    if (profile) localStorage.setItem(SK, JSON.stringify(profile));
  }, [profile]);

  // Persist completions
  React.useEffect(() => {
    saveCompletions(completions);
  }, [completions]);

  const plan = useMemo(() => profile ? generatePlan(profile, syllabus) : [], [profile, syllabus]);

  // Today's day number (how many days since they set up the plan)
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

  // Group days by phase
  const phases = useMemo(() => {
    const map: Record<number, { label: string; days: DayPlan[] }> = {};
    for (const day of plan) {
      if (!map[day.phase]) map[day.phase] = { label: day.phaseLabel, days: [] };
      map[day.phase].days.push(day);
    }
    return Object.entries(map).map(([num, val]) => ({ phase: parseInt(num), ...val }));
  }, [plan]);

  // Overall stats
  const overallPct = plan.length > 0 ? Math.round((completions.size / plan.length) * 100) : 0;
  const daysLeft = profile ? differenceInDays(parseISO(profile.examDate), new Date()) : 0;
  const streakDays = useMemo(() => {
    let streak = 0;
    for (let d = todayDayNum; d >= 1; d--) {
      if (completions.has(d)) streak++; else break;
    }
    return streak;
  }, [completions, todayDayNum]);

  // Topper tip (rotates daily)
  const todayTip = TOPPER_TIPS[todayDayNum % TOPPER_TIPS.length];

  if (!profile) {
    return <OnboardingWizard onComplete={p => setProfile(p)} />;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-primary flex items-center gap-2">
            <CalendarDays size={26} /> Study Roadmap
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            {profile.level} level · {profile.hoursPerDay} hrs/day · One subject at a time (topper strategy)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex items-center gap-3 px-5 py-3 rounded-xl border shadow-sm',
            daysLeft <= 7 ? 'bg-red-50 border-red-200' : daysLeft <= 30 ? 'bg-amber-50 border-amber-200' : 'bg-surface-container-lowest border-surface-container-high'
          )}>
            {daysLeft <= 7 ? <AlertTriangle size={18} className="text-error" /> : <CalendarDays size={18} className="text-primary" />}
            <div>
              <p className={cn('text-2xl font-black', daysLeft <= 7 ? 'text-error' : 'text-primary')}>{daysLeft}</p>
              <p className="text-[10px] font-bold uppercase text-on-surface-variant tracking-wider">Days Left</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Reset roadmap? All progress will be lost.')) {
                localStorage.removeItem(SK);
                localStorage.removeItem(CK);
                setProfile(null);
                setCompletions(new Set());
              }
            }}
            className="p-3 rounded-xl bg-surface-container hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors"
            title="Reset roadmap"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Overall Progress', value: `${overallPct}%`, icon: <BarChart3 size={16} />, color: 'text-primary' },
          { label: 'Days Done', value: `${completions.size}/${plan.length}`, icon: <CheckCircle2 size={16} />, color: 'text-tertiary' },
          { label: 'Current Streak', value: `${streakDays} days`, icon: <Flame size={16} />, color: 'text-amber-600' },
          { label: `Day ${todayDayNum}`, value: todayPlan?.phaseLabel ?? 'Complete!', icon: <Star size={16} />, color: 'text-purple-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-surface-container-lowest rounded-xl p-4 border border-surface-container-high shadow-sm">
            <div className={cn('flex items-center gap-1.5 mb-1', stat.color)}>
              {stat.icon}
              <p className="text-[10px] font-bold uppercase tracking-wider">{stat.label}</p>
            </div>
            <p className={cn('text-xl font-black', stat.color)}>{stat.value}</p>
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
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-tertiary"
            initial={{ width: 0 }}
            animate={{ width: `${overallPct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <p className="text-[10px] text-on-surface-variant mt-2">
          {plan.length - completions.size} days remaining in the plan
        </p>
      </div>

      {/* Topper Tip of the Day */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200 flex items-start gap-3">
        <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
          <Lightbulb size={18} className="text-amber-600" />
        </div>
        <div>
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-0.5">Today's Topper Tip</p>
          <p className="text-sm font-bold text-amber-900">
            {todayTip.icon} {todayTip.tip}
          </p>
          <p className="text-[10px] text-amber-700/80 mt-0.5">— {todayTip.src}</p>
        </div>
      </div>

      {/* Today's Plan (Prominent) */}
      <div>
        <h3 className="font-black text-primary flex items-center gap-2 mb-3">
          <Zap size={17} className="text-amber-500" /> Today's Plan — Day {todayDayNum}
        </h3>
        <TodayCard
          day={todayPlan}
          isCompleted={todayPlan ? completions.has(todayPlan.dayNumber) : false}
          onToggle={() => todayPlan && toggleDay(todayPlan.dayNumber)}
          profile={profile}
        />
      </div>

      {/* Phase List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-primary flex items-center gap-2">
            <BookOpen size={17} /> Full Phase Plan
          </h3>
          <p className="text-xs text-on-surface-variant">
            {phases.length} phases · {plan.length} days total
          </p>
        </div>
        <div className="space-y-3">
          {phases.map(({ phase, label, days }) => {
            // Phase is locked if ALL days of the previous phase are not started
            // (just the previous phase — don't lock all future ones)
            const prevPhase = phases.find(p => p.phase === phase - 1);
            const prevPhaseDone = !prevPhase || prevPhase.days.every(d => completions.has(d.dayNumber));
            const isLocked = phase > 1 && !prevPhaseDone && !days.some(d => completions.has(d.dayNumber) || d.dayNumber <= todayDayNum);
            return (
              <PhaseCard
                key={phase}
                phaseNum={phase}
                phaseLabel={label}
                days={days}
                completions={completions}
                todayDayNum={todayDayNum}
                onToggle={toggleDay}
                isLocked={isLocked}
              />
            );
          })}
        </div>
      </div>

      {/* Topper Strategy Info */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 border border-surface-container-high shadow-sm">
        <h3 className="font-black text-primary flex items-center gap-2 mb-4">
          <Trophy size={17} className="text-amber-500" /> Why "One Subject at a Time" Works
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { title: 'Deep Focus', desc: 'Brain absorbs one subject deeply vs. shallow coverage of many', icon: '🧠' },
            { title: 'Spaced Repetition', desc: 'Revision days auto-inserted every 7 days within each phase', icon: '🔁' },
            { title: 'PYQ-First Ordering', desc: 'Topics ranked by actual RRB PYQ frequency — highest first', icon: '📊' },
            { title: 'Phase Tests', desc: 'Mini-mock at end of each subject validates mastery before moving on', icon: '✅' },
            { title: '80/20 Rule', desc: 'Top 20% topics appear in 80% of questions — we cover these first', icon: '💡' },
            { title: 'Full Mocks Last', desc: 'Full mocks only after all subjects mastered — maximizes score', icon: '📝' },
          ].map(item => (
            <div key={item.title} className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-low">
              <span className="text-xl shrink-0">{item.icon}</span>
              <div>
                <p className="text-xs font-black text-primary">{item.title}</p>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
