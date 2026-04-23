import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell, AreaChart, Area,
} from 'recharts';
import {
  Calendar, ChevronLeft, ChevronRight, Flame, Target,
  X, Settings, Bell, TrendingUp, TrendingDown,
  Award, Clock, RotateCcw, BarChart2, Star,
  BookOpen, Zap, AlertTriangle, CheckCircle2,
  ClipboardList, Activity, Plus, Trash2, CheckCheck,
  ListTodo, Trophy, BarChart3, AlertCircle,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { schedulePlannerSync, getPlannerSetupKey, getPlannerTasksKey, getPlannerDayLogPrefix } from '../lib/plannerSync';


// ─── Types ────────────────────────────────────────────────────────────────────
interface Setup {
  examDate: string;
  category: 'General' | 'OBC' | 'SC' | 'ST';
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  dailyHours: '1-2 hrs' | '3-4 hrs' | '5+ hrs';
}

interface Task {
  id: string;
  title: string;
  subject: 'Mathematics' | 'Reasoning' | 'General Science' | 'General Awareness' | 'Revision' | 'Mock Test' | 'Other';
  dueDate: string;        // YYYY-MM-DD
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  priority: 'high' | 'medium' | 'low';
  notes?: string;
}

interface DayLog {
  status: 'studied' | 'partial' | 'missed' | '';
  notes: string;
  questions: number;
  mockScore: number | null;
  mockTaken: boolean;
  hours: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CUTOFFS: Record<string, number> = { General: 82, OBC: 77, SC: 70, ST: 65 };
const SAFE_ZONE = 85;

function dateKey(d: Date) { return d.toISOString().slice(0, 10); }
function daysBetween(a: Date, b: Date) { return Math.round((b.getTime() - a.getTime()) / 86400000); }

const SUBJECT_COLORS: Record<string, string> = {
  'Mathematics': '#3b82f6',
  'Reasoning': '#8b5cf6',
  'General Science': '#10b981',
  'General Awareness': '#f59e0b',
  'Revision': '#6366f1',
  'Mock Test': '#ef4444',
  'Other': '#64748b',
};

const PRIORITY_META = {
  high: { label: 'High', color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
  medium: { label: 'Medium', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  low: { label: 'Low', color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function accuracyColor(pct: number) {
  if (pct >= 80) return '#16a34a';
  if (pct >= 50) return '#d97706';
  return '#dc2626';
}

// ─── Storage Keys — per-user namespaced via plannerSync ──────────────────────
// Keys are dynamic (depend on logged-in user email) so we call getters each time

function loadTasks(): Task[] {
  try { return JSON.parse(localStorage.getItem(getPlannerTasksKey()) || '[]'); } catch { return []; }
}
function saveTasks(t: Task[]) {
  localStorage.setItem(getPlannerTasksKey(), JSON.stringify(t));
  schedulePlannerSync(); // ← cloud sync
}

function loadLogs(): Record<string, DayLog> {
  try {
    const out: Record<string, DayLog> = {};
    const prefix = getPlannerDayLogPrefix();
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (k.startsWith(prefix)) {
        try { out[k.slice(prefix.length)] = JSON.parse(localStorage.getItem(k)!); } catch { }
      }
    }
    return out;
  } catch { return {}; }
}

// ─── Stat Card (same as PerformanceTracker)  ─────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  bgColor: string;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
}
function StatCard({ label, value, icon: Icon, bgColor, subtext, trend }: StatCardProps) {
  return (
    <div className={cn('rounded-2xl p-5 text-white relative overflow-hidden shadow-md', bgColor)}>
      <div className="absolute right-4 top-4 opacity-20"><Icon size={48} /></div>
      <div className="relative z-10">
        <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">{label}</p>
        <div className="flex items-end gap-2">
          <p className="text-4xl font-black">{value}</p>
          {trend === 'up' && <TrendingUp size={20} className="mb-1 opacity-80" />}
          {trend === 'down' && <TrendingDown size={20} className="mb-1 opacity-80" />}
        </div>
        {subtext && <p className="text-xs opacity-70 mt-1 font-medium">{subtext}</p>}
      </div>
    </div>
  );
}

// ─── Custom chart tooltips ────────────────────────────────────────────────────
const TaskTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-sm">
      <p className="font-bold text-slate-700 mb-1">{label}</p>
      <p className="font-black text-blue-600">{payload[0]?.value ?? 0} tasks done</p>
      {payload[1] && <p className="font-bold text-amber-500">{payload[1]?.value ?? 0} pending</p>}
    </div>
  );
};

const ProgressTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const pct = payload[0]?.value ?? 0;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-sm">
      <p className="font-bold text-slate-700 mb-1">{label}</p>
      <p className="font-black" style={{ color: accuracyColor(pct) }}>{pct}% complete</p>
    </div>
  );
};

