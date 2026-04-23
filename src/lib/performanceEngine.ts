/**
 * LIVE PERFORMANCE ENGINE  v4 — Per-User Isolated Storage + Cloud Sync
 * ─────────────────────────────────────────────────────────────────────
 * Architecture:
 *   - localStorage  → namespaced per user email (prevents cross-user leakage)
 *   - Firebase Firestore → cloud sync keyed by user email
 *
 * Key namespacing:
 *   All keys use prefix derived from user email, e.g.:
 *   "ananda_gmail_com__rrb_perf" for ananda@gmail.com
 *   This means different Google accounts on the SAME device
 *   never see each other's data.
 *
 * Flow on login:
 *   1. Clear ALL stale keys from any previously-logged-in user
 *   2. Pull data from Firestore for this email
 *   3. Save to this user's namespaced localStorage
 *   4. Any device with same email → same data
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, emailToDocId } from './firebase';

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
  start_time: number;
  answers: Record<string, {
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

// ─── User key management ──────────────────────────────────────────────────────

const USER_KEY = 'rrb_user';

/**
 * Converts an email to a safe localStorage namespace prefix.
 * e.g. ananda@gmail.com → "u_ananda_gmail_com"
 */
function emailToPrefix(email: string): string {
  return 'u_' + email.toLowerCase()
    .replace(/[@.]/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .substring(0, 60);
}

function getCurrentEmail(): string | null {
  try {
    const u = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
    return u?.email || null;
  } catch (_) { return null; }
}

function getPrefix(): string {
  const email = getCurrentEmail();
  if (!email) return 'u_guest';
  return emailToPrefix(email);
}

// Namespaced key getters (computed lazily so they always use current user)
function dataKey(): string { return `${getPrefix()}__rrb_perf`; }
function liveKey(): string { return `${getPrefix()}__rrb_live`; }

// ─── Cross-user data isolation ────────────────────────────────────────────────

/**
 * Called on login: removes ALL localStorage keys that belong to a DIFFERENT user.
 * This prevents User A's stale data from being seen by User B.
 * Only removes rrb_* and u_* namespaced keys — does not touch unrelated app data.
 */
export function clearOtherUserData(currentEmail: string): void {
  const currentPrefix = emailToPrefix(currentEmail);
  const toDelete: string[] = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Old-style global keys (without user prefix) — always remove
      const isOldGlobal = (
        key === 'rrb_performance_data' ||
        key === 'rrb_live_session' ||
        key === 'rrb_roadmap_profile' ||
        key === 'rrb_day_completions' ||
        key === 'rrb_setup' ||
        key === 'rrb_tasks' ||
        key.startsWith('rrb_day_')
      );

      // New-style keys from a DIFFERENT user
      const isOtherUserKey = key.startsWith('u_') && !key.startsWith(currentPrefix + '__');

      if (isOldGlobal || isOtherUserKey) {
        toDelete.push(key);
      }
    }
    toDelete.forEach(k => localStorage.removeItem(k));
    console.log(`[UserIsolation] Cleared ${toDelete.length} stale keys for user switch`);
  } catch (_) {}
}

/**
 * Called on logout: clears ALL data for the currently logged-in user from localStorage.
 * Cloud data (Firestore) is NOT touched — user can recover on next login.
 */
export function clearCurrentUserData(): void {
  const prefix = getPrefix();
  const toDelete: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix + '__')) toDelete.push(key);
    }
    toDelete.forEach(k => localStorage.removeItem(k));
    console.log(`[UserIsolation] Cleared ${toDelete.length} local keys on logout`);
  } catch (_) {}
}

// ─── Local storage helpers ────────────────────────────────────────────────────

function emptyData(): PerformanceData {
  return {
    tests: [],
    overall: {
      total_tests: 0, total_questions: 0, total_correct: 0,
      overall_accuracy: 0, best_score_percentage: 0,
      last_score_percentage: 0, subject_accuracy: {}, topic_accuracy: {},
    },
  };
}

