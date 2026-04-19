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
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('rrb_user');
    if (saved) try { return JSON.parse(saved); } catch { return null; }
    return null;
  });

  // Initialize offline storage
  useEffect(() => {
    localforage.config({
      name: 'RRB_D_Mastery_Pro',
      storeName: 'pyqs_data'
    });
    
    localforage.setItem('cached_pyqs', pyqsData).then(() => {
      console.log('PYQs cached for offline use');
    }).catch((err) => {
      console.error('Error caching PYQs:', err);
    });
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleLogin = (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem('rrb_user', JSON.stringify(profile));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('rrb_user');
  };

  // Show login screen if not authenticated
  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface font-sans antialiased flex transition-colors duration-300">
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
