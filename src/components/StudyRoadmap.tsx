/**
 * STUDY ROADMAP  v3 — Best-in-Class RRB Group D Preparation Engine
 * ─────────────────────────────────────────────────────────────────
 * Features:
 *   • Per-user isolated storage (namespaced by email)
 *   • Topic unlocking gates: Solve min PYQs + reach accuracy threshold
 *   • Strict PYQ-frequency ordering (most-asked topics first)
 *   • Per-topic topper laws (SSC CGL / RRB / UPSC specific rules)
 *   • Ebbinghaus revision tracking: Day 1, Day 7, Day 30 reminders
 *   • Minimum 10 topics always shown (even for shortest time window)
 *   • One-button heroic roadmap — see your full journey at a glance
 *   • Cloud sync: reads email from rrb_user → namespaced localStorage key
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy, Lock, CheckCircle, ChevronDown, ChevronUp,
  BookOpen, Target, Zap, Brain, Clock, AlertTriangle,
  Star, ArrowRight, RefreshCw, Award, Flame, Shield,
  BarChart2, Calendar, TrendingUp, Info
} from 'lucide-react';
import pyqsData from '../data/pyqs.json';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TopicProgress {
  conceptRead: boolean;
  pyqsAttempted: number;
  correctAnswers: number;
  unlocked: boolean;          // gates passed → can start next
  completedAt?: string;       // ISO date when gate was first passed
  revisions: string[];        // ISO dates each revision was done
}

interface RoadmapProfile {
  daysLeft: number;
  startDate: string;
  topicProgress: Record<string, TopicProgress>;
}

interface TopicRule {
  minPYQs: number;
  accuracyGate: number;       // % e.g. 70
  conceptHours: number;
  topperTips: string[];
  revisionDays: number[];     // Ebbinghaus curve: [1,7,30]
  subjectColor: string;
}

// ─── User storage helpers ─────────────────────────────────────────────────────

function getCurrentEmailPrefix(): string {
  try {
    const u = JSON.parse(localStorage.getItem('rrb_user') || '{}');
    const email: string = u?.email || '';
    if (!email) return 'u_guest';
    return 'u_' + email.toLowerCase()
      .replace(/[@.]/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .substring(0, 60);
  } catch { return 'u_guest'; }
}

function getRoadmapKey(): string { return `${getCurrentEmailPrefix()}__rrb_roadmap`; }

function loadProfile(): RoadmapProfile | null {
  try {
    const raw = localStorage.getItem(getRoadmapKey());
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveProfile(p: RoadmapProfile): void {
  try { localStorage.setItem(getRoadmapKey(), JSON.stringify(p)); } catch { /* ignore */ }
}

// ─── PYQ frequency analysis ───────────────────────────────────────────────────

interface FreqEntry {
  topic: string;
  subject: string;
  count: number;
}

function buildFrequencyMap(): FreqEntry[] {
  const map: Record<string, { count: number; subject: string }> = {};
  (pyqsData as any[]).forEach((q: any) => {
    const t = q.topic?.trim();
    const s = q.subject?.trim();
    if (!t || !s) return;
    if (!map[t]) map[t] = { count: 0, subject: s };
    map[t].count++;
  });
  return Object.entries(map)
    .map(([topic, v]) => ({ topic, subject: v.subject, count: v.count }))
    .sort((a, b) => b.count - a.count);
}

// ─── Topper rules per topic ───────────────────────────────────────────────────

const SUBJECT_COLORS: Record<string, string> = {
  'Reasoning': '#6366f1',
  'Mathematics': '#0ea5e9',
  'Science': '#10b981',
  'General Awareness': '#f59e0b',
};

