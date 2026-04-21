/**
 * EXAM PLANNER — Cloud Sync
 * Syncs setup, tasks, and day-logs to Firestore under the user's email doc.
 * Works exactly like performanceEngine's cloud sync but for planner data.
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, emailToDocId } from './firebase';

// ─── Storage keys (must match ExamPlanner.tsx) ────────────────────────────────
const SETUP_KEY = 'rrb_setup';
const TASKS_KEY = 'rrb_tasks';
const USER_KEY  = 'rrb_user';

function getCurrentEmail(): string | null {
  try {
    const u = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
    return u?.email || null;
  } catch { return null; }
}

function readAllLogs(): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (k.startsWith('rrb_day_')) {
        try { out[k] = JSON.parse(localStorage.getItem(k)!); } catch { /* skip */ }
      }
    }
  } catch { /* skip */ }
  return out;
}

function writeAllLogs(logs: Record<string, unknown>) {
  for (const [k, v] of Object.entries(logs)) {
    if (k.startsWith('rrb_day_')) {
      try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* skip */ }
    }
  }
}

// ─── Push planner data to Firestore ──────────────────────────────────────────
async function pushPlanner(email: string): Promise<boolean> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const setup = localStorage.getItem(SETUP_KEY);
      const tasks = localStorage.getItem(TASKS_KEY);
      const logs  = readAllLogs();

      const ref = doc(db, 'users', emailToDocId(email));
      await setDoc(ref, {
        planner_setup: setup || null,
        planner_tasks: tasks || '[]',
        planner_logs:  JSON.stringify(logs),
        plannerUpdatedAt: serverTimestamp(),
      }, { merge: true });

      console.log('[PlannerSync] ✅ Pushed planner data');
      return true;
    } catch (err: any) {
      const isOffline = err?.code === 'unavailable' || !navigator.onLine;
      console.warn(`[PlannerSync] Push attempt ${attempt} failed:`, err?.code);
      if (isOffline || attempt === 3) return false;
      await new Promise(r => setTimeout(r, 800 * attempt));
    }
  }
  return false;
}

// ─── Pull planner data from Firestore ────────────────────────────────────────
async function pullPlanner(email: string): Promise<boolean> {
  try {
    const ref  = doc(db, 'users', emailToDocId(email));
    const snap = await getDoc(ref);
    if (!snap.exists()) return false;

    const data = snap.data();

    // Restore setup
    if (data.planner_setup) {
      localStorage.setItem(SETUP_KEY, data.planner_setup);
    }

    // Restore tasks — merge: cloud wins for new tasks, local wins for completed status
    if (data.planner_tasks) {
      try {
        const cloudTasks: any[] = JSON.parse(data.planner_tasks);
        const localRaw = localStorage.getItem(TASKS_KEY);
        const localTasks: any[] = localRaw ? JSON.parse(localRaw) : [];

        const merged = new Map<string, any>();
        // Start with cloud tasks
        for (const t of cloudTasks) merged.set(t.id, t);
        // Local tasks override (keeps latest toggle state)
        for (const t of localTasks) {
          if (merged.has(t.id)) {
            // Keep whichever has the most recent completedAt
            const cloud = merged.get(t.id);
            const localNewer = (t.completedAt || '') >= (cloud.completedAt || '');
            merged.set(t.id, localNewer ? t : cloud);
          } else {
            merged.set(t.id, t); // local-only task
          }
        }
        localStorage.setItem(TASKS_KEY, JSON.stringify([...merged.values()]));
      } catch { /* skip merge, keep local */ }
    }

    // Restore day logs
    if (data.planner_logs) {
      try {
        const cloudLogs: Record<string, unknown> = JSON.parse(data.planner_logs);
        writeAllLogs(cloudLogs);
      } catch { /* skip */ }
    }

    console.log('[PlannerSync] ✅ Pulled planner data');
    return true;
  } catch (err: any) {
    console.warn('[PlannerSync] Pull failed:', err?.code);
    return false;
  }
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

/**
 * Call on login — pull cloud planner data and merge with local.
 */
export async function syncPlannerOnLogin(): Promise<void> {
  const email = getCurrentEmail();
  if (!email || !navigator.onLine) return;
  try {
    await pullPlanner(email);
    // Dispatch event so ExamPlanner re-reads localStorage
    window.dispatchEvent(new CustomEvent('rrb_planner_updated'));
  } catch { /* never throw */ }
}

/**
 * Call whenever tasks/setup/logs change — debounced push to cloud.
 */
let _pushTimer: ReturnType<typeof setTimeout> | null = null;
export function schedulePlannerSync(): void {
  if (_pushTimer) clearTimeout(_pushTimer);
  _pushTimer = setTimeout(async () => {
    const email = getCurrentEmail();
    if (email && navigator.onLine) {
      await pushPlanner(email);
    }
  }, 1500); // 1.5s debounce — batch rapid changes
}

/**
 * Immediate force sync (called by "Sync Now" button).
 */
export async function forceSyncPlanner(): Promise<boolean> {
  const email = getCurrentEmail();
  if (!email) return false;
  if (!navigator.onLine) return false;
  await pullPlanner(email);
  const ok = await pushPlanner(email);
  window.dispatchEvent(new CustomEvent('rrb_planner_updated'));
  return ok;
}
