"""
RRB Group D Classification Engine V2
════════════════════════════════════
4-Source Weighted Pipeline:
  Question Text  : 15%
  All 4 Options  : 30%
  Correct Answer : 40%
  Explanation    : 15%
Only applies changes when final confidence > 85%
Threshold: >85 CLASSIFIED | 80-85 BORDERLINE | <80 UNCLASSIFIED
"""

import json, re, copy, sys
from collections import Counter, defaultdict

# ══════════════════════════════════════════════════════════════════════════════
# CANONICAL TOPIC MAP  (display_name → canonical_key)
# ══════════════════════════════════════════════════════════════════════════════
MATHS_TOPICS = {
    # Canonical keys
    "Number System", "Percentage", "Profit and Loss", "Simple Interest",
    "Ratio and Proportion", "Mixture and Alligation", "Speed Distance Time",
    "Time and Work", "Algebra", "Geometry", "Mensuration", "Trigonometry",
    "Statistics and Data Interpretation", "Average",
}

REASONING_TOPICS = {
    "Analogy", "Classification and Odd One Out", "Number Series",
    "Letter Series", "Coding-Decoding", "Blood Relations", "Direction Sense",
    "Ranking and Order", "Syllogism", "Statement and Conclusion",
    "Venn Diagram", "Calendar and Clock", "Mirror and Water Image",
    "Seating Arrangement", "Puzzle", "Embedded Figures",
    "Mathematical Operations",
}

# ── ALIAS NORMALIZER ───────────────────────────────────────────────────────────
TOPIC_ALIASES = {
    # Maths duplicates
    "Time & Work":                  "Time and Work",
    "Work & Time":                  "Time and Work",
    "Work and Time":                "Time and Work",
    "Pipes & Cisterns":             "Time and Work",
    "Pipes and Cisterns":           "Time and Work",
    "Ages":                         "Algebra",
    "Age Problems":                 "Algebra",
    "Linear Equations":             "Algebra",
    "Lines & Angles":               "Geometry",
    "3D (Volume, Surface Area)":    "Mensuration",
    "Mensuration 2D":               "Mensuration",
    "Mensuration 3D":               "Mensuration",
    "Squares & Cube Roots":         "Number System",
    "LCM & HCF":                    "Number System",
    "Simplification":               "Number System",
    "Mixture & Alligation":         "Mixture and Alligation",
    "Simple & Compound Interest":   "Simple Interest",
    "S.I. & C.I.":                  "Simple Interest",
    "SI & CI":                      "Simple Interest",
    "Speed, Distance and Time":     "Speed Distance Time",
    "Speed & Distance":             "Speed Distance Time",
    "Time & Distance":              "Speed Distance Time",
    "Ratio & Proportion":           "Ratio and Proportion",
    "Ratio and Proportion":         "Ratio and Proportion",
    "Partnership":                  "Ratio and Proportion",
    "Profit & Loss":                "Profit and Loss",
    "Data Interpretation":          "Statistics and Data Interpretation",
    "Average":                      "Average",

    # Reasoning duplicates
    "Analogies":                    "Analogy",
    "Ranking & Arrangement":        "Seating Arrangement",
    "Ranking & Order":              "Ranking and Order",
    "Classification & Odd One Out": "Classification and Odd One Out",
    "Classification":               "Classification and Odd One Out",
    "Odd One Out":                  "Classification and Odd One Out",
    "Alphabet Series":              "Letter Series",
    "Coding & Decoding":            "Coding-Decoding",
    "Blood Relation":               "Blood Relations",
    "Direction":                    "Direction Sense",
    "Directions":                   "Direction Sense",
    "Calendar & Clock":             "Calendar and Clock",
    "Mirror & Water Image":         "Mirror and Water Image",
    "Mirror Image":                 "Mirror and Water Image",
    "Statement & Conclusion":       "Statement and Conclusion",
    "Seating / Arrangement":        "Seating Arrangement",
    "Arrangement":                  "Seating Arrangement",
    "Number Arrangement":           "Number Series",
    "Mathematical Operations":      "Mathematical Operations",
}

# ── DISPLAY NAMES (for output) ─────────────────────────────────────────────────
TOPIC_DISPLAY = {
    # Maths
    "Number System":                    "Number System",
    "Percentage":                       "Percentage",
    "Profit and Loss":                  "Profit, Loss & Discount",
    "Simple Interest":                  "Simple & Compound Interest",
    "Ratio and Proportion":             "Ratio, Proportion & Partnership",
    "Mixture and Alligation":           "Mixture & Alligation",
    "Speed Distance Time":              "Time, Speed & Distance",
    "Time and Work":                    "Time & Work",
    "Algebra":                          "Algebra",
    "Geometry":                         "Geometry",
    "Mensuration":                      "Mensuration",
    "Trigonometry":                     "Trigonometry",
    "Statistics and Data Interpretation": "Statistics & Data Interpretation",
    "Average":                          "Average",
    # Reasoning
    "Analogy":                          "Analogy",
    "Classification and Odd One Out":   "Classification & Odd One Out",
    "Number Series":                    "Number Series",
    "Letter Series":                    "Letter Series",
    "Coding-Decoding":                  "Coding-Decoding",
    "Blood Relations":                  "Blood Relations",
    "Direction Sense":                  "Direction Sense",
    "Ranking and Order":                "Ranking & Order",
    "Syllogism":                        "Syllogism",
    "Statement and Conclusion":         "Statement & Conclusion",
    "Venn Diagram":                     "Venn Diagram",
    "Calendar and Clock":              "Calendar & Clock",
    "Mirror and Water Image":           "Mirror & Water Image",
    "Seating Arrangement":              "Seating Arrangement",
    "Puzzle":                           "Puzzle (Complex)",
    "Embedded Figures":                 "Embedded Figures",
    "Mathematical Operations":          "Mathematical Operations",
}


