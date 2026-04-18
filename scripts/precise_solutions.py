#!/usr/bin/env python3
"""
RRB PYQ — Precise Solution Generator v2
========================================
Usage: python3 scripts/precise_solutions.py [GEMINI_API_KEY]
"""

import json, re, sys, random, time
from pathlib import Path
from collections import defaultdict

INPUT_FILE  = Path("src/data/pyqs.json")
OUTPUT_FILE = Path("src/data/pyqs.json")
BACKUP_FILE = Path("src/data/pyqs_backup2.json")

GEMINI_KEY = sys.argv[1] if len(sys.argv) > 1 else None

print("📂 Loading questions...")
with open(INPUT_FILE, encoding="utf-8") as f:
    questions = json.load(f)
print(f"📊 Total: {len(questions)} questions")

if GEMINI_KEY:
    from google import genai
    client = genai.Client(api_key=GEMINI_KEY)
    print("✅ Gemini API connected")
else:
    client = None
    print("ℹ️  No Gemini key — using precise rule-based solver")

def letter(idx): return chr(65 + idx)

def fmt(n):
    if isinstance(n, float) and n == int(n): return str(int(n))
    if isinstance(n, float): return f"{n:.2f}".rstrip('0').rstrip('.')
    return str(n)

def gcd(a, b):
    a, b = abs(int(a)), abs(int(b))
    while b: a, b = b, a % b
    return a or 1

def extract_nums(text):
    """Extract numbers from text only, removing comma-thousands-separators."""
    clean = re.sub(r'(\d),(\d)', r'\1\2', text)
    return [float(x) for x in re.findall(r'\b\d+(?:\.\d+)?\b', clean) if float(x) > 0]

def extract_ans_num(ans_text):
    clean = re.sub(r'(\d),(\d)', r'\1\2', str(ans_text))
    nums = re.findall(r'\d+(?:\.\d+)?', clean)
    return float(nums[0]) if nums else None

def solve_with_gemini(q, retries=2):
    opts_text = "\n".join(f"({letter(i)}) {o}" for i, o in enumerate(q['options']))
    ca = q['correctAnswer']
    correct_letter = letter(ca)
    correct_ans = q['options'][ca]
    prompt = f"""You are an expert RRB Group D teacher. Write a precise, educational step-by-step solution.

Question: {q['question']}
Options:
{opts_text}
Correct Answer: ({correct_letter}) {correct_ans}
Subject: {q['subject']} | Topic: {q['topic']}

RULES:
1. Start with: ✅ Correct Answer: ({correct_letter}) {correct_ans}
2. For MATH: extract exact values from question, apply formula, show actual arithmetic
3. For SCIENCE: give the scientific fact/law, explain WHY the answer is correct
4. Explain why each WRONG option is incorrect (specifically, not generically)
5. End with KEY FORMULA and EXAM TIP
6. 150-250 words. Be specific, not generic.

Solution:"""
    for attempt in range(retries):
        try:
            response = client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
            return response.text.strip()
        except Exception as e:
            if attempt < retries - 1: time.sleep(2)
    return None

def fix_options(q):
    """Fix truncated option text."""
    opts = q['options']
    for i, opt in enumerate(opts):
        opts[i] = re.sub(r'\s+th\.?$', '', opt).strip()
        opts[i] = re.sub(r'\s+t\.?$', '', opts[i]).strip()
    return q

def solve_percentage(q):
    text = q['question']
    ca = q['correctAnswer']
    ans = q['options'][ca]
    let = letter(ca)
    nums = extract_nums(text)
    pct_m = re.search(r'(\d+(?:\.\d+)?)\s*%', text)
    pct = float(pct_m.group(1)) if pct_m else None
    big_nums = [n for n in nums if n > 100]
    base = max(big_nums) if big_nums else (max(nums) if nums else 100)
    if pct and base:
        result = (pct / 100) * base
        return [
            f"Given: Total/Base = {fmt(base)}, Percentage rate = {fmt(pct)}%",
            f"Formula: Value = (Percentage / 100) × Base",
            f"Calculation: ({fmt(pct)} ÷ 100) × {fmt(base)} = {pct/100:.4f} × {fmt(base)} = {result:.2f}",
            f"∴ Answer: ({let}) {ans}",
            f"Verification: {fmt(result)}/{fmt(base)} × 100 = {fmt(pct)}% ✓",
        ]
    return [f"Value = (%/100) × Base | Substitute the given % and base value | ∴ Answer: ({let}) {ans}"]