const TOPIC_RULES: Record<string, Partial<TopicRule>> = {
  // ── Reasoning ──────────────────────────────────────────────────────────────
  'Coding-Decoding': {
    minPYQs: 40, accuracyGate: 70, conceptHours: 2,
    topperTips: [
      '🏆 SSC CGL Rank 1 (Parth Garg): "Master the common-word substitution method first — it covers 80% of RRB coding questions. Spend 20 min max on any new pattern, then drill 30 PYQs."',
      '⚡ Speed Law: Each Coding-Decoding question should take ≤45 seconds or skip and return.',
      '📐 Rule: If a pattern has +1/−1 shift → alphabetical trick. If random → look for vowel/consonant swap.',
      '🎯 RRB 2022 Topper: "Never guess — find the rule in Example 1, confirm in Example 2, apply to question. 3-step formula, always."',
    ],
  },
  'Analogy': {
    minPYQs: 35, accuracyGate: 70, conceptHours: 1,
    topperTips: [
      '🏆 Topper Advice: "Verbal analogies → identify the relationship first (part:whole, cause:effect, synonyms). Never guess the answer before forming the relationship."',
      '⚡ Number analogy: Check if it\'s +, ×, perfect square, or prime difference. One of these always works.',
      '📐 RRB-specific: 30% of analogy questions are based on GK (states, capitals, currencies). Revise these.',
    ],
  },
  'Classification': {
    minPYQs: 30, accuracyGate: 72, conceptHours: 1,
    topperTips: [
      '🏆 Rule: "Odd one out" — always eliminate by category (profession, shape, number property) not by feel.',
      '⚡ If stuck: check prime/composite, odd/even, perfect square — one always differentiates.',
    ],
  },
  'Series': {
    minPYQs: 40, accuracyGate: 68, conceptHours: 2.5,
    topperTips: [
      '🏆 SSC Strategy: Learn these 8 number series patterns in order: (1) AP (2) GP (3) Squares/Cubes (4) Fibonacci (5) Mixed +n² (6) Prime (7) Alternate (8) Double tier.',
      '⚡ Letter series: Convert A=1, B=2... always. Then treat as number series.',
      '📐 RRB Insight: 60% of series questions in RRB 2018–2022 were AP or Square-based. Master these two first.',
    ],
  },
  'Blood Relations': {
    minPYQs: 25, accuracyGate: 75, conceptHours: 1,
    topperTips: [
      '🏆 Draw a family tree for every question — no exceptions. 2 min drawing saves 5 min confusion.',
      '⚡ Father\'s sister = Paternal Aunt | Mother\'s brother = Maternal Uncle. Learn these 12 standard relations by heart.',
    ],
  },
  'Direction Sense': {
    minPYQs: 20, accuracyGate: 80, conceptHours: 1,
    topperTips: [
      '🏆 Always draw a compass diagram at top-left of your rough sheet before starting any direction question.',
      '⚡ "Towards sun" = East in morning, West in evening. "Shadow falls" = opposite direction of sun.',
    ],
  },
  'Venn Diagrams': {
    minPYQs: 20, accuracyGate: 78, conceptHours: 1,
    topperTips: [
      '🏆 For "some-all-no" type: draw the actual circles. Never solve mentally.',
      '⚡ If asked "which diagram represents A, B, C" — check if any set is a subset first.',
    ],
  },
  'Syllogism': {
    minPYQs: 30, accuracyGate: 72, conceptHours: 1.5,
    topperTips: [
      '🏆 UPSC Topper Method: Use Euler circles for validity. All conclusions must hold for EVERY possible arrangement.',
      '⚡ "Possibility" questions: Try to construct a counter-example. If you can, the conclusion is NOT definite.',
    ],
  },
  'Mathematical Operations': {
    minPYQs: 25, accuracyGate: 80, conceptHours: 1,
    topperTips: [
      '🏆 Pure BODMAS + symbol substitution. Spend exactly 5 hours on this, then move on — ceiling score is easy.',
      '⚡ Strategy: Solve the given example first to decode the symbol meaning, then apply.',
    ],
  },
  'Mirror Image': {
    minPYQs: 20, accuracyGate: 78, conceptHours: 0.5,
    topperTips: [
      '🏆 Rule: Left ↔ Right flips, Top/Bottom stays same. For clock mirror: subtract time from 11:60.',
      '⚡ Practice 20 shapes until it becomes visual instinct — no formula needed after that.',
    ],
  },

  // ── Mathematics ────────────────────────────────────────────────────────────
  'Simplification': {
    minPYQs: 40, accuracyGate: 82, conceptHours: 1,
    topperTips: [
      '🏆 All India Rank 1 Strategy: "Simplification is free marks. BODMAS + fraction cancellation + percentage shortcuts. Target 100% here."',
      '⚡ Learn these: √2=1.414, √3=1.732, √5=2.236. These appear in 1 out of every 3 simplification questions.',
      '📐 Shortcut: a²−b² = (a+b)(a−b). Saves 40% time on algebraic simplification.',
    ],
  },
  'Number System': {
    minPYQs: 35, accuracyGate: 70, conceptHours: 2,
    topperTips: [
      '🏆 Master divisibility rules for 2,3,4,5,6,7,8,9,11 — 30% of questions are pure divisibility.',
      '⚡ LCM×HCF = Product of two numbers. Use this to skip lengthy calculations.',
      '📐 Remainders: Cyclicity method — units digit of 7^n follows cycle 7,9,3,1. Period=4.',
    ],
  },
  'Percentage': {
    minPYQs: 35, accuracyGate: 72, conceptHours: 2,
    topperTips: [
      '🏆 SSC CGL Topper Trick: Memorise fraction↔percentage table (1/8=12.5%, 3/8=37.5%, etc.). Saves 30s per question.',
      '⚡ "X% of Y = Y% of X" — use this to swap to an easier calculation.',
    ],
  },
  'Ratio and Proportion': {
    minPYQs: 30, accuracyGate: 75, conceptHours: 1.5,
    topperTips: [
      '🏆 Partnership problems: Profit sharing = Capital × Time. Write this formula with every problem.',
      '⚡ If ratio A:B = 3:5, and total = 40, then A = (3/8)×40 — proportional share formula.',
    ],
  },
  'Average': {
    minPYQs: 25, accuracyGate: 78, conceptHours: 1,
    topperTips: [
      '🏆 If one value changes by X, average changes by X/n. This trick solves 80% of average questions.',
      '⚡ "Average after adding": New avg = (Old Sum + New Value) / (n+1). Never recalculate from scratch.',
    ],
  },
  'Time and Work': {
    minPYQs: 30, accuracyGate: 70, conceptHours: 2,
    topperTips: [
      '🏆 Use LCM method: Assume total work = LCM(days). Assign efficiency. Add efficiencies for combined work.',
      '⚡ Pipes & Cisterns: Filling pipe = positive efficiency, Leaking pipe = negative. Same formula.',
    ],
  },
  'Speed, Distance and Time': {
    minPYQs: 35, accuracyGate: 70, conceptHours: 2,
    topperTips: [
      '🏆 Relative Speed: Same direction → subtract. Opposite → add. Train crossing: add length of trains.',
      '⚡ Boats & Streams: Upstream = Speed−Current. Downstream = Speed+Current. Avg speed = 2ab/(a+b).',
    ],
  },
  'Profit and Loss': {
    minPYQs: 35, accuracyGate: 72, conceptHours: 1.5,
    topperTips: [
      '🏆 Shortcut: If cost price unknown, assume CP=100. Then SP, profit%, etc. follow easily.',
      '⚡ Successive discount: d₁+d₂ − (d₁×d₂/100). Never add discounts directly.',
    ],
  },
  'Algebra': {
    minPYQs: 30, accuracyGate: 68, conceptHours: 2.5,
    topperTips: [
      '🏆 If x+1/x=k, then x²+1/x²=k²−2 and x³+1/x³=k³−3k. Learn all 6 identity chains.',
      '⚡ For quadratic: if p+q=S, pq=P given, then p²+q²=S²−2P. Use instead of solving.',
    ],
  },
  'Geometry': {
    minPYQs: 30, accuracyGate: 68, conceptHours: 3,
    topperTips: [
      '🏆 RRB focuses on: Triangle properties (60%), Circle theorems (25%), Quadrilaterals (15%). Study in this order.',
      '⚡ Angles in semicircle = 90°. Angle at centre = 2× angle at circumference. Learn all 8 circle theorems.',
    ],
  },
  'Mensuration': {
    minPYQs: 35, accuracyGate: 70, conceptHours: 2,
    topperTips: [
      '🏆 All formulas must be on a single A4 sheet and memorised before attempting any question.',
      '⚡ Cylinder confusion: Lateral SA = 2πrh, Total SA = 2πr(r+h). Write this distinction on your formula sheet.',
    ],
  },
  'Trigonometry': {
    minPYQs: 30, accuracyGate: 65, conceptHours: 2.5,
    topperTips: [
      '🏆 RRB pattern: 70% of trig questions are based on standard angles (0°,30°,45°,60°,90°). Memorise all 6 ratios × 5 angles = 30 values.',
      '⚡ Always check: sin²θ + cos²θ = 1 first. This eliminates half the options usually.',
    ],
  },
  'Data Interpretation': {
    minPYQs: 25, accuracyGate: 72, conceptHours: 1.5,
    topperTips: [
      '🏆 Skim the graph/table for 60 seconds before reading questions. Get the units, scale, and context.',
      '⚡ Approximate boldly: round to nearest 5 or 10 — options are usually far apart enough.',
    ],
  },

  // ── Science ────────────────────────────────────────────────────────────────
  'Laws of Motion': {
    minPYQs: 20, accuracyGate: 75, conceptHours: 1.5,
    topperTips: [
      '🏆 Newton\'s 3 laws + application in everyday life. RRB loves: "rocket propelling = Newton 3rd law."',
      '⚡ Friction questions: Static > Kinetic. Ball bearing reduces friction. Remember which type for which use.',
    ],
  },
  'Electricity': {
    minPYQs: 25, accuracyGate: 72, conceptHours: 2,
    topperTips: [
      '🏆 Ohm\'s Law + V=IR + Power formulas. Series: R adds. Parallel: 1/R adds.',
      '⚡ RRB 2022 favourite: "Why do we use parallel circuit in homes?" Ans: Each appliance gets full voltage.',
    ],
  },
  'Chemical Reactions': {
    minPYQs: 20, accuracyGate: 75, conceptHours: 1.5,
    topperTips: [
      '🏆 Memorise reaction types: Combination, Decomposition, Displacement, Double Displacement, Redox.',
      '⚡ Rusting = oxidation. Burning = combustion. Both are redox reactions.',
    ],
  },
  'Life Processes': {
    minPYQs: 20, accuracyGate: 75, conceptHours: 2,
    topperTips: [
      '🏆 Nutrition, Respiration, Transportation, Excretion — each with plant+human version. 4 topics × 2 = 8 units.',
      '⚡ Photosynthesis equation: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂. Memorise in first week, never forget.',
    ],
  },
  'Periodic Table': {
    minPYQs: 20, accuracyGate: 78, conceptHours: 1.5,
    topperTips: [
      '🏆 Top 20 elements: symbol, atomic number, valency. Plus Noble gases and their properties.',
      '⚡ Trends: Left→Right: atomic radius ↓, ionization energy ↑. Top→Bottom: atomic radius ↑.',
    ],
  },
  'Acids, Bases and Salts': {
    minPYQs: 20, accuracyGate: 78, conceptHours: 1.5,
    topperTips: [
      '🏆 pH scale: <7=acid, 7=neutral, >7=base. Indicators: Litmus (red=acid,blue=base), Phenolphthalein.',
      '⚡ Baking soda = NaHCO₃ (weak base). Washing soda = Na₂CO₃. Plaster of Paris = CaSO₄·½H₂O.',
    ],
  },
  'Light': {
    minPYQs: 20, accuracyGate: 75, conceptHours: 1.5,
    topperTips: [
      '🏆 Concave mirror: focus in front. Convex mirror: focus behind. Sign convention is key.',
      '⚡ Lens formula: 1/f = 1/v − 1/u. Convex lens = converging = positive focal length.',
    ],
  },

  // ── General Awareness ──────────────────────────────────────────────────────
  'Indian History': {
    minPYQs: 25, accuracyGate: 70, conceptHours: 3,
    topperTips: [
      '🏆 RRB focuses on: Freedom movement (40%), Medieval India (30%), Ancient India (20%), Culture (10%).',
      '⚡ For freedom movement: timeline anchor — 1857, 1885, 1905, 1919, 1920, 1930, 1942, 1947. Learn events attached to each year.',
    ],
  },
  'Indian Polity': {
    minPYQs: 20, accuracyGate: 72, conceptHours: 2,
    topperTips: [
      '🏆 Parliament structure, Fundamental Rights (Articles 12–35), DPSPs, Emergency provisions.',
      '⚡ Preamble: "Sovereign, Socialist, Secular, Democratic, Republic." Added "Socialist Secular" in 1976.',
    ],
  },
  'Geography': {
    minPYQs: 25, accuracyGate: 72, conceptHours: 2,
    topperTips: [
      '🏆 Focus: Indian physical geography (rivers, mountains, plains), climate, soils, and natural resources.',
      '⚡ Rivers: Longest=Ganga. Westward-flowing=Narmada,Tapi. Himalayan rivers=perennial. Peninsular=seasonal.',
    ],
  },
  'Indian Economy': {
    minPYQs: 20, accuracyGate: 70, conceptHours: 1.5,
    topperTips: [
      '🏆 Focus on: 5-year plans, Green/White Revolution, important economic organizations (RBI, SEBI, NABARD).',
      '⚡ Current affairs: Union Budget highlights, GDP ranking, Government schemes (PMAY, MNREGA, etc.).',
    ],
  },
  'Science & Technology': {
    minPYQs: 20, accuracyGate: 75, conceptHours: 1.5,
    topperTips: [
      '🏆 ISRO missions, recent satellites, important inventions and their inventors.',
      '⚡ RRB favourites: Who invented X? (telephone=Bell, radio=Marconi). Also: important awards and their fields.',
    ],
  },
};