// ─── Setup Screen ─────────────────────────────────────────────────────────────
function SetupScreen({ onSave }: { onSave: (s: Setup) => void }) {
  const [form, setForm] = useState<Partial<Setup>>({});
  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-gradient-to-br from-[#002045] to-[#1e40af] rounded-2xl p-8 mb-6 text-white shadow-lg">
        <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mb-4">
          <Target size={28} />
        </div>
        <h2 className="text-2xl font-black mb-1">RRB Group D Planner</h2>
        <p className="text-white/70 text-sm">Set up your personalised prep plan.</p>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">📅 Exam Date</label>
          <input type="date" className="w-full rounded-xl px-4 py-3 text-sm border border-slate-200 bg-white focus:outline-none focus:border-blue-500 transition-colors"
            value={form.examDate || ''} onChange={e => setForm(p => ({ ...p, examDate: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">🏷️ Category</label>
          <div className="grid grid-cols-4 gap-2">
            {(['General', 'OBC', 'SC', 'ST'] as const).map(c => (
              <button key={c} onClick={() => setForm(p => ({ ...p, category: c }))}
                className={cn('py-2.5 rounded-xl text-sm font-bold border-2 transition-all',
                  form.category === c ? 'bg-[#002045] text-white border-[#002045] shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300')}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">📊 Current Level</label>
          <div className="grid grid-cols-3 gap-2">
            {(['Beginner', 'Intermediate', 'Advanced'] as const).map(l => (
              <button key={l} onClick={() => setForm(p => ({ ...p, level: l }))}
                className={cn('py-2.5 rounded-xl text-sm font-bold border-2 transition-all',
                  form.level === l ? 'bg-[#002045] text-white border-[#002045] shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300')}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">⏱️ Daily Study Hours</label>
          <div className="grid grid-cols-3 gap-2">
            {(['1-2 hrs', '3-4 hrs', '5+ hrs'] as const).map(h => (
              <button key={h} onClick={() => setForm(p => ({ ...p, dailyHours: h }))}
                className={cn('py-2.5 rounded-xl text-sm font-bold border-2 transition-all',
                  form.dailyHours === h ? 'bg-[#002045] text-white border-[#002045] shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300')}>
                {h}
              </button>
            ))}
          </div>
        </div>
        <button disabled={!form.examDate || !form.category || !form.level || !form.dailyHours}
          onClick={() => onSave(form as Setup)}
          className="w-full py-4 rounded-xl font-black text-white bg-gradient-to-r from-[#002045] to-[#1e40af] hover:opacity-90 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed text-base">
          🚀 Start My Preparation
        </button>
      </div>
    </div>
  );
}

// ─── Add Task Modal ───────────────────────────────────────────────────────────
interface AddTaskModalProps {
  onAdd: (t: Task) => void;
  onClose: () => void;
  defaultDate?: string;
}
function AddTaskModal({ onAdd, onClose, defaultDate }: AddTaskModalProps) {
  const today = dateKey(new Date());
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState<Task['subject']>('Mathematics');
  const [dueDate, setDueDate] = useState(defaultDate || today);
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [notes, setNotes] = useState('');

  const handleAdd = () => {
    if (!title.trim()) return;
    const task: Task = {
      id: `task_${Date.now()}`,
      title: title.trim(),
      subject, dueDate, priority,
      notes: notes.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    onAdd(task);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-[#002045] to-[#1e40af]">
          <div>
            <h3 className="text-white font-black text-lg flex items-center gap-2">
              <Plus size={18} /> Add Study Task
            </h3>
            <p className="text-blue-200 text-xs mt-0.5">Schedule what you need to complete</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Task Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Solve 50 Number Series questions"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Subject</label>
            <div className="flex flex-wrap gap-2">
              {(['Mathematics', 'Reasoning', 'General Science', 'General Awareness', 'Revision', 'Mock Test', 'Other'] as Task['subject'][]).map(s => (
                <button key={s} onClick={() => setSubject(s)}
                  className={cn('px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all',
                    subject === s ? 'text-white border-transparent' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300')}
                  style={subject === s ? { background: SUBJECT_COLORS[s], borderColor: SUBJECT_COLORS[s] } : {}}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Due Date + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">📅 Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Priority</label>
              <div className="flex gap-1.5">
                {(['high', 'medium', 'low'] as const).map(p => (
                  <button key={p} onClick={() => setPriority(p)}
                    className={cn('flex-1 py-2.5 rounded-xl text-xs font-bold border-2 capitalize transition-all',
                      priority === p ? PRIORITY_META[p].bg + ' ' + PRIORITY_META[p].color + ' border-current' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300')}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Any details or reminders..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleAdd} disabled={!title.trim()}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#002045] to-[#1e40af] shadow-md hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            <Plus size={14} /> Add Task
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────
interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}
function TaskCard({ task, onToggle, onDelete }: TaskCardProps) {
  const today = dateKey(new Date());
  const isOverdue = !task.completed && task.dueDate < today;
  const isDueToday = !task.completed && task.dueDate === today;
  const pm = PRIORITY_META[task.priority];

  return (
    <div className={cn(
      'flex items-start gap-3 p-4 rounded-2xl border-2 transition-all',
      task.completed
        ? 'bg-green-50 border-green-200 opacity-75'
        : isOverdue
          ? 'bg-red-50 border-red-200'
          : isDueToday
            ? 'bg-blue-50 border-blue-200 shadow-sm'
            : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'
    )}>
      {/* Checkbox */}
      <button onClick={() => onToggle(task.id)}
        className={cn(
          'w-6 h-6 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all',
          task.completed
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-slate-300 hover:border-blue-500'
        )}>
        {task.completed && <CheckCircle2 size={14} />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-bold leading-snug', task.completed ? 'line-through text-slate-400' : 'text-slate-800')}>
          {task.title}
        </p>
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
          {/* Subject badge */}
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
            style={{ background: SUBJECT_COLORS[task.subject] }}>
            {task.subject}
          </span>
          {/* Priority */}
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', pm.bg, pm.color)}>
            {pm.label}
          </span>
          {/* Date */}
          <span className={cn('text-[10px] font-bold flex items-center gap-1',
            isOverdue ? 'text-red-600' : isDueToday ? 'text-blue-600' : 'text-slate-400')}>
            <Calendar size={10} />
            {isOverdue ? '⚠️ Overdue · ' : isDueToday ? '📌 Today · ' : ''}{task.dueDate}
          </span>
        </div>
        {task.notes && <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{task.notes}</p>}
        {task.completed && task.completedAt && (
          <p className="text-[10px] text-green-600 mt-1">✓ Completed {new Date(task.completedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
        )}
      </div>

      {/* Delete */}
      <button onClick={() => onDelete(task.id)}
        className="text-slate-300 hover:text-red-500 transition-colors shrink-0 p-1 rounded-lg hover:bg-red-50">
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN EXAM PLANNER
// ═══════════════════════════════════════════════════════════════════════════════
export function ExamPlanner() {
  const [setup, setSetup] = useState<Setup | null>(() => {
    try { const s = localStorage.getItem(getPlannerSetupKey()); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [tasks, setTasksState] = useState<Task[]>(loadTasks);
  const [dayLogs, setDayLogs] = useState<Record<string, DayLog>>(loadLogs);

  // ── Re-read from localStorage when cloud push completes ─────────────────
  useEffect(() => {
    const reload = () => {
      try {
        const s = localStorage.getItem(getPlannerSetupKey());
        if (s) setSetup(JSON.parse(s));
      } catch { /* skip */ }
      setTasksState(loadTasks());
      setDayLogs(loadLogs());
    };
    window.addEventListener('rrb_planner_updated', reload);
    return () => window.removeEventListener('rrb_planner_updated', reload);
  }, []);

  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'planner' | 'settings'>('overview');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalDate, setAddModalDate] = useState<string | undefined>();
  const [filterDate, setFilterDate] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'done' | 'overdue'>('all');
  const [resetConfirm, setResetConfirm] = useState(false);
  const [settingsForm, setSettingsForm] = useState<Partial<Setup>>({});

  // Calendar
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const setTasks = useCallback((fn: Task[] | ((prev: Task[]) => Task[])) => {
    setTasksState(prev => {
      const next = typeof fn === 'function' ? fn(prev) : fn;
      saveTasks(next);
      return next;
    });
  }, []);

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const examDate = setup ? new Date(setup.examDate + 'T00:00:00') : null;
  const daysLeft = examDate ? daysBetween(today, examDate) : null;
  const cutoff = setup ? CUTOFFS[setup.category] : 82;

  const urgencyBg = daysLeft == null ? 'from-[#002045] to-[#1e40af]'
    : daysLeft > 60 ? 'from-[#002045] to-[#1e40af]'
      : daysLeft > 30 ? 'from-amber-600 to-orange-600'
        : 'from-red-600 to-red-700';

  // ── Task Stats ──────────────────────────────────────────────────────────────
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = totalTasks - doneTasks;
  const overdueTasks = tasks.filter(t => !t.completed && t.dueDate < dateKey(today)).length;
  const todayTasks = tasks.filter(t => t.dueDate === dateKey(today));
  const todayDone = todayTasks.filter(t => t.completed).length;
  const completionPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Streak from dayLogs
  const streak = useMemo(() => {
    let s = 0; const d = new Date(today);
    while (true) {
      const log = dayLogs[dateKey(d)];
      if (log?.status === 'studied') { s++; d.setDate(d.getDate() - 1); } else break;
    }
    return s;
  }, [dayLogs, today]);

  // ── Weekly task completion chart (last 14 days) ─────────────────────────────
  const weeklyChartData = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - 13 + i);
      const ds = dateKey(d);
      const dayTasks = tasks.filter(t => t.dueDate === ds);
      const done = dayTasks.filter(t => t.completed).length;
      const pending = dayTasks.length - done;
      return {
        date: d.toLocaleDateString('en', { weekday: 'short' }).slice(0, 2),
        done,
        pending,
        total: dayTasks.length,
      };
    });
  }, [tasks, today]);

  // ── Cumulative progress area chart ─────────────────────────────────────────
  const cumulativeData = useMemo(() => {
    const sorted = [...tasks].filter(t => t.completedAt).sort((a, b) =>
      (a.completedAt || '').localeCompare(b.completedAt || '')
    );
    const byDay: Record<string, number> = {};
    for (const t of sorted) {
      const ds = t.completedAt!.slice(0, 10);
      byDay[ds] = (byDay[ds] || 0) + 1;
    }
    let cum = 0;
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - 13 + i);
      const ds = dateKey(d);
      cum += byDay[ds] || 0;
      const totalSoFar = tasks.filter(t => t.createdAt.slice(0, 10) <= ds).length;
      const pct = totalSoFar > 0 ? Math.round((cum / totalSoFar) * 100) : 0;
      return { date: d.toLocaleDateString('en', { weekday: 'short' }).slice(0, 2), pct };
    });
  }, [tasks, today]);

  // ── Subject breakdown ────────────────────────────────────────────────────────
  const subjectData = useMemo(() => {
    const all = ['Mathematics', 'Reasoning', 'General Science', 'General Awareness', 'Revision', 'Mock Test', 'Other'] as Task['subject'][];
    return all.map(s => {
      const subjTasks = tasks.filter(t => t.subject === s);
      const done = subjTasks.filter(t => t.completed).length;
      return { subject: s, total: subjTasks.length, done, pct: subjTasks.length > 0 ? Math.round((done / subjTasks.length) * 100) : 0 };
    }).filter(d => d.total > 0);
  }, [tasks]);

  // ── Filtered tasks ───────────────────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (filterDate && t.dueDate !== filterDate) return false;
      if (filterSubject !== 'all' && t.subject !== filterSubject) return false;
      if (filterStatus === 'pending' && t.completed) return false;
      if (filterStatus === 'done' && !t.completed) return false;
      if (filterStatus === 'overdue' && (t.completed || t.dueDate >= dateKey(today))) return false;
      return true;
    }).sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      const prio = { high: 0, medium: 1, low: 2 };
      return prio[a.priority] - prio[b.priority];
    });
  }, [tasks, filterDate, filterSubject, filterStatus, today]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleToggle = useCallback((id: string) => {
    setTasks(prev => prev.map(t => t.id === id
      ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : undefined }
      : t
    ));
  }, [setTasks]);

  const handleDelete = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, [setTasks]);

  const handleAdd = useCallback((t: Task) => {
    setTasks(prev => [...prev, t]);
  }, [setTasks]);

  // ── Calendar helpers ─────────────────────────────────────────────────────────
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();

  // ── Tabs ─────────────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'tasks', label: 'Tasks', icon: ListTodo },
    { id: 'planner', label: 'Calendar', icon: Calendar },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  const taskBadge = pendingTasks + overdueTasks;

  // ── Setup gate ────────────────────────────────────────────────────────────────
  if (!setup) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-slate-500 text-sm font-medium mb-1">Get started</p>
          <h2 className="text-3xl font-black text-[#002045] tracking-tight">Exam Planner Setup</h2>
        </div>
        <SetupScreen onSave={s => {
          setSetup(s);
          localStorage.setItem(getPlannerSetupKey(), JSON.stringify(s));
          schedulePlannerSync(); // ← sync setup to cloud
        }} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {showAddModal && (
        <AddTaskModal
          defaultDate={addModalDate}
          onAdd={handleAdd}
          onClose={() => { setShowAddModal(false); setAddModalDate(undefined); }}
        />
      )}

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-slate-500 text-sm font-medium mb-1">Your preparation</p>
          <h2 className="text-3xl font-black text-[#002045] tracking-tight">Exam Planner</h2>
          <p className="text-slate-400 text-sm mt-1">
            {totalTasks} tasks · {doneTasks} done · {completionPct}% complete
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#002045] to-[#1e40af] text-white rounded-xl font-bold text-sm shadow-md hover:opacity-90 transition-all">
          <Plus size={16} /> Add Task
        </button>
      </div>

      {/* ── Countdown Hero ─────────────────────────────────────────────────── */}
      <div className={cn('bg-gradient-to-br text-white rounded-2xl p-6 shadow-lg', urgencyBg)}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Exam Countdown</p>
            <p className="text-6xl font-black leading-none">{daysLeft ?? '—'}</p>
            <p className="text-white/80 text-sm mt-1 font-medium">days left for RRB Group D</p>
          </div>
          <div className="bg-white/15 rounded-2xl p-4 text-right">
            <p className="text-white/60 text-xs font-bold mb-1">Cutoff ({setup.category})</p>
            <p className="text-3xl font-black">{cutoff}</p>
            <p className="text-white/60 text-xs">Safe zone: 85+</p>
          </div>
        </div>

        {/* Task completion progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-white/60 mb-1.5">
            <span>Task Completion Progress</span>
            <span>{doneTasks}/{totalTasks} tasks ({completionPct}%)</span>
          </div>
          <div className="h-3 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full rounded-full bg-white transition-all duration-700"
              style={{ width: `${completionPct}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: '🔥', val: streak, label: 'Streak' },
            { icon: '✅', val: doneTasks, label: 'Done' },
            { icon: '⏳', val: pendingTasks, label: 'Pending' },
            { icon: '⚠️', val: overdueTasks, label: 'Overdue' },
          ].map(s => (
            <div key={s.label} className="bg-white/15 rounded-xl p-3 text-center">
              <div className="text-lg mb-0.5">{s.icon}</div>
              <div className="text-xl font-black">{s.val}</div>
              <div className="text-[10px] text-white/60 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab Bar ─────────────────────────────────────────────────────────── */}
      <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-slate-100 gap-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn('flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all relative',
                isActive ? 'bg-[#002045] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50')}>
              <Icon size={15} />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.id === 'tasks' && taskBadge > 0 && !isActive && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {taskBadge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* OVERVIEW TAB                                                          */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Tasks" value={totalTasks} icon={ListTodo} bgColor="bg-[#1a237e]"
              subtext={`${doneTasks} completed`} />
            <StatCard label="Completion" value={`${completionPct}%`} icon={Trophy} bgColor={completionPct >= 60 ? 'bg-green-700' : completionPct >= 30 ? 'bg-amber-600' : 'bg-red-700'}
              subtext={`${pendingTasks} remaining`} trend={completionPct >= 70 ? 'up' : 'down'} />
            <StatCard label="Today's Tasks" value={`${todayDone}/${todayTasks.length}`} icon={Star} bgColor="bg-amber-600"
              subtext={todayTasks.length === 0 ? 'No tasks today' : todayDone === todayTasks.length ? '🎉 All done!' : `${todayTasks.length - todayDone} left`} />
            <StatCard label="Overdue" value={overdueTasks} icon={AlertTriangle} bgColor={overdueTasks > 0 ? 'bg-red-600' : 'bg-green-700'}
              subtext={overdueTasks === 0 ? 'Nothing overdue!' : 'Needs attention'} />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Daily Task Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={18} className="text-[#002045]" />
                <h3 className="font-black text-[#002045] text-sm">Daily Tasks (Last 14 Days)</h3>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyChartData} margin={{ left: -20, right: 5, top: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<TaskTooltip />} />
                  <Bar dataKey="done" fill="#16a34a" radius={[4, 4, 0, 0]} name="Done" stackId="a" />
                  <Bar dataKey="pending" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Pending" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-2 text-[10px] font-bold text-slate-500">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-600 inline-block" />Completed</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-slate-200 inline-block" />Pending</span>
              </div>
            </div>

            {/* Cumulative Progress Area Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={18} className="text-[#002045]" />
                <h3 className="font-black text-[#002045] text-sm">Progress Trend</h3>
                <span className="text-xs text-slate-400 ml-auto">Higher = more tasks done</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={cumulativeData} margin={{ left: -20, right: 5, top: 5 }}>
                  <defs>
                    <linearGradient id="progressGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1e40af" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1e40af" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ProgressTooltip />} />
                  <ReferenceLine y={80} stroke="#16a34a" strokeDasharray="4 4" strokeWidth={1.5}
                    label={{ value: '80% goal', fontSize: 9, fill: '#16a34a', fontWeight: 700, position: 'insideTopRight' }} />
                  <Area type="monotone" dataKey="pct" stroke="#1e40af" strokeWidth={3}
                    fill="url(#progressGrad)"
                    dot={{ r: 4, fill: '#1e40af', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: '#1e40af', strokeWidth: 2, stroke: '#fff' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Subject Breakdown */}
          {subjectData.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-5">
                <BookOpen size={18} className="text-[#002045]" />
                <h3 className="font-black text-[#002045] text-sm">Subject-wise Task Completion</h3>
              </div>
              <div className="space-y-4">
                {subjectData.map(d => (
                  <div key={d.subject}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: SUBJECT_COLORS[d.subject] }} />
                        {d.subject}
                      </span>
                      <span className="text-xs text-slate-500 font-bold">{d.done}/{d.total} · <span style={{ color: accuracyColor(d.pct) }}>{d.pct}%</span></span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${d.pct}%`, background: SUBJECT_COLORS[d.subject] }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Today's task quick view */}
          {todayTasks.length > 0 && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-blue-800 flex items-center gap-2">
                  <Clock size={16} /> Today's Tasks
                  <span className="text-xs font-bold bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">
                    {todayDone}/{todayTasks.length}
                  </span>
                </h3>
                <button onClick={() => setActiveTab('tasks')} className="text-xs font-bold text-blue-600 hover:underline">View all →</button>
              </div>
              <div className="space-y-2">
                {todayTasks.map(t => (
                  <TaskCard key={t.id} task={t} onToggle={handleToggle} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {totalTasks === 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
              <ListTodo size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="font-black text-slate-600 text-lg mb-2">No tasks yet</p>
              <p className="text-slate-400 text-sm mb-6">Add study tasks with due dates and watch your progress graph rise as you complete them!</p>
              <button onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#002045] to-[#1e40af] text-white rounded-xl font-bold shadow-md hover:opacity-90 transition-all">
                <Plus size={16} /> Add Your First Task
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TASKS TAB                                                             */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'tasks' && (
        <div className="space-y-5">
          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-[#002045] text-sm flex items-center gap-2"><ClipboardList size={16} /> All Tasks</h3>
              <button onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#002045] text-white rounded-xl font-bold text-xs hover:opacity-90 transition-all">
                <Plus size={13} /> Add Task
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Date filter */}
              <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {/* Subject filter */}
              <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="all">All Subjects</option>
                {(['Mathematics', 'Reasoning', 'General Science', 'General Awareness', 'Revision', 'Mock Test', 'Other'] as Task['subject'][]).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {/* Status filter */}
              <div className="flex gap-1">
                {(['all', 'pending', 'done', 'overdue'] as const).map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)}
                    className={cn('flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all',
                      filterStatus === s ? 'bg-[#002045] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {(filterDate || filterSubject !== 'all' || filterStatus !== 'all') && (
              <button onClick={() => { setFilterDate(''); setFilterSubject('all'); setFilterStatus('all'); }}
                className="text-xs text-blue-600 hover:underline font-bold flex items-center gap-1">
                <X size={12} /> Clear filters
              </button>
            )}
          </div>

          {/* Task List */}
          {filteredTasks.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center">
              <CheckCheck size={40} className="mx-auto text-slate-200 mb-3" />
              <p className="font-bold text-slate-500">No tasks match your filters</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map(t => (
                <TaskCard key={t.id} task={t} onToggle={handleToggle} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* CALENDAR TAB                                                          */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'planner' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Month nav */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <button onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500 hover:text-[#002045]">
                <ChevronLeft size={18} />
              </button>
              <h3 className="font-black text-[#002045] text-base">
                {currentMonth.toLocaleDateString('en', { month: 'long', year: 'numeric' })}
              </h3>
              <button onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500 hover:text-[#002045]">
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="p-4">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <div key={d} className="text-center text-[11px] font-bold text-slate-400 py-1">{d}</div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isToday = ds === dateKey(today);
                  const isExam = examDate && ds === dateKey(examDate);
                  const dayTasks = tasks.filter(t => t.dueDate === ds);
                  const allDone = dayTasks.length > 0 && dayTasks.every(t => t.completed);
                  const hasPending = dayTasks.some(t => !t.completed);
                  const hasOverdue = !isToday && ds < dateKey(today) && hasPending;

                  return (
                    <button key={day}
                      onClick={() => { setAddModalDate(ds); setShowAddModal(true); }}
                      className={cn(
                        'aspect-square rounded-xl flex flex-col items-center justify-center relative text-xs font-bold transition-all hover:scale-105 active:scale-95',
                        isExam ? 'bg-red-50 border-2 border-red-400 text-red-600 shadow-sm' :
                          isToday ? 'bg-[#002045] text-white shadow-md' :
                            allDone ? 'bg-green-50 border-2 border-green-300 text-green-700' :
                              hasPending && !hasOverdue ? 'bg-blue-50 border-2 border-blue-300 text-blue-700' :
                                hasOverdue ? 'bg-red-50 border-2 border-orange-300 text-orange-700' :
                                  'hover:bg-slate-50 text-slate-500'
                      )}>
                      <span>{day}</span>
                      {isExam && <span className="text-[9px] leading-none">🎯</span>}
                      {!isExam && dayTasks.length > 0 && (
                        <span className={cn('text-[8px] leading-none font-black',
                          allDone ? 'text-green-600' : hasOverdue ? 'text-orange-500' : 'text-blue-600')}>
                          {allDone ? '✓' : `${dayTasks.filter(t => t.completed).length}/${dayTasks.length}`}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-slate-100">
                {[
                  { cls: 'bg-green-50 border-2 border-green-300', label: 'All done' },
                  { cls: 'bg-blue-50 border-2 border-blue-300', label: 'Has tasks' },
                  { cls: 'bg-red-50 border-2 border-orange-300', label: 'Overdue' },
                  { cls: 'bg-[#002045]', label: 'Today' },
                  { cls: 'bg-red-50 border-2 border-red-400', label: 'Exam day' },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className={cn('w-3.5 h-3.5 rounded-md', l.cls)} />
                    <span className="text-[11px] font-medium text-slate-400">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 text-center">📅 Tap any day to add a task for that date</p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SETTINGS TAB                                                          */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'settings' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-5">
            <h3 className="font-black text-[#002045] flex items-center gap-2"><Settings size={18} /> Settings</h3>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Exam Date</label>
              <input type="date" defaultValue={setup.examDate}
                onChange={e => setSettingsForm(p => ({ ...p, examDate: e.target.value }))}
                className="w-full rounded-xl px-4 py-3 text-sm border border-slate-200 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Category</label>
              <div className="grid grid-cols-4 gap-2">
                {(['General', 'OBC', 'SC', 'ST'] as const).map(c => (
                  <button key={c} onClick={() => setSettingsForm(p => ({ ...p, category: c }))}
                    className={cn('py-2.5 rounded-xl text-sm font-bold border-2 transition-all',
                      (settingsForm.category || setup.category) === c
                        ? 'bg-[#002045] text-white border-[#002045]'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300')}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Daily Study Hours</label>
              <div className="grid grid-cols-3 gap-2">
                {(['1-2 hrs', '3-4 hrs', '5+ hrs'] as const).map(h => (
                  <button key={h} onClick={() => setSettingsForm(p => ({ ...p, dailyHours: h }))}
                    className={cn('py-2.5 rounded-xl text-sm font-bold border-2 transition-all',
                      (settingsForm.dailyHours || setup.dailyHours) === h
                        ? 'bg-[#002045] text-white border-[#002045]'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300')}>
                    {h}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => {
              const u = { ...setup, ...settingsForm } as Setup;
              setSetup(u);
              localStorage.setItem(getPlannerSetupKey(), JSON.stringify(u));
              schedulePlannerSync(); // ← sync to cloud
              setSettingsForm({});
            }}
              className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-[#002045] to-[#1e40af] shadow-sm hover:opacity-90 transition-all">
              Save Changes
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-3">
            {!resetConfirm ? (
              <button onClick={() => setResetConfirm(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 border border-red-200 hover:bg-red-50 transition-colors">
                <RotateCcw size={16} /> Reset All Data
              </button>
            ) : (
              <div className="flex gap-3">
                <button onClick={() => {
                  setTasks([]);
                  setSetup(null);
                  localStorage.removeItem(getPlannerSetupKey());
                  localStorage.removeItem(getPlannerTasksKey());
                  setResetConfirm(false);
                }}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors">
                  ⚠️ Confirm Reset
                </button>
                <button onClick={() => setResetConfirm(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
