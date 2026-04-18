import React, { useState } from 'react';
import { Eye, EyeOff, ChevronDown, ChevronUp, Lightbulb, BookOpen, FlaskConical, Calculator } from 'lucide-react';
import { cn } from '../lib/utils';

interface SolutionDisplayProps {
  solution: string;
  isVisible: boolean;
  onToggle: () => void;
  /** If true, solution is always shown (no toggle button) — used in review mode */
  alwaysShow?: boolean;
}

interface ParsedSolution {
  correctAnswer: string;
  steps: string[];
  keyConcept: string;
  examTip: string;
  rawLines: string[];
}

function parseSolution(raw: string): ParsedSolution {
  const result: ParsedSolution = {
    correctAnswer: '',
    steps: [],
    keyConcept: '',
    examTip: '',
    rawLines: [],
  };

  if (!raw) return result;

  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  let currentSection = '';

  for (const line of lines) {
    // Correct answer line
    if (line.startsWith('✅')) {
      result.correctAnswer = line.replace('✅', '').replace('Correct Answer:', '').trim();
      continue;
    }

    // Section headers
    if (line.startsWith('📖') && line.toLowerCase().includes('step')) {
      currentSection = 'steps';
      continue;
    }
    if (line.startsWith('📖') && !line.toLowerCase().includes('step')) {
      // It's the old-style "📖 Explanation:" header
      currentSection = 'steps';
      continue;
    }
    if (line.startsWith('📐') || line.startsWith('📘')) {
      const content = line.replace(/^[📐📘]\s*(Key Concept|Formula Used|Key Formula|Formula):?\s*/i, '').trim();
      if (content && content !== line) {
        result.keyConcept = content;
      } else {
        result.keyConcept = line.replace(/^[📐📘]\s*/, '').trim();
      }
      currentSection = 'concept';
      continue;
    }
    if (line.startsWith('💡')) {
      const content = line.replace(/^💡\s*(Exam Tip|Tip):?\s*/i, '').trim();
      if (content && content !== line) {
        result.examTip = content;
      } else {
        result.examTip = line.replace(/^💡\s*/, '').trim();
      }
      currentSection = 'tip';
      continue;
    }
    if (line.startsWith('📝')) {
      const content = line.replace(/^📝\s*(Exam Tip|Tip):?\s*/i, '').trim();
      if (content && content !== line) {
        result.examTip = content;
      } else {
        result.examTip = line.replace(/^📝\s*/, '').trim();
      }
      currentSection = 'tip';
      continue;
    }

    // Content under sections
    if (currentSection === 'steps') {
      // Match numbered steps like "1." or "1)" or just content
      const stepMatch = line.match(/^\d+[\.\)]\s*(.*)/);
      if (stepMatch) {
        result.steps.push(stepMatch[1]);
      } else if (line.startsWith('•') || line.startsWith('-')) {
        result.steps.push(line.replace(/^[•\-]\s*/, ''));
      } else if (line.length > 2) {
        // If we have no steps yet but have content, add it
        result.steps.push(line);
      }
    } else if (currentSection === 'concept' && !result.keyConcept) {
      result.keyConcept = line;
    } else if (currentSection === 'tip' && !result.examTip) {
      result.examTip = line;
    } else {
      result.rawLines.push(line);
    }
  }

  // If no steps were parsed, treat all remaining raw lines as steps
  if (result.steps.length === 0 && result.rawLines.length > 0) {
    result.steps = result.rawLines.filter(l => 
      !l.startsWith('✅') && l.length > 3
    );
    result.rawLines = [];
  }

  return result;
}

const stepColors = [
  'from-blue-500/10 to-indigo-500/10 border-blue-500/20',
  'from-violet-500/10 to-purple-500/10 border-violet-500/20',
  'from-teal-500/10 to-emerald-500/10 border-teal-500/20',
  'from-amber-500/10 to-orange-500/10 border-amber-500/20',
  'from-rose-500/10 to-pink-500/10 border-rose-500/20',
  'from-cyan-500/10 to-blue-500/10 border-cyan-500/20',
];

const stepNumberColors = [
  'bg-blue-500',
  'bg-violet-500',
  'bg-teal-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
];