# ══════════════════════════════════════════════════════════════════════════════
# HELPER: resolve answer index to text
# ══════════════════════════════════════════════════════════════════════════════
def get_answer_text(q):
    opts = q.get('options', []) or []
    ans = q.get('correctAnswer')
    if ans is None:
        return ''
    if isinstance(ans, int) and 0 <= ans < len(opts):
        return str(opts[ans])
    if isinstance(ans, str):
        if ans in ('A','B','C','D'):
            idx = ord(ans) - ord('A')
            if 0 <= idx < len(opts):
                return str(opts[idx])
        return str(ans)
    return ''


def get_opts_text(q):
    opts = q.get('options', []) or []
    return [str(o) for o in opts]


def all_text(q):
    parts = [
        q.get('question', ''),
        ' '.join(get_opts_text(q)),
        get_answer_text(q),
        q.get('solution', '') or '',
    ]
    return ' '.join(parts).lower()


# ══════════════════════════════════════════════════════════════════════════════
# SIGNAL EXTRACTORS — each returns (score_0_to_100, topic_key, sub_topic, signals[])
# ══════════════════════════════════════════════════════════════════════════════

# ── MATHS ─────────────────────────────────────────────────────────────────────

MATHS_PATTERNS = [
    # (regex, topic_key, sub_topic, base_score)

    # A08 Time & Work — MUST come before speed/distance to catch pipe/cistern
    (r'(pipe|cistern|tap|tank).{0,40}(fill|empty|leak)', "Time and Work", "Pipes & Cisterns", 95),
    (r'(fill|empty).{0,30}(pipe|cistern|tank)', "Time and Work", "Pipes & Cisterns", 95),
    (r'(\d+\s*(men|women|workers|persons)).{0,60}(complete|finish|do|work)', "Time and Work", "Work Done in Given Days", 90),
    (r'(efficiency|work together|alone in \d+ days)', "Time and Work", "Work Efficiency", 92),
    (r'(wage|salary|paid|earn).{0,30}(work|day|hour)', "Time and Work", "Work & Wages", 90),

    # A07 Speed Distance Time — after pipe/cistern
    (r'boat.{0,30}(stream|river|current|upstream|downstream)', "Speed Distance Time", "Boat & Stream Problems", 97),
    (r'(upstream|downstream).{0,30}(speed|km|hr)', "Speed Distance Time", "Boat & Stream Problems", 97),
    (r'train.{0,40}(platform|bridge|tunnel|cross)', "Speed Distance Time", "Train Problems (Platform, Bridge, Two Trains)", 96),
    (r'two trains.{0,60}(opposite|same direction)', "Speed Distance Time", "Relative Speed (Same/Opposite Direction)", 96),
    (r'(speed|distance|time|km/h|km per hour|m/s|mph)', "Speed Distance Time", "Basic Speed-Distance-Time", 88),
    (r'(relative speed|overtake|catch)', "Speed Distance Time", "Relative Speed (Same/Opposite Direction)", 93),
    (r'average speed', "Speed Distance Time", "Average Speed", 94),

    # A06 Mixture
    (r'(alligation|mixture.{0,30}(solution|water|milk|acid)|replace.{0,30}(litre|liter))', "Mixture and Alligation", "Rule of Alligation", 96),
    (r'ratio of (milk|water|solution|spirit)', "Mixture and Alligation", "Mixing Two or More Solutions", 90),

    # A05 Ratio & Proportion
    (r'(partner|invest.{0,30}(profit|loss)|share.{0,30}profit)', "Ratio and Proportion", "Partnership (Simple & Compound)", 94),
    (r'(direct.{0,15}proportion|inverse.{0,15}proportion|variation)', "Ratio and Proportion", "Direct & Inverse Proportion", 93),
    (r'ratio.{0,30}(number|age|part|share)', "Ratio and Proportion", "Ratio & Proportion Basics", 85),

    # A04 SI / CI
    (r'(compound interest|compounded)', "Simple Interest", "CI Formula & Applications", 97),
    (r'(simple interest|\bsi\b|\bci\b|principal.{0,30}(rate|time|annum))', "Simple Interest", "SI Formula & Applications", 95),
    (r'per annum.{0,50}interest', "Simple Interest", "SI Formula & Applications", 90),

    # A03 Profit & Loss
    (r'(dishonest|false weight|fraud|cheat).{0,30}(sell|profit|gain)', "Profit and Loss", "Dishonest Dealings", 97),
    (r'(successive discount|two discount)', "Profit and Loss", "Successive Discount", 96),
    (r'(marked price|list price|market price)', "Profit and Loss", "Marked Price & Discount", 95),
    (r'(cost price|selling price|cp\b|sp\b)', "Profit and Loss", "Cost Price / Selling Price", 93),
    (r'(profit|loss|gain).{0,30}(percent|%)', "Profit and Loss", "Profit % and Loss %", 91),
    (r'(discount.{0,20}%|%\s*discount)', "Profit and Loss", "Marked Price & Discount", 91),

    # A02 Percentage
    (r'(population.{0,30}(increas|decreas|grow)|depreciat)', "Percentage", "Population & Depreciation Problems", 95),
    (r'(percent.{0,20}percent|percent of percent)', "Percentage", "Percentage of a Percentage", 94),
    (r'(increas.{0,20}\d+\s*%|decreas.{0,20}\d+\s*%)', "Percentage", "Percentage Increase/Decrease", 90),
    (r'\d+\s*%\s*of\s*\d+', "Percentage", "Basic Percentage Calculation", 88),

    # A14 Statistics/DI
    (r'(bar graph|pie chart|line graph|histogram|data interpretation)', "Statistics and Data Interpretation", "Bar Graph, Pie Chart, Line Graph", 96),
    (r'(median|mode\b|mean\b|range\b)', "Statistics and Data Interpretation", "Mean, Median, Mode", 93),
    (r'average.{0,30}(marks|score|weight|height|age)', "Average", "Mean, Median, Mode", 91),
    (r'\baverage\b.{0,60}(find|calculate|what|how)', "Average", "Mean, Median, Mode", 88),

    # A13 Trigonometry
    (r'(angle of elevation|angle of depression|height.{0,20}distance|tower.{0,30}angle)', "Trigonometry", "Height & Distance (Angle of Elevation/Depression)", 97),
    (r'(sin\b|cos\b|tan\b|cot\b|sec\b|cosec\b|trigonometric)', "Trigonometry", "Trigonometric Ratios (Sin, Cos, Tan, etc.)", 95),
    (r'(sin\s*[0-9]+°|cos\s*[0-9]+°|tan\s*[0-9]+°)', "Trigonometry", "Standard Angle Values (0°,30°,45°,60°,90°)", 96),

    # A12 Mensuration 3D
    (r'(volume|surface area).{0,30}(cylinder|cone|sphere|hemisphere|cube|cuboid|frustum)', "Mensuration", "Volume & Surface Area", 97),
    (r'(cylinder|cone|sphere|hemisphere|frustum).{0,30}(volume|surface area)', "Mensuration", "Volume & Surface Area", 97),

    # A11 Mensuration 2D
    (r'(area|perimeter|circumference).{0,30}(triangle|rectangle|square|circle|trapezium|parallelogram|rhombus)', "Mensuration", "Area of Plane Figures", 96),
    (r'(triangle|rectangle|square|circle).{0,30}(area|perimeter)', "Mensuration", "Area of Plane Figures", 94),

    # A10 Geometry
    (r'(angle|triangle|congruent|similar|circle|chord|tangent|arc|quadrilateral|polygon|parallel|transversal)', "Geometry", "Triangles (Properties, Congruence, Similarity)", 88),
    (r'(pythagoras|pythagorean)', "Geometry", "Triangles (Properties, Congruence, Similarity)", 95),
    (r'(inscribed|circumscribed|subtend|cyclic)', "Geometry", "Circles (Chord, Tangent, Arc)", 93),

    # A09 Algebra
    (r'(quadratic equation|x\^2|x²)', "Algebra", "Quadratic Equations", 95),
    (r'(algebraic identity|a\+b\)\^2|\(a-b\)\^2)', "Algebra", "Algebraic Identities", 95),
    (r'age|years older|years younger|sum of ages', "Algebra", "Linear Equations (1 & 2 Variables)", 92),
    (r'(linear equation|solve for x|find x|find the value)', "Algebra", "Linear Equations (1 & 2 Variables)", 90),
    (r'two numbers.{0,40}(sum|difference|product).{0,20}(find|what)', "Algebra", "Linear Equations (1 & 2 Variables)", 88),

    # A01 Number System
    (r'(lcm|lc\.m\.|lowest common multiple)', "Number System", "LCM & HCF", 97),
    (r'(hcf|h\.c\.f\.|highest common factor)', "Number System", "LCM & HCF", 97),
    (r'(divisib|remainder when.{0,30}divid)', "Number System", "Divisibility Rules", 95),
    (r'(unit digit|last digit|ones digit)', "Number System", "Unit Digit Problems", 95),
    (r'(surd|indic|exponent|\bpower\b).{0,20}(\d|simplif)', "Number System", "Surds & Indices", 93),
    (r'(bodmas|simplif|order of operation)', "Number System", "BODMAS & Simplification", 91),
    (r'(fraction|decimal|integer)', "Number System", "Integers, Fractions, Decimals", 85),
]