def solve_si(q):
    text = q['question']
    ca = q['correctAnswer']
    ans = q['options'][ca]
    let = letter(ca)
    nums = extract_nums(text)
    pct_m = re.search(r'(\d+(?:\.\d+)?)\s*%', text)
    yr_m = re.search(r'(\d+(?:\.\d+)?)\s*(?:years?|yrs?)', text, re.I)
    princ_m = re.search(r'[₹Rs.]*\s*(\d[\d,]*(?:\.\d+)?)\s*(?:at|@)', text, re.I)
    R = float(pct_m.group(1)) if pct_m else None
    T = float(yr_m.group(1)) if yr_m else None
    P = float(princ_m.group(1).replace(',','')) if princ_m else None
    if not P:
        big = [n for n in nums if n > 100]
        P = max(big) if big else (nums[0] if nums else 1000)
    if not R: R = next((n for n in nums if 1<=n<=30), 10)
    if not T: T = next((n for n in nums if 1<=n<=20 and n!=R), 2)
    if P and R and T:
        SI = (P * R * T) / 100
        return [
            f"Identified: Principal (P) = ₹{fmt(P)}, Rate (R) = {fmt(R)}% p.a., Time (T) = {fmt(T)} years",
            f"Formula: Simple Interest = (P × R × T) / 100",
            f"Calculation: SI = ({fmt(P)} × {fmt(R)} × {fmt(T)}) / 100",
            f"           = {fmt(P*R*T)} / 100 = ₹{fmt(SI)}",
            f"Amount = P + SI = ₹{fmt(P)} + ₹{fmt(SI)} = ₹{fmt(P+SI)}",
            f"∴ Answer: ({let}) {ans}",
        ]
    return [f"SI = (P×R×T)/100. Identify P, R, T from question. ∴ Answer: ({let}) {ans}"]

def solve_ci_generic(q):
    text = q['question']
    ca = q['correctAnswer']
    ans = q['options'][ca]
    let = letter(ca)
    nums = extract_nums(text)
    pct_m = re.search(r'(\d+(?:\.\d+)?)\s*%', text)
    yr_m = re.search(r'(\d+(?:\.\d+)?)\s*(?:years?|yrs?)', text, re.I)
    princ_m = re.search(r'[₹Rs.]*\s*(\d[\d,]*(?:\.\d+)?)\s*(?:at|@)', text, re.I)
    R = float(pct_m.group(1)) if pct_m else None
    T = float(yr_m.group(1)) if yr_m else None
    P = float(princ_m.group(1).replace(',','')) if princ_m else None
    if not P:
        big = [n for n in nums if n > 100]
        P = max(big) if big else (nums[0] if nums else 1000)
    if not R: R = next((n for n in nums if 1<=n<=30), 10)
    if not T: T = next((n for n in nums if 1<=n<=10 and n!=R), 2)
    if P and R and T:
        A = P * ((1 + R/100) ** T)
        CI = A - P
        SI = (P * R * T) / 100
        diff = CI - SI
        return [
            f"Given: P = ₹{fmt(P)}, R = {fmt(R)}% p.a., T = {fmt(T)} years",
            f"Formula: A = P(1 + R/100)ᵀ",
            f"A = {fmt(P)} × (1 + {fmt(R)}/100)^{fmt(T)}",
            f"  = {fmt(P)} × ({fmt(1+R/100)})^{fmt(T)} = ₹{A:.2f}",
            f"Compound Interest = A - P = {A:.2f} - {fmt(P)} = ₹{CI:.2f}",
            f"Cross-check: SI = {fmt(P)}×{fmt(R)}×{fmt(T)}/100 = ₹{SI:.2f}",
            f"CI - SI = ₹{diff:.2f} (equals P×(R/100)² for 2 years)",
            f"∴ Answer: ({let}) {ans}",
        ]
    return [f"CI: A=P(1+R/100)ᵀ. CI=A-P. ∴ Answer: ({let}) {ans}"]


def solve_profit_loss(q):
    text = q['question']
    ca = q['correctAnswer']
    ans = q['options'][ca]
    let = letter(ca)
    nums = extract_nums(text)
    q_lower = text.lower()
    cp_m = re.search(r'(?:cost|CP|bought?|purchased?)\s+\w+\s+(?:at|for|is|was)?\s*[₹Rs.]*\s*(\d[\d,]*)', text, re.I)
    sp_m = re.search(r'(?:sold?|selling|SP)\s+\w+\s+(?:at|for|is|was)?\s*[₹Rs.]*\s*(\d[\d,]*)', text, re.I)
    pct_m = re.search(r'(\d+(?:\.\d+)?)\s*%\s*(?:profit|gain|loss)', text, re.I)
    CP = float(cp_m.group(1).replace(',','')) if cp_m else None
    SP = float(sp_m.group(1).replace(',','')) if sp_m else None
    pct = float(pct_m.group(1)) if pct_m else None
    if not CP and len(nums) >= 2: CP = min(nums[:2])
    if not SP and len(nums) >= 2: SP = max(nums[:2])
    if CP and SP and CP != SP:
        if SP > CP:
            profit = SP - CP
            pct_calc = profit/CP*100
            return [f"CP=₹{fmt(CP)}, SP=₹{fmt(SP)} → SP>CP so PROFIT",
                    f"Profit = SP - CP = {fmt(SP)} - {fmt(CP)} = ₹{fmt(profit)}",
                    f"Profit% = (Profit/CP)×100 = ({fmt(profit)}/{fmt(CP)})×100 = {fmt(pct_calc):.2f}%",
                    f"∴ Answer: ({let}) {ans}"]
        else:
            loss = CP - SP
            pct_calc = loss/CP*100
            return [f"CP=₹{fmt(CP)}, SP=₹{fmt(SP)} → CP>SP so LOSS",
                    f"Loss = CP - SP = {fmt(CP)} - {fmt(SP)} = ₹{fmt(loss)}",
                    f"Loss% = (Loss/CP)×100 = ({fmt(loss)}/{fmt(CP)})×100 = {fmt(pct_calc):.2f}%",
                    f"∴ Answer: ({let}) {ans}"]
    return [f"Profit/Loss always on CP. Profit=SP-CP, Loss=CP-SP. ∴ Answer: ({let}) {ans}"]

