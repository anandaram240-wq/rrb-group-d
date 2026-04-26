import React, { useState, useEffect, useRef, lazy, Suspense, Component, ErrorInfo, ReactNode } from 'react';
import localforage from 'localforage';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { syncOnLogin, onSyncStatusChange, forceSyncNow, clearOtherUserData, clearCurrentUserData, type SyncStatus } from './lib/performanceEngine';
import { syncPlannerOnLogin, forceSyncPlanner } from './lib/plannerSync';
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
const WeakAreas         = lazy(() => import('./components/WeakAreas').then(m => ({ default: m.WeakAreas })));
const AdminPanel        = lazy(() => import('./components/AdminPanel').then(m => ({ default: m.AdminPanel })));

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

// ── URL <-> Tab route map ─────────────────────────────────────────────────────
const PATH_TO_TAB: Record<string, string> = {
  '/': 'dashboard', '/dashboard': 'dashboard',
  '/practice': 'practice', '/papers': 'papers',
  '/analytics': 'analytics', '/performance': 'performance',
  '/roadmap': 'roadmap', '/planner': 'planner', '/weakareas': 'weakareas',
  '/admin': 'admin',
};
const TAB_TO_PATH: Record<string, string> = {
  dashboard: '/dashboard', practice: '/practice',
  papers: '/papers', analytics: '/analytics', performance: '/performance',
  roadmap: '/roadmap', planner: '/planner', weakareas: '/weakareas',
  admin: '/admin',
};
function getInitialTab(): string {
  const p = window.location.pathname;
  return PATH_TO_TAB[p] ?? 'dashboard';
}