def score_maths_question(text, q_text, opts_texts, ans_text, solution):
    """Returns (topic_key, sub_topic, q_score, o_score, a_score, e_score, signals)"""
    votes = defaultdict(lambda: [0, ''])  # topic → [score, sub_topic]
    signals = []

    def vote(src, topic, sub, sc, note):
        if sc > votes[topic][0]:
            votes[topic] = [sc, sub]
        signals.append(f"[{src}] {note} → {topic} / {sub} ({sc}%)")

    # ── SOURCE 1: Question text (weight 0.15) ──────────────────────────────────
    q_lower = q_text.lower()
    for pat, topic, sub, sc in MATHS_PATTERNS:
        if re.search(pat, q_lower):
            vote('Q', topic, sub, min(sc, 100), pat[:50])
            break  # first match wins per source

    # ── SOURCE 2: Options (weight 0.30) ───────────────────────────────────────
    # Analyze all options as a SET
    opts_combined = ' '.join(opts_texts).lower()

    # All options are numbers? → arithmetic
    all_numeric = all(re.search(r'^\s*[\d\.,\s%/:₹$]+\s*$', o) for o in opts_texts if o.strip())
    if all_numeric and opts_texts:
        # Try to detect units from options
        if any(re.search(r'km/?h|m/?s|km/hr', o, re.I) for o in opts_texts):
            vote('O', 'Speed Distance Time', 'Basic Speed-Distance-Time', 80, "Options: km/h units")
        elif any(re.search(r'(day|hour|minute)', o, re.I) for o in opts_texts):
            vote('O', 'Time and Work', 'Work Done in Given Days', 75, "Options: days/hours")
        elif any(re.search(r'(cm²|m²|sq\.|area)', o, re.I) for o in opts_texts):
            vote('O', 'Mensuration', 'Area of Plane Figures', 80, "Options: area units")
        elif any(re.search(r'(cm³|m³|litre|liter|volume)', o, re.I) for o in opts_texts):
            vote('O', 'Mensuration', 'Volume & Surface Area', 80, "Options: volume units")
        elif any(re.search(r'(rs\.?|₹|rupee)', o, re.I) for o in opts_texts):
            vote('O', 'Profit and Loss', 'Cost Price / Selling Price', 72, "Options: rupee values")
        elif any(re.search(r'%', o) for o in opts_texts):
            vote('O', 'Percentage', 'Basic Percentage Calculation', 72, "Options: percentage values")

    # Options contain specific domain terms
    for pat, topic, sub, sc in MATHS_PATTERNS:
        if re.search(pat, opts_combined):
            vote('O', topic, sub, min(sc - 5, 95), f"Option-text: {pat[:40]}")
            break

    # ── SOURCE 3: Answer (weight 0.40) ────────────────────────────────────────
    ans_lower = ans_text.lower().strip()

    # Reverse-engineer answer unit/type
    if re.search(r'(km/?h|km/hr|m/?s|miles)', ans_lower):
        vote('A', 'Speed Distance Time', 'Basic Speed-Distance-Time', 97, f"Answer unit km/h: '{ans_text[:40]}'")
    elif re.search(r'(rs\.?\s*\d|₹\s*\d|\d+\s*rupees)', ans_lower):
        # Could be profit/loss, SI/CI, salary  
        if re.search(r'interest', q_lower):
            vote('A', 'Simple Interest', 'SI Formula & Applications', 95, f"Answer Rs + interest in Q")
        elif re.search(r'(profit|loss|discount|mark)', q_lower):
            vote('A', 'Profit and Loss', 'Cost Price / Selling Price', 95, f"Answer Rs + profit/loss in Q")
        else:
            vote('A', 'Algebra', 'Linear Equations (1 & 2 Variables)', 80, f"Answer Rs value")
    elif re.search(r'^\s*\d+(\.\d+)?\s*(days?|hours?|minutes?)\s*$', ans_lower):
        # "12 days" / "5 hours" → time & work more likely
        if re.search(r'(pipe|cistern|fill|empty)', q_lower + opts_combined):
            vote('A', 'Time and Work', 'Pipes & Cisterns', 97, f"Answer days + pipe/cistern")
        else:
            vote('A', 'Time and Work', 'Work Done in Given Days', 93, f"Answer: days → time & work")
    elif re.search(r'^\s*\d+(\.\d+)?\s*(cm²|m²|sq\.?\s*(cm|m|ft|km)|hectare)\s*$', ans_lower):
        vote('A', 'Mensuration', 'Area of Plane Figures', 97, f"Answer area unit")
    elif re.search(r'^\s*\d+(\.\d+)?\s*(cm³|m³|litre|liter|ml|cubic)\s*$', ans_lower):
        vote('A', 'Mensuration', 'Volume & Surface Area', 97, f"Answer volume unit")
    elif re.search(r'^\s*\d+(\.\d+)?\s*%\s*$', ans_lower):
        if re.search(r'(profit|loss)', q_lower):
            vote('A', 'Profit and Loss', 'Profit % and Loss %', 97, f"Answer % + profit/loss Q")
        elif re.search(r'interest', q_lower):
            vote('A', 'Simple Interest', 'SI Formula & Applications', 95, f"Answer % + interest Q")
        else:
            vote('A', 'Percentage', 'Basic Percentage Calculation', 88, f"Answer is percentage")
    elif re.search(r'^\s*\d+(\.\d+)?\s*(years?|yrs?)\s*$', ans_lower):
        vote('A', 'Algebra', 'Linear Equations (1 & 2 Variables)', 90, f"Answer: years → age problem")
    elif re.search(r'sin|cos|tan|°|degree', ans_lower):
        vote('A', 'Trigonometry', 'Trigonometric Ratios (Sin, Cos, Tan, etc.)', 97, f"Answer trig value")
    else:
        # Try pattern matching on answer text
        for pat, topic, sub, sc in MATHS_PATTERNS:
            if re.search(pat, ans_lower):
                vote('A', topic, sub, min(sc, 95), f"Answer pattern: {pat[:40]}")
                break

    # ── SOURCE 4: Explanation (weight 0.15) ───────────────────────────────────
    exp_lower = solution.lower()
    exp_signals = [
        (r'si\s*=.*prt|prt.*100|simple interest formula', 'Simple Interest', 'SI Formula & Applications', 97),
        (r'ci\s*=.*p.*\(1\+|compound interest', 'Simple Interest', 'CI Formula & Applications', 97),
        (r'profit\s*%\s*=|loss\s*%\s*=', 'Profit and Loss', 'Profit % and Loss %', 97),
        (r'alligation|mean price', 'Mixture and Alligation', 'Rule of Alligation', 97),
        (r'speed\s*=\s*distance|d\s*=\s*s\s*×\s*t', 'Speed Distance Time', 'Basic Speed-Distance-Time', 97),
        (r'cistern|pipe.{0,20}(fill|empty)', 'Time and Work', 'Pipes & Cisterns', 97),
        (r'(a\s*\+\s*b.{0,5}work|work done.{0,20}day)', 'Time and Work', 'Work Done in Given Days', 95),
        (r'area\s*=|perimeter\s*=', 'Mensuration', 'Area of Plane Figures', 95),
        (r'volume\s*=|surface area\s*=', 'Mensuration', 'Volume & Surface Area', 95),
        (r'sin|cos|tan|trigonometric', 'Trigonometry', 'Trigonometric Ratios (Sin, Cos, Tan, etc.)', 95),
        (r'lcm|hcf', 'Number System', 'LCM & HCF', 97),
        (r'average\s*=\s*sum|sum\s*/\s*\d+', 'Average', 'Mean, Median, Mode', 93),
        (r'let.{0,10}age|age.{0,20}years.{0,20}sum', 'Algebra', 'Linear Equations (1 & 2 Variables)', 90),
        (r'ratio.{0,30}partner|invest.{0,30}ratio', 'Ratio and Proportion', 'Partnership (Simple & Compound)', 95),
    ]
    if exp_lower.strip():
        for pat, topic, sub, sc in exp_signals:
            if re.search(pat, exp_lower):
                vote('E', topic, sub, sc, f"Explanation: {pat[:40]}")
                break

    return votes, signals


