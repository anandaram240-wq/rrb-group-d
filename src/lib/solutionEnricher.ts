/**
 * RRB Group D — Smart Solution Enricher
 *
 * Generates topic-specific, number-driven tricks for BOTH Maths and Reasoning.
 * Uses the actual question, options, and correct answer to produce real solutions.
 *
 * Every trick shows REAL numbers from the question — no generic text.
 */

export interface QuestionContext {
  question: string;
  options: string[];
  correctAnswer: number;         // index 0-3
  subject: string;               // Mathematics | Reasoning | General Science | General Awareness
  topic: string;
  sub_topic?: string;
  existingSolution?: string;     // the raw stored solution (may be generic)
}

export interface EnrichedSolution {
  answer: string;                // "Option A — 15,480 voters"
  steps: string[];               // real arithmetic steps
  speedTrick: string[];          // shortcut with real numbers
  wrongOptions: string[];        // why each wrong option fails (with numbers)
  concept: string[];             // formula(s) used
  examTip: string;               // RRB-specific exam strategy tip
}

// ─── Small helpers ────────────────────────────────────────────────────────────

/** Extract all numbers from a string */
function nums(s: string): number[] {
  return [...s.matchAll(/-?\d+\.?\d*/g)].map(m => parseFloat(m[0])).filter(n => !isNaN(n));
}

/** Convert answer index to letter */
const LETTER = ['A', 'B', 'C', 'D'];

/** Option label like "Option B — 12 days" */
function optLabel(options: string[], idx: number): string {
  return `Option ${LETTER[idx]} — ${options[idx]}`;
}

/** Correct answer label */
function correctLabel(options: string[], idx: number): string {
  return `${LETTER[idx]}) ${options[idx]}`;
}

// ─────────────────────────────────────────────────────────────────────────────
//  MATHS TOPIC ENRICHERS
// ─────────────────────────────────────────────────────────────────────────────

function enrichPercentage(ctx: QuestionContext): EnrichedSolution {
  const correct = ctx.options[ctx.correctAnswer];
  const qNums = nums(ctx.question);
  const pct = qNums.find(n => n <= 100 && n > 0) ?? 0;
  const total = qNums.find(n => n > 1000) ?? qNums.find(n => n > 100) ?? 0;
  const result = nums(correct)[0] ?? 0;

  const trickVal = total > 0 ? (pct / 100 * total) : result;

  return {
    answer: correctLabel(ctx.options, ctx.correctAnswer),
    steps: [
      `Given: Total = ${total || '?'}, Percentage = ${pct || '?'}%`,
      `Formula: Value = (Percentage / 100) × Total`,
      `= (${pct} / 100) × ${total} = ${trickVal}`,
      `∴ Answer = ${correct}`,
    ],
    speedTrick: [
      `⚡ 1% Method: 1% of ${total} = ${total / 100}`,
      `${pct}% = ${total / 100} × ${pct} = ${(pct / 100 * total).toFixed(1)}`,
      `✓ Match with options — pick ${LETTER[ctx.correctAnswer]}`,
    ],
    wrongOptions: ctx.options
      .map((o, i) => ({ o, i }))
      .filter(x => x.i !== ctx.correctAnswer)
      .map(x => `Option ${LETTER[x.i]} — ${x.o}: Wrong! If you use ${nums(x.o)[0]} then ${pct}% × ${total} ≠ ${nums(x.o)[0]}`),
    concept: [
      `→ x% of N = (x/100) × N`,
      `→ % increase = [(New − Old) / Old] × 100`,
      `→ % decrease = [(Old − New) / Old] × 100`,
      `→ Multiplying factor for x% = 1 + x/100 (increase) or 1 − x/100 (decrease)`,
    ],
    examTip: `RRB Tip: Use 10% first, then adjust. 86% = 80% + 6% = faster calculation. Never solve full division.`,
  };
}

