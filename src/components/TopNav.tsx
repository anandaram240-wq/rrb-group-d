import { Search, Menu, Moon, Sun } from 'lucide-react';
import { cn } from '../lib/utils';

const TAB_LABELS: Record<string, string> = {
  dashboard:   'Dashboard',
  practice:    'Subject Mastery',
  papers:      'Mock Tests',
  analytics:   'Analytics',
  performance: 'Performance',
  roadmap:     'Study Roadmap',
  planner:     'Exam Planner',
};

interface TopNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setSidebarOpen: (isOpen: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  user: { name: string; email: string; avatar: string };
}

export function TopNav({ activeTab, setActiveTab, setSidebarOpen, isDarkMode, setIsDarkMode, user }: TopNavProps) {
  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 z-30 h-14 bg-surface/80 backdrop-blur-xl border-b border-surface-container-high shadow-sm transition-colors duration-300">
      <div className="flex items-center justify-between h-full px-3 sm:px-4 lg:px-8">
        {/* Left */}
        <div className="flex items-center gap-2 lg:gap-6 min-w-0">
          <button
            className="lg:hidden text-on-surface-variant p-1.5 rounded-lg hover:bg-surface-container transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>
          <span className="text-base font-bold tracking-tight text-primary truncate">
            {TAB_LABELS[activeTab] || 'Dashboard'}
          </span>
          {/* Desktop quick-nav */}
          <nav className="hidden lg:flex items-center gap-5 font-medium text-sm">
            {(['practice','papers','analytics','roadmap'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'transition-colors pb-0.5',
                  activeTab === tab
                    ? 'text-primary font-bold border-b-2 border-primary'
                    : 'text-on-surface-variant hover:text-primary'
                )}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </nav>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1 lg:gap-3 shrink-0">
          {/* Search — desktop only */}
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={15} />
            <input
              type="text"
              placeholder="Search topics..."
              className="pl-9 pr-4 py-1.5 bg-surface-container-lowest border-none rounded-full text-sm w-52 focus:ring-2 focus:ring-primary/20 outline-none text-on-surface"
            />
          </div>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg transition-all active:scale-95"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="h-7 w-px bg-surface-container-high mx-0.5 lg:mx-1" />
          <img
            src={user.avatar}
            alt={user.name}
            className="w-7 h-7 lg:w-8 lg:h-8 rounded-full border border-surface-container bg-surface-container-lowest"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </header>
  );
}