# ─────────────────────────────────────────────────────────────────────────────
# REASONING PATTERNS
# ─────────────────────────────────────────────────────────────────────────────
REASONING_PATTERNS = [
    # B03 Number Series — digit scanning in sequence (highest priority)
    (r'refer to the (following|given) (number )?series', "Number Series", "Digit Sequence Scanning", 99),
    (r'single.digit numbers only', "Number Series", "Digit Sequence Scanning", 99),
    (r'counting to be done from (left|right)', "Number Series", "Digit Sequence Scanning", 99),
    (r'five,?\s*three.digit numbers', "Number Series", "Number Arrangement Sequence", 98),
    (r'\(left\)\s*[\d\s]{5,}', "Number Series", "Digit Sequence Scanning", 97),
    (r'what (comes|is) next.{0,20}series', "Number Series", "Number Series (Missing Number)", 93),
    (r'(missing|find the) (number|term) in the series', "Number Series", "Number Series (Missing Number)", 93),

    # B03 Letter Series
    (r'letter series|alphabet series|next letter', "Letter Series", "Letter Series", 95),

    # B19 Puzzle — box/floor BEFORE seating
    (r'(boxes?|floors?).{0,40}(stacked|kept one over|placed one over)', "Puzzle", "Box/Floor/Day Puzzle", 97),
    (r'(stacked|kept one over).{0,30}(box|floor)', "Puzzle", "Box/Floor/Day Puzzle", 97),
    (r'(seven|six|five|four|eight|nine|ten) boxes?', "Puzzle", "Box/Floor/Day Puzzle", 96),
    (r'(floor|storey|level).{0,30}(person|live|resid|flat)', "Puzzle", "Box/Floor/Day Puzzle", 95),
    (r'(monday|tuesday|wednesday|thursday|friday|saturday|sunday).{0,40}(assign|person|task|meet|schedule)', "Puzzle", "Scheduling/Ordering Puzzle", 95),
    (r'multi.condition|multi condition', "Puzzle", "Multi-condition Logic Puzzle", 93),

    # B18 Seating Arrangement
    (r'sitting in a (row|circle|line)', "Seating Arrangement", "Linear Arrangement (Single Row)", 97),
    (r'circular.{0,20}arrangement', "Seating Arrangement", "Circular Arrangement", 97),
    (r'(double row|two rows|opposite row|facing each other)', "Seating Arrangement", "Linear Arrangement (Double Row)", 96),
    (r'(in a row of \d+).{0,60}(to the right of|to the left of)', "Seating Arrangement", "Linear Arrangement (Single Row)", 93),
    (r'(standing in a row|in a row).{0,60}(facing north|facing south)', "Seating Arrangement", "Linear Arrangement (Single Row)", 92),

    # Mathematical Operations (digit manipulation — before Direction Sense)
    (r'if \d+ is (added|subtracted|multiplied|divided).{0,20}(odd digit|even digit)', "Mathematical Operations", "Digit Manipulation", 99),
    (r'(odd digits|even digits).{0,30}(add|subtract|multiply)', "Mathematical Operations", "Digit Manipulation", 98),

    # B07 Ranking & Order
    (r'ranked \d+ (from the top|from the bottom)', "Ranking and Order", "Rank from Top/Bottom", 98),
    (r'how many students are (there|in) the class', "Ranking and Order", "Rank from Top/Bottom", 97),
    (r'\d+\s*(st|nd|rd|th) from the (top|bottom) of (the )?class', "Ranking and Order", "Rank from Top/Bottom", 96),
    (r'(taller|shorter|heavier|lighter|older|younger) than', "Ranking and Order", "Comparison-based Ranking", 93),

    # B01 Analogy
    (r'(::|\bis to\b|as.{0,20}is to)', "Analogy", "Word Analogy (Semantic)", 97),
    (r'analogy|analogous|in the same way', "Analogy", "Word Analogy (Semantic)", 90),

    # B02 Classification / Odd one Out
    (r'(odd one out|does not belong|unlike the others|find the (odd|different))', "Classification and Odd One Out", "Word-based Classification", 97),

    # B04 Coding-Decoding
    (r'(in a (certain|coded) language|if .+ is coded as)', "Coding-Decoding", "Letter Coding (Shift-based)", 97),
    (r'(coded|decod|cipher).{0,30}(language|number|letter)', "Coding-Decoding", "Letter Coding (Shift-based)", 94),
    (r'(how is|what is the code for|decode)', "Coding-Decoding", "Number Coding", 92),

    # B05 Blood Relations
    (r'(father|mother|son|daughter|brother|sister|uncle|aunt|grandfather|grandmother|nephew|niece|husband|wife)', "Blood Relations", "Direct Family Tree", 95),
    (r'(introduc|point(ed|ing)|said.{0,10}(my|his|her)).{0,30}(brother|sister|father|mother)', "Blood Relations", "Pointing/Dialogue-based Relations", 97),

    # B06 Direction Sense
    (r'(walk|move|travel|go|start).{0,30}(north|south|east|west)', "Direction Sense", "Path Tracing (Final Position)", 95),
    (r'(turn(s|ed)?|face(s|d)?).{0,20}(north|south|east|west|left|right)', "Direction Sense", "Final Direction Finding", 93),
    (r'(shadow|sun rises|sun sets|morning|evening).{0,30}direction', "Direction Sense", "Shadow-based Direction", 95),
    (r'how far.{0,30}(km|m|miles).{0,30}(from|away)', "Direction Sense", "Distance Calculation", 93),

    # B08 Syllogism
    (r'(all\s+\w+\s+are|some\s+\w+\s+are|no\s+\w+\s+(is|are))', "Syllogism", "Two-Statement Syllogism", 95),
    (r'(conclusion|follows|syllogism)', "Syllogism", "Two-Statement Syllogism", 92),
    (r'(possibility|possible that)', "Syllogism", "Possibility Cases", 94),

    # B09 Statement & Conclusion
    (r'(strong argument|weak argument|assumption|course of action|inference)', "Statement and Conclusion", "Arguments (Strong/Weak)", 93),

    # B10 Venn Diagram
    (r'(venn diagram|which diagram (best )?represents|represent the relationship)', "Venn Diagram", "Three-Circle Representation", 96),

    # B11/B12 Calendar & Clock
    (r'(what day|which day).{0,30}(falls on|born|was)', "Calendar and Clock", "Day of the Week (Given Date)", 95),
    (r'(clock|angle between.{0,20}hands|minute hand|hour hand|overlap)', "Calendar and Clock", "Clock Problems", 93),
    (r'odd days|leap year', "Calendar and Clock", "Odd Days Method", 94),

    # B14 Mirror & Water Image
    (r'(mirror image|water image|reflection)', "Mirror and Water Image", "Mirror Image of Letters/Numbers", 97),

    # B17 Embedded Figures
    (r'(embedded|hidden|how many (triangles|squares|rectangles) (are there|can you))', "Embedded Figures", "Counting Shapes in Figure", 95),
]

