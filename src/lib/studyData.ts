// ─── RRB Group D Study Knowledge Base ────────────────────────────────────────
// Used by StudyModulesPro to render concept cards, tricks, formulas, common mistakes

export interface TopicKnowledge {
  subject: string;
  topic: string;
  icon: string;
  color: string;        // tailwind gradient from-X to-Y
  bgLight: string;      // light bg for sidebar active
  svgKey: string;       // which SVG diagram to show
  tagline: string;      // "Appears 135 times" summary phrase
  concept: string;      // What is this topic?
  formula: string[];    // Array of key formulas
  speedTrick: string;   // The #1 trick to solve fast
  stepByStep: string[]; // Numbered steps to solve
  commonMistakes: string[];
  examNote: string;     // RRB-specific tip
  subTypes: string[];   // Sub-types that appear in RRB
  mnemonics?: string;   // Memory trick
}

export const STUDY_KNOWLEDGE: TopicKnowledge[] = [

  // ══════════════════════════════════════════════════════
  //  MATHEMATICS
  // ══════════════════════════════════════════════════════

  {
    subject: 'Mathematics', topic: 'Percentage', icon: '%', svgKey: 'percentage',
    color: 'from-blue-500 to-indigo-600', bgLight: 'bg-blue-50',
    tagline: 'Every shift has 3–4 % questions. Never miss this!',
    concept: 'Percentage means "per hundred". It expresses a number as a fraction of 100. Used in elections, discounts, population growth, and exam scores.',
    formula: [
      'x% of N = (x × N) / 100',
      '% Change = (Change / Original) × 100',
      'Successive % change: a + b + (ab/100)',
      'x% of A = y% of B → A/B = y/x',
    ],
    speedTrick: '1% Method: Find 1%, then multiplying is easy. For 86% of 18000: 1% = 180, × 86 = 15480. Done in 15 seconds!',
    stepByStep: [
      'Identify: What % of What = ?',
      'Find 1% of the base number (÷100)',
      'Multiply by the required percentage',
      'For % change: (Difference ÷ Original) × 100',
    ],
    commonMistakes: [
      'Using SP as base instead of CP for profit%',
      'Forgetting to divide by ORIGINAL not new value for % decrease',
      'Successive %: don\'t just add — use a+b+ab/100',
    ],
    examNote: 'RRB loves: election voting %, population increase/decrease, successive discounts. If two successive changes, ALWAYS use the formula.',
    subTypes: ['Voting/Election %', 'Population Change', 'Successive % Change', '% of A = % of B type'],
    mnemonics: 'PER-CENT = Per Hundred. "1% Method" = find one, scale up!',
  },

  {
    subject: 'Mathematics', topic: 'Ratio & Proportion', icon: '∶', svgKey: 'ratio',
    color: 'from-violet-500 to-purple-600', bgLight: 'bg-violet-50',
    tagline: '93 PYQs — especially division-in-ratio type',
    concept: 'Ratio compares two quantities. Proportion means two ratios are equal. The "units method" turns any ratio problem into a simple multiplication.',
    formula: [
      'a:b → 1 unit = Total ÷ (a+b)',
      'Product of means = Product of extremes (a:b::c:d → ad=bc)',
      'Compound ratio = (a×c) : (b×d)',
      'If A:B = m:n, then A = m/(m+n) × Total',
    ],
    speedTrick: 'Unit Method: If ratio is 3:4:5 and total is 480 → 1 unit = 480/12 = 40. Parts are 120:160:200. No fractions needed!',
    stepByStep: [
      'Find sum of ratio parts (e.g., 3+4+5 = 12)',
      'Calculate 1 unit = Total ÷ sum',
      'Multiply each ratio part by 1 unit',
      'Verify: parts add back to total',
    ],
    commonMistakes: [
      'Not reducing ratio to simplest form first',
      'Forgetting to subtract constant amounts before applying ratio',
      'Confusing compound ratio with added ratio',
    ],
    examNote: 'RRB favourite: A,B,C share ₹X in ratio p:q:r after deducting some fixed amount. Always deduct first, THEN apply ratio.',
    subTypes: ['Division in Ratio', 'Income-Saving Ratio', 'Proportion (4th term)', 'Mixture Ratio'],
  },

  {
    subject: 'Mathematics', topic: 'Speed Distance & Time', icon: '🚂', svgKey: 'sdt',
    color: 'from-cyan-500 to-blue-600', bgLight: 'bg-cyan-50',
    tagline: '80 PYQs — Trains crossing is #1 sub-type',
    concept: 'Speed = Distance ÷ Time. Relative speed is used when two objects move toward or away from each other. Trains problems require adding train lengths to distance.',
    formula: [
      'S = D/T   |   D = S×T   |   T = D/S',
      'km/hr → m/s: multiply by 5/18',
      'm/s → km/hr: multiply by 18/5',
      'Relative speed (opposite): S1+S2',
      'Relative speed (same dir): S1–S2',
      'Time to cross platform: (Train + Platform) ÷ Speed',
      'Average speed (2 speeds): 2ab/(a+b)',
    ],
    speedTrick: 'Same distance? Speed ratio = INVERSE of time ratio. S1:S2 = T2:T1. For trains crossing each other: total distance = sum of lengths, total speed = sum of speeds.',
    stepByStep: [
      'Convert units (km/hr ↔ m/s) first',
      'For trains: distance = length of train + length of platform/other train',
      'Identify direction (same → subtract speeds, opposite → add)',
      'Apply T = D ÷ S',
    ],
    commonMistakes: [
      'Forgetting to ADD train lengths in crossing problems',
      'Wrong relative speed direction (same vs opposite)',
      'Not converting km/hr to m/s when needed',
    ],
    examNote: 'Trains crossing platforms and each other are the most common. The D = S×T triangle is your best friend. Draw it every time!',
    subTypes: ['Train crossing platform', 'Two trains crossing', 'Average speed', 'Boat & stream'],
    mnemonics: 'D = S × T — "Don\'t Skip Time!" Cover the unknown, formula appears!',
  },

  {
    subject: 'Mathematics', topic: 'Time & Work', icon: '⚙️', svgKey: 'timework',
    color: 'from-emerald-500 to-teal-600', bgLight: 'bg-emerald-50',
    tagline: '44 PYQs. LCM method is the ONLY method you need.',
    concept: 'If A finishes work in X days, A\'s 1-day work = 1/X. When multiple people work together, add their per-day efficiencies. LCM method avoids fractions completely.',
    formula: [
      'Total Work = LCM of all given days',
      'Efficiency = Total Work ÷ Days',
      'Combined days = Total Work ÷ Sum of efficiencies',
      '1/T = 1/A + 1/B + 1/C',
    ],
    speedTrick: 'LCM Method: A=3 days, B=3 days, C=12 days → LCM=12. Efficiency: A=4, B=4, C=1. Together/day=9. Days = 12/9 = 4/3 ≈ No wait, = 12÷9? Let me recalculate... 12÷(4+4+1)=12÷9=4/3 days... Actually try LCM(3,3,12)=12, A eff=4, B eff=4, C eff=1. Total=9/day. Days=12/9=4/3.',
    stepByStep: [
      'Find LCM of all days given — this is Total Work',
      'Each person\'s efficiency = Total Work ÷ their days',
      'Sum all efficiencies working together',
      'Days = Total Work ÷ Combined efficiency',
    ],
    commonMistakes: [
      'Using fraction method (1/A + 1/B) — gets messy fast',
      'Forgetting to check if someone leaves midway',
      'Not adjusting for rest days or "leaves after X days" conditions',
    ],
    examNote: 'RRB pattern: 3 people work together, one leaves after some days. Always use LCM. Pipes & Cisterns = same concept, inlet(+) outlet(-).',
    subTypes: ['3 people together', 'One leaves midway', 'Efficiency ratio given', 'Pipes combined'],
    mnemonics: 'LCM = "Lazy Calculation Method" — once you set it up, no fractions!',
  },

  {
    subject: 'Mathematics', topic: 'Average', icon: '⚖️', svgKey: 'average',
    color: 'from-orange-500 to-amber-600', bgLight: 'bg-orange-50',
    tagline: '59 PYQs — Cricket average is the #1 sub-type',
    concept: 'Average = Sum of all values ÷ Number of values. The "Rise Method" finds how the average changes when a new value is added — without summing everything.',
    formula: [
      'Average = Sum / n',
      'Sum = Average × n',
      'New value = New Avg + (n × rise in avg)',
      'Rise in avg = (New value – Old avg) / New count',
    ],
    speedTrick: 'Rise Trick: Avg of 12 innings = 77. 13th inning = 266. Rise = (266–77)/13 = 189/13 = 14.5? Wait — new avg = 77 + (266–77)/13 = 77 + 189/13 ≈ 77+14.5=91.5. No need to total all innings!',
    stepByStep: [
      'Old average × n = Old sum',
      'New value changes the sum',
      'New average = New sum ÷ new count',
      'OR: rise = (new value – old avg) ÷ new count',
    ],
    commonMistakes: [
      'Forgetting to divide by the TOTAL count, not just added items',
      'Using old count instead of new count after addition/removal',
      'Missing "removed person" problems — subtract from sum instead of adding',
    ],
    examNote: 'Cricket: "average of first N innings, scores X in N+1th, new average?" Always use rise method. Classroom average: student replaced with score change.',
    subTypes: ['Cricket/Sports average', 'Student addition/removal', 'Age average', 'Weighted average'],
  },

  {
    subject: 'Mathematics', topic: 'Ages', icon: '👴', svgKey: 'ages',
    color: 'from-pink-500 to-rose-600', bgLight: 'bg-pink-50',
    tagline: '57 PYQs — Always try option B or C first!',
    concept: 'Age problems involve finding current, past, or future ages using two conditions. Back-substitution (trying options) is usually the fastest method for MCQs.',
    formula: [
      'If Sarah is 5 more than twice Emma: S = 2E + 5',
      'Sum condition: S + E = Total',
      'Past age: Current – years ago',
      'Future age: Current + years later',
      'Ratio: A/B = m/n → A=mk, B=nk',
    ],
    speedTrick: 'Back-Substitute: Try option B (middle value) for Emma. If E=8: S=2(8)+5=21. Check: 21+8=29 ✓. Done in 20 seconds without any equation!',
    stepByStep: [
      'Read both conditions carefully',
      'Try option B (middle value) for the unknown',
      'Check BOTH conditions with that value',
      'If fails, try C or A. If 2 conditions pass → answer!',
    ],
    commonMistakes: [
      '"X years ago" means subtract from CURRENT age, not from given age',
      'Setting up equation for wrong person (A in terms of B vs B in terms of A)',
      'Forgetting to check the second condition after finding one variable',
    ],
    examNote: 'RRB always gives two conditions. 95% of the time option B or C is correct. Try B first → saves 30+ seconds vs equation method.',
    subTypes: ['Sum + Difference given', 'Ratio given', 'Past/Future ratio', 'Three people ages'],
  },

  {
    subject: 'Mathematics', topic: 'Profit & Loss', icon: '💰', svgKey: 'profitloss',
    color: 'from-green-500 to-emerald-600', bgLight: 'bg-green-50',
    tagline: 'Every exam has 2–3 P&L questions. Know the multiplier!',
    concept: 'Cost Price (CP) is what you buy for. Selling Price (SP) is what you sell for. Profit if SP>CP, Loss if SP<CP. Marked Price (MP) is the tag price before discount.',
    formula: [
      'Profit% = (SP–CP)/CP × 100',
      'SP = CP × (100+P%)/100',
      'CP = SP × 100/(100+P%)',
      'Discount% = (MP–SP)/MP × 100',
      'Successive discount (d1,d2): d1+d2 – d1×d2/100',
      'SP = MP × (100–d)/100',
    ],
    speedTrick: 'Multiplying Factor: CP=500, 20% profit → SP = 500 × 1.2 = 600. Successive discounts 20% then 10% on 1000 → 1000 × 0.8 × 0.9 = 720. Chain multiply, never subtract twice!',
    stepByStep: [
      'Identify CP, SP, MP, Profit%, Discount%',
      'If buying price given → that is CP',
      'Apply multiplier: profit → ×(100+P)/100, discount → ×(100-D)/100',
      'For successive discounts: multiply factors sequentially',
    ],
    commonMistakes: [
      'Using SP as base for profit% (always use CP as base)',
      'Adding successive discounts instead of using formula',
      'Confusing "marked price" with "cost price"',
    ],
    examNote: 'RRB favourite: Shopkeeper marks up 30%, gives 20% discount, find profit/loss%. Use multiplier chain: CP × 1.3 × 0.8 → compare with CP.',
    subTypes: ['Basic Profit/Loss', 'Marked Price + Discount', 'Successive Discounts', 'Dishonest Weight'],
    mnemonics: 'CP → SP: multiply (1 + P/100). MP → SP: multiply (1 – D/100). Chain them!',
  },

  {
    subject: 'Mathematics', topic: 'Simple Interest', icon: '🏦', svgKey: 'interest',
    color: 'from-teal-500 to-cyan-600', bgLight: 'bg-teal-50',
    tagline: '21 PYQs — Pure formula. Guaranteed mark if practiced.',
    concept: 'Simple Interest is paid only on the principal each year. SI = PRT/100. Always check if time is in days — convert to years by dividing by 365.',
    formula: [
      'SI = P × R × T / 100',
      'Amount A = P + SI',
      'P = SI × 100 / (R × T)',
      'R = SI × 100 / (P × T)',
      'T = SI × 100 / (P × R)',
      'Days to years: 73d=1/5 yr, 146d=2/5 yr, 219d=3/5 yr, 292d=4/5 yr',
    ],
    speedTrick: 'Cover the unknown in SI=PRT/100. Need P? Cover P → SI×100/(R×T). Rearrange mentally, no derivation.',
    stepByStep: [
      'Write down P, R, T values (convert T to years if in days)',
      'Apply SI = PRT/100',
      'For Amount: A = P + SI',
      'If finding Rate or Principal: isolate using cross-multiplication',
    ],
    commonMistakes: [
      'Not converting days to years (forget ÷365)',
      'Using SI instead of Amount for final answer',
      'Confusing Simple Interest with Compound Interest in questions',
    ],
    examNote: 'RRB gives "exact days" sometimes (e.g., 73 days). Know: 73=1/5 yr. Most SI Qs are straightforward formula application — never skip these!',
    subTypes: ['Basic SI', 'Finding Principal/Rate', 'Exact days', 'SI comparison'],
  },

  {
    subject: 'Mathematics', topic: 'Mensuration', icon: '📐', svgKey: 'mensuration',
    color: 'from-indigo-500 to-violet-600', bgLight: 'bg-indigo-50',
    tagline: '70 PYQs — 3D shapes (cylinder, cone, sphere) appear most',
    concept: 'Mensuration is the measurement of areas and volumes of geometric shapes. For RRB, focus on cylinder, cone, sphere, cube, and basic 2D shapes.',
    formula: [
      'Circle: Area = πr², Circumference = 2πr',
      'Triangle: Area = ½ × b × h, or √(s(s-a)(s-b)(s-c))',
      'Cylinder: CSA = 2πrh, TSA = 2πr(r+h), V = πr²h',
      'Cone: CSA = πrl, TSA = πr(r+l), V = ⅓πr²h, l=√(r²+h²)',
      'Sphere: SA = 4πr², V = (4/3)πr³',
      'Cube: SA = 6a², V = a³',
    ],
    speedTrick: 'For 22/7 or π: use 22/7 unless calculator given. Memorize: Cylinder V = πr²h, Cone V = Cylinder V ÷ 3, Hemisphere V = Cylinder V × 2/3.',
    stepByStep: [
      'Identify the shape (2D or 3D)',
      'Note which measurement needed (area/volume/surface area)',
      'Write the formula, substitute values',
      'For combined shapes: calculate parts separately, add/subtract',
    ],
    commonMistakes: [
      'Using diameter instead of radius',
      'Confusing CSA (curved) with TSA (total) surface area',
      'For cone slant height l: must calculate l = √(r²+h²)',
    ],
    examNote: 'Cylinder conversion to cone/sphere is common. "Melted and recast" problems → equate volumes! V_cylinder = V_cone + waste.',
    subTypes: ['Cylinder volume/area', 'Cone problems', 'Sphere problems', 'Recast/Melting', 'Composite shapes'],
  },

  // ══════════════════════════════════════════════════════
  //  REASONING
  // ══════════════════════════════════════════════════════

  {
    subject: 'Reasoning', topic: 'Number Series', icon: '🔢', svgKey: 'numberseries',
    color: 'from-purple-500 to-violet-600', bgLight: 'bg-purple-50',
    tagline: '135 PYQs — #1 topic in Reasoning. Level-1 differences solve 70%!',
    concept: 'A number series follows a hidden pattern. Finding the rule = finding the next number. The difference method works for 90% of RRB questions.',
    formula: [
      'L1 differences: subtract consecutive terms',
      'L2 differences: subtract L1 differences',
      'If L1 differences are AP → L2 gives the pattern',
      'GP check: divide consecutive terms (ratio stays same)',
      'Mixed: alternating series (odd terms, even terms separate)',
    ],
    speedTrick: 'Write L1 differences first (30 sec). If equal → AP. If L1 differences form a pattern → L2. If ratios equal → GP. If nothing works → alternating series (split odd/even positions).',
    stepByStep: [
      'Write the series: 445 440 450 444 454 447 ?',
      'L1 differences: -5, +10, -6, +10, -7, → next: +10 → 457',
      'Check: pattern in L1 is -5,-6,-7 (arithmetic) and +10 (+10)',
      'Answer: 447 + 10 = 457 ✓',
    ],
    commonMistakes: [
      'Stopping at L1 when L2 is needed',
      'Missing alternating series (odd and even positions are separate)',
      'Not checking for prime number additions',
    ],
    examNote: 'RRB 2018–2022: 4–5 series per exam. 70% are L1/L2 difference type. 20% are ×2+1, ×2+3 mixed. 10% are alternating. Try difference first, always.',
    subTypes: ['L1 difference (AP)', 'L2 difference', 'GP (ratio)', 'Prime addition', 'Alternating series'],
    mnemonics: 'DRAT: Differences → Ratio → Alternating → Tricks. Try in this order!',
  },

  {
    subject: 'Reasoning', topic: 'Direction Sense', icon: '🧭', svgKey: 'direction',
    color: 'from-blue-500 to-cyan-600', bgLight: 'bg-blue-50',
    tagline: '3–4 Qs every exam. Draw immediately — never solve in head!',
    concept: 'Direction sense problems trace a path and ask for final direction or distance. Always draw on paper. The coordinate method gives distance without guessing.',
    formula: [
      'N = +Y axis, S = –Y axis, E = +X axis, W = –X axis',
      'After Left turn: rotate 90° anticlockwise',
      'After Right turn: rotate 90° clockwise',
      'Straight-line distance = √(X² + Y²) — Pythagoras',
      'Final direction: compare final position to start',
    ],
    speedTrick: 'Coordinate Method: Start at (0,0). Every movement: +x=East, -x=West, +y=North, -y=South. At end: calculate net X and net Y. Distance = √(X²+Y²). Direction = angle from start.',
    stepByStep: [
      'Put starting point at origin (0,0)',
      'Convert each step: "9km West" → x = 0–9 = –9',
      '"Left turn" changes facing direction by 90° anticlockwise',
      'Sum all X movements, sum all Y movements',
      'Final distance = √(netX² + netY²)',
    ],
    commonMistakes: [
      'Confusing LEFT turn vs RIGHT turn direction of rotation',
      'Not starting a fresh diagram for each sub-question',
      'Forgetting to use Pythagoras for diagonal distance',
    ],
    examNote: 'Draw EVERY step on paper with arrows. 90% of mistakes come from solving mentally. The 30 seconds spent drawing saves 2 minutes of re-solving.',
    subTypes: ['Final direction', 'Distance from start', 'Relative position', 'Town relations'],
    mnemonics: 'NEWS = North-East-West-South. Turn Right = Clockwise. Turn Left = AntiClockwise.',
  },

  {
    subject: 'Reasoning', topic: 'Blood Relations', icon: '👨‍👩‍👧', svgKey: 'bloodrel',
    color: 'from-rose-500 to-pink-600', bgLight: 'bg-rose-50',
    tagline: '64 PYQs — Symbol decode first, then draw family tree',
    concept: 'Blood relation problems define family relationships using symbols (+, –, ×, ÷) and ask you to find a specific relationship. Always decode symbols first, then draw a tree.',
    formula: [
      'Same level → Sibling or Spouse',
      'One level up → Parent',
      'One level down → Child',
      'Symbols: A+B = A is wife of B, A*B = A is daughter of B, etc.',
      'Trace path: A→B→C means find A\'s relation to C',
    ],
    speedTrick: 'Decode ALL symbols into a legend first. Then draw boxes for each person and connect with lines (up=parent, down=child, left-right=siblings/spouse). The question answer is always readable from the tree.',
    stepByStep: [
      'Write symbol legend: e.g., "+" means wife-of',
      'Parse the expression left to right',
      'Draw family tree: boxes connected by lines',
      'Mark gender (M/F) clearly for each person',
      'Read the required relationship from the tree',
    ],
    commonMistakes: [
      'Confusing gender of symbol-defined relationships',
      'Not drawing tree and solving mentally — leads to errors',
      'Missing that A is wife of B ≠ B is wife of A',
    ],
    examNote: 'RRB uses complex 4–5 person chains with symbols like ±, ×, ÷. ALWAYS write the decode table before starting. 2–3 Qs per exam guaranteed.',
    subTypes: ['Symbol-coded (±×÷)', 'Direct statement', '3-person chain', '5-person complex'],
    mnemonics: 'STOP → Symbol Table, Operation parse, Position in tree, Read Answer',
  },

  {
    subject: 'Reasoning', topic: 'Coding-Decoding', icon: '🔐', svgKey: 'coding',
    color: 'from-amber-500 to-orange-600', bgLight: 'bg-amber-50',
    tagline: '2–3 Qs every exam. Common-word method cracks 80% instantly!',
    concept: 'Coding-decoding assigns codes to words. If two sentences share a word, their codes share the corresponding code. This eliminates trial-and-error completely.',
    formula: [
      'Common word method: sentence1 ∩ sentence2 = word → code for that word = common code',
      'Letter shift: if A→D, then shift = +3, apply same to all',
      'Reverse coding: A=26, B=25, Z=1',
      'Position: A=1, B=2...Z=26',
    ],
    speedTrick: 'Common Word: "what are those" = "np tr sq" and "take those gifts" = "my hk tr". Common word "those" → common code "tr". Found in 10 seconds!',
    stepByStep: [
      'Find the word common to two sentences',
      'That word = the code common to both coded sentences',
      'Repeat for other sentences to decode more words',
      'For letter shifting: find gap between original and coded letter',
    ],
    commonMistakes: [
      'Trying to decode without finding common word first',
      'Assuming alphabetical order when it might be reverse',
      'Missing that word order in sentence ≠ code order',
    ],
    examNote: '3 coded sentences given, ask for one word. Always find:  which word appears in 2 sentences, its code appears in both coded sentences. Cross-reference two pairs.',
    subTypes: ['Word-to-code (common word)', 'Letter shift (+n, –n)', 'Reverse alphabet', 'Number coding'],
    mnemonics: 'COMMON = find the COmmon word, Match the cOde, Move ON to next!',
  },

  {
    subject: 'Reasoning', topic: 'Mathematical Operations', icon: '🔄', svgKey: 'mathops',
    color: 'from-emerald-500 to-green-600', bgLight: 'bg-emerald-50',
    tagline: 'Easy 2 marks! Only mistake: wrong BODMAS order after substitution',
    concept: 'Letters P,Q,R,S replace mathematical operators ×,÷,–,+. Substitute the operators, then apply BODMAS strictly to solve the expression.',
    formula: [
      'B → Brackets first',
      'O → Orders (powers/roots)',
      'D → Division',
      'M → Multiplication',
      'A → Addition',
      'S → Subtraction',
      'Same level: solve LEFT to RIGHT',
    ],
    speedTrick: 'Write the substitution table FIRST before touching the expression:  P=×, Q=÷, R=–, S=+. Rewrite the full expression with real operators. Then BODMAS.',
    stepByStep: [
      'Write legend: P=×, Q=÷, R=–, S=+',
      'Replace all letters with operators in expression',
      'Apply BODMAS: Division/Multiplication left-to-right first',
      'Then Addition/Subtraction left-to-right',
    ],
    commonMistakes: [
      'Doing subtraction before division — always D/M before A/S',
      'Not replacing ALL occurrences of the letters',
      'Same-level operations: must go LEFT to RIGHT',
    ],
    examNote: 'Q: "P=×, Q=÷, R=–, S=+. Find: 16 P 2 Q 8 R 3 S 4" → 16×2÷8–3+4 = 32÷8–3+4 = 4–3+4 = 5. Fastest 2 marks in Reasoning!',
    subTypes: ['Simple substitution', 'Balanced equation', 'Find correct statement', 'Interchange operators'],
  },

  // ══════════════════════════════════════════════════════
  //  GENERAL SCIENCE
  // ══════════════════════════════════════════════════════

  {
    subject: 'General Science', topic: 'Motion & Laws of Motion', icon: '🚀', svgKey: 'motion',
    color: 'from-sky-500 to-blue-600', bgLight: 'bg-sky-50',
    tagline: '105 PYQs — #1 Science topic. SUVAT equations are all you need!',
    concept: 'Motion describes how objects move. Newton\'s 3 laws govern why. Equations of motion (SUVAT) link initial velocity, final velocity, acceleration, time, and distance.',
    formula: [
      'v = u + at',
      'v² = u² + 2as',
      's = ut + ½at²',
      's = (u+v)/2 × t',
      'F = ma (Newton\'s 2nd Law)',
      'Impulse = F × t = Change in momentum',
      'p = mv (momentum)',
    ],
    speedTrick: 'For free fall: u=0, a=g=10 m/s². For dropped ball: v²=2gs → v=√(2×10×20)=√400=20 m/s. For Newton 2: if force halved, acceleration halved (mass constant).',
    stepByStep: [
      'Identify known: u (initial), v (final), a (accel), s (distance), t (time)',
      'Pick SUVAT equation with only 1 unknown',
      'Substitute and solve',
      'For force problems: F=ma, isolate unknown',
    ],
    commonMistakes: [
      'Using g=10 vs g=9.8 — use whatever the question states',
      'Applying wrong equation (don\'t use v²=u²+2as when time is given)',
      'Confusing velocity (vector) with speed (scalar)',
    ],
    examNote: 'Most common RRB patterns: dropped object (u=0), F=ma direct, momentum change, graph reading (slope=velocity, area=displacement).',
    subTypes: ['SUVAT equations', 'F=ma', 'Momentum/Impulse', 'Velocity-time graphs', 'Circular motion'],
    mnemonics: 'SUVAT = Speed Up Via A Trick. u=initial, v=final, a=acceleration, t=time, s=distance.',
  },

  {
    subject: 'General Science', topic: 'Light & Optics', icon: '💡', svgKey: 'light',
    color: 'from-yellow-500 to-amber-600', bgLight: 'bg-yellow-50',
    tagline: '90 PYQs — Human eye defects + lens formula most asked',
    concept: 'Light travels in straight lines. Reflection (mirrors) and refraction (lenses) change its direction. Convex lenses converge light (magnifying), concave lenses diverge it.',
    formula: [
      '1/v – 1/u = 1/f (Mirror formula)',
      '1/v + 1/u = 1/f → Wait: sign convention matters',
      'Magnification m = –v/u (mirror) = v/u (lens)',
      'Snell\'s Law: n₁sin(θ₁) = n₂sin(θ₂)',
      'Refractive index n = c/v = sin(i)/sin(r)',
      'Lens formula: 1/f = 1/v – 1/u',
    ],
    speedTrick: 'Concave mirror = converging = real inverted images (except when object inside focal point). Convex mirror = always virtual, erect, diminished. Concave lens = always virtual, erect, diminished. Convex lens = depends on position.',
    stepByStep: [
      'Identify: mirror or lens? Concave or convex?',
      'Apply the relevant formula (mirror or lens)',
      'Use sign convention consistently (real=negative for mirrors)',
      'If m is positive → virtual erect; negative → real inverted',
    ],
    commonMistakes: [
      'Mixing up mirror formula with lens formula',
      'Forgetting sign convention (new Cartesian)',
      'Saying convex mirror forms real image — it never does!',
    ],
    examNote: 'Human Eye: myopia (near-sighted) → concave lens. Hypermetropia (far-sighted) → convex lens. Presbyopia (old age) → bifocal. Asked 3–4 times in every set of exams.',
    subTypes: ['Mirror formula', 'Lens formula', 'Human eye defects', 'Refraction/Snell\'s law', 'Magnification'],
    mnemonics: 'My-opia needs Minus (concave) lens. Hyper needs plus (convex = H+). Just like hyperactive = too much = needs correction!',
  },

  {
    subject: 'General Science', topic: 'Current Electricity', icon: '⚡', svgKey: 'electricity',
    color: 'from-yellow-400 to-orange-500', bgLight: 'bg-yellow-50',
    tagline: '74 PYQs — V=IR, P=VI and series/parallel are the whole topic!',
    concept: 'Electric current flows when potential difference is applied to a conductor. Ohm\'s Law (V=IR) governs all resistor calculations. Resistors can be in series or parallel.',
    formula: [
      'V = IR (Ohm\'s Law)',
      'P = VI = I²R = V²/R',
      'Series: R_total = R₁+R₂+R₃',
      'Parallel: 1/R = 1/R₁+1/R₂+1/R₃',
      'Energy = Power × Time = VIt',
      'Heating effect: H = I²Rt (Joule\'s Law)',
    ],
    speedTrick: 'More resistance in series = less current = less power. Less resistance in parallel = more current = more power. For P=V²/R: lower R → higher power (when V is fixed)!',
    stepByStep: [
      'Identify if resistors are in series or parallel',
      'Calculate equivalent resistance',
      'Use V=IR to find current',
      'Use P=I²R or P=V²/R for power',
    ],
    commonMistakes: [
      'Parallel formula: 1/R not R — don\'t forget to invert at end',
      'Using same current in parallel (current divides, voltage is same)',
      'Using same voltage in series (voltage divides, current is same)',
    ],
    examNote: 'Which combination gives more power? → Parallel (more current). Which gives less? → Series. For heater/bulb: more power = higher wattage = more heat/light.',
    subTypes: ['Ohm\'s Law (V=IR)', 'Series resistance', 'Parallel resistance', 'Power P=VI', 'Heating effect'],
    mnemonics: 'VIR: Voltage = I × R. P = VI (Power = Very Important). Series = Same I. Parallel = Same V.',
  },

  {
    subject: 'General Science', topic: 'Metals & Non-Metals', icon: '🔩', svgKey: 'metals',
    color: 'from-slate-500 to-gray-600', bgLight: 'bg-slate-50',
    tagline: '60 PYQs — Reactivity series is the most tested single concept!',
    concept: 'Metals are generally solid, shiny, good conductors, malleable, and ductile. Non-metals are usually poor conductors, brittle (solid) or gases. Reactivity series ranks metals by activity.',
    formula: [
      'Reactivity: K>Na>Ca>Mg>Al>Zn>Fe>Pb>H>Cu>Ag>Au>Pt',
      'Corrosion of iron: 4Fe + 3O₂ + xH₂O → 2Fe₂O₃·xH₂O (rust)',
      'More reactive displaces less reactive from salt solution',
      'Metals form basic oxides. Non-metals form acidic oxides.',
    ],
    speedTrick: 'K.Na.Ca.Mg.Al.Zn.Fe.Pb.H.Cu.Ag.Au = "King Natasha CaMped ALong Zinc FePb Highway CuAg AUTHority". Most reactive = Potassium; Least reactive = Gold/Platinum.',
    stepByStep: [
      'Identify the two metals in question',
      'Locate both in reactivity series',
      'Higher in series = more reactive = displaces the other from solution',
      'For corrosion: iron+oxygen+water → rust',
    ],
    commonMistakes: [
      'Confusing Hydrogen\'s position (between Lead and Copper)',
      'Assuming all metals are solid — Mercury is liquid!',
      'Forgetting that non-metals can form acidic oxides (SO₂, CO₂)',
    ],
    examNote: 'RRB loves: "Which two metals bracket hydrogen? (Pb and Cu)" "Potassium is stored in kerosene — why? Most reactive, reacts with air/water." Corrosion prevention methods (painting, galvanizing, alloying) also commonly asked.',
    subTypes: ['Reactivity series order', 'Displacement reaction', 'Corrosion (rust)', 'Physical properties', 'Metal oxides'],
    mnemonics: 'Please Stop Calling Me A Zebra For Helping Cute Animals Get Pampered = K,Na,Ca,Mg,Al,Zn,Fe,Pb,H,Cu,Ag,Au,Pt',
  },
];

// Fast lookup by subject+topic
export function getTopicKnowledge(subject: string, topic: string): TopicKnowledge | undefined {
  return STUDY_KNOWLEDGE.find(k => k.subject === subject && k.topic === topic);
}