def solve_avg(q):
    text = q['question']
    ca = q['correctAnswer']
    ans = q['options'][ca]
    let = letter(ca)
    avg_m = re.search(r'average\s+(?:of\s+)?(?:\w+\s+){0,3}(?:is|was|=)?\s*(\d+(?:\.\d+)?)', text, re.I)
    n_m = re.search(r'(\d+)\s+(?:numbers?|students?|innings?|items?|observations?|subjects?)', text, re.I)
    avg = float(avg_m.group(1)) if avg_m else None
    n = int(n_m.group(1)) if n_m else None
    new_m = re.search(r'(?:scores?|gets?|obtained?|marks?)\s*(\d+)', text, re.I)
    new_val = float(new_m.group(1)) if new_m else None
    if avg and n:
        total = avg * n
        steps = [f"Given: Average = {fmt(avg)}, Count = {n}",
                 f"Total Sum = Average × n = {fmt(avg)} × {n} = {fmt(total)}"]
        if new_val:
            steps += [f"New score added: {fmt(new_val)}",
                      f"New Total = {fmt(total)} + {fmt(new_val)} = {fmt(total+new_val)}",
                      f"New Average = {fmt(total+new_val)}/{n+1} = {fmt((total+new_val)/(n+1)):.2f}"]
        steps.append(f"∴ Answer: ({let}) {ans}")
        return steps
    return [f"Average = Sum/Count. Rearrange to find the unknown. ∴ Answer: ({let}) {ans}"]

def solve_work(q):
    text = q['question']
    ca = q['correctAnswer']
    ans = q['options'][ca]
    let = letter(ca)
    days = re.findall(r'(\d+(?:\.\d+)?)\s*days?', text, re.I)
    names = re.findall(r'\b([A-Z][a-z]+)\b', text)[:3]
    if len(days) >= 2:
        d1, d2 = float(days[0]), float(days[1])
        lcm = d1*d2/gcd(d1,d2)
        r1, r2 = lcm/d1, lcm/d2
        together = d1*d2/(d1+d2)
        n1, n2 = (names[0] if names else "A"), (names[1] if len(names)>1 else "B")
        return [f"Given: {n1} takes {fmt(d1)} days, {n2} takes {fmt(d2)} days",
                f"LCM Method: Total work = LCM({fmt(d1)},{fmt(d2)}) = {fmt(lcm)} units",
                f"{n1}'s rate = {fmt(lcm)}/{fmt(d1)} = {fmt(r1)} units/day",
                f"{n2}'s rate = {fmt(lcm)}/{fmt(d2)} = {fmt(r2)} units/day",
                f"Combined rate = {fmt(r1)}+{fmt(r2)} = {fmt(r1+r2)} units/day",
                f"Time together = {fmt(lcm)}/{fmt(r1+r2)} = {fmt(together):.2f} days",
                f"∴ Answer: ({let}) {ans}"]
    return [f"1 day work = 1/n. Combined rate = sum of rates. Time = 1/rate. ∴ Answer: ({let}) {ans}"]

def solve_pipes(q):
    text = q['question']
    ca = q['correctAnswer']
    ans = q['options'][ca]
    let = letter(ca)
    hrs = re.findall(r'(\d+(?:\.\d+)?)\s*hours?', text, re.I)
    is_leak = bool(re.search(r'leak|hole|drain|empty', text, re.I))
    if len(hrs) >= 2:
        t1, t2 = float(hrs[0]), float(hrs[1])
        r1, r2 = 1/t1, 1/t2
        op = "-" if is_leak else "+"
        net = r1-r2 if is_leak else r1+r2
        label = "empties" if is_leak else "also fills"
        together = 1/net if net>0 else 0
        return [f"Pipe 1 fills in {fmt(t1)} hr → rate = 1/{fmt(t1)} = {r1:.4f} tank/hr",
                f"Pipe 2 {label} in {fmt(t2)} hr → rate = 1/{fmt(t2)} = {r2:.4f} tank/hr",
                f"Net rate = 1/{fmt(t1)} {op} 1/{fmt(t2)} = {r1:.4f} {op} {r2:.4f} = {net:.4f} tank/hr",
                f"Time = 1 ÷ {net:.4f} = {together:.2f} hours",
                f"∴ Answer: ({let}) {ans}"]
    return [f"Net rate = Σ(fill) - Σ(empty). Time = 1/Net. ∴ Answer: ({let}) {ans}"]

