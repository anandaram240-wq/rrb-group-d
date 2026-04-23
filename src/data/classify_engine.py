"""
RRB Group D Question Classification Engine
Implements the full 5-step pipeline:
  F1 Domain Keywords | F2 Structure Pattern | F3 Verb/Action
  F4 Numerical Pattern | F5 Ambiguity Detection
Applies the complete 4-level taxonomy (A01-A14, B01-B19, C01-C25, D01-D15)
"""

import json, re, copy, sys
from collections import Counter, defaultdict

# ─── CANONICAL TAXONOMY ───────────────────────────────────────────────────────
# Each entry: (code, canonical_name, normalized_display_name)
TAXONOMY = {
    # MATHEMATICS
    "Number System":        ("A01", "Mathematics", "Number System"),
    "Percentage":           ("A02", "Mathematics", "Percentage"),
    "Profit and Loss":      ("A03", "Mathematics", "Profit, Loss & Discount"),
    "Simple Interest":      ("A04", "Mathematics", "Simple & Compound Interest"),
    "Ratio and Proportion": ("A05", "Mathematics", "Ratio, Proportion & Partnership"),
    "Mixture & Alligation": ("A06", "Mathematics", "Mixture & Alligation"),
    "Speed, Distance and Time": ("A07", "Mathematics", "Time, Speed & Distance"),
    "Time and Work":        ("A08", "Mathematics", "Time & Work"),
    "Algebra":              ("A09", "Mathematics", "Algebra"),
    "Geometry":             ("A10", "Mathematics", "Geometry"),
    "Mensuration":          ("A11", "Mathematics", "Mensuration"),
    "Trigonometry":         ("A13", "Mathematics", "Trigonometry"),
    "Data Interpretation":  ("A14", "Mathematics", "Statistics & Data Interpretation"),
    "Average":              ("A01", "Mathematics", "Number System"),   # avg is part of arithmetic
    "Simplification":       ("A01", "Mathematics", "Number System"),

    # REASONING
    "Analogy":              ("B01", "Reasoning", "Analogy"),
    "Classification & Odd One Out": ("B02", "Reasoning", "Classification (Odd One Out)"),
    "Number Series":        ("B03", "Reasoning", "Series Completion"),
    "Letter Series":        ("B03", "Reasoning", "Series Completion"),
    "Coding-Decoding":      ("B04", "Reasoning", "Coding & Decoding"),
    "Blood Relations":      ("B05", "Reasoning", "Blood Relations"),
    "Direction Sense":      ("B06", "Reasoning", "Direction & Distance"),
    "Ranking & Order":      ("B07", "Reasoning", "Ranking & Order"),
    "Syllogism":            ("B08", "Reasoning", "Syllogism"),
    "Statement & Conclusion": ("B09", "Reasoning", "Statement & Conclusion"),
    "Venn Diagram":         ("B10", "Reasoning", "Venn Diagram"),
    "Calendar & Clock":     ("B11", "Reasoning", "Calendar"),
    "Mirror & Water Image": ("B14", "Reasoning", "Mirror & Water Image"),
    "Embedded Figures":     ("B17", "Reasoning", "Embedded Figures"),
    "Seating Arrangement":  ("B18", "Reasoning", "Seating Arrangement"),
    "Puzzle":               ("B19", "Reasoning", "Puzzle (Complex)"),

    # SCIENCE
    "Laws of Motion":       ("C01", "General Science", "Motion & Laws of Motion"),
    "Light":                ("C05", "General Science", "Light (Optics)"),
    "Electricity":          ("C07", "General Science", "Electricity"),
    "Magnetism":            ("C08", "General Science", "Magnetism & Electromagnetism"),
    "Chemical Reactions":   ("C13", "General Science", "Chemical Reactions & Equations"),
    "Acids, Bases and Salts": ("C14", "General Science", "Acids, Bases & Salts"),
    "Metals and Non-metals": ("C15", "General Science", "Metals & Non-Metals"),
    "Carbon Compounds":     ("C16", "General Science", "Carbon & Its Compounds"),
    "Life Processes":       ("C20", "General Science", "Human Body Systems"),
    "Periodic Table":       ("C12", "General Science", "Periodic Table"),
    "Cell Biology":         ("C18", "General Science", "Cell Biology"),
    "Reproduction":         ("C23", "General Science", "Reproduction & Genetics"),
    "Heredity & Evolution": ("C23", "General Science", "Reproduction & Genetics"),
    "Nutrition":            ("C21", "General Science", "Nutrition & Deficiency Diseases"),
    "Disease":              ("C22", "General Science", "Disease & Immunity"),
    "Environment":          ("C25", "General Science", "Ecology & Environment"),
    "Work, Energy & Power": ("C03", "General Science", "Work, Energy & Power"),
    "Sound":                ("C04", "General Science", "Sound"),
    "Gravitation":          ("C02", "General Science", "Force, Pressure & Gravitation"),

    # GENERAL AWARENESS
    "History":              ("D03", "General Awareness", "Modern Indian History"),
    "Indian History":       ("D03", "General Awareness", "Modern Indian History"),
    "Geography":            ("D05", "General Awareness", "Indian Geography"),
    "Indian Geography":     ("D05", "General Awareness", "Indian Geography"),
    "Polity":               ("D07", "General Awareness", "Indian Polity & Constitution"),
    "Indian Polity":        ("D07", "General Awareness", "Indian Polity & Constitution"),
    "Economy":              ("D09", "General Awareness", "Indian Economy"),
    "Indian Economy":       ("D09", "General Awareness", "Indian Economy"),
    "Science & Technology": ("D12", "General Awareness", "Science & Technology (Current)"),
    "Sports":               ("D14", "General Awareness", "Sports"),
    "Current Affairs":      ("D15", "General Awareness", "Current Affairs"),
    "Static GK":            ("D13", "General Awareness", "Static General Knowledge"),
    "Awards & Honours":     ("D13", "General Awareness", "Static General Knowledge"),
    "Environment & Ecology": ("C25", "General Science", "Ecology & Environment"),
}

