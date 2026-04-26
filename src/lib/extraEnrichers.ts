/**
 * Extra enrichers for missing Reasoning + Maths topics
 * Focuses on: Syllogism, Ranking, Seating, Mirror, Calendar, Clock,
 *             Trigonometry, Mixture/Alligation, Squares/Cube Roots, Statistics
 */

import type { QuestionContext, EnrichedSolution } from './solutionEnricher';

const LETTER = ['A','B','C','D'];
function nums(s: string): number[] {
  return [...s.matchAll(/-?\d+\.?\d*/g)].map(m => parseFloat(m[0])).filter(n => !isNaN(n));
}
function correctLabel(opts: string[], idx: number) { return `${LETTER[idx]}) ${opts[idx]}`; }
function wrongOpts(ctx: QuestionContext, reason: (o:string,i:number)=>string): string[] {
  return ctx.options.map((o,i)=>({o,i})).filter(x=>x.i!==ctx.correctAnswer)
    .map(x=>`Option ${LETTER[x.i]} — "${x.o}": ${reason(x.o,x.i)}`);
}

// ── SYLLOGISM ─────────────────────────────────────────────────────────────────
export function enrichSyllogism(ctx: QuestionContext): EnrichedSolution {
  const correct = ctx.options[ctx.correctAnswer];
  return {
    answer: correctLabel(ctx.options, ctx.correctAnswer),
    steps: [
      `Step 1: Draw Venn diagrams for each premise`,
      `Step 2: Mark overlapping regions (All A=B → circle A inside B)`,
      `Step 3: Test each conclusion against diagram`,
      `  "All A are B" → A is subset of B`,
      `  "Some A are B" → circles overlap`,
      `  "No A is B" → circles do not overlap`,
      `Step 4: Conclusion valid only if TRUE in ALL possible diagrams`,
      `∴ Answer = ${correct}`,
    ],
    speedTrick: [
      `⚡ Venn Trick (fastest):`,
      `All A→B: draw A inside B | Some A→B: overlapping circles | No A→B: separate circles`,
      `Possibility cases: "Either/or" conclusions — check if ONE must be true`,
      `If conclusion holds in ALL diagram cases → valid. If fails even once → invalid`,
    ],
    wrongOptions: wrongOpts(ctx, o=>`"${o}" fails in at least one valid Venn diagram arrangement for the given premises`),
    concept: [
      `→ All A are B → Some B are A (valid) | Some A are B (valid)`,
      `→ No A is B → No B is A (valid)`,
      `→ Some A are B + All B are C → Some A are C (valid)`,
      `→ Possibility: "Some A may be B" — valid unless explicitly ruled out`,
    ],
    examTip: `Draw Venn diagram for EVERY syllogism. Takes 20 seconds. Prevents ALL errors. Never solve mentally.`,
  };
}

// ── RANKING & ORDER ──────────────────────────────────────────────────────────
export function enrichRanking(ctx: QuestionContext): EnrichedSolution {
  const correct = ctx.options[ctx.correctAnswer];
  const q = ctx.question;
  const qn = nums(q);
  const total = qn.find(n=>n>5 && n<100) ?? 0;
  const rank = qn.find(n=>n>0 && n<total) ?? 0;
  const fromEnd = total - rank + 1;

  return {
    answer: correctLabel(ctx.options, ctx.correctAnswer),
    steps: [
      total>0 && rank>0 ? `Total = ${total}, Rank from top = ${rank}` : `Extract: total persons + rank from given direction`,
      total>0 && rank>0 ? `Rank from bottom = Total − Rank from top + 1 = ${total} − ${rank} + 1 = ${fromEnd}` : ``,
      `Formula: Rank(top) + Rank(bottom) = Total + 1`,
      `∴ Answer = ${correct}`,
    ].filter(Boolean),
    speedTrick: [
      `⚡ One formula: Rank(top) + Rank(bottom) = Total + 1`,
      total>0 && rank>0 ? `${rank} + Rank(bottom) = ${total} + 1 → Rank(bottom) = ${fromEnd}` : `Plug in known values → solve for unknown`,
      `Works for both row and column arrangements`,
    ],
    wrongOptions: wrongOpts(ctx, o=>`Formula: top+bottom=total+1 → ${rank}+bottom=${total+1} → bottom=${fromEnd} ≠ ${nums(o)[0]??o}`),
    concept: [`→ Rank(top) + Rank(bottom) = Total + 1`, `→ Position in row = same formula`],
    examTip: `Single formula: top + bottom = total + 1. Memorise this. Solves every ranking question in 10 seconds.`,
  };
}