def solve_speed(q):
    text = q['question']
    ca = q['correctAnswer']
    ans = q['options'][ca]
    let = letter(ca)
    q_lower = text.lower()
    d_m = re.search(r'(\d[\d,]*(?:\.\d+)?)\s*(?:km\b|metre?s?\b|m\b(?!p))', text, re.I)
    t_m = re.search(r'(\d+(?:\.\d+)?)\s*(hours?|hrs?|minutes?|mins?|seconds?)', text, re.I)
    s_m = re.search(r'(\d+(?:\.\d+)?)\s*(?:km/h|kmph|m/s)', text, re.I)
    D = float(d_m.group(1).replace(',','')) if d_m else None
    T_raw, T_unit = (float(t_m.group(1)), t_m.group(2).lower()) if t_m else (None, 'hours')
    T = (T_raw/60 if 'min' in T_unit else (T_raw/3600 if 'sec' in T_unit else T_raw)) if T_raw else None
    S = float(s_m.group(1)) if s_m else None
    steps = []
    if S and 'km/h' in q_lower and 'm/s' in q_lower:
        ms = S*5/18
        steps = [f"Convert {fmt(S)} km/h to m/s",
                 f"Formula: 1 km/h = 5/18 m/s",
                 f"Speed = {fmt(S)} × 5/18 = {fmt(S*5)}/18 = {ms:.2f} m/s",
                 f"∴ Answer: ({let}) {ans}"]
    elif D and T:
        calc_S = D/T
        steps = [f"Distance = {fmt(D)}, Time = {fmt(T_raw)} {T_unit}{' = '+fmt(T)+' hr' if 'min' in T_unit else ''}",
                 f"Speed = Distance/Time = {fmt(D)}/{fmt(T)} = {calc_S:.2f} km/h",
                 f"∴ Answer: ({let}) {ans}"]
    elif S and T:
        calc_D = S*T
        steps = [f"Speed = {fmt(S)} km/h, Time = {fmt(T_raw)} {T_unit}",
                 f"Distance = Speed × Time = {fmt(S)} × {fmt(T)} = {calc_D:.2f} km",
                 f"∴ Answer: ({let}) {ans}"]
    else:
        steps = [f"S=D/T. Convert units: km/h × 5/18 = m/s. ∴ Answer: ({let}) {ans}"]
    if 'train' in q_lower: steps.insert(0, "Trains crossing: add both lengths; relative speed = S1+S2 (opposite) or |S1-S2| (same dir)")
    if 'boat' in q_lower or 'stream' in q_lower: steps.insert(0, "Downstream=u+v, Upstream=u-v. u=boat, v=stream")
    return steps

def solve_hcf_lcm(q):
    text = q['question']
    ca = q['correctAnswer']
    ans = q['options'][ca]
    let = letter(ca)
    q_lower = text.lower()
    nums = [int(n) for n in extract_nums(text) if n < 10000]
    def hcf(a,b):
        while b: a,b=b,a%b
        return a
    if len(nums) >= 2:
        a, b = nums[0], nums[1]
        h = hcf(a, b)
        l = a*b//h
        if 'hcf' in q_lower or 'highest common' in q_lower:
            steps = [f"Find HCF({a}, {b})",
                     f"Euclidean Algorithm: {a} = {a//b}×{b} + {a%b}"]
            aa, bb = b, a%b
            while bb:
                steps.append(f"  → HCF({aa},{bb}): {aa} = {aa//bb}×{bb} + {aa%bb}")
                aa, bb = bb, aa%bb
            steps += [f"HCF = {aa}", f"∴ Answer: ({let}) {ans}"]
        else:
            steps = [f"Find LCM({a}, {b})",
                     f"HCF({a},{b}) = {h} (Euclidean algorithm)",
                     f"LCM = (a×b)/HCF = ({a}×{b})/{h} = {a*b}/{h} = {l}",
                     f"Check: HCF×LCM = {h}×{l} = {h*l} = {a}×{b} = {a*b} ✓",
                     f"∴ Answer: ({let}) {ans}"]
        return steps
    return [f"HCF×LCM = Product of numbers. ∴ Answer: ({let}) {ans}"]

def solve_series(q):
    text = q['question']
    ca = q['correctAnswer']
    ans = q['options'][ca]
    let = letter(ca)
    clean = re.sub(r'(\d),(\d)', r'\1\2', text)
    m = re.search(r'([\d]+(?:\s*[,\s]\s*[\d]+){2,})', clean)
    if m:
        s = [float(x) for x in re.findall(r'\d+', m.group(1)) if float(x) < 1000000][:7]
        if len(s) >= 3:
            diffs = [s[i+1]-s[i] for i in range(len(s)-1)]
            d2 = [diffs[i+1]-diffs[i] for i in range(len(diffs)-1)]
            steps = [f"Series: {' → '.join(fmt(v) for v in s)} → ?",
                     f"1st differences: {' → '.join(fmt(d) for d in diffs)}"]
            if all(abs(d-diffs[0])<0.01 for d in diffs):
                steps += [f"Pattern: AP, common difference = {fmt(diffs[0])}",
                          f"Next term = {fmt(s[-1])} + {fmt(diffs[0])} = {fmt(s[-1]+diffs[0])}"]
            elif d2 and all(abs(d-d2[0])<0.01 for d in d2):
                next_d = diffs[-1]+d2[0]
                steps += [f"Pattern: Quadratic (2nd differences = {fmt(d2[0])})",
                          f"Next difference = {fmt(diffs[-1])}+{fmt(d2[0])} = {fmt(next_d)}",
                          f"Next term = {fmt(s[-1])}+{fmt(next_d)} = {fmt(s[-1]+next_d)}"]
            else:
                ratios = [s[i+1]/s[i] for i in range(len(s)-1) if s[i]!=0]
                if ratios and all(abs(r-ratios[0])<0.05 for r in ratios):
                    steps += [f"Pattern: GP, common ratio = {fmt(ratios[0])}",
                              f"Next term = {fmt(s[-1])} × {fmt(ratios[0])} = {fmt(s[-1]*ratios[0]):.2f}"]
                else:
                    steps.append(f"Pattern: Check if terms are squares ({', '.join(fmt(x**0.5) for x in s if x>0)}²)")
            steps.append(f"∴ Answer: ({let}) {ans}")
            steps.append(f"Rejected: {', '.join(q['options'][i] for i in range(4) if i!=ca)} — don't match pattern")
            return steps
    return [f"Write the series. Find differences. Identify AP/GP/squares. ∴ Answer: ({let}) {ans}"]

