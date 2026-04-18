import { Search, Bell, Settings, Menu, Moon, Sun } from 'lucide-react';
import { cn } from '../lib/utils';

interface TopNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setSidebarOpen: (isOpen: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
}

export function TopNav({ activeTab, setActiveTab, setSidebarOpen, isDarkMode, setIsDarkMode }: TopNavProps) {
  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 z-30 bg-surface/70 backdrop-blur-xl shadow-sm transition-colors duration-300">
      <div className="flex items-center justify-between px-4 lg:px-8 py-3 max-w-full mx-auto">
        <div className="flex items-center gap-4 lg:gap-8">
          <button className="lg:hidden text-on-surface-variant" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <span className="text-lg lg:text-xl font-bold tracking-tighter text-primary truncate max-w-[150px] lg:max-w-none">
            {activeTab === 'analytics' ? 'Performance' : 
             activeTab === 'dashboard' ? 'Dashboard' :
             activeTab === 'papers' ? 'Mock Tests' : 
             activeTab === 'doubts' ? 'AI Doubt Solver' : 'Subject Practice'}
          </span>
          <nav className="hidden md:flex items-center gap-6 font-medium text-sm tracking-tight">
            <button
              onClick={() => setActiveTab('practice')}
              className={cn(
                "transition-colors pb-1",
                activeTab === 'practice' ? "text-primary font-bold border-b-2 border-primary" : "text-on-surface-variant hover:text-primary"
              )}
            >
              Practice
            </button>
            <button 
              onClick={() => setActiveTab('papers')}
              className={cn(
                "transition-colors pb-1",
                activeTab === 'papers' ? "text-primary font-bold border-b-2 border-primary" : "text-on-surface-variant hover:text-primary"
              )}
            >
              Mock Tests
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={cn(
                "transition-colors pb-1",
                activeTab === 'analytics' ? "text-primary font-bold border-b-2 border-primary" : "text-on-surface-variant hover:text-primary"
              )}
            >
              Analytics
            </button>
            <button 
              onClick={() => setActiveTab('doubts')}
              className={cn(
                "transition-colors pb-1",
                activeTab === 'doubts' ? "text-primary font-bold border-b-2 border-primary" : "text-on-surface-variant hover:text-primary"
              )}
            >
              Doubt Solver
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
            <input
              type="text"
              placeholder="Search topics..."
              className="pl-10 pr-4 py-2 bg-surface-container-lowest border-none rounded-full text-sm w-48 lg:w-64 focus:ring-2 focus:ring-primary/20 transition-all outline-none text-on-surface"
            />
          </div>
          <div className="flex items-center gap-1 lg:gap-2">
            <button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg transition-all active:scale-95 sm:hidden">
              <Search size={18} />
            </button>
            
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg transition-all active:scale-95"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg transition-all active:scale-95">
              <Bell size={18} />
            </button>
            <button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg transition-all active:scale-95 hidden sm:block">
              <Settings size={18} />
            </button>
            <div className="h-8 w-[1px] bg-surface-container-high mx-1 lg:mx-2"></div>
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
              alt="User Profile"
              className="w-8 h-8 rounded-full border border-surface-container bg-surface-container-lowest"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
