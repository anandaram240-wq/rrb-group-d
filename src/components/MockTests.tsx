import React, { useState, useMemo } from 'react';
import { Play, Clock, FileText, CheckCircle2, AlertCircle, Award, BookOpen, Target, Zap, BarChart3, ChevronRight, Layers } from 'lucide-react';
import { cn } from '../lib/utils';
import { TakeTest } from './TakeTest';
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

interface MockConfig {
  id: string;
  type: 'full' | 'subject' | 'topic';
  title: string;
  duration: number; // minutes
  questionCount: number;
  subject?: string;
  topic?: string;
  questions: PYQ[];
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function MockTests() {
  const allQuestions = pyqsData as PYQ[];
  const [activeMode, setActiveMode] = useState<'subject' | 'topic' | 'full'>('subject');
  const [activeMock, setActiveMock] = useState<MockConfig | null>(null);
  const [completedMocks, setCompletedMocks] = useState<Record<string, { score: number; total: number; timestamp: number }>>({});
  
  // Topic mock selection states
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [selectedTopic, setSelectedTopic] = useState('');

  // Build syllabus from data
  const syllabus = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    allQuestions.forEach(q => {
      if (!map[q.subject]) map[q.subject] = {};
      if (!map[q.subject][q.topic]) map[q.subject][q.topic] = 0;
      map[q.subject][q.topic]++;
    });
    return map;
  }, [allQuestions]);

  const subjects = Object.keys(syllabus);

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

  // Generate mock questions
  const generateMock = (type: 'full' | 'subject' | 'topic', subject?: string, topic?: string): MockConfig => {
    let questions: PYQ[] = [];
    let title = '';
    let duration = 90;
    let questionCount = 100;

    if (type === 'full') {
      title = 'Full CBT Mock Test';
      duration = 90;
      questionCount = 100;
      // 25 from each subject
      subjects.forEach(s => {
        const subjectQs = shuffleArray(allQuestions.filter(q => q.subject === s));
        questions.push(...subjectQs.slice(0, 25));
      });
      questions = shuffleArray(questions);
    } else if (type === 'subject' && subject) {
      title = `${subject} Mock`;
      duration = 30;
      questionCount = 25;
      const subjectQs = shuffleArray(allQuestions.filter(q => q.subject === subject));
      questions = subjectQs.slice(0, 25);
    } else if (type === 'topic' && subject && topic) {
      title = `${topic} Mock`;
      duration = 20;
      const topicQs = shuffleArray(allQuestions.filter(q => q.subject === subject && q.topic === topic));
      questionCount = Math.min(20, topicQs.length);
      questions = topicQs.slice(0, questionCount);
    }

    return {
      id: `${type}-${subject || 'full'}-${topic || 'all'}-${Date.now()}`,
      type,
      title,
      duration,
      questionCount: questions.length,
      subject,
      topic,
      questions,
    };
  };

  const startMock = (type: 'full' | 'subject' | 'topic', subject?: string, topic?: string) => {
    const mock = generateMock(type, subject, topic);
    setActiveMock(mock);
  };

  const handleComplete = (score: number) => {
    if (activeMock) {
      setCompletedMocks(prev => ({
        ...prev,
        [activeMock.id]: { score, total: activeMock.questionCount, timestamp: Date.now() }
      }));
    }
  };

  // Active Test View
  if (activeMock) {
    return (
      <TakeTest
        title={activeMock.title}
        questions={activeMock.questions}
        duration={activeMock.duration}
        subject={activeMock.subject}
        onClose={() => setActiveMock(null)}
        onComplete={handleComplete}
      />
    );
  }

  const totalCompleted = Object.keys(completedMocks).length;
  const avgScore = totalCompleted > 0 
    ? Math.round(Object.values(completedMocks).reduce((sum, m) => sum + (m.score / m.total) * 100, 0) / totalCompleted)
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-primary tracking-tight">Mock Tests</h2>
          <p className="text-on-surface-variant text-sm mt-2 max-w-lg">
            Practice with {allQuestions.length.toLocaleString()} real PYQs. Choose subject-wise, topic-wise, or full CBT exam mode.
          </p>
        </div>
      </div>

      {/* Stats Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-primary text-white rounded-2xl p-6 relative overflow-hidden shadow-md">
          <div className="absolute -right-4 -bottom-4 opacity-10"><Award size={80} /></div>
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-primary-fixed-dim uppercase tracking-wider mb-2">Predicted Score</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black tracking-tighter">{avgScore || '--'}</span>
              <span className="text-sm font-bold text-tertiary-fixed">/ 100</span>
            </div>
            <p className="text-xs text-primary-fixed-dim mt-2">
              {totalCompleted > 0 ? `Based on ${totalCompleted} mock(s)` : 'Take mocks to predict score'}
            </p>
          </div>
        </div>
        
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high flex items-center gap-4">
          <div className="w-12 h-12 bg-tertiary-fixed/20 rounded-full flex items-center justify-center">
            <CheckCircle2 className="text-tertiary" size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Mocks Completed</p>
            <p className="text-2xl font-black text-primary">{totalCompleted}</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high flex items-center gap-4">
          <div className="w-12 h-12 bg-secondary-fixed/20 rounded-full flex items-center justify-center">
            <BarChart3 className="text-secondary" size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Total PYQs Available</p>
            <p className="text-2xl font-black text-primary">{allQuestions.length.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex bg-surface-container rounded-2xl p-1.5 w-fit">
        {([
          { id: 'subject' as const, label: 'Subject-Wise', icon: BookOpen },
          { id: 'topic' as const, label: 'Topic-Wise', icon: Layers },
          { id: 'full' as const, label: 'Full Exam', icon: Target },
        ]).map(mode => (
          <button
            key={mode.id}
            onClick={() => setActiveMode(mode.id)}
            className={cn(
              "px-5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2",
              activeMode === mode.id ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:bg-white/50"
            )}
          >
            <mode.icon size={14} />
            {mode.label}
          </button>
        ))}
      </div>

      {/* Subject-wise Mocks */}
      {activeMode === 'subject' && (
        <div className="space-y-4">
          <h3 className="font-bold text-primary flex items-center gap-2">
            <BookOpen size={18} /> Subject-Wise Mock Tests
            <span className="text-xs font-normal text-on-surface-variant ml-2">25 Questions • 30 Minutes</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {subjects.map(subject => {
              const count = allQuestions.filter(q => q.subject === subject).length;
              const topicCount = Object.keys(syllabus[subject]).length;
              
              return (
                <div key={subject} className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high overflow-hidden hover:shadow-md transition-all group">
                  <div className={cn("h-2 bg-gradient-to-r", getSubjectGradient(subject))}></div>
                  <div className="p-5">
                    <div className="text-3xl mb-3">{getSubjectIcon(subject)}</div>
                    <h4 className="font-bold text-primary mb-1">{subject}</h4>
                    <p className="text-xs text-on-surface-variant mb-4">{count} PYQs • {topicCount} Topics</p>
                    
                    <div className="flex items-center gap-3 text-[10px] text-on-surface-variant mb-5">
                      <span className="flex items-center gap-1"><Clock size={10} /> 30 Min</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                      <span>25 Qs</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                      <span>Random</span>
                    </div>

                    <button
                      onClick={() => startMock('subject', subject)}
                      className="w-full bg-primary text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary-container transition-colors"
                    >
                      <Play size={14} fill="currentColor" /> Start Mock
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Topic-wise Mocks */}
      {activeMode === 'topic' && (
        <div className="space-y-6">
          <h3 className="font-bold text-primary flex items-center gap-2">
            <Layers size={18} /> Topic-Wise Mock Tests
            <span className="text-xs font-normal text-on-surface-variant ml-2">Up to 20 Questions • 20 Minutes</span>
          </h3>

          {/* Subject Selector */}
          <div className="flex gap-3 flex-wrap">
            {subjects.map(s => (
              <button
                key={s}
                onClick={() => { setSelectedSubject(s); setSelectedTopic(''); }}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                  selectedSubject === s
                    ? "bg-primary text-white shadow-sm"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                )}
              >
                <span>{getSubjectIcon(s)}</span>
                {s}
              </button>
            ))}
          </div>

          {/* Topics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(syllabus[selectedSubject] || {}).map(([topic, count]) => {
              const available = Math.min(20, count);

              return (
                <div key={topic} className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container-high hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-primary text-sm">{topic}</h4>
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-lg text-xs font-bold">{count} Qs</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-[10px] text-on-surface-variant mb-4">
                    <span className="flex items-center gap-1"><Clock size={10} /> 20 Min</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span>{available} Qs</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span>Random</span>
                  </div>

                  <button
                    onClick={() => startMock('topic', selectedSubject, topic)}
                    className="w-full bg-primary/10 text-primary py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-colors"
                  >
                    <Play size={14} fill="currentColor" /> Start Mock
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full Exam Mock */}
      {activeMode === 'full' && (
        <div className="space-y-6">
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-primary-container p-8 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <Target size={28} />
                    <h3 className="text-2xl font-black tracking-tight">Full CBT Mock Exam</h3>
                  </div>
                  <p className="text-sm text-white/80 max-w-lg">
                    Simulates the exact RRB Group D CBT pattern. 100 questions across all 4 subjects with real exam timing and negative marking.
                  </p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-white/60 uppercase font-bold tracking-wider">Real Exam Pattern</p>
                  <p className="text-4xl font-black mt-1">CBT</p>
                </div>
              </div>
            </div>

            <div className="p-8">
              {/* Exam Structure */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {subjects.map(s => (
                  <div key={s} className="bg-surface-container rounded-xl p-4 text-center">
                    <div className="text-2xl mb-2">{getSubjectIcon(s)}</div>
                    <p className="text-xs font-bold text-primary mb-1">{s}</p>
                    <p className="text-lg font-black text-primary">25 Qs</p>
                  </div>
                ))}
              </div>

              {/* Exam Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 py-4 border-y border-surface-container">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Total Questions</p>
                  <p className="text-2xl font-black text-primary">100</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Duration</p>
                  <p className="text-2xl font-black text-primary">90 Min</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Correct Answer</p>
                  <p className="text-2xl font-black text-tertiary">+1</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Wrong Answer</p>
                  <p className="text-2xl font-black text-error">-0.33</p>
                </div>
              </div>

              <button
                onClick={() => startMock('full')}
                className="w-full md:w-auto bg-primary text-white px-10 py-4 rounded-2xl text-lg font-bold flex items-center justify-center gap-3 hover:bg-primary-container transition-colors shadow-lg hover:shadow-xl mx-auto"
              >
                <Zap size={22} /> Start Full Mock Exam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
