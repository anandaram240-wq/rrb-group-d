import React, { useEffect, useState } from 'react';
import { BookOpen, LogIn } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (profile: { name: string; email: string; avatar: string }) => void;
}

declare global {
  interface Window { google: any; }
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [error, setError] = useState('');
  const [clientId] = useState(import.meta.env.VITE_GOOGLE_CLIENT_ID || '323884124313-at8muqdl5varliqhndj5cn914i19j6no.apps.googleusercontent.com');

  useEffect(() => {
    // Wait for Google Identity Services to load
    const initGoogle = () => {
      if (window.google && clientId) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Render the official Google Sign-In button
        window.google.accounts.id.renderButton(
          document.getElementById('google-btn-container'),
          {
            theme: 'outline',
            size: 'large',
            width: 360,
            text: 'continue_with',
            shape: 'rectangular',
          }
        );
      }
    };

    // Poll until GIS script is ready
    if (window.google) {
      initGoogle();
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval);
          initGoogle();
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [clientId]);

  const handleCredentialResponse = (response: any) => {
    try {
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      onLogin({
        name: payload.name || payload.email.split('@')[0],
        email: payload.email,
        avatar: payload.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.name || 'User')}&background=1a365d&color=fff`,
      });
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error('Failed to decode Google token:', err);
    }
  };

  // For local dev without Google Client ID
  const handleGuestLogin = () => {
    onLogin({
      name: 'Student',
      email: 'student@local',
      avatar: 'https://ui-avatars.com/api/?name=Student&background=1a365d&color=fff',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-600/30">
            <BookOpen size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">RRB Group D</h1>
          <p className="text-blue-300/80 text-sm">Exam Preparation Engine</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-2 text-center">Welcome</h2>
          <p className="text-blue-200/70 text-sm text-center mb-8">
            Sign in to track your progress across 4,295+ PYQs
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm text-center">
              {error}
            </div>
          )}

          {/* Google Sign-In Button — rendered by GIS SDK */}
          {clientId ? (
            <div className="flex justify-center">
              <div id="google-btn-container" />
            </div>
          ) : (
            /* No Client ID — show Guest login for local testing */
            <div className="space-y-3">
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-300 text-xs text-center">
                ⚠️ Google Sign-In not configured.<br/>
                Add <code className="bg-white/10 px-1 rounded">VITE_GOOGLE_CLIENT_ID</code> to your <code className="bg-white/10 px-1 rounded">.env</code> file.
              </div>
              <button
                onClick={handleGuestLogin}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-blue-500 transition-all shadow-md active:scale-[0.98]"
              >
                <LogIn size={18} />
                Continue as Guest (Testing)
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-blue-200/50 text-xs">
              ☁️ Progress syncs across all your devices automatically
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          {[
            { label: '4,295+ PYQs', desc: 'Real Questions' },
            { label: '60+ Topics', desc: 'All Subjects' },
            { label: 'CBT Mode', desc: 'Exam Pattern' },
          ].map(f => (
            <div key={f.label} className="text-center p-3 bg-white/5 rounded-xl border border-white/5">
              <p className="text-white font-bold text-sm">{f.label}</p>
              <p className="text-blue-300/60 text-[10px] mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