# ─── FEATURE EXTRACTORS ───────────────────────────────────────────────────────

def extract_text(q):
    opts = q.get('options', []) or []
    if isinstance(opts, dict):
        opts = list(opts.values())
    return (q.get('question', '') + ' ' + ' '.join(str(o) for o in opts)).lower()


# ─── TOPIC CLASSIFIER ─────────────────────────────────────────────────────────
# Returns (topic, sub_topic, confidence, signals) or None

def classify_reasoning(text, q_text_raw):
    signals = []
    
    # ── B03 Series Completion ──────────────────────────────────────────────────
    # Number/digit series in a sequence line
    if re.search(r'refer to the (following|given) series', text):
        signals.append("F2: 'refer to the...series' structure → digit/number sequence")
        return ("Number Series", "Alpha-Numeric Series", 97, signals)
    if re.search(r'single.digit numbers only', text):
        signals.append("F2: single-digit numbers only → digit sequence")
        return ("Number Series", "Alpha-Numeric Series", 96, signals)
    if re.search(r'counting to be done from (left|right)', text):
        signals.append("F2: counting from left/right → sequence scanning")
        return ("Number Series", "Alpha-Numeric Series", 95, signals)
    if re.search(r'five,?\s*three.digit numbers', text):
        signals.append("F2: five three-digit numbers pattern → number arrangement series")
        return ("Number Series", "Alpha-Numeric Series", 94, signals)
    if re.search(r'based on the five.*\d', text) and re.search(r'\(left\)', text):
        signals.append("F2: '(left)...numbers' pattern → digit series")
        return ("Number Series", "Alpha-Numeric Series", 93, signals)
    if re.search(r'\(left\)\s*\d{3,}', text):
        signals.append("F4: (Left) followed by multi-digit numbers → number sequence")
        return ("Number Series", "Number Series (Missing Number)", 92, signals)

    # Letter series
    if re.search(r'(letter series|alphabet series|next letter|which letter comes)', text):
        signals.append("F1: letter/alphabet series keywords")
        return ("Letter Series", "Letter Series", 90, signals)
    if re.search(r'\b[a-z]\s*[,_]\s*[a-z]\s*[,_]\s*[a-z]\s*[,_]\s*[a-z]\b', text):
        signals.append("F4: letter pattern a,b,c,d → letter series")
        return ("Letter Series", "Letter Series", 85, signals)

    # Number series - missing number
    if re.search(r'(what (is|comes) next|find the missing|next number|next term|complete the series)', text):
        if re.search(r'\d', text):
            signals.append("F3: 'what comes next'/'missing number' + numbers → number series")
            return ("Number Series", "Number Series (Missing Number)", 88, signals)

    # ── B19 Puzzle / B18 Seating Arrangement ──────────────────────────────────
    # Box stacking puzzle
    if re.search(r'(boxes?|floors?).{0,30}(stacked|kept one over|placed)', text):
        signals.append("F2: boxes stacked/placed → stack puzzle → B19 Puzzle")
        return ("Seating Arrangement", "Box/Floor/Day Puzzle", 94, signals)
    if re.search(r'(stacked|placed|kept one over).{0,30}(box|floor)', text):
        signals.append("F2: stacked/placed boxes → B19 Puzzle")
        return ("Seating Arrangement", "Box/Floor/Day Puzzle", 93, signals)
    if re.search(r'(seven|six|five|four|eight|nine|ten) boxes?', text):
        signals.append("F1: N boxes → stack puzzle")
        return ("Seating Arrangement", "Box/Floor/Day Puzzle", 92, signals)
    if re.search(r'(floor|building|storey|story).{0,40}(person|live|resid)', text):
        signals.append("F2: floor-building-person pattern → puzzle")
        return ("Seating Arrangement", "Box/Floor/Day Puzzle", 90, signals)
    if re.search(r'(schedule|day|monday|tuesday|wednesday|thursday|friday|saturday|sunday).{0,30}(assign|meet|task)', text):
        signals.append("F2: scheduling/day assignment → B19 Puzzle")
        return ("Seating Arrangement", "Scheduling/Ordering Puzzle", 88, signals)

    # Linear/circular seating
    if re.search(r'sitting in a (row|circle)', text):
        signals.append("F2: sitting in a row/circle → B18 Seating Arrangement")
        return ("Seating Arrangement", "Linear Arrangement (Single Row)", 95, signals)
    if re.search(r'circular arrangement', text):
        signals.append("F1: circular arrangement → B18")
        return ("Seating Arrangement", "Circular Arrangement", 95, signals)
    if re.search(r'(sitting|standing|facing).{0,40}(north|south|east|west).{0,40}in a row', text):
        signals.append("F2: facing direction + in a row → B18 Linear Arrangement")
        return ("Seating Arrangement", "Linear Arrangement (Single Row)", 90, signals)
    if re.search(r'in a row of \d+.{0,60}(to the right of|to the left of)', text):
        signals.append("F2: row of N people, relative position query → B18")
        return ("Seating Arrangement", "Linear Arrangement (Single Row)", 90, signals)
    if re.search(r'(how many people are between|between .{0,30} and .{0,30} in the row)', text):
        signals.append("F2: people between X and Y in a row → B18")
        return ("Seating Arrangement", "Linear Arrangement (Single Row)", 88, signals)
    if re.search(r'double row|two rows|opposite row', text):
        signals.append("F2: two/double row → B18 Linear Double Row")
        return ("Seating Arrangement", "Linear Arrangement (Double Row)", 90, signals)

    # ── B07 Ranking & Order ───────────────────────────────────────────────────
    if re.search(r'ranked \d+ (from the top|from the bottom)', text):
        signals.append("F4: ranked N from top/bottom → B07 Ranking")
        return ("Ranking & Order", "Rank from Top/Bottom", 96, signals)
    if re.search(r'how many students are (there|in) (the |his |her )?class', text):
        signals.append("F3: how many students in class → class size from rank → B07")
        return ("Ranking & Order", "Rank from Top/Bottom", 94, signals)
    if re.search(r'\d+\s*(st|nd|rd|th) from the (top|bottom) of (the |a )?class', text):
        signals.append("F4: Nth from top/bottom of class → B07 Ranking")
        return ("Ranking & Order", "Rank from Top/Bottom", 93, signals)
    if re.search(r'(taller|shorter|heavier|lighter|older|younger|faster|slower) than', text):
        signals.append("F1: comparison than → B07 Comparison-based Ranking")
        return ("Ranking & Order", "Comparison-based Ranking", 90, signals)
    # Row position — if just position from an end (not relative to another person)
    if re.search(r'\d+\s*(st|nd|rd|th) from the (left|right) end', text):
        if not re.search(r'(to the right of|to the left of|between)', text):
            signals.append("F4: Nth from left/right end → B07 Position in Row")
            return ("Ranking & Order", "Position in Row/Column", 85, signals)

    # ── B01 Analogy ───────────────────────────────────────────────────────────
    if re.search(r'(::|\bis to\b|as.*is to)', text):
        signals.append("F2: A:B::C:? structure → B01 Analogy")
        return ("Analogy", "Word Analogy (Semantic)", 95, signals)
    if re.search(r'analogy|analogous|relates to', text):
        signals.append("F1: analogy keyword → B01")
        return ("Analogy", "Word Analogy (Semantic)", 90, signals)

    # ── B02 Classification ────────────────────────────────────────────────────
    if re.search(r'(odd one out|does not belong|find the (odd|different|unlike)|which (one|of).{0,20}(different|odd|not))', text):
        signals.append("F3: 'odd one out'/'does not belong' → B02 Classification")
        if re.search(r'\d', text):
            return ("Classification & Odd One Out", "Number-based Classification", 93, signals)
        return ("Classification & Odd One Out", "Word-based Classification", 93, signals)

    # ── B04 Coding-Decoding ───────────────────────────────────────────────────
    if re.search(r'(coded|code|decod|cipher|language|in a certain language)', text):
        signals.append("F1: coded/language → B04 Coding-Decoding")
        if re.search(r'\d', text):
            return ("Coding-Decoding", "Number Coding", 92, signals)
        return ("Coding-Decoding", "Letter Coding (Shift-based)", 92, signals)
    if re.search(r'(if [a-z]+ is coded|how is .+ coded|what is the code)', text):
        signals.append("F3: 'if X is coded as Y' pattern → B04")
        return ("Coding-Decoding", "Letter Coding (Shift-based)", 91, signals)

    # ── B05 Blood Relations ───────────────────────────────────────────────────
    if re.search(r'(father|mother|son|daughter|brother|sister|uncle|aunt|grandfather|grandmother|nephew|niece|husband|wife|spouse)', text):
        signals.append("F1: family terms → B05 Blood Relations")
        if re.search(r'(point|introduc|said to|meet)', text):
            return ("Blood Relations", "Pointing/Dialogue-based Relations", 92, signals)
        return ("Blood Relations", "Direct Family Tree", 91, signals)

    # ── B06 Direction & Distance ──────────────────────────────────────────────
    if re.search(r'(north|south|east|west|left turn|right turn|direction|distance)', text):
        if re.search(r'(walk|move|travel|start|person)', text):
            signals.append("F1: cardinal directions + movement → B06 Direction")
            if re.search(r'(how far|distance|km|m from)', text):
                return ("Direction Sense", "Distance Calculation", 93, signals)
            if re.search(r'(shadow|sun|morning|evening)', text):
                return ("Direction Sense", "Shadow-based Direction", 92, signals)
            return ("Direction Sense", "Path Tracing (Final Position)", 91, signals)
        if re.search(r'(facing|turns|pivot)', text):
            signals.append("F1: facing + turns → B06 direction finding")
            return ("Direction Sense", "Final Direction Finding", 91, signals)

    # ── B08 Syllogism ─────────────────────────────────────────────────────────
    if re.search(r'(all .+ are|some .+ are|no .+ is|some .+ are not)', text):
        signals.append("F2: All/Some/No statement structure → B08 Syllogism")
        if re.search(r'(possibility|possible)', text):
            return ("Syllogism", "Possibility Cases", 93, signals)
        return ("Syllogism", "Two-Statement Syllogism", 93, signals)
    if re.search(r'syllogism|conclusions? follow', text):
        signals.append("F1: syllogism keyword → B08")
        return ("Syllogism", "Two-Statement Syllogism", 90, signals)

    # ── B09 Statement & Conclusion ────────────────────────────────────────────
    if re.search(r'(strong argument|weak argument|assumption|course of action|inference)', text):
        signals.append("F1: argument/assumption/inference → B09")
        return ("Statement & Conclusion", "Arguments (Strong/Weak)", 90, signals)

    # ── B10 Venn Diagram ──────────────────────────────────────────────────────
    if re.search(r'(venn diagram|which diagram (best )?represents|represent the relationship)', text):
        signals.append("F1: venn diagram → B10")
        return ("Venn Diagram", "Three-Circle Representation", 93, signals)

    # ── B11 Calendar ─────────────────────────────────────────────────────────
    if re.search(r'(what day|which day|day of the week|january|february|march|april|may|june|july|august|september|october|november|december).{0,40}(day|date|year)', text):
        if re.search(r'(what day|which day|falls on|was born)', text):
            signals.append("F1+F3: month/date + 'what day' → B11 Calendar")
            return ("Calendar & Clock", "Day of the Week (Given Date)", 91, signals)

    # ── B12 Clock ────────────────────────────────────────────────────────────
    if re.search(r'(clock|angle between.{0,20}hands|hour hand|minute hand|overlap)', text):
        signals.append("F1: clock/hands/angle → B12 Clock")
        if re.search(r'(angle|degree)', text):
            return ("Calendar & Clock", "Angle Between Hands", 93, signals)
        return ("Calendar & Clock", "Time When Hands Overlap/Opposite", 90, signals)

    # ── B14 Mirror & Water Image ─────────────────────────────────────────────
    if re.search(r'(mirror image|water image|reflection of|mirror reflection)', text):
        signals.append("F1: mirror/water image → B14")
        if re.search(r'water', text):
            return ("Mirror & Water Image", "Water Image Problems", 93, signals)
        return ("Mirror & Water Image", "Mirror Image of Letters/Numbers", 93, signals)

    # ── B17 Embedded Figures ─────────────────────────────────────────────────
    if re.search(r'(embedded figure|figure.{0,20}hidden|how many (triangles|squares|rectangles))', text):
        signals.append("F1: embedded/hidden figure counting → B17")
        return ("Embedded Figures", "Counting Shapes in Figure", 90, signals)

    return None  # No confident match


