import React, { useState } from 'react';
import { Flame, CheckCircle2, Trophy } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface StreakData { current: number; best: number; lastDate: string; }
const SK2 = 'rrb_streak_v2';
const TODAY = () => new Date().toISOString().slice(0, 10);
function loadS(): StreakData {
  try { return JSON.parse(localStorage.getItem(SK2) || '{"current":0,"best":0,"lastDate":""}'); }
  catch { return { current: 0, best: 0, lastDate: '' }; }
}

export function StreakTracker() {
  const [s, setS] = useState<StreakData>(loadS);
  const markedToday = s.lastDate === TODAY();
  const mark = () => {
    if (markedToday) return;
    const today = TODAY();
    const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const cur = s.lastDate === yest ? s.current + 1 : 1;
    const upd = { current: cur, best: Math.max(cur, s.best), lastDate: today };
    localStorage.setItem(SK2, JSON.stringify(upd));
    setS(upd);
  };
  return (
    <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-4 flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-md">
          <Flame size={22} className="text-white" />
        </div>
        <div>
          <p className="text-2xl font-black text-orange-600">{s.current} <span className="text-sm font-bold text-orange-500">day streak</span></p>
          <p className="text-[11px] text-orange-400 font-medium">🏆 Best: {s.best} days</p>
        </div>
      </div>
      <div className="flex-1 flex justify-end">
        {markedToday
          ? <span className="flex items-center gap-2 text-sm font-bold text-green-700 bg-green-100 border border-green-200 px-4 py-2 rounded-xl"><CheckCircle2 size={16} /> Studied Today ✓</span>
          : <button onClick={mark} className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold text-sm px-4 py-2 rounded-xl transition-all shadow-md">
              <Flame size={16} /> Mark Today as Studied
            </button>
        }
      </div>
      <p className="w-full text-[11px] text-orange-400">Streak resets if you miss a day. Study every day to keep it going!</p>
    </div>
  );
}

export function MilestoneTimeline({ progressPct }: { progressPct: number }) {
  const milestones = [
    { pct: 25, label: 'Foundation\nDone' },
    { pct: 50, label: 'Core\nComplete' },
    { pct: 75, label: 'Advanced\nDone' },
    { pct: 100, label: 'Exam\nReady' },
  ];
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container-high shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-primary flex items-center gap-2"><Trophy size={16} /> Milestone Progress</h4>
        <span className="text-xs font-black text-primary">{Math.round(progressPct)}% complete</span>
      </div>
      <div className="relative h-3 bg-surface-container-high rounded-full overflow-hidden mb-5">
        <motion.div className="h-full rounded-full bg-gradient-to-r from-primary to-tertiary" initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: 1.2, ease: 'easeOut' }} />
      </div>
      <div className="grid grid-cols-4 gap-1">
        {milestones.map(m => {
          const done = progressPct >= m.pct;
          return (
            <div key={m.pct} className="flex flex-col items-center gap-1.5">
              <div className={cn('w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-black transition-all', done ? 'bg-tertiary border-tertiary text-white shadow-md' : 'bg-surface border-surface-container-high text-on-surface-variant')}>
                {done ? '✓' : `${m.pct}%`}
              </div>
              <p className={cn('text-[9px] text-center font-bold leading-tight whitespace-pre-line', done ? 'text-tertiary' : 'text-on-surface-variant')}>{m.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