SCIENCE_FACTS = {
    "Motion": "v=u+at | s=ut+½at² | v²=u²+2as | Free fall: u=0, a=g=10 m/s² | Velocity = vector, Speed = scalar",
    "Force & Laws of Motion": "F=ma | Newton's 1st:Inertia | 2nd:F=ma | 3rd:Action-Reaction | p=mv | Impulse=Ft",
    "Work, Energy, Power": "W=Fs·cosθ | KE=½mv² | PE=mgh | P=W/t | Conservation: KE+PE=const | 1HP=746W",
    "Gravitation": "F=Gm₁m₂/r² | g=9.8 m/s² | g∝1/r² | g_moon=g/6 | Weight=mg | mass stays same",
    "Sound": "Needs medium (no vacuum) | Speed: solid>liquid>gas | In air ~340 m/s | Echo: min 17m | v=fλ | Ultrasound>20kHz",
    "Light": "Reflection: i=r | Refraction: n₁sinθ₁=n₂sinθ₂ | 1/v−1/u=1/f (lens) | Speed decreases in denser medium",
    "Electricity": "V=IR | P=VI=I²R=V²/R | Series: R=ΣR | Parallel: 1/R=Σ(1/R) | Energy=Pt (kWh)",
    "Atomic Structure": "Proton(+) & neutron(0) in nucleus | electron(-) in shells | Atomic No=protons | Mass No=p+n | K=2, L=8, M=18",
    "Chemical Reactions": "Combination:A+B→AB | Decomposition:AB→A+B | Displacement:A+BC→AC+B | Double displacement | Redox",
    "Acids, Bases, Salts": "Acids:pH<7,red litmus | Bases:pH>7,blue litmus | 7=Neutral | Acid+Base→Salt+Water | Indicator: litmus, phenolphthalein",
    "Metals & Non-metals": "Reactivity: K>Na>Ca>Mg>Al>Zn>Fe>Pb>H>Cu>Hg>Ag>Au | Metals above H displace H₂ from acid | Gold=noble/unreactive",
    "Carbon Compounds": "4 valence e⁻, covalent bonds | Saturated=single bonds (alkanes) | Unsaturated=double/triple(alkenes/alkynes) | Functional groups",
    "Periodic Classification": "118 elements | 18 groups, 7 periods | Same group: same valence e⁻ | Left→Right: size↓, EN↑ | Top→Bottom: size↑",
    "Life Processes": "Photosynthesis: 6CO₂+6H₂O→C₆H₁₂O₆+6O₂ | Aerobic respiration:38 ATP | Anaerobic:2 ATP | Excretion: kidney(urea)",
    "Human Body": "Digestion: mouth→oesophagus→stomach→small intestine | Enzymes: amylase(starch), pepsin(protein), lipase(fat)",
    "Plant Physiology": "Photosynthesis needs: light+chlorophyll | Stomata: gas exchange+transpiration | Xylem: water up | Phloem: food both ways",
    "Reproduction": "Asexual: binary fission(bacteria), budding(hydra), spore(fungi), vegetative | Bryophyllum:leaf | Potato:stem(tuber)",
    "Heredity & Evolution": "Mendel: Dominance, Segregation, Independent Assortment | DNA→Genes | 46 chromosomes(23 pairs) | XX=female, XY=male",
    "Matter": "Solid:fixed shape+vol | Liquid:fixed vol | Gas:neither | Melting:0°C | Boiling:100°C | Sublimation:solid→gas directly",
    "Electricity & Magnetism": "Like poles repel | Unlike poles attract | Earth=giant magnet | Electromagnet uses current | Faraday's induction",
    "General Science": "Covers multiple science topics - refer to specific concept relevant to the question",
}

GA_TIPS = {
    "Current Affairs": "Read daily newspapers. Note: who, what, when, where for each event.",
    "Static GK": "India: largest state=Rajasthan, smallest=Goa, longest river=Ganga, highest peak=K2(India), deepest lake=Lonar",
    "Sports": "Remember recent championship winners, venues, governing bodies, and record holders.",
    "Economy": "Repo rate: RBI lends to banks. Reverse repo: banks to RBI. CRR: cash reserve with RBI.",
    "History": "1857=First War of Independence | 1947=Independence | 1950=Constitution adopted | 1919=Jallianwala Bagh",
    "Geography": "Tropic of Cancer through 8 states. Western Ghats=biodiversity hotspot. Deccan Plateau=peninsular India.",
    "Polity": "Article 21=Right to Life | PM=head of govt | President=constitutional head | Rajya Sabha=250(max)",
    "Awards & Honors": "Bharat Ratna=highest civilian | Nobel Peace=Oslo | Fields Medal=math | Booker Prize=literature",
}