def classify_mathematics(text, q_text_raw):
    signals = []

    # A01 Number System
    if re.search(r'(lcm|hcf|highest common factor|lowest common multiple)', text):
        signals.append("F1: LCM/HCF → A01 Number System")
        return ("Number System", "LCM & HCF", 95, signals)
    if re.search(r'(divisib|remainder|modular|unit digit|last digit)', text):
        signals.append("F1: divisibility/remainder → A01")
        return ("Number System", "Divisibility Rules", 92, signals)
    if re.search(r'(bodmas|simplif|brackets|order of operation)', text):
        signals.append("F3: BODMAS/simplification → A01")
        return ("Simplification", "BODMAS & Simplification", 93, signals)
    if re.search(r'(surd|index|indices|power|exponent|root)', text):
        signals.append("F1: surds/indices → A01")
        return ("Number System", "Surds & Indices", 91, signals)

    # A02 Percentage
    if re.search(r'percent|%', text):
        if re.search(r'(profit|loss|selling|cost)', text):
            pass  # falls into A03 below
        else:
            signals.append("F1: percent/% → A02 Percentage")
            return ("Percentage", "Basic Percentage Calculation", 88, signals)

    # A03 Profit & Loss
    if re.search(r'(profit|loss|selling price|cost price|sp\b|cp\b|marked price|discount)', text):
        signals.append("F1: profit/loss/SP/CP/discount → A03")
        if re.search(r'(dishonest|fraud|false weight)', text):
            return ("Profit and Loss", "Dishonest Dealings", 93, signals)
        if re.search(r'(successive discount|two discount)', text):
            return ("Profit and Loss", "Successive Discount", 92, signals)
        return ("Profit and Loss", "Cost Price / Selling Price", 90, signals)

    # A04 SI/CI
    if re.search(r'(simple interest|compound interest|\bsi\b|\bci\b|principal|rate of interest|per annum)', text):
        signals.append("F1: SI/CI/principal/rate → A04")
        if re.search(r'compound', text):
            return ("Simple Interest", "CI Formula & Applications", 93, signals)
        return ("Simple Interest", "SI Formula & Applications", 93, signals)

    # A05 Ratio & Proportion
    if re.search(r'(ratio|proportion|partnership|share|parts)', text):
        signals.append("F1: ratio/proportion/partnership → A05")
        if re.search(r'partner', text):
            return ("Ratio and Proportion", "Partnership (Simple & Compound)", 91, signals)
        return ("Ratio and Proportion", "Ratio & Proportion Basics", 88, signals)

    # average — handle separately
    if re.search(r'\baverage\b|\bmean\b', text):
        signals.append("F1: average/mean → A01 Arithmetic Mean")
        return ("Average", "Mean, Median, Mode", 88, signals)

    # A06 Mixture & Alligation
    if re.search(r'(alligation|mixture|solution|milk.*water|water.*milk|concentration)', text):
        signals.append("F1: mixture/alligation → A06")
        return ("Mixture & Alligation", "Rule of Alligation", 92, signals)

    # A07 Time Speed Distance
    if re.search(r'(speed|distance|time|km/h|m/s|kilometres per hour|train.{0,30}(platform|bridge)|boat|stream|current|upstream|downstream)', text):
        signals.append("F1: speed/distance/time → A07")
        if re.search(r'(boat|stream|upstream|downstream)', text):
            return ("Speed, Distance and Time", "Boat & Stream Problems", 93, signals)
        if re.search(r'(train|platform|bridge|tunnel)', text):
            return ("Speed, Distance and Time", "Train Problems (Platform, Bridge, Two Trains)", 93, signals)
        if re.search(r'average speed', text):
            return ("Speed, Distance and Time", "Average Speed", 91, signals)
        return ("Speed, Distance and Time", "Basic Speed-Distance-Time", 88, signals)

    # A08 Time & Work
    if re.search(r'(time.{0,20}work|work.{0,20}time|days.{0,20}complete|pipe.{0,20}(fill|empty|cistern)|tap|tank)', text):
        signals.append("F1: time/work/pipe/cistern → A08")
        if re.search(r'(pipe|cistern|tap|tank|fill|empty)', text):
            return ("Time and Work", "Pipes & Cisterns", 93, signals)
        if re.search(r'wage|salary|payment', text):
            return ("Time and Work", "Work & Wages", 91, signals)
        return ("Time and Work", "Work Done in Given Days", 88, signals)

    # A09 Algebra
    if re.search(r'(equation|variable|polynomial|factor|quadratic|x\s*[+\-=]|solve for)', text):
        signals.append("F1: equation/variable/polynomial → A09 Algebra")
        if re.search(r'quadratic|x\^2|x²', text):
            return ("Algebra", "Quadratic Equations", 91, signals)
        return ("Algebra", "Linear Equations (1 & 2 Variables)", 88, signals)
    if re.search(r'(identity|a\s*\+\s*b\s*\)\s*[²2]|a²|b²|a\^2|b\^2)', text):
        signals.append("F2: algebraic identity pattern → A09")
        return ("Algebra", "Algebraic Identities", 90, signals)

    # A10 Geometry
    if re.search(r'(triangle|circle|quadrilateral|polygon|angle|chord|tangent|arc|diameter|radius|rectangle|square)', text):
        signals.append("F1: geometry terms → A10")
        if re.search(r'(circle|chord|tangent|arc|diameter|radius)', text):
            return ("Geometry", "Circles (Chord, Tangent, Arc)", 91, signals)
        if re.search(r'triangle', text):
            return ("Geometry", "Triangles (Properties, Congruence, Similarity)", 91, signals)
        return ("Geometry", "Lines, Angles & Transversals", 85, signals)

    # A11/A12 Mensuration
    if re.search(r'(area|perimeter|volume|surface area|curved surface|lateral surface|circumference)', text):
        signals.append("F1: area/volume/perimeter → Mensuration")
        if re.search(r'(volume|surface area|cylinder|cone|sphere|hemisphere|cube|cuboid|frustum)', text):
            return ("Mensuration", "Volume & Surface Area of Cylinder", 91, signals)
        return ("Mensuration", "Area of Triangle, Rectangle, Square", 88, signals)

    # A13 Trigonometry
    if re.search(r'(sin|cos|tan|cot|sec|cosec|trigonometric|angle of elevation|angle of depression|height and distance)', text):
        signals.append("F1: trig ratios/height+distance → A13 Trigonometry")
        if re.search(r'(elevation|depression|height|tower|building)', text):
            return ("Trigonometry", "Height & Distance (Angle of Elevation/Depression)", 93, signals)
        return ("Trigonometry", "Trigonometric Ratios (Sin, Cos, Tan, etc.)", 90, signals)

    # A14 Statistics / DI
    if re.search(r'(bar graph|pie chart|line graph|table|data interpretation|median|mode|mean)', text):
        signals.append("F1: graph/median/mode → A14 Statistics & DI")
        return ("Data Interpretation", "Bar Graph, Pie Chart, Line Graph", 88, signals)

    return None


