/**
 * EXAM PLANNER — Cloud Sync  v2 (Per-User Isolated Storage)
 * All localStorage keys are namespaced by user email prefix to prevent
 * cross-user data leakage on shared devices.
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, emailToDocId } from './firebase';

// ─── User key prefix ──────────────────────────────────────────────────────────
const USER_KEY = 'rrb_user';

function getCurrentEmail(): string | null {
  try {
    const u = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
    return u?.email || null;
  } catch { return null; }
}

function emailToPrefix(email: string): string {
  return 'u_' + email.toLowerCase()
    .replace(/[@.]/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .substring(0, 60);
}

function getPrefix(): string {
  const email = getCurrentEmail();
  return email ? emailToPrefix(email) : 'u_guest';
}

// Dynamic namespaced key getters
function setupKey(): string { return `${getPrefix()}__rrb_setup`; }
function tasksKey(): string { return `${getPrefix()}__rrb_tasks`; }
function dayLogPrefix(): string { return `${getPrefix()}__rrb_day_`; }

// ─── Day log helpers ──────────────────────────────────────────────────────────

function readAllLogs(): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const prefix = dayLogPrefix();
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (k.startsWith(prefix)) {
        try { out[k.slice(prefix.length)] = JSON.parse(localStorage.getItem(k)!); } catch { /* skip */ }
      }
    }
  } catch { /* skip */ }
  return out;
}

function writeAllLogs(logs: Record<string, unknown>) {
  const prefix = dayLogPrefix();
  for (const [k, v] of Object.entries(logs)) {
    try { localStorage.setItem(prefix + k, JSON.stringify(v)); } catch { /* skip */ }
  }
}

// ─── Push planner data to Firestore ──────────────────────────────────────────
async function pushPlanner(email: string): Promise<boolean> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const setup = localStorage.getItem(setupKey());
      const tasks = localStorage.getItem(tasksKey());
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
      localStorage.setItem(setupKey(), data.planner_setup);
    }

    // Restore tasks — merge: cloud wins for new tasks, local wins for completed status
    if (data.planner_tasks) {
      try {
        const cloudTasks: any[] = JSON.parse(data.planner_tasks);
        const localRaw = localStorage.getItem(tasksKey());
        const localTasks: any[] = localRaw ? JSON.parse(localRaw) : [];

        const merged = new Map<string, any>();
        for (const t of cloudTasks) merged.set(t.id, t);
        for (const t of localTasks) {
          if (merged.has(t.id)) {
            const cloud = merged.get(t.id);
            const localNewer = (t.completedAt || '') >= (cloud.completedAt || '');
            merged.set(t.id, localNewer ? t : cloud);
          } else {
            merged.set(t.id, t);
          }
        }
        localStorage.setItem(tasksKey(), JSON.stringify([...merged.values()]));
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
  }, 1500);
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

/**
 * Return the namespaced setup key for the current user
 * (used by ExamPlanner.tsx to read/write its own localStorage)
 */
export function getPlannerSetupKey(): string { return setupKey(); }
export function getPlannerTasksKey(): string { return tasksKey(); }
export function getPlannerDayLogPrefix(): string { return dayLogPrefix(); }
