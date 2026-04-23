import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Clock, AlertCircle, CheckCircle2, ChevronRight, ChevronLeft, XCircle, Eye, EyeOff, Award, BarChart3, ArrowLeft } from 'lucide-react';
import { SolutionDisplay } from './SolutionDisplay';
import { cn } from '../lib/utils';
import { cleanText } from '../lib/cleanText';
import { startLiveSession, trackAnswer, finalizeSession } from '../lib/performanceEngine';
import { enrichSolution, enrichedToText } from '../lib/solutionEnricher';

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
  shift: string;
  tags: string[];
}

interface TakeTestProps {
  title: string;
  questions: PYQ[];
  duration: number; // minutes
  subject?: string;
  onClose: () => void;
  onComplete: (score: number) => void;
}

export function TakeTest({ title, questions, duration, subject, onClose, onComplete }: TakeTestProps) {
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<number, boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSolutions, setShowSolutions] = useState(false);
  const [reviewQuestion, setReviewQuestion] = useState<number | null>(null);

  // ── Start live session the moment TakeTest mounts ───────────────────────
  const sessionStarted = useRef(false);
  useEffect(() => {
    if (!sessionStarted.current) {
      sessionStarted.current = true;
      startLiveSession('Mock Test', subject || 'All', 'All');
    }
  }, []);

  useEffect(() => {
    if (timeLeft <= 0 && !isSubmitted) {
      handleSubmit();
      return;
    }
    if (isSubmitted) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (optionIndex: number) => {
    if (isSubmitted) return;
    setAnswers(prev => ({ ...prev, [currentQuestion]: optionIndex }));
    // ── REAL-TIME SAVE: track this answer immediately ───────────────────
    const q = questions[currentQuestion];
    if (q) trackAnswer(q.id, q.subject, q.topic, optionIndex === q.correctAnswer);
  };

  const handleClear = () => {
    const newAnswers = { ...answers };
    delete newAnswers[currentQuestion];
    setAnswers(newAnswers);
  };

  const handleMarkReview = () => {
    setMarkedForReview(prev => ({ ...prev, [currentQuestion]: !prev[currentQuestion] }));
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    const score = calculateScore();
    onComplete(score.correct);
    // ── Finalize: all answers already saved in real-time, just persist the session ──
    finalizeSession(questions.length);
  };

  const calculateScore = () => {
    let correct = 0;
    let wrong = 0;
    let unanswered = 0;

    questions.forEach((q, i) => {
      if (answers[i] === undefined) {
        unanswered++;
      } else if (answers[i] === q.correctAnswer) {
        correct++;
      } else {
        wrong++;
      }
    });

    const totalMarks = correct * 1 - wrong * 0.33;
    return { correct, wrong, unanswered, totalMarks: Math.max(0, totalMarks) };
  };

  // Results Screen
  if (isSubmitted && !showSolutions) {
    const score = calculateScore();
    const percentage = Math.round((score.correct / questions.length) * 100);

    // Subject-wise breakdown
    const subjectBreakdown: Record<string, { correct: number; wrong: number; total: number }> = {};
    questions.forEach((q, i) => {
      if (!subjectBreakdown[q.subject]) subjectBreakdown[q.subject] = { correct: 0, wrong: 0, total: 0 };
      subjectBreakdown[q.subject].total++;
      if (answers[i] === q.correctAnswer) subjectBreakdown[q.subject].correct++;
      else if (answers[i] !== undefined) subjectBreakdown[q.subject].wrong++;
    });

    return (
      <div className="fixed inset-0 z-50 bg-surface overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 py-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Award size={48} className="text-primary" />
            </div>
            <h2 className="text-3xl font-black text-primary mb-2">Test Completed!</h2>
            <p className="text-on-surface-variant">{title}</p>
          </div>

          {/* Score Card */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-lg border border-surface-container-high p-8 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="text-center">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-1">Score</p>
                <p className="text-3xl font-black text-primary">{score.totalMarks.toFixed(1)}</p>
                <p className="text-xs text-on-surface-variant">/ {questions.length}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-1">Correct</p>
                <p className="text-3xl font-black text-tertiary">{score.correct}</p>
                <p className="text-xs text-on-surface-variant">+{score.correct} marks</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-1">Wrong</p>
                <p className="text-3xl font-black text-error">{score.wrong}</p>
                <p className="text-xs text-on-surface-variant">-{(score.wrong * 0.33).toFixed(2)} marks</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-1">Accuracy</p>
                <p className="text-3xl font-black text-secondary">{percentage}%</p>
                <p className="text-xs text-on-surface-variant">{score.unanswered} skipped</p>
              </div>
            </div>

            {/* Subject Breakdown */}
            {Object.keys(subjectBreakdown).length > 1 && (
              <div>
                <h4 className="font-bold text-primary text-sm mb-4 flex items-center gap-2">
                  <BarChart3 size={16} /> Subject-wise Breakdown
                </h4>
                <div className="space-y-3">
                  {Object.entries(subjectBreakdown).map(([subj, data]) => {
                    const pct = Math.round((data.correct / data.total) * 100);
                    return (
                      <div key={subj} className="flex items-center gap-4">
                        <span className="text-sm font-medium text-primary w-44 shrink-0 truncate">{subj}</span>
                        <div className="flex-1 h-3 bg-surface-container rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-primary to-tertiary rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                        </div>
                        <span className="text-sm font-bold text-primary w-20 text-right">{data.correct}/{data.total}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowSolutions(true)}
              className="flex-1 bg-primary text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-container transition-colors"
            >
              <Eye size={18} /> Review Solutions
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-surface-container text-primary py-3.5 rounded-xl font-bold hover:bg-surface-container-high transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Solutions Review Screen
  if (isSubmitted && showSolutions) {
    const rQ = reviewQuestion !== null ? reviewQuestion : 0;
    const q = questions[rQ];
    const userAnswer = answers[rQ];
    const isCorrect = userAnswer === q.correctAnswer;

    return (
      <div className="fixed inset-0 z-50 bg-surface flex flex-col">
        {/* Top Bar */}
        <div className="bg-primary text-white px-6 py-3 flex justify-between items-center shadow-md">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowSolutions(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="font-bold">Solution Review — {title}</h2>
              <p className="text-xs text-primary-fixed-dim">Q{rQ + 1} of {questions.length}</p>
            </div>
          </div>
          <button onClick={onClose} className="px-4 py-2 bg-white/10 text-white text-sm font-bold rounded-lg hover:bg-white/20 transition-colors">
            Exit
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Question Content */}
          <div className="flex-1 flex flex-col p-6 overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-sm font-bold">Q{rQ + 1}</span>
              {userAnswer === undefined ? (
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-surface-container text-on-surface-variant">Skipped</span>
              ) : isCorrect ? (
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-tertiary-fixed/20 text-tertiary flex items-center gap-1"><CheckCircle2 size={12} /> Correct</span>
              ) : (
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-error-container/30 text-error flex items-center gap-1"><XCircle size={12} /> Wrong</span>
              )}
              <span className="text-[10px] text-on-surface-variant font-medium">{q.subject} › {q.topic}</span>
            </div>

            <p className="text-lg font-medium text-on-surface mb-6 leading-relaxed">{cleanText(q.question)}</p>

            <div className="space-y-3 max-w-3xl mb-6">
              {q.options.map((opt, idx) => {
                let stateClass = "border-surface-container-high";
                if (idx === q.correctAnswer) stateClass = "border-tertiary bg-tertiary-fixed/10";
                if (idx === userAnswer && idx !== q.correctAnswer) stateClass = "border-error bg-error-container/20";

                return (
                  <div key={idx} className={cn("flex items-center gap-4 p-4 rounded-xl border-2 transition-all", stateClass)}>
                    <span className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0",
                      idx === q.correctAnswer ? "bg-tertiary text-white" :
                        idx === userAnswer ? "bg-error text-white" :
                          "bg-surface-container text-on-surface-variant"
                    )}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="font-medium text-on-surface flex-1">{cleanText(opt)}</span>
                    {idx === q.correctAnswer && <CheckCircle2 className="text-tertiary shrink-0" size={18} />}
                    {idx === userAnswer && idx !== q.correctAnswer && <XCircle className="text-error shrink-0" size={18} />}
                  </div>
                );
              })}
            </div>

            {/* Solution & Explanation */}
            {q.solution && (() => {
              const enriched = enrichSolution({
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer,
                subject: q.subject,
                topic: q.topic,
                existingSolution: q.solution,
              });
              const finalSolution = enriched ? enrichedToText(enriched) : q.solution;
              return (
                <div className="mb-6">
                  <SolutionDisplay
                    solution={finalSolution}
                    isVisible={true}
                    onToggle={() => {}}
                    alwaysShow={true}
                  />
                </div>
              );
            })()}

            {/* Navigation */}
            <div className="mt-auto pt-4 flex justify-between items-center border-t border-surface-container">
              <button
                onClick={() => setReviewQuestion(Math.max(0, rQ - 1))}
                disabled={rQ === 0}
                className="px-4 py-2 bg-surface-container text-on-surface rounded-lg font-bold disabled:opacity-40 flex items-center gap-1"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <button
                onClick={() => setReviewQuestion(Math.min(questions.length - 1, rQ + 1))}
                disabled={rQ === questions.length - 1}
                className="px-4 py-2 bg-primary text-white rounded-lg font-bold disabled:opacity-40 flex items-center gap-1"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Question Palette */}
          <div className="w-72 bg-surface-container-lowest border-l border-surface-container flex flex-col hidden lg:flex">
            <div className="p-4 border-b border-surface-container">
              <h3 className="font-bold text-primary mb-3 text-sm">Question Palette</h3>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-tertiary rounded-sm"></div> Correct</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-error rounded-sm"></div> Wrong</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-surface-container-high rounded-sm"></div> Skipped</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-primary rounded-sm"></div> Current</div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const userAns = answers[idx];
                  let color = "bg-surface-container-high text-on-surface-variant";
                  if (userAns !== undefined) {
                    color = userAns === q.correctAnswer ? "bg-tertiary text-white" : "bg-error text-white";
                  }
                  return (
                    <button
                      key={idx}
                      onClick={() => setReviewQuestion(idx)}
                      className={cn(
                        "aspect-square rounded-lg font-bold text-xs flex items-center justify-center transition-all",
                        color,
                        rQ === idx && "ring-2 ring-primary ring-offset-2"
                      )}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Live Test Screen
  const q = questions[currentQuestion];
  const timePercent = (timeLeft / (duration * 60)) * 100;
  const isUrgent = timeLeft < 300; // Less than 5 minutes

  return (
    <div className="fixed inset-0 z-50 bg-surface flex flex-col">
      {/* Top Bar */}
      <div className={cn("px-6 py-3 flex justify-between items-center shadow-md transition-colors", isUrgent ? "bg-error" : "bg-primary", "text-white")}>
        <div>
          <h2 className="font-bold text-lg">{title}</h2>
          <p className="text-xs opacity-70">{subject || 'Full Mock Test'} • {questions.length} Questions</p>
        </div>
        <div className="flex items-center gap-6">
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xl font-bold",
            isUrgent ? "bg-white/20 animate-pulse" : "bg-black/20"
          )}>
            <Clock size={20} />
            {formatTime(timeLeft)}
          </div>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to submit? You cannot change answers after submission.')) {
                handleSubmit();
              }
            }}
            className="bg-white/20 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-white/30 transition-colors"
          >
            Submit Test
          </button>
        </div>
      </div>

      {/* Timer Progress Bar */}
      <div className="h-1 bg-surface-container-high">
        <div className={cn("h-full transition-all duration-1000", isUrgent ? "bg-error" : "bg-tertiary")} style={{ width: `${timePercent}%` }}></div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-surface-container">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-primary">Question {currentQuestion + 1}</h3>
              <span className="text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded font-medium">
                {q.subject} › {q.topic}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-xs font-bold px-2 py-1 bg-tertiary-fixed/20 text-tertiary rounded">+1 Mark</span>
              <span className="text-xs font-bold px-2 py-1 bg-error/10 text-error rounded">-0.33 Mark</span>
            </div>
          </div>

          <div className="text-lg text-on-surface mb-8 max-w-3xl leading-relaxed">{cleanText(q.question)}</div>

          <div className="space-y-3 max-w-2xl">
            {q.options.map((opt, idx) => (
              <label
                key={idx}
                onClick={() => handleAnswer(idx)}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                  answers[currentQuestion] === idx
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-surface-container-high hover:border-primary/30 hover:bg-surface-container-lowest"
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                  answers[currentQuestion] === idx ? "border-primary bg-primary" : "border-on-surface-variant"
                )}>
                  {answers[currentQuestion] === idx && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                </div>
                <span className="font-medium text-on-surface">{cleanText(opt)}</span>
              </label>
            ))}
          </div>

          <div className="mt-auto pt-6 flex items-center justify-between border-t border-surface-container">
            <div className="flex gap-3">
              <button
                onClick={handleMarkReview}
                className={cn(
                  "px-5 py-2 rounded-lg text-sm font-bold transition-colors",
                  markedForReview[currentQuestion]
                    ? "bg-secondary-container text-on-secondary-container"
                    : "border border-surface-container-high text-on-surface-variant hover:bg-surface-container"
                )}
              >
                {markedForReview[currentQuestion] ? '✓ Marked' : 'Mark for Review'}
              </button>
              <button
                onClick={handleClear}
                className="px-5 py-2 border border-surface-container-high text-on-surface-variant rounded-lg text-sm font-bold hover:bg-surface-container transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
                className="px-4 py-2 bg-surface-container text-on-surface rounded-lg font-bold disabled:opacity-40 flex items-center gap-1"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <button
                onClick={() => setCurrentQuestion(prev => Math.min(questions.length - 1, prev + 1))}
                disabled={currentQuestion === questions.length - 1}
                className="px-5 py-2 bg-primary text-white rounded-lg font-bold disabled:opacity-40 flex items-center gap-1 hover:bg-primary-container"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Question Palette */}
        <div className="w-72 bg-surface-container-lowest border-l border-surface-container flex flex-col hidden lg:flex">
          <div className="p-4 border-b border-surface-container">
            <h3 className="font-bold text-primary mb-3 text-sm">Question Palette</h3>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-primary rounded-sm"></div> Answered</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-surface-container-high rounded-sm"></div> Not Answered</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-secondary-container rounded-sm"></div> Marked</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-primary rounded-sm"></div> Current</div>
            </div>
          </div>

          {/* Answer Summary */}
          <div className="px-4 py-3 border-b border-surface-container">
            <div className="flex justify-between text-[10px] font-bold text-on-surface-variant">
              <span>Answered: {Object.keys(answers).length}</span>
              <span>Remaining: {questions.length - Object.keys(answers).length}</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-5 gap-2">
              {questions.map((_, idx) => {
                let stateClass = "bg-surface-container-high text-on-surface-variant";
                if (answers[idx] !== undefined) stateClass = "bg-primary text-white";
                if (markedForReview[idx]) stateClass = "bg-secondary-container text-on-secondary-container";

                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentQuestion(idx)}
                    className={cn(
                      "aspect-square rounded-lg font-bold text-xs flex items-center justify-center transition-all hover:scale-105",
                      stateClass,
                      currentQuestion === idx && "ring-2 ring-primary ring-offset-2"
                    )}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