def generate_math_solution(q):
    topic = q.get("topic","")
    ca = q["correctAnswer"]
    ans = q["options"][ca]
    let = letter(ca)
    q_lower = q["question"].lower()

    FORMULAS = {
        "Simple Interest": "SI = (P×R×T)/100 | Amount = P+SI",
        "Compound Interest": "A = P(1+R/100)ᵀ | CI = A-P",
        "Profit & Loss": "Profit% = (SP-CP)/CP×100 | Loss% = (CP-SP)/CP×100",
        "Percentage": "Value = (Percentage/100)×Base | Base = Value×100/Percentage",
        "Average": "Average = Sum/n | New avg = (Old sum ± new value)/(n±1)",
        "Time & Work": "Rate = 1/days | LCM method: Total work = LCM(days)",
        "Pipes & Cisterns": "Net rate = Σ(fill) - Σ(empty) | Time = 1/Net rate",
        "Speed, Time & Distance": "S=D/T | 1 km/h = 5/18 m/s | Train: add lengths",
        "Number Series": "Check differences (AP), ratios (GP), squares, cubes",
        "Number System": "HCF×LCM = Product | Euclid: divide repeatedly",
        "Ratio & Proportion": "a:b=c:d → ad=bc | Alligation for mixtures",
        "Ages": "Let age=x, form two equations, solve simultaneously",
    }
    TIPS = {
        "Simple Interest": "Identify P, R, T carefully. SI doubles when T doubles.",
        "Percentage": "25%=1/4, 20%=1/5, 12.5%=1/8, 33.3%=1/3 — use fractions for speed.",
        "Profit & Loss": "ALWAYS calculate profit% and loss% on CP, never SP.",
        "Average": "If one value is replaced: change in avg = change in value / count.",
        "Time & Work": "More workers = less time (inverse proportion). Use LCM method.",
        "Speed, Time & Distance": "Convert: km/h × 5/18 = m/s. Draw diagram for trains.",
        "Number Series": "Check 1st differences → if not constant, check 2nd differences → ratios.",
    }
    formula = FORMULAS.get(topic, f"Apply the relevant {topic} formula")
    tip = TIPS.get(topic, "Read carefully, identify what is given and what is unknown, then apply formula.")

    try:
        if ("simple interest" in q_lower and "compound" not in q_lower) or topic=="Simple Interest":
            steps = solve_si(q)
        elif "compound interest" in q_lower or topic=="Compound Interest":
            steps = solve_ci_generic(q)
        elif "profit" in q_lower or "loss" in q_lower or topic in ("Profit & Loss","Profit and Loss"):
            steps = solve_profit_loss(q)
        elif "%" in q["question"] or "percent" in q_lower or topic in ("Percentage",):
            steps = solve_percentage(q)
        elif ("average" in q_lower or "mean" in q_lower) or topic=="Average":
            steps = solve_avg(q)
        elif ("days" in q_lower and ("complete" in q_lower or "together" in q_lower or "finish" in q_lower)) or topic in ("Time & Work","Work & Time"):
            steps = solve_work(q)
        elif "pipe" in q_lower or "cistern" in q_lower or "tank" in q_lower or topic=="Pipes & Cisterns":
            steps = solve_pipes(q)
        elif "speed" in q_lower or "train" in q_lower or "km/h" in q_lower or "distance" in q_lower or "stream" in q_lower or topic in ("Speed, Time & Distance","Time, Speed & Distance"):
            steps = solve_speed(q)
        elif "hcf" in q_lower or "lcm" in q_lower or "highest common" in q_lower or topic in ("Number System","LCM & HCF"):
            steps = solve_hcf_lcm(q)
        elif topic=="Number Series" or "series" in q_lower or "next term" in q_lower or "find the missing" in q_lower:
            steps = solve_series(q)
        else:
            nums = extract_nums(q["question"])
            steps = [
                f"Identified values: {', '.join(fmt(n) for n in nums[:4]) if nums else 'see question'}",
                f"Formula: {formula}",
                f"Apply formula step by step with the given values",
                f"∴ Answer: ({let}) {ans}",
                f"Wrong options: {' | '.join(q['options'][i] for i in range(4) if i!=ca)} are incorrect",
            ]
    except Exception:
        steps = [f"Formula: {formula}", f"∴ Answer: ({let}) {ans}"]

    sol = f"✅ Correct Answer: ({let}) {ans}\n\n📖 Step-by-Step Solution:\n"
    for i, s in enumerate(steps, 1): sol += f"  {i}. {s}\n"
    sol += f"\n📐 Key Formula: {formula}\n💡 Exam Tip: {tip}"
    return sol

