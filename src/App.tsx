import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import localforage from 'localforage';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { syncOnLogin, onSyncStatusChange, type SyncStatus } from './lib/performanceEngine';
import pyqsData from './data/pyqs.json';

// ── Lazy-loaded tab components (code-split: loads only what's needed) ──────────
const Dashboard         = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const PracticeEngine    = lazy(() => import('./components/PracticeEngine').then(m => ({ default: m.PracticeEngine })));
const MockTests         = lazy(() => import('./components/MockTests').then(m => ({ default: m.MockTests })));
const AnalyticsEngine   = lazy(() => import('./components/AnalyticsEngine').then(m => ({ default: m.AnalyticsEngine })));
const PerformanceTracker= lazy(() => import('./components/PerformanceTracker'));
const LoginScreen       = lazy(() => import('./components/LoginScreen').then(m => ({ default: m.LoginScreen })));
const StudyRoadmap      = lazy(() => import('./components/StudyRoadmap').then(m => ({ default: m.StudyRoadmap })));
const ExamPlanner       = lazy(() => import('./components/ExamPlanner').then(m => ({ default: m.ExamPlanner })));

// ── Tiny tab fallback spinner ──────────────────────────────────────────────────
function TabSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

interface UserProfile {
  name: string;
  email: string;
  avatar: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');

  // PWA install
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const installDismissed = useRef(false);

  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('rrb_user');
    if (saved) try { return JSON.parse(saved); } catch { return null; }
    return null;
  });

  // Initialize offline storage
  useEffect(() => {
    localforage.config({ name: 'RRB_D_Mastery_Pro', storeName: 'pyqs_data' });
    localforage.setItem('cached_pyqs', pyqsData).catch(console.error);
  }, []);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  // Subscribe to sync status changes
  useEffect(() => {
    const unsub = onSyncStatusChange(s => {
      setSyncStatus(s);
      if (s === 'success' || s === 'error' || s === 'offline') {
        setTimeout(() => setSyncStatus('idle'), 3000);
      }
    });
    return unsub;
  }, []);

  // PWA install prompt listener
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      if (!installDismissed.current && !localStorage.getItem('pwa_install_dismissed')) {
        setShowInstallBanner(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
      setInstallPrompt(null);
    }
  };

  const dismissInstall = () => {
    setShowInstallBanner(false);
    installDismissed.current = true;
    localStorage.setItem('pwa_install_dismissed', '1');
  };

  // On app load: if user is already saved, sync their cloud data immediately
  useEffect(() => {
    if (user?.email) syncOnLogin(user.email);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogin = async (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem('rrb_user', JSON.stringify(profile));
    syncOnLogin(profile.email);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('rrb_user');
  };

  if (!user) return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <LoginScreen onLogin={handleLogin} />
    </Suspense>
  );

  return (
    <div className="min-h-screen bg-surface text-on-surface font-sans antialiased flex transition-colors duration-300">

      {/* ── Cloud Sync Banner ─────────────────────────────── */}
      {syncStatus !== 'idle' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          background:
            syncStatus === 'success' ? 'linear-gradient(90deg,#166534,#16a34a)' :
            syncStatus === 'error'   ? 'linear-gradient(90deg,#7f1d1d,#dc2626)' :
            syncStatus === 'offline' ? 'linear-gradient(90deg,#374151,#6b7280)' :
                                       'linear-gradient(90deg,#1a365d,#2563eb)',
          color: 'white', fontSize: '12px', fontWeight: 600,
          textAlign: 'center', padding: '6px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          transition: 'background 0.3s',
        }}>
          {syncStatus === 'syncing' && (
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#60a5fa', animation: 'pulse 1s infinite' }} />
          )}
          {syncStatus === 'syncing' && '☁️ Syncing your performance across all devices…'}
          {syncStatus === 'success' && '✅ Cloud sync complete — data saved across all devices!'}
          {syncStatus === 'error'   && '⚠️ Sync failed — working offline. Your progress is saved locally.'}
          {syncStatus === 'offline' && '📴 You are offline — working locally. Will sync when reconnected.'}
        </div>
      )}

      {/* ── PWA Install Banner ────────────────────────────── */}
      {showInstallBanner && (
        <div style={{
          position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9998, maxWidth: 420, width: 'calc(100% - 32px)',
          background: 'linear-gradient(135deg,#1e3a5f,#1e40af)',
          borderRadius: 18, padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 8px 40px rgba(0,0,0,0.40)',
          border: '1px solid rgba(255,255,255,0.15)',
          backdropFilter: 'blur(12px)',
        }}>
          <img
            src="/icon-192.png"
            alt="App icon"
            style={{ width: 46, height: 46, borderRadius: 12, flexShrink: 0, objectFit: 'cover' }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 13, margin: 0 }}>
              📲 Install RRB Group D App
            </p>
            <p style={{ color: '#93c5fd', fontSize: 11, margin: '3px 0 0' }}>
              Works offline · No Play Store needed
            </p>
          </div>
          <button
            onClick={handleInstall}
            style={{
              background: '#f59e0b', color: '#1a1a1a', fontWeight: 800,
              fontSize: 12, border: 'none', borderRadius: 9,
              padding: '9px 14px', cursor: 'pointer', flexShrink: 0,
              boxShadow: '0 2px 8px rgba(245,158,11,0.4)',
            }}
          >
            Install
          </button>
          <button
            onClick={dismissInstall}
            style={{
              background: 'transparent', color: 'rgba(255,255,255,0.45)',
              border: 'none', cursor: 'pointer', fontSize: 20, lineHeight: 1,
              padding: '2px 4px', flexShrink: 0,
            }}
          >×</button>
        </div>
      )}

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} user={user} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col w-full lg:ml-64">
        <TopNav activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} user={user} />
        <main className="pt-20 px-4 lg:px-8 pb-12 min-h-screen w-full overflow-x-hidden">
          <Suspense fallback={<TabSpinner />}>
            {activeTab === 'dashboard'   && <Dashboard userName={user.name} />}
            {activeTab === 'practice'    && <PracticeEngine />}
            {activeTab === 'papers'      && <MockTests />}
            {activeTab === 'analytics'  && <AnalyticsEngine />}
            {activeTab === 'performance' && <PerformanceTracker onNavigateTo={setActiveTab} />}
            {activeTab === 'roadmap'     && <StudyRoadmap />}
            {activeTab === 'planner'     && <ExamPlanner />}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
