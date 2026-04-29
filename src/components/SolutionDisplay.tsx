import React, { useState } from 'react';
import { Eye, EyeOff, ChevronDown, ChevronUp, Zap, BookOpen, XCircle, Lightbulb, Brain, FlaskConical, Target } from 'lucide-react';
import { cn } from '../lib/utils';

interface SolutionDisplayProps {
  solution: string;
  isVisible: boolean;
  onToggle: () => void;
  alwaysShow?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
//  PARSER — handles BOTH old format (📖 📐 💡) AND new 5-section format
// ─────────────────────────────────────────────────────────────────────────────
interface ParsedSolution {
  answer: string;
  formulaLine: string;   // e.g. "Profit% = (SP−CP)/CP × 100" from [bracket] line
  steps: string[];
  speedTrick: string[];  // [0]=rule name, [1]=numbers→answer
  wrongOptions: string[];
  concept: string[];
  examTip: string;
}

function parse(raw: string): ParsedSolution {
  const out: ParsedSolution = { answer: '', formulaLine: '', steps: [], speedTrick: [], wrongOptions: [], concept: [], examTip: '' };
  if (!raw?.trim()) return out;

  type Sec = 'none' | 'steps' | 'trick' | 'wrong' | 'concept' | 'tip';
  let sec: Sec = 'none';

  for (const rawLine of raw.split('\n')) {
    const t = rawLine.trim();
    if (!t) continue;

    // ── Section headers ──────────────────────────────────────────────
    if (t.startsWith('✅')) {
      out.answer = t.replace(/^✅\s*(ANSWER\s*[::：]?\s*)?/i, '').replace(/^Correct Answer\s*[::：]?\s*/i, '').trim();
      sec = 'none'; continue;
    }
    if (t.startsWith('📝') || t.startsWith('📖')) {
      sec = 'steps';
      const rest = t.replace(/^[📝📖]\s*(SOLUTION|STEP[- ]BY[- ]STEP\s*SOLUTION|Step-by-Step\s*Solution|Explanation)\s*[::：]?\s*/i, '').trim();
      if (rest) out.steps.push(rest);
      continue;
    }
    if (t.startsWith('⚡')) {
      sec = 'trick';
      const rest = t.replace(/^⚡\s*(TRICK|TOP\s*SPEED\s*TRICK|Speed Trick|Shortcut)\s*[::：]?\s*/i, '').trim();
      if (rest) out.speedTrick.push(rest);
      continue;
    }
    if (t.startsWith('❌')) {
      sec = 'wrong';
      const rest = t.replace(/^❌\s*(WHY\s*WRONG\s*OPTIONS?\s*(FAIL)?|Wrong Options?)\s*[::：]?\s*/i, '').trim();
      if (rest) out.wrongOptions.push(rest);
      continue;
    }
    if (t.startsWith('🧠') || t.startsWith('📐') || t.startsWith('📘')) {
      sec = 'concept';
      const rest = t.replace(/^[🧠📐📘]\s*(CONCEPT\s*[+&]\s*FORMULA|Key Concept|Key Formula|Key Approach|Formula Used|Formula)\s*[::：]?\s*/i, '').trim();
      if (rest) out.concept.push(rest);
      continue;
    }
    if (t.startsWith('💡') || t.startsWith('📌')) {
      sec = 'tip';
      const rest = t.replace(/^[💡📌]\s*(Exam Tip|Tip|Note)\s*[::：]?\s*/i, '').trim();
      if (rest) out.examTip = rest;
      continue;
    }

    // ── [Formula/Rule] line: bracketed line in steps or trick section ────────
    if ((sec === 'steps' || sec === 'trick') && /^\[.+\]$/.test(t)) {
      if (sec === 'steps' && !out.formulaLine) {
        out.formulaLine = t.slice(1, -1).trim();
      } else if (sec === 'trick') {
        out.speedTrick.push(t); // keep as-is for trick renderer
      }
      continue;
    }

    // ── Content routing ──────────────────────────────────────────────
    switch (sec) {
      case 'steps':   out.steps.push(t); break;
      case 'trick':   out.speedTrick.push(t); break;
      case 'wrong':   out.wrongOptions.push(t); break;
      case 'concept': out.concept.push(t); break;
      case 'tip':     if (!out.examTip) out.examTip = t; break;
    }
  }

  // ── Post-process: strip leading step numbers ──────────────────────────────────
  out.steps = out.steps
    .map(s => s.replace(/^(step\s*)?\d+[.):\-\s]+\s*/i, '').trim())
    .filter(Boolean);

  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
//  MATH HIGHLIGHTER — makes numbers & operators visually pop in step text
// ─────────────────────────────────────────────────────────────────────────────
function HighlightedText({ text }: { text: string }) {
  // Split on numbers, operators, fractions, percentages
  const parts = text.split(/(\d+\.?\d*%?|\+|\-|×|÷|=|→|∴|≈|√)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (/^[\d.]+%?$/.test(part) && part.length > 0) {
          return <span key={i} className="font-black text-blue-600 bg-blue-50 px-0.5 rounded">{part}</span>;
        }
        if (/^[=→∴≈]$/.test(part)) {
          return <span key={i} className="font-black text-emerald-600 mx-0.5">{part}</span>;
        }
        if (/^[+\-×÷√]$/.test(part)) {
          return <span key={i} className="font-black text-purple-600 mx-0.5">{part}</span>;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  STEP CARD — single numbered step with highlighting
// ─────────────────────────────────────────────────────────────────────────────
const STEP_STYLES = [
  { bg: 'bg-blue-50',   border: 'border-blue-200',   num: 'bg-blue-600',    text: 'text-blue-800'   },
  { bg: 'bg-violet-50', border: 'border-violet-200', num: 'bg-violet-600',  text: 'text-violet-800' },
  { bg: 'bg-teal-50',   border: 'border-teal-200',   num: 'bg-teal-600',    text: 'text-teal-800'   },
  { bg: 'bg-orange-50', border: 'border-orange-200', num: 'bg-orange-500',  text: 'text-orange-800' },
  { bg: 'bg-rose-50',   border: 'border-rose-200',   num: 'bg-rose-600',    text: 'text-rose-800'   },
  { bg: 'bg-cyan-50',   border: 'border-cyan-200',   num: 'bg-cyan-600',    text: 'text-cyan-800'   },
];

function StepCard({ text, idx }: { text: string; idx: number }) {
  const s = STEP_STYLES[idx % STEP_STYLES.length];
  // Detect if this is a formula/calculation line (contains = or →)
  const isCalc = /[=→∴≈]|^\d/.test(text);
  return (
    <div className={cn('flex items-start gap-3 p-3 rounded-xl border', s.bg, s.border)}>
      <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0 mt-0.5 shadow-sm', s.num)}>
        {idx + 1}
      </div>
      <p className={cn('text-sm leading-relaxed flex-1', s.text, isCalc ? 'font-bold' : 'font-medium')}>
        <HighlightedText text={text} />
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  WRONG OPTION CARD
// ─────────────────────────────────────────────────────────────────────────────
const OPT_LABELS = ['A', 'B', 'C', 'D'];

function WrongCard({ text, idx }: { text: string; idx: number }) {
  const optMatch = text.match(/^(option\s*[a-d]|\([a-d]\)|[a-d][.):\s])/i);
  let label = OPT_LABELS[idx] ?? String(idx + 1);
  let body = text;
  if (optMatch) {
    label = optMatch[0].replace(/[^a-dA-D]/g, '').toUpperCase() || label;
    body = text.slice(optMatch[0].length).trim();
  }
  // strip leading "—", "-", ":"
  body = body.replace(/^[-—:]\s*/, '');

  const isPipe = body.includes('|');
  const parts = isPipe ? body.split('|').map(x => x.trim()).filter(Boolean) : [body];

  return (
    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-200">
      <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
        <span className="text-white text-xs font-black">{label}</span>
      </div>
      <div className="flex-1">
        {parts.map((part, pi) => (
          <p key={pi} className={cn('text-sm text-red-800 leading-relaxed', pi > 0 && 'mt-1.5')}>
            {pi > 0 && <span className="text-red-400 font-bold mr-1">▸</span>}
            <HighlightedText text={part} />
          </p>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  FORMULA LINE — renders → or = lines with monospace feel
// ─────────────────────────────────────────────────────────────────────────────
function FormulaLine({ text }: { text: string }) {
  const isFormula = /^[→\->=]|→|:=/.test(text);
  if (isFormula) {
    return (
      <div className="flex items-start gap-2">
        <span className="text-indigo-400 font-black mt-0.5 shrink-0">▶</span>
        <p className="text-sm font-mono font-bold text-indigo-800 bg-indigo-50 border border-indigo-200/80 px-3 py-1.5 rounded-lg flex-1 leading-relaxed">
          {text.replace(/^[→\->]/, '').trim()}
        </p>
      </div>
    );
  }
  return <p className="text-sm text-on-surface font-medium leading-relaxed">{text}</p>;
}

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION BADGE — compact pill on the header to show what's inside
// ─────────────────────────────────────────────────────────────────────────────
function Badge({ color, label }: { color: string; label: string }) {
  return (
    <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider', color)}>
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function SolutionDisplay({ solution, isVisible, onToggle, alwaysShow = false }: SolutionDisplayProps) {
  const [expanded, setExpanded] = useState(true);
  const p = parse(solution ?? '');

  const hasAny = p.answer || p.steps.length || p.speedTrick.length || p.wrongOptions.length || p.concept.length || p.examTip;

  // ── Reveal button (before user clicks) ────────────────────────────────────
  if (!alwaysShow && !isVisible) {
    return (
      <div className="mt-6">
        <button
          onClick={onToggle}
          className="group w-full sm:w-auto flex items-center gap-3 px-6 py-3.5 rounded-2xl
                     bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10
                     border-2 border-dashed border-primary/25
                     hover:border-primary/50 hover:from-blue-600/15 hover:to-purple-600/15
                     transition-all duration-300 shadow-sm hover:shadow-md"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
            <Eye size={17} className="text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-black text-primary">देखो Step-by-Step Solution</p>
            <p className="text-[10px] text-on-surface-variant">Answer + Trick + Formula — सब कुछ</p>
          </div>
          <ChevronDown size={16} className="text-primary/50 ml-auto" />
        </button>
      </div>
    );
  }

  // ── Main solution card ─────────────────────────────────────────────────────
  return (
    <div className={cn('mt-6', (alwaysShow || isVisible) && 'animate-in fade-in slide-in-from-bottom-2 duration-400')}>

      {/* ── MASTER HEADER ─────────────────────────────────────────────────── */}
      <div
        className="relative flex items-center justify-between px-4 py-3 rounded-t-2xl
                   bg-gradient-to-r from-[#1a237e] via-[#283593] to-[#1565c0]
                   cursor-pointer select-none overflow-hidden"
        onClick={() => alwaysShow ? setExpanded(e => !e) : onToggle()}
      >
        {/* background glow */}
        <div className="absolute inset-0 opacity-20"
          style={{ background: 'radial-gradient(ellipse at 30% 50%, #7c4dff 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, #00b0ff 0%, transparent 60%)' }}
        />
        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
            <BookOpen size={17} className="text-white" />
          </div>
          <div>
            <p className="text-white font-black text-sm tracking-wide">Complete Solution</p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {p.answer         && <Badge color="bg-emerald-400/90 text-white" label="Answer" />}
              {p.steps.length   > 0 && <Badge color="bg-blue-400/80 text-white" label={`${p.steps.length} Steps`} />}
              {p.speedTrick.length > 0 && <Badge color="bg-amber-400/90 text-slate-900" label="Speed Trick" />}
              {p.wrongOptions.length > 0 && <Badge color="bg-red-400/80 text-white" label="Why Wrong" />}
              {(p.concept.length > 0 || p.examTip) && <Badge color="bg-purple-400/80 text-white" label="Formula" />}
            </div>
          </div>
        </div>
        <button className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
          {!alwaysShow
            ? <EyeOff size={16} className="text-white/80" />
            : expanded
            ? <ChevronUp size={16} className="text-white/80" />
            : <ChevronDown size={16} className="text-white/80" />}
        </button>
      </div>

      {/* ── BODY ──────────────────────────────────────────────────────────── */}
      {(expanded || !alwaysShow) && (
        <div className="border-2 border-t-0 border-slate-200/80 rounded-b-2xl overflow-hidden bg-white shadow-md">

          {hasAny ? (
            <>
              {/* ══ ✅ ANSWER BANNER ════════════════════════════════════════ */}
              {p.answer && (
                <div className="relative overflow-hidden px-5 py-5 bg-gradient-to-r from-emerald-500 to-teal-500">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="relative flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-lg">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-emerald-100 text-[11px] font-black uppercase tracking-widest mb-0.5">✅ Correct Answer</p>
                      <p className="text-white font-black text-xl leading-tight">{p.answer}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ══ 📝 SOLUTION ══════════════════════════════════════════════════ */}
              {p.steps.length > 0 && (
                <div className="p-5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
                      <FlaskConical size={15} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-blue-700 uppercase tracking-widest">📝 Solution</p>
                      <p className="text-[10px] text-slate-400">Real numbers only — no variables</p>
                    </div>
                  </div>
                  {/* Formula/Rule Banner */}
                  {p.formulaLine && (
                    <div className="flex items-center gap-1.5 mb-3 px-3 py-2 rounded-xl bg-indigo-600 shadow">
                      <span className="text-indigo-300 font-black text-base shrink-0">[</span>
                      <p className="text-white font-black text-sm font-mono tracking-wide flex-1">{p.formulaLine}</p>
                      <span className="text-indigo-300 font-black text-base shrink-0">]</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    {p.steps.map((s, i) => <StepCard key={i} text={s} idx={i} />)}
                  </div>
                </div>
              )}

              {/* ══ ⚡ TRICK ═══════════════════════════════════════════════════════ */}
              {p.speedTrick.length > 0 && (
                <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 border-b border-amber-200">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shrink-0">
                      <Zap size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-amber-700 uppercase tracking-widest">⚡ Trick</p>
                      <p className="text-[10px] text-amber-600 font-bold">Formula → Numbers → Answer</p>
                    </div>
                    <div className="ml-auto bg-amber-400 text-amber-900 text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm shrink-0">
                      ⏱ &lt;30 sec
                    </div>
                  </div>
                  <div className="bg-white/80 border border-amber-300/60 rounded-xl p-4 space-y-2 shadow-sm">
                    {p.speedTrick.map((line, i) => {
                      const isFormulaLine = /^\[.+\]$/.test(line);
                      if (isFormulaLine) return (
                        <div key={i} className="flex items-center gap-1.5">
                          <span className="text-amber-500 font-black shrink-0">[</span>
                          <p className="text-sm font-black text-amber-900 font-mono flex-1">{line.slice(1, -1)}</p>
                          <span className="text-amber-500 font-black shrink-0">]</span>
                        </div>
                      );
                      if (i === (p.speedTrick[0] && /^\[/.test(p.speedTrick[0]) ? 1 : 0) && i > 0) return (
                        <p key={i} className="text-sm font-mono font-bold text-amber-950 bg-amber-100/70 rounded-lg px-3 py-1.5 leading-relaxed">
                          <HighlightedText text={line} />
                        </p>
                      );
                      return (
                        <p key={i} className="text-sm text-amber-950 font-semibold leading-relaxed">
                          {i > 0 && <span className="text-amber-500 font-black mr-1">▶</span>}
                          <HighlightedText text={line} />
                        </p>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ══ ❌ WHY WRONG OPTIONS FAIL ═══════════════════════════════ */}
              {p.wrongOptions.length > 0 && (
                <div className="p-5 bg-gradient-to-br from-red-50/50 to-rose-50/50 border-b border-red-100">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-red-500 flex items-center justify-center shadow-sm">
                      <XCircle size={15} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-red-600 uppercase tracking-widest">❌ Why Wrong Options Fail</p>
                      <p className="text-[10px] text-red-400">Numbers se dekho galat kyun hai</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {p.wrongOptions.map((w, i) => <WrongCard key={i} text={w} idx={i} />)}
                  </div>
                </div>
              )}

              {/* ══ 🧠 CONCEPT + FORMULA ════════════════════════════════════ */}
              {(p.concept.length > 0 || p.examTip) && (
                <div className="p-5 bg-gradient-to-br from-indigo-50/60 to-purple-50/60">
                  {p.concept.length > 0 && (
                    <>
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
                          <Brain size={15} className="text-white" />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-indigo-700 uppercase tracking-widest">🧠 Concept + Formula</p>
                          <p className="text-[10px] text-indigo-400">Yaad karo — exam mein kaam aayega</p>
                        </div>
                      </div>
                      <div className="space-y-2 mb-3">
                        {p.concept.map((line, i) => <FormulaLine key={i} text={line} />)}
                      </div>
                    </>
                  )}

                  {/* Exam Tip strip */}
                  {p.examTip && (
                    <div className="mt-2 flex items-start gap-3 bg-purple-100/70 border border-purple-200/80 rounded-xl px-4 py-3">
                      <Target size={14} className="text-purple-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-purple-800 font-semibold leading-relaxed">
                        <span className="font-black">💡 Exam Tip: </span>{p.examTip}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* ── FALLBACK — raw text, nicely rendered ─────────────────────── */
            <div className="p-5 space-y-1">
              {(solution ?? '').split('\n').map((line, i) => {
                const t = line.trim();
                if (!t) return <div key={i} className="h-1.5" />;
                if (t.startsWith('✅')) return (
                  <p key={i} className="text-base font-black text-emerald-600 py-1">{t}</p>
                );
                if (t.startsWith('⚡'))  return <p key={i} className="text-sm font-bold text-amber-600 pt-2">{t}</p>;
                if (t.startsWith('❌'))  return <p key={i} className="text-sm font-bold text-red-600 pt-2">{t}</p>;
                if (t.startsWith('🧠') || t.startsWith('📐')) return <p key={i} className="text-sm font-bold text-indigo-600 pt-2">{t}</p>;
                if (t.startsWith('📝') || t.startsWith('📖')) return <p key={i} className="text-sm font-bold text-blue-600 pt-2">{t}</p>;
                if (t.startsWith('💡')) return <p key={i} className="text-sm font-bold text-purple-600 pt-1">{t}</p>;
                if (/^\d+\./.test(t))  return (
                  <div key={i} className="flex items-start gap-2 py-0.5">
                    <span className="w-5 h-5 rounded bg-blue-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                      {t.match(/^\d+/)?.[0]}
                    </span>
                    <p className="text-sm text-slate-700 font-medium leading-relaxed">
                      <HighlightedText text={t.replace(/^\d+\.\s*/, '')} />
                    </p>
                  </div>
                );
                return <p key={i} className="text-sm text-slate-700 leading-relaxed"><HighlightedText text={t} /></p>;
              })}
            </div>
          )}

          {/* ── BOTTOM SIGNATURE BAR ──────────────────────────────────────── */}
          <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">RRB Group D Mastery</p>
            <div className="flex items-center gap-1">
              {[p.answer, p.steps.length > 0, p.speedTrick.length > 0, p.wrongOptions.length > 0, p.concept.length > 0 || !!p.examTip].map((has, i) => (
                <div key={i} className={cn('w-1.5 h-1.5 rounded-full', has ? 'bg-primary' : 'bg-slate-200')} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