def classify_science(text, q_text_raw):
    signals = []

    # Physics
    if re.search(r'(velocity|acceleration|displacement|newton|inertia|momentum|force|friction)', text):
        signals.append("F1: motion/Newton/force → C01")
        return ("Laws of Motion", "Newton's First, Second, Third Law", 90, signals)
    if re.search(r'(pressure|buoyan|archimedes|floati|gravit|escape velocity|orbital)', text):
        signals.append("F1: pressure/gravity/buoyancy → C02")
        return ("Gravitation", "Universal Law of Gravitation", 90, signals)
    if re.search(r'(kinetic energy|potential energy|work done|power|joule|watt)', text):
        signals.append("F1: KE/PE/work/power → C03")
        return ("Work, Energy & Power", "Work Done Formula", 90, signals)
    if re.search(r'(frequency|wavelength|echo|sonar|ultrasound|infrasound|reverberation)', text):
        signals.append("F1: wave/echo/sonar → C04 Sound")
        return ("Sound", "Wave Properties (Frequency, Wavelength)", 91, signals)
    if re.search(r'(reflection|refraction|lens|mirror|convex|concave|optics|prism|dispersion|rainbow)', text):
        signals.append("F1: reflection/refraction/lens → C05 Light")
        return ("Light", "Laws of Reflection", 91, signals)
    if re.search(r'(heat|temperature|thermal|conduction|convection|radiation|specific heat|calorie)', text):
        signals.append("F1: heat/thermal/conduction → C06")
        return ("Laws of Motion", "C06 Heat", 88, signals)
    if re.search(r'(current|voltage|resistance|ohm|circuit|conductor|insulator|electric|ampere|power.{0,20}watt)', text):
        signals.append("F1: electric/current/resistance/ohm → C07 Electricity")
        return ("Electricity", "Ohm's Law", 91, signals)
    if re.search(r'(magnet|electromagnet|electromagnetic|generator|transformer|motor|ac\b|dc\b|coil)', text):
        signals.append("F1: magnet/EM/generator → C08 Magnetism")
        return ("Magnetism", "Properties of Magnets", 90, signals)
    if re.search(r'(radioactiv|alpha|beta|gamma ray|nuclear|fission|fusion)', text):
        signals.append("F1: radioactivity/nuclear → C09")
        return ("Chemical Reactions", "Nuclear & Modern Physics", 90, signals)

    # Chemistry
    if re.search(r'(solid|liquid|gas|plasma|physical change|chemical change|evaporation|sublimation)', text):
        signals.append("F1: states of matter → C10")
        return ("Chemical Reactions", "States of Matter", 85, signals)
    if re.search(r'(proton|neutron|electron|atom|molecule|ion|valency|isotope|isobar)', text):
        signals.append("F1: atomic structure terms → C11")
        return ("Periodic Table", "Atom, Molecule, Ion", 90, signals)
    if re.search(r'(periodic table|period|group|atomic number|atomic mass|mendeleev|moseley)', text):
        signals.append("F1: periodic table → C12")
        return ("Periodic Table", "Groups & Periods", 92, signals)
    if re.search(r'(oxidation|reduction|redox|catalyst|reaction|corrosion|rancidity|balanced equation)', text):
        signals.append("F1: reaction/redox/corrosion → C13 Chemical Reactions")
        return ("Chemical Reactions", "Types of Chemical Reactions", 90, signals)
    if re.search(r'(acid|base|salt|ph\b|litmus|indicator|neutraliz|alkali)', text):
        signals.append("F1: acid/base/pH/neutralization → C14")
        return ("Acids, Bases and Salts", "Properties of Acids & Bases", 92, signals)
    if re.search(r'(metal|non.metal|alloy|ore|mineral|copper|iron|zinc|aluminium|steel|reactivity series)', text):
        signals.append("F1: metals/alloys → C15")
        return ("Metals and Non-metals", "Physical & Chemical Properties", 90, signals)
    if re.search(r'(carbon|hydrocarbon|alkane|alkene|alkyne|ethanol|methane|organic)', text):
        signals.append("F1: carbon/hydrocarbon → C16")
        return ("Carbon Compounds", "Covalent Bonding in Carbon", 91, signals)

    # Biology
    if re.search(r'(cell|nucleus|mitosis|meiosis|chromosome|organelle|membrane|cytoplasm)', text):
        signals.append("F1: cell biology terms → C18")
        return ("Cell Biology", "Cell Structure & Organelles", 92, signals)
    if re.search(r'(tissue|epithelial|connective|muscular|nervous tissue|organ)', text):
        signals.append("F1: tissue types → C19")
        return ("Life Processes", "Animal Tissues", 88, signals)
    if re.search(r'(digest|enzyme|intestine|stomach|liver|bile|amylase|pepsin)', text):
        signals.append("F1: digestion/enzyme → C20 Human Body")
        return ("Life Processes", "Digestive System", 92, signals)
    if re.search(r'(heart|blood|hemoglobin|artery|vein|pulse|plasma|blood group)', text):
        signals.append("F1: heart/blood → C20")
        return ("Life Processes", "Circulatory System", 92, signals)
    if re.search(r'(kidney|urea|excret|nephron|dialysis)', text):
        signals.append("F1: kidney/excretion → C20")
        return ("Life Processes", "Excretory System", 91, signals)
    if re.search(r'(brain|neuron|nerve|reflex|synapse|spinal)', text):
        signals.append("F1: brain/neuron → C20")
        return ("Life Processes", "Nervous System & Brain", 91, signals)
    if re.search(r'(hormone|insulin|thyroid|pituitary|adrenal|endocrine)', text):
        signals.append("F1: hormone/endocrine → C20")
        return ("Life Processes", "Endocrine System & Hormones", 92, signals)
    if re.search(r'(vitamin|mineral|protein|carbohydrate|fat|deficiency|rickets|scurvy|beriberi|anaemia)', text):
        signals.append("F1: vitamin/deficiency → C21")
        return ("Nutrition", "Vitamins (A,B,C,D,E,K) & Deficiencies", 92, signals)
    if re.search(r'(bacteria|virus|fungi|protozoa|disease|malaria|tuberculosis|cholera|dengue|vaccine|antibiotic)', text):
        signals.append("F1: bacteria/virus/disease → C22")
        return ("Disease", "Bacterial Diseases", 91, signals)
    if re.search(r'(reproduction|sexual|asexual|sperm|egg|ovum|menstrual|fertiliz)', text):
        signals.append("F1: reproduction → C23")
        return ("Reproduction", "Human Reproductive System", 91, signals)
    if re.search(r'(mendel|heredity|genetic|dna|rna|gene|dominant|recessive|chromosome)', text):
        signals.append("F1: heredity/genetics → C23")
        return ("Heredity & Evolution", "Mendel's Laws of Heredity", 92, signals)
    if re.search(r'(photosynthesis|chlorophyll|stomata|transpiration|xylem|phloem|auxin|gibberellin)', text):
        signals.append("F1: photosynthesis/plant → C24")
        return ("Life Processes", "Photosynthesis", 93, signals)
    if re.search(r'(food chain|food web|ecosystem|biome|biodiversity|pollution|ozone|greenhouse)', text):
        signals.append("F1: ecology/environment → C25")
        return ("Environment", "Food Chain & Food Web", 91, signals)

    return None


