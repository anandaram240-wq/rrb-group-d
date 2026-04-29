#!/usr/bin/env python3
"""Enrich Maths PYQs with real-value solutions and tricks."""
import json, re, shutil
from datetime import datetime

SRC = "pyqs.json"
BAK = f"pyqs_backup_maths_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

def nums(text):
    return re.findall(r'\d+\.?\d*', text)

def opt_letter(idx):
    return chr(65 + idx) if isinstance(idx, int) else str(idx)

def correct_val(q):
    opts = q.get('options', [])
    ci = q.get('correctAnswer', 0)
    if isinstance(ci, int) and 0 <= ci < len(opts):
        return opts[ci]
    return str(ci)

# ─── TOPIC SOLVERS ───────────────────────────────────────────────────────────

def solve_percentage(q):
    txt = q['question']
    ans = correct_val(q)
    n = nums(txt)
    sol_steps, trick = [], []

    pct = next((x for x in n if float(x) <= 100), None)
    base = next((x for x in n if float(x) > 100), None)

    if pct and base:
        val = round(float(pct) * float(base) / 100, 2)
        sol_steps = [
            f"Given: Base = {base}, Percentage = {pct}%",
            f"Formula: Value = (Percentage ÷ 100) × Base",
            f"= ({pct} ÷ 100) × {base} = {val}",
            f"∴ Answer: {ans}"
        ]
        trick = [
            f"[{pct}% of {base}]",
            f"{pct}% × {base} = {pct} × {base} ÷ 100 = {val}",
            f"Answer: {ans}"
        ]
    else:
        sol_steps = [f"Extract % and base values from question", f"Value = (%) × base ÷ 100", f"∴ {ans}"]
        trick = [f"[% × base ÷ 100]", f"∴ {ans}"]
    return sol_steps, trick

def solve_profit_loss(q):
    txt = q['question']
    ans = correct_val(q)
    n = nums(txt)
    sol_steps, trick = [], []

    cp = next((x for x in n if float(x) > 100), None)
    pct = next((x for x in n if float(x) <= 100), None)

    if 'profit' in txt.lower() and cp and pct:
        sp = round(float(cp) * (1 + float(pct)/100), 2)
        sol_steps = [
            f"CP = ₹{cp}, Profit% = {pct}%",
            f"SP = CP × (1 + Profit%/100)",
            f"SP = {cp} × (1 + {pct}/100) = {cp} × {1 + float(pct)/100:.4f} = ₹{sp}",
            f"∴ Answer: {ans}"
        ]
        trick = [
            f"[SP = CP × (100 + Profit%) ÷ 100]",
            f"{cp} × {100 + float(pct):.0f} ÷ 100 = ₹{sp}",
            f"Answer: {ans}"
        ]
    elif 'loss' in txt.lower() and cp and pct:
        sp = round(float(cp) * (1 - float(pct)/100), 2)
        sol_steps = [
            f"CP = ₹{cp}, Loss% = {pct}%",
            f"SP = CP × (1 - Loss%/100)",
            f"SP = {cp} × (1 - {pct}/100) = {cp} × {1 - float(pct)/100:.4f} = ₹{sp}",
            f"∴ Answer: {ans}"
        ]
        trick = [
            f"[SP = CP × (100 - Loss%) ÷ 100]",
            f"{cp} × {100 - float(pct):.0f} ÷ 100 = ₹{sp}",
            f"Answer: {ans}"
        ]
    else:
        sol_steps = [f"Profit/Loss always on CP", f"Profit% = (SP-CP)/CP × 100", f"∴ {ans}"]
        trick = [f"[Profit%=(SP-CP)/CP×100]", f"∴ {ans}"]
    return sol_steps, trick

def solve_ratio(q):
    txt = q['question']
    ans = correct_val(q)
    n = nums(txt)
    sol_steps = [f"Given ratios/values: {', '.join(n[:4]) if n else 'from question'}", f"Equate ratios: a:b = c:d → ad = bc", f"∴ Answer: {ans}"]
    trick = [f"[a:b :: c:d → ad=bc]", f"Cross-multiply with values {', '.join(n[:4]) if n else ''}", f"∴ {ans}"]
    return sol_steps, trick

