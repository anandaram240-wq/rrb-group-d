import React, { useState, useEffect } from 'react';
import localforage from 'localforage';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { Dashboard } from './components/Dashboard';
import { PracticeEngine } from './components/PracticeEngine';
import { MockTests } from './components/MockTests';
import { AnalyticsEngine } from './components/AnalyticsEngine';
import PerformanceTracker from './components/PerformanceTracker';
import { LoginScreen } from './components/LoginScreen';
import { StudyRoadmap } from './components/StudyRoadmap';
import { ExamPlanner } from './components/ExamPlanner';
import { syncOnLogin } from './lib/performanceEngine';
import pyqsData from './data/pyqs.json';

interface UserProfile {
  name: string;
  email: string;
  avatar: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [syncing, setSyncing] = useState(false);
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

  // On app load: if user is already saved, sync their cloud data immediately
  useEffect(() => {
    if (user?.email) {
      setSyncing(true);
      syncOnLogin(user.email).finally(() => setSyncing(false));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogin = async (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem('rrb_user', JSON.stringify(profile));
    // Pull cloud data immediately on login
    setSyncing(true);
    try {
      await syncOnLogin(profile.email);
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('rrb_user');
  };

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-surface text-on-surface font-sans antialiased flex transition-colors duration-300">
      {/* Cloud Sync Banner */}
      {syncing && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          background: 'linear-gradient(90deg, #1a365d, #2563eb)',
          color: 'white', fontSize: '12px', fontWeight: 600,
          textAlign: 'center', padding: '6px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}>
          <span style={{
            display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
            background: '#4ade80', animation: 'pulse 1s infinite',
          }} />
          ☁️ Syncing your performance across all devices…
        </div>
      )}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} user={user} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col w-full lg:ml-64">
        <TopNav activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} user={user} />
        <main className="pt-20 px-4 lg:px-8 pb-12 min-h-screen w-full overflow-x-hidden">
          {activeTab === 'dashboard' && <Dashboard userName={user.name} />}
          {activeTab === 'practice' && <PracticeEngine />}
          {activeTab === 'papers' && <MockTests />}
          {activeTab === 'analytics' && <AnalyticsEngine />}
          {activeTab === 'performance' && <PerformanceTracker onNavigateTo={setActiveTab} />}
          {activeTab === 'roadmap' && <StudyRoadmap />}
          {activeTab === 'planner' && <ExamPlanner />}
        </main>
      </div>
    </div>
  );
}
