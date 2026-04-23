import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, Flame, Target, Plus, Trash2, BookOpen, Zap, BarChart3, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { format, subDays } from 'date-fns';
import pyqsData from '../data/pyqs.json';
import { SubjectDistribution } from './SubjectDistribution';

interface PYQ {
  id: number;
  subject: string;
  topic: string;
  branch?: string;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: string;
}

interface Goal {
  id: string;
  text: string;
  completed: boolean;
}

interface DashboardProps {
  userName: string;
  onNavigateTo?: (tab: string) => void;
}

export function Dashboard({ userName, onNavigateTo }: DashboardProps) {
  const today = new Date();
  const allQuestions = pyqsData as PYQ[];

  // PYQ statistics
  const stats = useMemo(() => {
    const subjectMap: Record<string, { count: number; topics: Set<string> }> = {};
    allQuestions.forEach(q => {
      if (!subjectMap[q.subject]) subjectMap[q.subject] = { count: 0, topics: new Set() };
      subjectMap[q.subject].count++;
      subjectMap[q.subject].topics.add(q.topic);
    });

    const difficultyBreakdown = {
      easy: allQuestions.filter(q => q.difficulty === 'easy').length,
      medium: allQuestions.filter(q => q.difficulty === 'medium').length,
      hard: allQuestions.filter(q => q.difficulty === 'hard').length,
    };

    return { subjectMap, difficultyBreakdown, total: allQuestions.length };
  }, [allQuestions]);

  const getSubjectIcon = (s: string) => {
    const icons: Record<string, string> = { 'Mathematics': '📐', 'Reasoning': '🧩', 'General Science': '🔬', 'General Awareness': '🌍' };
    return icons[s] || '📚';
  };

  const getSubjectGradient = (s: string) => {
    const g: Record<string, string> = {
      'Mathematics': 'from-blue-500 to-indigo-600',
      'Reasoning': 'from-purple-500 to-violet-600',
      'General Science': 'from-emerald-500 to-teal-600',
      'General Awareness': 'from-amber-500 to-orange-600',
    };
    return g[s] || 'from-slate-500 to-slate-600';
  };

  // User goals — persisted to localStorage
  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('rrb_goals');
    if (saved) {
      try { return JSON.parse(saved); } catch { return []; }
    }
    return [];
  });
  const [newGoalText, setNewGoalText] = useState('');

  useEffect(() => {
    localStorage.setItem('rrb_goals', JSON.stringify(goals));
  }, [goals]);

  // Real streak data from localStorage
  const [streakData, setStreakData] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('rrb_streak');
    if (saved) try { return JSON.parse(saved); } catch { return {}; }
    return {};
  });

  // Calculate current streak
  const currentStreak = useMemo(() => {
    let streak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);
    
    while (true) {
      const key = format(checkDate, 'yyyy-MM-dd');
      if (streakData[key]) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }
    return streak;
  }, [streakData]);

  // Mark today as active when user visits dashboard
  useEffect(() => {
    const todayKey = format(today, 'yyyy-MM-dd');
    if (!streakData[todayKey]) {
      const updated = { ...streakData, [todayKey]: 1 };
      setStreakData(updated);
      localStorage.setItem('rrb_streak', JSON.stringify(updated));
    }
  }, []);

  // Build streak calendar from real data
  const streakDays = Array.from({ length: 30 }).map((_, i) => {
    const date = subDays(today, 29 - i);
    const key = format(date, 'yyyy-MM-dd');
    const activity = streakData[key] || 0;
    const intensity = activity > 0 ? Math.min(3, activity) : 0;
    return { date, intensity };
  });

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;
    setGoals([...goals, { id: Date.now().toString(), text: newGoalText.trim(), completed: false }]);
    setNewGoalText('');
  };

  const toggleGoal = (id: string) => setGoals(goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
  const deleteGoal = (id: string) => setGoals(goals.filter(g => g.id !== id));

  const completedCount = goals.filter(g => g.completed).length;
  const firstName = userName.split(' ')[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 mb-1">
        <div>
          <p className="text-on-surface-variant text-xs font-medium mb-0.5">Welcome back, {firstName}</p>
          <h2 className="text-2xl font-bold text-primary tracking-tight">Your Dashboard</h2>
        </div>
        <div className="bg-surface-container-lowest p-3 rounded-xl shadow-sm border-l-4 border-primary">
          <p className="text-xs italic text-on-surface-variant">
            "Success is the sum of small efforts, repeated day in and day out."
          </p>
          <p className="text-[10px] font-bold text-primary mt-1">— Robert Collier</p>
        </div>
      </div>

      {/* PYQ Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(stats.subjectMap).map(([subject, data]) => (
          <div key={subject} className="relative overflow-hidden bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container-high">
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-5", getSubjectGradient(subject))}></div>
            <div className="relative z-10">
              <div className="text-xl mb-1">{getSubjectIcon(subject)}</div>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5 leading-tight">{subject}</p>
              <p className="text-xl font-black text-primary">{data.count.toLocaleString()}</p>
              <p className="text-[10px] text-on-surface-variant">{data.topics.size} Topics</p>
            </div>
          </div>
        ))}
      </div>

      {/* Total PYQs Banner */}
      <div className="bg-gradient-to-r from-primary to-primary-container text-white rounded-xl p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
            <BookOpen size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Total PYQ Database</p>
            <p className="text-2xl font-black">{stats.total.toLocaleString()} Questions</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-right">
          <div><p className="text-xs text-white/60 mb-0.5">Easy</p><p className="font-black">{stats.difficultyBreakdown.easy}</p></div>
          <div className="w-px h-8 bg-white/20" />
          <div><p className="text-xs text-white/60 mb-0.5">Medium</p><p className="font-black">{stats.difficultyBreakdown.medium}</p></div>
          <div className="w-px h-8 bg-white/20" />
          <div><p className="text-xs text-white/60 mb-0.5">Hard</p><p className="font-black">{stats.difficultyBreakdown.hard}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Daily Goals & Streak */}
        <div className="lg:col-span-1 space-y-8">
          {/* Daily Goals */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                <Target size={20} /> Daily Goals
              </h3>
              {goals.length > 0 && (
                <span className="text-xs font-bold text-on-surface-variant bg-surface-container px-2 py-1 rounded">
                  {completedCount}/{goals.length}
                </span>
              )}
            </div>

            <form onSubmit={handleAddGoal} className="mb-4 flex gap-2">
              <input
                type="text"
                value={newGoalText}
                onChange={(e) => setNewGoalText(e.target.value)}
                placeholder="Add a new goal..."
                className="flex-1 text-sm px-3 py-2 rounded-lg border border-surface-container-high bg-surface focus:outline-none focus:border-primary"
              />
              <button type="submit" className="bg-primary text-white p-2 rounded-lg hover:bg-primary/90 transition-colors">
                <Plus size={18} />
              </button>
            </form>

            <div className="space-y-3">
              {goals.length === 0 ? (
                <p className="text-sm text-on-surface-variant text-center py-4 italic">Set your first daily goal above!</p>
              ) : (
                goals.map(goal => (
                  <div
                    key={goal.id}
                    className={cn(
                      "flex items-start justify-between gap-3 p-3 rounded-lg border transition-colors group",
                      goal.completed ? "bg-tertiary-fixed/20 border-tertiary-fixed-dim/30" : "border-surface-container-high hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-start gap-3 flex-1 cursor-pointer" onClick={() => toggleGoal(goal.id)}>
                      {goal.completed ? (
                        <CheckCircle2 className="text-tertiary mt-0.5 shrink-0" size={18} />
                      ) : (
                        <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-300 mt-0.5 shrink-0"></div>
                      )}
                      <p className={cn("text-sm font-medium", goal.completed ? "text-primary line-through opacity-70" : "text-primary")}>
                        {goal.text}
                      </p>
                    </div>
                    <button onClick={() => deleteGoal(goal.id)} className="text-on-surface-variant opacity-0 group-hover:opacity-100 hover:text-error transition-opacity">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Streak Calendar - Real Data */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                <Flame size={20} className="text-secondary-container" /> Consistency
              </h3>
              <div className="flex items-center gap-1 text-secondary-container font-black">
                <span className="text-2xl">{currentStreak}</span>
                <span className="text-xs uppercase tracking-wider">Day Streak</span>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-xs text-on-surface-variant mb-2">
                <span>Last 30 Days</span>
                <span>{format(subDays(today, 29), 'MMM d')} - {format(today, 'MMM d')}</span>
              </div>
              {/* Streak Calendar */}
            <div className="grid grid-cols-10 gap-1">
              {streakDays.map((day, i) => {
                const intensities = ['bg-surface-container-high', 'bg-tertiary-fixed-dim', 'bg-tertiary-fixed', 'bg-tertiary'];
                return (
                  <div key={i} className={cn("w-full aspect-square rounded-sm", intensities[day.intensity])} title={format(day.date, 'MMM d')} />
                );
              })}
            </div>
              <div className="flex justify-between items-center mt-3 text-[10px] text-on-surface-variant">
                <span>Less</span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-sm bg-surface-container-high"></div>
                  <div className="w-3 h-3 rounded-sm bg-tertiary-fixed-dim"></div>
                  <div className="w-3 h-3 rounded-sm bg-tertiary-fixed"></div>
                  <div className="w-3 h-3 rounded-sm bg-tertiary"></div>
                </div>
                <span>More</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Subject Quick Jump */}
        <div className="lg:col-span-2 space-y-5">
          {/* Quick Actions Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              onClick={() => onNavigateTo?.('practice')}
              className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container-high hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
            >
              <Zap size={24} className="text-primary mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-bold text-primary text-sm mb-1">Quick Practice</h4>
              <p className="text-xs text-on-surface-variant">Jump into topic-wise PYQ practice</p>
            </div>
            <div
              onClick={() => onNavigateTo?.('papers')}
              className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container-high hover:shadow-md hover:border-secondary/30 transition-all cursor-pointer group"
            >
              <BookOpen size={24} className="text-secondary mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-bold text-primary text-sm mb-1">Full Mock Test</h4>
              <p className="text-xs text-on-surface-variant">100 Qs • 90 Min • Real CBT Pattern</p>
            </div>
            <div
              onClick={() => onNavigateTo?.('analytics')}
              className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container-high hover:shadow-md hover:border-tertiary/30 transition-all cursor-pointer group"
            >
              <BarChart3 size={24} className="text-tertiary mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-bold text-primary text-sm mb-1">Analytics</h4>
              <p className="text-xs text-on-surface-variant">Track your performance trends</p>
            </div>
          </div>

          {/* Subject Quick Jump */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-container">
              <h3 className="font-bold text-primary text-base flex items-center gap-2">
                <Zap size={18} className="text-primary" /> Subject Quick Jump
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">Choose a subject and start mastering or test yourself</p>
            </div>
            <div className="divide-y divide-surface-container">
              {([
                { subject: 'Mathematics',       icon: '📐', grad: 'from-blue-500 to-indigo-600',    pyqs: stats.subjectMap['Mathematics']?.count || 0 },
                { subject: 'Reasoning',         icon: '🧩', grad: 'from-purple-500 to-violet-600',  pyqs: stats.subjectMap['Reasoning']?.count || 0 },
                { subject: 'General Science',   icon: '🔬', grad: 'from-emerald-500 to-teal-600',   pyqs: stats.subjectMap['General Science']?.count || 0 },
                { subject: 'General Awareness', icon: '🌍', grad: 'from-amber-500 to-orange-600',   pyqs: stats.subjectMap['General Awareness']?.count || 0 },
              ] as const).map(({ subject, icon, grad, pyqs }) => (
                <div key={subject} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-container/40 transition-colors">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-gradient-to-br shrink-0 shadow-sm', grad)}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-primary truncate">{subject}</p>
                    <p className="text-[10px] text-on-surface-variant">{pyqs.toLocaleString()} PYQs</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onNavigateTo?.('practice')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-all active:scale-95 shadow-sm"
                    >
                      <BookOpen size={12} /> Subject Mastery
                    </button>
                    <button
                      onClick={() => onNavigateTo?.('papers')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container text-primary rounded-lg text-xs font-bold hover:bg-surface-container-high transition-all active:scale-95 border border-surface-container-high"
                    >
                      <ChevronRight size={12} /> Mock Test
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Subject & Topic Distribution */}
      <SubjectDistribution />
    </div>
  );
}