def solve_average(q):
    txt = q['question']
    ans = correct_val(q)
    n = nums(txt)
    sol_steps, trick = [], []
    if n:
        vals_str = ', '.join(n[:5])
        sol_steps = [
            f"Given values: {vals_str}",
            f"Formula: Average = Sum ÷ Count",
            f"Sum = {' + '.join(n[:5]) if len(n) <= 5 else vals_str}",
            f"∴ Answer: {ans}"
        ]
        trick = [f"[Avg = Sum ÷ Count]", f"Values: {vals_str}", f"∴ {ans}"]
    else:
        sol_steps = [f"Average = Sum ÷ Count", f"∴ {ans}"]
        trick = [f"[Avg = Sum ÷ Count]", f"∴ {ans}"]
    return sol_steps, trick

def solve_time_work(q):
    txt = q['question']
    ans = correct_val(q)
    n = nums(txt)
    sol_steps, trick = [], []
    if len(n) >= 2:
        a, b = n[0], n[1]
        try:
            rate_a = round(1/float(a), 4)
            rate_b = round(1/float(b), 4)
            net = round(rate_a + rate_b, 4)
            together = round(1/net, 2) if net else 0
            sol_steps = [
                f"A alone = {a} days → rate = 1/{a} = {rate_a}/day",
                f"B alone = {b} days → rate = 1/{b} = {rate_b}/day",
                f"Combined rate = {rate_a} + {rate_b} = {net}/day",
                f"Together = 1 ÷ {net} = {together} days",
                f"∴ Answer: {ans}"
            ]
            trick = [
                f"[Together = (A×B)÷(A+B)]",
                f"({a} × {b}) ÷ ({a} + {b}) = {float(a)*float(b)} ÷ {float(a)+float(b)} = {round(float(a)*float(b)/(float(a)+float(b)),2)}",
                f"∴ {ans}"
            ]
        except:
            sol_steps = [f"Rate of work = 1/days", f"∴ {ans}"]
            trick = [f"[Together=(A×B)÷(A+B)]", f"∴ {ans}"]
    else:
        sol_steps = [f"Rate = 1/days, combined = sum of rates", f"∴ {ans}"]
        trick = [f"[Together=(A×B)÷(A+B)]", f"∴ {ans}"]
    return sol_steps, trick

def solve_speed_distance(q):
    txt = q['question']
    ans = correct_val(q)
    n = nums(txt)
    sol_steps, trick = [], []
    if len(n) >= 2:
        s, t = n[0], n[1]
        d = round(float(s) * float(t), 2)
        sol_steps = [
            f"Given: Speed = {s}, Time = {t}",
            f"Formula: Distance = Speed × Time",
            f"Distance = {s} × {t} = {d}",
            f"∴ Answer: {ans}"
        ]
        trick = [f"[D = S × T]", f"{s} × {t} = {d}", f"∴ {ans}"]
    else:
        sol_steps = [f"D = S × T | S = D/T | T = D/S", f"∴ {ans}"]
        trick = [f"[D=S×T, S=D/T, T=D/S]", f"∴ {ans}"]
    return sol_steps, trick

def solve_number_system(q):
    txt = q['question']
    ans = correct_val(q)
    n = nums(txt)
    sol_steps, trick = [], []
    if 'prime' in txt.lower():
        rng = n[:2] if len(n) >= 2 else []
        if rng:
            lo, hi = int(rng[0]), int(rng[1])
            def is_prime(x):
                if x < 2: return False
                for i in range(2, int(x**0.5)+1):
                    if x % i == 0: return False
                return True
            primes = [str(x) for x in range(lo, hi+1) if is_prime(x)]
            sol_steps = [f"Check each number {lo} to {hi} for primality", f"Primes found: {', '.join(primes) if primes else 'none'}", f"Count = {len(primes)}", f"∴ Answer: {ans}"]
            trick = [f"[Primes between {lo}-{hi}: {', '.join(primes) if primes else 'none'}]", f"Count = {len(primes)}", f"∴ {ans}"]
    elif 'lcm' in txt.lower() or 'hcf' in txt.lower():
        if len(n) >= 2:
            a, b = int(float(n[0])), int(float(n[1]))
            import math
            hcf = math.gcd(a, b)
            lcm = a*b//hcf
            sol_steps = [f"Numbers: {a} and {b}", f"HCF({a},{b}) = {hcf} (Euclidean algorithm)", f"LCM = (a×b)/HCF = ({a}×{b})/{hcf} = {lcm}", f"∴ Answer: {ans}"]
            trick = [f"[LCM × HCF = a × b]", f"HCF={hcf}, LCM={lcm}", f"∴ {ans}"]
        else:
            sol_steps = [f"HCF: largest common divisor", f"LCM = a×b ÷ HCF", f"∴ {ans}"]
            trick = [f"[LCM×HCF=a×b]", f"∴ {ans}"]
    else:
        sol_steps = [f"Identify number type (prime/composite/perfect square)", f"Values from question: {', '.join(n[:4]) if n else 'see question'}", f"∴ Answer: {ans}"]
        trick = [f"[Check divisibility rules]", f"∴ {ans}"]
    return sol_steps, trick

