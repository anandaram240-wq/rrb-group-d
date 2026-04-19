/**
 * LIVE PERFORMANCE ENGINE
 * ─────────────────────────────────────────────────────────────────
 * Every single answer click = immediate localStorage save.
 * No manual saving. No session-end requirement. Every move counts.
 *
 * Keys used:
 *   rrb_performance_data  → finalized test history + overall stats
 *   rrb_live_session      → current in-progress session (overwritten every answer)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SubjectBreakdown {
  correct: number;
  wrong: number;
  total: number;
}

export interface TestResult {
  test_id: string;
  type: 'Mock Test' | 'Subject Practice';
  subject: string;
  topic: string;
  date: string;
  score: number;
  total: number;
  percentage: number;
  time_seconds: number;
  subject_breakdown: Record<string, SubjectBreakdown>;
  topic_breakdown: Record<string, SubjectBreakdown>;
}

export interface LiveSession {
  session_id: string;
  type: 'Mock Test' | 'Subject Practice';
  subject: string;
  topic: string;
  start_time: number;                       // ms epoch
  answers: Record<string, {                 // keyed by questionId
    subject: string;
    topic: string;
    correct: boolean;
  }>;
}

export interface PerformanceData {
  tests: TestResult[];
  overall: {
    total_tests: number;
    total_questions: number;
    total_correct: number;
    overall_accuracy: number;
    best_score_percentage: number;
    last_score_percentage: number;
    subject_accuracy: Record<string, number>;
    topic_accuracy: Record<string, number>;
  };
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const DATA_KEY = 'rrb_performance_data';
const LIVE_KEY = 'rrb_live_session';

// ─── Low-level helpers ────────────────────────────────────────────────────────

function readData(): PerformanceData {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return {
    tests: [],
    overall: {
      total_tests: 0,
      total_questions: 0,
      total_correct: 0,
      overall_accuracy: 0,
      best_score_percentage: 0,
      last_score_percentage: 0,
      subject_accuracy: {},
      topic_accuracy: {},
    },
  };
}

function writeData(data: PerformanceData): void {
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
  } catch (_) {}
}

export function readLiveSession(): LiveSession | null {
  try {
    const raw = localStorage.getItem(LIVE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
}

function writeLiveSession(session: LiveSession): void {
  try {
    localStorage.setItem(LIVE_KEY, JSON.stringify(session));
  } catch (_) {}
}

function clearLiveSession(): void {
  try {
    localStorage.removeItem(LIVE_KEY);
  } catch (_) {}
}

// ─── Recalculate overall stats from all tests ─────────────────────────────────

function recalcOverall(data: PerformanceData): void {
  const { tests } = data;
  if (tests.length === 0) {
    data.overall = {
      total_tests: 0,
      total_questions: 0,
      total_correct: 0,
      overall_accuracy: 0,
      best_score_percentage: 0,
      last_score_percentage: 0,
      subject_accuracy: {},
      topic_accuracy: {},
    };
    return;
  }

  const subj: Record<string, { c: number; t: number }> = {};
  const top: Record<string, { c: number; t: number }> = {};
  let totalQ = 0, totalC = 0;

  for (const test of tests) {
    totalQ += test.total;
    totalC += test.score;

    for (const [s, bd] of Object.entries(test.subject_breakdown || {})) {
      if (!subj[s]) subj[s] = { c: 0, t: 0 };
      subj[s].c += bd.correct;
      subj[s].t += bd.total;
    }
    for (const [tp, bd] of Object.entries(test.topic_breakdown || {})) {
      if (!top[tp]) top[tp] = { c: 0, t: 0 };
      top[tp].c += bd.correct;
      top[tp].t += bd.total;
    }
  }

  data.overall = {
    total_tests: tests.length,
    total_questions: totalQ,
    total_correct: totalC,
    overall_accuracy: totalQ > 0 ? Math.round((totalC / totalQ) * 100) : 0,
    best_score_percentage: Math.max(...tests.map(t => t.percentage)),
    last_score_percentage: tests[tests.length - 1]?.percentage ?? 0,
    subject_accuracy: Object.fromEntries(
      Object.entries(subj).map(([s, v]) => [s, v.t > 0 ? Math.round((v.c / v.t) * 100) : 0])
    ),
    topic_accuracy: Object.fromEntries(
      Object.entries(top).map(([s, v]) => [s, v.t > 0 ? Math.round((v.c / v.t) * 100) : 0])
    ),
  };
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

/** Start a new live session — call when practice/mock begins */
export function startLiveSession(
  type: LiveSession['type'],
  subject: string,
  topic: string
): string {
  const session_id = `${type === 'Mock Test' ? 'mock' : 'practice'}_${Date.now()}`;
  writeLiveSession({ session_id, type, subject, topic, start_time: Date.now(), answers: {} });
  return session_id;
}

