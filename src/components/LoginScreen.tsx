import React, { useEffect, useState } from 'react';

interface LoginScreenProps {
  onLogin: (profile: { name: string; email: string; avatar: string }) => void;
}

declare global {
  interface Window { google: any; }
}

const CLIENT_ID =
  (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
  '323884124313-at8muqdl5varliqhndj5cn914i19j6no.apps.googleusercontent.com';

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initGoogle = () => {
      if (!window.google || !CLIENT_ID) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      window.google.accounts.id.renderButton(
        document.getElementById('google-btn-container'),
        { theme: 'outline', size: 'large', width: 340, text: 'continue_with', shape: 'rectangular' }
      );
    };

    if (window.google) {
      initGoogle();
    } else {
      const interval = setInterval(() => {
        if (window.google) { clearInterval(interval); initGoogle(); }
      }, 200);
      return () => clearInterval(interval);
    }
  }, []);

  const handleCredentialResponse = (response: any) => {
    setLoading(true);
    setError('');
    try {
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      onLogin({
        name: payload.name || payload.email.split('@')[0],
        email: payload.email,
        avatar:
          payload.picture ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.name || 'User')}&background=6366f1&color=fff`,
      });
    } catch (err) {
      setError('Login failed. Please try again.');
      setLoading(false);
      console.error('Failed to decode Google token:', err);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg,#060614 0%,#0f0f2e 35%,#1a1040 65%,#0f172a 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'relative', overflow: 'hidden',
      fontFamily: "'Inter',-apple-system,sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes floatUp  { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes orbDrift { 0%,100%{transform:translate(0,0)} 33%{transform:translate(18px,-22px)} 66%{transform:translate(-14px,18px)} }
        @keyframes pulse3   { 0%,100%{transform:scale(1);box-shadow:0 0 0 0 rgba(99,102,241,.5)} 50%{transform:scale(1.04);box-shadow:0 0 0 16px rgba(99,102,241,.0)} }
        @keyframes badgePop { 0%{opacity:0;transform:scale(.6)} 70%{transform:scale(1.1)} 100%{opacity:1;transform:scale(1)} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes shimmer  { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        .la1{animation:floatUp .65s cubic-bezier(.34,1.56,.64,1) .05s both}
        .la2{animation:floatUp .65s cubic-bezier(.34,1.56,.64,1) .18s both}
        .la3{animation:floatUp .65s cubic-bezier(.34,1.56,.64,1) .30s both}
        .la4{animation:floatUp .65s cubic-bezier(.34,1.56,.64,1) .42s both}
        .la5{animation:floatUp .65s cubic-bezier(.34,1.56,.64,1) .54s both}
        .lorb{animation:orbDrift 9s ease-in-out infinite}
        .lorb2{animation:orbDrift 11s ease-in-out 3s infinite reverse}
        .logo-pulse{animation:pulse3 2.8s ease-in-out infinite}
        .lbadge{animation:badgePop .55s cubic-bezier(.34,1.56,.64,1) .5s both}
        /* Override Google button container look */
        #google-btn-container iframe { border-radius: 12px !important; }
      `}</style>

      {/* Orbs */}
      <div className="lorb" style={{ position: 'absolute', top: '8%', left: '12%', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,.22),transparent 70%)', pointerEvents: 'none' }} />
      <div className="lorb2" style={{ position: 'absolute', bottom: '12%', right: '10%', width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,92,246,.18),transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', width: 600, height: 600, marginLeft: -300, marginTop: -300, borderRadius: '50%', border: '1px solid rgba(99,102,241,.1)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 420, textAlign: 'center' }}>

        {/* Logo */}
        <div className="la1" style={{ marginBottom: 24 }}>
          <div className="logo-pulse" style={{ width: 82, height: 82, margin: '0 auto 14px', borderRadius: 22, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, boxShadow: '0 0 0 10px rgba(99,102,241,.12),0 0 0 20px rgba(99,102,241,.06),0 20px 50px rgba(99,102,241,.4)' }}>
            📚
          </div>
          <div className="lbadge" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(99,102,241,.15)', border: '1px solid rgba(99,102,241,.3)', borderRadius: 99, padding: '4px 14px' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399' }} />
            <span style={{ color: '#a5b4fc', fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>RRB GROUP D MASTERY</span>
          </div>
        </div>

        {/* Title */}
        <div className="la2" style={{ marginBottom: 6 }}>
          <h1 style={{ color: '#fff', fontSize: 30, fontWeight: 900, letterSpacing: -.5, margin: 0, lineHeight: 1.15 }}>
            Welcome to{' '}
            <span style={{ background: 'linear-gradient(90deg,#818cf8,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              RRB Group D
            </span>
          </h1>
        </div>
        <div className="la3" style={{ marginBottom: 32 }}>
          <p style={{ color: 'rgba(165,180,252,.6)', fontSize: 13, margin: 0 }}>5,699 PYQs · Real solutions · Track progress</p>
        </div>

        {/* Card */}
        <div className="la4" style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 24, padding: '32px 28px', backdropFilter: 'blur(20px)', boxShadow: '0 24px 60px rgba(0,0,0,.4)', marginBottom: 20 }}>

          <p style={{ color: 'rgba(165,180,252,.8)', fontSize: 14, fontWeight: 600, marginBottom: 8, textAlign: 'center' }}>
            Sign in to sync progress across all devices
          </p>
          <p style={{ color: 'rgba(165,180,252,.45)', fontSize: 12, marginBottom: 28, textAlign: 'center' }}>
            ☁️ Your data is saved to the cloud automatically
          </p>

          {error && (
            <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.3)', borderRadius: 12, color: '#fca5a5', fontSize: 13, textAlign: 'center' }}>
              {error}
            </div>
          )}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '16px', color: '#a5b4fc', fontSize: 14, fontWeight: 600 }}>
              <div style={{ width: 18, height: 18, border: '2.5px solid rgba(165,180,252,.3)', borderTop: '2.5px solid #a5b4fc', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
              Signing you in…
            </div>
          )}

          {/* Google Sign-In button rendered by GIS SDK */}
          {!loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              {/* Google button wrapper with subtle glow */}
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', inset: -2, borderRadius: 14, background: 'linear-gradient(135deg,rgba(99,102,241,.4),rgba(139,92,246,.4))', filter: 'blur(8px)', opacity: 0.7, zIndex: 0 }} />
                <div id="google-btn-container" style={{ position: 'relative', zIndex: 1, borderRadius: 12, overflow: 'hidden' }} />
              </div>

              <p style={{ color: 'rgba(165,180,252,.35)', fontSize: 11, margin: 0 }}>
                🔒 Secured by Google · No password needed
              </p>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="la5" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          {[
            { v: '5,699', l: 'Total PYQs' },
            { v: '4 Subjects', l: 'Full Syllabus' },
            { v: '60+ Topics', l: 'Classified' },
          ].map(s => (
            <div key={s.l} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '10px 8px' }}>
              <p style={{ color: '#c7d2fe', fontWeight: 800, fontSize: 13, margin: '0 0 2px' }}>{s.v}</p>
              <p style={{ color: 'rgba(165,180,252,.5)', fontSize: 10, margin: 0 }}>{s.l}</p>
            </div>
          ))}
        </div>

        {/* Footer badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
          {['📴 Works Offline', '🆓 100% Free', '🧠 AI Solutions', '🔒 Private'].map(f => (
            <span key={f} style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 99, padding: '4px 10px', color: 'rgba(165,180,252,.55)', fontSize: 11, fontWeight: 600 }}>
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