def solve_algebra(q):
    txt = q['question']
    ans = correct_val(q)
    n = nums(txt)
    sol_steps = [f"Given values: {', '.join(n[:5]) if n else 'from question'}", f"Set up equation with the given data", f"Solve for unknown variable", f"∴ Answer: {ans}"]
    trick = [f"[Let unknown = x, form & solve equation]", f"Values used: {', '.join(n[:4]) if n else ''}", f"∴ {ans}"]
    return sol_steps, trick

def solve_geometry(q):
    txt = q['question']
    ans = correct_val(q)
    n = nums(txt)
    sol_steps, trick = [], []
    if 'triangle' in txt.lower() and 'angle' in txt.lower() and len(n) >= 2:
        known = ' + '.join(n[:2])
        s = sum(float(x) for x in n[:2])
        third = round(180 - s, 2)
        sol_steps = [f"Sum of angles in triangle = 180°", f"Known angles: {', '.join(n[:2])}°", f"Third angle = 180 - ({known}) = 180 - {s} = {third}°", f"∴ Answer: {ans}"]
        trick = [f"[∠A + ∠B + ∠C = 180°]", f"180 - {s} = {third}°", f"∴ {ans}"]
    elif 'pythagoras' in txt.lower() or ('right' in txt.lower() and len(n) >= 2):
        a, b = n[0], n[1]
        c = round((float(a)**2 + float(b)**2)**0.5, 2)
        sol_steps = [f"Pythagoras: a² + b² = c²", f"a = {a}, b = {b}", f"c = √({a}² + {b}²) = √({float(a)**2} + {float(b)**2}) = √{float(a)**2+float(b)**2} = {c}", f"∴ Answer: {ans}"]
        trick = [f"[c = √(a²+b²)]", f"√({float(a)**2}+{float(b)**2}) = {c}", f"∴ {ans}"]
    else:
        sol_steps = [f"Apply relevant geometry theorem/formula", f"Values: {', '.join(n[:4]) if n else 'from question'}", f"∴ Answer: {ans}"]
        trick = [f"[Key formula for this shape]", f"∴ {ans}"]
    return sol_steps, trick

def solve_trigonometry(q):
    txt = q['question']
    ans = correct_val(q)
    n = nums(txt)
    sol_steps = [f"Identify trig ratio (sin/cos/tan)", f"Values: {', '.join(n[:4]) if n else 'from question'}", f"Apply: sin²θ + cos²θ = 1", f"∴ Answer: {ans}"]
    trick = [f"[sin²θ+cos²θ=1 | tan=sin/cos]", f"∴ {ans}"]
    return sol_steps, trick

def solve_mensuration(q):
    txt = q['question']
    ans = correct_val(q)
    n = nums(txt)
    sol_steps, trick = [], []
    if 'circle' in txt.lower() and n:
        r = n[0]
        area = round(3.14159 * float(r)**2, 2)
        circ = round(2 * 3.14159 * float(r), 2)
        sol_steps = [f"Radius r = {r}", f"Area = π × r² = 3.14159 × {r}² = 3.14159 × {float(r)**2} = {area}", f"Circumference = 2πr = 2 × 3.14159 × {r} = {circ}", f"∴ Answer: {ans}"]
        trick = [f"[Area=πr², Circ=2πr]", f"r={r} → Area={area}, Circ={circ}", f"∴ {ans}"]
    elif 'rectangle' in txt.lower() and len(n) >= 2:
        l, b = n[0], n[1]
        area = round(float(l)*float(b), 2)
        sol_steps = [f"Length = {l}, Breadth = {b}", f"Area = L × B = {l} × {b} = {area}", f"Perimeter = 2(L+B) = 2({float(l)+float(b)}) = {2*(float(l)+float(b))}", f"∴ Answer: {ans}"]
        trick = [f"[Area=L×B, Perim=2(L+B)]", f"{l}×{b}={area}", f"∴ {ans}"]
    else:
        sol_steps = [f"Identify shape and formula", f"Values: {', '.join(n[:4]) if n else 'from question'}", f"∴ Answer: {ans}"]
        trick = [f"[Use shape-specific formula]", f"∴ {ans}"]
    return sol_steps, trick

