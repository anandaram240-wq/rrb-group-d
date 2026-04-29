import json, re, math, shutil
from datetime import datetime

SRC = "pyqs.json"

def ns(txt): return re.findall(r'\d+\.?\d*', txt)
def letter(ci, opts):
    ci = int(ci) if str(ci).isdigit() else 0
    return chr(65+ci), opts[ci] if 0<=ci<len(opts) else ''

def build(ans_l, ans_v, steps, trick):
    lines = [f"✅ Correct Answer: ({ans_l}) {ans_v}", "", "📝 SOLUTION:"]
    for i,s in enumerate(steps,1): lines.append(f"  {i}. {s}")
    lines += ["", "⚡ TRICK:"] + [f"  {t}" for t in trick]
    return "\n".join(lines)

def pct(q, l, v):
    t = q['question']
    n = ns(t)
    floats = [float(x) for x in n]
    p = next((x for x in floats if x<=100 and x>0), None)
    b = next((x for x in floats if x>100), None)
    if p and b:
        val = round(p*b/100,2)
        s=[f"Base = {b}, Rate = {p}%",f"Value = ({p}/100) × {b}",f"= {p} × {b} ÷ 100 = {val}",f"∴ Answer: ({l}) {v}"]
        tr=[f"[{p}% of {b} = {p}×{b}÷100]",f"= {val}","∴ "+v]
    else:
        s=[f"Percentage formula: Value = (Rate/100) × Base",f"∴ ({l}) {v}"]
        tr=[f"[%×Base÷100]","∴ "+v]
    return s,tr

def profit(q, l, v):
    t = q['question']
    n = [float(x) for x in ns(t)]
    is_loss = 'loss' in t.lower()
    cp = next((x for x in n if x>500), None) or next((x for x in n if x>100), None)
    r  = next((x for x in n if 0<x<=50), None)
    if cp and r:
        if is_loss:
            sp=round(cp*(100-r)/100,2)
            s=[f"CP=₹{cp}, Loss%={r}%",f"SP = CP×(100-Loss%)/100",f"= {cp}×{100-r}/100 = ₹{sp}",f"∴ ({l}) {v}"]
            tr=[f"[SP=CP×(100-L%)/100]",f"{cp}×{100-r}/100=₹{sp}","∴ "+v]
        else:
            sp=round(cp*(100+r)/100,2)
            s=[f"CP=₹{cp}, Profit%={r}%",f"SP = CP×(100+Profit%)/100",f"= {cp}×{100+r}/100 = ₹{sp}",f"∴ ({l}) {v}"]
            tr=[f"[SP=CP×(100+P%)/100]",f"{cp}×{100+r}/100=₹{sp}","∴ "+v]
    else:
        s=[f"Profit/Loss always calculated on CP",f"Profit%=(SP-CP)/CP×100",f"∴ ({l}) {v}"]
        tr=[f"[P%=(SP-CP)/CP×100]","∴ "+v]
    return s,tr

def avg(q, l, v):
    t = q['question']
    n = [float(x) for x in ns(t)]
    if len(n)>=2:
        sm=sum(n); cnt=len(n); a=round(sm/cnt,2)
        s=[f"Values from question: {', '.join(str(x) for x in n[:6])}",
           f"Sum = {' + '.join(str(x) for x in n[:6])} = {sm}",
           f"Count = {cnt}",f"Average = {sm}/{cnt} = {a}",f"∴ ({l}) {v}"]
        tr=[f"[Avg = Sum÷Count]",f"{sm}÷{cnt}={a}","∴ "+v]
    else:
        s=[f"Average = Sum of all values ÷ Count",f"∴ ({l}) {v}"]
        tr=[f"[Avg=Sum÷n]","∴ "+v]
    return s,tr

def timework(q, l, v):
    t = q['question']
    n = [float(x) for x in ns(t)]
    if len(n)>=2:
        a,b = n[0],n[1]
        ra,rb = round(1/a,4),round(1/b,4)
        is_pipe = 'hole' in t.lower() or 'leak' in t.lower() or 'empty' in t.lower()
        if is_pipe:
            net=round(ra-rb,4) if ra>rb else round(rb-ra,4)
            tm=round(1/net,2) if net else 0
            s=[f"Fill rate = 1/{a} = {ra}/hr",f"Drain rate = 1/{b} = {rb}/hr",
               f"Net rate = {ra} - {rb} = {net}/hr",f"Time = 1÷{net} = {tm} hrs",f"∴ ({l}) {v}"]
            tr=[f"[Net rate = fill-drain]",f"1÷{net} = {tm} hrs","∴ "+v]
        else:
            net=round(ra+rb,4); tm=round(1/net,2)
            together=round(a*b/(a+b),2)
            s=[f"A alone={a} days → rate 1/{a}={ra}/day",f"B alone={b} days → rate 1/{b}={rb}/day",
               f"Together rate={ra}+{rb}={net}/day",f"Time=1÷{net}={tm} days",f"∴ ({l}) {v}"]
            tr=[f"[Together=(A×B)÷(A+B)]",f"({a}×{b})÷({a}+{b})={together} days","∴ "+v]
    else:
        s=[f"Work rate = 1/days | Together = sum of rates",f"∴ ({l}) {v}"]
        tr=[f"[Together=(A×B)÷(A+B)]","∴ "+v]
    return s,tr

