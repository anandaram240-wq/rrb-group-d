import { BookOpen, LayoutDashboard, History, TrendingUp, LogOut, X, CalendarDays, BarChart2, Download, CloudUpload, CheckCircle, GraduationCap } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState } from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: { name: string; email: string; avatar: string };
  onLogout: () => void;
  installPrompt?: any;           // BeforeInstallPromptEvent
  onSyncNow?: () => Promise<void>; // force cloud sync
}

export function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen, user, onLogout, installPrompt, onSyncNow }: SidebarProps) {
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  const handleSyncNow = async () => {
    if (!onSyncNow || syncing) return;
    setSyncing(true);
    setSyncDone(false);
    await onSyncNow();
    setSyncing(false);
    setSyncDone(true);
    setTimeout(() => setSyncDone(false), 3000);
  };

  const handleInstall = () => {
    if (installPrompt) {
      installPrompt.prompt();
    } else {
      // iOS / already installed — show guidance
      alert('📲 To install on iPhone/iPad: tap the Share button → "Add to Home Screen"\n\nOn Android Chrome: tap menu (⋮) → "Add to Home Screen" or "Install App"');
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard',       icon: LayoutDashboard },
    { id: 'study',     label: '📚 Study',          icon: GraduationCap },
    { id: 'practice', label: 'Subject Mastery',   icon: BookOpen },
    { id: 'papers',   label: 'Mock Tests',         icon: History },
    { id: 'analytics',label: 'Analytics',          icon: TrendingUp },
    { id: 'performance', label: 'Performance',     icon: BarChart2 },
    { id: 'planner',  label: 'Exam Planner',       icon: CalendarDays },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <aside className={cn(
        "h-screen w-64 fixed left-0 top-0 z-50 bg-slate-50 flex flex-col py-6 pr-4 border-r border-slate-200 transition-transform duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="px-6 mb-10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
              <BookOpen size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black text-blue-900 tracking-tight">RRB Group D</h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Exam Engine v2.0</p>
            </div>
          </div>
          <button className="lg:hidden text-slate-500" onClick={() => setIsOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-6 py-3 rounded-lg ml-2 transition-transform duration-200 font-semibold text-sm hover:translate-x-1",
                  isActive
                    ? "bg-white text-blue-900 shadow-sm"
                    : "text-slate-500 hover:bg-slate-200/50"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-4 mt-auto">
          {/* User Profile Card */}
          <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full border-2 border-primary/20"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0">
                <p className="text-sm font-bold text-primary truncate">{user.name}</p>
                <p className="text-[10px] text-on-surface-variant truncate">{user.email}</p>
              </div>
            </div>
          </div>

          {/* ── Install App Button (always shown) ────────── */}
          <button
            onClick={handleInstall}
            className="w-full flex items-center gap-3 px-4 py-2.5 mb-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold transition-all hover:from-blue-700 hover:to-indigo-700 active:scale-95 shadow-sm"
          >
            <Download size={16} />
            📲 Install App
          </button>

          {/* ── Sync Now Button ────────────────────────────── */}
          <button
            onClick={handleSyncNow}
            disabled={syncing}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 mb-3 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm",
              syncDone
                ? "bg-green-500 text-white"
                : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600"
            )}
          >
            {syncDone ? <CheckCircle size={16} /> : <CloudUpload size={16} className={syncing ? 'animate-pulse' : ''} />}
            {syncing ? '⏳ Syncing...' : syncDone ? '✅ Synced!' : '☁️ Sync Now'}
          </button>

          <div className="space-y-1">
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-6 py-2 text-slate-400 hover:text-error text-sm font-medium transition-colors"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
