import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  BookOpen, ChevronRight, CheckCircle2, XCircle,
  Search, BarChart3, Zap, Filter, Pencil, X, Save, CheckCircle, Flag
} from 'lucide-react';
import { SolutionDisplay } from './SolutionDisplay';
import { cn } from '../lib/utils';
import { cleanText } from '../lib/cleanText';
import pyqsData from '../data/pyqs.json';
import {
  startLiveSession,
  trackAnswer,
  finalizeSession,
} from '../lib/performanceEngine';
import { enrichSolution, enrichedToText } from '../lib/solutionEnricher';
import { toggleFlag, isFlagged } from '../lib/confusionTracker';

/** Fisher-Yates shuffle (mutates and returns arr) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface PYQ {
  id: number;
  subject: string;
  topic: string;
  sub_topic?: string;
  branch?: string;
  question: string;
  options: string[];
  correctAnswer: number;
  solution: string;
  difficulty: string;
  exam_year: string;
  exam_date?: string;
  shift: string;
  source?: string;
  tags: string[];
}

// ── Canonical topic/sub_topic map for Maths & Reasoning ──────────────────────
const TOPIC_MAP: Record<string, Record<string, string[]>> = {
  Mathematics: {
    'Number System':        ['Prime Numbers','Divisibility','Remainders','Digits','Factors','Consecutive Numbers','Number Properties','HCF & LCM','Fractions'],
    'LCM & HCF':           ['HCF','LCM','HCF & LCM','Bell/Time Problem'],
    'Simplification':      ['BODMAS','Simplification','Evaluate'],
    'Percentage':          ['Basic %','% Change','Election','Successive %','Population','Mixture'],
    'Profit & Loss':       ['Basic P&L','Discount & Marked Price','Successive Discount','Chain Sale','Dishonest Dealings','Buy & Get Free'],
    'Simple Interest':     ['Basic SI','Exact Days SI','Finding Principal','Finding Rate'],
    'Compound Interest':   ['Basic CI','CI vs SI Difference','Half-Yearly Compounding','Quarterly Compounding'],
    'Average':             ['Basic Average','Change in Average','Cricket Average','Weighted Average'],
    'Ratio & Proportion':  ['Division in Ratio','Proportional','Income-Saving Ratio','Variation'],
    'Ages':                ['Two Person Ages','Sum of Ages','Ratio of Ages','Past & Future Ages','Multiplied Age'],
    'Speed Distance & Time':['Basic STD','Trains','Relative Speed','Average Speed','Boats & Streams'],
    'Time & Work':         ['Efficiency','Multiple of Work','Work & Wages','Pipes & Work Combined'],
    'Pipes & Cisterns':    ['Two Pipe','Three Pipe','Leak Problems'],
    'Mensuration':         ['Area','Perimeter','Volume','Surface Area','Cylinder','Cone','Sphere','Cube & Cuboid'],
    'Geometry':            ['Triangles','Quadrilaterals','Circles','Angles & Lines','Polygon Properties'],
    'Trigonometry':        ['Computation','Heights & Distances','Identities'],
    'Algebra':             ['Expressions','Quadratic','Linear Equations (Word)','Missing Value','Commercial Algebra'],
    'Squares & Cube Roots':['Square Roots','Cube Roots','Perfect Squares'],
    'Statistics':          ['Mean','Median','Mode','Frequency Distribution'],
    'Data Interpretation': ['Pie Chart','Bar Graph','Line Graph','Table/Graph'],
    'Mixture & Alligation':['Basic Mixture','Alligation Method','Concentration Mix'],
  },
  Reasoning: {
    'Number Series':           ['Arithmetic Progression','Geometric Progression','Prime Series','Mixed Series','Counting Series'],
    'Letter Series':           ['Mixed','Backward Series','Skip Series','Forward Series'],
    'Analogy':                 ['Word Analogy','Number Analogy','Letter Analogy','Mixed Analogy'],
    'Coding-Decoding':         ['Word Coding','Number Coding','Letter Coding'],
    'Mathematical Operations': ['Symbol Substitution','Operator Replacement','BODMAS'],
    'Classification & Odd One Out': ['Word Odd One Out','Number Odd One Out'],
    'Syllogism':               ['Two Statement','Three Statement','Possibility Cases'],
    'Statement & Conclusion':  ['Assumptions','Arguments','Conclusions'],
    'Blood Relations':         ['Direct Relation','Photo Based','Family Tree'],
    'Direction Sense':         ['Linear Direction','Point Direction','Town Direction','Shadow Problems'],
    'Seating Arrangement':     ['Linear','Circular'],
    'Ranking & Order':         ['Row Position','Rank Order','Number Arrangement','Vertical Stack'],
    'Venn Diagram':            ['Set Relations'],
    'Mirror & Water Image':    ['Lateral Mirror','Horizontal Mirror','Water Image'],
    'Calendar & Clock':        ['Calendar','Clock'],
    'Embedded Figures':        ['Figure Recognition'],
  },
};

// ── Local corrections store ───────────────────────────────────────────────────
const CORR_KEY = 'rrb_topic_corrections';

function loadCorrections(): Record<number, { topic: string; sub_topic: string }> {
  try { return JSON.parse(localStorage.getItem(CORR_KEY) || '{}'); } catch { return {}; }
}
function saveCorrections(c: Record<number, { topic: string; sub_topic: string }>) {
  localStorage.setItem(CORR_KEY, JSON.stringify(c));
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
interface EditModalProps {
  q: PYQ;
  onSave: (id: number, topic: string, sub_topic: string) => void;
  onClose: () => void;
}

function EditModal({ q, onSave, onClose }: EditModalProps) {
  const subjectTopics = TOPIC_MAP[q.subject] || {};
  const topicKeys = Object.keys(subjectTopics);
  const [selTopic, setSelTopic] = useState(q.topic);
  const [selSub, setSelSub] = useState(q.sub_topic || '');
  const [saved, setSaved] = useState(false);

  const subs = subjectTopics[selTopic] || [];

  const handleTopicChange = (t: string) => {
    setSelTopic(t);
    setSelSub((TOPIC_MAP[q.subject]?.[t] || [])[0] || '');
  };

  const handleSave = () => {
    onSave(q.id, selTopic, selSub);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 900);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div>
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <Pencil size={16} /> Edit Classification
            </h3>
            <p className="text-indigo-100 text-xs mt-0.5">Question ID #{q.id}</p>
          </div>
          <button onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Question preview */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3">
            {cleanText(q.question)}
          </p>
          <div className="flex gap-2 mt-2">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
              {q.subject}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              Current: {q.topic} › {q.sub_topic || '—'}
            </span>
          </div>
        </div>

        {/* Selectors */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wide">
              ✏️ Correct Topic
            </label>
            {topicKeys.length > 0 ? (
              <select
                value={selTopic}
                onChange={e => handleTopicChange(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {topicKeys.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={selTopic}
                onChange={e => setSelTopic(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wide">
              🏷️ Correct Sub-Topic
            </label>
            {subs.length > 0 ? (
              <select
                value={selSub}
                onChange={e => setSelSub(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {subs.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={selSub}
                onChange={e => setSelSub(e.target.value)}
                placeholder="Enter sub-topic..."
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saved}
            className={cn(
              "flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all",
              saved
                ? "bg-green-500 scale-95"
                : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md"
            )}
          >
            {saved ? <><CheckCircle size={16} /> Saved!</> : <><Save size={16} /> Save Correction</>}
          </button>
        </div>
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════
//  PRACTICE ENGINE
// ══════════════════════════════════════════════════════════════════

interface PracticeEngineProps {
  initialSubject?: string;
  initialTopic?: string;
}

export function PracticeEngine({ initialSubject, initialTopic }: PracticeEngineProps = {}) {
  const [corrections, setCorrections] = useState(loadCorrections);
  const [editingQ, setEditingQ] = useState<PYQ | null>(null);
  const [editSavedId, setEditSavedId] = useState<number | null>(null);

  // Merge corrections into questions
  const allQuestions = useMemo(() => {
    return (pyqsData as PYQ[]).map(q => {
      const corr = corrections[q.id];
      if (corr) return { ...q, topic: corr.topic, sub_topic: corr.sub_topic };
      return q;
    });
  }, [corrections]);

  const syllabus = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    allQuestions.forEach(q => {
      if (!map[q.subject]) map[q.subject] = {};
      if (!map[q.subject][q.topic]) map[q.subject][q.topic] = 0;
      map[q.subject][q.topic]++;
    });
    return map;
  }, [allQuestions]);

  const subjects = Object.keys(syllabus);
  const [selectedSubject, setSelectedSubject] = useState(() => initialSubject || subjects[0] || '');
  const [selectedTopic, setSelectedTopic] = useState(() => initialTopic || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<number, { selected: number; correct: boolean }>>({});
  const [isPracticing, setIsPracticing] = useState(false);
  // Shuffled question list for this session
  const [sessionQuestions, setSessionQuestions] = useState<typeof filteredQuestions>([]);
  // Flag state for current question
  const [flaggedIds, setFlaggedIds] = useState<Set<number>>(() => {
    // Load all currently flagged ids from confusionTracker
    try {
      const stored = JSON.parse(localStorage.getItem('rrb_confusion_flags') || '[]') as { id: number }[];
      return new Set(stored.map(e => e.id));
    } catch { return new Set(); }
  });

  // ── Auto-finalize if user switches tabs while practicing ──────────────────
  // Store isPracticing in a ref so the cleanup can read the latest value
  const isPracticingRef = useRef(false);
  useEffect(() => { isPracticingRef.current = isPracticing; }, [isPracticing]);

  useEffect(() => {
    return () => {
      // Component unmounting (user left via sidebar) — save whatever was answered
      if (isPracticingRef.current) {
        finalizeSession();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const topics = selectedSubject ? Object.keys(syllabus[selectedSubject] || {}) : [];

  const filteredQuestions = useMemo(() => {
    let qs = allQuestions.filter(q => q.subject === selectedSubject);
    if (branchFilter !== 'all') qs = qs.filter(q => q.branch === branchFilter);
    if (selectedTopic !== 'all') qs = qs.filter(q => q.topic === selectedTopic);
    if (difficultyFilter !== 'all') qs = qs.filter(q => q.difficulty === difficultyFilter);
    if (yearFilter !== 'all') qs = qs.filter(q => q.exam_year === yearFilter);
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      qs = qs.filter(q => q.question.toLowerCase().includes(query));
    }
    return qs;
  }, [allQuestions, selectedSubject, selectedTopic, branchFilter, difficultyFilter, yearFilter, searchQuery]);

  // ── practiceQuestions & currentQ defined here so handlers below can use them ──
  // When practicing: use shuffled sessionQuestions. Otherwise: use filtered list.
  const practiceQuestions = isPracticing && sessionQuestions.length > 0 ? sessionQuestions : filteredQuestions;
  const currentQ = practiceQuestions[currentQIndex];


  const stats = useMemo(() => {
    const answered = Object.keys(answeredQuestions).length;
    const correct = Object.values(answeredQuestions).filter(a => a.correct).length;
    return { answered, correct, accuracy: answered > 0 ? Math.round((correct / answered) * 100) : 0 };
  }, [answeredQuestions]);

  const handleSaveCorrection = useCallback((id: number, topic: string, sub_topic: string) => {
    const updated = { ...corrections, [id]: { topic, sub_topic } };
    setCorrections(updated);
    saveCorrections(updated);
    setEditSavedId(id);
    setTimeout(() => setEditSavedId(null), 2000);
  }, [corrections]);

  const handleSelectAnswer = (idx: number) => {
    if (selectedAnswer !== null || !currentQ) return;
    setSelectedAnswer(idx);
    const isCorrect = idx === currentQ.correctAnswer;
    setAnsweredQuestions(prev => ({ ...prev, [currentQ.id]: { selected: idx, correct: isCorrect } }));
    // ── Track this answer in the live session ──────────────────────────────
    trackAnswer(currentQ.id, currentQ.subject, currentQ.topic, isCorrect);
  };

  const handleNext = () => {
    // practiceQuestions is defined later but handleNext is called inside practice mode
    // so we use sessionQuestions when practicing
    const qs = isPracticing && sessionQuestions.length > 0 ? sessionQuestions : filteredQuestions;
    if (currentQIndex < qs.length - 1) {
      setCurrentQIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowSolution(false);
    }
  };

  const handlePrev = () => {
    if (currentQIndex > 0) {
      setCurrentQIndex(prev => prev - 1);
      setSelectedAnswer(null);
      setShowSolution(false);
    }
  };

  const startPractice = () => {
    // ── Start a new performance-tracking session ───────────────────────────
    startLiveSession('Subject Practice', selectedSubject, selectedTopic === 'all' ? 'All Topics' : selectedTopic);
    // Shuffle questions for this session (Fisher-Yates)
    setSessionQuestions(shuffle(filteredQuestions));
    setIsPracticing(true);
    setCurrentQIndex(0);
    setSelectedAnswer(null);
    setShowSolution(false);
    setAnsweredQuestions({});
  };

  const handleFlagToggle = useCallback(() => {
    if (!currentQ) return;
    const nowFlagged = toggleFlag(
      currentQ.id,
      currentQ.subject,
      currentQ.topic,
      currentQ.sub_topic,
      currentQ.question,
    );
    setFlaggedIds(prev => {
      const next = new Set(prev);
      if (nowFlagged) next.add(currentQ.id); else next.delete(currentQ.id);
      return next;
    });
  }, [currentQ]);

  const exitPractice = () => {
    // ── Finalize & save session to performance engine ─────────────────────
    finalizeSession();
    setIsPracticing(false);
  };

  const getSubjectColor = (subject: string) => {
    const colors: Record<string, string> = {
      'Mathematics': 'from-blue-500 to-indigo-600',
      'Reasoning': 'from-purple-500 to-violet-600',
      'General Science': 'from-emerald-500 to-teal-600',
      'General Awareness': 'from-amber-500 to-orange-600',
    };
    return colors[subject] || 'from-slate-500 to-slate-600';
  };

  const getSubjectIcon = (subject: string) => {
    const icons: Record<string, string> = {
      'Mathematics': '📐',
      'Reasoning': '🧩',
      'General Science': '🔬',
      'General Awareness': '🌍',
    };
    return icons[subject] || '📚';
  };

  const getDifficultyColor = (d: string) => {
    if (d === 'easy') return 'text-emerald-600 bg-emerald-50';
    if (d === 'hard') return 'text-red-600 bg-red-50';
    return 'text-amber-600 bg-amber-50';
  };

  if (isPracticing && currentQ) {
    const isCorrected = !!corrections[currentQ.id];
    const isCurrentFlagged = flaggedIds.has(currentQ.id);

    return (
      <>
        {/* Edit Modal */}
        {editingQ && (
          <EditModal
            q={editingQ}
            onSave={handleSaveCorrection}
            onClose={() => setEditingQ(null)}
          />
        )}

        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={exitPractice}
                className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors"
              >
                <ChevronRight size={18} className="rotate-180 text-primary" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-primary">Practice Mode</h2>
                <p className="text-xs text-on-surface-variant">
                  {selectedSubject} {selectedTopic !== 'all' ? `› ${selectedTopic}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-6 bg-surface-container-lowest px-5 py-2.5 rounded-xl border border-surface-container-high">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase">Answered</p>
                  <p className="text-lg font-black text-primary">{stats.answered}</p>
                </div>
                <div className="w-px h-8 bg-surface-container-high" />
                <div className="text-center">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase">Correct</p>
                  <p className="text-lg font-black text-tertiary">{stats.correct}</p>
                </div>
                <div className="w-px h-8 bg-surface-container-high" />
                <div className="text-center">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase">Accuracy</p>
                  <p className="text-lg font-black text-secondary">{stats.accuracy}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high overflow-hidden">
            {/* Card Header */}
            <div className="p-6 border-b border-surface-container bg-surface-container-low/30 flex justify-between items-center gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="bg-primary text-white px-3 py-1 rounded-lg text-sm font-bold">
                  Q {currentQIndex + 1} / {filteredQuestions.length}
                </span>
                <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase', getDifficultyColor(currentQ.difficulty))}>
                  {currentQ.difficulty}
                </span>
                {currentQ.exam_year && (
                  <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                    {currentQ.exam_date ?? currentQ.exam_year} • {currentQ.shift}
                  </span>
                )}
                {/* Topic + sub_topic badge */}
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded border",
                  isCorrected
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-surface-container text-on-surface-variant border-surface-container-high"
                )}>
                  {isCorrected && '✏️ '}{currentQ.topic}{currentQ.sub_topic ? ` › ${currentQ.sub_topic}` : ''}
                </span>
              </div>

              {/* FLAG (Confused) BUTTON */}
              <button
                onClick={handleFlagToggle}
                title={isCurrentFlagged ? 'Remove confusion flag' : 'Flag as confusing / need to revisit'}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border',
                  isCurrentFlagged
                    ? 'bg-error text-white border-error'
                    : 'bg-surface-container text-on-surface-variant border-surface-container-high hover:bg-error/10 hover:text-error hover:border-error/30'
                )}
              >
                <Flag size={13} />
                {isCurrentFlagged ? 'Flagged' : 'Flag'}
              </button>

              {/* EDIT BUTTON */}
              <button
                onClick={() => setEditingQ(currentQ)}
                title="Report wrong classification"
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                  editSavedId === currentQ.id
                    ? "bg-green-500 text-white border-green-500"
                    : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                )}
              >
                {editSavedId === currentQ.id
                  ? <><CheckCircle size={13} /> Fixed!</>
                  : <><Pencil size={13} /> Edit Topic</>
                }
              </button>
            </div>

            {/* Question Body */}
            <div className="p-8">
              <p className="text-lg font-medium text-on-surface mb-8 leading-relaxed">
                {cleanText(currentQ.question)}
              </p>

              <div className="space-y-3 max-w-3xl">
                {currentQ.options.map((opt, idx) => {
                  let stateClass = 'border-surface-container-high hover:border-primary/30 hover:bg-surface-container-lowest cursor-pointer';
                  if (selectedAnswer !== null) {
                    if (idx === currentQ.correctAnswer) {
                      stateClass = 'border-tertiary bg-tertiary-fixed/15 shadow-sm';
                    } else if (idx === selectedAnswer && idx !== currentQ.correctAnswer) {
                      stateClass = 'border-error bg-error-container/30';
                    } else {
                      stateClass = 'border-surface-container-high opacity-50';
                    }
                  }
                  return (
                    <div
                      key={idx}
                      onClick={() => handleSelectAnswer(idx)}
                      className={cn('flex items-center gap-4 p-4 rounded-xl border-2 transition-all', stateClass)}
                    >
                      <span className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0',
                        selectedAnswer !== null && idx === currentQ.correctAnswer ? 'bg-tertiary text-white' :
                        selectedAnswer !== null && idx === selectedAnswer ? 'bg-error text-white' :
                        'bg-surface-container text-on-surface-variant'
                      )}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="font-medium text-on-surface flex-1">{cleanText(opt)}</span>
                      {selectedAnswer !== null && idx === currentQ.correctAnswer && <CheckCircle2 className="text-tertiary shrink-0" size={20} />}
                      {selectedAnswer !== null && idx === selectedAnswer && idx !== currentQ.correctAnswer && <XCircle className="text-error shrink-0" size={20} />}
                    </div>
                  );
                })}
              </div>

              {/* Solution */}
              {selectedAnswer !== null && currentQ && (() => {
                const enriched = enrichSolution({
                  question: currentQ.question,
                  options: currentQ.options,
                  correctAnswer: currentQ.correctAnswer,
                  subject: currentQ.subject,
                  topic: currentQ.topic,
                  sub_topic: currentQ.sub_topic,
                  existingSolution: currentQ.solution,
                });
                const finalSolution = enriched ? enrichedToText(enriched) : currentQ.solution;
                return (
                  <SolutionDisplay
                    solution={finalSolution}
                    isVisible={showSolution}
                    onToggle={() => setShowSolution(!showSolution)}
                  />
                );
              })()}
            </div>

            {/* Navigation */}
            <div className="p-6 border-t border-surface-container flex justify-between items-center bg-surface-container-low/20">
              <button
                onClick={handlePrev}
                disabled={currentQIndex === 0}
                className="px-5 py-2.5 bg-surface-container text-on-surface rounded-lg font-bold disabled:opacity-40 flex items-center gap-2 hover:bg-surface-container-high transition-colors"
              >
                <ChevronRight size={16} className="rotate-180" /> Previous
              </button>
              <p className="text-xs font-bold text-on-surface-variant">
                {currentQIndex + 1} of {practiceQuestions.length} {isCurrentFlagged && <span className="text-error ml-1">🚩</span>}
              </p>
              <button
                onClick={handleNext}
                disabled={currentQIndex === practiceQuestions.length - 1}
                className="px-5 py-2.5 bg-primary text-white rounded-lg font-bold disabled:opacity-40 flex items-center gap-2 hover:bg-primary-container transition-colors"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Selection UI ───────────────────────────────────────────────────────────
  return (
    <>
      {editingQ && (
        <EditModal
          q={editingQ}
          onSave={handleSaveCorrection}
          onClose={() => setEditingQ(null)}
        />
      )}

      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold text-primary tracking-tight">Practice Engine</h2>
            <p className="text-on-surface-variant text-sm mt-2">
              {allQuestions.length.toLocaleString()} Real PYQs (2018–2026) • Subject → Topic drill-down
              {Object.keys(corrections).length > 0 && (
                <span className="ml-2 text-green-600 font-bold">
                  ✏️ {Object.keys(corrections).length} user corrections active
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search questions..."
                className="pl-9 pr-4 py-2 bg-surface-container-lowest border border-surface-container-high rounded-xl text-sm focus:outline-none focus:border-primary w-64"
              />
            </div>
          </div>
        </div>

        {/* Subject Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {subjects.map(subject => {
            const count = allQuestions.filter(q => q.subject === subject).length;
            const topicCount = Object.keys(syllabus[subject]).length;
            const isActive = selectedSubject === subject;
            return (
              <button
                key={subject}
                onClick={() => { setSelectedSubject(subject); setSelectedTopic('all'); setBranchFilter('all'); }}
                className={cn(
                  'relative overflow-hidden rounded-2xl p-5 text-left transition-all duration-300 border-2',
                  isActive ? 'border-primary shadow-lg scale-[1.02]' : 'border-transparent shadow-sm hover:shadow-md hover:scale-[1.01]'
                )}
              >
                <div className={cn('absolute inset-0 bg-gradient-to-br opacity-10', getSubjectColor(subject))} />
                <div className="relative z-10">
                  <div className="text-3xl mb-3">{getSubjectIcon(subject)}</div>
                  <h3 className="font-bold text-primary text-sm mb-1">{subject}</h3>
                  <p className="text-xs text-on-surface-variant">{count.toLocaleString()} PYQs • {topicCount} Topics</p>
                </div>
                {isActive && <div className="absolute top-3 right-3 w-3 h-3 bg-primary rounded-full animate-pulse" />}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container-high">
              <h3 className="font-bold text-primary mb-4 flex items-center gap-2 text-sm">
                <Filter size={16} /> Filters
              </h3>

              {selectedSubject === 'General Science' && (
                <div className="mb-4">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase mb-2 block">🔬 Branch</label>
                  <div className="flex gap-2 flex-wrap">
                    {['all', 'Physics', 'Chemistry', 'Biology'].map(b => (
                      <button
                        key={b}
                        onClick={() => { setBranchFilter(b); setSelectedTopic('all'); }}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors',
                          branchFilter === b ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                        )}
                      >
                        {b === 'all' ? 'All' : b}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase mb-2 block">Topic</label>
                <select
                  className="w-full bg-surface-container p-2 rounded-lg text-sm border-none focus:ring-2 focus:ring-primary outline-none"
                  value={selectedTopic}
                  onChange={e => setSelectedTopic(e.target.value)}
                >
                  <option value="all">All Topics ({allQuestions.filter(q => q.subject === selectedSubject && (branchFilter === 'all' || q.branch === branchFilter)).length})</option>
                  {topics
                    .filter(topic => branchFilter === 'all' || allQuestions.some(q => q.subject === selectedSubject && q.topic === topic && q.branch === branchFilter))
                    .map(topic => {
                      const count = allQuestions.filter(q => q.subject === selectedSubject && q.topic === topic && (branchFilter === 'all' || q.branch === branchFilter)).length;
                      return <option key={topic} value={topic}>{topic} ({count})</option>;
                    })
                  }
                </select>
              </div>

              <div className="mb-4">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase mb-2 block">Difficulty</label>
                <div className="flex gap-2 flex-wrap">
                  {['all', 'easy', 'medium', 'hard'].map(d => (
                    <button
                      key={d}
                      onClick={() => setDifficultyFilter(d)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors',
                        difficultyFilter === d ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                      )}
                    >
                      {d === 'all' ? 'All' : d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase mb-2 block">📋 Exam Year</label>
                <select
                  className="w-full bg-surface-container p-2 rounded-lg text-sm border-none focus:ring-2 focus:ring-primary outline-none"
                  value={yearFilter}
                  onChange={e => setYearFilter(e.target.value)}
                >
                  <option value="all">All Years</option>
                  {[...new Set(allQuestions.filter(q => q.subject === selectedSubject).map(q => q.exam_year))]
                    .sort((a, b) => b.localeCompare(a))
                    .map(yr => {
                      const count = allQuestions.filter(q => q.subject === selectedSubject && q.exam_year === yr).length;
                      return <option key={yr} value={yr}>{yr} ({count} Qs)</option>;
                    })
                  }
                </select>
              </div>

              <div className="pt-4 border-t border-surface-container">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 size={14} className="text-primary" />
                  <span className="text-xs font-bold text-primary">Matching PYQs</span>
                </div>
                <p className="text-3xl font-black text-primary">{filteredQuestions.length.toLocaleString()}</p>
              </div>
            </div>

            {filteredQuestions.length > 0 && (
              <button
                onClick={startPractice}
                className="w-full bg-primary text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-container transition-colors shadow-md hover:shadow-lg"
              >
                <Zap size={18} /> Start Practice ({filteredQuestions.length} Qs)
              </button>
            )}
          </div>

          {/* Topic Cards */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topics.map(topic => {
                const topicQs = allQuestions.filter(q => q.subject === selectedSubject && q.topic === topic);
                const easy   = topicQs.filter(q => q.difficulty === 'easy').length;
                const medium = topicQs.filter(q => q.difficulty === 'medium').length;
                const hard   = topicQs.filter(q => q.difficulty === 'hard').length;
                const isSelected = selectedTopic === topic;

                return (
                  <div
                    key={topic}
                    onClick={() => setSelectedTopic(topic)}
                    className={cn(
                      'bg-surface-container-lowest rounded-xl p-5 shadow-sm border-2 cursor-pointer transition-all hover:shadow-md',
                      isSelected ? 'border-primary bg-primary/[0.02]' : 'border-surface-container-high hover:border-primary/30'
                    )}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-primary text-sm">{topic}</h4>
                      <span className="text-lg font-black text-primary">{topicQs.length}</span>
                    </div>
                    <p className="text-[10px] text-on-surface-variant mb-3">{topicQs.length} Questions</p>
                    <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden bg-surface-container mb-2">
                      {easy > 0 && <div className="bg-emerald-400 rounded-full" style={{ width: `${(easy / topicQs.length) * 100}%` }} />}
                      {medium > 0 && <div className="bg-amber-400 rounded-full" style={{ width: `${(medium / topicQs.length) * 100}%` }} />}
                      {hard > 0 && <div className="bg-red-400 rounded-full" style={{ width: `${(hard / topicQs.length) * 100}%` }} />}
                    </div>
                    <div className="flex gap-3 text-[10px] text-on-surface-variant">
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />{easy} Easy</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />{medium} Med</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400" />{hard} Hard</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