// ── SEATING ARRANGEMENT ──────────────────────────────────────────────────────
export function enrichSeating(ctx: QuestionContext): EnrichedSolution {
  const correct = ctx.options[ctx.correctAnswer];
  return {
    answer: correctLabel(ctx.options, ctx.correctAnswer),
    steps: [
      `Step 1: Draw a row (linear) or circle with N seats`,
      `Step 2: Place FIXED persons first (given definite positions)`,
      `Step 3: Apply relative clues ("A is 2nd to right of B")`,
      `Step 4: Fill remaining by elimination`,
      `Step 5: Answer the question from completed arrangement`,
      `∴ Answer = ${correct}`,
    ],
    speedTrick: [
      `⚡ Circle: Fix one person as reference (saves 1 factorial arrangement)`,
      `Linear: Draw seats 1,2,3… left to right. Place anchors first.`,
      `"To the right" → higher seat number | "To the left" → lower seat number`,
      `Eliminate wrong options by testing against the arrangement`,
    ],
    wrongOptions: wrongOpts(ctx, o=>`"${o}" contradicts the seating arrangement derived from the given clues`),
    concept: [`→ Linear: fixed positions 1..N`, `→ Circular: relative positions only (no absolute left/right)`, `→ Opposite in circle of N = position + N/2`],
    examTip: `DRAW the arrangement on paper. Never attempt seating mentally — always draw, always correct.`,
  };
}

// ── MIRROR & WATER IMAGE ──────────────────────────────────────────────────────
export function enrichMirror(ctx: QuestionContext): EnrichedSolution {
  const correct = ctx.options[ctx.correctAnswer];
  const isWater = /water/i.test(ctx.question);
  return {
    answer: correctLabel(ctx.options, ctx.correctAnswer),
    steps: [
      isWater
        ? `Water image: FLIP VERTICALLY (top↔bottom). Left/right stay SAME.`
        : `Mirror image: FLIP HORIZONTALLY (left↔right). Top/bottom stay SAME.`,
      `For clock times: Mirror time = 11:60 − given time (or 12:00 − time for simpler)`,
      `For letters: Mirror flips left-right → b↔d, p↔q, M stays M`,
      `∴ Answer = ${correct}`,
    ],
    speedTrick: [
      isWater
        ? `⚡ Water = top/bottom flip. Check if upper part is now lower.`
        : `⚡ Mirror = left/right flip. Check if left part is now on right.`,
      `Clock mirror: 11:60 − actual = mirror time`,
      `E.g. actual 3:40 → mirror = 11:60−3:40 = 8:20`,
    ],
    wrongOptions: wrongOpts(ctx, o=>`"${o}" applies the wrong axis of reflection`),
    concept: [
      `→ Mirror (vertical plane): left↔right flip`,
      `→ Water (horizontal plane): top↔bottom flip`,
      `→ Clock mirror: 11:60 − time`,
    ],
    examTip: `Mirror = left-right swap. Water = top-bottom swap. For clocks: 11:60 minus the time shown.`,
  };
}