def score_reasoning_question(text, q_text, opts_texts, ans_text, solution):
    votes = defaultdict(lambda: [0, ''])
    signals = []

    def vote(src, topic, sub, sc, note):
        if sc > votes[topic][0]:
            votes[topic] = [sc, sub]
        signals.append(f"[{src}] {note} → {topic} / {sub} ({sc}%)")

    q_lower = q_text.lower()
    opts_combined = ' '.join(opts_texts).lower()
    ans_lower = ans_text.lower().strip()
    exp_lower = solution.lower() if solution else ''

    # ── SOURCE 1: Question text ───────────────────────────────────────────────
    for pat, topic, sub, sc in REASONING_PATTERNS:
        if re.search(pat, q_lower):
            vote('Q', topic, sub, sc, pat[:60])
            break

    # ── SOURCE 2: Options ────────────────────────────────────────────────────
    # Detect option types
    if all(re.search(r'^(north|south|east|west|north-?east|north-?west|south-?east|south-?west)$', o.strip(), re.I) for o in opts_texts if o.strip()):
        vote('O', 'Direction Sense', 'Final Direction Finding', 95, "All options = directions")

    if any(re.search(r'\d+\s*(st|nd|rd|th)', o) for o in opts_texts):
        vote('O', 'Ranking and Order', 'Position in Row/Column', 80, "Options have rank positions")

    if all(re.search(r'\b[A-Z]\b', o) for o in opts_texts if o.strip()):
        vote('O', 'Seating Arrangement', 'Linear Arrangement (Single Row)', 75, "Options = single letters (people)")

    for pat, topic, sub, sc in REASONING_PATTERNS:
        if re.search(pat, opts_combined):
            vote('O', topic, sub, min(sc - 8, 90), f"Options pattern: {pat[:40]}")
            break

    # ── SOURCE 3: Answer ─────────────────────────────────────────────────────
    # Direction answers
    if re.search(r'^(north|south|east|west|north-?east|north-?west|south-?east|south-?west)$', ans_lower):
        vote('A', 'Direction Sense', 'Final Direction Finding', 98, f"Answer is a direction: {ans_text}")

    # Ranking answer
    elif re.search(r'^\d+\s*(st|nd|rd|th)\s*(from|to)', ans_lower):
        vote('A', 'Ranking and Order', 'Position in Row/Column', 95, f"Answer is a rank: {ans_text}")

    # Number-based reasoning answers
    elif re.search(r'^\d+$', ans_lower) and len(ans_lower) <= 3:
        # Small number → likely counting/series answer
        if re.search(r'(how many|count)', q_lower):
            vote('A', 'Number Series', 'Digit Sequence Scanning', 80, f"Answer is small count")

    # Answer is a coded sequence
    elif re.search(r'^[A-Za-z]{3,}$', ans_lower) and ans_lower.isupper():
        vote('A', 'Coding-Decoding', 'Letter Coding (Shift-based)', 85, f"Answer is capital letter code: {ans_text}")

    # Answer is "floor N" or "box N"
    elif re.search(r'\b(floor|box|level)\s*\d+|\d+\s*(floor|box|level)', ans_lower):
        vote('A', 'Puzzle', 'Box/Floor/Day Puzzle', 95, f"Answer has floor/box: {ans_text}")

    # Answer is a family relation
    elif re.search(r'\b(father|mother|son|daughter|brother|sister|uncle|aunt|grandmother|grandfather)\b', ans_lower):
        vote('A', 'Blood Relations', 'Direct Family Tree', 97, f"Answer is family term: {ans_text}")

    # Pattern match answer
    else:
        for pat, topic, sub, sc in REASONING_PATTERNS:
            if re.search(pat, ans_lower):
                vote('A', topic, sub, min(sc - 3, 97), f"Answer pattern: {pat[:40]}")
                break

    # ── SOURCE 4: Explanation ────────────────────────────────────────────────
    if exp_lower:
        exp_signals_r = [
            (r'(family tree|generation|relation)', 'Blood Relations', 'Direct Family Tree', 95),
            (r'(direction|turn|walked|moved).{0,30}(north|south|east|west)', 'Direction Sense', 'Path Tracing (Final Position)', 95),
            (r'(rank(ed)?|position).{0,30}(top|bottom|left|right)', 'Ranking and Order', 'Rank from Top/Bottom', 93),
            (r'(venn|set|intersection|union)', 'Venn Diagram', 'Three-Circle Representation', 95),
            (r'(left\).*right\)|digit.*sequence|single.digit)', 'Number Series', 'Digit Sequence Scanning', 95),
            (r'(coded|code|cipher|shift)', 'Coding-Decoding', 'Letter Coding (Shift-based)', 93),
            (r'(floor|box|puzzle|arrangement)', 'Puzzle', 'Box/Floor/Day Puzzle', 90),
            (r'(all .+ are|some .+ are|conclusion)', 'Syllogism', 'Two-Statement Syllogism', 93),
        ]
        for pat, topic, sub, sc in exp_signals_r:
            if re.search(pat, exp_lower):
                vote('E', topic, sub, sc, f"Explanation: {pat[:40]}")
                break

    return votes, signals