def classify_ga(text, q_text_raw):
    signals = []

    # History
    if re.search(r'(mughal|british|revolt of 1857|freedom movement|congress|gandhi|nehru|britisher|viceroy|governor|partition)', text):
        signals.append("F1: freedom movement/British/Gandhi → D03 Modern History")
        return ("Indian History", "Gandhi & Freedom Movement", 90, signals)
    if re.search(r'(maurya|gupta|ashoka|chandragupta|harappan|indus valley|vedic|buddhism|jainism)', text):
        signals.append("F1: ancient empire → D01 Ancient History")
        return ("History", "Ancient Indian History", 90, signals)
    if re.search(r'(delhi sultanate|vijayanag|maratha|sikh|bhakti|sufi)', text):
        signals.append("F1: medieval empires → D02 Medieval History")
        return ("History", "Medieval Indian History", 90, signals)

    # Geography
    if re.search(r'(river|mountain|plateau|desert|ocean|sea|lake|forest|soil|monsoon|climate|dam|tributary)', text):
        signals.append("F1: river/mountain/geography terms → D05")
        return ("Indian Geography", "Rivers & Drainage Systems", 88, signals)
    if re.search(r'(national park|wildlife sanctuary|tiger reserve|biosphere)', text):
        signals.append("F1: national park/sanctuary → D05")
        return ("Indian Geography", "National Parks & Wildlife Sanctuaries", 91, signals)
    if re.search(r'(continent|country|capital|currency|world.{0,30}(largest|smallest|longest|deepest))', text):
        signals.append("F1: world geography terms → D06")
        return ("Geography", "World Geography", 85, signals)

    # Polity
    if re.search(r'(constitution|preamble|fundamental right|parliament|lok sabha|rajya sabha|president|prime minister|supreme court|amendment|article \d+)', text):
        signals.append("F1: constitution/parliament/article → D07 Polity")
        return ("Indian Polity", "Parliament (Lok Sabha, Rajya Sabha)", 91, signals)

    # Economy
    if re.search(r'(gdp|gnp|inflation|budget|fiscal|five year plan|niti aayog|agriculture|msb|green revolution)', text):
        signals.append("F1: economy terms → D09 Indian Economy")
        return ("Indian Economy", "GDP, GNP, NNP, National Income", 88, signals)
    if re.search(r'(rbi|reserve bank|repo rate|crr|slr|nabard|sebi|bank|monetary policy)', text):
        signals.append("F1: RBI/banking → D10 Banking & Finance")
        return ("Economy", "Banking & Finance", 90, signals)

    # International
    if re.search(r'(united nations|un\b|imf|world bank|wto|brics|g20|saarc|nato)', text):
        signals.append("F1: international organizations → D11")
        return ("Indian Economy", "International Organizations", 87, signals)

    # Science & Tech (current affairs)
    if re.search(r'(isro|satellite|missile|brahmos|agni|ins\b|drdo|space|launch|rocket)', text):
        signals.append("F1: ISRO/missile/space → D12 Sci-Tech")
        return ("Science & Technology", "ISRO Missions & Space Programs", 91, signals)

    # Static GK
    if re.search(r'(national symbol|emblem|anthem|flower|animal|bird|sport|game|prize|award|bharat ratna|padma|nobel|oscar)', text):
        signals.append("F1: awards/symbols → D13 Static GK")
        return ("Static GK", "National & International Important Days", 88, signals)
    if re.search(r'(headquarter|capital of|currency of|first (woman|man|indian)|largest|smallest|longest)', text):
        signals.append("F1: HQ/capital/first/largest → D13 Static GK")
        return ("Static GK", "Headquarters of Organizations", 87, signals)

    # Sports
    if re.search(r'(cricket|football|hockey|tennis|badminton|chess|olympic|commonwealth|world cup|ipl|champion)', text):
        signals.append("F1: sports terms → D14 Sports")
        return ("Sports", "Olympics (Summer & Winter)", 88, signals)

    return None