// ── CALENDAR & CLOCK ──────────────────────────────────────────────────────────
export function enrichCalendarClock(ctx: QuestionContext): EnrichedSolution {
  const correct = ctx.options[ctx.correctAnswer];
  const q = ctx.question;
  const qn = nums(q);
  const isClock = /clock|angle|minute|hour hand/i.test(q);

  if (isClock && qn.length >= 1) {
    const h = qn[0] % 12, m = qn[1] ?? 0;
    const angle = Math.abs(30 * h - 5.5 * m);
    const finalAngle = angle > 180 ? 360 - angle : angle;
    return {
      answer: correctLabel(ctx.options, ctx.correctAnswer),
      steps: [
        `Time: ${h}:${m < 10 ? '0'+m : m}`,
        `Hour hand moves: 0.5° per minute (360°/12hr = 30°/hr = 0.5°/min)`,
        `Minute hand moves: 6° per minute (360°/60min)`,
        `Hour hand position: ${h}×30 + ${m}×0.5 = ${h*30 + m*0.5}°`,
        `Minute hand position: ${m}×6 = ${m*6}°`,
        `Angle between = |${h*30+m*0.5} − ${m*6}| = ${Math.abs(h*30+m*0.5-m*6).toFixed(1)}°`,
        finalAngle !== Math.abs(h*30+m*0.5-m*6) ? `Reflex check: 360 − ${Math.abs(h*30+m*0.5-m*6).toFixed(1)} = ${finalAngle.toFixed(1)}°` : ``,
        `∴ Answer = ${correct}`,
      ].filter(Boolean),
      speedTrick: [
        `⚡ Formula: |30H − 5.5M|`,
        `= |30×${h} − 5.5×${m}| = |${30*h} − ${5.5*m}| = ${finalAngle.toFixed(1)}°`,
        `If > 180°: reflex angle = 360 − answer`,
      ],
      wrongOptions: wrongOpts(ctx, o=>`|30×${h}−5.5×${m}| = ${finalAngle.toFixed(1)}° ≠ ${nums(o)[0]??o}°`),
      concept: [`→ Angle = |30H − 5.5M|`, `→ Hour: 0.5°/min | Minute: 6°/min`, `→ If > 180 → 360 − angle`],
      examTip: `Memorize: |30H − 5.5M|. Fastest clock formula. Apply directly.`,
    };
  }

  // Calendar
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  return {
    answer: correctLabel(ctx.options, ctx.correctAnswer),
    steps: [
      `Odd days method: count total days from reference date`,
      `Divide by 7 → remainder = day offset`,
      `Odd days: Jan=3, Feb=0(normal)/1(leap), Mar=3, Apr=2, May=3, Jun=2, Jul=3, Aug=3, Sep=2, Oct=3, Nov=2, Dec=3`,
      `Leap year: divisible by 4 (except century years, which need ÷400)`,
      `∴ Answer = ${correct}`,
    ],
    speedTrick: [
      `⚡ Odd days: find remainder when total days ÷ 7`,
      `0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat`,
      `Century odd days: 100yr=5, 200yr=3, 300yr=1, 400yr=0`,
    ],
    wrongOptions: wrongOpts(ctx, o=>`Odd days calculation gives a different day than "${o}"`),
    concept: [`→ Odd days = total days mod 7`, `→ Leap: div by 4 (not century) or div by 400`],
    examTip: `For "what day was Jan 1, YYYY" — use odd days formula. Century years only leap if div by 400.`,
  };
}

// ── TRIGONOMETRY ──────────────────────────────────────────────────────────────
export function enrichTrigonometry(ctx: QuestionContext): EnrichedSolution {
  const correct = ctx.options[ctx.correctAnswer];
  const q = ctx.question;
  const qn = nums(q);
  const isHeight = /height|tower|pole|elevation|depression/i.test(q);
  const angle = qn.find(n=>n>0&&n<=90) ?? 45;
  const dist = qn.find(n=>n>angle&&n<10000) ?? 0;
  const tanVals: Record<number,string> = {30:'1/√3',45:'1',60:'√3',90:'∞'};
  const sinVals: Record<number,string> = {0:'0',30:'1/2',45:'1/√2',60:'√3/2',90:'1'};

  if (isHeight && dist > 0) {
    return {
      answer: correctLabel(ctx.options, ctx.correctAnswer),
      steps: [
        `Angle of elevation = ${angle}°, horizontal distance = ${dist}m`,
        `tan(${angle}°) = Height / Distance = Height / ${dist}`,
        `tan(${angle}°) = ${tanVals[angle] ?? 'value'}`,
        `Height = ${dist} × tan(${angle}°) = ${dist} × ${tanVals[angle]??'?'}`,
        `∴ Answer = ${correct}`,
      ],
      speedTrick: [
        `⚡ Heights/Distances: always use tan(angle) = opposite/adjacent`,
        `tan30°=1/√3≈0.577, tan45°=1, tan60°=√3≈1.732`,
        `Height = distance × tan(angle)`,
      ],
      wrongOptions: wrongOpts(ctx, o=>`Height = ${dist}×tan(${angle}°) ≠ ${nums(o)[0]??o}`),
      concept: [`→ tan θ = Perpendicular/Base`, `→ sin θ = P/H`, `→ cos θ = B/H`],
      examTip: `tan45°=1 is the most tested. tan60°=√3. If angle=45°, height=distance.`,
    };
  }

  return {
    answer: correctLabel(ctx.options, ctx.correctAnswer),
    steps: [
      `Standard values: sin30=½, sin45=1/√2, sin60=√3/2, sin90=1`,
      `cos30=√3/2, cos45=1/√2, cos60=½, cos90=0`,
      `tan30=1/√3, tan45=1, tan60=√3`,
      `Identity used: sin²θ+cos²θ=1, 1+tan²θ=sec²θ`,
      `∴ Answer = ${correct}`,
    ],
    speedTrick: [
      `⚡ Table: 0°,30°,45°,60°,90° → sin: 0,½,1/√2,√3/2,1`,
      `Trick: sin values = √0/2,√1/2,√2/2,√3/2,√4/2`,
      `cos is reverse of sin | tan = sin/cos`,
    ],
    wrongOptions: wrongOpts(ctx, o=>`Standard trig values or identity gives ${correct} ≠ ${nums(o)[0]??o}`),
    concept: [`→ sin²+cos²=1`, `→ 1+tan²=sec²`, `→ 1+cot²=cosec²`],
    examTip: `Memorize the 0/30/45/60/90 table cold. These 5 values cover 90% of RRB trig questions.`,
  };
}