def speed(q, l, v):
    t = q['question']
    n = [float(x) for x in ns(t)]
    if 'train' in t.lower() and len(n)>=4:
        lens=[n[0],n[1]]; spds=[n[2],n[3]]
        total_len=lens[0]+lens[1]
        opp='towards' in t.lower() or 'opposite' in t.lower()
        rel_spd_kmh=spds[0]+spds[1] if opp else abs(spds[0]-spds[1])
        rel_spd_ms=round(rel_spd_kmh*5/18,4)
        time=round(total_len/rel_spd_ms,2) if rel_spd_ms else 0
        s=[f"Train X={lens[0]}m, Train Y={lens[1]}m → Total length={total_len}m",
           f"Speeds: {spds[0]}+{spds[1]}={rel_spd_kmh} km/h (opposite dir)",
           f"Convert: {rel_spd_kmh}×5/18={rel_spd_ms} m/s",
           f"Time = {total_len}÷{rel_spd_ms} = {time}s",f"∴ ({l}) {v}"]
        tr=[f"[T=Total Length÷Relative Speed(m/s)]",
            f"{total_len}÷{rel_spd_ms}={time}s","∴ "+v]
    elif len(n)>=2:
        d,t2=n[0],n[1]
        spd=round(d/t2,2)
        s=[f"Distance={d}, Time={t2}",f"Speed=Distance÷Time={d}÷{t2}={spd}",f"∴ ({l}) {v}"]
        tr=[f"[S=D/T, D=S×T, T=D/S]",f"{d}÷{t2}={spd}","∴ "+v]
    else:
        s=[f"D=S×T | S=D/T | T=D/S",f"∴ ({l}) {v}"]
        tr=[f"[D=S×T]","∴ "+v]
    return s,tr

def numsys(q, l, v):
    t = q['question']
    n = [float(x) for x in ns(t)]
    def isp(x):
        x=int(x)
        if x<2: return False
        for i in range(2,int(x**0.5)+1):
            if x%i==0: return False
        return True
    if 'prime' in t.lower() and len(n)>=2:
        lo,hi=int(n[0]),int(n[1])
        primes=[str(x) for x in range(lo,hi+1) if isp(x)]
        s=[f"Check numbers {lo} to {hi} for primality",f"Primes: {', '.join(primes) if primes else 'none'}",
           f"Count={len(primes)}",f"∴ ({l}) {v}"]
        tr=[f"[Primes {lo}-{hi}: {', '.join(primes) if primes else 'none'}]",
            f"Count={len(primes)}","∴ "+v]
    elif ('lcm' in t.lower() or 'hcf' in t.lower()) and len(n)>=2:
        a,b=int(n[0]),int(n[1])
        h=math.gcd(a,b); lc=a*b//h
        s=[f"Numbers: {a}, {b}",f"HCF = {h} (by Euclidean method)",
           f"LCM = {a}×{b}÷{h} = {lc}",f"Check: HCF×LCM={h}×{lc}={h*lc}={a}×{b} ✓",f"∴ ({l}) {v}"]
        tr=[f"[LCM×HCF=a×b → LCM={a}×{b}÷{h}={lc}]","∴ "+v]
    elif 'sum' in t.lower() and 'difference' in t.lower() and len(n)>=2:
        sm,df=n[0],n[1]; x=(sm+df)/2; y=(sm-df)/2
        prod=round(x*y,2)
        s=[f"Sum={sm}, Difference={df}",f"Larger = (Sum+Diff)/2 = ({sm}+{df})/2 = {x}",
           f"Smaller = (Sum-Diff)/2 = ({sm}-{df})/2 = {y}",f"Product = {x}×{y} = {prod}",f"∴ ({l}) {v}"]
        tr=[f"[A=(S+D)/2, B=(S-D)/2, A×B=?]",f"{x}×{y}={prod}","∴ "+v]
    else:
        s=[f"Values: {', '.join(str(int(x)) for x in n[:5])}",
           f"Apply divisibility/prime/HCF-LCM rule",f"∴ ({l}) {v}"]
        tr=[f"[Check divisibility, HCF/LCM, prime]","∴ "+v]
    return s,tr