// Default rule for topics not in the above map
function getTopicRule(topic: string, subject: string): TopicRule {
  const custom = TOPIC_RULES[topic] || {};
  const color = SUBJECT_COLORS[subject] || '#6366f1';
  return {
    minPYQs: custom.minPYQs ?? 20,
    accuracyGate: custom.accuracyGate ?? 70,
    conceptHours: custom.conceptHours ?? 1,
    topperTips: custom.topperTips ?? [
      `🏆 Study this topic systematically. Read the concept, then immediately try 10 PYQs before continuing.`,
      `⚡ When you finish, target ${custom.accuracyGate ?? 70}% accuracy to move forward.`,
    ],
    revisionDays: [1, 7, 30],
    subjectColor: color,
  };
}

// ─── Revision due logic ───────────────────────────────────────────────────────

function daysDiff(from: string, to: string = new Date().toISOString()): number {
  return Math.floor((new Date(to).getTime() - new Date(from).getTime()) / 86400000);
}

function getRevisionStatus(progress: TopicProgress): {
  due: boolean; overdue: boolean; nextRevisionDay: number | null; label: string;
} {
  if (!progress.completedAt) return { due: false, overdue: false, nextRevisionDay: null, label: '' };
  const daysSinceCompletion = daysDiff(progress.completedAt);
  const revisionDays = [1, 7, 30];
  const done = progress.revisions.length;
  const nextDay = revisionDays[done];
  if (nextDay === undefined) return { due: false, overdue: false, nextRevisionDay: null, label: '✅ All revisions done' };
  const due = daysSinceCompletion >= nextDay - 1;
  const overdue = daysSinceCompletion >= nextDay + 2;
  return {
    due,
    overdue,
    nextRevisionDay: nextDay,
    label: overdue
      ? `⚠️ OVERDUE — Day ${nextDay} revision missed!`
      : due
        ? `🔔 Revise Now — Day ${nextDay} is today`
        : `Next revision: Day ${nextDay} (in ${nextDay - daysSinceCompletion} days)`,
  };
}