// ── MIXTURE & ALLIGATION ──────────────────────────────────────────────────────
export function enrichMixture(ctx: QuestionContext): EnrichedSolution {
  const correct = ctx.options[ctx.correctAnswer];
  const q = ctx.question;
  const qn = nums(q);
  const c1 = qn[0] ?? 0, c2 = qn[1] ?? 0, mean = qn[2] ?? 0;
  const ratio1 = Math.abs(c2 - mean);
  const ratio2 = Math.abs(mean - c1);

  return {
    answer: correctLabel(ctx.options, ctx.correctAnswer),
    steps: [
      `Cost/concentration of ingredient 1: ${c1}`,
      `Cost/concentration of ingredient 2: ${c2}`,
      `Mean/desired value: ${mean}`,
      `Alligation rule:`,
      `  Cheaper  ${c1}     Dearer ${c2}`,
      `       \\         /`,
      `        Mean ${mean}`,
      `       /         \\`,
      `  (${c2}−${mean})=${ratio1}   (${mean}−${c1})=${ratio2}`,
      `Ratio of mixing = ${ratio1} : ${ratio2}`,
      `∴ Answer = ${correct}`,
    ],
    speedTrick: [
      `⚡ Alligation X-diagram:`,
      `Upper-left: ${c1} | Upper-right: ${c2} | Middle: ${mean}`,
      `Diagonal diff: |${c2}−${mean}|=${ratio1}  and  |${mean}−${c1}|=${ratio2}`,
      `Ratio = ${ratio1}:${ratio2} (cross subtract)`,
    ],
    wrongOptions: wrongOpts(ctx, o=>`Alligation gives ratio ${ratio1}:${ratio2}, not the ratio implied by "${o}"`),
    concept: [`→ Alligation: (dearer−mean):(mean−cheaper)`, `→ Works for price, concentration, speed, age`],
    examTip: `Draw X every time. Never add/subtract directly. Cross-subtract to get ratio.`,
  };
}

// ── SQUARES & CUBE ROOTS ──────────────────────────────────────────────────────
export function enrichSquaresCubes(ctx: QuestionContext): EnrichedSolution {
  const correct = ctx.options[ctx.correctAnswer];
  const q = ctx.question;
  const qn = nums(q);
  const n = qn[0] ?? 0;
  const sq = Math.sqrt(n);
  const cb = Math.cbrt(n);
  const isSq = Math.abs(sq - Math.round(sq)) < 0.001;
  const isCb = Math.abs(cb - Math.round(cb)) < 0.001;

  return {
    answer: correctLabel(ctx.options, ctx.correctAnswer),
    steps: [
      `Number: ${n}`,
      isSq ? `√${n} = ${Math.round(sq)} (perfect square: ${Math.round(sq)}² = ${n})` : `Estimate √${n} between ${Math.floor(sq)}² and ${Math.ceil(sq)}²`,
      isCb ? `∛${n} = ${Math.round(cb)} (perfect cube: ${Math.round(cb)}³ = ${n})` : ``,
      `∴ Answer = ${correct}`,
    ].filter(Boolean),
    speedTrick: [
      `⚡ Squares to memorise: 1²=1, 5²=25, 10²=100, 12²=144, 15²=225, 20²=400, 25²=625`,
      `⚡ Cubes: 1,8,27,64,125,216,343,512,729,1000`,
      isSq ? `Unit digit of ${n} is ${n%10} → ends in ${sq%10|0} or ${10-(sq%10|0)}` : ``,
      `For large squares: (a+b)² = a²+2ab+b²`,
    ].filter(Boolean),
    wrongOptions: wrongOpts(ctx, o=>`√${n}=${Math.round(sq)} or ∛${n}=${Math.round(cb)} ≠ ${nums(o)[0]??o}`),
    concept: [
      `→ Perfect squares: 1,4,9,16,25,36,49,64,81,100,121,144,169,196,225`,
      `→ Perfect cubes: 1,8,27,64,125,216,343,512,729,1000`,
      `→ Unit digit trick: squares end in 0,1,4,5,6,9 only`,
    ],
    examTip: `Memorise squares up to 30 and cubes up to 10. These questions are free marks.`,
  };
}

