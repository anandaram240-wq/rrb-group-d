import React, { useState } from 'react';
import { BarChart3, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../lib/utils';
import { TOPIC_META, REVISION_PLAN, HEAT_COLORS } from '../data/roadmapData';

const SUBJECTS = ['Reasoning', 'Mathematics', 'General Science', 'General Awareness'];
const SUBJ_ICONS: Record<string, string> = { Reasoning: '🧩', Mathematics: '📐', 'General Science': '🔬', 'General Awareness': '🌍' };

export function TopicHeatmap() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('Reasoning');
  const topics = Object.entries(TOPIC_META).filter(([, m]) => m.subject === active);
  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high shadow-sm overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-primary" />
          <span className="font-bold text-sm text-primary">PYQ Topic Heatmap</span>
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{Object.keys(TOPIC_META).length} topics</span>
        </div>
        {open ? <ChevronUp size={15} className="text-on-surface-variant" /> : <ChevronDown size={15} className="text-on-surface-variant" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-4 pb-4">
              <div className="flex gap-2 mb-3 flex-wrap">
                {(['heavy', 'medium', 'light'] as const).map(h => (
                  <span key={h} className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', HEAT_COLORS[h].bg, HEAT_COLORS[h].text, HEAT_COLORS[h].border)}>
                    {HEAT_COLORS[h].label} {h === 'heavy' ? '≥100 Qs' : h === 'medium' ? '40–99 Qs' : '<40 Qs'}
                  </span>
                ))}
              </div>
              <div className="flex gap-2 mb-3 flex-wrap">
                {SUBJECTS.map(s => (
                  <button key={s} onClick={() => setActive(s)} className={cn('text-xs font-bold px-3 py-1.5 rounded-lg transition-colors', active === s ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high')}>
                    {SUBJ_ICONS[s]} {s}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {topics.map(([name, meta]) => {
                  const hc = HEAT_COLORS[meta.heat];
                  return (
                    <div key={name} className={cn('rounded-xl p-3 border', hc.bg, hc.border)}>
                      <p className={cn('text-xs font-bold leading-tight mb-1', hc.text)}>{name}</p>
                      <div className="flex items-center gap-1">
                        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', hc.badge)} />
                        <span className={cn('text-[10px] font-bold', hc.text)}>{meta.pyqCount} Qs</span>
                      </div>
                      <p className="text-[9px] text-on-surface-variant mt-0.5">~{meta.estimatedHours}h study</p>
                      {meta.tips[0] && <p className="text-[9px] text-on-surface-variant mt-1 leading-tight opacity-75 line-clamp-2">{meta.tips[0]}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function RevisionPlanner() {
  return (
    <div className="bg-gradient-to-br from-primary/5 to-tertiary/5 border-2 border-primary/20 rounded-2xl p-5">
      <h3 className="font-bold text-primary flex items-center gap-2 mb-4">
        <Shield size={18} /> Last 7 Days Before Exam — Rapid Revision Plan
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {REVISION_PLAN.map(d => (
          <div key={d.day} className={cn('rounded-xl p-4 border', d.color)}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-black">Day {d.day}</span>
              <span className="text-xs font-bold">{d.hours}h</span>
            </div>
            <p className="text-xs font-bold mb-1">{d.label}</p>
            <p className="text-[11px] leading-relaxed opacity-80 mb-2">{d.focus}</p>
            <div className="flex flex-wrap gap-1">
              {d.topics.map(t => <span key={t} className="text-[9px] font-bold bg-white/60 px-1.5 py-0.5 rounded">{t}</span>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
