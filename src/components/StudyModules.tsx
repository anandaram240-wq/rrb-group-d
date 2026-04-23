import React, { useState, useMemo } from 'react';
import {
  BookOpen, ChevronDown, ChevronUp, Zap, Brain, FlaskConical,
  Globe, Calculator, Lightbulb, Target, Award, TrendingUp, Star, PlayCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { cleanText } from '../lib/cleanText';
import pyqsData from '../data/pyqs.json';
import { enrichSolution, enrichedToText } from '../lib/solutionEnricher';
import { SolutionDisplay } from './SolutionDisplay';

interface PYQ {
  id: number; subject: string; topic: string; sub_topic?: string;
  question: string; options: string[]; correctAnswer: number;
  solution: string; difficulty: string; exam_year: string; shift: string;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface StudyModulesProps {
  onPractice?: (subject: string, topic: string) => void;
}

// ─── Subject config ───────────────────────────────────────────────────────────
const SUBJECTS = [
  {
    id: 'Mathematics', label: 'Mathematics', icon: '📐',
    color: 'from-blue-600 to-indigo-700',
    light: 'bg-blue-50 border-blue-200 text-blue-700',
    badge: 'bg-blue-100 text-blue-800',
    accent: 'text-blue-600', marks: 25, qs: 25,
  },
  {
    id: 'Reasoning', label: 'Reasoning', icon: '🧩',
    color: 'from-purple-600 to-violet-700',
    light: 'bg-purple-50 border-purple-200 text-purple-700',
    badge: 'bg-purple-100 text-purple-800',
    accent: 'text-purple-600', marks: 30, qs: 30,
  },
  {
    id: 'General Science', label: 'General Science', icon: '🔬',
    color: 'from-emerald-600 to-teal-700',
    light: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-800',
    accent: 'text-emerald-600', marks: 25, qs: 25,
  },
  {
    id: 'General Awareness', label: 'General Awareness', icon: '🌍',
    color: 'from-amber-500 to-orange-600',
    light: 'bg-amber-50 border-amber-200 text-amber-700',
    badge: 'bg-amber-100 text-amber-800',
    accent: 'text-amber-600', marks: 20, qs: 20,
  },
];

// ─── Inline SVG Concept Diagrams ─────────────────────────────────────────────
function TopicDiagram({ topic }: { topic: string }) {
  switch (topic) {
    case 'Speed Distance & Time':
      return (
        <svg viewBox="0 0 220 80" className="w-full h-full" aria-label="SDT Triangle">
          <rect x="10" y="8" width="200" height="64" rx="10" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1.5"/>
          {/* D = S × T triangle */}
          <polygon points="110,14 60,62 160,62" fill="#3b82f6" opacity="0.15" stroke="#3b82f6" strokeWidth="1.5"/>
          <text x="110" y="30" textAnchor="middle" fill="#1d4ed8" fontSize="13" fontWeight="bold">D</text>
          <text x="72" y="58" textAnchor="middle" fill="#166534" fontSize="11" fontWeight="bold">S</text>
          <text x="148" y="58" textAnchor="middle" fill="#9a3412" fontSize="11" fontWeight="bold">T</text>
          <text x="110" y="75" textAnchor="middle" fill="#475569" fontSize="9">Cover unknown → formula appears</text>
          <line x1="110" y1="62" x2="110" y2="14" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3,2"/>
        </svg>
      );
    case 'Direction Sense':
      return (
        <svg viewBox="0 0 220 80" className="w-full h-full" aria-label="Compass">
          <rect x="10" y="4" width="200" height="72" rx="10" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5"/>
          <circle cx="110" cy="40" r="28" fill="none" stroke="#8b5cf6" strokeWidth="1.5"/>
          {/* N S E W */}
          <text x="110" y="17" textAnchor="middle" fill="#7c3aed" fontSize="11" fontWeight="bold">N (+Y)</text>
          <text x="110" y="68" textAnchor="middle" fill="#7c3aed" fontSize="11" fontWeight="bold">S (−Y)</text>
          <text x="158" y="44" textAnchor="middle" fill="#7c3aed" fontSize="11" fontWeight="bold">E (+X)</text>
          <text x="58" y="44" textAnchor="middle"  fill="#7c3aed" fontSize="11" fontWeight="bold">W (−X)</text>
          {/* crosshair */}
          <line x1="110" y1="15" x2="110" y2="65" stroke="#c4b5fd" strokeWidth="1"/>
          <line x1="82"  y1="40" x2="138" y2="40" stroke="#c4b5fd" strokeWidth="1"/>
          <circle cx="110" cy="40" r="3" fill="#7c3aed"/>
        </svg>
      );
    case 'Time & Work':
      return (
        <svg viewBox="0 0 220 80" className="w-full h-full" aria-label="LCM Work Method">
          <rect x="10" y="4" width="200" height="72" rx="10" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1.5"/>
          {/* 3 person bars */}
          {[
            { label: 'A', days: 12, eff: 4, color: '#22c55e', x: 40 },
            { label: 'B', days: 6,  eff: 8, color: '#3b82f6', x: 100 },
            { label: 'C', days: 4,  eff: 3, color: '#f59e0b', x: 160 },
          ].map(({ label, days, eff, color, x }) => (
            <g key={label}>
              <rect x={x - 15} y={22} width={30} height={36} rx="5" fill={color} opacity="0.15" stroke={color} strokeWidth="1.2"/>
              <text x={x} y={36} textAnchor="middle" fill={color}   fontSize="12" fontWeight="bold">{label}</text>
              <text x={x} y={49} textAnchor="middle" fill="#475569" fontSize="9">{days}d</text>
              <text x={x} y={62} textAnchor="middle" fill={color}   fontSize="9" fontWeight="bold">eff:{eff}</text>
            </g>
          ))}
          <text x="110" y="76" textAnchor="middle" fill="#15803d" fontSize="9" fontWeight="bold">LCM=12 → Total Work. Add effs → Days</text>
        </svg>
      );
    case 'Number Series':
      return (
        <svg viewBox="0 0 220 80" className="w-full h-full" aria-label="Number Series">
          <rect x="10" y="4" width="200" height="72" rx="10" fill="#faf5ff" stroke="#e9d5ff" strokeWidth="1.5"/>
          {/* Series boxes */}
          {[2, 5, 10, 17, 26, '?'].map((n, i) => (
            <g key={i}>
              <rect x={16 + i * 33} y="18" width="28" height="24" rx="5"
                    fill={i === 5 ? '#8b5cf6' : '#ede9fe'} stroke="#8b5cf6" strokeWidth="1.2"/>
              <text x={30 + i * 33} y="34" textAnchor="middle"
                    fill={i === 5 ? '#fff' : '#6d28d9'} fontSize="11" fontWeight="bold">{n}</text>
            </g>
          ))}
          {/* diff arrows */}
          {[3, 5, 7, 9, 11].map((d, i) => (
            <g key={i}>
              <text x={47 + i * 33} y="56" textAnchor="middle" fill="#7c3aed" fontSize="9" fontWeight="bold">+{d}</text>
              <line x1={44 + i * 33} y1="42" x2={44 + i * 33} y2="62" stroke="#c4b5fd" strokeWidth="1"/>
            </g>
          ))}
          <text x="197" y="72" textAnchor="middle" fill="#6d28d9" fontSize="9" fontWeight="bold">37</text>
          <text x="110" y="76" textAnchor="middle" fill="#7c3aed" fontSize="8">Diff pattern: +3,+5,+7,+9,+11 → answer: 37</text>
        </svg>
      );
    case 'Blood Relations':
      return (
        <svg viewBox="0 0 220 80" className="w-full h-full" aria-label="Family Tree">
          <rect x="10" y="4" width="200" height="72" rx="10" fill="#fff1f2" stroke="#fecdd3" strokeWidth="1.5"/>
          {/* Grandparent */}
          <rect x="85" y="8" width="50" height="20" rx="5" fill="#fb7185" opacity="0.2" stroke="#fb7185" strokeWidth="1.2"/>
          <text x="110" y="22" textAnchor="middle" fill="#be123c" fontSize="9" fontWeight="bold">Grandfather</text>
          {/* Parents */}
          <rect x="30" y="38" width="40" height="18" rx="5" fill="#fecdd3" stroke="#fb7185" strokeWidth="1"/>
          <text x="50" y="51" textAnchor="middle" fill="#be123c" fontSize="9">Father</text>
          <rect x="88" y="38" width="40" height="18" rx="5" fill="#fecdd3" stroke="#fb7185" strokeWidth="1"/>
          <text x="108" y="51" textAnchor="middle" fill="#be123c" fontSize="9">Uncle</text>
          {/* You */}
          <rect x="10" y="64" width="32" height="14" rx="4" fill="#fb7185" stroke="#be123c" strokeWidth="1"/>
          <text x="26" y="74" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">YOU</text>
          {/* lines */}
          <line x1="110" y1="28" x2="50"  y2="38" stroke="#fb7185" strokeWidth="1.2"/>
          <line x1="110" y1="28" x2="108" y2="38" stroke="#fb7185" strokeWidth="1.2"/>
          <line x1="50"  y1="56" x2="26"  y2="64" stroke="#fb7185" strokeWidth="1.2"/>
          <text x="170" y="54" textAnchor="middle" fill="#9f1239" fontSize="8">Decode</text>
          <text x="170" y="65" textAnchor="middle" fill="#9f1239" fontSize="8">→ Draw</text>
          <text x="170" y="76" textAnchor="middle" fill="#9f1239" fontSize="8">→ Answer</text>
        </svg>
      );
    case 'Percentage':
      return (
        <svg viewBox="0 0 220 80" className="w-full h-full" aria-label="1% Method">
          <rect x="10" y="4" width="200" height="72" rx="10" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1.5"/>
          <text x="20" y="24" fill="#1e40af" fontSize="11" fontWeight="bold">⚡ 1% Method: 86% of 18,000</text>
          <rect x="20" y="30" width="180" height="16" rx="4" fill="#dbeafe"/>
          <text x="110" y="42" textAnchor="middle" fill="#1d4ed8" fontSize="9" fontWeight="bold">Step 1: 1% = 18000 ÷ 100 = 180</text>
          <rect x="20" y="50" width="180" height="16" rx="4" fill="#bfdbfe"/>
          <text x="110" y="62" textAnchor="middle" fill="#1e3a8a" fontSize="9" fontWeight="bold">Step 2: 86% = 180 × 86 = 15,480 ✓</text>
          <text x="110" y="76" textAnchor="middle" fill="#475569" fontSize="8">Done in 15 seconds — no long division!</text>
        </svg>
      );
    case 'Light & Optics':
      return (
        <svg viewBox="0 0 220 80" className="w-full h-full" aria-label="Lens Types">
          <rect x="10" y="4" width="200" height="72" rx="10" fill="#fefce8" stroke="#fef08a" strokeWidth="1.5"/>
          {/* Convex lens */}
          <ellipse cx="65" cy="40" rx="12" ry="28" fill="#fef9c3" stroke="#ca8a04" strokeWidth="1.5"/>
          <line x1="20" y1="30" x2="65" y2="30" stroke="#f59e0b" strokeWidth="1.5"/>
          <line x1="20" y1="50" x2="65" y2="50" stroke="#f59e0b" strokeWidth="1.5"/>
          <line x1="65" y1="30" x2="100" y2="40" stroke="#f59e0b" strokeWidth="1.5"/>
          <line x1="65" y1="50" x2="100" y2="40" stroke="#f59e0b" strokeWidth="1.5"/>
          <text x="60" y="72" textAnchor="middle" fill="#92400e" fontSize="8" fontWeight="bold">Convex=Converge</text>
          {/* Concave lens */}
          <ellipse cx="155" cy="40" rx="12" ry="28" fill="#fef9c3" stroke="#ca8a04" strokeWidth="1.5" transform="scale(-1,1) translate(-220,0)"/>
          <line x1="120" y1="33" x2="155" y2="36" stroke="#ef4444" strokeWidth="1.5"/>
          <line x1="120" y1="47" x2="155" y2="44" stroke="#ef4444" strokeWidth="1.5"/>
          <line x1="155" y1="36" x2="200" y2="25" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,2"/>
          <line x1="155" y1="44" x2="200" y2="55" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,2"/>
          <text x="158" y="72" textAnchor="middle" fill="#92400e" fontSize="8" fontWeight="bold">Concave=Diverge</text>
        </svg>
      );
    case 'Current Electricity':
      return (
        <svg viewBox="0 0 220 80" className="w-full h-full" aria-label="Circuit">
          <rect x="10" y="4" width="200" height="72" rx="10" fill="#fffbeb" stroke="#fde68a" strokeWidth="1.5"/>
          {/* Series circuit */}
          <text x="20" y="20" fill="#78350f" fontSize="9" fontWeight="bold">Series: R₁+R₂ = Same I, Diff V</text>
          <rect x="25" y="26" width="22" height="12" rx="3" fill="#fde68a" stroke="#d97706" strokeWidth="1.2"/>
          <text x="36" y="35" textAnchor="middle" fill="#78350f" fontSize="8">R₁</text>
          <rect x="65" y="26" width="22" height="12" rx="3" fill="#fde68a" stroke="#d97706" strokeWidth="1.2"/>
          <text x="76" y="35" textAnchor="middle" fill="#78350f" fontSize="8">R₂</text>
          <line x1="20" y1="32" x2="25" y2="32" stroke="#92400e" strokeWidth="1.5"/>
          <line x1="47" y1="32" x2="65" y2="32" stroke="#92400e" strokeWidth="1.5"/>
          <line x1="87" y1="32" x2="100" y2="32" stroke="#92400e" strokeWidth="1.5"/>
          {/* Parallel */}
          <text x="20" y="54" fill="#78350f" fontSize="9" fontWeight="bold">Parallel: 1/R = 1/R₁+1/R₂</text>
          <rect x="25"  y="60" width="18" height="12" rx="3" fill="#fde68a" stroke="#d97706" strokeWidth="1.2"/>
          <text x="34" y="69" textAnchor="middle" fill="#78350f" fontSize="8">R₁</text>
          <rect x="50" y="60" width="18" height="12" rx="3" fill="#fde68a" stroke="#d97706" strokeWidth="1.2"/>
          <text x="59" y="69" textAnchor="middle" fill="#78350f" fontSize="8">R₂</text>
          <text x="160" y="44" fill="#d97706" fontSize="10" fontWeight="bold">V = IR</text>
          <text x="160" y="58" fill="#d97706" fontSize="10" fontWeight="bold">P = VI</text>
          <text x="160" y="72" fill="#d97706" fontSize="10" fontWeight="bold">P = I²R</text>
        </svg>
      );
    case 'Motion & Laws of Motion':
      return (
        <svg viewBox="0 0 220 80" className="w-full h-full" aria-label="SUVAT">
          <rect x="10" y="4" width="200" height="72" rx="10" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1.5"/>
          <text x="110" y="18" textAnchor="middle" fill="#1e40af" fontSize="10" fontWeight="bold">SUVAT Equations</text>
          {[
            'v = u + at',
            'v² = u² + 2as',
            's = ut + ½at²',
          ].map((eq, i) => (
            <g key={i}>
              <rect x="20" y={22 + i * 17} width="180" height="13" rx="4"
                    fill={['#dbeafe','#bfdbfe','#93c5fd'][i]} opacity="0.7"/>
              <text x="110" y={32 + i * 17} textAnchor="middle"
                    fill="#1e40af" fontSize="9" fontWeight="bold">{eq}</text>
            </g>
          ))}
          <text x="110" y="76" textAnchor="middle" fill="#475569" fontSize="8">Identify 3 known → pick equation with 1 unknown</text>
        </svg>
      );
    case 'Profit & Loss':
      return (
        <svg viewBox="0 0 220 80" className="w-full h-full" aria-label="Profit Loss">
          <rect x="10" y="4" width="200" height="72" rx="10" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1.5"/>
          {/* Flow: CP → MP → SP */}
          {[
            { label: 'CP', x: 30, fill: '#bbf7d0', text: '#166534' },
            { label: 'MP', x: 110, fill: '#fef9c3', text: '#713f12' },
            { label: 'SP', x: 188, fill: '#fee2e2', text: '#991b1b' },
          ].map(({ label, x, fill, text }) => (
            <g key={label}>
              <rect x={x - 22} y="20" width="44" height="28" rx="8" fill={fill} stroke={text} strokeWidth="1.5"/>
              <text x={x} y="38" textAnchor="middle" fill={text} fontSize="13" fontWeight="bold">{label}</text>
            </g>
          ))}
          <text x="70"  y="36" textAnchor="middle" fill="#16a34a" fontSize="8">× (1+P/100)</text>
          <text x="150" y="36" textAnchor="middle" fill="#dc2626" fontSize="8">× (1−D/100)</text>
          <line x1="8" y1="34" x2="190" y2="34" stroke="transparent"/>
          <text x="110" y="64" textAnchor="middle" fill="#475569" fontSize="9" fontWeight="bold">Chain multiplier — never add/subtract directly!</text>
          <text x="110" y="76" textAnchor="middle" fill="#15803d" fontSize="8">Mark UP then Discount = Net effect on CP</text>
        </svg>
      );
    default:
      return null;
  }
}

// ─── Topic-level MASTERCLASS knowledge ───────────────────────────────────────
const TOPIC_MASTERCLASS: Record<string, {
  tag: string; trick: string; formula: string; examNote: string;
}> = {
  // ── MATHEMATICS ─────────────────────────────────────────────────────────────
  'Number System':        { tag:'HIGH VALUE ⚡', trick:'Use unit-digit method for last digit. For divisibility: sum of digits ÷ 9', formula:'HCF × LCM = Product of two numbers', examNote:'2–3 Qs per exam. Focus on remainders and factor-based questions.' },
  'LCM & HCF':            { tag:'MUST DO 🔥', trick:'LCM of fractions = LCM of numerators / HCF of denominators', formula:'HCF × LCM = a × b', examNote:'Bell/Time problems are 100% formula-based. Guaranteed 1 Q.' },
  'Simplification':       { tag:'MUST DO 🔥', trick:'BODMAS strictly: Brackets→Division→Multiplication→Addition→Subtraction', formula:'BODMAS rule', examNote:'Easiest 2 marks in the paper. Do NOT skip — takes < 30 sec each.' },
  'Percentage':           { tag:'MUST DO 🔥', trick:'1% Method: find 1%, then multiply. 86%=80%+6% separately', formula:'x% of N = (x/100)×N | % change = (Diff/Original)×100', examNote:'Appears every shift. Sub-topics: election %, population, successive %.' },
  'Profit & Loss':        { tag:'MUST DO 🔥', trick:'Multiplying factor: SP = CP×(100+P)/100. Successive discount: d1+d2−d1×d2/100', formula:'Profit% = (SP−CP)/CP × 100 | Discount = MP−SP', examNote:'Always has marked price + discount combo. Know the successive discount shortcut.' },
  'Simple Interest':      { tag:'MUST DO 🔥', trick:'SI = PRT/100. Days→Years: ÷365 (73d=1/5y, 146d=2/5y)', formula:'SI = PRT/100 | A = P + SI', examNote:'Either finding SI, or P, R, T from SI. Very formulaic — guaranteed correct.' },
  'Compound Interest':    { tag:'HIGH VALUE ⚡', trick:'CI−SI for 2 years = P(R/100)². Half-yearly: R halved, T doubled', formula:'A = P(1+R/100)ⁿ | CI = A−P', examNote:'Usually 1 Q — either find CI, or the difference CI−SI formula.' },
  'Average':              { tag:'MUST DO 🔥', trick:'Rise in avg = (New value − Old avg) ÷ New count. No need to sum!', formula:'Avg = Sum/n | New Avg = (Old Sum + New Value)/(n+1)', examNote:'Cricket avg, classroom avg. Use "rise trick" — NEVER add all numbers.' },
  'Ratio & Proportion':   { tag:'MUST DO 🔥', trick:'Ratio unit method: 1 unit = Total ÷ Sum of ratio parts. Multiply target ratio × 1 unit.', formula:'a:b :: c:d → ad = bc', examNote:'Division in ratio is #1 sub-topic. Also: income-saving, salary division.' },
  'Ages':                 { tag:'MUST DO 🔥', trick:'Back-substitution: Try the correct option directly. Verify both conditions in 20 sec.', formula:'Set up: a + b = S, a − b = D or a = kb', examNote:'Always 2 persons. Try options from middle (B or C) first to narrow faster.' },
  'Speed Distance & Time':{ tag:'MUST DO 🔥', trick:'Same distance? Speed ratio = inverse of time ratio. S1/S2 = T2/T1', formula:'S=D/T | Relative speed (same dir)=S1−S2 | Avg speed = 2ab/(a+b)', examNote:'Trains crossing platform & each other are most common. km/hr→m/s: ×5/18.' },
  'Time & Work':          { tag:'MUST DO 🔥', trick:'LCM Method: Total work = LCM of days. Per-day = LCM/days. Add efficiencies.', formula:'1/T = 1/a + 1/b + 1/c', examNote:'3–4 persons working together. ALWAYS use LCM method — fraction method is slow.' },
  'Pipes & Cisterns':     { tag:'HIGH VALUE ⚡', trick:'Inlet(+), Outlet(−). LCM method same as Time & Work. Leak = outlet pipe.', formula:'1/T = 1/a + 1/b (inlets) − 1/c (outlets)', examNote:'Identical to T&W logic. If "leak" problems, leak pipe is negative efficiency.' },
  'Mensuration':          { tag:'MUST DO 🔥', trick:'3:4:5 = right triangle. Area = 6k². Sphere SA = 4πr². Cylinder CSA = 2πrh.', formula:'Triangle: ½bh | Circle: πr² | Cylinder: πr²h | Cone: ⅓πr²h', examNote:'3D shapes (cylinder, cone, sphere) appear most. Memorize 5 key formulas.' },
  'Geometry':             { tag:'HIGH VALUE ⚡', trick:'Angle sum of polygon = (n−2)×180. Exterior angle of regular polygon = 360/n.', formula:'Pythagoras: a²+b²=c² | Angle sum of triangle = 180°', examNote:'Quadrilateral and angle problems. Properties of parallelogram are commonly tested.' },
  'Trigonometry':         { tag:'HIGH VALUE ⚡', trick:'sin²θ+cos²θ=1. For 30°: sin=1/2, cos=√3/2, tan=1/√3.', formula:'sin/cos/tan values for 0°,30°,45°,60°,90°. cosec=1/sin, sec=1/cos, cot=1/tan', examNote:'Always either identity-based OR heights & distances. Learn table of values by heart.' },
  'Algebra':              { tag:'MODERATE', trick:'(a+b)²=a²+2ab+b². If x+1/x=k, then x²+1/x²=k²−2.', formula:'(a+b)²=a²+2ab+b² | (a−b)²=a²−2ab+b² | a²−b²=(a+b)(a−b)', examNote:'Expression simplification or finding value. 1 Q per paper usually.' },
  'Statistics':           { tag:'HIGH VALUE ⚡', trick:'Median of n items: (n+1)/2 th item if odd. Mean = ΣfX/Σf for grouped.', formula:'Mean=ΣX/n | Median=(n+1)/2 th item | Mode = most frequent', examNote:'Mean, Median, Mode — one of each per exam. Very straightforward for 1 Q each.' },
  'Simplification (BODMAS)':{ tag:'MUST DO 🔥', trick:'BODMAS order strictly. Same level: left to right.', formula:'B-O-D-M-A-S', examNote:'DO NOT miss these — fastest correct marks available.' },

  // ── REASONING ───────────────────────────────────────────────────────────────
  'Number Series':        { tag:'MUST DO 🔥', trick:'Check: L1 differences first. If not equal → L2 differences. Also try ×2,+prime,alternating.', formula:'AP: a, a+d, a+2d... | GP: a, ar, ar²...', examNote:'4–5 Qs per exam. Differences method solves 70% of RRB series questions.' },
  'Letter Series':        { tag:'MUST DO 🔥', trick:'Write alphabet+position: A=1, B=2...Z=26. Check gap between consecutive letters.', formula:'A=1, B=2...Z=26 | Reverse: A=26, Z=1', examNote:'Similar to Number Series but with letters. Also check alternating pattern.' },
  'Analogy':              { tag:'MUST DO 🔥', trick:'Find the relationship TYPE first (position, +gap, category, synonym). Apply same to new pair.', formula:'A:B :: C:? → same relationship', examNote:'3 Qs per shift usually. Can be word, number, or letter analogy.' },
  'Coding-Decoding':      { tag:'MUST DO 🔥', trick:'Common-word method: find word appearing in 2 sentences → its code = common symbol.', formula:'Word↔Code mapping | Letter shift: +k or −k', examNote:'Find shared word across sentences for direct code. 2–3 Qs per exam.' },
  'Mathematical Operations':{ tag:'MUST DO 🔥', trick:'Substitute letters with operators, then apply BODMAS strictly. Write table first!', formula:'BODMAS after substitution', examNote:'Easy 1 mark if you write the substitution table. Common mistake: wrong BODMAS order.' },
  'Classification & Odd One Out':{ tag:'MUST DO 🔥', trick:'Find what 3 SHARE in common — the one lacking it is the answer.', formula:'3 follow rule, 1 breaks = Odd One Out', examNote:'2 Qs per exam. For letters: check position gaps. Numbers: prime/composite/perfect square.' },
  'Direction Sense':      { tag:'MUST DO 🔥', trick:'Coordinate method: N=+y, S=−y, E=+x, W=−x. Net X and Y = final position.', formula:'Pythagoras for diagonal distance: d=√(x²+y²)', examNote:'3–4 Qs per exam. DRAW on paper — even a rough sketch prevents all mistakes.' },
  'Blood Relations':      { tag:'MUST DO 🔥', trick:'Decode all symbols first → draw family tree → trace relation path.', formula:'Same generation=sibling|Up=parent|Down=child', examNote:'Symbol-based blood relations are most common. 2–3 Qs per exam.' },
  'Syllogism':            { tag:'HIGH VALUE ⚡', trick:'Draw Venn diagrams for All/Some/No. "Some" = at least one. "All" can be "Some".', formula:'All A=B + All B=C → All A=C', examNote:'2 Qs per exam usually. Possibility cases are tricky — extra care needed.' },
  'Statement & Conclusion':{ tag:'MODERATE', trick:'For assumptions: must be implicit, not obvious. For arguments: directly supports/opposes.', formula:'Valid argument: must relate to stated conclusion', examNote:'Read carefully — 1–2 Qs per exam. Assumption questions are most common.' },
  'Seating Arrangement':  { tag:'HIGH VALUE ⚡', trick:'For circular: fix one person, arrange rest relative to them (n−1)! ways.', formula:'Linear: fix ends first | Circular: (n−1)! arrangements', examNote:'Usually 1–2 Qs. Start by placing most-constrained person first.' },
  'Ranking & Order':      { tag:'HIGH VALUE ⚡', trick:'From left + from right = Total + 1. Person at position: (Total+1) − other-side position.', formula:'Left rank + Right rank = Total + 1', examNote:'Very easy guaranteed mark. Total = left + right − 1. Practice this formula.' },
  'Venn Diagram':         { tag:'HIGH VALUE ⚡', trick:'Draw 3 overlapping circles. Fill from inside (intersection) outward.', formula:'A∪B = A+B−A∩B', examNote:'1–2 Qs. Shade regions carefully — most common error is double-counting.' },
  'Mirror & Water Image': { tag:'MODERATE', trick:'Mirror: left↔right flip only. Water: top↔bottom flip only.', formula:'Mirror = horizontal flip | Water = vertical flip', examNote:'1 Q per exam. Practice identifying axis of reflection.' },
  'Calendar & Clock':     { tag:'MODERATE', trick:'Odd days method: Jan=3, Feb=0(non-leap)/1(leap), ... Days of week cycle by 7.', formula:'Clock: angle = |30H − 5.5M| degrees', examNote:'1 Q calendar OR 1 Q clock per exam. Not both. Learn odd days table.' },

  // ── GENERAL SCIENCE ─────────────────────────────────────────────────────────
  'Motion & Laws of Motion':  { tag:'MUST DO 🔥', trick:'SUVAT: v=u+at, v²=u²+2as, s=ut+½at². Newton 1=inertia, 2=F=ma, 3=action-reaction', formula:'v=u+at | v²=u²+2as | F=ma | p=mv', examNote:'Highest frequency topic in Science! Graphs + equations of motion. 3–4 Qs.' },
  'Light & Optics':           { tag:'MUST DO 🔥', trick:'Convex lens: converging, real image. Concave lens: diverging, virtual image. Mirror formula: 1/v+1/u=1/f', formula:'1/v + 1/u = 1/f | n = sin(i)/sin(r)', examNote:'Human eye (defects+lenses) is very common. Know which lens corrects which defect.' },
  'Current Electricity':      { tag:'MUST DO 🔥', trick:'Series: R_total=R1+R2. Parallel: 1/R=1/R1+1/R2. P=VI=I²R=V²/R', formula:'V=IR | P=VI | Series/Parallel resistance rules', examNote:'Ohm\'s law + circuits. Always 2–3 Qs. Draw circuit and apply V=IR.' },
  'Work Energy & Power':      { tag:'MUST DO 🔥', trick:'Work = F×d×cosθ. KE=½mv². Work-energy theorem: net work = ΔKE.', formula:'W=Fd·cosθ | KE=½mv² | PE=mgh | Power=W/t', examNote:'Energy conservation problems most common. KE+PE=constant in isolated system.' },
  'Periodic Table':           { tag:'HIGH VALUE ⚡', trick:'Groups 1 metals, 17 halogens, 18 noble gases. Atomic no = protons. Period = electron shells.', formula:'Atomic no = protons | Mass no = p+n', examNote:'Properties across periods and groups — mostly factual recall questions.' },
  'Metals & Non-Metals':      { tag:'MUST DO 🔥', trick:'Metals: malleable, ductile, good conductors, basic oxides. Non-metals: opposite + acidic oxides.', formula:'Reactivity series: K>Na>Ca>Mg>Al>Zn>Fe>Pb>H>Cu>Ag>Au', examNote:'Reactivity series is most tested. Corrosion: Fe+O2+H2O→rust (Fe2O3·xH2O).' },
  'Carbon & Its Compounds':   { tag:'HIGH VALUE ⚡', trick:'Alkanes (CnH2n+2) saturated. Alkenes (CnH2n) unsaturated. Alkynes (CnH2n-2).', formula:'Homologous series | Functional groups: −OH, −COOH, −CHO', examNote:'Organic chemistry naming + properties. Ethanol, ethanoic acid most asked.' },
  'Cell Structure & Functions':{ tag:'HIGH VALUE ⚡', trick:'Animal cell: no cell wall, no chloroplast. Plant cell: has both. Nucleus = control center.', formula:'Cell membrane (selectively permeable) | Mitochondria = powerhouse', examNote:'Organelles and their functions. Very factual. MQ: Mitochondria=ATP, Ribosome=protein.' },
  'Human Reproductive System':{ tag:'HIGH VALUE ⚡', trick:'Male: testes→sperm. Female: ovary→ovum. Fertilization in fallopian tube.', formula:'Menstrual cycle = 28 days | Gestation = 9 months (266 days)', examNote:'Factual biology. Focus on where fertilization occurs and hormone names.' },
  'Force & Pressure':         { tag:'HIGH VALUE ⚡', trick:'Pressure = Force/Area. Atmospheric = 101325 Pa. Pascal\'s law: pressure transmitted equally.', formula:'P=F/A | Pascal\'s Law | Archimedes: Buoyancy=ρVg', examNote:'Buoyancy, Pascal\'s law, Archimedes principle. 1–2 Qs per exam.' },
  'Plant Kingdom & Photosynthesis':{ tag:'HIGH VALUE ⚡', trick:'Photosynthesis: 6CO2+6H2O+light→C6H12O6+6O2. Occurs in chloroplast.', formula:'6CO₂+6H₂O→C₆H₁₂O₆+6O₂ (light+chlorophyll)', examNote:'Equation must be memorized. Also: transpiration, types of nutrition.' },
  'Sound & Waves':            { tag:'MODERATE', trick:'Speed of sound: 340 m/s in air, fastest in solids. Infrasonic <20Hz, Ultrasonic >20000Hz.', formula:'v=fλ | Speed: solid>liquid>gas | Echo: min 17m', examNote:'Properties of sound + echo. Ultrasound applications in medicine are important.' },
  'Genetics & Heredity':      { tag:'MODERATE', trick:'DNA→RNA→Protein. Dominant masks recessive. XX=female, XY=male.', formula:'Punnet square | DNA: double helix | 23 chromosome pairs in humans', examNote:'Mendel\'s laws + DNA structure. Sex determination (XY) is frequently asked.' },

  // ── GENERAL AWARENESS ────────────────────────────────────────────────────────
  'Awards & Honours':         { tag:'HIGH VALUE ⚡', trick:'Focus on current year Bharat Ratna, Padma awards, Nobel Prize winners.', formula:'Bharat Ratna | Nobel | Padma Vibhushan/Bhushan/Shri', examNote:'3–4 Qs per exam. Static awards + current year announcement.' },
  'Economy':                  { tag:'HIGH VALUE ⚡', trick:'GDP = C+I+G+(X−M). India = 5th largest economy. RBI repo rate → affects inflation.', formula:'GDP | Fiscal Deficit | Current Account Deficit | Inflation', examNote:'Government schemes (PM-KISAN, Mudra, etc.) are very commonly asked.' },
  'Indian Polity & Constitution':{ tag:'MUST DO 🔥', trick:'Articles: 14=equality, 19=freedom, 21=life, 32=constitutional remedies, 370=J&K.', formula:'Part+Article system | Preamble | Fundamental Rights (Part III)', examNote:'Article numbers + who appoints whom. 3 Qs per exam usually.' },
  'Geography':                { tag:'HIGH VALUE ⚡', trick:'Longest river = Ganga, Highest peak = K2 (Kangchenjunga in India), Largest state = Rajasthan.', formula:'Physical + Political geography facts', examNote:'India-centered geography. Rivers, mountains, national parks most tested.' },
  'History':                  { tag:'MODERATE', trick:'Modern Indian history focus: 1857, Gandhi movements, Important Acts (1919, 1935), Independence 1947.', formula:'Timeline of major events | Viceroys | Independence movement leaders', examNote:'Usually 1–2 Qs. Focus on 1857 revolt, Non-cooperation, Quit India, 1947.' },
  'Important Dates & Events': { tag:'MODERATE', trick:'National days: Republic=26Jan, Independence=15Aug, Gandhi Jayanti=2Oct, Constitution=26Nov.', formula:'National/International days calendar', examNote:'Easy guaranteed marks. Memorize 20 important dates.' },
  'Books & Authors':          { tag:'MODERATE', trick:'Recent books by PM, President, prominent leaders. Also classic Indian authors.', formula:'Author → Book title pairs', examNote:'Dynamic + static. Focus on books published in last 2 years.' },
};

// Topics that have visual diagrams
const DIAGRAM_TOPICS = new Set([
  'Speed Distance & Time', 'Direction Sense', 'Time & Work',
  'Number Series', 'Blood Relations', 'Percentage', 'Light & Optics',
  'Current Electricity', 'Motion & Laws of Motion', 'Profit & Loss',
]);

// ─── Topic card component ─────────────────────────────────────────────────────
function TopicCard({
  topic, count, subject, totalTopicQs, subjectColor, subjectBadge, onPractice,
}: {
  topic: string; count: number; subject: string; totalTopicQs: number;
  subjectColor: string; subjectBadge: string;
  onPractice?: (subject: string, topic: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [showSol, setShowSol] = useState(false);
  const [showDiagram, setShowDiagram] = useState(false);

  const allQs = pyqsData as PYQ[];

  // Pick the best sample question (medium difficulty, has options)
  const sampleQ = useMemo(() => {
    const candidates = allQs.filter(q =>
      q.subject === subject && q.topic === topic &&
      q.options?.length >= 4 && q.question?.length > 30
    );
    return candidates.find(q => q.difficulty === 'medium') ??
           candidates.find(q => q.difficulty === 'easy') ??
           candidates[0] ?? null;
  }, [subject, topic]);

  const master = TOPIC_MASTERCLASS[topic];
  const pct = Math.round((count / totalTopicQs) * 100);
  const hasDiagram = DIAGRAM_TOPICS.has(topic);

  // Frequency tier
  const tier =
    count >= 80 ? { label: 'MUST DO 🔥', cls: 'bg-red-100 text-red-700 border-red-200' } :
    count >= 40 ? { label: 'HIGH VALUE ⚡', cls: 'bg-amber-100 text-amber-700 border-amber-200' } :
    count >= 20 ? { label: 'IMPORTANT', cls: 'bg-blue-100 text-blue-700 border-blue-200' } :
                  { label: 'GOOD TO KNOW', cls: 'bg-slate-100 text-slate-600 border-slate-200' };

  const enriched = sampleQ
    ? enrichSolution({
        question: sampleQ.question, options: sampleQ.options,
        correctAnswer: sampleQ.correctAnswer, subject: sampleQ.subject,
        topic: sampleQ.topic, sub_topic: sampleQ.sub_topic,
        existingSolution: sampleQ.solution,
      })
    : null;

  const finalSolution = enriched
    ? enrichedToText(enriched)
    : (sampleQ?.solution ?? '');

  return (
    <div className={cn(
      'rounded-2xl border overflow-hidden transition-all duration-300',
      open ? 'shadow-lg border-slate-300' : 'shadow-sm border-slate-200 hover:shadow-md hover:border-slate-300'
    )}>
      {/* ── Card header (always visible) ── */}
      <button
        className="w-full text-left p-4 bg-white hover:bg-slate-50/70 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider', tier.cls)}>
                {tier.label}
              </span>
              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', subjectBadge)}>
                {count} PYQs
              </span>
              <span className="text-[10px] text-slate-400 font-bold">{pct}% of subject</span>
              {hasDiagram && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                  📊 Visual
                </span>
              )}
            </div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-tight">{topic}</h3>
            {master && (
              <p className="text-xs text-slate-500 mt-1.5 line-clamp-1">
                <span className="font-bold text-amber-600">⚡</span> {master.trick}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {open ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
          </div>
        </div>
        {/* frequency bar */}
        <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full bg-gradient-to-r', subjectColor)}
            style={{ width: `${Math.min(100, (count / 200) * 100)}%` }}
          />
        </div>
      </button>

      {/* ── Expanded content ── */}
      {open && (
        <div className="border-t border-slate-100">

          {/* Visual diagram + action buttons row */}
          <div className="px-4 pt-4 flex flex-col sm:flex-row gap-3">
            {/* Diagram (if available) */}
            {hasDiagram && (
              <div className="sm:w-56 shrink-0">
                <button
                  onClick={() => setShowDiagram(d => !d)}
                  className="w-full text-[10px] font-black text-violet-700 bg-violet-50 border border-violet-200 rounded-xl px-3 py-1.5 mb-2 hover:bg-violet-100 transition-colors"
                >
                  {showDiagram ? '🔼 Hide Diagram' : '📊 Show Visual Diagram'}
                </button>
                {showDiagram && (
                  <div className="rounded-xl border border-violet-200 overflow-hidden bg-white aspect-[220/80]">
                    <TopicDiagram topic={topic} />
                  </div>
                )}
              </div>
            )}

            {/* Practice This Topic button */}
            {onPractice && (
              <div className={cn('flex-1', !hasDiagram && 'sm:w-full')}>
                <button
                  onClick={() => onPractice(subject, topic)}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl',
                    'bg-gradient-to-r font-bold text-white text-sm shadow-md',
                    'hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all duration-200',
                    subject === 'Mathematics'      ? 'from-blue-600 to-indigo-600'   :
                    subject === 'Reasoning'        ? 'from-purple-600 to-violet-600' :
                    subject === 'General Science'  ? 'from-emerald-600 to-teal-600' :
                                                     'from-amber-500 to-orange-600'
                  )}
                >
                  <PlayCircle size={16} />
                  Practice {topic} questions →
                </button>
                <p className="text-[10px] text-slate-400 text-center mt-1.5">
                  Opens {count} real PYQs filtered for this topic
                </p>
              </div>
            )}
          </div>

          {/* MASTERCLASS box */}
          {master && (
            <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100/60 border-b border-slate-100 mt-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Speed trick */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1.5">⚡ Speed Trick</p>
                  <p className="text-xs text-amber-900 font-semibold leading-relaxed">{master.trick}</p>
                </div>
                {/* Formula */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
                  <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-1.5">📐 Key Formula</p>
                  <p className="text-xs font-mono text-indigo-900 font-bold leading-relaxed">{master.formula}</p>
                </div>
                {/* Exam note */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                  <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1.5">🎯 RRB Exam Note</p>
                  <p className="text-xs text-emerald-900 font-semibold leading-relaxed">{master.examNote}</p>
                </div>
              </div>
            </div>
          )}

          {/* Sample question */}
          {sampleQ ? (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-slate-700 flex items-center justify-center">
                  <BookOpen size={12} className="text-white" />
                </div>
                <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest">
                  Sample PYQ — {sampleQ.exam_year} {sampleQ.shift}
                </p>
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto',
                  sampleQ.difficulty === 'easy'   ? 'bg-emerald-100 text-emerald-700' :
                  sampleQ.difficulty === 'hard'   ? 'bg-red-100 text-red-700'         :
                                                    'bg-amber-100 text-amber-700')}>
                  {sampleQ.difficulty}
                </span>
              </div>

              {/* Question */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 mb-3">
                <p className="text-sm font-medium text-slate-800 leading-relaxed">
                  {cleanText(sampleQ.question)}
                </p>
              </div>

              {/* Options grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                {sampleQ.options.map((opt, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm',
                      idx === sampleQ.correctAnswer
                        ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    )}
                  >
                    <span className={cn(
                      'w-7 h-7 rounded-md flex items-center justify-center text-xs font-black shrink-0',
                      idx === sampleQ.correctAnswer ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                    )}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="leading-tight">{cleanText(opt)}</span>
                    {idx === sampleQ.correctAnswer && (
                      <span className="ml-auto text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded font-black shrink-0">✓ ANS</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Solution toggle */}
              <SolutionDisplay
                solution={finalSolution}
                isVisible={showSol}
                onToggle={() => setShowSol(s => !s)}
              />
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-slate-400 italic">
              No sample question available for this topic.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main StudyModules component ──────────────────────────────────────────────
export function StudyModules({ onPractice }: StudyModulesProps) {
  const [activeSubject, setActiveSubject] = useState('Mathematics');

  const allQs = pyqsData as PYQ[];

  // Compute frequency table for active subject
  const topicData = useMemo(() => {
    const map: Record<string, number> = {};
    allQs.filter(q => q.subject === activeSubject).forEach(q => {
      map[q.topic] = (map[q.topic] ?? 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([topic, count]) => ({ topic, count }));
  }, [activeSubject]);

  const totalSubjectQs = allQs.filter(q => q.subject === activeSubject).length;
  const subjectCfg = SUBJECTS.find(s => s.id === activeSubject)!;

  const mustDoCount   = topicData.filter(t => t.count >= 80).length;
  const highValCount  = topicData.filter(t => t.count >= 40 && t.count < 80).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* ── PAGE HEADER ───────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl"
        style={{ background: 'linear-gradient(135deg, #1a237e 0%, #283593 40%, #0d47a1 100%)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ background: 'radial-gradient(ellipse at 20% 50%, #7c4dff 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, #00b0ff 0%, transparent 50%)' }} />
        <div className="relative p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-lg">
              <Brain size={28} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded-full">
                  RRB Group D Specialist
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Study Modules</h1>
              <p className="text-sm text-blue-200 mt-1">
                Only question types that actually appear — tricks, formulas, visual diagrams & real PYQs
              </p>
            </div>
          </div>

          {/* Subject stat pills */}
          <div className="flex flex-wrap gap-3 mt-5">
            {SUBJECTS.map(s => {
              const cnt = allQs.filter(q => q.subject === s.id).length;
              return (
                <div key={s.id} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/15">
                  <span className="text-base">{s.icon}</span>
                  <div>
                    <p className="text-[10px] font-black text-white/70 uppercase tracking-wider leading-none">{s.id.split(' ')[0]}</p>
                    <p className="text-sm font-black text-white leading-tight">{s.marks} marks · {cnt} PYQs</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── SUBJECT SELECTOR ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SUBJECTS.map(s => {
          const isActive = activeSubject === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSubject(s.id)}
              className={cn(
                'relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-300 border-2',
                isActive
                  ? 'border-transparent shadow-lg scale-[1.02]'
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-md bg-white'
              )}
            >
              {isActive && (
                <div className={cn('absolute inset-0 bg-gradient-to-br', s.color)} />
              )}
              <div className="relative z-10">
                <span className="text-2xl mb-2 block">{s.icon}</span>
                <p className={cn('font-black text-sm leading-tight', isActive ? 'text-white' : 'text-slate-800')}>
                  {s.label}
                </p>
                <p className={cn('text-[10px] font-bold mt-0.5', isActive ? 'text-white/70' : 'text-slate-400')}>
                  {s.marks} marks · {s.qs} Qs
                </p>
              </div>
              {isActive && (
                <div className="absolute bottom-2 right-2 w-2 h-2 bg-white/60 rounded-full animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── SUBJECT OVERVIEW BAR ──────────────────────────────────────── */}
      <div className={cn('rounded-2xl p-4 border flex flex-wrap items-center gap-4', subjectCfg.light)}>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-gradient-to-br shrink-0 shadow-sm', subjectCfg.color)}>
          {subjectCfg.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-slate-800 text-sm">{activeSubject}</p>
          <p className="text-[11px] text-slate-500">{topicData.length} topics · {totalSubjectQs} PYQs in database</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {mustDoCount > 0 && (
            <div className="flex items-center gap-1.5 bg-red-100 border border-red-200 px-3 py-1.5 rounded-xl">
              <Star size={12} className="text-red-600" fill="currentColor" />
              <span className="text-xs font-bold text-red-700">{mustDoCount} Must-Do Topics</span>
            </div>
          )}
          {highValCount > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-xl">
              <Zap size={12} className="text-amber-600" />
              <span className="text-xs font-bold text-amber-700">{highValCount} High-Value Topics</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl">
            <TrendingUp size={12} className="text-blue-600" />
            <span className="text-xs font-bold text-blue-700">Sorted by Frequency</span>
          </div>
        </div>
      </div>

      {/* ── EXAM STRATEGY ALERT ───────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-4 flex items-start gap-3">
        <Target size={18} className="text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-white font-bold text-sm mb-1">
            🎯 RRB Group D Exam Strategy — {activeSubject}
          </p>
          <p className="text-slate-300 text-xs leading-relaxed">
            {activeSubject === 'Mathematics' && 'Focus on topics with 50+ PYQs FIRST. These are the guaranteed marks. For Maths: master LCM method (T&W), 1% trick (Percentage), and back-substitution (Ages) — these 3 tricks alone cover 40% of Maths marks.'}
            {activeSubject === 'Reasoning' && 'Reasoning has 30 questions — highest section! Number Series + Direction Sense + Blood Relations together = 10–12 Qs. Fast students solve all 30 in 20 minutes. Practice drawing direction maps on paper instantly.'}
            {activeSubject === 'General Science' && 'Physics (Motion, Light, Electricity) = 8–9 Qs. Chemistry (Metals, Carbon) = 8–9 Qs. Biology (Cell, Human Systems) = 7–8 Qs. NCERT Class 9–10 covers 80% of Science PYQs.'}
            {activeSubject === 'General Awareness' && 'GA = 20 marks. Mix of Static (Constitution, History) + Dynamic (Awards, Current Events). Static GA never changes — memorize once, score always. Current affairs: last 6 months before exam.'}
          </p>
        </div>
      </div>

      {/* ── HOW TO USE THIS MODULE ────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200 rounded-2xl p-4">
        <p className="text-indigo-800 font-bold text-sm mb-2">📚 How to use these modules:</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { step: '1', icon: '🔥', text: 'Open MUST DO topics first — they appear in every exam shift' },
            { step: '2', icon: '📊', text: 'Toggle the Visual Diagram to understand the concept quickly' },
            { step: '3', icon: '▶️', text: 'Click "Practice" to solve all real PYQs for that specific topic' },
          ].map(({ step, icon, text }) => (
            <div key={step} className="flex items-start gap-2 bg-white rounded-xl p-3 border border-indigo-100">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{step}</span>
              <p className="text-xs text-slate-600 leading-relaxed"><span className="mr-1">{icon}</span>{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── TOPIC CARDS ───────────────────────────────────────────────── */}
      <div className="space-y-3">
        {topicData.map(({ topic, count }) => (
          <TopicCard
            key={topic}
            topic={topic}
            count={count}
            subject={activeSubject}
            totalTopicQs={totalSubjectQs}
            subjectColor={subjectCfg.color}
            subjectBadge={subjectCfg.badge}
            onPractice={onPractice}
          />
        ))}
      </div>

      {/* ── FOOTER NOTE ───────────────────────────────────────────────── */}
      <div className="text-center py-4 text-xs text-slate-400">
        <p>Topics sorted by frequency in RRB Group D PYQ database · {allQs.length.toLocaleString()} questions analysed</p>
        <p className="mt-1 font-bold text-slate-500">Click any topic → expand trick + formula + diagram + real PYQ with solution</p>
      </div>
    </div>
  );
}