// ── STATISTICS ────────────────────────────────────────────────────────────────
export function enrichStatistics(ctx: QuestionContext): EnrichedSolution {
  const correct = ctx.options[ctx.correctAnswer];
  const q = ctx.question;
  const qn = nums(q);
  const isMean = /mean|average/i.test(q);
  const isMedian = /median/i.test(q);
  const isMode = /mode/i.test(q);
  const values = qn.slice(0, 10).sort((a,b)=>a-b);
  const sum = values.reduce((a,b)=>a+b,0);
  const mean = values.length ? sum/values.length : 0;
  const mid = Math.floor(values.length/2);
  const median = values.length%2===0 ? (values[mid-1]+values[mid])/2 : values[mid];

  return {
    answer: correctLabel(ctx.options, ctx.correctAnswer),
    steps: [
      `Values (sorted): ${values.join(', ')}`,
      isMean ? `Mean = Sum/Count = ${sum}/${values.length} = ${mean.toFixed(2)}` : ``,
      isMedian ? `Median: middle value of sorted data = ${median}` : ``,
      isMode ? `Mode = most frequently occurring value` : ``,
      `∴ Answer = ${correct}`,
    ].filter(Boolean),
    speedTrick: [
      `⚡ Mean: Sum ÷ Count`,
      `⚡ Median: sort → middle (odd count) or avg of 2 middles (even count)`,
      `⚡ Mode: value that repeats most`,
      `Relation: Mode = 3×Median − 2×Mean (empirical formula)`,
    ],
    wrongOptions: wrongOpts(ctx, o=>`Correct calculation gives ${correct} ≠ ${nums(o)[0]??o}`),
    concept: [`→ Mean = Σx/n`, `→ Median = middle of sorted data`, `→ Mode = most frequent`, `→ Mode = 3Median − 2Mean`],
    examTip: `Sort first for median. For mode: tally repeats. Mean is always Σx/n.`,
  };
}

// ── VENN DIAGRAM ─────────────────────────────────────────────────────────────
export function enrichVenn(ctx: QuestionContext): EnrichedSolution {
  const correct = ctx.options[ctx.correctAnswer];
  const qn = nums(ctx.question);
  const total = qn.find(n=>n>50) ?? 0;
  const a = qn[0]??0, b = qn[1]??0, both = qn[2]??0;
  const either = a + b - both;
  const neither = total > 0 ? total - either : 0;

  return {
    answer: correctLabel(ctx.options, ctx.correctAnswer),
    steps: [
      `n(A) = ${a}, n(B) = ${b}, n(A∩B) = ${both}${total>0?`, Total = ${total}`:''}`,
      `n(A∪B) = n(A) + n(B) − n(A∩B) = ${a} + ${b} − ${both} = ${either}`,
      total>0 ? `Neither = Total − n(A∪B) = ${total} − ${either} = ${neither}` : ``,
      `∴ Answer = ${correct}`,
    ].filter(Boolean),
    speedTrick: [
      `⚡ Union formula: n(A∪B) = n(A) + n(B) − n(A∩B)`,
      `= ${a} + ${b} − ${both} = ${either}`,
      `Neither = Total − Union = ${neither}`,
    ],
    wrongOptions: wrongOpts(ctx, o=>`n(A∪B)=${either}, Neither=${neither} ≠ ${nums(o)[0]??o}`),
    concept: [`→ n(A∪B) = n(A)+n(B)−n(A∩B)`, `→ Only A = n(A)−n(A∩B)`, `→ Neither = Total − n(A∪B)`],
    examTip: `Always use n(A∪B) = n(A)+n(B)−n(A∩B). Draw circles to visualise.`,
  };
}

// ── EXPORT MAP ────────────────────────────────────────────────────────────────
export const EXTRA_MATHS: Record<string,(ctx:QuestionContext)=>EnrichedSolution> = {
  'Trigonometry':         enrichTrigonometry,
  'Mixture & Alligation': enrichMixture,
  'Squares & Cube Roots': enrichSquaresCubes,
  'Statistics':           enrichStatistics,
};

export const EXTRA_REASONING: Record<string,(ctx:QuestionContext)=>EnrichedSolution> = {
  'Syllogism':                    enrichSyllogism,
  'Statement & Conclusion':       enrichSyllogism,
  'Ranking & Order':              enrichRanking,
  'Seating Arrangement':          enrichSeating,
  'Mirror & Water Image':         enrichMirror,
  'Embedded Figures':             enrichMirror,
  'Calendar & Clock':             enrichCalendarClock,
  'Venn Diagram':                 enrichVenn,
};