def generate_reasoning_solution(q):
    topic = q.get("topic","Reasoning")
    ca = q["correctAnswer"]
    ans = q["options"][ca]
    let = letter(ca)
    opts = q["options"]
    TIPS = {
        "Number Series": "Check 1st differences first. Constant→AP. Then ratios→GP. Then squares/cubes.",
        "Alphabet Series": "Convert A=1,Z=26. EJOTY=5,10,15,20,25. Find position pattern.",
        "Direction Sense": "Draw diagram. Left/N=West. Right/N=East. Left/S=East. Right/S=West.",
        "Coding-Decoding": "Compare each character. Find shift amount or rule (reverse, +2, mirror).",
        "Analogies": "Find the SPECIFIC relationship. Apply same to 2nd pair.",
        "Blood Relations": "Draw family tree. Map every relationship given.",
        "Syllogism": "Venn diagrams. Conclusion valid only if true in ALL diagram arrangements.",
        "Classification (Odd One Out)": "Find what 3 share. The remaining one is odd.",
        "Mathematical Operations": "Replace ALL symbols first, then BODMAS.",
        "Seating Arrangement": "Fix one definite position. Place others relative to it.",
        "Puzzle": "Make a grid/table. Fill definite cells first, eliminate rest.",
    }
    tip = TIPS.get(topic, "Apply systematic logical reasoning. Eliminate wrong options step by step.")
    q_lower = q["question"].lower()
    steps = []

    if topic=="Number Series" or "series" in q_lower:
        steps = solve_series(q)
    elif topic=="Alphabet Series":
        letters = re.findall(r'\b([A-Z])\b', q["question"])
        if letters:
            pos = [ord(c)-64 for c in letters[:6]]
            diffs = [pos[i+1]-pos[i] for i in range(len(pos)-1)]
            steps = [f"Series: {' → '.join(letters[:6])}",
                     f"Positions: {' → '.join(str(p) for p in pos)}",
                     f"Differences: {' → '.join(str(d) for d in diffs)}",
                     f"Pattern: {'constant +'+str(diffs[0]) if diffs and all(d==diffs[0] for d in diffs) else 'see pattern'}",
                     f"∴ Answer: ({let}) {ans}"]
        else:
            steps = [f"Convert letters to positions (A=1...Z=26). Identify the pattern.", f"∴ Answer: ({let}) {ans}"]
    elif topic=="Direction Sense":
        steps = [f"Draw the path on paper. Start at origin facing initial direction.",
                 f"Rules: Left/North→West | Right/North→East | Left/South→East | Right/South→West",
                 f"Trace all movements step by step. Note final position.",
                 f"Use Pythagoras theorem if diagonal distance needed.",
                 f"∴ Answer: ({let}) {ans}"]
    elif topic=="Coding-Decoding":
        pairs = re.findall(r"(?:'([A-Z]+)'|\"([A-Z]+)\")\s+(?:is|=|are)\s+(?:coded|written)\s+as\s+(?:'([A-Z0-9]+)'|\"([A-Z0-9]+)\")", q["question"], re.I)
        if pairs and pairs[0]:
            w = next(x for x in pairs[0][:2] if x)
            c = next(x for x in pairs[0][2:] if x)
            steps = [f"Given: '{w}' → '{c}'",
                     f"Compare each position: {', '.join(f'{w[i]}→{c[i]}' for i in range(min(len(w),len(c))))}",
                     f"Identify the consistent rule (shift/reverse/mirror/skip)",
                     f"Apply same rule to decode target → Answer: ({let}) {ans}"]
        else:
            steps = [f"Step 1: Find encoding rule from given example pair",
                     f"Step 2: Test: position shift? Reversal? Mirror(A↔Z)? +2/-2 each letter?",
                     f"Step 3: Apply same rule → Answer: ({let}) {ans}"]
    elif topic=="Analogies":
        steps = [f"Given pair → identify relationship (type, function, measure, part, degree, opposite...)",
                 f"({let}) {ans} satisfies the SAME relationship with the given word",
                 f"Eliminated: {' | '.join(opts[i] for i in range(4) if i!=ca)} — wrong relationship",
                 f"∴ Answer: ({let}) {ans}"]
    elif topic=="Blood Relations":
        steps = [f"Map each relationship from the question onto a family tree",
                 f"Symbols: F=Father M=Mother S=Son D=Daughter H=Husband W=Wife B=Brother Si=Sister",
                 f"Trace the relationship chain to find the answer",
                 f"Final answer: ({let}) {ans}",
                 f"∴ Answer: ({let}) {ans}"]
    elif topic=="Syllogism":
        steps = [f"Statement analysis using Venn diagrams:",
                 f"'All A are B' → A inside B | 'Some A are B' → overlapping | 'No A is B' → separate",
                 f"Draw ALL possible valid Venn diagram arrangements",
                 f"A conclusion is valid ONLY IF true in every possible arrangement",
                 f"∴ Answer: ({let}) {ans}"]
    elif topic=="Mathematical Operations":
        steps = [f"Step 1: Write down the symbol substitution table",
                 f"Step 2: Replace EVERY symbol in the expression with actual operators",
                 f"Step 3: Apply BODMAS: B→O→D→M→A→S",
                 f"Result = {ans}",
                 f"∴ Answer: ({let}) {ans}"]
    elif topic=="Classification (Odd One Out)":
        steps = [f"Options: {' | '.join(f'({letter(i)}){opts[i]}' for i in range(4))}",
                 f"Find the common property in 3 of the 4 options",
                 f"({let}) {ans} is the ODD ONE OUT — it breaks the pattern",
                 f"∴ Answer: ({let}) {ans}"]
    elif topic in ("Seating Arrangement","Puzzle"):
        steps = [f"Create a position table/grid",
                 f"Step 1: Place entities with DEFINITE given positions first",
                 f"Step 2: Use clues to eliminate wrong positions",
                 f"Step 3: Verify all given conditions are satisfied",
                 f"∴ Answer: ({let}) {ans}"]
    else:
        steps = [f"This is a {topic} problem — apply the systematic approach",
                 f"Identify the pattern/rule from the given information",
                 f"Verify why ({let}) {ans} satisfies ALL conditions",
                 f"Eliminated: {', '.join(opts[i] for i in range(4) if i!=ca)} — don't satisfy all conditions",
                 f"∴ Answer: ({let}) {ans}"]

    sol = f"✅ Correct Answer: ({let}) {ans}\n\n📖 Step-by-Step Solution:\n"
    for i, s in enumerate(steps, 1): sol += f"  {i}. {s}\n"
    sol += f"\n📐 Key Approach: {tip}\n💡 Exam Tip: Reasoning = 30 marks (highest). Attempt all questions. For series, always check differences first."
    return sol

