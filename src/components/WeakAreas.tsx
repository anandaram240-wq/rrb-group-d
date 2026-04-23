import React, { useState, useMemo, useCallback } from 'react';
import {
  AlertTriangle, BookOpen, Trash2, ChevronRight, Flag, RotateCcw,
  Target, XCircle, CheckCircle2, Zap, BookMarked, BarChart3,
} from 'lucide-react';
import {
  getAllFlagged, removeFlag, clearAllFlags, getFlaggedBySubjectTopic,
  type ConfusionEntry,
} from '../lib/confusionTracker';
import { cn } from '../lib/utils';

interface WeakAreasProps {
  onPractice: (subject: string, topic: string) => void;
}

const SUBJECT_META: Record<string, { icon: string; color: string; bg: string; border: string }> = {
  'Mathematics':       { icon: '📐', color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  'Reasoning':         { icon: '🧩', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  'General Science':   { icon: '🔬', color: 'text-emerald-700',bg: 'bg-emerald-50',border: 'border-emerald-200' },
  'General Awareness': { icon: '🌍', color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
};

function FlaggedEntry({ entry, onRemove }: { entry: ConfusionEntry; onRemove: (id: number) => void }) {
  const [removed, setRemoved] = useState(false);
  if (removed) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-surface-container last:border-0 group">
      <Flag size={13} className="text-error mt-0.5 shrink-0" />
      <p className="text-sm text-on-surface flex-1 leading-relaxed line-clamp-2">{entry.questionSnippet}…</p>
      <button
        onClick={() => { setRemoved(true); onRemove(entry.id); }}
        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-error/10 rounded-lg transition-all shrink-0"
        title="Remove flag"
      >
        <XCircle size={14} className="text-error" />
      </button>
    </div>
  );
}

function TopicBlock({
  subject, topic, entries, onPractice, onRemoveEntry,
}: {
  subject: string; topic: string; entries: ConfusionEntry[];
  onPractice: (s: string, t: string) => void;
  onRemoveEntry: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const meta = SUBJECT_META[subject] ?? { icon: '📚', color: 'text-primary', bg: 'bg-surface-container', border: 'border-surface-container-high' };

  return (
    <div className={cn('rounded-xl border overflow-hidden', meta.border)}>
      <button
        onClick={() => setExpanded(p => !p)}
        className={cn('w-full flex items-center justify-between p-4 text-left gap-3', meta.bg)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className={cn('px-2 py-1 rounded-lg text-xs font-black', meta.bg, meta.color, 'border', meta.border)}>
            {entries.length} flagged
          </span>
          <div className="min-w-0">
            <p className={cn('text-sm font-bold truncate', meta.color)}>{topic}</p>
            <p className="text-[10px] text-on-surface-variant">{subject}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={e => { e.stopPropagation(); onPractice(subject, topic); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Zap size={11} /> Practice Again
          </button>
          <ChevronRight size={14} className={cn('text-on-surface-variant transition-transform', expanded && 'rotate-90')} />
        </div>
      </button>

      {expanded && (
        <div className="bg-surface-container-lowest px-4 py-2">
          {entries.map(e => (
            <FlaggedEntry key={e.id} entry={e} onRemove={onRemoveEntry} />
          ))}
        </div>
      )}
    </div>
  );
}

export function WeakAreas({ onPractice }: WeakAreasProps) {
  const [refresh, setRefresh] = useState(0);
  const flagged = useMemo(() => getAllFlagged(), [refresh]);
  const grouped = useMemo(() => getFlaggedBySubjectTopic(), [refresh]);

  const handleRemove = useCallback((id: number) => {
    removeFlag(id);
    setRefresh(r => r + 1);
  }, []);

  const handleClearAll = useCallback(() => {
    if (window.confirm('Clear ALL flagged questions? This cannot be undone.')) {
      clearAllFlags();
      setRefresh(r => r + 1);
    }
  }, []);

  // Stats
  const subjectCounts = useMemo(() =>
    Object.entries(grouped).map(([sub, topics]) => ({
      subject: sub,
      count: Object.values(topics).reduce((s, arr) => s + arr.length, 0),
      topicCount: Object.keys(topics).length,
      meta: SUBJECT_META[sub] ?? { icon: '📚', color: 'text-primary', bg: 'bg-surface-container', border: 'border-surface-container-high' },
    })).sort((a, b) => b.count - a.count),
  [grouped]);

  if (flagged.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-24 space-y-4">
        <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto">
          <CheckCircle2 size={36} className="text-emerald-500" />
        </div>
        <h2 className="text-2xl font-black text-primary">No Flagged Questions!</h2>
        <p className="text-on-surface-variant text-sm max-w-sm mx-auto">
          While practicing, tap the <Flag size={12} className="inline text-error mx-1" /> flag button on any question
          you find confusing or want to revisit. They'll appear here, grouped by topic.
        </p>
        <div className="mt-8 bg-surface-container rounded-2xl p-6 text-left max-w-sm mx-auto">
          <h3 className="font-bold text-sm text-primary mb-3 flex items-center gap-2">
            <BookMarked size={15} /> How to use Weak Areas
          </h3>
          <ul className="space-y-2 text-xs text-on-surface-variant">
            <li className="flex items-start gap-2"><span className="text-primary font-bold mt-0.5">1.</span> Solve any topic in Subject Mastery</li>
            <li className="flex items-start gap-2"><span className="text-primary font-bold mt-0.5">2.</span> Tap 🚩 on questions you find confusing</li>
            <li className="flex items-start gap-2"><span className="text-primary font-bold mt-0.5">3.</span> Come here to see your weak topics grouped by subject</li>
            <li className="flex items-start gap-2"><span className="text-primary font-bold mt-0.5">4.</span> Click "Practice Again" to target that exact topic</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-primary flex items-center gap-2">
            <AlertTriangle className="text-error" size={24} />
            Weak Areas
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            {flagged.length} flagged question{flagged.length !== 1 ? 's' : ''} across {Object.keys(grouped).length} subject{Object.keys(grouped).length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleClearAll}
          className="flex items-center gap-2 px-4 py-2 text-error border border-error/20 rounded-xl text-sm font-bold hover:bg-error/5 transition-colors"
        >
          <RotateCcw size={14} /> Clear All
        </button>
      </div>

      {/* Subject summary bar chart */}
      <div className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container-high shadow-sm">
        <h3 className="text-sm font-bold text-primary flex items-center gap-2 mb-4">
          <BarChart3 size={15} /> Subject-wise Flagged Count
        </h3>
        <div className="space-y-3">
          {subjectCounts.map(({ subject, count, topicCount, meta }) => {
            const maxCount = Math.max(...subjectCounts.map(s => s.count), 1);
            const pct = Math.round((count / maxCount) * 100);
            return (
              <div key={subject}>
                <div className="flex items-center justify-between mb-1">
                  <span className={cn('text-xs font-bold', meta.color)}>
                    {meta.icon} {subject}
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    {count} Qs · {topicCount} topic{topicCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="h-2.5 bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-700', {
                      'bg-blue-400': subject === 'Mathematics',
                      'bg-purple-400': subject === 'Reasoning',
                      'bg-emerald-400': subject === 'General Science',
                      'bg-amber-400': subject === 'General Awareness',
                    })}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-on-surface-variant mt-4 flex items-center gap-1">
          <Target size={10} /> Focus on the longest bars first — those are your weakest areas
        </p>
      </div>

      {/* Grouped topic list */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([subject, topics]) => {
          const meta = SUBJECT_META[subject] ?? SUBJECT_META['Mathematics'];
          return (
            <div key={subject}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{meta.icon}</span>
                <h3 className={cn('font-black text-base', meta.color)}>{subject}</h3>
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', meta.bg, meta.color, meta.border)}>
                  {Object.values(topics).flat().length} flagged
                </span>
              </div>
              <div className="space-y-2">
                {Object.entries(topics)
                  .sort((a, b) => b[1].length - a[1].length)
                  .map(([topic, entries]) => (
                    <TopicBlock
                      key={topic}
                      subject={subject}
                      topic={topic}
                      entries={entries}
                      onPractice={onPractice}
                      onRemoveEntry={handleRemove}
                    />
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action tip */}
      <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-center">
        <p className="text-xs text-on-surface-variant">
          💡 <span className="font-bold text-primary">Pro tip:</span> Click "Practice Again" on the most-flagged topic and solve 10 questions.
          After you answer correctly, remove the flag. This clears your weak spots systematically.
        </p>
      </div>
    </div>
  );
}