// ─── Build sorted roadmap topics ──────────────────────────────────────────────

function buildRoadmapTopics(daysLeft: number): FreqEntry[] {
  const freq = buildFrequencyMap();
  // Keep only topics that have >3 PYQs
  const eligible = freq.filter(f => f.count > 3);
  // Minimum 10 topics always
  const minTopics = 10;
  // For longer time windows, include more
  let maxTopics = minTopics;
  if (daysLeft >= 90) maxTopics = Math.min(eligible.length, 40);
  else if (daysLeft >= 60) maxTopics = Math.min(eligible.length, 30);
  else if (daysLeft >= 30) maxTopics = Math.min(eligible.length, 20);
  else if (daysLeft >= 14) maxTopics = Math.min(eligible.length, 15);
  else maxTopics = Math.min(eligible.length, 10);
  // Always at least minTopics
  return eligible.slice(0, Math.max(minTopics, maxTopics));
}

// ─── Gate check ───────────────────────────────────────────────────────────────

function isGatePassed(progress: TopicProgress, rule: TopicRule): boolean {
  if (!progress.conceptRead) return false;
  if (progress.pyqsAttempted < rule.minPYQs) return false;
  const acc = progress.pyqsAttempted > 0
    ? Math.round((progress.correctAnswers / progress.pyqsAttempted) * 100) : 0;
  return acc >= rule.accuracyGate;
}