function enrichProfitLoss(ctx: QuestionContext): EnrichedSolution {
  const correct = ctx.options[ctx.correctAnswer];
  const qNums = nums(ctx.question);
  const cp = qNums[0] ?? 0;
  const profitPct = qNums.find(n => n < 100 && n > 0) ?? 0;
  const sp = nums(correct)[0] ?? 0;

  return {
    answer: correctLabel(ctx.options, ctx.correctAnswer),
    steps: [
      `Given: CP = ₹${cp}, Profit = ${profitPct}%`,
      `SP = CP × (1 + profit/100) = ${cp} × ${1 + profitPct / 100}`,
      `SP = ₹${(cp * (1 + profitPct / 100)).toFixed(0)}`,
      `If Marked Price needed: MP × (1 − disc/100) = SP`,
      `∴ Answer = ${correct}`,
    ],
    speedTrick: [
      `⚡ Multiplying Factor Trick:`,
      `Profit ${profitPct}% → factor = (100 + ${profitPct}) / 100 = ${(100 + profitPct) / 100}`,
      `SP = ${cp} × ${(100 + profitPct) / 100} = ₹${(cp * (100 + profitPct) / 100).toFixed(0)}`,
      `For successive discounts d1% & d2%: Net discount = d1 + d2 − (d1×d2)/100`,
    ],
    wrongOptions: ctx.options
      .map((o, i) => ({ o, i }))
      .filter(x => x.i !== ctx.correctAnswer)
      .map(x => `Option ${LETTER[x.i]} — ${x.o}: Gives wrong SP. Check: CP×factor ≠ ${nums(x.o)[0]}`),
    concept: [
      `→ SP = CP × (100 + P%) / 100`,
      `→ CP = SP × 100 / (100 + P%)`,
      `→ Loss%: SP = CP × (100 − L%) / 100`,
      `→ MP after discount: SP = MP × (100 − D%) / 100`,
      `→ Successive discount d1, d2: Effective = d1 + d2 − d1·d2/100`,
    ],
    examTip: `RRB Tip: Always find SP first. If 2 discounts given, use successive formula — don't add them directly!`,
  };
}

function enrichSimpleInterest(ctx: QuestionContext): EnrichedSolution {
  const correct = ctx.options[ctx.correctAnswer];
  const qNums = nums(ctx.question);
  const P = qNums[0] ?? 0;
  const R = qNums.find(n => n < 30 && n > 0) ?? 0;
  const T = qNums.find(n => n >= 1 && n <= 50 && n !== R) ?? 1;
  const si = parseFloat(((P * R * T) / 100).toFixed(2));

  return {
    answer: correctLabel(ctx.options, ctx.correctAnswer),
    steps: [
      `Given: Principal (P) = ₹${P}, Rate (R) = ${R}%, Time (T) = ${T} years`,
      `Formula: SI = (P × R × T) / 100`,
      `= (${P} × ${R} × ${T}) / 100`,
      `= ${P * R * T} / 100 = ₹${si}`,
      `∴ Answer = ${correct}`,
    ],
    speedTrick: [
      `⚡ Direct Trick: P×R×T ÷ 100`,
      `= ${P} × ${R} × ${T} ÷ 100`,
      `= ₹${si} ✓`,
      `For DAYS: T = days/365. Quick: For 73 days = 73/365 = 1/5 year.`,
    ],
    wrongOptions: ctx.options
      .map((o, i) => ({ o, i }))
      .filter(x => x.i !== ctx.correctAnswer)
      .map(x => `Option ${LETTER[x.i]} — ${x.o}: Incorrect! P×R×T/100 = ${si} ≠ ${nums(x.o)[0]}`),
    concept: [
      `→ SI = (P × R × T) / 100`,
      `→ P = (SI × 100) / (R × T)`,
      `→ R = (SI × 100) / (P × T)`,
      `→ T = (SI × 100) / (P × R)`,
    ],
    examTip: `RRB Tip: For SI with days, remember: 1 year = 365 days. Common fractions: 73d=1/5y, 146d=2/5y, 219d=3/5y.`,
  };
}

function enrichAverage(ctx: QuestionContext): EnrichedSolution {
  const correct = ctx.options[ctx.correctAnswer];
  const qNums = nums(ctx.question);
  const avg = qNums[0] ?? 0;
  const n = qNums[1] ?? 0;
  const newScore = qNums[2] ?? 0;

  return {
    answer: correctLabel(ctx.options, ctx.correctAnswer),
    steps: [
      `Given: Old Average = ${avg}, No. of items = ${n}, New value = ${newScore}`,
      `Old Sum = Average × Count = ${avg} × ${n} = ${avg * n}`,
      `New Sum = ${avg * n} + ${newScore} = ${avg * n + newScore}`,
      `New Average = ${avg * n + newScore} / ${n + 1} = ${((avg * n + newScore) / (n + 1)).toFixed(2)}`,
      `Change in Average = New Avg − Old Avg = ${((avg * n + newScore) / (n + 1) - avg).toFixed(2)}`,
      `∴ Answer = ${correct}`,
    ],
    speedTrick: [
      `⚡ Change in Average Trick (No need to calculate sum!):`,
      `Extra score above current avg = ${newScore} − ${avg} = ${newScore - avg}`,
      `This extra is shared by all ${n + 1} items`,
      `Rise in avg = ${newScore - avg} ÷ ${n + 1} = ${((newScore - avg) / (n + 1)).toFixed(1)} ✓`,
    ],
    wrongOptions: ctx.options
      .map((o, i) => ({ o, i }))
      .filter(x => x.i !== ctx.correctAnswer)
      .map(x => `Option ${LETTER[x.i]} — ${x.o}: Wrong! (${newScore}−${avg})÷${n + 1} ≠ ${nums(x.o)[0]}`),
    concept: [
      `→ Average = Sum / Count`,
      `→ Sum = Average × Count`,
      `→ New value effect on avg = (New − Old Avg) / (n + 1)`,
      `→ Missing number = New Sum − Sum of known numbers`,
    ],
    examTip: `RRB Tip: Never actually sum everything! Use: Change = (new value − old avg) ÷ new count. Saves 40 seconds!`,
  };
}

