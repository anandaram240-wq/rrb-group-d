import React, { useState, useMemo } from 'react';
import { BookOpen, ChevronRight, CheckCircle2, XCircle, Search, BarChart3, Zap, Filter } from 'lucide-react';
import { SolutionDisplay } from './SolutionDisplay';
import { cn } from '../lib/utils';
import { cleanText } from '../lib/cleanText';
import pyqsData from '../data/pyqs.json';

interface PYQ {
  id: number;
  subject: string;
  topic: string;
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

export function PracticeEngine() {
  const allQuestions = pyqsData as PYQ[];

  // ── ALL useState FIRST (React rules of hooks) ──────────────────────────────
  const subjects = useMemo(() => {
    const subjs: string[] = [];
    allQuestions.forEach(q => { if (!subjs.includes(q.subject)) subjs.push(q.subject); });
    return subjs;
  }, [allQuestions]);

  const [selectedSubject, setSelectedSubject] = useState(() => subjects[0] || '');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<number, { selected: number; correct: boolean }>>({});
  const [isPracticing, setIsPracticing] = useState(false);

  // ── useMemo AFTER state declarations ──────────────────────────────────────
  // Build dynamic syllabus from actual data
  const syllabus = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    allQuestions.forEach(q => {
      if (!map[q.subject]) map[q.subject] = {};
      if (!map[q.subject][q.topic]) map[q.subject][q.topic] = 0;
      map[q.subject][q.topic]++;
    });
    return map;
  }, [allQuestions]);

  // Questions filtered by year+difficulty only (NOT topic) — drives topic card counts
  const baseFilteredQuestions = useMemo(() => {
    let qs = allQuestions.filter(q => q.subject === selectedSubject);
    if (difficultyFilter !== 'all') qs = qs.filter(q => q.difficulty === difficultyFilter);
    if (yearFilter !== 'all') qs = qs.filter(q => q.exam_year === yearFilter);
    return qs;
  }, [allQuestions, selectedSubject, difficultyFilter, yearFilter]);

  // Only show topics that have questions matching current year+difficulty filters
  const topics = useMemo(() => {
    if (!selectedSubject) return [];
    const topicSet = new Set(baseFilteredQuestions.map(q => q.topic));
    return Object.keys(syllabus[selectedSubject] || {}).filter(t => topicSet.has(t));
  }, [selectedSubject, syllabus, baseFilteredQuestions]);

  // Filter questions
  const filteredQuestions = useMemo(() => {
    let qs = allQuestions.filter(q => q.subject === selectedSubject);
    if (selectedTopic !== 'all') qs = qs.filter(q => q.topic === selectedTopic);
    if (difficultyFilter !== 'all') qs = qs.filter(q => q.difficulty === difficultyFilter);
    if (yearFilter !== 'all') qs = qs.filter(q => q.exam_year === yearFilter);
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      qs = qs.filter(q => q.question.toLowerCase().includes(query));
    }
    return qs;
  }, [allQuestions, selectedSubject, selectedTopic, difficultyFilter, yearFilter, searchQuery]);

  const currentQ = filteredQuestions[currentQIndex];

  const stats = useMemo(() => {
    const answered = Object.keys(answeredQuestions).length;
    const correct = Object.values(answeredQuestions).filter(a => a.correct).length;
    return { answered, correct, accuracy: answered > 0 ? Math.round((correct / answered) * 100) : 0 };
  }, [answeredQuestions]);

  const handleSelectAnswer = (idx: number) => {
    if (selectedAnswer !== null) return; // Already answered
    setSelectedAnswer(idx);
    const isCorrect = idx === currentQ.correctAnswer;
    setAnsweredQuestions(prev => ({ ...prev, [currentQ.id]: { selected: idx, correct: isCorrect } }));
  };

  const handleNext = () => {
    if (currentQIndex < filteredQuestions.length - 1) {
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
    setIsPracticing(true);
    setCurrentQIndex(0);
    setSelectedAnswer(null);
    setShowSolution(false);
    setAnsweredQuestions({});
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

  // Practice Mode UI
  if (isPracticing && currentQ) {
    return (
      <div className="space-y-6">
        {/* Practice Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPracticing(false)}
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
              <div className="w-px h-8 bg-surface-container-high"></div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase">Correct</p>
                <p className="text-lg font-black text-tertiary">{stats.correct}</p>
              </div>
              <div className="w-px h-8 bg-surface-container-high"></div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase">Accuracy</p>
                <p className="text-lg font-black text-secondary">{stats.accuracy}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high overflow-hidden">

          {/* ── Metadata Banner: Date | Shift | Year ─────────────────────── */}
          {currentQ.exam_year && (
            <div className={cn(
              "flex items-center gap-0 border-b text-xs font-bold tracking-wide overflow-hidden",
              currentQ.source?.includes('2018')
                ? "bg-amber-50 border-amber-200"
                : "bg-primary/5 border-primary/15"
            )}>
              {/* Date pill */}
              {currentQ.exam_date && (
                <div className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 border-r",
                  currentQ.source?.includes('2018') ? "border-amber-200 text-amber-800" : "border-primary/15 text-primary"
                )}>
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>{currentQ.exam_date}</span>
                </div>
              )}
              {/* Shift pill */}
              {currentQ.shift && (
                <div className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 border-r",
                  currentQ.source?.includes('2018') ? "border-amber-200 text-amber-800" : "border-primary/15 text-primary"
                )}>
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>{currentQ.shift}</span>
                </div>
              )}
              {/* Year pill */}
              <div className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 border-r",
                currentQ.source?.includes('2018') ? "border-amber-200 text-amber-800" : "border-primary/15 text-primary"
              )}>
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
                <span>RRB Group D {currentQ.exam_year}</span>
              </div>
              {/* 2018 badge */}
              {currentQ.source?.includes('2018') && (
                <div className="ml-auto px-4 py-2.5 text-amber-700 flex items-center gap-1.5">
                  <span>📋</span>
                  <span>Official PYQ</span>
                </div>
              )}
            </div>
          )}

          {/* ── Question counter + difficulty + topic ──────────────────────── */}
          <div className="px-6 py-3 border-b border-surface-container bg-surface-container-low/30 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="bg-primary text-white px-3 py-1 rounded-lg text-sm font-bold">
                Q {currentQIndex + 1} / {filteredQuestions.length}
              </span>
              <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase", getDifficultyColor(currentQ.difficulty))}>
                {currentQ.difficulty}
              </span>
            </div>
            <span className="text-xs font-medium text-on-surface-variant">{currentQ.subject} › {currentQ.topic}</span>
          </div>

          <div className="p-8">
            <p className="text-lg font-medium text-on-surface mb-8 leading-relaxed">{cleanText(currentQ.question)}</p>

            <div className="space-y-3 max-w-3xl">
              {currentQ.options.map((opt, idx) => {
                let stateClass = "border-surface-container-high hover:border-primary/30 hover:bg-surface-container-lowest cursor-pointer";
                if (selectedAnswer !== null) {
                  if (idx === currentQ.correctAnswer) {
                    stateClass = "border-tertiary bg-tertiary-fixed/15 shadow-sm";
                  } else if (idx === selectedAnswer && idx !== currentQ.correctAnswer) {
                    stateClass = "border-error bg-error-container/30";
                  } else {
                    stateClass = "border-surface-container-high opacity-50";
                  }
                }
                return (
                  <div
                    key={idx}
                    onClick={() => handleSelectAnswer(idx)}
                    className={cn("flex items-center gap-4 p-4 rounded-xl border-2 transition-all", stateClass)}
                  >
                    <span className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0",
                      selectedAnswer !== null && idx === currentQ.correctAnswer ? "bg-tertiary text-white" :
                        selectedAnswer !== null && idx === selectedAnswer ? "bg-error text-white" :
                          "bg-surface-container text-on-surface-variant"
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
            {selectedAnswer !== null && (
              <SolutionDisplay
                solution={currentQ.solution}
                isVisible={showSolution}
                onToggle={() => setShowSolution(!showSolution)}
              />
            )}
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
            <span className="text-xs font-bold text-on-surface-variant">
              {currentQIndex + 1} of {filteredQuestions.length}
            </span>
            <button
              onClick={handleNext}
              disabled={currentQIndex === filteredQuestions.length - 1}
              className="px-5 py-2.5 bg-primary text-white rounded-lg font-bold disabled:opacity-40 flex items-center gap-2 hover:bg-primary-container transition-colors"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Selection UI
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-primary tracking-tight">Practice Engine</h2>
          <p className="text-on-surface-variant text-sm mt-2">
            {allQuestions.length.toLocaleString()} Real PYQs (2018, 2022, 2025-2026) • Subject → Topic drill-down
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
          // Count respects year+difficulty filters for the badge
          const filteredCount = (() => {
            let qs = allQuestions.filter(q => q.subject === subject);
            if (difficultyFilter !== 'all') qs = qs.filter(q => q.difficulty === difficultyFilter);
            if (yearFilter !== 'all') qs = qs.filter(q => q.exam_year === yearFilter);
            return qs.length;
          })();
          const totalCount = allQuestions.filter(q => q.subject === subject).length;
          const topicCount = Object.keys(syllabus[subject]).length;
          const isActive = selectedSubject === subject;
          const hasFilter = yearFilter !== 'all' || difficultyFilter !== 'all';

          return (
            <button
              key={subject}
              onClick={() => {
                setSelectedSubject(subject);
                setSelectedTopic('all');
              }}
              className={cn(
                "relative overflow-hidden rounded-2xl p-5 text-left transition-all duration-300 border-2",
                isActive
                  ? "border-primary shadow-lg scale-[1.02]"
                  : "border-transparent shadow-sm hover:shadow-md hover:scale-[1.01]"
              )}
            >
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-10", getSubjectColor(subject))}></div>
              <div className="relative z-10">
                <div className="text-3xl mb-3">{getSubjectIcon(subject)}</div>
                <h3 className="font-bold text-primary text-sm mb-1">{subject}</h3>
                <p className="text-xs text-on-surface-variant">
                  {hasFilter ? (
                    <><span className="font-bold text-primary">{filteredCount.toLocaleString()}</span> / {totalCount.toLocaleString()} PYQs • {topicCount} Topics</>
                  ) : (
                    <>{totalCount.toLocaleString()} PYQs • {topicCount} Topics</>
                  )}
                </p>
              </div>
              {isActive && (
                <div className="absolute top-3 right-3 w-3 h-3 bg-primary rounded-full animate-pulse"></div>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container-high">
            <h3 className="font-bold text-primary mb-4 flex items-center gap-2 text-sm">
              <Filter size={16} /> Filters
            </h3>

            {/* Topic Filter */}
            <div className="mb-4">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase mb-2 block">Topic</label>
              <select
                className="w-full bg-surface-container p-2 rounded-lg text-sm border-none focus:ring-2 focus:ring-primary outline-none"
                value={selectedTopic}
                onChange={e => { setSelectedTopic(e.target.value); }}
              >
                <option value="all">All Topics ({baseFilteredQuestions.length})</option>
                {topics.map(topic => {
                  const count = baseFilteredQuestions.filter(q => q.topic === topic).length;
                  return <option key={topic} value={topic}>{topic} ({count})</option>;
                })}
              </select>
            </div>


            {/* Difficulty Filter */}
            <div className="mb-4">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase mb-2 block">Difficulty</label>
              <div className="flex gap-2 flex-wrap">
                {['all', 'easy', 'medium', 'hard'].map(d => (
                  <button
                    key={d}
                    onClick={() => setDifficultyFilter(d)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors",
                      difficultyFilter === d ? "bg-primary text-white" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                    )}
                  >
                    {d === 'all' ? 'All' : d}
                  </button>
                ))}
              </div>
            </div>

            {/* Year Filter */}
            <div className="mb-4">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase mb-2 block">📋 Exam Year</label>
              <select
                className="w-full bg-surface-container p-2 rounded-lg text-sm border-none focus:ring-2 focus:ring-primary outline-none"
                value={yearFilter}
                onChange={e => { setYearFilter(e.target.value); setSelectedTopic('all'); }}
              >
                <option value="all">All Years ({allQuestions.filter(q => q.subject === selectedSubject).length} Qs)</option>
                {[...new Set(allQuestions.filter(q => q.subject === selectedSubject).map(q => q.exam_year))]
                  .sort((a, b) => b.localeCompare(a))
                  .map(yr => {
                    const count = allQuestions.filter(q => q.subject === selectedSubject && q.exam_year === yr).length;
                    return <option key={yr} value={yr}>{yr} — {count} Qs</option>;
                  })
                }
              </select>
            </div>

            {/* Stats */}
            <div className="pt-4 border-t border-surface-container">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 size={14} className="text-primary" />
                <span className="text-xs font-bold text-primary">Matching PYQs</span>
              </div>
              <p className="text-3xl font-black text-primary">{filteredQuestions.length.toLocaleString()}</p>
            </div>
          </div>

          {/* Start Practice Button */}
          {filteredQuestions.length > 0 && (
            <button
              onClick={startPractice}
              className="w-full bg-primary text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-container transition-colors shadow-md hover:shadow-lg"
            >
              <Zap size={18} /> Start Practice ({filteredQuestions.length} Qs)
            </button>
          )}
        </div>

        {/* Topic Cards — counts always match active year+difficulty filter */}
        <div className="lg:col-span-3">
          {topics.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
              <span className="text-5xl mb-4">🔍</span>
              <p className="font-bold text-primary">No questions match the selected filters</p>
              <p className="text-sm mt-1">Try selecting a different year or difficulty</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topics.map(topic => {
              // Counts respect year + difficulty filters
              const topicQs = baseFilteredQuestions.filter(q => q.topic === topic);
              const allTopicQs = allQuestions.filter(q => q.subject === selectedSubject && q.topic === topic);
              const easy = topicQs.filter(q => q.difficulty === 'easy').length;
              const medium = topicQs.filter(q => q.difficulty === 'medium').length;
              const hard = topicQs.filter(q => q.difficulty === 'hard').length;
              const isSelected = selectedTopic === topic;
              const hasFilter = yearFilter !== 'all' || difficultyFilter !== 'all';

              return (
                <div
                  key={topic}
                  onClick={() => setSelectedTopic(topic)}
                  className={cn(
                    "bg-surface-container-lowest rounded-xl p-5 shadow-sm border-2 cursor-pointer transition-all hover:shadow-md",
                    isSelected ? "border-primary bg-primary/[0.02]" : "border-surface-container-high hover:border-primary/30"
                  )}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-primary text-sm leading-snug flex-1 pr-2">{topic}</h4>
                    <div className="text-right shrink-0">
                      <span className="text-lg font-black text-primary">{topicQs.length}</span>
                      {hasFilter && topicQs.length !== allTopicQs.length && (
                        <p className="text-[9px] text-on-surface-variant">of {allTopicQs.length}</p>
                      )}
                    </div>
                  </div>

                  <p className="text-[10px] text-on-surface-variant mb-3">
                    {topicQs.length} {hasFilter && yearFilter !== 'all' ? `${yearFilter} ` : ''}Questions
                  </p>

                  {/* Difficulty Bar */}
                  <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden bg-surface-container mb-2">
                    {easy > 0 && <div className="bg-emerald-400 rounded-full" style={{ width: `${(easy / topicQs.length) * 100}%` }}></div>}
                    {medium > 0 && <div className="bg-amber-400 rounded-full" style={{ width: `${(medium / topicQs.length) * 100}%` }}></div>}
                    {hard > 0 && <div className="bg-red-400 rounded-full" style={{ width: `${(hard / topicQs.length) * 100}%` }}></div>}
                  </div>
                  <div className="flex gap-3 text-[10px] text-on-surface-variant">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>{easy} Easy</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>{medium} Med</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>{hard} Hard</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
