import React, { useMemo } from 'react';
import { BookOpen, Target, BarChart3, Trophy, TrendingUp, Layers } from 'lucide-react';
import { cn } from '../lib/utils';
import pyqsData from '../data/pyqs.json';

interface PYQ {
  id: number;
  subject: string;
  topic: string;
  question: string;
  options: string[];
  correctAnswer: number;
  solution: string;
  difficulty: string;
  exam_year: string;
  shift: string;
  tags: string[];
}

export function AnalyticsEngine() {
  const allQuestions = pyqsData as PYQ[];

  // Build real stats from PYQ dataset
  const subjectStats = useMemo(() => {
    const map: Record<string, { total: number; topics: Record<string, number>; easy: number; medium: number; hard: number }> = {};
    allQuestions.forEach(q => {
      if (!map[q.subject]) map[q.subject] = { total: 0, topics: {}, easy: 0, medium: 0, hard: 0 };
      map[q.subject].total++;
      if (!map[q.subject].topics[q.topic]) map[q.subject].topics[q.topic] = 0;
      map[q.subject].topics[q.topic]++;
      if (q.difficulty === 'easy') map[q.subject].easy++;
      else if (q.difficulty === 'hard') map[q.subject].hard++;
      else map[q.subject].medium++;
    });
    return map;
  }, [allQuestions]);

  const difficultyStats = useMemo(() => ({
    easy: allQuestions.filter(q => q.difficulty === 'easy').length,
    medium: allQuestions.filter(q => q.difficulty === 'medium').length,
    hard: allQuestions.filter(q => q.difficulty === 'hard').length,
  }), [allQuestions]);

  const subjects = Object.keys(subjectStats);

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

  const getBarColor = (s: string) => {
    const c: Record<string, string> = {
      'Mathematics': '#6366f1',
      'Reasoning': '#8b5cf6',
      'General Science': '#10b981',
      'General Awareness': '#f59e0b',
    };
    return c[s] || '#64748b';
  };

  const totalTopics = Object.values(subjectStats).reduce((sum, s) => sum + Object.keys(s.topics).length, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-primary tracking-tight">PYQ Analytics</h2>
          <p className="text-on-surface-variant text-sm mt-2 max-w-md">
            Complete breakdown of {allQuestions.length.toLocaleString()} Previous Year Questions across all subjects and topics.
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <div className="bg-primary text-white rounded-2xl p-6 relative overflow-hidden shadow-md">
          <div className="absolute -right-4 -bottom-4 opacity-10"><BookOpen size={80} /></div>
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-primary-fixed-dim uppercase tracking-wider mb-2">Total PYQs</p>
            <p className="text-4xl font-black tracking-tighter">{allQuestions.length.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-tertiary-fixed/20 rounded-full flex items-center justify-center">
              <Layers size={20} className="text-tertiary" />
            </div>
          </div>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Total Topics</p>
          <p className="text-3xl font-black text-primary">{totalTopics}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-secondary-fixed/20 rounded-full flex items-center justify-center">
              <Target size={20} className="text-secondary" />
            </div>
          </div>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Subjects</p>
          <p className="text-3xl font-black text-primary">{subjects.length}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Trophy size={20} className="text-primary" />
            </div>
          </div>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Avg per Topic</p>
          <p className="text-3xl font-black text-primary">{Math.round(allQuestions.length / totalTopics)}</p>
        </div>
      </div>

      {/* Difficulty Distribution */}
      <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm border border-surface-container-high">
        <h3 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
          <BarChart3 size={20} /> Difficulty Distribution
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {[
            { label: 'Easy', count: difficultyStats.easy, color: 'bg-emerald-500', textColor: 'text-emerald-600', bgColor: 'bg-emerald-50' },
            { label: 'Medium', count: difficultyStats.medium, color: 'bg-amber-500', textColor: 'text-amber-600', bgColor: 'bg-amber-50' },
            { label: 'Hard', count: difficultyStats.hard, color: 'bg-red-500', textColor: 'text-red-600', bgColor: 'bg-red-50' },
          ].map(d => (
            <div key={d.label} className={cn("rounded-xl p-5 border border-surface-container-high", d.bgColor)}>
              <div className="flex items-center justify-between mb-3">
                <span className={cn("text-sm font-bold", d.textColor)}>{d.label}</span>
                <span className={cn("text-2xl font-black", d.textColor)}>{d.count.toLocaleString()}</span>
              </div>
              <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full", d.color)} style={{ width: `${(d.count / allQuestions.length) * 100}%` }}></div>
              </div>
              <p className="text-xs text-on-surface-variant mt-2">{((d.count / allQuestions.length) * 100).toFixed(1)}% of total</p>
            </div>
          ))}
        </div>
      </div>

      {/* Subject-wise Breakdown */}
      <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm border border-surface-container-high">
        <h3 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
          <TrendingUp size={20} /> Subject-Wise Distribution
        </h3>

        <div className="space-y-6">
          {subjects.map(subject => {
            const data = subjectStats[subject];
            const pct = Math.round((data.total / allQuestions.length) * 100);

            return (
              <div key={subject} className="border border-surface-container-high rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getSubjectIcon(subject)}</span>
                    <div>
                      <h4 className="font-bold text-primary">{subject}</h4>
                      <p className="text-xs text-on-surface-variant">{Object.keys(data.topics).length} Topics</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-primary">{data.total.toLocaleString()}</p>
                    <p className="text-xs text-on-surface-variant">{pct}% of total</p>
                  </div>
                </div>

                {/* Subject-level difficulty bar */}
                <div className="flex gap-0.5 h-3 rounded-full overflow-hidden bg-surface-container mb-4">
                  {data.easy > 0 && <div className="bg-emerald-400 rounded-full" style={{ width: `${(data.easy / data.total) * 100}%` }}></div>}
                  {data.medium > 0 && <div className="bg-amber-400 rounded-full" style={{ width: `${(data.medium / data.total) * 100}%` }}></div>}
                  {data.hard > 0 && <div className="bg-red-400 rounded-full" style={{ width: `${(data.hard / data.total) * 100}%` }}></div>}
                </div>
                <div className="flex gap-4 text-[10px] text-on-surface-variant mb-4">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span>{data.easy} Easy</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span>{data.medium} Medium</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400"></span>{data.hard} Hard</span>
                </div>

                {/* Topic breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {Object.entries(data.topics)
                    .sort((a, b) => b[1] - a[1])
                    .map(([topic, count]) => (
                      <div key={topic} className="bg-surface-container rounded-lg px-3 py-2 flex justify-between items-center">
                        <span className="text-xs font-medium text-primary truncate mr-2">{topic}</span>
                        <span className="text-xs font-black text-primary shrink-0">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PYQ Year Distribution */}
      <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm border border-surface-container-high">
        <h3 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
          📅 Exam Year Distribution
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(() => {
            const yearMap: Record<string, number> = {};
            allQuestions.forEach(q => {
              const year = q.exam_year || 'Unknown';
              if (!yearMap[year]) yearMap[year] = 0;
              yearMap[year]++;
            });
            return Object.entries(yearMap)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([year, count]) => (
                <div key={year} className="bg-surface-container rounded-xl p-4 text-center">
                  <p className="text-lg font-black text-primary">{count.toLocaleString()}</p>
                  <p className="text-xs font-bold text-on-surface-variant">{year}</p>
                </div>
              ));
          })()}
        </div>
      </div>
    </div>
  );
}