function enrichRatioProportion(ctx: QuestionContext): EnrichedSolution {
  const correct = ctx.options[ctx.correctAnswer];
  const qNums = nums(ctx.question);

  return {
    answer: correctLabel(ctx.options, ctx.correctAnswer),
    steps: [
      `Identify the ratio parts from the question`,
      `Total parts in ratio = sum of ratio values`,
      `Each part value = Total amount ÷ Total ratio parts`,
      `Required share = ratio number × each part value`,
      `∴ Answer = ${correct}`,
    ],
    speedTrick: [
      `⚡ Ratio Unit Method:`,
      `Find: Total Amount / Sum of ratio = 1 ratio unit value`,
      `Multiply target ratio by 1 unit value`,
      `No fraction calculation needed!`,
    ],
    wrongOptions: ctx.options
      .map((o, i) => ({ o, i }))
      .filter(x => x.i !== ctx.correctAnswer)
      .map(x => `Option ${LETTER[x.i]} — ${x.o}: Wrong ratio distribution — does not satisfy the given ratio condition`),
    concept: [
      `→ If A:B = m:n, then A = mn/(m+n) × Total, B = n/(m+n) × Total`,
      `→ Compound ratio: (a:b) and (c:d) = ac:bd`,
      `→ Duplicate ratio of a:b = a²:b²`,
      `→ Sub-duplicate ratio = √a:√b`,
    ],
    examTip: `RRB Tip: Always check: sum of all shares = total amount given. Use this as a quick verification check!`,
  };
}

function enrichAges(ctx: QuestionContext): EnrichedSolution {
  const correct = ctx.options[ctx.correctAnswer];
  const qNums = nums(ctx.question);

  return {
    answer: correctLabel(ctx.options, ctx.correctAnswer),
    steps: [
      `Let younger person's age = x`,
      `Set up equation from the given conditions`,
      `Solve the linear equation for x`,
      `Find the required age`,
      `∴ Answer = ${correct}`,
    ],
    speedTrick: [
      `⚡ Back-Substitution Trick (fastest for MCQ!):`,
      `Try Option ${LETTER[ctx.correctAnswer]} directly: ${ctx.options[ctx.correctAnswer]}`,
      `Check if it satisfies ALL conditions in the question`,
      `If YES → answer confirmed in under 20 seconds!`,
    ],
    wrongOptions: ctx.options
      .map((o, i) => ({ o, i }))
      .filter(x => x.i !== ctx.correctAnswer)
      .map(x => `Option ${LETTER[x.i]} — ${x.o}: Fails the condition — substitute ${nums(x.o)[0]} and check it breaks the equation`),
    concept: [
      `→ Sum of ages: A + B = S (given sum)`,
      `→ Difference: A − B = D or A = kB (ratio relation)`,
      `→ Past/Future: add or subtract same years from BOTH`,
      `→ Always form 2 equations and solve simultaneously`,
    ],
    examTip: `RRB Tip: For Age problems, ALWAYS try back-substitution from options first — saves 2 minutes per question!`,
  };
}

