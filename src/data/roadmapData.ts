// ─── RRB Group-D PYQ Topic Metadata (derived from 4,295 real questions) ──────

export type HeatLevel = 'heavy' | 'medium' | 'light';

export interface TopicMeta {
  pyqCount: number;
  heat: HeatLevel;
  estimatedHours: number;
  tips: string[];
  subject: string;
}

// Heat thresholds: heavy ≥100 Qs | medium 40–99 | light <40
export const TOPIC_META: Record<string, TopicMeta> = {

  // ════════ REASONING ════════
  'Number Series': {
    pyqCount: 390, heat: 'heavy', estimatedHours: 18, subject: 'Reasoning',
    tips: [
      '🔢 Check constant differences first — most common pattern in RRB (22 of 100 series Qs)',
      '📐 Squares/cubes: memorise 1²–30² and 1³–15³ before the exam',
      '🔵 Prime series 2,3,5,7,11,13... — identify gaps quickly by halving/checking divisibility',
      '✖️ Ratio/×2/×3 series: multiply consecutive terms by a constant — check both ×2 and ÷2',
    ],
  },
  'Alphabet Series': {
    pyqCount: 233, heat: 'heavy', estimatedHours: 15, subject: 'Reasoning',
    tips: [
      '🔑 EJOTY trick: E=5, J=10, O=15, T=20, Y=25 — memorise and use for position jumps',
      '⬆️ Position shift (+2/+3/+4): note the shift value immediately, apply uniformly',
      '🔄 Alternate positions: odd-position letters follow one rule, even another — split and solve',
      '⬅️ Reverse alphabet (A=26, Z=1): practice both directions in 30 s',
    ],
  },
  'Seating Arrangement': {
    pyqCount: 175, heat: 'heavy', estimatedHours: 16, subject: 'Reasoning',
    tips: [
      '✏️ Draw the circle/linear diagram first — never solve this purely in your head',
      '📍 Place the person mentioned most often (most clues) first — constraints cascade',
      '🔄 Circular: "to the left" = counter-clockwise; "faces centre" = default unless stated',
      '✅ Re-read ALL clues after each placement to catch conflicts early',
    ],
  },
  'Analogies': {
    pyqCount: 125, heat: 'heavy', estimatedHours: 10, subject: 'Reasoning',
    tips: [
      '🔗 Identify relationship TYPE first (part:whole, tool:function, state:capital)',
      '🐾 Animal:Sound, Animal:Young, Worker:Tool — highest frequency analogy pairs in RRB',
      '🔢 Number analogies: check +, ×, square, cube before guessing',
      '❌ Eliminate wrong options by checking ALL candidates, not just the "obvious" one',
    ],
  },
  'Mathematical Operations': {
    pyqCount: 100, heat: 'heavy', estimatedHours: 8, subject: 'Reasoning',
    tips: [
      '🔄 Substitute all 4 operators — do not stop at first seeming match',
      '📋 BODMAS applies AFTER symbol replacement: Brackets → Orders → ÷ → × → + → −',
      '⚠️ Read inequality direction carefully: > ≥ < ≤ often swapped in tricky options',
      '✍️ Write replacement table (e.g. "× means +") in rough before solving',
    ],
  },
  'Direction Sense': {
    pyqCount: 97, heat: 'medium', estimatedHours: 8, subject: 'Reasoning',
    tips: [
      '🗺️ Draw the full path — never attempt direction sense mentally',
      '🧭 Left from North = West; Right from North = East (rotate compass clockwise for right)',
      '☀️ Shadow questions: morning sun → East, shadow West; evening sun → West, shadow East',
      '📐 Use Pythagorean theorem only when path makes a right angle',
    ],
  },
  'Coding-Decoding': {
    pyqCount: 90, heat: 'medium', estimatedHours: 9, subject: 'Reasoning',
    tips: [
      '🔤 Compare each letter of input to code letter-by-letter to find the shift (A→D = +3)',
      '🔁 Reverse code: Z→A, Y→B — mirror the alphabet; common in ~30% of coding Qs',
      '🔢 Word coded as positions: CAT → 3,1,20. Add/multiply by a constant',
      '✂️ Word reversal: PENCIL → LICNEP — then apply further shift if needed',
    ],
  },
  'Syllogism': {
    pyqCount: 88, heat: 'medium', estimatedHours: 8, subject: 'Reasoning',
    tips: [
      '⭕ Draw Venn diagrams for every question — intuition-based answers are often wrong',
      '"All A are B" → A inside B; "Some A are B" → A & B overlap; "No A is B" → separate',
      '❓ "Either/Or" conclusion valid only when BOTH individual conclusions are individually false',
      '🔍 Check boundary cases: "Some" can include "All" — do not over-restrict',
    ],
  },
  'Ranking & Arrangement': {
    pyqCount: 42, heat: 'light', estimatedHours: 5, subject: 'Reasoning',
    tips: [
      '📊 Formula: Total = Rank from left + Rank from right − 1',
      '📝 Multiple clue tables: list positions after each clue and cross-verify',
      '🔤 Alphabetical arrangement: compare letter by letter, not string length',
    ],
  },
  'Classification (Odd One Out)': {
    pyqCount: 16, heat: 'light', estimatedHours: 4, subject: 'Reasoning',
    tips: [
      '🔍 Find the common property of 3 items — the 4th that breaks it is the answer',
      '🔢 Number classification: even/odd, prime/composite, perfect squares/cubes',
      '🐾 Category check: "all are mammals except one reptile" type — look at hierarchy',
    ],
  },

  // ════════ MATHEMATICS ════════
  'Profit & Loss': {
    pyqCount: 150, heat: 'heavy', estimatedHours: 16, subject: 'Mathematics',
    tips: [
      "💡 CP = base for profit%/loss%; MP = base for discount% — do not mix up",
      '⚡ Successive discount: single equiv. = a + b − (ab/100)',
      '⚠️ Equal profit%/loss% on two items → always a loss overall: loss% = (x/10)²',
      '⚖️ Dishonest shopkeeper: eff.% = [(true_wt−used_wt)/used_wt]×100 + profit%',
    ],
  },
  'Number System': {
    pyqCount: 120, heat: 'heavy', estimatedHours: 14, subject: 'Mathematics',
    tips: [
      '🔑 HCF × LCM = Product of two numbers — most-tested formula, verify with examples',
      '✅ Divisibility by 9: sum of digits divisible by 9 means the number is too',
      '🔄 Unit digit cycles: 2 (cycle-4), 3 (cycle-4), 4 (cycle-2), 5/6/0/1 (cycle-1)',
      '➗ Remainder theorem: for x^n ÷ d, find the cycle of remainders and reduce n',
    ],
  },
  'Percentage': {
    pyqCount: 119, heat: 'heavy', estimatedHours: 14, subject: 'Mathematics',
    tips: [
      '📈 Successive % change: combined = a + b + ab/100 (never add directly)',
      '💯 Key fraction shortcuts: 12.5%=⅛, 16.67%=⅙, 37.5%=⅜, 62.5%=⅝',
      '↕️ If A is x% more than B → B is x/(100+x)×100% less than A',
      '📊 Population change: New = Old × (1±r/100)^n',
    ],
  },
  'Ratio & Proportion': {
    pyqCount: 100, heat: 'heavy', estimatedHours: 12, subject: 'Mathematics',
    tips: [
      '⚗️ Alligation: cross-multiply cheaper and dearer prices to get ratio of mixture',
      '🔗 Compound ratio: multiply corresponding terms of all ratios',
      '⚖️ Proportion a:b::c:d → a×d = b×c; product of extremes = product of means',
      '📐 If a:b and b:c given, make b equal then combine to get a:b:c',
    ],
  },
  'Average': {
    pyqCount: 69, heat: 'medium', estimatedHours: 8, subject: 'Mathematics',
    tips: [
      '🔄 Item replaced: Δ avg = Δ value ÷ count. No need to recalculate sum',
      '📐 Consecutive numbers: avg = (first + last) ÷ 2',
      '➕ New item added: new avg = (N×old_avg + new_item) ÷ (N+1)',
      '⚖️ Weighted average = Σ(w×x) ÷ Σ(w) — used in mixtures and combined groups',
    ],
  },
  'Time, Speed & Distance': {
    pyqCount: 67, heat: 'medium', estimatedHours: 9, subject: 'Mathematics',
    tips: [
      '⚙️ km/h → m/s: ×5/18; m/s → km/h: ×18/5 — convert FIRST, then substitute',
      '🚂 Trains: total crossing distance = L₁+L₂; time = (L₁+L₂) ÷ relative speed',
      '🚤 Boats: downstream = u+v, upstream = u−v; still water speed = (D+U)÷2',
      '↔️ Relative speed: same direction = |S₁−S₂|; opposite direction = S₁+S₂',
    ],
  },
  'Pipes & Cisterns': {
    pyqCount: 54, heat: 'medium', estimatedHours: 8, subject: 'Mathematics',
    tips: [
      '🚰 If pipe fills in x hrs → rate = 1/x per hr. Net rate = Σinlets − Σoutlets',
      '📊 LCM method: set total work = LCM of all times; find each pipe rate in units',
      '⏱️ Time = 1 ÷ net_rate when all rates combined',
      '🕳️ Leak: treat as a negative rate (outlet). Net = inlet − leak',
    ],
  },
  '3D (Volume, Surface Area)': {
    pyqCount: 40, heat: 'medium', estimatedHours: 7, subject: 'Mathematics',
    tips: [
      '🔢 Use π = 22/7 unless question says decimal; keeps calculation cleaner',
      '🔄 Melting/recasting: volume is conserved. Set V₁ = V₂ and solve',
      '📦 Cylinder: V=πr²h, CSA=2πrh, TSA=2πr(r+h)',
      '🔺 Cone: V=⅓πr²h; slant l=√(r²+h²); CSA=πrl; TSA=πr(r+l)',
    ],
  },
  'Compound Interest': {
    pyqCount: 29, heat: 'light', estimatedHours: 6, subject: 'Mathematics',
    tips: [
      '⚡ CI − SI (2 years) = P×(r/100)² — fastest comparison shortcut',
      '📐 A = P(1+r/100)^n; CI = A − P',
      '📅 Half-yearly: replace r→r/2 and n→2n before applying formula',
    ],
  },
  'Ages': {
    pyqCount: 28, heat: 'light', estimatedHours: 5, subject: 'Mathematics',
    tips: [
      '✏️ Let present age = x; form two equations from clues and solve',
      '⏰ "n years ago" → subtract n; "n years later" → add n',
      '⚖️ Ratio-based: ages = S×a/(a+b) and S×b/(a+b) where S = sum',
    ],
  },
  'Time & Work': {
    pyqCount: 27, heat: 'light', estimatedHours: 5, subject: 'Mathematics',
    tips: [
      "1️⃣ A's 1-day work = 1/(A's days); combined = 1/A + 1/B",
      '♟️ M1×D1 = M2×D2 (men×days constant for same work)',
      '📊 LCM method: total work = LCM; daily work of each person = LCM÷days',
    ],
  },
  'Simple Interest': {
    pyqCount: 14, heat: 'light', estimatedHours: 4, subject: 'Mathematics',
    tips: [
      '📐 SI = PRT/100; always on original principal, not accumulated interest',
      '💰 Amount = P + SI = P(1 + RT/100)',
      '🔄 If SI for n years = x, then for m years = x×m/n',
    ],
  },
  'LCM & HCF': {
    pyqCount: 11, heat: 'light', estimatedHours: 4, subject: 'Mathematics',
    tips: [
      '🔑 HCF = product of common prime factors (lowest power)',
      '📐 LCM = product of ALL prime factors (highest power)',
      '⚖️ HCF × LCM = product of the two numbers (only valid for exactly 2 numbers)',
    ],
  },

  // ════════ GENERAL SCIENCE ════════
  'Atomic Structure': {
    pyqCount: 264, heat: 'heavy', estimatedHours: 18, subject: 'General Science',
    tips: [
      '⚛️ Atomic no. = protons = electrons (neutral); mass no. = p + n',
      '🔄 Electron shells: K(2), L(8), M(18), N(32) — fill by 2n² rule',
      '🧬 Isotopes: same protons, different neutrons; Isobars: same mass number',
      '📊 Periodic table: group 1=alkali metals, 17=halogens, 18=noble gases',
    ],
  },
  'General Science': {
    pyqCount: 149, heat: 'heavy', estimatedHours: 16, subject: 'General Science',
    tips: [
      '📏 SI units: length(m), mass(kg), time(s), temp(K), current(A) — know all 7',
      '💊 Vitamins: A(eyes), B(nerve/beriberi), C(scurvy/immunity), D(bones), K(clotting)',
      '🧪 pH scale: 0-7 acidic, 7 neutral, 7-14 basic; stomach acid pH~1.5–2',
      '⚖️ Pressure = F/A; 1 atm = 760 mmHg = 101325 Pa',
    ],
  },
  'Motion': {
    pyqCount: 106, heat: 'heavy', estimatedHours: 14, subject: 'General Science',
    tips: [
      '🚀 3 equations: v=u+at; s=ut+½at²; v²=u²+2as — identify unknowns first',
      '🌍 Free fall: u=0, a=g=9.8 m/s². Time for height h: t = √(2h/g)',
      '📈 Distance-time graph: slope = speed. Velocity-time: slope = accel, area = distance',
      '⚡ Uniform motion: acceleration = 0; velocity constant',
    ],
  },
  'Acids, Bases, Salts': {
    pyqCount: 102, heat: 'heavy', estimatedHours: 13, subject: 'General Science',
    tips: [
      '⚗️ Neutralisation: Acid + Base → Salt + Water. HCl + NaOH → NaCl + H₂O',
      '🔴 Strong acids: HCl, H₂SO₄, HNO₃. Weak: CH₃COOH (vinegar), H₂CO₃ (soda)',
      '💧 Litmus: red in acid, blue in base. Phenolphthalein: pink/magenta in base',
      '🧂 Common salts: NaCl (table), NaHCO₃ (baking soda), Na₂CO₃ (washing soda)',
    ],
  },
  'Light': {
    pyqCount: 89, heat: 'medium', estimatedHours: 10, subject: 'General Science',
    tips: [
      '🪞 Reflection: angle of incidence = angle of reflection (same side of normal)',
      '🔭 Convex mirror: always virtual, erect, diminished — rear-view mirrors use this',
      '💎 Total internal reflection: denser → rarer medium, angle > critical angle',
      '🌈 Dispersion: VIBGYOR order; violet bends most, red bends least in prism',
    ],
  },
  'Cell': {
    pyqCount: 67, heat: 'medium', estimatedHours: 8, subject: 'General Science',
    tips: [
      '🔬 Robert Hooke discovered cells (1665); cell theory: Schleiden, Schwann, Virchow',
      '🧫 Prokaryotes: no nucleus (bacteria); Eukaryotes: membrane-bound nucleus',
      '⚡ Mitochondria = powerhouse; Chloroplast = photosynthesis; Ribosome = protein',
      '💧 Osmosis: water from dilute (hypotonic) to concentrated (hypertonic) solution',
    ],
  },
  'Work, Energy, Power': {
    pyqCount: 59, heat: 'medium', estimatedHours: 9, subject: 'General Science',
    tips: [
      '⚙️ W = F×d×cosθ. Work = 0 when force ⊥ displacement (θ=90°)',
      '🔋 KE = ½mv²; PE = mgh. KE+PE = constant (in absence of friction)',
      '⚡ Power = Work/Time = F×v. Unit: Watt. 1 hp = 746 W',
      '🏠 1 kWh = 3.6×10⁶ J = 1 unit of electricity on bill',
    ],
  },
  'Electricity': {
    pyqCount: 51, heat: 'medium', estimatedHours: 9, subject: 'General Science',
    tips: [
      "⚡ Ohm's law: V = IR. Higher length → more resistance; higher area → less",
      '🔌 Series: R_total = R₁+R₂ (same current). Parallel: 1/R = 1/R₁+1/R₂ (same voltage)',
      '💡 Power: P=VI=I²R=V²/R. Energy = P×t (joules). kWh = 1000W × 1hr',
      '🔒 Fuse: low melting point wire; breaks circuit on overcurrent. MCB = modern fuse',
    ],
  },
  'Force & Laws': {
    pyqCount: 46, heat: 'medium', estimatedHours: 7, subject: 'General Science',
    tips: [
      "🏋️ Newton's 1st (Inertia): object continues at rest/uniform motion without net force",
      "📐 Newton's 2nd: F = ma. Unit of force = Newton = kg·m/s²",
      "🚀 Newton's 3rd: every action has equal and opposite reaction (rockets, swimming)",
      '🔄 Momentum p = mv. Impulse = F×t = Δp (important for crash/collision Qs)',
    ],
  },
  'Plant Physiology': {
    pyqCount: 38, heat: 'light', estimatedHours: 5, subject: 'General Science',
    tips: [
      '🌿 Photosynthesis: 6CO₂+6H₂O → C₆H₁₂O₆+6O₂ (needs light + chlorophyll)',
      '💧 Transpiration: water loss through stomata; cools and creates upward pull',
      '🔀 Xylem: water/minerals up; Phloem: food (sucrose) up and down',
    ],
  },

  // ════════ GENERAL AWARENESS ════════
  'Current Affairs': {
    pyqCount: 267, heat: 'heavy', estimatedHours: 20, subject: 'General Awareness',
    tips: [
      '📅 Cover last 12 months: appointments, summits, awards, schemes, sports',
      '🏛️ Govt schemes: objective + ministry + launch year — all three needed',
      '🥇 Sports: gold medalists in Olympics/CWG/Asian Games — names + country + event',
      '📊 India rankings: WEF Global Competitiveness, HDI, IMF GDP, Ease of Doing Business',
    ],
  },
  'Static GK': {
    pyqCount: 230, heat: 'heavy', estimatedHours: 18, subject: 'General Awareness',
    tips: [
      '🌏 India geography: rivers (source/mouth), dams, national parks, hotspots',
      '📜 Indian polity: Constitutional articles, key amendments (42nd, 44th, 86th, 101st)',
      '🏛️ Firsts in India: first President, PM, woman IPS, Nobel laureate etc.',
      '💃 State capitals, classical dance forms, major festivals — cover all 28 states + 8 UTs',
    ],
  },
  'Sports': {
    pyqCount: 130, heat: 'heavy', estimatedHours: 12, subject: 'General Awareness',
    tips: [
      '🏅 Paris Olympics 2024: India won 6 medals — know each athlete, sport, event',
      '🏏 Cricket: World Cup winners, ICC rankings, Khel Ratna/Arjuna awardees',
      '🏆 National sports awards: Khel Ratna, Arjuna, Dronacharya, Dhyan Chand — criteria',
      '🌐 Governing bodies: ICC, FIFA, BCCI, BWF, IOA — know full forms and roles',
    ],
  },
  'Economy': {
    pyqCount: 96, heat: 'medium', estimatedHours: 10, subject: 'General Awareness',
    tips: [
      '📊 GDP vs GNP vs NNP vs GNI — know the formula differences',
      '🏦 RBI functions: monetary policy (repo/reverse repo), banking regulation, forex',
      '💰 Budget: fiscal deficit, revenue deficit, FRBM act, disinvestment',
      '📈 Indices: WPI (wholesale), CPI (retail), IIP (industrial production) — base years',
    ],
  },
  'Awards & Honors': {
    pyqCount: 64, heat: 'medium', estimatedHours: 7, subject: 'General Awareness',
    tips: [
      '🏅 Nobel Prize 2023 & 2024: all 6 categories — winners + field of work',
      '🇮🇳 Bharat Ratna: most recent recipients and why they received it',
      '🎬 National Film Awards: Best Film, Best Director, Best Actor/Actress recent years',
      '🥇 Padma Awards: Vibhushan > Bhushan > Shri — know recent civilian awardees',
    ],
  },
  'Polity': {
    pyqCount: 54, heat: 'medium', estimatedHours: 8, subject: 'General Awareness',
    tips: [
      '📜 Fundamental Rights: Articles 12–35. Part III of Constitution',
      '🏛️ Parliament: Lok Sabha max 552, Rajya Sabha 250, quorum = 1/10th',
      '🗳️ President: elected by Electoral College; Rajya Sabha: Upper House, permanent body',
      '📋 Key amendments: 42nd (mini-constitution), 73rd/74th (Panchayati Raj), 101st (GST)',
    ],
  },
  'Geography': {
    pyqCount: 29, heat: 'light', estimatedHours: 5, subject: 'General Awareness',
    tips: [
      '🗺️ India: 28 states + 8 UTs; largest state = Rajasthan; smallest = Goa',
      '🏔️ Himalayan rivers (Indus, Ganga, Brahmaputra) vs Peninsular rivers',
      '🌡️ Climate zones: tropical, subtropical, arid — Rajasthan=arid, NE=heavy rainfall',
    ],
  },
  'Books & Authors': {
    pyqCount: 28, heat: 'light', estimatedHours: 4, subject: 'General Awareness',
    tips: [
      '📚 Recent Booker/Sahitya/Pulitzer Prize books — author + country',
      '🖊️ Indian PM/President autobiographies and their titles',
      '📖 Classical works: connection between famous Indian books and their authors',
    ],
  },
};