function readData(): PerformanceData {
  try {
    const raw = localStorage.getItem(dataKey());
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return emptyData();
}

function writeData(data: PerformanceData): void {
  try { localStorage.setItem(dataKey(), JSON.stringify(data)); } catch (_) {}
}

export function readLiveSession(): LiveSession | null {
  try {
    const raw = localStorage.getItem(liveKey());
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
}

function writeLiveSession(session: LiveSession): void {
  try { localStorage.setItem(liveKey(), JSON.stringify(session)); } catch (_) {}
}

function clearLiveSession(): void {
  try { localStorage.removeItem(liveKey()); } catch (_) {}
}

// ─── Recalculate overall stats ────────────────────────────────────────────────

function recalcOverall(data: PerformanceData): void {
  const { tests } = data;
  if (tests.length === 0) { data.overall = emptyData().overall; return; }

  const subj: Record<string, { c: number; t: number }> = {};
  const top:  Record<string, { c: number; t: number }> = {};
  let totalQ = 0, totalC = 0;

  for (const test of tests) {
    totalQ += test.total;
    totalC += test.score;
    for (const [s, bd] of Object.entries(test.subject_breakdown || {})) {
      if (!subj[s]) subj[s] = { c: 0, t: 0 };
      subj[s].c += bd.correct; subj[s].t += bd.total;
    }
    for (const [tp, bd] of Object.entries(test.topic_breakdown || {})) {
      if (!top[tp]) top[tp] = { c: 0, t: 0 };
      top[tp].c += bd.correct; top[tp].t += bd.total;
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

// ─── Merge local + cloud (union deduplicated by test_id) ──────────────────────

function mergeData(local: PerformanceData, cloud: PerformanceData): PerformanceData {
  const seen = new Set<string>();
  const merged: TestResult[] = [];

  for (const t of [...local.tests, ...cloud.tests]) {
    if (!seen.has(t.test_id)) {
      seen.add(t.test_id);
      merged.push(t);
    }
  }
  merged.sort((a, b) => a.test_id.localeCompare(b.test_id));

  const result: PerformanceData = { tests: merged, overall: emptyData().overall };
  recalcOverall(result);
  return result;
}

// ─── Sync status (observable) ────────────────────────────────────────────────

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'offline';
let _syncStatus: SyncStatus = 'idle';
const _syncListeners: Array<(s: SyncStatus) => void> = [];

function setSyncStatus(s: SyncStatus) {
  _syncStatus = s;
  _syncListeners.forEach(fn => fn(s));
}

export function getSyncStatus(): SyncStatus { return _syncStatus; }
export function onSyncStatusChange(fn: (s: SyncStatus) => void): () => void {
  _syncListeners.push(fn);
  return () => { const i = _syncListeners.indexOf(fn); if (i !== -1) _syncListeners.splice(i, 1); };
}

// ─── Firestore cloud operations (with retry + status) ────────────────────────

async function pushToCloud(email: string, data: PerformanceData): Promise<boolean> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const ref = doc(db, 'users', emailToDocId(email));
      await setDoc(ref, {
        email,
        performance: JSON.stringify(data),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      console.log(`[CloudSync] ✅ Pushed ${data.tests.length} tests (attempt ${attempt})`);
      return true;
    } catch (err: any) {
      const isPermission = err?.code === 'permission-denied';
      const isOffline    = err?.code === 'unavailable' || !navigator.onLine;
      console.warn(`[CloudSync] Push attempt ${attempt} failed:`, err?.code, err?.message);
      if (isPermission) {
        console.error('[CloudSync] ❌ Firestore permission denied — check security rules.');
        return false;
      }
      if (isOffline || attempt === 3) return false;
      await new Promise(r => setTimeout(r, 800 * attempt));
    }
  }
  return false;
}

async function pullFromCloud(email: string): Promise<PerformanceData | null> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const ref  = doc(db, 'users', emailToDocId(email));
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const raw = snap.data()?.performance;
        if (raw) {
          const data = JSON.parse(raw) as PerformanceData;
          console.log(`[CloudSync] ✅ Pulled ${data.tests.length} tests`);
          return data;
        }
      }
      console.log('[CloudSync] No cloud data yet for this user');
      return null;
    } catch (err: any) {
      const isPermission = err?.code === 'permission-denied';
      const isOffline    = err?.code === 'unavailable' || !navigator.onLine;
      console.warn(`[CloudSync] Pull attempt ${attempt} failed:`, err?.code, err?.message);
      if (isPermission || isOffline || attempt === 3) return null;
      await new Promise(r => setTimeout(r, 800 * attempt));
    }
  }
  return null;
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

/**
 * SYNC ON LOGIN — clear other-user stale data, pull cloud, merge, push back.
 * Always resolves (never throws) — offline safe.
 */
export async function syncOnLogin(email: string): Promise<PerformanceData> {
  // 🔑 Step 1: Evict any stale data from previous user BEFORE reading local
  clearOtherUserData(email);

  if (!navigator.onLine) {
    setSyncStatus('offline');
    console.log('[CloudSync] Offline — using local data only');
    return readData();
  }

  setSyncStatus('syncing');
  console.log(`[CloudSync] Starting sync for ${email}…`);

  try {
    const local  = readData();
    const cloud  = await pullFromCloud(email);
    const merged = cloud ? mergeData(local, cloud) : local;
    writeData(merged);

    const ok = await pushToCloud(email, merged);
    setSyncStatus(ok ? 'success' : 'error');
    console.log(`[CloudSync] Done — ${merged.tests.length} tests (push: ${ok ? '✅' : '❌'})`);
    return merged;
  } catch (err) {
    console.error('[CloudSync] Unexpected error:', err);
    setSyncStatus('error');
    return readData();
  }
}

/** Start a new live session.  */
export function startLiveSession(
  type: LiveSession['type'], subject: string, topic: string
): string {
  const session_id = `${type === 'Mock Test' ? 'mock' : 'practice'}_${Date.now()}`;
  writeLiveSession({ session_id, type, subject, topic, start_time: Date.now(), answers: {} });
  return session_id;
}

/** Record one answer — fires immediately on every click (localStorage only, 0ms). */
export function trackAnswer(
  questionId: string | number, subject: string, topic: string, correct: boolean
): void {
  const session = readLiveSession();
  if (!session) return;
  session.answers[String(questionId)] = { subject, topic, correct };
  writeLiveSession(session);
}

/** Finalize session → save to localStorage + push to Firestore. */
export function finalizeSession(totalQuestions?: number): void {
  const session = readLiveSession();
  if (!session) return;

  const answers = Object.values(session.answers);
  if (answers.length === 0) { clearLiveSession(); return; }

  const subjBreak: Record<string, SubjectBreakdown> = {};
  const topBreak:  Record<string, SubjectBreakdown> = {};

  for (const a of answers) {
    if (!subjBreak[a.subject]) subjBreak[a.subject] = { correct: 0, wrong: 0, total: 0 };
    subjBreak[a.subject].total++;
    if (a.correct) subjBreak[a.subject].correct++; else subjBreak[a.subject].wrong++;

    if (a.topic && a.topic !== 'All') {
      if (!topBreak[a.topic]) topBreak[a.topic] = { correct: 0, wrong: 0, total: 0 };
      topBreak[a.topic].total++;
      if (a.correct) topBreak[a.topic].correct++; else topBreak[a.topic].wrong++;
    }
  }

  const correct    = answers.filter(a => a.correct).length;
  const answered   = answers.length;
  const percentage = answered > 0 ? Math.round((correct / answered) * 100) : 0;
  const now        = new Date();

  const result: TestResult = {
    test_id: session.session_id,
    type: session.type, subject: session.subject, topic: session.topic,
    date: `${String(now.getDate()).padStart(2,'0')}-${String(now.getMonth()+1).padStart(2,'0')}-${now.getFullYear()}`,
    score: correct,
    total: answered,
    percentage,
    time_seconds: Math.round((Date.now() - session.start_time) / 1000),
    subject_breakdown: subjBreak,
    topic_breakdown: topBreak,
  };

  const data = readData();
  data.tests.push(result);
  recalcOverall(data);
  writeData(data);
  clearLiveSession();

  // ── Notify UI instantly (0ms) ─────────────────────────────────────
  window.dispatchEvent(new CustomEvent('rrb_perf_updated'));

  // Push to cloud non-blocking
  const email = getCurrentEmail();
  if (email) pushToCloud(email, data);
}

// ─── Read helpers ─────────────────────────────────────────────────────────────

export async function loadPerformanceData(): Promise<PerformanceData | null> {
  const d = readData();
  return d.tests.length > 0 ? d : null;
}

export function getLiveStats(): { answered: number; correct: number; accuracy: number } | null {
  const session = readLiveSession();
  if (!session) return null;
  const answers = Object.values(session.answers);
  if (answers.length === 0) return null;
  const correct = answers.filter(a => a.correct).length;
  return { answered: answers.length, correct, accuracy: Math.round((correct / answers.length) * 100) };
}

export async function saveTestResult(result: TestResult): Promise<void> {
  const data = readData();
  data.tests.push(result);
  recalcOverall(data);
  writeData(data);
  // Notify UI instantly
  window.dispatchEvent(new CustomEvent('rrb_perf_updated'));
  const email = getCurrentEmail();
  if (email) pushToCloud(email, data);
}

export { recalcOverall as recalculateOverall };

/**
 * FORCE SYNC — push ALL local data to Firestore immediately.
 * Called by the "Sync Now" button. Always resolves, never throws.
 */
export async function forceSyncNow(): Promise<boolean> {
  const email = getCurrentEmail();
  if (!email) { console.warn('[ForceSync] No user email found'); return false; }

  setSyncStatus('syncing');
  const local = readData();

  // Also pull from cloud first to avoid overwriting newer cloud data
  const cloud = await pullFromCloud(email);
  const merged = cloud ? mergeData(local, cloud) : local;
  writeData(merged);

  const ok = await pushToCloud(email, merged);
  setSyncStatus(ok ? 'success' : 'error');

  // Notify UI instantly
  window.dispatchEvent(new CustomEvent('rrb_perf_updated'));

  console.log(`[ForceSync] ${ok ? '✅ Success' : '❌ Failed'} — ${merged.tests.length} tests`);
  if (ok) setTimeout(() => setSyncStatus('idle'), 3000);
  return ok;
}
