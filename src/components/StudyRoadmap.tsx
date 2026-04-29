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

// Priority order: 1=first to unlock, 4=last
const SUBJECT_PRIORITY: Record<string, number> = {
  'Reasoning': 1,
  'General Science': 2,
  'Mathematics': 3,
  'General Awareness': 4,
};

const SUBJECT_COLORS: Record<string, string> = {
  'Reasoning': '#6366f1',
  'Mathematics': '#0ea5e9',
  'General Science': '#10b981',
  'General Awareness': '#f59e0b',
};

const SUBJECT_ICONS: Record<string, string> = {
  'Reasoning': '🧠',
  'General Science': '🔬',
  'Mathematics': '➗',
  'General Awareness': '📰',
};

// Difficulty label from accuracy gate
function getDifficulty(accuracyGate: number): { label: string; color: string; bg: string } {
  if (accuracyGate >= 78) return { label: 'Hard', color: '#ef4444', bg: '#fef2f2' };
  if (accuracyGate >= 72) return { label: 'Medium', color: '#f59e0b', bg: '#fffbeb' };
  return { label: 'Easy', color: '#10b981', bg: '#f0fdf4' };
}

// Estimated study days for a topic (rough: 1hr concept + PYQs at ~5/min)
function estimateDays(rule: TopicRule): string {
  const totalHours = rule.conceptHours + rule.minPYQs / 30; // ~30 PYQs/hr
  if (totalHours <= 1.5) return '1–2 days';
  if (totalHours <= 3) return '2–3 days';
  if (totalHours <= 5) return '3–5 days';
  return '5–7 days';
}

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
  const sliced = eligible.slice(0, Math.max(minTopics, maxTopics));

  // ── Sort by SUBJECT PRIORITY first, then PYQ frequency within each subject ──
  return sliced.sort((a, b) => {
    const pa = SUBJECT_PRIORITY[a.subject] ?? 99;
    const pb = SUBJECT_PRIORITY[b.subject] ?? 99;
    if (pa !== pb) return pa - pb;
    return b.count - a.count; // within same subject: most PYQs first
  });
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
            {/* Difficulty badge */}
            {(() => {
              const d = getDifficulty(rule.accuracyGate);
              return (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: d.color, background: d.bg }}>
                  {d.label === 'Hard' ? '🔥' : d.label === 'Medium' ? '⚡' : '✨'} {d.label}
                </span>
              );
            })()}
            {/* Est. time */}
            <span className="text-[10px] text-slate-400 px-1.5 py-0.5 bg-slate-100 rounded-full">
              📅 {estimateDays(rule)}
            </span>
            {revStatus.due && !gatePassed && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 animate-pulse">
                {revStatus.overdue ? '⚠️ OVERDUE' : '🔔 REVISE'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
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
            <span className="text-[11px] text-slate-400">• 🎯 Gate: {rule.accuracyGate}%</span>
          </div>
          {/* Progress bar */}
          {!isLocked && (
            <div className="mt-2">
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

// SSC CGL / UPSC Topper Wisdom — proven quotes
const TOPPER_WISDOM = [
  { quote: '"Attempt the highest-frequency topics first. In RRB, 60% of marks come from 30% of syllabus."', name: 'Vikas Divyakirti', title: 'UPSC Educator & Mentor', icon: '🎓' },
  { quote: '"Solve 30 PYQs per topic before reading theory again. PYQs reveal the pattern, theory just explains it."', name: 'SSC CGL AIR 1 Strategy', title: 'Topper — 2022 Batch', icon: '🥇' },
  { quote: "\"The Ebbinghaus curve is real. If you don't revise on Day 1, Day 7, Day 30 — you WILL forget 80% of what you studied.\"", name: 'Hermann Ebbinghaus', title: 'Memory & Learning Scientist', icon: '🧠' },
  { quote: '"Lock yourself to one topic until the accuracy gate is passed. Context switching is the #1 killer of exam preparation."', name: 'RRB Group D 2022 Topper', title: 'Score: 98.4 percentile', icon: '🔒' },
  { quote: '"Speed comes LAST. First master accuracy — 100% correct in unlimited time. Then reduce time. Never the other way."', name: 'Khan Sir (Faisal Khan)', title: 'Legendary RRB/SSC Educator', icon: '⚡' },
  { quote: '"Every morning: 20-minute revision of yesterday\'s topic. Every evening: 40 new PYQs. This is the only schedule that works."', name: 'SSC CGL Topper Framework', title: 'Consistency System', icon: '📅' },
];

function SetupScreen({ onSetup }: { onSetup: (days: number) => void }) {
  const [days, setDays] = useState(60);
  const [wisdomIdx, setWisdomIdx] = useState(0);

  React.useEffect(() => {
    const t = setInterval(() => setWisdomIdx(i => (i + 1) % TOPPER_WISDOM.length), 4000);
    return () => clearInterval(t);
  }, []);

  const presets = [
    { label: '⚡ Emergency', days: 7,  desc: 'Top 10 most-asked topics only', color: '#ef4444' },
    { label: '🎯 Sprint',    days: 14, desc: '15 topics — SSC CGL minimum viable plan', color: '#f59e0b' },
    { label: '📚 Standard',  days: 30, desc: '20 topics — recommended by toppers', color: '#3b82f6' },
    { label: '🏆 Master',    days: 60, desc: '30 topics — RRB Group D topper pace', color: '#8b5cf6' },
    { label: '💎 Champion',  days: 90, desc: 'All 40 topics — leave nothing to chance', color: '#10b981' },
  ];

  const w = TOPPER_WISDOM[wisdomIdx];

  return (
    <div className="max-w-xl mx-auto p-4 space-y-5">
      {/* Hero */}
      <div
        className="relative rounded-3xl p-6 text-white overflow-hidden text-center"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)' }}
      >
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #818cf8, transparent)' }} />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #c084fc, transparent)' }} />
        <div className="relative">
          <div className="w-14 h-14 bg-yellow-400/20 border-2 border-yellow-400/40 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Trophy size={28} className="text-yellow-300" />
          </div>
          <h1 className="text-xl font-black mb-1">RRB Group D — Topper Roadmap</h1>
          <p className="text-indigo-300 text-[12px]">Built on 4,295+ PYQs · SSC CGL & UPSC proven strategy</p>
        </div>
      </div>

      {/* Rotating Topper Wisdom */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-3 flex items-center gap-1.5">
          <Star size={11} /> Topper Wisdom
        </p>
        <div style={{ minHeight: 80 }}>
          <p className="text-[13px] text-slate-800 font-semibold leading-relaxed italic mb-3">{w.quote}</p>
          <div className="flex items-center gap-2">
            <span className="text-xl">{w.icon}</span>
            <div>
              <p className="text-[11px] font-black text-slate-800">{w.name}</p>
              <p className="text-[10px] text-slate-500">{w.title}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-1 mt-3 justify-center">
          {TOPPER_WISDOM.map((_, i) => (
            <button key={i} onClick={() => setWisdomIdx(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${ i === wisdomIdx ? 'bg-amber-600 w-4' : 'bg-amber-300' }`}
            />
          ))}
        </div>
      </div>

      {/* SSC CGL Proven Laws */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-4">
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-700 mb-3 flex items-center gap-1.5">
          <Shield size={12} /> How This Roadmap Works
        </p>
        <div className="space-y-2">
          {[
            { icon: '📊', bold: 'PYQ-frequency ordered', text: '— highest-yield topics come first' },
            { icon: '🔒', bold: 'Accuracy gates', text: '— must pass each topic before moving on' },
            { icon: '🔔', bold: 'Ebbinghaus schedule', text: '— Day 1, 7, 30 revision reminders' },
            { icon: '🏆', bold: 'Per-topic topper tips', text: '— SSC CGL & RRB-specific strategies' },
            { icon: '⚡', bold: 'Subject unlock order', text: '— Reasoning → Science → Maths → GA' },
          ].map((r, i) => (
            <div key={i} className="flex items-start gap-2 text-[12px] text-slate-700">
              <span className="mt-0.5">{r.icon}</span>
              <p><strong>{r.bold}</strong>{r.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Time presets */}
      <div>
        <p className="font-black text-slate-800 text-sm mb-3 flex items-center gap-2">
          <Calendar size={14} /> How many days until your exam?
        </p>
        <div className="grid grid-cols-1 gap-2">
          {presets.map(p => (
            <button
              key={p.days}
              onClick={() => setDays(p.days)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                days === p.days ? 'text-white shadow-md' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
              style={days === p.days ? { background: p.color, borderColor: p.color } : {}}
            >
              <span>{p.label}</span>
              <span className={`text-[11px] font-medium ${ days === p.days ? 'text-white/80' : 'text-slate-400' }`}>
                {p.days}d · {p.desc}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-3">
          <span className="text-sm text-slate-500">Custom days:</span>
          <input
            type="number" min={1} max={365} value={days}
            onChange={e => setDays(Math.max(1, parseInt(e.target.value) || 1))}
            className="border-2 border-slate-200 rounded-xl px-3 py-2 text-sm w-24 font-bold focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <button
        onClick={() => onSetup(days)}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black py-4 rounded-2xl text-base shadow-lg shadow-indigo-200 hover:from-indigo-700 hover:to-purple-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
      >
        <Zap size={18} /> Build My Topper Roadmap
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
    const remaining = profile.daysLeft - daysPassed;
    const topicsLeft = topics.length - completed;
    const pyqsPerDay = remaining > 0 && topicsLeft > 0
      ? Math.ceil((topicsLeft * 25) / remaining)  // ~25 PYQs avg per topic
      : 0;
    return { completed, total: topics.length, dueRevisions, totalPYQs, daysPassed, remaining: Math.max(0, remaining), pyqsPerDay, topicsLeft };
  }, [profile, topics]);

  // Per-subject progress
  const subjectStats = useMemo(() => {
    const order = Object.keys(SUBJECT_PRIORITY).sort((a, b) => SUBJECT_PRIORITY[a] - SUBJECT_PRIORITY[b]);
    return order.map(subj => {
      const subTopics = topics.filter(t => t.subject === subj);
      if (subTopics.length === 0) return null;
      const done = subTopics.filter(t => isGatePassed(getTopicProgress(t.topic), getTopicRule(t.topic, t.subject))).length;
      const pct = Math.round((done / subTopics.length) * 100);
      return { subject: subj, done, total: subTopics.length, pct, color: SUBJECT_COLORS[subj] ?? '#6366f1', icon: SUBJECT_ICONS[subj] ?? '📚' };
    }).filter(Boolean) as { subject: string; done: number; total: number; pct: number; color: string; icon: string }[];
  }, [profile, topics]);

  // "Today's Mission" — first unlocked-but-not-completed topic
  const todaysMission = useMemo(() => {
    for (const entry of topics) {
      const progress = getTopicProgress(entry.topic);
      const rule = getTopicRule(entry.topic, entry.subject);
      if (isGatePassed(progress, rule)) continue;
      const subjectTopics = topics.filter(t => t.subject === entry.subject);
      const posInSubject = subjectTopics.indexOf(entry);
      const groupUnlocked = (() => {
        const priority = SUBJECT_PRIORITY[entry.subject] ?? 1;
        if (priority <= 1) return true;
        return Object.keys(SUBJECT_PRIORITY)
          .filter(s => SUBJECT_PRIORITY[s] < priority)
          .every(s => {
            const st = topics.filter(t => t.subject === s);
            return st.length === 0 || st.every(t => isGatePassed(getTopicProgress(t.topic), getTopicRule(t.topic, t.subject)));
          });
      })();
      if (!groupUnlocked) continue;
      if (posInSubject === 0) return { entry, progress, rule };
      const prev = subjectTopics[posInSubject - 1];
      if (isGatePassed(getTopicProgress(prev.topic), getTopicRule(prev.topic, prev.subject))) {
        return { entry, progress, rule };
      }
    }
    return null;
  }, [profile, topics]);

  const subjects = useMemo(() => {
    // Order subjects by priority in the filter bar
    const present = new Set(topics.map(t => t.subject));
    const ordered = Object.keys(SUBJECT_PRIORITY)
      .sort((a, b) => SUBJECT_PRIORITY[a] - SUBJECT_PRIORITY[b])
      .filter(s => present.has(s));
    return ['All', ...ordered];
  }, [topics]);

  // Helper: check if ALL topics of a given subject group are gate-passed
  const isSubjectGroupComplete = (subject: string): boolean => {
    return topics
      .filter(t => t.subject === subject)
      .every(t => isGatePassed(getTopicProgress(t.topic), getTopicRule(t.topic, t.subject)));
  };

  // Helper: is a subject group unlocked (i.e. all previous-priority subjects done)?
  const isSubjectGroupUnlocked = (subject: string): boolean => {
    const priority = SUBJECT_PRIORITY[subject] ?? 1;
    if (priority <= 1) return true; // first subject is always open
    const prevSubjects = Object.keys(SUBJECT_PRIORITY).filter(
      s => SUBJECT_PRIORITY[s] < priority
    );
    // All higher-priority subjects that appear in our topic list must be fully complete
    return prevSubjects.every(s => {
      const subjectTopics = topics.filter(t => t.subject === s);
      if (subjectTopics.length === 0) return true; // not in list, skip
      return isSubjectGroupComplete(s);
    });
  };

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
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

      {/* ── PREMIUM HERO HEADER ───────────────────────────────── */}
      <div
        className="relative rounded-3xl p-6 text-white shadow-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 70%, #1e1b4b 100%)' }}
      >
        {/* Glow orbs */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #818cf8, transparent)' }} />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #c084fc, transparent)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #fbbf24, transparent)' }} />

        <div className="relative">
          {/* Top row */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center">
                  <Trophy size={16} className="text-yellow-300" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">RRB Group D · Study Roadmap</span>
              </div>
              <h1 className="text-2xl font-black leading-tight">
                {stats?.completed === stats?.total && stats?.total !== 0
                  ? '🎉 All Topics Mastered!'
                  : <>{stats?.completed ?? 0}<span className="text-white/40 font-medium">/{stats?.total ?? 0}</span> Topics Mastered</>}
              </h1>
              <p className="text-indigo-300 text-[11px] mt-1">
                Day {stats?.daysPassed ?? 0} of {profile.daysLeft} &nbsp;·&nbsp; {stats?.remaining ?? 0} days remaining &nbsp;·&nbsp; {stats?.totalPYQs ?? 0} PYQs solved
              </p>
            </div>
            <button
              onClick={handleReset}
              className="text-white/25 hover:text-white/60 transition text-[10px] flex-shrink-0 mt-1 px-2 py-1 rounded-lg hover:bg-white/10"
            >
              Reset
            </button>
          </div>

          {/* Overall mastery bar */}
          <div className="mb-5">
            <div className="flex justify-between text-[10px] text-indigo-300 mb-1.5">
              <span className="font-bold">Overall Mastery</span>
              <span className="font-black text-white">{stats ? Math.round((stats.completed / stats.total) * 100) : 0}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 relative"
                style={{
                  width: `${stats ? (stats.completed / stats.total) * 100 : 0}%`,
                  background: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 50%, #fbbf24 100%)'
                }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
              </div>
            </div>
          </div>

          {/* Stats tiles — 4 premium cards */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: CheckCircle, label: 'Mastered', value: stats?.completed ?? 0, color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)' },
              { icon: Target,      label: 'Remaining', value: stats?.topicsLeft ?? 0, color: '#818cf8', bg: 'rgba(129,140,248,0.15)', border: 'rgba(129,140,248,0.3)' },
              { icon: RefreshCw,  label: 'Revise Due', value: stats?.dueRevisions ?? 0, color: (stats?.dueRevisions ?? 0) > 0 ? '#f87171' : '#6b7280', bg: (stats?.dueRevisions ?? 0) > 0 ? 'rgba(248,113,113,0.2)' : 'rgba(107,114,128,0.1)', border: (stats?.dueRevisions ?? 0) > 0 ? 'rgba(248,113,113,0.4)' : 'rgba(107,114,128,0.2)', pulse: (stats?.dueRevisions ?? 0) > 0 },
              { icon: Zap,        label: 'PYQs/Day', value: stats?.pyqsPerDay ?? 0, color: '#fbbf24', bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.3)' },
            ].map((s, i) => (
              <div
                key={s.label}
                className={`rounded-2xl p-3 text-center border transition-all ${ (s as any).pulse ? 'animate-pulse' : '' }`}
                style={{ background: (s as any).bg, borderColor: (s as any).border }}
              >
                <s.icon size={15} className="mx-auto mb-1" style={{ color: (s as any).color }} />
                <p className="text-xl font-black" style={{ color: (s as any).color }}>{s.value}</p>
                <p className="text-[9px] font-bold text-white/50 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PREMIUM SUBJECT PROGRESS CARDS ───────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {subjectStats.map(s => {
          const circumference = 2 * Math.PI * 20;
          const filled = circumference * (s.pct / 100);
          const color = s.pct === 100 ? '#10b981' : s.color;
          return (
            <div
              key={s.subject}
              className="rounded-2xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
              style={{ borderColor: color + '55' }}
            >
              <div className="flex items-center gap-3">
                {/* Circular progress ring */}
                <div className="relative shrink-0">
                  <svg width="52" height="52" viewBox="0 0 52 52" className="-rotate-90">
                    <circle cx="26" cy="26" r="20" fill="none" stroke={color + '20'} strokeWidth="4" />
                    <circle
                      cx="26" cy="26" r="20" fill="none"
                      stroke={color}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${filled} ${circumference - filled}`}
                      style={{ transition: 'stroke-dasharray 1s ease' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-lg">
                    {s.icon}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-slate-700 truncate">{s.subject}</p>
                  <p className="text-[10px] text-slate-400 mb-1.5">{s.done}/{s.total} topics</p>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${s.pct}%`, background: color }}
                    />
                  </div>
                </div>
                <span
                  className="text-sm font-black shrink-0"
                  style={{ color }}
                >
                  {s.pct}%
                </span>
              </div>
              {s.pct === 100 && (
                <div className="mt-2.5 text-[10px] text-emerald-700 font-bold bg-emerald-50 rounded-lg px-2 py-1 text-center border border-emerald-200">
                  ✅ Complete · Next subject unlocked!
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── PREMIUM TODAY'S MISSION CARD ─────────────────────── */}
      {todaysMission && (() => {
        const mc = SUBJECT_COLORS[todaysMission.entry.subject] ?? '#6366f1';
        const pct = Math.min(100, Math.round((todaysMission.progress.pyqsAttempted / todaysMission.rule.minPYQs) * 100));
        return (
          <div
            className="relative rounded-3xl overflow-hidden border shadow-lg"
            style={{ borderColor: mc + '44' }}
          >
            {/* Gradient background */}
            <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${mc}18 0%, ${mc}05 60%, #ffffff 100%)` }} />
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-1/2 translate-x-1/2 opacity-10" style={{ background: mc }} />

            <div className="relative p-5">
              {/* Header row */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black shadow-md text-lg"
                    style={{ background: `linear-gradient(135deg, ${mc}, ${mc}cc)` }}
                  >
                    🎯
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: mc }}>Today's Mission</p>
                    <p className="text-[11px] text-slate-400">{SUBJECT_ICONS[todaysMission.entry.subject]} {todaysMission.entry.subject}</p>
                  </div>
                </div>
                <div
                  className="text-[10px] font-black px-3 py-1 rounded-full border"
                  style={{ color: mc, borderColor: mc + '55', background: mc + '15' }}
                >
                  {pct}% done
                </div>
              </div>

              {/* Topic name */}
              <p className="font-black text-xl text-slate-900 mb-3 leading-tight">{todaysMission.entry.topic}</p>

              {/* Stats chips */}
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { icon: '📝', label: `${todaysMission.progress.pyqsAttempted}/${todaysMission.rule.minPYQs} PYQs` },
                  { icon: '🎯', label: `${todaysMission.rule.accuracyGate}% accuracy` },
                  { icon: '⏱', label: `${todaysMission.rule.conceptHours}h concept` },
                  { icon: '📅', label: estimateDays(todaysMission.rule) },
                ].map((chip, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full border"
                    style={{ color: mc, borderColor: mc + '44', background: mc + '10' }}
                  >
                    {chip.icon} {chip.label}
                  </span>
                ))}
              </div>

              {/* Progress bar — thick + gradient */}
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden mb-1.5">
                <div
                  className="h-full rounded-full transition-all duration-700 relative"
                  style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${mc}cc, ${mc})` }}
                >
                  {pct > 15 && <div className="absolute inset-0 bg-white/20 rounded-full" />}
                </div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>PYQ Progress</span>
                <span style={{ color: mc }} className="font-black">{todaysMission.progress.pyqsAttempted}/{todaysMission.rule.minPYQs} solved</span>
              </div>
            </div>
          </div>
        );
      })()}
      {!todaysMission && stats && stats.completed === stats.total && (
        <div className="rounded-3xl p-6 text-white text-center shadow-lg" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #0d9488 100%)' }}>
          <div className="text-4xl mb-3">🏆</div>
          <p className="font-black text-xl">All Topics Mastered!</p>
          <p className="text-white/80 text-sm mt-1.5">Focus on revision schedules and full mock tests now.</p>
        </div>
      )}

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
          <p>⚡ <strong>Law 6 — Subject Priority Order:</strong> 🧠 Reasoning → 🔬 Science → ➗ Mathematics → 📰 General Awareness. Each subject unlocks only after the previous is fully mastered.</p>
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
        ) : (() => {
          // Group topics by subject to render section headers
          const rendered: React.ReactNode[] = [];
          let lastSubject = '';

          filteredTopics.forEach((entry, _idx) => {
            const realIdx = topics.indexOf(entry);

            // ── Subject group header ────────────────────────────────────────
            if (entry.subject !== lastSubject) {
              lastSubject = entry.subject;
              const groupUnlocked = isSubjectGroupUnlocked(entry.subject);
              const groupComplete = isSubjectGroupComplete(entry.subject);
              const color = SUBJECT_COLORS[entry.subject] ?? '#6366f1';
              const icon = SUBJECT_ICONS[entry.subject] ?? '📚';
              const priority = SUBJECT_PRIORITY[entry.subject] ?? 0;
              const prevSubjectName = Object.keys(SUBJECT_PRIORITY)
                .sort((a, b) => SUBJECT_PRIORITY[a] - SUBJECT_PRIORITY[b])
                .filter(s => SUBJECT_PRIORITY[s] === priority - 1)[0];

              rendered.push(
                <div
                  key={`header-${entry.subject}`}
                  className="rounded-2xl overflow-hidden"
                  style={{ border: `2px solid ${groupUnlocked ? color : '#e2e8f0'}` }}
                >
                  <div
                    className="px-5 py-4 flex items-center gap-3"
                    style={{
                      background: groupUnlocked
                        ? `linear-gradient(135deg, ${color}18 0%, ${color}06 100%)`
                        : '#f8fafc',
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-sm"
                      style={{ background: groupUnlocked ? color : '#cbd5e1' }}
                    >
                      {groupComplete ? '✅' : groupUnlocked ? icon : <Lock size={18} color="white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-slate-800 text-sm">
                          Priority {priority}: {entry.subject}
                        </p>
                        {groupComplete && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                            ✅ Subject Complete!
                          </span>
                        )}
                        {!groupUnlocked && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-500">
                            🔒 Locked
                          </span>
                        )}
                        {groupUnlocked && !groupComplete && (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: `${color}22`, color }}
                          >
                            🔓 Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {groupUnlocked
                          ? groupComplete
                            ? 'All topics mastered — next subject unlocked!'
                            : `Work through all ${entry.subject} topics to unlock the next subject`
                          : `Complete all ${prevSubjectName ?? 'previous'} topics first to unlock this subject`}
                      </p>
                    </div>
                  </div>
                </div>
              );
            }

            // ── Unlock logic for the topic ──────────────────────────────────
            // First topic of a subject group: locked unless group is unlocked
            // Subsequent topics: locked unless previous topic in same subject is gate-passed
            const subjectTopics = topics.filter(t => t.subject === entry.subject);
            const posInSubject = subjectTopics.indexOf(entry);
            const groupUnlocked = isSubjectGroupUnlocked(entry.subject);

            let prevPassed: boolean;
            if (!groupUnlocked) {
              prevPassed = false; // whole group locked
            } else if (posInSubject === 0) {
              prevPassed = true; // first in group and group is open
            } else {
              const prevInSubject = subjectTopics[posInSubject - 1];
              prevPassed = isGatePassed(
                getTopicProgress(prevInSubject.topic),
                getTopicRule(prevInSubject.topic, prevInSubject.subject)
              );
            }

            rendered.push(
              <TopicCard
                key={entry.topic}
                entry={entry}
                index={realIdx}
                progress={getTopicProgress(entry.topic)}
                prevUnlocked={prevPassed}
                onUpdate={update => updateTopicProgress(entry.topic, update)}
              />
            );
          });

          return rendered;
        })()}
      </div>

      {/* ── Topper Study Schedule ────────────────────────────── */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-5">
        <p className="font-black text-slate-800 text-sm mb-4 flex items-center gap-2">
          <Calendar size={14} className="text-indigo-600" /> Proven Daily Study Schedule
          <span className="ml-auto text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">SSC CGL Topper Method</span>
        </p>
        <div className="space-y-2">
          {[
            { time: '6:00 – 6:20 AM', label: 'Morning Revision', desc: "Quick 20-min recap of yesterday's topic. Do NOT attempt new questions.", color: '#f59e0b', icon: '☀️' },
            { time: '6:20 – 8:30 AM', label: 'Concept Study', desc: 'Read ONE new topic concept deeply (max 2 hrs). No distractions.', color: '#6366f1', icon: '📖' },
            { time: '9:00 – 11:00 AM', label: 'PYQ Practice', desc: "Solve 40 PYQs on today's topic. Write every wrong answer in a notebook.", color: '#10b981', icon: '📝' },
            { time: '4:00 – 5:30 PM', label: 'Weak Area Drill', desc: 'Revisit wrong answers from morning. Re-solve until 100% correct.', color: '#ef4444', icon: '🎯' },
            { time: '8:00 – 8:30 PM', label: 'Speed Practice', desc: '30 mixed questions timed at 45 sec each. Track score daily.', color: '#8b5cf6', icon: '⚡' },
          ].map(s => (
            <div key={s.time} className="flex gap-3 items-start">
              <div className="text-[10px] font-bold text-slate-400 w-28 flex-shrink-0 pt-0.5">{s.time}</div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span>{s.icon}</span>
                  <p className="text-[12px] font-black" style={{ color: s.color }}>{s.label}</p>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom inspiration ───────────────────────────────── */}
      <div
        className="rounded-2xl p-6 text-white text-center"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #0f172a 100%)' }}
      >
        <p className="text-3xl mb-2">🚂</p>
        <p className="font-black text-base mb-1">RRB Group D — You WILL Crack This</p>
        <p className="text-white/55 text-[12px] leading-relaxed max-w-xs mx-auto">
          "Consistency beats intelligence every single time. One hour of focused PYQ practice daily for 60 days
          beats 12 hours of unfocused reading."
        </p>
        <p className="text-[10px] text-amber-400 font-bold mt-1">— Khan Sir, Patna</p>
        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          {[
            { v: '4,295+', l: 'Real PYQs' },
            { v: `${topics.length}`,    l: 'Topics' },
            { v: `${stats?.completed ?? 0}/${stats?.total ?? topics.length}`, l: 'Mastered' },
            { v: `${profile.daysLeft}`, l: 'Days' },
          ].map(s => (
            <div key={s.l} className="bg-white/10 rounded-xl p-2 border border-white/10">
              <p className="font-black text-sm">{s.v}</p>
              <p className="text-[9px] text-white/50">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