// Daily revision plan (last 7 days before exam)
export const REVISION_PLAN = [
  {
    day: 1, label: 'Heavy Reasoning', color: 'bg-red-50 border-red-200 text-red-800',
    topics: ['Number Series', 'Alphabet Series'],
    focus: 'Solve 40 mixed series Qs in 30 min. Review all common patterns.',
    hours: 4, type: 'revise' as const,
  },
  {
    day: 2, label: 'Heavy Science & Math', color: 'bg-red-50 border-red-200 text-red-800',
    topics: ['Atomic Structure', 'Profit & Loss', 'Percentage'],
    focus: 'All formulas + 30 PYQs each. Focus on calculation speed.',
    hours: 4, type: 'revise' as const,
  },
  {
    day: 3, label: 'Heavy GA & Reasoning', color: 'bg-red-50 border-red-200 text-red-800',
    topics: ['Current Affairs', 'Seating Arrangement'],
    focus: 'Revise all current events notes. Solve 5 seating sets.',
    hours: 4, type: 'revise' as const,
  },
  {
    day: 4, label: 'Heavy Science & Math', color: 'bg-red-50 border-red-200 text-red-800',
    topics: ['Motion', 'Static GK', 'Number System'],
    focus: 'All physics equations drill. Map-based GK. HCF/LCM rapid practice.',
    hours: 4, type: 'revise' as const,
  },
  {
    day: 5, label: 'Full Mock Test 1', color: 'bg-blue-50 border-blue-200 text-blue-800',
    topics: ['All Subjects'],
    focus: 'Strictly timed 90-min mock. Review every wrong answer in detail.',
    hours: 5, type: 'practice' as const,
  },
  {
    day: 6, label: 'Mock Test 2 + Weak Areas', color: 'bg-amber-50 border-amber-200 text-amber-800',
    topics: ['All Subjects', 'Weak Topics'],
    focus: 'Second full mock + 45 min focused practice on weakest 2-3 topics.',
    hours: 5, type: 'practice' as const,
  },
  {
    day: 7, label: 'Light Revision + Rest', color: 'bg-green-50 border-green-200 text-green-800',
    topics: ['Quick Formula Flashcards'],
    focus: 'Light 2-hour revision of key formulas only. No new topics. Rest well.',
    hours: 2, type: 'revise' as const,
  },
];

export const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  Reasoning:          { bg: 'bg-purple-50',  text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
  Mathematics:        { bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-500' },
  'General Science':  { bg: 'bg-emerald-50', text: 'text-emerald-700',border: 'border-emerald-200',dot: 'bg-emerald-500' },
  'General Awareness':{ bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-500' },
};

export const HEAT_COLORS = {
  heavy:  { bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-300',    badge: 'bg-red-500',   label: 'Heavy' },
  medium: { bg: 'bg-amber-100',  text: 'text-amber-800',  border: 'border-amber-300',  badge: 'bg-amber-500', label: 'Medium' },
  light:  { bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-300',  badge: 'bg-green-500', label: 'Light' },
};
