import React, { useState } from 'react';
import { Eye, EyeOff, ChevronDown, ChevronUp, Zap, BookOpen, Lightbulb } from 'lucide-react';
import { cn } from '../lib/utils';

interface SolutionDisplayProps {
  solution: string;
  isVisible: boolean;
  onToggle: () => void;
  alwaysShow?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
//  PARSER — handles emoji-sectioned format
// ─────────────────────────────────────────────────────────────────────────────
interface ParsedSolution {
  answer: string;
  formulaLine: string;
  steps: string[];
  speedTrick: string[];
  concept: string[];
  examTip: string;
}

function parse(raw: string): ParsedSolution {
  const out: ParsedSolution = { answer: '', formulaLine: '', steps: [], speedTrick: [], concept: [], examTip: '' };
  if (!raw?.trim()) return out;

  type Sec = 'none' | 'steps' | 'trick' | 'concept' | 'tip';
  let sec: Sec = 'none';

  for (const rawLine of raw.split('\n')) {
    const t = rawLine.trim();
    if (!t) continue;

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
    // Skip wrong-options section entirely — too cluttered
    if (t.startsWith('❌')) { sec = 'none'; continue; }

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

    // [Formula/Rule] bracket lines
    if ((sec === 'steps' || sec === 'trick') && /^\[.+\]$/.test(t)) {
      if (sec === 'steps' && !out.formulaLine) out.formulaLine = t.slice(1, -1).trim();
      else if (sec === 'trick') out.speedTrick.push(t);
      continue;
    }

    switch (sec) {
      case 'steps':   out.steps.push(t); break;
      case 'trick':   out.speedTrick.push(t); break;
      case 'concept': out.concept.push(t); break;
      case 'tip':     if (!out.examTip) out.examTip = t; break;
    }
  }

  // Strip leading step numbers
  out.steps = out.steps
    .map(s => s.replace(/^(step\s*)?\d+[.):\-\s]+\s*/i, '').trim())
    .filter(Boolean);

  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
//  HIGHLIGHTED TEXT — numbers & operators pop visually
// ─────────────────────────────────────────────────────────────────────────────
function Hl({ text }: { text: string }) {
  const parts = text.split(/(\d+\.?\d*%?|[=→∴≈]|[+\-×÷√])/g);
  return (
    <span>
      {parts.map((p, i) => {
        if (/^\d/.test(p) && p.length > 0)
          return <span key={i} style={{ color: '#2563eb', fontWeight: 800 }}>{p}</span>;
        if (/^[=→∴≈]$/.test(p))
          return <span key={i} style={{ color: '#059669', fontWeight: 900, margin: '0 2px' }}>{p}</span>;
        if (/^[+\-×÷√]$/.test(p))
          return <span key={i} style={{ color: '#7c3aed', fontWeight: 900, margin: '0 2px' }}>{p}</span>;
        return <span key={i}>{p}</span>;
      })}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  STEP ROW — single numbered step, clean minimal style
// ─────────────────────────────────────────────────────────────────────────────
const STEP_COLORS = [
  '#2563eb', '#7c3aed', '#0d9488', '#d97706', '#dc2626', '#0891b2',
];

function StepRow({ text, idx }: { text: string; idx: number }) {
  const color = STEP_COLORS[idx % STEP_COLORS.length];
  const isCalc = /[=→∴≈]/.test(text);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
      <div style={{
        minWidth: 26, height: 26, borderRadius: 8,
        background: color, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 800, flexShrink: 0, marginTop: 1,
      }}>
        {idx + 1}
      </div>
      <p style={{
        fontSize: 13.5, lineHeight: 1.6, flex: 1, margin: 0,
        fontWeight: isCalc ? 700 : 500, color: '#1e293b',
        fontFamily: isCalc ? "'JetBrains Mono', 'Fira Code', monospace" : 'inherit',
      }}>
        <Hl text={text} />
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  TRICK ROW — speed trick lines
// ─────────────────────────────────────────────────────────────────────────────
function TrickRow({ line, isFirst }: { line: string; isFirst: boolean }) {
  const isBracket = /^\[.+\]$/.test(line);
  if (isBracket) return (
    <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, padding: '6px 12px', marginBottom: 6 }}>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, fontFamily: 'monospace', color: '#92400e' }}>
        {line.slice(1, -1)}
      </p>
    </div>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '4px 0' }}>
      {!isFirst && <span style={{ color: '#f59e0b', fontWeight: 900, fontSize: 12, marginTop: 3 }}>▶</span>}
      <p style={{ margin: 0, fontSize: 13, fontWeight: isFirst ? 700 : 600, color: '#78350f', lineHeight: 1.6 }}>
        <Hl text={line} />
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function SolutionDisplay({ solution, isVisible, onToggle, alwaysShow = false }: SolutionDisplayProps) {
  const [showTip, setShowTip] = useState(false);
  const p = parse(solution ?? '');
  const hasContent = !!(p.answer || p.steps.length || p.speedTrick.length);

  // ── Reveal button ──────────────────────────────────────────────────────────
  if (!alwaysShow && !isVisible) {
    return (
      <div style={{ marginTop: 24 }}>
        <button
          onClick={onToggle}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 20px', borderRadius: 14, cursor: 'pointer',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))',
            border: '2px dashed rgba(99,102,241,0.3)',
            transition: 'all 0.2s', width: '100%',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(99,102,241,0.6)';
            (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.12))';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(99,102,241,0.3)';
            (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))';
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Eye size={16} color="#fff" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#4f46e5' }}>View Solution</p>
            <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>Step-by-step + Speed Trick</p>
          </div>
          <ChevronDown size={15} color="#a5b4fc" style={{ marginLeft: 'auto' }} />
        </button>
      </div>
    );
  }

  // ── Main card ──────────────────────────────────────────────────────────────
  return (
    <div style={{ marginTop: 24, borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>

      {/* Header bar */}
      <div
        onClick={() => alwaysShow ? undefined : onToggle()}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 18px', cursor: alwaysShow ? 'default' : 'pointer',
          background: 'linear-gradient(90deg, #1e1b4b, #312e81)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BookOpen size={16} color="#a5b4fc" />
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 13, letterSpacing: 0.3 }}>Solution</span>
        </div>
        {!alwaysShow && <EyeOff size={15} color="rgba(255,255,255,0.5)" />}
      </div>

      {hasContent ? (
        <>
          {/* ── ✅ ANSWER ─────────────────────────────────────────────────── */}
          {p.answer && (
            <div style={{
              padding: '14px 20px',
              background: 'linear-gradient(90deg, #059669, #10b981)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <p style={{ margin: 0, color: 'rgba(209,250,229,0.85)', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Correct Answer</p>
                <p style={{ margin: 0, color: '#fff', fontWeight: 900, fontSize: 17, lineHeight: 1.3 }}>{p.answer}</p>
              </div>
            </div>
          )}

          {/* ── 📝 NORMAL SOLUTION ───────────────────────────────────────── */}
          {p.steps.length > 0 && (
            <div style={{ padding: '16px 20px', background: '#fff', borderBottom: '2px solid #f1f5f9' }}>
              {/* Section label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: '#2563eb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 14 }}>📝</span>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: 0.8 }}>Step-by-Step Solution</p>
                  <p style={{ margin: 0, fontSize: 10, color: '#94a3b8' }}>Normal calculation with real values</p>
                </div>
              </div>

              {/* Formula banner */}
              {p.formulaLine && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 14px', borderRadius: 10,
                  background: '#4f46e5', marginBottom: 10,
                }}>
                  <span style={{ color: '#a5b4fc', fontWeight: 900, fontSize: 13 }}>[</span>
                  <p style={{ margin: 0, color: '#fff', fontWeight: 800, fontSize: 13, fontFamily: 'monospace', flex: 1 }}>{p.formulaLine}</p>
                  <span style={{ color: '#a5b4fc', fontWeight: 900, fontSize: 13 }}>]</span>
                </div>
              )}

              {/* Steps */}
              <div>
                {p.steps.map((s, i) => <StepRow key={i} text={s} idx={i} />)}
              </div>
            </div>
          )}

          {/* ── ⚡ SPEED TRICK ───────────────────────────────────────────── */}
          {p.speedTrick.length > 0 && (
            <div style={{ padding: '16px 20px', background: '#fffbeb' }}>
              {/* Section label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9,
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(245,158,11,0.35)',
                }}>
                  <Zap size={16} color="#fff" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: 0.8 }}>⚡ Speed Trick</p>
                  <p style={{ margin: 0, fontSize: 10, color: '#d97706' }}>Fast calculation for exam</p>
                </div>
                <div style={{
                  background: '#f59e0b', color: '#78350f',
                  fontSize: 10, fontWeight: 800,
                  padding: '3px 8px', borderRadius: 99,
                }}>
                  &lt;30 sec
                </div>
              </div>

              {/* Trick content */}
              <div style={{
                background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: 12, padding: '12px 14px',
              }}>
                {p.speedTrick.map((line, i) => (
                  <TrickRow key={i} line={line} isFirst={i === 0} />
                ))}
              </div>
            </div>
          )}

          {/* ── 💡 CONCEPT / TIP (collapsible, minimal) ─────────────────── */}
          {(p.concept.length > 0 || p.examTip) && (
            <div style={{ borderTop: '1px solid #f1f5f9', background: '#fafafa' }}>
              <button
                onClick={() => setShowTip(t => !t)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
                }}
              >
                <Lightbulb size={13} color="#8b5cf6" />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Concept & Exam Tip
                </span>
                {showTip
                  ? <ChevronUp size={13} color="#a78bfa" style={{ marginLeft: 'auto' }} />
                  : <ChevronDown size={13} color="#a78bfa" style={{ marginLeft: 'auto' }} />
                }
              </button>
              {showTip && (
                <div style={{ padding: '4px 20px 14px' }}>
                  {p.concept.map((c, i) => (
                    <p key={i} style={{ margin: '3px 0', fontSize: 12, color: '#4c1d95', fontWeight: 600 }}>{c}</p>
                  ))}
                  {p.examTip && (
                    <div style={{
                      marginTop: 8, padding: '8px 12px',
                      background: '#ede9fe', borderRadius: 8,
                      border: '1px solid rgba(139,92,246,0.2)',
                    }}>
                      <p style={{ margin: 0, fontSize: 12, color: '#5b21b6', fontWeight: 600 }}>
                        <span style={{ fontWeight: 800 }}>💡 Tip: </span>{p.examTip}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* Fallback for raw-text solutions */
        <div style={{ padding: 20, background: '#fff' }}>
          {(solution ?? '').split('\n').map((line, i) => {
            const t = line.trim();
            if (!t) return <div key={i} style={{ height: 8 }} />;
            if (t.startsWith('✅')) return <p key={i} style={{ color: '#059669', fontWeight: 900, fontSize: 15, margin: '4px 0' }}>{t}</p>;
            if (t.startsWith('⚡')) return <p key={i} style={{ color: '#d97706', fontWeight: 700, fontSize: 13, marginTop: 10 }}>{t}</p>;
            if (t.startsWith('❌')) return null; // hide wrong options in raw fallback
            if (/^\d+\./.test(t)) return (
              <div key={i} style={{ display: 'flex', gap: 8, margin: '4px 0', alignItems: 'flex-start' }}>
                <span style={{ minWidth: 22, height: 22, borderRadius: 6, background: '#2563eb', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                  {t.match(/^\d+/)?.[0]}
                </span>
                <p style={{ margin: 0, fontSize: 13, color: '#334155', fontWeight: 500, lineHeight: 1.6 }}>
                  <Hl text={t.replace(/^\d+\.\s*/, '')} />
                </p>
              </div>
            );
            return <p key={i} style={{ margin: '3px 0', fontSize: 13, color: '#334155', lineHeight: 1.6 }}><Hl text={t} /></p>;
          })}
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: '8px 20px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ margin: 0, fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>RRB Group D Mastery</p>
        <div style={{ display: 'flex', gap: 4 }}>
          {[!!p.answer, p.steps.length > 0, p.speedTrick.length > 0].map((has, i) => (
            <div key={i} style={{ width: 6, height: 6, borderRadius: 99, background: has ? '#6366f1' : '#e2e8f0' }} />
          ))}
        </div>
      </div>
    </div>
  );
}
