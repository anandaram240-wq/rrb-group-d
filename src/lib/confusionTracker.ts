/**
 * Confusion Tracker — RRB Group D
 * Saves manually flagged / confusing questions to localStorage.
 * Each entry stores: id, subject, topic, question text (short), timestamp.
 */

export interface ConfusionEntry {
  id: number;
  subject: string;
  topic: string;
  sub_topic?: string;
  questionSnippet: string;   // first 80 chars of question
  flaggedAt: string;         // ISO timestamp
}

const KEY = 'rrb_confusion_flags';

function load(): ConfusionEntry[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

function save(entries: ConfusionEntry[]): void {
  localStorage.setItem(KEY, JSON.stringify(entries));
}

/** Toggle flag on a question. Returns true if now flagged, false if now unflagged. */
export function toggleFlag(
  id: number,
  subject: string,
  topic: string,
  sub_topic: string | undefined,
  questionText: string,
): boolean {
  const entries = load();
  const idx = entries.findIndex(e => e.id === id);
  if (idx !== -1) {
    entries.splice(idx, 1);
    save(entries);
    return false;
  }
  entries.push({
    id,
    subject,
    topic,
    sub_topic,
    questionSnippet: questionText.replace(/\s+/g, ' ').substring(0, 90),
    flaggedAt: new Date().toISOString(),
  });
  save(entries);
  return true;
}

/** Check if a question is currently flagged */
export function isFlagged(id: number): boolean {
  return load().some(e => e.id === id);
}

/** Get all flagged entries */
export function getAllFlagged(): ConfusionEntry[] {
  return load();
}

/** Count of all flagged questions */
export function getFlaggedCount(): number {
  return load().length;
}

/** Remove a specific flag by id */
export function removeFlag(id: number): void {
  save(load().filter(e => e.id !== id));
}

/** Clear all flags */
export function clearAllFlags(): void {
  localStorage.removeItem(KEY);
}

/** Group by subject → topic for the Weak Areas view */
export function getFlaggedBySubjectTopic(): Record<string, Record<string, ConfusionEntry[]>> {
  const entries = load();
  const result: Record<string, Record<string, ConfusionEntry[]>> = {};
  for (const e of entries) {
    if (!result[e.subject]) result[e.subject] = {};
    if (!result[e.subject][e.topic]) result[e.subject][e.topic] = [];
    result[e.subject][e.topic].push(e);
  }
  return result;
}