function getAccuracy(progress: TopicProgress): number {
  if (progress.pyqsAttempted === 0) return 0;
  return Math.round((progress.correctAnswers / progress.pyqsAttempted) * 100);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SubjectBadge({ subject }: { subject: string }) {
  const colors: Record<string, string> = {
    'Reasoning': 'bg-indigo-100 text-indigo-800',
    'Mathematics': 'bg-sky-100 text-sky-800',
    'Science': 'bg-emerald-100 text-emerald-800',
    'General Awareness': 'bg-amber-100 text-amber-800',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors[subject] ?? 'bg-slate-100 text-slate-600'}`}>
      {subject}
    </span>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

interface TopicCardProps {
  entry: FreqEntry;
  index: number;
  progress: TopicProgress;
  prevUnlocked: boolean; // previous topic was completed
  onUpdate: (update: Partial<TopicProgress>) => void;
}

function TopicCard({ entry, index, progress, prevUnlocked, onUpdate }: TopicCardProps) {
  const [expanded, setExpanded] = useState(false);
  const rule = getTopicRule(entry.topic, entry.subject);
  const acc = getAccuracy(progress);
  const gatePassed = isGatePassed(progress, rule);
  const canStart = index === 0 || prevUnlocked;
  const isLocked = !canStart && !gatePassed;
  const revStatus = getRevisionStatus(progress);

  const handleConceptRead = () => {
    if (isLocked) return;
    onUpdate({ conceptRead: true });
  };

  const handleMarkRevision = () => {
    if (!progress.completedAt) return;
    onUpdate({ revisions: [...progress.revisions, new Date().toISOString()] });
  };

  // Auto-unlock: when gate passes, set completedAt
  useEffect(() => {
    if (gatePassed && !progress.completedAt) {
      onUpdate({ completedAt: new Date().toISOString(), unlocked: true });
    }
  }, [gatePassed, progress.completedAt]);

  const borderColor = gatePassed
    ? '#10b981'
    : isLocked
      ? '#e2e8f0'
      : rule.subjectColor;

  return (
    <div
      className={`rounded-2xl border-2 overflow-hidden transition-all duration-300 ${
        isLocked ? 'opacity-60' : 'shadow-sm hover:shadow-md'
      }`}
      style={{ borderColor }}
    >
      {/* ── Header ───────────────────────────────────────────── */}
      <div
        className={`px-5 py-4 flex items-center gap-3 cursor-pointer select-none ${
          isLocked ? 'bg-slate-50' : 'bg-white'
        }`}
        onClick={() => !isLocked && setExpanded(e => !e)}
      >
        {/* Rank badge */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0"
          style={{ background: isLocked ? '#94a3b8' : gatePassed ? '#10b981' : rule.subjectColor }}
        >
          {gatePassed ? <CheckCircle size={18} /> : isLocked ? <Lock size={16} /> : index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-slate-800 text-sm">{entry.topic}</p>
            <SubjectBadge subject={entry.subject} />
            {revStatus.due && !gatePassed && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 animate-pulse">
                {revStatus.overdue ? '⚠️ OVERDUE' : '🔔 REVISE'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[11px] text-slate-400">{entry.count} PYQs in exams</span>
            <span className="text-[11px] text-slate-400">•</span>
            <span className="text-[11px] text-slate-400">
              {progress.pyqsAttempted}/{rule.minPYQs} attempted
            </span>
            {progress.pyqsAttempted > 0 && (
              <>
                <span className="text-[11px] text-slate-400">•</span>
                <span className={`text-[11px] font-bold ${acc >= rule.accuracyGate ? 'text-emerald-600' : 'text-red-500'}`}>
                  {acc}% acc
                </span>
              </>
            )}
          </div>
          {/* Progress bars */}
          {!isLocked && (
            <div className="mt-2 space-y-1">
              <ProgressBar value={progress.pyqsAttempted} max={rule.minPYQs} color={rule.subjectColor} />
            </div>
          )}
        </div>

        {!isLocked && (
          <div className="flex-shrink-0">
            {expanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
          </div>
        )}
      </div>

      {/* ── Expanded panel ───────────────────────────────────── */}
      {expanded && !isLocked && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4 space-y-5">

          {/* Gate requirements */}
          <div>
            <p className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Target size={13} /> Completion Gate
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Gate 1: Concept */}
              <div className={`rounded-xl p-3 border text-center ${progress.conceptRead ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
                <div className="text-lg mb-1">{progress.conceptRead ? '✅' : '📖'}</div>
                <p className="text-[11px] font-bold text-slate-700">Read Concept</p>
                <p className="text-[10px] text-slate-500">{rule.conceptHours}h recommended</p>
                {!progress.conceptRead && (
                  <button
                    onClick={handleConceptRead}
                    className="mt-1.5 text-[10px] font-bold px-2 py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
                  >
                    Mark Done
                  </button>
                )}
              </div>
              {/* Gate 2: PYQs */}
              <div className={`rounded-xl p-3 border text-center ${progress.pyqsAttempted >= rule.minPYQs ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
                <div className="text-lg mb-1">{progress.pyqsAttempted >= rule.minPYQs ? '✅' : '📝'}</div>
                <p className="text-[11px] font-bold text-slate-700">Solve PYQs</p>
                <p className="text-[10px] text-slate-500">{progress.pyqsAttempted}/{rule.minPYQs} done</p>
                <div className="mt-1.5">
                  <ProgressBar value={progress.pyqsAttempted} max={rule.minPYQs} color={rule.subjectColor} />
                </div>
              </div>
              {/* Gate 3: Accuracy */}
              <div className={`rounded-xl p-3 border text-center ${acc >= rule.accuracyGate && progress.pyqsAttempted > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
                <div className="text-lg mb-1">{acc >= rule.accuracyGate && progress.pyqsAttempted > 0 ? '✅' : '🎯'}</div>
                <p className="text-[11px] font-bold text-slate-700">Accuracy Gate</p>
                <p className={`text-[10px] font-bold ${acc >= rule.accuracyGate && progress.pyqsAttempted > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {acc}% / {rule.accuracyGate}% needed
                </p>
              </div>
            </div>
          </div>

          {/* Manual PYQ & accuracy entry */}
          {!gatePassed && (
            <div>
              <p className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BarChart2 size={13} /> Update Progress
              </p>
              <div className="flex gap-2 flex-wrap">
                <input
                  type="number"
                  min={0}
                  placeholder="PYQs attempted"
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  defaultValue={progress.pyqsAttempted || ''}
                  onBlur={e => {
                    const v = parseInt(e.target.value);
                    if (!isNaN(v) && v >= 0) onUpdate({ pyqsAttempted: v });
                  }}
                />
                <input
                  type="number"
                  min={0}
                  placeholder="Correct answers"
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  defaultValue={progress.correctAnswers || ''}
                  onBlur={e => {
                    const v = parseInt(e.target.value);
                    if (!isNaN(v) && v >= 0) onUpdate({ correctAnswers: v });
                  }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Enter your totals from Practice Engine or Mock Tests</p>
            </div>
          )}

          {/* Topper laws */}
          <div>
            <p className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Star size={13} style={{ color: rule.subjectColor }} /> Topper Laws & Strategy
            </p>
            <div className="space-y-2">
              {rule.topperTips.map((tip, i) => (
                <div key={i} className="bg-white rounded-xl p-3 border border-slate-200 text-[12px] text-slate-700 leading-relaxed">
                  {tip}
                </div>
              ))}
            </div>
          </div>

          {/* Revision tracker */}
          <div>
            <p className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <RefreshCw size={13} className="text-blue-500" /> Ebbinghaus Revision Law
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-[11px] text-blue-800 font-medium mb-2">
                Human brain forgets 70% within 24 hours without revision. Follow this schedule:
              </p>
              <div className="flex gap-2 flex-wrap">
                {[1, 7, 30].map((day, i) => {
                  const done = progress.revisions.length > i;
                  return (
                    <div key={day} className={`rounded-lg px-3 py-1.5 text-[11px] font-bold flex items-center gap-1 ${done ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-slate-500 border border-slate-200'}`}>
                      {done ? <CheckCircle size={12} /> : <Clock size={12} />}
                      Day {day}
                    </div>
                  );
                })}
              </div>
              {revStatus.due && (
                <div className={`mt-3 rounded-xl p-2 text-[11px] font-bold flex items-center gap-2 ${revStatus.overdue ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-800'}`}>
                  {revStatus.overdue ? <AlertTriangle size={13} /> : <RefreshCw size={13} />}
                  {revStatus.label}
                  <button
                    onClick={handleMarkRevision}
                    className="ml-auto bg-white rounded-lg px-2 py-1 text-[10px] border font-bold hover:bg-slate-50 transition"
                  >
                    Mark Revised ✓
                  </button>
                </div>
              )}
              {!revStatus.due && revStatus.label && (
                <p className="text-[10px] text-slate-500 mt-2">{revStatus.label}</p>
              )}
            </div>
          </div>

          {/* Gate passed celebration */}
          {gatePassed && (
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-4 text-white text-center">
              <div className="text-2xl mb-1">🏆</div>
              <p className="font-black text-sm">Topic Mastered!</p>
              <p className="text-[11px] text-white/80 mt-0.5">
                Gate passed on {progress.completedAt ? new Date(progress.completedAt).toLocaleDateString('en-IN') : '—'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Setup screen ─────────────────────────────────────────────────────────────

function SetupScreen({ onSetup }: { onSetup: (days: number) => void }) {
  const [days, setDays] = useState(60);

  const presets = [
    { label: '⚡ Emergency', days: 7, desc: 'Top 10 most-asked topics only' },
    { label: '🎯 Sprint', days: 14, desc: '15 high-frequency topics' },
    { label: '📚 Standard', days: 30, desc: '20 topics with full strategy' },
    { label: '🏆 Master', days: 60, desc: '30 topics — topper pace' },
    { label: '💎 Champion', days: 90, desc: 'All 40 top topics — no excuses' },
  ];

  return (
    <div className="max-w-xl mx-auto p-6">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
          <Trophy size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">Your Personalized Roadmap</h1>
        <p className="text-slate-500 text-sm">
          Built on PYQ frequency data from 4,295+ real exam questions. Ordered by topic importance.
        </p>
      </div>

      {/* Legend — topper strategies */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-5 mb-6">
        <p className="font-black text-indigo-900 text-sm mb-3 flex items-center gap-2">
          <Award size={15} /> How This Roadmap Works
        </p>
        <div className="space-y-2 text-[12px] text-indigo-800">
          <p>📊 <strong>Topics ordered by PYQ frequency</strong> — most-asked topics come first</p>
          <p>🔒 <strong>Topic gates</strong> — each topic unlocks only after you solve minimum PYQs + hit accuracy target</p>
          <p>🔔 <strong>Ebbinghaus revision</strong> — you'll be reminded to revise on Day 1, 7, and 30</p>
          <p>🏆 <strong>Topper laws per topic</strong> — specific SSC CGL & RRB topper strategies for every topic</p>
          <p>⚡ <strong>Minimum 10 topics</strong> — even in emergency mode, you'll cover the top 10 highest-yield topics</p>
        </div>
      </div>

      {/* Time presets */}
      <p className="font-black text-slate-800 text-sm mb-3">How many days until your exam?</p>
      <div className="grid grid-cols-1 gap-2 mb-4">
        {presets.map(p => (
          <button
            key={p.days}
            onClick={() => setDays(p.days)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
              days === p.days
                ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300'
            }`}
          >
            <span>{p.label}</span>
            <span className="text-[11px] font-medium text-slate-400">{p.days} days — {p.desc}</span>
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3 mb-6">
        <span className="text-sm text-slate-500">Custom:</span>
        <input
          type="number"
          min={1} max={365}
          value={days}
          onChange={e => setDays(Math.max(1, parseInt(e.target.value) || 1))}
          className="border-2 border-slate-200 rounded-xl px-3 py-2 text-sm w-24 font-bold focus:outline-none focus:border-indigo-500"
        />
        <span className="text-sm text-slate-500">days</span>
      </div>

      <button
        onClick={() => onSetup(days)}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black py-4 rounded-2xl text-sm shadow-lg shadow-indigo-200 hover:from-indigo-700 hover:to-purple-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
      >
        <Zap size={18} /> Generate My Roadmap
      </button>
    </div>
  );
}

// ─── Main Roadmap component ───────────────────────────────────────────────────

export function StudyRoadmap() {
  const [profile, setProfile] = useState<RoadmapProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('All');
  const [showOnlyDue, setShowOnlyDue] = useState(false);

  // Load profile on mount (namespaced per user)
  useEffect(() => {
    setLoading(true);
    const p = loadProfile();
    setProfile(p);
    setLoading(false);
  }, []);

  const handleSetup = (days: number) => {
    const p: RoadmapProfile = {
      daysLeft: days,
      startDate: new Date().toISOString(),
      topicProgress: {},
    };
    saveProfile(p);
    setProfile(p);
  };

  const handleReset = () => {
    if (!window.confirm('Reset entire roadmap? Your progress will be cleared.')) return;
    localStorage.removeItem(getRoadmapKey());
    setProfile(null);
  };

  const topics = useMemo(() => {
    if (!profile) return [];
    return buildRoadmapTopics(profile.daysLeft);
  }, [profile?.daysLeft]);

  const getTopicProgress = (topic: string): TopicProgress => {
    return profile?.topicProgress?.[topic] ?? {
      conceptRead: false, pyqsAttempted: 0, correctAnswers: 0,
      unlocked: false, revisions: [],
    };
  };

  const updateTopicProgress = (topic: string, update: Partial<TopicProgress>) => {
    setProfile(prev => {
      if (!prev) return prev;
      const existing = prev.topicProgress?.[topic] ?? {
        conceptRead: false, pyqsAttempted: 0, correctAnswers: 0,
        unlocked: false, revisions: [],
      };
      const updated = { ...existing, ...update };
      const newProfile = {
        ...prev,
        topicProgress: { ...prev.topicProgress, [topic]: updated },
      };
      saveProfile(newProfile);
      return newProfile;
    });
  };

  // Stats
  const stats = useMemo(() => {
    if (!profile || topics.length === 0) return null;
    const completed = topics.filter(t => isGatePassed(getTopicProgress(t.topic), getTopicRule(t.topic, t.subject))).length;
    const dueRevisions = topics.filter(t => getRevisionStatus(getTopicProgress(t.topic)).due).length;
    const totalPYQs = topics.reduce((s, t) => s + (getTopicProgress(t.topic).pyqsAttempted || 0), 0);
    const daysPassed = profile.startDate ? daysDiff(profile.startDate) : 0;
    return { completed, total: topics.length, dueRevisions, totalPYQs, daysPassed };
  }, [profile, topics]);

  const subjects = useMemo(() => {
    const s = new Set(topics.map(t => t.subject));
    return ['All', ...Array.from(s)];
  }, [topics]);

  const filteredTopics = useMemo(() => {
    let t = topics;
    if (filter !== 'All') t = t.filter(e => e.subject === filter);
    if (showOnlyDue) t = t.filter(e => getRevisionStatus(getTopicProgress(e.topic)).due);
    return t;
  }, [topics, filter, showOnlyDue, profile]);

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return <SetupScreen onSetup={handleSetup} />;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

      {/* ── Hero header ─────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 rounded-2xl p-6 text-white shadow-xl shadow-indigo-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={20} className="text-yellow-300" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-white/60">Study Roadmap</span>
            </div>
            <h1 className="text-xl font-black mb-1">
              {stats?.completed === stats?.total && stats?.total !== 0
                ? '🎉 All Topics Mastered!'
                : `${stats?.completed ?? 0} / ${stats?.total ?? 0} Topics Mastered`}
            </h1>
            <p className="text-white/70 text-[12px]">
              Started {stats?.daysPassed ?? 0} days ago • {profile.daysLeft} day window • {stats?.totalPYQs ?? 0} PYQs attempted total
            </p>
          </div>
          <button
            onClick={handleReset}
            className="text-white/40 hover:text-white/80 transition text-[11px] flex-shrink-0"
          >
            Reset
          </button>
        </div>

        {/* Overall progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-[11px] text-white/60 mb-1">
            <span>Overall Progress</span>
            <span>{stats ? Math.round((stats.completed / stats.total) * 100) : 0}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="h-full rounded-full bg-yellow-400 transition-all duration-700"
              style={{ width: `${stats ? (stats.completed / stats.total) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { icon: CheckCircle, label: 'Done', value: stats?.completed ?? 0, unit: 'topics' },
            { icon: RefreshCw, label: 'Revisions Due', value: stats?.dueRevisions ?? 0, unit: 'topics', alert: (stats?.dueRevisions ?? 0) > 0 },
            { icon: BookOpen, label: 'PYQs Done', value: stats?.totalPYQs ?? 0, unit: 'total' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl p-2 text-center ${s.alert ? 'bg-red-500/30 animate-pulse' : 'bg-white/10'}`}>
              <s.icon size={14} className="mx-auto mb-0.5 text-white/70" />
              <p className="text-base font-black">{s.value}</p>
              <p className="text-[9px] text-white/60">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Rules banner ────────────────────────────────────── */}
      <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5">
        <p className="font-black text-amber-900 text-sm mb-3 flex items-center gap-2">
          <Shield size={15} /> The Laws of This Roadmap
        </p>
        <div className="space-y-1.5 text-[12px] text-amber-800">
          <p>⚖️ <strong>Law 1 — Gate Before Move:</strong> You may NOT move to the next topic until concept is read + min PYQs solved + accuracy gate passed.</p>
          <p>📖 <strong>Law 2 — Concept First:</strong> Read the concept (max {'=>'} 2 hours). Then immediately solve PYQs. Do not re-read endlessly.</p>
          <p>🎯 <strong>Law 3 — Accuracy Gate:</strong> Each topic has a custom accuracy threshold (65%–82%). If below threshold → extra practice, not next topic.</p>
          <p>🔔 <strong>Law 4 — Ebbinghaus:</strong> Revise every mastered topic on Day 1, Day 7, Day 30. Miss a revision = forget 70% of the topic.</p>
          <p>🏆 <strong>Law 5 — Topper Rule:</strong> Follow the per-topic topper strategy exactly. It's based on SSC CGL Rank 1 and RRB Group D 2022 selection strategies.</p>
          <p>⚡ <strong>Law 6 — PYQ Frequency:</strong> Topics are ordered by how often they appear in real exams. Do not skip the top-ranked topics for low-frequency ones.</p>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="flex gap-1 flex-wrap">
          {subjects.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                filter === s
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowOnlyDue(d => !d)}
          className={`ml-auto px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all ${
            showOnlyDue
              ? 'bg-red-500 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <RefreshCw size={11} />
          Due Revisions {stats?.dueRevisions ? `(${stats.dueRevisions})` : ''}
        </button>
      </div>

      {/* ── Topic list ──────────────────────────────────────── */}
      <div className="space-y-3">
        {filteredTopics.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <BookOpen size={32} className="mx-auto mb-3 text-slate-300" />
            <p className="font-bold">No topics match this filter</p>
          </div>
        ) : (
          filteredTopics.map((entry, idx) => {
            const realIdx = topics.indexOf(entry);
            const prevEntry = topics[realIdx - 1];
            const prevProgress = prevEntry ? getTopicProgress(prevEntry.topic) : null;
            const prevPassed = prevProgress
              ? isGatePassed(prevProgress, getTopicRule(prevEntry.topic, prevEntry.subject))
              : true;

            return (
              <TopicCard
                key={entry.topic}
                entry={entry}
                index={realIdx}
                progress={getTopicProgress(entry.topic)}
                prevUnlocked={prevPassed}
                onUpdate={update => updateTopicProgress(entry.topic, update)}
              />
            );
          })
        )}
      </div>

      {/* ── Bottom inspiration ───────────────────────────────── */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-900 p-6 text-white text-center">
        <p className="text-2xl mb-2">🚂</p>
        <p className="font-black text-sm mb-1">RRB Group D — You Can Do This</p>
        <p className="text-white/60 text-[12px] leading-relaxed">
          "Success is not about being the smartest. It's about being the most consistent."
          Follow this roadmap every single day, respect the gates, revise on schedule — and you WILL crack this exam.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            { v: '4,295+', l: 'Real PYQs' },
            { v: `${topics.length}`, l: 'Topics' },
            { v: `${profile.daysLeft}`, l: 'Days Left' },
          ].map(s => (
            <div key={s.l} className="bg-white/10 rounded-xl p-2">
              <p className="font-black text-lg">{s.v}</p>
              <p className="text-[10px] text-white/60">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
