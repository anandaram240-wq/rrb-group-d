import React, { useState, useEffect } from 'react';
import localforage from 'localforage';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { Dashboard } from './components/Dashboard';
import { PracticeEngine } from './components/PracticeEngine';
import { MockTests } from './components/MockTests';
import { AnalyticsEngine } from './components/AnalyticsEngine';
import { DoubtSolver } from './components/DoubtSolver';
import pyqsData from './data/pyqs.json';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize offline storage
  useEffect(() => {
    localforage.config({
      name: 'RRB_D_Mastery_Pro',
      storeName: 'pyqs_data'
    });
    
    // Cache PYQs for offline use
    localforage.setItem('cached_pyqs', pyqsData).then(() => {
      console.log('PYQs cached for offline use');
    }).catch((err) => {
      console.error('Error caching PYQs:', err);
    });
  }, []);

  // Handle dark mode toggle
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="min-h-screen bg-surface text-on-surface font-sans antialiased flex transition-colors duration-300">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col w-full lg:ml-64">
        <TopNav activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
        <main className="pt-20 px-4 lg:px-8 pb-12 min-h-screen w-full overflow-x-hidden">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'practice' && <PracticeEngine />}
          {activeTab === 'papers' && <MockTests />}
          {activeTab === 'analytics' && <AnalyticsEngine />}
          {activeTab === 'doubts' && <DoubtSolver />}
          {/* Fallback for other tabs for demo purposes */}
          {activeTab !== 'dashboard' && activeTab !== 'practice' && activeTab !== 'papers' && activeTab !== 'analytics' && activeTab !== 'doubts' && (
            <div className="flex items-center justify-center h-full text-on-surface-variant">
              <p>Content for {activeTab} coming soon.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
