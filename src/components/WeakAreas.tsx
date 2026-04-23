import React, { useState, useMemo, useCallback } from 'react';
import {
  AlertTriangle, Flag, RotateCcw, Target, XCircle,
  CheckCircle2, Zap, BookMarked, BarChart3, X, ChevronRight,
  ArrowLeft, Play, Circle,
} from 'lucide-react';
import {
  getAllFlagged, removeFlag, clearAllFlags, getFlaggedBySubjectTopic,
  type ConfusionEntry,
} from '../lib/confusionTracker';
import { cn } from '../lib/utils';
import { cleanText } from '../lib/cleanText';
import pyqsData from '../data/pyqs.json';

interface PracticeQ {
  id: number;
  subject: string;
  topic: string;
  question: string;
  options: string[];
  correctAnswer: number;
  solution: string;
}

const SUBJECT_META: Record<string, { icon: string; color: string; bg: string; border: string }> = {
  'Mathematics':       { icon: '📐', color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  'Reasoning':         { icon: '🧩', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  'General Science':   { icon: '🔬', color: 'text-emerald-700',bg: 'bg-emerald-50',border: 'border-emerald-200' },
  'General Awareness': { icon: '🌍', color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
};

// ── Inline Practice Component ────────────────────────────────────────────────
function InlinePractice({
  flaggedEntries,
  title,
  onClose,
  onRemoveFlag,
}: {
  flaggedEntries: ConfusionEntry[];
  title: string;
  onClose: () => void;
  onRemoveFlag: (id: number) => void;
}) {
  const allQ = pyqsData as PracticeQ[];

  const questions = useMemo(() => {
    const ids = new Set(flaggedEntries.map(e => e.id));
    // Filter actual question data by flagged IDs — shuffle for variety
    const matched = allQ.filter(q => ids.has(q.id));
    // Fisher-Yates shuffle
    for (let i = matched.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [matched[i], matched[j]] = [matched[j], matched[i]];
    }
    return matched;
  }, [flaggedEntries]);

  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [cleared, setCleared] = useState<Set<number>>(new Set());

  const activeQuestions = useMemo(
    () => questions.filter(q => !cleared.has(q.id)),
    [questions, cleared]
  );

  const currentQ = activeQuestions[idx];

  // ── Done state ────────────────────────────────────────────────────────────
  if (!currentQ) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-16 h-16 bg-tertiary/10 rounded-2xl flex items-center justify-center mx-auto">
          <CheckCircle2 size={32} className="text-tertiary" />
        </div>
        <h3 className="text-xl font-black text-primary">Practice Complete!</h3>
        <p className="text-sm text-on-surface-variant">
          {cleared.size > 0 ? `✅ ${cleared.size} question${cleared.size > 1 ? 's' : ''} removed from Weak Areas` : 'All questions reviewed'}
        </p>
        <p className="text-xs text-on-surface-variant">
          Tip: Re-practice any remaining flagged questions regularly until you score 90%+
        </p>
        <button
          onClick={onClose}
          className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90"
        >
          Back to Weak Areas
        </button>
      </div>
    );
  }

  const isCorrect = selected !== null && selected === currentQ.correctAnswer;

  const handleNext = () => {
    const next = Math.min(idx, activeQuestions.length - 2);
    setIdx(Math.max(0, next));
    setSelected(null);
  };

  const handleClearAndNext = () => {
    onRemoveFlag(currentQ.id);
    setCleared(prev => new Set([...prev, currentQ.id]));
    setIdx(prev => Math.max(0, Math.min(prev, activeQuestions.length - 2)));
    setSelected(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-surface-container">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-container rounded-lg transition-colors"
          >
            <ArrowLeft size={16} className="text-on-surface-variant" />
          </button>
          <div>
            <p className="text-sm font-black text-primary">{title}</p>
            <p className="text-xs text-on-surface-variant">
              Q {idx + 1} / {activeQuestions.length}
              {cleared.size > 0 && <span className="text-tertiary ml-1">· {cleared.size} cleared ✅</span>}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-black bg-error/10 text-error px-2 py-1 rounded-full flex items-center gap-1">
          <Flag size={9} /> {activeQuestions.length} flagged
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-tertiary rounded-full transition-all"
          style={{ width: `${Math.round(((idx + 1) / activeQuestions.length) * 100)}%` }}
        />
      </div>

      {/* Question card */}
      <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high overflow-hidden">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-[10px] font-black bg-error/10 text-error px-2 py-0.5 rounded-full flex items-center gap-1">
              <Flag size={9} /> Flagged Q
            </span>
            <span className="text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
              {currentQ.topic}
            </span>
            <span className="text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
              {currentQ.subject}
            </span>
          </div>

          <p className="text-sm font-medium text-on-surface leading-relaxed mb-5">
            {cleanText(currentQ.question)}
          </p>

          <div className="space-y-2">
            {currentQ.options.map((opt, i) => {
              let stateClass = 'border-surface-container-high hover:border-primary/30 hover:bg-surface-container-low cursor-pointer';
              if (selected !== null) {
                if (i === currentQ.correctAnswer) stateClass = 'border-tertiary bg-tertiary/10';
                else if (i === selected) stateClass = 'border-error bg-error/10';
                else stateClass = 'border-surface-container-high opacity-40';
              }
              return (
                <div
                  key={i}
                  onClick={() => selected === null && setSelected(i)}
                  className={cn('flex items-center gap-3 p-3 rounded-xl border-2 transition-all', stateClass)}
                >
                  <span className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0',
                    selected !== null && i === currentQ.correctAnswer ? 'bg-tertiary text-white' :
                    selected !== null && i === selected ? 'bg-error text-white' :
                    'bg-surface-container text-on-surface-variant'
                  )}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-sm text-on-surface flex-1">{cleanText(opt)}</span>
                  {selected !== null && i === currentQ.correctAnswer && <CheckCircle2 size={16} className="text-tertiary shrink-0" />}
                  {selected !== null && i === selected && i !== currentQ.correctAnswer && <XCircle size={16} className="text-error shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Result block */}
        {selected !== null && (
          <div className={cn(
            'border-t p-4',
            isCorrect ? 'bg-tertiary/5 border-tertiary/20' : 'bg-error/5 border-error/20'
          )}>
            <p className={cn('text-sm font-black mb-2', isCorrect ? 'text-tertiary' : 'text-error')}>
              {isCorrect
                ? '✅ Correct! You can remove this flag now.'
                : `❌ Wrong — Correct: ${currentQ.options[currentQ.correctAnswer]}`}
            </p>
            {currentQ.solution && (
              <p className="text-xs text-on-surface-variant leading-relaxed mt-1">
                {currentQ.solution.substring(0, 250)}{currentQ.solution.length > 250 ? '…' : ''}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      {selected !== null && (
        <div className="flex gap-2">
          {isCorrect && (
            <button
              onClick={handleClearAndNext}
              className="flex-1 py-2.5 bg-tertiary text-white rounded-xl text-sm font-bold hover:bg-tertiary/90 flex items-center justify-center gap-1.5 transition-colors"
            >
              <XCircle size={14} /> Remove Flag
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 flex items-center justify-center gap-1.5 transition-colors"
          >
            {idx < activeQuestions.length - 1 ? <>Next <ChevronRight size={14} /></> : 'Finish'}
          </button>
        </div>
      )}

      {selected === null && (
        <p className="text-center text-xs text-on-surface-variant italic">Tap an option to answer</p>
      )}
    </div>
  );
}

// ── Topic Block ──────────────────────────────────────────────────────────────
function TopicBlock({
  subject,
  topic,
  entries,
  onRemoveEntry,
}: {
  subject: string;
  topic: string;
  entries: ConfusionEntry[];
  onRemoveEntry: (id: number) => void;
}) {
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const meta = SUBJECT_META[subject] ?? { icon: '📚', color: 'text-primary', bg: 'bg-surface-container', border: 'border-surface-container-high' };

  // When practice is open, show inline practice in place of normal view
  if (practiceOpen) {
    return (
      <div className={cn('rounded-xl border overflow-hidden', meta.border)}>
        <div className="bg-surface-container-lowest p-4">
          <InlinePractice
            flaggedEntries={entries}
            title={`${topic}`}
            onClose={() => setPracticeOpen(false)}
            onRemoveFlag={(id) => {
              onRemoveEntry(id);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border overflow-hidden', meta.border)}>
      <button
        onClick={() => setExpanded(p => !p)}
        className={cn('w-full flex items-center justify-between p-4 text-left gap-3', meta.bg)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className={cn('px-2 py-1 rounded-lg text-xs font-black border', meta.bg, meta.color, meta.border)}>
            {entries.length} flagged
          </span>
          <div className="min-w-0">
            <p className={cn('text-sm font-bold truncate', meta.color)}>{topic}</p>
            <p className="text-[10px] text-on-surface-variant">{subject}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Practice RIGHT HERE — no navigation */}
          <button
            onClick={e => { e.stopPropagation(); setPracticeOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Play size={10} /> Practice Here
          </button>
          <ChevronRight size={14} className={cn('text-on-surface-variant transition-transform', expanded && 'rotate-90')} />
        </div>
      </button>

      {expanded && (
        <div className="bg-surface-container-lowest px-4 py-2">
          {entries.map(e => (
            <div key={e.id} className="flex items-start gap-3 py-3 border-b border-surface-container last:border-0 group">
              <Flag size={12} className="text-error mt-0.5 shrink-0" />
              <p className="text-sm text-on-surface flex-1 leading-relaxed line-clamp-2">{e.questionSnippet}…</p>
              <button
                onClick={() => onRemoveEntry(e.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-error/10 rounded-lg transition-all shrink-0"
                title="Remove flag"
              >
                <XCircle size={14} className="text-error" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── WeakAreas Main ────────────────────────────────────────────────────────────
interface WeakAreasProps {
  /** Optional: kept for compatibility, not used for inline practice */
  onPractice?: (subject: string, topic: string) => void;
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

  const subjectCounts = useMemo(() =>
    Object.entries(grouped).map(([sub, topics]) => ({
      subject: sub,
      count: Object.values(topics).reduce((s, arr) => s + arr.length, 0),
      topicCount: Object.keys(topics).length,
      meta: SUBJECT_META[sub] ?? { icon: '📚', color: 'text-primary', bg: 'bg-surface-container', border: 'border-surface-container-high' },
    })).sort((a, b) => b.count - a.count),
  [grouped]);

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (flagged.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-24 space-y-4">
        <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto">
          <CheckCircle2 size={36} className="text-emerald-500" />
        </div>
        <h2 className="text-2xl font-black text-primary">No Flagged Questions!</h2>
        <p className="text-on-surface-variant text-sm max-w-sm mx-auto">
          While practicing in <strong>Subject Mastery</strong>, tap the{' '}
          <Flag size={12} className="inline text-error mx-1" />
          <strong>Flag</strong> button on any confusing question. It will appear here for dedicated practice.
        </p>
        <div className="mt-8 bg-surface-container rounded-2xl p-6 text-left max-w-sm mx-auto">
          <h3 className="font-bold text-sm text-primary mb-3 flex items-center gap-2">
            <BookMarked size={15} /> How to use Weak Areas
          </h3>
          <ul className="space-y-2 text-xs text-on-surface-variant">
            <li className="flex items-start gap-2"><span className="text-primary font-bold mt-0.5">1.</span> Go to Subject Mastery and pick any topic</li>
            <li className="flex items-start gap-2"><span className="text-primary font-bold mt-0.5">2.</span> Tap 🚩 Flag on any question you find confusing</li>
            <li className="flex items-start gap-2"><span className="text-primary font-bold mt-0.5">3.</span> Come here → click "Practice Here" on any topic</li>
            <li className="flex items-start gap-2"><span className="text-primary font-bold mt-0.5">4.</span> Practice the flagged Qs inline — if you answer correctly, remove the flag ✅</li>
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
            {' '} — Practice them right here without leaving this page
          </p>
        </div>
        <button
          onClick={handleClearAll}
          className="flex items-center gap-2 px-4 py-2 text-error border border-error/20 rounded-xl text-sm font-bold hover:bg-error/5 transition-colors"
        >
          <RotateCcw size={14} /> Clear All
        </button>
      </div>

      {/* Subject bar chart */}
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
          <Target size={10} /> Click "Practice Here" on the topic with most flags — practice stays on this page
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
                      onRemoveEntry={handleRemove}
                    />
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-center">
        <p className="text-xs text-on-surface-variant">
          💡 <span className="font-bold text-primary">Topper tip:</span> Practice your flagged questions daily for 10 minutes.
          Once you answer correctly, remove the flag. Clear all flags in a topic = mastery achieved.
        </p>
      </div>
    </div>
  );
}