# ─── MASTER CLASSIFIER ───────────────────────────────────────────────────────

def classify(q):
    text = extract_text(q)
    q_raw = q.get('question', '')
    subj = q.get('subject', '').lower()
    cur_topic = q.get('topic', '')

    result = None
    true_subject = subj

    if 'reasoning' in subj or 'reason' in subj:
        result = classify_reasoning(text, q_raw)
        true_subject = 'Reasoning'
    elif 'math' in subj:
        result = classify_mathematics(text, q_raw)
        true_subject = 'Mathematics'
    elif 'science' in subj:
        result = classify_science(text, q_raw)
        true_subject = 'General Science'
    elif 'awareness' in subj or 'ga' in subj or 'general' in subj and 'science' not in subj:
        result = classify_ga(text, q_raw)
        true_subject = 'General Awareness'

    return result, true_subject


# ─── APPLY ALL FIXES ─────────────────────────────────────────────────────────

def run():
    with open('pyqs.json') as f:
        data = json.load(f)

    print(f"Loaded {len(data)} questions")

    # Step 1: normalize alias topic names (topic consolidation)
    ALIASES = {
        'Analogies': 'Analogy',
        'Ranking & Arrangement': 'Seating Arrangement',
        'Statement & Conclusion': 'Syllogism',
        'Alphabet Series': 'Letter Series',
        'Classification': 'Classification & Odd One Out',
        'Odd One Out': 'Classification & Odd One Out',
        'Mirror Image': 'Mirror & Water Image',
        'Seating / Arrangement': 'Seating Arrangement',
        'Number Arrangement': 'Number Series',
        'Arrangement': 'Seating Arrangement',
        'Profit & Loss': 'Profit and Loss',
        'Ratio & Proportion': 'Ratio and Proportion',
        'S.I. & C.I.': 'Simple Interest',
        'SI & CI': 'Simple Interest',
        'Speed Distance Time': 'Speed, Distance and Time',
        'Speed & Distance': 'Speed, Distance and Time',
        'Time & Distance': 'Speed, Distance and Time',
        'Work and Time': 'Time and Work',
        'Blood Relation': 'Blood Relations',
        'Direction': 'Direction Sense',
        'Directions': 'Direction Sense',
        'Puzzle': 'Seating Arrangement',
    }

    fixed = copy.deepcopy(data)
    stats = defaultdict(int)
    mismatch_log = []

    for q in fixed:
        cur_topic = q.get('topic', '')

        # Normalize aliases
        if cur_topic in ALIASES:
            new = ALIASES[cur_topic]
            q['topic'] = new
            stats['alias_normalized'] += 1

        # Content-based reclassification
        result, _ = classify(q)
        if result:
            new_topic, new_subtopic, confidence, signals = result
            if new_topic != q.get('topic', '') and confidence >= 88:
                mismatch_log.append({
                    'id': q.get('id', ''),
                    'old_topic': q.get('topic', ''),
                    'new_topic': new_topic,
                    'new_subtopic': new_subtopic,
                    'confidence': confidence,
                    'question_preview': q.get('question', '')[:80],
                })
                q['topic'] = new_topic
                if new_subtopic:
                    q['sub_topic'] = new_subtopic
                stats['content_reclassified'] += 1

    # Write fixed data
    with open('pyqs.json', 'w') as f:
        f.write(json.dumps(fixed, ensure_ascii=False, indent=2))

    # Write mismatch report
    with open('classification_audit_report.json', 'w') as f:
        f.write(json.dumps({
            'summary': dict(stats),
            'mismatches': mismatch_log,
        }, ensure_ascii=False, indent=2))

    print(f"\n✅ Fixed!")
    print(f"  Alias normalizations : {stats['alias_normalized']}")
    print(f"  Content reclassified : {stats['content_reclassified']}")
    print(f"  Total changes        : {stats['alias_normalized'] + stats['content_reclassified']}")

    # Final distribution
    from collections import Counter
    reasoning = [q for q in fixed if 'reasoning' in q.get('subject','').lower()]
    print(f"\nFinal Reasoning distribution ({len(reasoning)} Qs):")
    tc = Counter(q.get('topic','') for q in reasoning)
    for t, c in tc.most_common():
        print(f"  {c:4d}  {t}")

    maths = [q for q in fixed if 'math' in q.get('subject','').lower()]
    print(f"\nFinal Mathematics distribution ({len(maths)} Qs):")
    tc = Counter(q.get('topic','') for q in maths)
    for t, c in tc.most_common():
        print(f"  {c:4d}  {t}")


if __name__ == '__main__':
    run()