# ══════════════════════════════════════════════════════════════════════════════
# WEIGHTED CONFIDENCE CALCULATOR
# ══════════════════════════════════════════════════════════════════════════════
def calculate_confidence(votes, q_score_raw, o_score_raw, a_score_raw, e_score_raw,
                          q_blank, e_blank, all_sources_agree):
    """
    Returns (best_topic, sub_topic, final_score, breakdown)
    """
    if not votes:
        return None, None, 0, {}

    # Find the topic with highest raw vote
    best = max(votes.items(), key=lambda x: x[1][0])
    best_topic = best[0]
    best_sub = best[1][1]
    best_raw = best[1][0]

    # Check agreement across sources
    topics_mentioned = set(votes.keys())
    n_sources_agree = sum(1 for t, v in votes.items() if v[0] >= 75 and t == best_topic)

    # Weighted score
    q_contrib  = (q_score_raw / 100.0)  * 15
    o_contrib  = (o_score_raw / 100.0)  * 30
    a_contrib  = (a_score_raw / 100.0)  * 40
    e_contrib  = (e_score_raw / 100.0)  * 15

    base = q_contrib + o_contrib + a_contrib + e_contrib

    # Bonuses
    bonus = 0
    if all_sources_agree:
        bonus += 15
    elif n_sources_agree >= 3:
        bonus += 10
    elif n_sources_agree >= 2:
        bonus += 5

    # If all votes point to same topic
    if len(topics_mentioned) == 1:
        bonus += 5

    # Penalties
    penalty = 0
    if q_blank:
        penalty += 8
    if len(topics_mentioned) >= 3:
        penalty += 15

    raw_total = base + bonus - penalty

    # Caps
    if q_blank:
        raw_total = min(raw_total, 92)
    if e_blank:
        raw_total = min(raw_total, 95)

    final = max(0, min(100, raw_total))

    breakdown = {
        'q_contrib': q_contrib, 'o_contrib': o_contrib,
        'a_contrib': a_contrib, 'e_contrib': e_contrib,
        'base': base, 'bonus': bonus, 'penalty': penalty, 'final': final,
        'n_agree': n_sources_agree, 'competing_topics': list(topics_mentioned),
    }
    return best_topic, best_sub, final, breakdown