/**
 * Track a single answer — call immediately when user selects an option.
 * This is the CORE function. Every click → localStorage write.
 */
export function trackAnswer(
  questionId: string | number,
  subject: string,
  topic: string,
  correct: boolean
): void {
  const session = readLiveSession();
  if (!session) return;

  session.answers[String(questionId)] = { subject, topic, correct };
  writeLiveSession(session); // ← immediate save, every single answer
}

/**
 * Finalize the current live session → save it permanently to test history.
 * Call when test submits or practice exits.
 * If session has 0 answers, just clears without saving.
 */
export function finalizeSession(totalQuestions?: number): void {
  const session = readLiveSession();
  if (!session) return;

  const answers = Object.values(session.answers);
  if (answers.length === 0) {
    clearLiveSession();
    return;
  }

  // Build breakdowns from live answers
  const subjBreak: Record<string, SubjectBreakdown> = {};
  const topBreak: Record<string, SubjectBreakdown> = {};

  for (const a of answers) {
    if (!subjBreak[a.subject]) subjBreak[a.subject] = { correct: 0, wrong: 0, total: 0 };
    subjBreak[a.subject].total++;
    if (a.correct) subjBreak[a.subject].correct++;
    else           subjBreak[a.subject].wrong++;

    if (a.topic && a.topic !== 'All') {
      if (!topBreak[a.topic]) topBreak[a.topic] = { correct: 0, wrong: 0, total: 0 };
      topBreak[a.topic].total++;
      if (a.correct) topBreak[a.topic].correct++;
      else           topBreak[a.topic].wrong++;
    }
  }

  const correct    = answers.filter(a => a.correct).length;
  const total      = totalQuestions ?? answers.length;
  const answered   = answers.length;
  const percentage = answered > 0 ? Math.round((correct / answered) * 100) : 0;
  const timeSeconds = Math.round((Date.now() - session.start_time) / 1000);

  const now     = new Date();
  const dateStr = [
    String(now.getDate()).padStart(2, '0'),
    String(now.getMonth() + 1).padStart(2, '0'),
    now.getFullYear(),
  ].join('-');

  const result: TestResult = {
    test_id: session.session_id,
    type: session.type,
    subject: session.subject,
    topic: session.topic,
    date: dateStr,
    score: correct,
    total: answered,
    percentage,
    time_seconds: timeSeconds,
    subject_breakdown: subjBreak,
    topic_breakdown: topBreak,
  };

  const data = readData();
  data.tests.push(result);
  recalcOverall(data);
  writeData(data);
  clearLiveSession();
}

// ─── Read helpers for performance page ────────────────────────────────────────

export async function loadPerformanceData(): Promise<PerformanceData | null> {
  const d = readData();
  return d.tests.length > 0 ? d : null;
}

/** Get live session stats for display (without finalizing) */
export function getLiveStats(): { answered: number; correct: number; accuracy: number } | null {
  const session = readLiveSession();
  if (!session) return null;
  const answers = Object.values(session.answers);
  if (answers.length === 0) return null;
  const correct = answers.filter(a => a.correct).length;
  return {
    answered: answers.length,
    correct,
    accuracy: Math.round((correct / answers.length) * 100),
  };
}

/** Save a complete test result directly (for backward compat) */
export async function saveTestResult(result: TestResult): Promise<void> {
  const data = readData();
  data.tests.push(result);
  recalcOverall(data);
  writeData(data);
}

export { recalcOverall as recalculateOverall };