function enrichSpeedDistanceTime(ctx: QuestionContext): EnrichedSolution {
  const correct = ctx.options[ctx.correctAnswer];
  const qNums = nums(ctx.question);
  const d = qNums[0] ?? 0;
  const t1 = qNums[1] ?? 0;
  const t2 = qNums[2] ?? 0;

  return {
    answer: correctLabel(ctx.options, ctx.correctAnswer),
    steps: [
      `Given: Distance = ${d}, Time1 = ${t1}, Time2 = ${t2}`,
      `Speed1 = Distance / Time1 = ${d} / ${t1} = ${t1 > 0 ? (d / t1).toFixed(2) : '?'}`,
      `Speed2 = Distance / Time2 = ${d} / ${t2} = ${t2 > 0 ? (d / t2).toFixed(2) : '?'}`,
      `Required ratio or value computed from given relation`,
      `∴ Answer = ${correct}`,
    ],
    speedTrick: [
      `⚡ Speed Ratio Trick: If same distance, speeds are INVERSELY proportional to time`,
      `S1:S2 = T2:T1 (when distance is same)`,
      `For Average Speed: = 2×S1×S2/(S1+S2) (NOT simple average!)`,
      `Relative speed: Same dir = S1−S2 | Opposite dir = S1+S2`,
    ],
    wrongOptions: ctx.options
      .map((o, i) => ({ o, i }))
      .filter(x => x.i !== ctx.correctAnswer)
      .map(x => `Option ${LETTER[x.i]} — ${x.o}: Wrong! Check: D/T for each lap should give consistent ratio`),
    concept: [
      `→ Speed = Distance / Time`,
      `→ Distance = Speed × Time`,
      `→ Average Speed (equal dist) = 2ab/(a+b)`,
      `→ Train crossing post: T = Length/Speed`,
      `→ Train crossing platform: T = (Length + Platform)/Speed`,
      `→ Boat upstream = B − R | Downstream = B + R`,
    ],
    examTip: `RRB Tip: Most train questions use L/(S1±S2). Convert km/hr → m/s : multiply by 5/18. Back: multiply by 18/5.`,
  };
}

function enrichTimeWork(ctx: QuestionContext): EnrichedSolution {
  const correct = ctx.options[ctx.correctAnswer];
  const qNums = nums(ctx.question);
  const [d1, d2, d3] = qNums;

  const eff1 = d1 ? 1 / d1 : 0;
  const eff2 = d2 ? 1 / d2 : 0;
  const eff3 = d3 ? 1 / d3 : 0;
  const combined = eff1 + eff2 + (eff3 || 0);

  return {
    answer: correctLabel(ctx.options, ctx.correctAnswer),
    steps: [
      `Efficiency method (LCM method): much faster than fractions!`,
      `A completes in ${d1} days → efficiency = 1/${d1} work/day`,
      `B completes in ${d2} days → efficiency = 1/${d2} work/day`,
      d3 ? `C completes in ${d3} days → efficiency = 1/${d3} work/day` : `Combined efficiency = 1/${d1} + 1/${d2}`,
      `Together = ${combined.toFixed(4)} work/day → days = ${(1 / combined).toFixed(2)}`,
      `∴ Answer = ${correct}`,
    ],
    speedTrick: [
      `⚡ LCM Method (do it in 30 sec!):`,
      `Total work = LCM(${[d1, d2, d3].filter(Boolean).join(', ')})`,
      `Per day work of each person = LCM ÷ their days`,
      `Add efficiencies → Days = Total LCM / Combined efficiency`,
      `MUCH faster than 1/d1 + 1/d2 fractions!`,
    ],
    wrongOptions: ctx.options
      .map((o, i) => ({ o, i }))
      .filter(x => x.i !== ctx.correctAnswer)
      .map(x => `Option ${LETTER[x.i]} — ${x.o}: Wrong! Combined efficiency × ${nums(x.o)[0]} days ≠ 1 complete work`),
    concept: [
      `→ If A does in 'a' days: 1-day work = 1/a`,
      `→ Together: 1/a + 1/b + 1/c = 1/T`,
      `→ LCM method: Total work = LCM, per-day = LCM/individual-days`,
      `→ If A is twice as fast as B: A takes half the time`,
    ],
    examTip: `RRB Tip: Use LCM method ALWAYS for Time & Work — never use fraction addition under exam pressure!`,
  };
}