# ══════════════════════════════════════════════════════════════════════════════
# MAIN CLASSIFICATION ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════════
def classify_question(q):
    """
    Returns (new_topic, new_sub_topic, confidence, status, signals)
    status: 'classified' | 'borderline' | 'unclassified'
    """
    q_text   = q.get('question', '') or ''
    opts     = get_opts_text(q)
    ans_text = get_answer_text(q)
    solution = q.get('solution', '') or ''
    subj     = q.get('subject', '').lower()

    q_blank = len(q_text.strip()) < 5
    e_blank = len(solution.strip()) < 5

    votes = defaultdict(lambda: [0, ''])
    signals = []

    if 'reasoning' in subj or 'reason' in subj:
        v, s = score_reasoning_question(
            all_text(q), q_text, opts, ans_text, solution
        )
        votes.update(v)
        signals.extend(s)
    elif 'math' in subj:
        v, s = score_maths_question(
            all_text(q), q_text, opts, ans_text, solution
        )
        votes.update(v)
        signals.extend(s)

    if not votes:
        return None, None, 0, 'unclassified', signals

    # Get per-source scores for the winning topic
    best_topic_candidates = sorted(votes.items(), key=lambda x: -x[1][0])
    best_topic = best_topic_candidates[0][0]
    best_sub   = best_topic_candidates[0][1][1]
    best_raw   = best_topic_candidates[0][1][0]

    # Approximate per-source scores (use raw vote as proxy)
    q_score = best_raw if signals and signals[0].startswith('[Q]') else (best_raw * 0.7)
    o_score = best_raw if any(s.startswith('[O]') and best_topic in s for s in signals) else (best_raw * 0.5)
    a_score = best_raw if any(s.startswith('[A]') and best_topic in s for s in signals) else (best_raw * 0.6)
    e_score = best_raw if any(s.startswith('[E]') and best_topic in s for s in signals) else 0

    # Check if all sources agree
    source_topics = set()
    for s in signals:
        for c in ('[Q]', '[O]', '[A]', '[E]'):
            if s.startswith(c):
                # Extract topic from signal
                parts = s.split(' → ')
                if len(parts) > 1:
                    source_topics.add(parts[1].split(' / ')[0])

    all_agree = len(source_topics) <= 1 and len(source_topics) > 0

    _, _, final, breakdown = calculate_confidence(
        votes, q_score, o_score, a_score, e_score, q_blank, e_blank, all_agree
    )

    if final > 85:
        status = 'classified'
    elif final >= 80:
        status = 'borderline'
    else:
        status = 'unclassified'

    return best_topic, best_sub, final, status, signals