// ── Error Boundary for safe tab rendering ────────────────────────────────────
class TabErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: '' }; }
  static getDerivedStateFromError(err: Error) { return { hasError: true, error: err.message }; }
  componentDidCatch(err: Error, info: ErrorInfo) { console.error('Tab crash:', err, info); }
  render() {
    if (this.state.hasError) return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center p-8">
        <div className="text-5xl">⚠️</div>
        <h2 className="text-xl font-black text-primary">Something went wrong</h2>
        <p className="text-sm text-on-surface-variant max-w-sm">{this.state.error}</p>
        <button onClick={() => { this.setState({ hasError: false, error: '' }); window.location.href = '/dashboard'; }}
          className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm">
          Go to Dashboard
        </button>
      </div>
    );
    return this.props.children;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  // For deep-linking from Study Modules → Practice Engine
  const [practiceFilter, setPracticeFilter] = useState<{ subject: string; topic: string } | null>(null);

  // Confusion flag count (badge on Weak Areas sidebar item)
  const [flagCount, setFlagCount] = useState(() => {
    try { return (JSON.parse(localStorage.getItem('rrb_confusion_flags') || '[]') as unknown[]).length; }
    catch { return 0; }
  });

  const refreshFlagCount = () => {
    try { setFlagCount((JSON.parse(localStorage.getItem('rrb_confusion_flags') || '[]') as unknown[]).length); }
    catch { setFlagCount(0); }
  };

  // Sync URL when tab changes
  const setActiveTabWithURL = (tab: string) => {
    setActiveTab(tab);
    const path = TAB_TO_PATH[tab] ?? '/dashboard';
    window.history.pushState({}, '', path);
  };

  // Handle browser back/forward
  useEffect(() => {
    const handler = () => {
      const tab = PATH_TO_TAB[window.location.pathname] ?? 'dashboard';
      setActiveTab(tab);
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  const navigateToPractice = (subject: string, topic: string) => {
    setPracticeFilter({ subject, topic });
    setActiveTabWithURL('practice');
  };

  // PWA install
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const installDismissed = useRef(false);

  // PWA update
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const waitingSWRef = useRef<ServiceWorker | null>(null);

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

  // PWA update detection
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready.then(reg => {
      // Check immediately if a SW is already waiting
      if (reg.waiting) {
        waitingSWRef.current = reg.waiting;
        setUpdateAvailable(true);
      }
      // Listen for future updates
      reg.addEventListener('updatefound', () => {
        const newSW = reg.installing;
        if (!newSW) return;
        newSW.addEventListener('statechange', () => {
          if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
            waitingSWRef.current = newSW;
            setUpdateAvailable(true);
          }
        });
      });
    });
    // When SW activates a new version, reload this page
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) { refreshing = true; window.location.reload(); }
    });
  }, []);

  const handleUpdate = () => {
    waitingSWRef.current?.postMessage({ type: 'SKIP_WAITING' });
  };


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

  // On app load: sync both performance + planner data
  useEffect(() => {
    if (user?.email) {
      syncOnLogin(user.email);
      syncPlannerOnLogin();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogin = async (profile: UserProfile) => {
    // 🔑 Clear any data belonging to a different user BEFORE setting current user
    clearOtherUserData(profile.email);
    setUser(profile);
    localStorage.setItem('rrb_user', JSON.stringify(profile));
    syncOnLogin(profile.email);
    syncPlannerOnLogin(); // ← pull planner data on login
  };

  const handleLogout = () => {
    // 🔑 Clear this user's namespaced local data on logout
    clearCurrentUserData();
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

      {/* ── 🆕 Update Available Banner ────────────────────────── */}
      {updateAvailable && (
        <div style={{
          position: 'fixed', bottom: showInstallBanner ? 100 : 20,
          left: '50%', transform: 'translateX(-50%)',
          zIndex: 9997, maxWidth: 400, width: 'calc(100% - 32px)',
          background: 'linear-gradient(135deg, #065f46, #059669)',
          borderRadius: 18, padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 8px 40px rgba(5,150,105,0.45), 0 0 0 1px rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.2)',
          backdropFilter: 'blur(12px)',
          animation: 'slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          {/* Pulse dot */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>🚀</div>
            <div style={{
              position: 'absolute', top: -3, right: -3,
              width: 10, height: 10, borderRadius: '50%',
              background: '#fbbf24',
              boxShadow: '0 0 0 0 rgba(251,191,36,0.4)',
              animation: 'pulseDot 1.5s infinite',
            }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: '#fff', fontWeight: 800, fontSize: 13, margin: 0 }}>
              New Version Available!
            </p>
            <p style={{ color: '#a7f3d0', fontSize: 11, margin: '3px 0 0' }}>
              Questions, fixes & improvements ready to install
            </p>
          </div>
          <button
            onClick={handleUpdate}
            style={{
              background: 'linear-gradient(135deg,#fbbf24,#f59e0b)',
              color: '#1a1a1a', fontWeight: 800,
              fontSize: 12, border: 'none', borderRadius: 10,
              padding: '9px 14px', cursor: 'pointer', flexShrink: 0,
              boxShadow: '0 2px 12px rgba(251,191,36,0.5)',
              whiteSpace: 'nowrap',
            }}
          >
            ⬆️ Update Now
          </button>
        </div>
      )}

      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTabWithURL(tab);
          if (tab === 'weakareas') refreshFlagCount();
        }}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        user={user}
        onLogout={handleLogout}
        installPrompt={installPrompt}
        flagCount={flagCount}
        onSyncNow={async () => {
          await Promise.all([forceSyncNow(), forceSyncPlanner()]);
        }}
      />
      <div className="flex-1 flex flex-col w-full lg:ml-64 min-w-0">
        <TopNav activeTab={activeTab} setActiveTab={setActiveTabWithURL} setSidebarOpen={setSidebarOpen} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} user={user} />
        <main className="pt-16 px-3 sm:px-4 lg:px-8 pb-12 w-full min-w-0 overflow-x-hidden">
          <div className="max-w-screen-xl mx-auto">
            <Suspense fallback={<TabSpinner />}>
              <TabErrorBoundary>
                {activeTab === 'dashboard'   && <Dashboard userName={user.name} onNavigateTo={setActiveTabWithURL} />}
                {activeTab === 'practice'    && <PracticeEngine initialSubject={practiceFilter?.subject} initialTopic={practiceFilter?.topic} />}
                {activeTab === 'papers'      && <MockTests />}
                {activeTab === 'analytics'  && <AnalyticsEngine />}
                {activeTab === 'performance' && <PerformanceTracker onNavigateTo={setActiveTabWithURL} />}
                {activeTab === 'roadmap'     && <StudyRoadmap />}
                {activeTab === 'planner'     && <ExamPlanner />}
                {activeTab === 'weakareas'   && <WeakAreas onPractice={(subject, topic) => { navigateToPractice(subject, topic); refreshFlagCount(); }} />}
                {activeTab === 'admin'       && <AdminPanel userEmail={user.email} />}
              </TabErrorBoundary>
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
