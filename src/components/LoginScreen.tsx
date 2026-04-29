import React, { useEffect, useState } from 'react';

interface LoginScreenProps {
  onLogin: (profile: { name: string; email: string; avatar: string }) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [phase, setPhase] = useState<'splash' | 'ready'>('splash');
  const [progress, setProgress] = useState(0);
  const [entered, setEntered] = useState(false);

  // Auto-progress bar then auto-enter
  useEffect(() => {
    const start = Date.now();
    const duration = 2400; // ms before auto-enter
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(tick);
        setPhase('ready');
        // auto-enter after short pause
        setTimeout(() => doEnter(), 400);
      }
    }, 16);
    return () => clearInterval(tick);
  }, []);

  const doEnter = () => {
    if (entered) return;
    setEntered(true);
    onLogin({
      name: 'Student',
      email: 'student@rrb',
      avatar: `https://ui-avatars.com/api/?name=S&background=6366f1&color=fff`,
    });
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'linear-gradient(160deg, #0a0a1a 0%, #0f172a 30%, #1e1b4b 60%, #0f172a 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');

        @keyframes floatUp   { from { opacity:0; transform:translateY(30px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeIn    { from { opacity:0 } to { opacity:1 } }
        @keyframes pulse2    { 0%,100% { transform:scale(1) } 50% { transform:scale(1.06) } }
        @keyframes rotate360 { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
        @keyframes shimmer   { 0% { transform:translateX(-100%) } 100% { transform:translateX(200%) } }
        @keyframes orbFloat  { 0%,100%{ transform:translate(0,0) } 33%{ transform:translate(20px,-30px) } 66%{ transform:translate(-20px,20px) } }
        @keyframes ringPulse { 0%,100%{ opacity:.15; transform:scale(1) } 50%{ opacity:.3; transform:scale(1.08) } }
        @keyframes badgePop  { 0%{ opacity:0; transform:scale(.7) } 60%{ transform:scale(1.1) } 100%{ opacity:1; transform:scale(1) } }
        @keyframes tapBounce { 0%,100%{ transform:translateY(0) } 30%{ transform:translateY(-6px) } }

        .splash-logo   { animation: floatUp .7s cubic-bezier(.34,1.56,.64,1) .1s both }
        .splash-title  { animation: floatUp .7s cubic-bezier(.34,1.56,.64,1) .25s both }
        .splash-sub    { animation: floatUp .7s cubic-bezier(.34,1.56,.64,1) .35s both }
        .splash-stats  { animation: floatUp .6s cubic-bezier(.34,1.56,.64,1) .5s both }
        .splash-btn    { animation: floatUp .7s cubic-bezier(.34,1.56,.64,1) .6s both }
        .splash-foot   { animation: fadeIn  .6s ease .9s both }
        .logo-pulse    { animation: pulse2 2.4s ease-in-out infinite }
        .orb1          { animation: orbFloat 8s ease-in-out infinite }
        .orb2          { animation: orbFloat 10s ease-in-out 2s infinite reverse }
        .orb3          { animation: orbFloat 7s ease-in-out 4s infinite }
        .ring1         { animation: ringPulse 3s ease-in-out infinite }
        .ring2         { animation: ringPulse 3s ease-in-out 1.5s infinite }
      `}</style>

      {/* ── Background glow orbs ──────────────────────────── */}
      <div className="orb1" style={{ position:'absolute', top:'10%', left:'15%', width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,.25), transparent 70%)', pointerEvents:'none' }} />
      <div className="orb2" style={{ position:'absolute', bottom:'15%', right:'10%', width:240, height:240, borderRadius:'50%', background:'radial-gradient(circle, rgba(139,92,246,.20), transparent 70%)', pointerEvents:'none' }} />
      <div className="orb3" style={{ position:'absolute', top:'55%', left:'55%', width:160, height:160, borderRadius:'50%', background:'radial-gradient(circle, rgba(251,191,36,.12), transparent 70%)', pointerEvents:'none' }} />

      {/* ── Ring decorations ─────────────────────────────── */}
      <div className="ring1" style={{ position:'absolute', top:'50%', left:'50%', width:500, height:500, marginLeft:-250, marginTop:-250, borderRadius:'50%', border:'1px solid rgba(99,102,241,.15)', pointerEvents:'none' }} />
      <div className="ring2" style={{ position:'absolute', top:'50%', left:'50%', width:700, height:700, marginLeft:-350, marginTop:-350, borderRadius:'50%', border:'1px solid rgba(139,92,246,.08)', pointerEvents:'none' }} />

      <div style={{ position:'relative', zIndex:10, width:'100%', maxWidth:390, textAlign:'center' }}>

        {/* ── Logo ─────────────────────────────────────────── */}
        <div className="splash-logo" style={{ marginBottom:28 }}>
          <div className="logo-pulse" style={{ width:88, height:88, margin:'0 auto 18px', borderRadius:24, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 0 12px rgba(99,102,241,.12), 0 0 0 24px rgba(99,102,241,.06), 0 20px 60px rgba(99,102,241,.4)' }}>
            <span style={{ fontSize:40 }}>📚</span>
          </div>

          {/* Badge */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(99,102,241,.15)', border:'1px solid rgba(99,102,241,.3)', borderRadius:999, padding:'4px 14px', marginBottom:10, animation:'badgePop .5s cubic-bezier(.34,1.56,.64,1) .4s both' }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#34d399', boxShadow:'0 0 6px #34d399' }} />
            <span style={{ color:'#a5b4fc', fontSize:11, fontWeight:700, letterSpacing:1 }}>RRB GROUP D 2025</span>
          </div>
        </div>

        {/* ── Title ────────────────────────────────────────── */}
        <div className="splash-title" style={{ marginBottom:10 }}>
          <h1 style={{ color:'#fff', fontSize:36, fontWeight:900, letterSpacing:-.5, margin:0, lineHeight:1.1 }}>
            Master the{' '}
            <span style={{ background:'linear-gradient(90deg,#818cf8,#c084fc)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              Exam
            </span>
          </h1>
        </div>

        {/* ── Subtitle ─────────────────────────────────────── */}
        <div className="splash-sub" style={{ marginBottom:36 }}>
          <p style={{ color:'rgba(165,180,252,.7)', fontSize:14, lineHeight:1.6, margin:0 }}>
            5,699 PYQs • Step-by-step solutions<br/>AI shortcuts • Ebbinghaus revision
          </p>
        </div>

        {/* ── 3 stat chips ─────────────────────────────────── */}
        <div className="splash-stats" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:36 }}>
          {[
            { icon:'📐', label:'Maths', val:'1,230' },
            { icon:'🧩', label:'Reasoning', val:'1,685' },
            { icon:'🔬', label:'Science', val:'1,499' },
          ].map(s => (
            <div key={s.label} style={{ background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)', borderRadius:16, padding:'12px 8px', backdropFilter:'blur(12px)' }}>
              <div style={{ fontSize:22, marginBottom:4 }}>{s.icon}</div>
              <div style={{ color:'#fff', fontWeight:800, fontSize:16 }}>{s.val}</div>
              <div style={{ color:'rgba(165,180,252,.6)', fontSize:10, fontWeight:600, letterSpacing:.5 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Progress bar + CTA ───────────────────────────── */}
        <div className="splash-btn" style={{ marginBottom:20 }}>
          {/* Progress bar */}
          <div style={{ height:3, background:'rgba(255,255,255,.08)', borderRadius:99, overflow:'hidden', marginBottom:14, position:'relative' }}>
            <div style={{ height:'100%', borderRadius:99, background:'linear-gradient(90deg,#6366f1,#8b5cf6,#c084fc)', width:`${progress}%`, transition:'width .05s linear', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent)', animation:'shimmer 1.2s ease-in-out infinite' }} />
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={doEnter}
            style={{
              width:'100%', padding:'17px 24px', borderRadius:18,
              background: phase === 'ready'
                ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                : 'linear-gradient(135deg,rgba(99,102,241,.5),rgba(139,92,246,.5))',
              border:'none', color:'#fff', fontSize:17, fontWeight:800,
              letterSpacing:.3, cursor:'pointer',
              boxShadow: phase === 'ready' ? '0 8px 32px rgba(99,102,241,.5), 0 0 0 1px rgba(255,255,255,.1)' : 'none',
              transition:'all .3s ease',
              display:'flex', alignItems:'center', justifyContent:'center', gap:10,
              animation: phase === 'ready' ? 'tapBounce 1.2s ease-in-out infinite' : 'none',
            }}
          >
            {phase === 'ready' ? (
              <>
                <span>🚀</span>
                <span>Start Preparing Now</span>
                <span style={{ fontSize:20 }}>→</span>
              </>
            ) : (
              <>
                <div style={{ width:18, height:18, border:'2px solid rgba(255,255,255,.4)', borderTop:'2px solid #fff', borderRadius:'50%', animation:'rotate360 .8s linear infinite' }} />
                <span style={{ color:'rgba(255,255,255,.6)', fontSize:14 }}>Loading your study engine...</span>
              </>
            )}
          </button>
        </div>

        {/* ── Feature pills ────────────────────────────────── */}
        <div className="splash-foot" style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:8 }}>
          {['✅ 100% Free', '📴 Works Offline', '🧠 AI Solutions', '🎯 Real PYQs', '📈 Track Progress'].map(f => (
            <span key={f} style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.08)', borderRadius:99, padding:'5px 12px', color:'rgba(165,180,252,.7)', fontSize:11, fontWeight:600 }}>
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