def solve_si_ci(q):
    txt = q['question']
    ans = correct_val(q)
    n = nums(txt)
    sol_steps, trick = [], []
    if len(n) >= 3:
        p, r, t = n[0], n[1], n[2]
        si = round(float(p)*float(r)*float(t)/100, 2)
        sol_steps = [f"Principal P = {p}, Rate R = {r}%, Time T = {t} years", f"SI = P × R × T ÷ 100", f"SI = {p} × {r} × {t} ÷ 100 = {si}", f"Amount = P + SI = {float(p)+si}", f"∴ Answer: {ans}"]
        trick = [f"[SI = P×R×T÷100]", f"{p}×{r}×{t}÷100 = {si}", f"∴ {ans}"]
    else:
        sol_steps = [f"SI = P×R×T÷100", f"CI = P×(1+R/100)^T - P", f"∴ {ans}"]
        trick = [f"[SI=PRT/100]", f"∴ {ans}"]
    return sol_steps, trick

def solve_statistics(q):
    txt = q['question']
    ans = correct_val(q)
    n = nums(txt)
    sol_steps = [f"Identify measure: Mean/Median/Mode", f"Values: {', '.join(n[:6]) if n else 'from question'}", f"Mean = Sum ÷ Count | Median = middle value | Mode = most frequent", f"∴ Answer: {ans}"]
    trick = [f"[Mean=Sum/n, Median=middle, Mode=most frequent]", f"∴ {ans}"]
    return sol_steps, trick

TOPIC_MAP = {
    'percentage': solve_percentage,
    'profit': solve_profit_loss,
    'loss': solve_profit_loss,
    'ratio': solve_ratio,
    'proportion': solve_ratio,
    'average': solve_average,
    'time and work': solve_time_work,
    'pipes': solve_time_work,
    'speed': solve_speed_distance,
    'distance': solve_speed_distance,
    'number system': solve_number_system,
    'algebra': solve_algebra,
    'geometry': solve_geometry,
    'trigonometry': solve_trigonometry,
    'mensuration': solve_mensuration,
    'simple interest': solve_si_ci,
    'compound interest': solve_si_ci,
    'mixture': solve_ratio,
    'statistics': solve_statistics,
    'data interpretation': solve_statistics,
}

def get_solver(topic):
    tl = (topic or '').lower()
    for key, fn in TOPIC_MAP.items():
        if key in tl:
            return fn
    return None

def build_solution(q, sol_steps, trick):
    ans = correct_val(q)
    ci = q.get('correctAnswer', 0)
    letter = opt_letter(ci)
    lines = [f"✅ Correct Answer: ({letter}) {ans}", ""]
    lines.append("📝 SOLUTION:")
    for i, s in enumerate(sol_steps, 1):
        lines.append(f"  {i}. {s}")
    lines.append("")
    lines.append("⚡ TRICK:")
    for ln in trick:
        lines.append(f"  {ln}")
    return "\n".join(lines)

def enrich():
    print("Loading pyqs.json...")
    with open(SRC) as f:
        data = json.load(f)

    shutil.copy(SRC, BAK)
    print(f"Backup saved: {BAK}")

    maths_qs = [q for q in data if 'math' in (q.get('subject','').lower())]
    print(f"Maths questions: {len(maths_qs)}")

    updated = 0
    skipped = 0

    for q in data:
        if 'math' not in (q.get('subject','').lower()):
            continue

        topic = q.get('topic','')
        solver = get_solver(topic)
        if not solver:
            skipped += 1
            continue

        try:
            sol_steps, trick = solver(q)
            q['solution'] = build_solution(q, sol_steps, trick)
            updated += 1
        except Exception as e:
            skipped += 1
            print(f"  SKIP id={q.get('id')}: {e}")

    print(f"\nUpdated: {updated} | Skipped: {skipped}")
    print("Saving...")
    with open(SRC, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("Done!")

if __name__ == '__main__':
    enrich()
