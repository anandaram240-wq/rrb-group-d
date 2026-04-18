import { BookOpen, LayoutDashboard, History, LineChart, TrendingUp, HelpCircle, LogOut, Award, X, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'practice', label: 'Subject Mastery', icon: BookOpen },
    { id: 'papers', label: 'Mock Tests', icon: History },
    { id: 'analytics', label: 'Performance', icon: TrendingUp },
    { id: 'doubts', label: 'AI Doubt Solver', icon: Sparkles },
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
          <div className="bg-primary-container rounded-xl p-4 mb-6 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-white text-xs font-bold mb-2">Upgrade to Pro</p>
              <p className="text-on-primary-container text-[10px] leading-tight mb-3">Get access to 500+ premium mock tests and AI analysis.</p>
              <button className="w-full py-2 bg-secondary-container text-on-secondary-container text-xs font-bold rounded-lg hover:scale-105 transition-transform active:scale-95">
                Upgrade Now
              </button>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <Award size={64} />
            </div>
          </div>

          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-6 py-2 text-slate-400 hover:text-blue-900 text-sm font-medium transition-colors">
              <HelpCircle size={18} />
              Help Center
            </button>
            <button className="w-full flex items-center gap-3 px-6 py-2 text-slate-400 hover:text-error text-sm font-medium transition-colors">
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
