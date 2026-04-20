import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, BookOpen, Brain, FlaskConical, Globe, Hash } from 'lucide-react';
import { cn } from '../lib/utils';
import pyqsData from '../data/pyqs.json';

interface PYQ {
  id: number;
  subject: string;
  topic: string;
  branch?: string;
  sub_topic?: string;
  difficulty?: string;
  exam_year?: string;
}

interface TopicData {
  count: number;
  sub_topics: Record<string, number>;
}

interface SubjectData {
  count: number;
  topics: Record<string, TopicData>;
}

const allQuestions = pyqsData as PYQ[];

const SUBJECT_CONFIG: Record<string, { icon: React.ReactNode; gradient: string; color: string; bg: string; border: string }> = {
  'Mathematics': {
    icon: <Hash size={20} />,
    gradient: 'from-blue-500 to-indigo-600',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  'Reasoning': {
    icon: <Brain size={20} />,
    gradient: 'from-purple-500 to-violet-600',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
  'General Science': {
    icon: <FlaskConical size={20} />,
    gradient: 'from-emerald-500 to-teal-600',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  'General Awareness': {
    icon: <Globe size={20} />,
    gradient: 'from-amber-500 to-orange-600',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
};

export function SubjectDistribution() {
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  const distribution = useMemo<Record<string, SubjectData>>(() => {
    const dist: Record<string, SubjectData> = {};
    allQuestions.forEach(q => {
      const subj = q.subject || 'General Awareness';
      const topic = q.topic || 'General';
      const st = q.sub_topic || 'General';

      if (!dist[subj]) dist[subj] = { count: 0, topics: {} };
      dist[subj].count++;

      if (!dist[subj].topics[topic]) dist[subj].topics[topic] = { count: 0, sub_topics: {} };
      dist[subj].topics[topic].count++;
      dist[subj].topics[topic].sub_topics[st] = (dist[subj].topics[topic].sub_topics[st] || 0) + 1;
    });
    return dist;
  }, []);

  const totalQuestions = allQuestions.length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <BookOpen size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Subject & Topic Distribution</h3>
              <p className="text-white/60 text-xs mt-0.5">{totalQuestions.toLocaleString()} PYQs — Click any subject to explore topics</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1 bg-white/10 rounded-xl px-3 py-2">
            <span className="text-white font-black text-xl">{totalQuestions.toLocaleString()}</span>
            <span className="text-white/60 text-xs ml-1">Total</span>
          </div>
        </div>
      </div>

      {/* Subject bars */}
      <div className="p-6 space-y-4">
        {Object.entries(distribution)
          .sort((a, b) => b[1].count - a[1].count)
          .map(([subject, subjData]) => {
            const cfg = SUBJECT_CONFIG[subject] || SUBJECT_CONFIG['General Awareness'];
            const pct = Math.round((subjData.count / totalQuestions) * 100);
            const isExpanded = expandedSubject === subject;
            const topicsSorted = Object.entries(subjData.topics).sort((a, b) => b[1].count - a[1].count);

            return (
              <div key={subject} className={cn('rounded-xl border transition-all duration-300', isExpanded ? `${cfg.border} shadow-md` : 'border-gray-100')}>
                {/* Subject Row */}
                <button
                  className={cn('w-full text-left p-4 flex items-center gap-4 rounded-xl transition-colors', isExpanded ? cfg.bg : 'hover:bg-gray-50')}
                  onClick={() => {
                    setExpandedSubject(isExpanded ? null : subject);
                    setExpandedTopic(null);
                  }}
                >
                  {/* Icon */}
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br text-white flex-shrink-0', cfg.gradient)}>
                    {cfg.icon}
                  </div>

                  {/* Name + bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-gray-800 text-sm">{subject}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={cn('font-black text-base', cfg.color)}>{subjData.count.toLocaleString()}</span>
                        <span className="text-gray-400 text-xs">({pct}%)</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-700', cfg.gradient)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-gray-400">{topicsSorted.length} topics</span>
                      <span className="text-xs text-gray-300">•</span>
                      <span className="text-xs text-gray-400">
                        Top: {topicsSorted[0]?.[0]} ({topicsSorted[0]?.[1].count})
                      </span>
                    </div>
                  </div>

                  {/* Chevron */}
                  <div className={cn('flex-shrink-0 transition-transform duration-300', isExpanded ? 'rotate-0' : '')}>
                    {isExpanded ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-300" />}
                  </div>
                </button>

                {/* Topics Dropdown */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {topicsSorted.map(([topic, topicData]) => {
                        const topicPct = Math.round((topicData.count / subjData.count) * 100);
                        const topicKey = `${subject}__${topic}`;
                        const isTopicExpanded = expandedTopic === topicKey;
                        const subtopicsSorted = Object.entries(topicData.sub_topics).sort((a, b) => b[1] - a[1]);

                        return (
                          <div key={topic} className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                            <button
                              className="w-full text-left px-3 py-2.5 flex items-center gap-2 hover:bg-gray-50 transition-colors"
                              onClick={() => setExpandedTopic(isTopicExpanded ? null : topicKey)}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-gray-700 truncate">{topic}</span>
                                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                    <span className={cn('text-xs font-bold', cfg.color)}>{topicData.count}</span>
                                    <span className="text-gray-300 text-[10px]">({topicPct}%)</span>
                                  </div>
                                </div>
                                <div className="h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                  <div
                                    className={cn('h-full rounded-full bg-gradient-to-r', cfg.gradient)}
                                    style={{ width: `${topicPct}%` }}
                                  />
                                </div>
                              </div>
                              {subtopicsSorted.length > 0 && (
                                <span className="text-gray-300 flex-shrink-0">
                                  {isTopicExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                </span>
                              )}
                            </button>

                            {/* Sub-topics */}
                            {isTopicExpanded && subtopicsSorted.length > 0 && (
                              <div className={cn('px-3 pb-2 pt-1 border-t border-gray-50', cfg.bg)}>
                                {subtopicsSorted.map(([st, stCount]) => (
                                  <div key={st} className="flex items-center justify-between py-1">
                                    <span className="text-[10px] text-gray-500 truncate flex-1">{st}</span>
                                    <span className={cn('text-[10px] font-bold ml-2 flex-shrink-0', cfg.color)}>{stCount}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Footer Legend */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <span className="font-semibold text-gray-700">Exam Years in Dataset:</span>
          {['2018', '2025', '2026'].map(yr => {
            const cnt = allQuestions.filter(q => q.exam_year === yr).length;
            return cnt > 0 ? (
              <span key={yr} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                {yr}: <strong className="text-gray-700">{cnt}</strong>
              </span>
            ) : null;
          })}
          <span className="ml-auto text-gray-400">Based on actual RRB Group D exam papers</span>
        </div>
      </div>
    </div>
  );
}