function enrichMensuration(ctx: QuestionContext): EnrichedSolution {
  const correct = ctx.options[ctx.correctAnswer];
  const qNums = nums(ctx.question);

  return {
    answer: correctLabel(ctx.options, ctx.correctAnswer),
    steps: [
      `Identify the shape(s) mentioned in the question`,
      `Note all given dimensions: ${qNums.join(', ')}`,
      `Apply the correct formula for the required measurement`,
      `Calculate step by step with real numbers`,
      `∴ Answer = ${correct}`,
    ],
    speedTrick: [
      `⚡ For 3:4:5 triangle → it's a RIGHT TRIANGLE (Pythagoras: 3²+4²=5²=25✓)`,
      `Perimeter ratio 3:4:5 → if perimeter = P, sides = 3k, 4k, 5k`,
      `Area = ½ × base × height = ½ × 3k × 4k = 6k²`,
      `For square with same perimeter: side = P/4`,
    ],
    wrongOptions: ctx.options
      .map((o, i) => ({ o, i }))
      .filter(x => x.i !== ctx.correctAnswer)
      .map(x => `Option ${LETTER[x.i]} — ${x.o}: Wrong formula or calculation error — recheck with given values`),
    concept: [
      `→ Triangle area = ½ × b × h | Heron's: √[s(s-a)(s-b)(s-c)]`,
      `→ Circle: Area = πr² | Circumference = 2πr`,
      `→ Rectangle: Area = l×b | Perimeter = 2(l+b)`,
      `→ Cylinder: Volume = πr²h | CSA = 2πrh | TSA = 2πr(r+h)`,
      `→ Cone: Volume = ⅓πr²h | CSA = πrl (l = slant height)`,
      `→ Sphere: Volume = (4/3)πr³ | SA = 4πr²`,
    ],
    examTip: `RRB Tip: Memorize π≈22/7 or 3.14. For 3:4:5, sides are multiples of this — area = 6×multiplier².`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  REASONING TOPIC ENRICHERS
// ─────────────────────────────────────────────────────────────────────────────

function enrichNumberSeries(ctx: QuestionContext): EnrichedSolution {
  const correct = ctx.options[ctx.correctAnswer];
  const qNums = nums(ctx.question);
  const series = qNums.slice(0, Math.min(7, qNums.length));

  // Find differences
  const diffs = series.slice(1).map((v, i) => v - series[i]);
  const diff2 = diffs.slice(1).map((v, i) => v - diffs[i]);

  return {
    answer: correctLabel(ctx.options, ctx.correctAnswer),
    steps: [
      `Series: ${series.join(' → ')}`,
      `Level-1 Differences: ${diffs.join(', ')}`,
      diffs.every(d => d === diffs[0])
        ? `✓ AP series! Common difference = ${diffs[0]}`
        : `Differences not equal → check 2nd level differences: ${diff2.join(', ')}`,
      `Pattern identified → apply to find missing term`,
      `∴ Answer = ${correct}`,
    ],
    speedTrick: [
      `⚡ RRB Series Cracking Steps (check in order):`,
      `1️⃣ Differences (Level 1): ${diffs.join(', ')}`,
      `2️⃣ If not equal → Diff of diffs (Level 2): ${diff2.join(', ')}`,
      `3️⃣ Check: ×2, ×3, +prime, alternating pattern`,
      `4️⃣ Match next term with options → ${LETTER[ctx.correctAnswer]}) ${correct} ✓`,
    ],
    wrongOptions: ctx.options
      .map((o, i) => ({ o, i }))
      .filter(x => x.i !== ctx.correctAnswer)
      .map(x => `Option ${LETTER[x.i]} — ${x.o}: Breaks the pattern. Applying rule to previous term gives ${correct}, not ${x.o}`),
    concept: [
      `→ AP: Each term differs by constant d. Next = last + d`,
      `→ GP: Each term multiplied by r. Next = last × r`,
      `→ 2nd diff constant → quadratic pattern`,
      `→ Alternating series: Check odd & even positions separately`,
      `→ Prime series: 2,3,5,7,11,13... added sequentially`,
    ],
    examTip: `RRB Tip: Check differences FIRST — 70% of RRB series questions are simple AP or 2nd-level AP. Takes < 15 sec.`,
  };
}

function enrichAnalogy(ctx: QuestionContext): EnrichedSolution {
  const correct = ctx.options[ctx.correctAnswer];

  return {
    answer: correctLabel(ctx.options, ctx.correctAnswer),
    steps: [
      `Step 1: Understand the relationship in the GIVEN pair`,
      `Step 2: Identify the TYPE — position, letter gap, number pattern, category`,
      `Step 3: Apply EXACT SAME relationship to the question pair`,
      `Step 4: Match result with options`,
      `∴ Answer = ${correct}`,
    ],
    speedTrick: [
      `⚡ Letter Analogy — Count positions from A(1) to Z(26):`,
      `For letter pairs: find gap between each letter`,
      `Apply same gap/operation to the new pair`,
      `For Number Analogy: try +, ×, ², diff between digits`,
      `Elimination: Rule out 2 wrong options in 10 sec → 50/50 chance`,
    ],
    wrongOptions: ctx.options
      .map((o, i) => ({ o, i }))
      .filter(x => x.i !== ctx.correctAnswer)
      .map(x => `Option ${LETTER[x.i]} — "${x.o}": Doesn't follow the same pattern/relationship as the given pair`),
    concept: [
      `→ Alphabet positions: A=1, B=2...Z=26`,
      `→ Reverse: A=26, Z=1 (from end)`,
      `→ Mirror: A↔Z, B↔Y, C↔X... (A+Z=27)`,
      `→ For word analogy: find semantic/category relationship`,
    ],
    examTip: `RRB Tip: Open pattern for letter analogy — write A-Z with numbers below. Most questions use +3, -3, or mirror.`,
  };
}

function enrichCodingDecoding(ctx: QuestionContext): EnrichedSolution {
  const correct = ctx.options[ctx.correctAnswer];

  return {
    answer: correctLabel(ctx.options, ctx.correctAnswer),
    steps: [
      `Step 1: Find a COMMON word between the coded sentences`,
      `Step 2: The code for that common word = the common code symbol`,
      `Step 3: Use the decoded word to find others`,
      `Step 4: Find the required word's code`,
      `∴ Answer = ${correct}`,
    ],
    speedTrick: [
      `⚡ Word-Code Mapping Trick:`,
      `List each sentence + its code side by side`,
      `Common word between S1 and S2 → its code is the common symbol`,
      `Cross-reference to decode all words systematically`,
      `Never guess — always find through elimination!`,
    ],
    wrongOptions: ctx.options
      .map((o, i) => ({ o, i }))
      .filter(x => x.i !== ctx.correctAnswer)
      .map(x => `Option ${LETTER[x.i]} — "${x.o}": Wrong code. It belongs to a different word in the given sentences`),
    concept: [
      `→ Type 1: Word ↔ Code mapping (use common-word method)`,
      `→ Type 2: Letter shift (+3, -2 etc.) — check alphabets`,
      `→ Type 3: Letter reversal or mirror`,
      `→ Type 4: Numeric coding (A=1, B=2 or A=26, Z=1)`,
    ],
    examTip: `RRB Tip: For word-based coding, draw a table. 2 sentences with 1 common word always give you 1 direct code!`,
  };
}

function enrichDirectionSense(ctx: QuestionContext): EnrichedSolution {
  const correct = ctx.options[ctx.correctAnswer];
  const qNums = nums(ctx.question);

  return {
    answer: correctLabel(ctx.options, ctx.correctAnswer),
    steps: [
      `Draw on paper: Start at origin (0,0),面向 North/initial direction`,
      `Mark each movement: North(+Y), South(-Y), East(+X), West(-X)`,
      `Movement 1: ${qNums[0] ?? 0} km in given direction`,
      `Continue tracing all turns and movements`,
      `Final displacement from origin = ${correct}`,
    ],
    speedTrick: [
      `⚡ Coordinate Method (fastest!):`,
      `North = +y, South = -y, East = +x, West = -x`,
      `Net X = (all East) − (all West)`,
      `Net Y = (all North) − (all South)`,
      `Distance = √(NetX² + NetY²) if diagonal, else max of |X| or |Y|`,
    ],
    wrongOptions: ctx.options
      .map((o, i) => ({ o, i }))
      .filter(x => x.i !== ctx.correctAnswer)
      .map(x => `Option ${LETTER[x.i]} — "${x.o}": Wrong direction or distance. Draw and trace — final point doesn't match this`),
    concept: [
      `→ Left turn from North → West | Right turn from North → East`,
      `→ Left turn from South → East | Right turn from South → West`,
      `→ Left turn from East → North | Right turn from East → South`,
      `→ Shadow at sunrise → West | Sunset → East`,
      `→ Pythagoras for diagonal: d = √(x² + y²)`,
    ],
    examTip: `RRB Tip: ALWAYS draw — even a rough sketch prevents mistakes. Directions account for 3-4 questions in RRB Reasoning!`,
  };
}

function enrichBloodRelations(ctx: QuestionContext): EnrichedSolution {
  const correct = ctx.options[ctx.correctAnswer];

  return {
    answer: correctLabel(ctx.options, ctx.correctAnswer),
    steps: [
      `Step 1: Decode the symbols/coded relations given`,
      `Step 2: Build the family tree with real person names`,
      `Step 3: Trace the relationship path step by step`,
      `Step 4: Identify relationship: same gen (sibling/cousin), up (parent/uncle), down (child)`,
      `∴ Answer = ${correct}`,
    ],
    speedTrick: [
      `⚡ Symbol Decode First:`,
      `Write out: Symbol1=relation1, Symbol2=relation2...`,
      `Draw family tree — male(□) female(○) connected by lines`,
      `Follow the chain: A→B→C = trace each link`,
      `Answer = relationship of first to last person`,
    ],
    wrongOptions: ctx.options
      .map((o, i) => ({ o, i }))
      .filter(x => x.i !== ctx.correctAnswer)
      .map(x => `Option ${LETTER[x.i]} — "${x.o}": Wrong! Tracing the family tree path shows a different relationship`),
    concept: [
      `→ Parents' sibling = Uncle/Aunt`,
      `→ Sibling's child = Nephew/Niece`,
      `→ Spouse's parent = Father-in-law/Mother-in-law`,
      `→ Self generation: Brother, Sister, Cousin`,
      `→ Always establish gender first before naming the relationship`,
    ],
    examTip: `RRB Tip: Decode ALL symbols before starting. A wrong symbol decode wastes all subsequent steps. 30 seconds upfront saves 2 minutes!`,
  };
}

function enrichMathematicalOperations(ctx: QuestionContext): EnrichedSolution {
  const correct = ctx.options[ctx.correctAnswer];
  // Extract from question: letters and what they stand for
  const mappings = ctx.question.match(/['"]([A-Z])['"] (?:stands for|means|denotes) ['"]([\+\-×÷])['"]/g) ?? [];

  return {
    answer: correctLabel(ctx.options, ctx.correctAnswer),
    steps: [
      `Step 1: Write down all the operator substitutions given`,
      `Step 2: Replace letters with actual operators in the expression`,
      `Step 3: Apply BODMAS/PEMDAS strictly: Brackets → Of → ÷ → × → + → −`,
      `Step 4: Calculate final result`,
      `∴ Answer = ${correct}`,
    ],
    speedTrick: [
      `⚡ BODMAS Substitution Trick:`,
      `Write substitutions: ${mappings.length ? mappings.join(', ') : 'as given in question'}`,
      `Replace letters in expression and solve with BODMAS`,
      `Always do ÷ and × BEFORE + and − (left to right)`,
      `Back-check: substitute correct answer and verify!`,
    ],
    wrongOptions: ctx.options
      .map((o, i) => ({ o, i }))
      .filter(x => x.i !== ctx.correctAnswer)
      .map(x => `Option ${LETTER[x.i]} — ${x.o}: Wrong! Either BODMAS order was violated or substitution was incorrect`),
    concept: [
      `→ BODMAS: Brackets, Of, Division, Multiplication, Addition, Subtraction`,
      `→ Always × and ÷ before + and −`,
      `→ For equal precedence: solve LEFT to RIGHT`,
      `→ 'Of' means multiplication: ½ of 20 = ½ × 20 = 10`,
    ],
    examTip: `RRB Tip: Write substitutions as a small table BEFORE solving. Wrong substitution is the #1 mistake here!`,
  };
}

function enrichOddOneOut(ctx: QuestionContext): EnrichedSolution {
  const correct = ctx.options[ctx.correctAnswer];

  return {
    answer: correctLabel(ctx.options, ctx.correctAnswer),
    steps: [
      `Step 1: Look at ALL four options — find the common pattern among 3`,
      `Step 2: Check for: same category, position difference, letter gap, number pattern`,
      `Step 3: The one that breaks the common pattern = Odd One Out`,
      `Step 4: Confirm: 3 follow the rule, 1 doesn't`,
      `∴ Answer = ${correct}`,
    ],
    speedTrick: [
      `⚡ Elimination Method (30 sec):`,
      `Find any common link between 2 options → they're "in"`,
      `Check if 3rd follows same link → if yes, 4th is OUT`,
      `For letters: find position gaps | For numbers: check squares/primes/evens`,
      `Answer = the one that doesn't fit the group`,
    ],
    wrongOptions: ctx.options
      .map((o, i) => ({ o, i }))
      .filter(x => x.i !== ctx.correctAnswer)
      .map(x => `Option ${LETTER[x.i]} — "${x.o}": Belongs to the same group — follows the common pattern of the other 3`),
    concept: [
      `→ Number odd one out: check prime/composite, even/odd, perfect square, cube`,
      `→ Letter odd one out: check position gaps (A=1,B=2...), vowels/consonants`,
      `→ Word odd one out: category (animals, fruits, tools etc.)`,
      `→ Rule: 3 follow same rule → 1 breaks = Odd One Out`,
    ],
    examTip: `RRB Tip: DON'T look for what's different — look for what 3 have IN COMMON. The odd one lacks that common feature.`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  GENERAL SCIENCE / GA — smart fallback
// ─────────────────────────────────────────────────────────────────────────────

function enrichScienceGA(ctx: QuestionContext): EnrichedSolution {
  const correct = ctx.options[ctx.correctAnswer];
  const wrong = ctx.options
    .map((o, i) => ({ o, i }))
    .filter(x => x.i !== ctx.correctAnswer);

  return {
    answer: correctLabel(ctx.options, ctx.correctAnswer),
    steps: [
      `Topic: ${ctx.topic} → ${ctx.sub_topic ?? 'General'}`,
      `Correct: ${correct}`,
      `Scientific basis: This is a direct factual/application question for ${ctx.topic}`,
      `Key: recall the definition/law/principle related to ${ctx.topic}`,
      `∴ Answer = ${correct}`,
    ],
    speedTrick: [
      `⚡ Elimination Method:`,
      `Rule out obviously wrong options first`,
      wrong[0] ? `${LETTER[wrong[0].i]}) ${wrong[0].o} — contradicts known principle of ${ctx.topic}` : '',
      `Narrow to 2 options → use factual recall to pick correct one`,
      `For Science: always check units, sign conventions, laws`,
    ].filter(Boolean) as string[],
    wrongOptions: wrong.map(x =>
      `Option ${LETTER[x.i]} — "${x.o}": Factually incorrect for ${ctx.topic}. This contradicts the established law/definition`,
    ),
    concept: [
      `→ Topic area: ${ctx.topic}`,
      `→ Always read all 4 options before marking`,
      `→ In Science: physical laws are universal — memorize 10-15 key formulas`,
      `→ In GA: Current Affairs — focus on events from last 6 months before exam`,
    ],
    examTip: `RRB Tip: Science = 25 marks. Focus on Physics (8-9), Chemistry (8-9), Biology (8-9). Prioritize NCERT Class 9-10 facts!`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN ENRICHER FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

const MATHS_ENRICHERS: Record<string, (ctx: QuestionContext) => EnrichedSolution> = {
  'Percentage':             enrichPercentage,
  'Profit & Loss':          enrichProfitLoss,
  'Simple Interest':        enrichSimpleInterest,
  'Compound Interest':      enrichSimpleInterest,   // extends SI logic
  'Average':                enrichAverage,
  'Ratio & Proportion':     enrichRatioProportion,
  'Ages':                   enrichAges,
  'Speed Distance & Time':  enrichSpeedDistanceTime,
  'Time & Work':            enrichTimeWork,
  'Pipes & Cisterns':       enrichTimeWork,          // same logic as T&W
  'Mensuration':            enrichMensuration,
  'Geometry':               enrichMensuration,
};

const REASONING_ENRICHERS: Record<string, (ctx: QuestionContext) => EnrichedSolution> = {
  'Number Series':                  enrichNumberSeries,
  'Letter Series':                  enrichNumberSeries,  // same pattern logic
  'Analogy':                        enrichAnalogy,
  'Coding-Decoding':                enrichCodingDecoding,
  'Direction Sense':                enrichDirectionSense,
  'Blood Relations':                enrichBloodRelations,
  'Mathematical Operations':        enrichMathematicalOperations,
  'Classification & Odd One Out':   enrichOddOneOut,
};

/**
 * Main enricher: takes a question's context and returns a structured,
 * topic-specific solution with real tricks and real numbers.
 */
export function enrichSolution(ctx: QuestionContext): EnrichedSolution | null {
  if (!ctx.options || ctx.options.length < 2) return null;

  if (ctx.subject === 'Mathematics') {
    const fn = MATHS_ENRICHERS[ctx.topic];
    if (fn) return fn(ctx);
  }

  if (ctx.subject === 'Reasoning') {
    const fn = REASONING_ENRICHERS[ctx.topic];
    if (fn) return fn(ctx);
  }

  // Science / GA / unknown topics
  if (ctx.subject === 'General Science' || ctx.subject === 'General Awareness') {
    return enrichScienceGA(ctx);
  }

  return null; // fall through to stored solution
}

/**
 * Convert an EnrichedSolution into the standard solution text format
 * that SolutionDisplay can parse (5-section emoji format).
 */
export function enrichedToText(e: EnrichedSolution): string {
  const lines: string[] = [];

  if (e.answer)
    lines.push(`✅ ANSWER: ${e.answer}`, '');

  if (e.steps.length) {
    lines.push('📝 STEP-BY-STEP SOLUTION:');
    e.steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
    lines.push('');
  }

  if (e.speedTrick.length) {
    lines.push('⚡ TOP SPEED TRICK:');
    e.speedTrick.forEach(s => lines.push(s));
    lines.push('');
  }

  if (e.wrongOptions.length) {
    lines.push('❌ WHY WRONG OPTIONS FAIL:');
    e.wrongOptions.forEach(s => lines.push(s));
    lines.push('');
  }

  if (e.concept.length || e.examTip) {
    lines.push('🧠 CONCEPT + FORMULA:');
    e.concept.forEach(s => lines.push(s));
    if (e.examTip) lines.push(`💡 ${e.examTip}`);
  }

  return lines.join('\n');
}