def ratio(q, l, v):
    t = q['question']
    n = [float(x) for x in ns(t)]
    s=[f"Given values/ratios: {', '.join(str(x) for x in n[:6])}",
       f"Ratio property: a:b = c:d → a×d = b×c",f"Apply to find unknown",f"∴ ({l}) {v}"]
    tr=[f"[a:b::c:d → ad=bc]",f"Values: {', '.join(str(x) for x in n[:4])}","∴ "+v]
    return s,tr

def geometry(q, l, v):
    t = q['question']
    n = [float(x) for x in ns(t)]
    if 'angle' in t.lower() and len(n)>=2:
        known=n[:2]; sm=sum(known)
        third=round(180-sm,2)
        s=[f"Known angles: {', '.join(str(x) for x in known)}°",
           f"Angle sum in triangle = 180°",f"Third angle = 180 - {sm} = {third}°",f"∴ ({l}) {v}"]
        tr=[f"[∠A+∠B+∠C=180°]",f"180-{sm}={third}°","∴ "+v]
    elif len(n)>=2:
        s=[f"Given: {', '.join(str(x) for x in n[:4])}",
           f"Apply geometry theorem/formula",f"∴ ({l}) {v}"]
        tr=[f"[Key theorem for this shape]","∴ "+v]
    else:
        s=[f"Apply relevant geometry formula",f"∴ ({l}) {v}"]
        tr=[f"[Geometry formula]","∴ "+v]
    return s,tr

def trig(q, l, v):
    t = q['question']
    VALS={'sin30':0.5,'cos30':round(3**0.5/2,4),'tan30':round(1/3**0.5,4),
          'sin45':round(2**0.5/2,4),'cos45':round(2**0.5/2,4),'tan45':1,
          'sin60':round(3**0.5/2,4),'cos60':0.5,'tan60':round(3**0.5,4),
          'sin90':1,'cos90':0,'tan90':'∞','cot45':1,'sec30':round(2/3**0.5,4),
          'cosec30':2,'sin0':0,'cos0':1}
    found=[]
    for k,val in VALS.items():
        if k[:3] in t.lower() and k[3:] in t:
            found.append(f"{k}={val}")
    n=[float(x) for x in re.findall(r'\d+',t)]
    s=[f"Standard values: {', '.join(found) if found else 'sin²θ+cos²θ=1'}",
       f"Substitute and simplify",f"∴ ({l}) {v}"]
    tr=[f"[sin30=1/2, cos60=1/2, tan45=1, sin²+cos²=1]","∴ "+v]
    return s,tr

def mensuration(q, l, v):
    t = q['question']
    n = [float(x) for x in ns(t)]
    if 'square' in t.lower() and 'perimeter' in t.lower() and n:
        p=n[0]; side=round(p/4,2)
        s=[f"Perimeter of square = 4 × side",f"{p} = 4 × side",f"Side = {p}÷4 = {side}m",f"∴ ({l}) {v}"]
        tr=[f"[Side=Perimeter÷4]",f"{p}÷4={side}","∴ "+v]
    elif 'cube' in t.lower() and n:
        e=n[0]; vol=round(e**3,2)
        s=[f"Edge = {e}m",f"Volume = edge³ = {e}³ = {vol} m³",f"∴ ({l}) {v}"]
        tr=[f"[V=a³]",f"{e}³={vol}","∴ "+v]
    elif 'circle' in t.lower() and n:
        r=n[0]; area=round(3.14159*r*r,2); circ=round(2*3.14159*r,2)
        s=[f"Radius r={r}",f"Area=πr²=3.14159×{r}²={area}",f"Circumference=2πr=2×3.14159×{r}={circ}",f"∴ ({l}) {v}"]
        tr=[f"[Area=πr², Circ=2πr]",f"r={r}→Area={area}","∴ "+v]
    elif 'rectangle' in t.lower() and len(n)>=2:
        l2,b=n[0],n[1]; area=round(l2*b,2)
        s=[f"Length={l2}, Breadth={b}",f"Area=L×B={l2}×{b}={area}",
           f"Perimeter=2(L+B)=2({l2}+{b})={2*(l2+b)}",f"∴ ({l}) {v}"]
        tr=[f"[A=L×B, P=2(L+B)]",f"{l2}×{b}={area}","∴ "+v]
    else:
        s=[f"Values: {', '.join(str(x) for x in n[:4])}",f"Apply shape formula",f"∴ ({l}) {v}"]
        tr=[f"[Shape-specific formula]","∴ "+v]
    return s,tr