export function SolutionDisplay({ solution, isVisible, onToggle, alwaysShow = false }: SolutionDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const parsed = parseSolution(solution);

  // Toggle button (only when not alwaysShow)
  if (!alwaysShow && !isVisible) {
    return (
      <div className="mt-6">
        <button
          onClick={onToggle}
          className="group flex items-center gap-2.5 px-5 py-3 rounded-xl 
                     bg-gradient-to-r from-primary/5 to-primary/10 
                     border border-primary/15 
                     hover:from-primary/10 hover:to-primary/15 hover:border-primary/25
                     transition-all duration-300"
        >
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Eye size={16} className="text-primary" />
          </div>
          <span className="text-sm font-bold text-primary">View Step-by-Step Solution</span>
          <ChevronDown size={14} className="text-primary/60 ml-1" />
        </button>
      </div>
    );
  }

  const showContent = alwaysShow || isVisible;

  return (
    <div className={cn("mt-6", showContent && "animate-in fade-in slide-in-from-top-2 duration-300")}>
      {/* Header */}
      <div 
        className="flex items-center justify-between px-5 py-3 rounded-t-xl bg-gradient-to-r from-primary/8 to-tertiary/8 border border-primary/15 border-b-0 cursor-pointer"
        onClick={() => alwaysShow ? setIsExpanded(!isExpanded) : onToggle()}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <BookOpen size={16} className="text-primary" />
          </div>
          <span className="text-sm font-bold text-primary">Step-by-Step Solution</span>
        </div>
        <button className="p-1 rounded hover:bg-primary/10 transition-colors">
          {(!alwaysShow) ? (
            <EyeOff size={16} className="text-primary/50" />
          ) : isExpanded ? (
            <ChevronUp size={16} className="text-primary/50" />
          ) : (
            <ChevronDown size={16} className="text-primary/50" />
          )}
        </button>
      </div>

      {/* Content */}
      {(isExpanded || !alwaysShow) && (
        <div className="rounded-b-xl border border-primary/15 border-t-0 bg-surface-container-lowest overflow-hidden">
          {/* Correct Answer Banner */}
          {parsed.correctAnswer && (
            <div className="px-5 py-3 bg-gradient-to-r from-tertiary/10 to-tertiary/5 border-b border-tertiary/10 flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-tertiary flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <span className="font-bold text-tertiary text-sm">{parsed.correctAnswer}</span>
            </div>
          )}

          {/* Steps */}
          {parsed.steps.length > 0 && (
            <div className="p-5 space-y-2.5">
              {parsed.steps.map((step, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "flex items-start gap-3 p-3.5 rounded-xl bg-gradient-to-r border transition-all duration-200 hover:shadow-sm",
                    stepColors[idx % stepColors.length]
                  )}
                >
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0 mt-0.5 shadow-sm",
                    stepNumberColors[idx % stepNumberColors.length]
                  )}>
                    {idx + 1}
                  </div>
                  <p className="text-sm text-on-surface leading-relaxed font-medium flex-1">{step}</p>
                </div>
              ))}
            </div>
          )}

          {/* If no steps were parsed, show raw solution */}
          {parsed.steps.length === 0 && (
            <div className="p-5">
              <div className="text-sm text-on-surface leading-relaxed whitespace-pre-line">
                {solution.split('\n').map((line, i) => {
                  if (!line.trim()) return <div key={i} className="h-2" />;
                  if (line.startsWith('✅')) return <p key={i} className="text-base font-bold text-tertiary mb-2">{line}</p>;
                  return <p key={i} className="text-on-surface">{line}</p>;
                })}
              </div>
            </div>
          )}

          {/* Key Concept */}
          {parsed.keyConcept && (
            <div className="mx-5 mb-4 p-4 rounded-xl bg-gradient-to-r from-indigo-500/8 to-blue-500/8 border border-indigo-500/15">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <Calculator size={16} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Key Concept</p>
                  <p className="text-sm text-on-surface font-medium leading-relaxed">{parsed.keyConcept}</p>
                </div>
              </div>
            </div>
          )}

          {/* Exam Tip */}
          {parsed.examTip && (
            <div className="mx-5 mb-5 p-4 rounded-xl bg-gradient-to-r from-amber-500/8 to-orange-500/8 border border-amber-500/15">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Lightbulb size={16} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Exam Tip</p>
                  <p className="text-sm text-on-surface font-medium leading-relaxed">{parsed.examTip}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