# ══════════════════════════════════════════════════════════════════════════════
# APPLY ALL FIXES
# ══════════════════════════════════════════════════════════════════════════════
def run():
    with open('pyqs.json') as f:
        data = json.load(f)

    print(f"Loaded {len(data)} questions")
    print("Running V2 4-source classification engine...")
    print()

    fixed = copy.deepcopy(data)
    stats = defaultdict(int)
    audit_log = []

    maths_reasoning = [q for q in fixed
                       if any(x in q.get('subject','').lower()
                              for x in ['reasoning','reason','math'])]
    print(f"Maths + Reasoning questions: {len(maths_reasoning)}")

    for q in fixed:
        subj = q.get('subject', '').lower()
        if not any(x in subj for x in ['reasoning', 'reason', 'math']):
            continue

        # Step 1: alias normalization (always apply)
        cur_topic = q.get('topic', '')
        if cur_topic in TOPIC_ALIASES:
            new_alias = TOPIC_ALIASES[cur_topic]
            if new_alias != cur_topic:
                q['topic'] = new_alias
                stats['alias'] += 1

        # Step 2: content-based classification at >85% confidence
        new_topic, new_sub, confidence, status, signals = classify_question(q)

        if status == 'classified' and new_topic and new_topic != q.get('topic', ''):
            old_topic = q.get('topic', '')
            q['topic'] = new_topic
            if new_sub:
                q['sub_topic'] = new_sub
            stats['content_fix'] += 1
            audit_log.append({
                'id': q.get('id', ''),
                'subject': q.get('subject', ''),
                'old_topic': old_topic,
                'new_topic': new_topic,
                'new_sub': new_sub,
                'confidence': round(confidence, 1),
                'q_preview': q.get('question', '')[:80],
                'answer': get_answer_text(q)[:50],
                'top_signals': signals[:3],
            })
        elif status == 'borderline' and new_topic and new_topic != q.get('topic', ''):
            stats['borderline'] += 1
        elif status == 'unclassified':
            stats['unclassified'] += 1

    print(f"Results:")
    print(f"  Alias normalizations : {stats['alias']}")
    print(f"  Content fixes (>85%) : {stats['content_fix']}")
    print(f"  Borderline (80-85%)  : {stats['borderline']} (NOT changed)")
    print(f"  Unclassified (<80%)  : {stats['unclassified']} (NOT changed)")
    print(f"  Total changes        : {stats['alias'] + stats['content_fix']}")

    # Save fixed data
    with open('pyqs.json', 'w') as f:
        f.write(json.dumps(fixed, ensure_ascii=False, indent=2))

    # Save audit report
    with open('audit_report_v2.json', 'w') as f:
        f.write(json.dumps({
            'summary': dict(stats),
            'changes': audit_log,
        }, ensure_ascii=False, indent=2))

    print(f"\n✅ Saved pyqs.json + audit_report_v2.json")

    # Final distributions
    from collections import Counter
    reasoning = [q for q in fixed if 'reasoning' in q.get('subject','').lower()]
    maths     = [q for q in fixed if 'math' in q.get('subject','').lower()]

    print(f"\n─── Final Reasoning Distribution ({len(reasoning)} Qs) ───")
    tc = Counter(q.get('topic','') for q in reasoning)
    for t, c in tc.most_common():
        print(f"  {c:4d}  {t}")

    print(f"\n─── Final Mathematics Distribution ({len(maths)} Qs) ───")
    tc = Counter(q.get('topic','') for q in maths)
    for t, c in tc.most_common():
        print(f"  {c:4d}  {t}")

    # Show sample of changes
    print(f"\n─── Sample of key fixes ───")
    for entry in audit_log[:20]:
        print(f"  [{entry['confidence']}%] {entry['old_topic']} → {entry['new_topic']}")
        print(f"       Q: {entry['q_preview'][:70]}")
        print(f"       A: {entry['answer']}")
        print()


if __name__ == '__main__':
    run()