def si(q, l, v):
    t = q['question']
    n = [float(x) for x in ns(t)]
    if len(n)>=3:
        p,r,tm=n[0],n[1],n[2]
        si_val=round(p*r*tm/100,2)
        ci_val=round(p*((1+r/100)**tm)-p,2)
        if 'compound' in t.lower():
            s=[f"P=₹{p}, R={r}%, T={tm} yrs",f"CI=P×[(1+R/100)^T - 1]",
               f"=₹{p}×[(1+{r}/100)^{tm}-1]=₹{ci_val}",f"∴ ({l}) {v}"]
            tr=[f"[CI=P×(1+R/100)^T - P]",f"₹{p}×(1+{r}/100)^{tm}-{p}=₹{ci_val}","∴ "+v]
        else:
            s=[f"P=₹{p}, R={r}%, T={tm} yrs",f"SI=P×R×T÷100",
               f"=₹{p}×{r}×{tm}÷100=₹{si_val}",f"Amount=P+SI={p}+{si_val}=₹{round(p+si_val,2)}",f"∴ ({l}) {v}"]
            tr=[f"[SI=P×R×T÷100]",f"{p}×{r}×{tm}÷100=₹{si_val}","∴ "+v]
    else:
        s=[f"SI=P×R×T÷100 | CI=P(1+R/100)^T - P",f"∴ ({l}) {v}"]
        tr=[f"[SI=PRT/100]","∴ "+v]
    return s,tr

def stats(q, l, v):
    t = q['question']
    n = [float(x) for x in ns(t)]
    if 'mode' in t.lower() and len(n)>5:
        from collections import Counter
        cnt=Counter(int(x) for x in n)
        mode_v=cnt.most_common(1)[0][0]
        freq=cnt.most_common(1)[0][1]
        s=[f"Data: {', '.join(str(int(x)) for x in n[:10])}{'...' if len(n)>10 else ''}",
           f"Count each value's frequency",f"Mode = {mode_v} (appears {freq} times)",f"∴ ({l}) {v}"]
        tr=[f"[Mode = most frequent value]",f"{mode_v} appears {freq} times","∴ "+v]
    elif 'mean' in t.lower() and n:
        sm=sum(n); avg2=round(sm/len(n),2)
        s=[f"Values: {', '.join(str(x) for x in n[:8])}",f"Sum={sm}, Count={len(n)}",
           f"Mean={sm}/{len(n)}={avg2}",f"∴ ({l}) {v}"]
        tr=[f"[Mean=Sum÷Count]",f"{sm}÷{len(n)}={avg2}","∴ "+v]
    elif 'median' in t.lower() and n:
        srt=sorted(n); mid=len(srt)//2
        med=srt[mid] if len(srt)%2==1 else (srt[mid-1]+srt[mid])/2
        s=[f"Sorted data: {', '.join(str(x) for x in srt[:10])}",f"Middle value (n={len(srt)})",
           f"Median={med}",f"∴ ({l}) {v}"]
        tr=[f"[Median=middle value after sorting]",f"Median={med}","∴ "+v]
    else:
        s=[f"Data values: {', '.join(str(int(x)) for x in n[:8])}",
           f"Mean=Sum/n | Median=middle | Mode=most frequent",f"∴ ({l}) {v}"]
        tr=[f"[Mean=Sum/n, Mode=most freq]","∴ "+v]
    return s,tr

SOLVERS={
    'percentage':pct,'profit and loss':profit,'average':avg,'time and work':timework,
    'speed distance time':speed,'number system':numsys,'ratio and proportion':ratio,
    'geometry':geometry,'trigonometry':trig,'mensuration':mensuration,
    'simple interest':si,'statistics and data interpretation':stats,
    'mixture and alligation':ratio,'algebra':ratio,
}

def get_solver(topic):
    tl=(topic or '').lower()
    if tl in SOLVERS: return SOLVERS[tl]
    for k,fn in SOLVERS.items():
        if k in tl or tl in k: return fn
    return None

print("Loading...")
with open(SRC) as f: data=json.load(f)
shutil.copy(SRC,f"pyqs_backup_v2_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
upd=0; skip=0
for q in data:
    if 'math' not in q.get('subject','').lower(): continue
    fn=get_solver(q.get('topic',''))
    if not fn: skip+=1; continue
    try:
        opts=q.get('options',[]); ci=q.get('correctAnswer',0)
        l,v=letter(ci,opts)
        s,tr=fn(q,l,v)
        q['solution']=build(l,v,s,tr)
        upd+=1
    except Exception as e:
        skip+=1
print(f"Updated:{upd} Skipped:{skip}")
with open(SRC,'w',encoding='utf-8') as f: json.dump(data,f,ensure_ascii=False,indent=2)
print("Done!")