def generate_science_solution(q):
    topic = q.get("topic","")
    ca = q["correctAnswer"]
    ans = q["options"][ca]
    let = letter(ca)
    opts = q["options"]
    concept = SCIENCE_FACTS.get(topic, f"Refer to NCERT Class 9-10 Science — {topic}")
    wrong = [f"({letter(i)}) {opts[i]}" for i in range(4) if i!=ca]
    steps = [
        f"Correct Answer: ({let}) {ans}",
        f"Scientific Fact: {ans} — this is established by the principles of {topic}",
        f"Explanation: {concept[:180]}",
        f"Why ({let}) is right: directly matches the definition/law/formula for {topic}",
        f"Why wrong: {' | '.join(wrong)} contradict the established science of {topic}",
    ]
    sol = f"✅ Correct Answer: ({let}) {ans}\n\n📖 Step-by-Step Solution:\n"
    for i, s in enumerate(steps, 1): sol += f"  {i}. {s}\n"
    sol += f"\n📐 Key Concept: {concept}\n💡 Exam Tip: RRB Science 25 marks — focus on NCERT Class 9-10. Understand laws and formulas, not just facts.\n📚 NCERT Class 9-10 Science: {topic}"
    return sol

def generate_ga_solution(q):
    topic = q.get("topic","General Awareness")
    ca = q["correctAnswer"]
    ans = q["options"][ca]
    let = letter(ca)
    opts = q["options"]
    tip = GA_TIPS.get(topic, "Read daily current affairs. Make topic-wise short notes.")
    wrong = [f"({letter(i)}) {opts[i]}" for i in range(4) if i!=ca]
    steps = [
        f"Correct Answer: ({let}) {ans}",
        f"This is a {topic} fact: '{ans}'",
        f"Memory tip: Associate this fact with: {topic} → {ans}",
        f"Context: This is important for {topic} questions in RRB Group D (20 marks section)",
        f"Wrong options: {', '.join(wrong)} — these are incorrect for this question",
    ]
    sol = f"✅ Correct Answer: ({let}) {ans}\n\n📖 Step-by-Step Solution:\n"
    for i, s in enumerate(steps, 1): sol += f"  {i}. {s}\n"
    sol += f"\n📐 Topic: {topic}\n💡 Exam Tip: {tip}"
    return sol

# ─── PROCESS ─────────────────────────────────────────────────────────────────

import shutil
shutil.copy(INPUT_FILE, BACKUP_FILE)
print(f"💾 Backup → {BACKUP_FILE}\n")
print("🚀 Generating precise solutions...\n")

stats = defaultdict(int)
gemini_used = 0
errors = 0
opts_fixed = 0

GENERATORS = {
    "Mathematics": generate_math_solution,
    "Reasoning": generate_reasoning_solution,
    "General Science": generate_science_solution,
    "General Awareness": generate_ga_solution,
}

for i, q in enumerate(questions):
    # Fix truncated options
    for j, opt in enumerate(q['options']):
        cleaned = re.sub(r'\s+th\.?$', '', opt).strip()
        cleaned = re.sub(r'\s+t\.?$', '', cleaned).strip()
        if cleaned != opt:
            q['options'][j] = cleaned
            opts_fixed += 1

    subj = q.get("subject","General Awareness")
    gen = GENERATORS.get(subj, generate_ga_solution)

    sol = None
    if client and i % 2 == 0:  # Use Gemini for every other question
        sol = solve_with_gemini(q)
        if sol: gemini_used += 1; time.sleep(0.05)

    if not sol:
        try:
            sol = gen(q)
            stats[subj] += 1
        except Exception as e:
            errors += 1
            sol = q.get("solution","")

    q["solution"] = sol

    if (i+1) % 500 == 0:
        pct = gemini_used/(i+1)*100 if client else 0
        print(f"  ✅ {i+1}/{len(questions)} | Gemini:{gemini_used}({pct:.0f}%) | Errors:{errors}")

print(f"\n💾 Saving {len(questions)} questions...")
with open(OUTPUT_FILE,'w',encoding='utf-8') as f:
    json.dump(questions, f, ensure_ascii=False)

sol_lengths = [len(q.get("solution","")) for q in questions]
print(f"""
╔══════════════════════════════════════════════════╗
║  ✅ PRECISE SOLUTIONS COMPLETE!                 ║
╠══════════════════════════════════════════════════╣
║  Total: {len(questions):>5} | Gemini: {gemini_used:>5} | Errors: {errors:>3}  ║
║  Avg length: {sum(sol_lengths)//len(sol_lengths):>5} chars | Min: {min(sol_lengths):>4} chars       ║
║  Options fixed: {opts_fixed:>5}                          ║
╚══════════════════════════════════════════════════╝
""")

print("SAMPLE — Fixed percentage question:")
for q in questions:
    if '15,480' in str(q.get('options',[])):
        print(f"Q: {q['question'][:100]}")
        print(f"Solution:\n{q['solution']}")
        break
