import { Download, TrendingUp, ArrowRight, AlertCircle, Clock, RotateCcw, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { cn } from '../lib/utils';

const data = [
  { name: 'MON', value: 40, total: 60 },
  { name: 'TUE', value: 55, total: 70 },
  { name: 'WED', value: 35, total: 50 },
  { name: 'THU', value: 65, total: 80 },
  { name: 'FRI', value: 85, total: 90 },
  { name: 'SAT', value: 50, total: 65 },
  { name: 'SUN', value: 95, total: 100 },
];

export function AnalyticsEngine() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-on-surface-variant text-sm font-medium mb-1">
            <span>Performance</span>
            <span className="text-slate-300">›</span>
            <span className="text-primary font-bold">PYQ Analysis</span>
          </div>
          <h2 className="text-3xl font-bold text-primary tracking-tight">Analytics Engine</h2>
          <p className="text-on-surface-variant text-sm mt-2 max-w-md">
            Detailed breakdown of your performance across 2,400+ Previous Year Questions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest text-primary text-sm font-bold rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <Download size={16} />
            Export PDF
          </button>
          <button className="flex items-center gap-2 px-6 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-container transition-colors shadow-md">
            <TrendingUp size={16} />
            Improve Now
          </button>
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Overall Accuracy</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-primary tracking-tighter">78.4%</span>
            <span className="text-xs font-bold text-tertiary-container">+2.1%</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Time Per Question</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-primary tracking-tighter">42s</span>
            <span className="text-xs font-bold text-error">+5s</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">PYQs Attempted</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-primary tracking-tighter">1,482</span>
            <span className="text-xs font-bold text-on-surface-variant">/ 2,400</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Concept Mastery</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-primary tracking-tighter">64%</span>
            <span className="text-xs font-bold text-secondary-container">In Progress</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 mb-8">
        {/* Chart Section */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest p-8 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-primary">Accuracy vs. Time Trend</h3>
            <div className="flex bg-surface-container rounded-lg p-1">
              <button className="px-3 py-1 bg-surface-container-lowest text-primary text-[10px] font-bold rounded shadow-sm">WEEKLY</button>
              <button className="px-3 py-1 text-on-surface-variant text-[10px] font-semibold rounded hover:bg-white/50">MONTHLY</button>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#43474e', fontWeight: 600 }}
                  dy={10}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                {/* Background Bar (Total) */}
                <Bar dataKey="total" fill="#e6e8ea" radius={[4, 4, 0, 0]} barSize={40} />
                {/* Foreground Bar (Value) */}
                <Bar dataKey="value" fill="#455f88" radius={[4, 4, 0, 0]} barSize={40} style={{ transform: 'translateY(-100%)' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Mastery Section */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest p-8 rounded-xl shadow-sm">
          <h3 className="text-lg font-bold text-primary mb-6">Subject Mastery</h3>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-primary">General Science</span>
                <span className="text-tertiary">88%</span>
              </div>
              <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-tertiary w-[88%] rounded-full"></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-primary">Mathematics</span>
                <span className="text-primary">72%</span>
              </div>
              <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[72%] rounded-full"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-primary">Reasoning</span>
                <span className="text-secondary-container">54%</span>
              </div>
              <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-secondary-container w-[54%] rounded-full"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-primary">General Awareness</span>
                <span className="text-error">38%</span>
              </div>
              <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-error w-[38%] rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-surface-container">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-4">Topic Heatmap (Last 30 Days)</p>
            <div className="grid grid-cols-6 gap-1">
              {Array.from({ length: 18 }).map((_, i) => {
                const intensities = [
                  'bg-surface-container-high',
                  'bg-tertiary-fixed-dim',
                  'bg-tertiary-fixed',
                  'bg-tertiary'
                ];
                const intensityIndex = (i * 3 + 2) % 4;
                return (
                  <div key={i} className={cn("aspect-square rounded-sm", intensities[intensityIndex])}></div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Mistakes Review */}
      <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-primary">Recent Mistakes Review</h3>
            <p className="text-xs text-on-surface-variant mt-1">Focus on these 3 critical gaps identified from your last session.</p>
          </div>
          <button className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-container transition-colors">
            View All Errors <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Mistake Card 1 */}
          <div className="p-5 border border-surface-container-high rounded-xl hover:border-primary/20 transition-colors cursor-pointer group">
            <div className="flex justify-between items-center mb-4">
              <span className="px-2 py-1 bg-error-container text-on-error-container text-[8px] font-black uppercase rounded">Science</span>
              <span className="text-[10px] font-bold text-on-surface-variant">Q. ID: 8921</span>
            </div>
            <h4 className="text-sm font-bold text-primary mb-2 line-clamp-2 group-hover:text-primary-container transition-colors">
              Relation between work, force and displacement in...
            </h4>
            <p className="text-xs text-on-surface-variant italic mb-4">"Mistaken by 42% of high-performers"</p>
            <div className="flex items-center gap-1 text-error">
              <AlertCircle size={12} />
              <span className="text-[10px] font-bold">High Yield</span>
            </div>
          </div>

          {/* Mistake Card 2 */}
          <div className="p-5 border border-surface-container-high rounded-xl hover:border-primary/20 transition-colors cursor-pointer group bg-surface-container-low/50">
            <div className="flex justify-between items-center mb-4">
              <span className="px-2 py-1 bg-secondary-fixed text-on-secondary-fixed text-[8px] font-black uppercase rounded">Math</span>
              <span className="text-[10px] font-bold text-on-surface-variant">Q. ID: 4410</span>
            </div>
            <h4 className="text-sm font-bold text-primary mb-2 line-clamp-2 group-hover:text-primary-container transition-colors">
              Calculation of interest compounded half-yearly fo...
            </h4>
            <p className="text-xs text-on-surface-variant italic mb-4">"Calculative error noted"</p>
            <div className="flex items-center gap-1 text-primary">
              <Clock size={12} />
              <span className="text-[10px] font-bold">Time Drain</span>
            </div>
          </div>

          {/* Mistake Card 3 */}
          <div className="p-5 border border-surface-container-high rounded-xl hover:border-primary/20 transition-colors cursor-pointer group">
            <div className="flex justify-between items-center mb-4">
              <span className="px-2 py-1 bg-surface-container-high text-on-surface-variant text-[8px] font-black uppercase rounded">GS</span>
              <span className="text-[10px] font-bold text-on-surface-variant">Q. ID: 1022</span>
            </div>
            <h4 className="text-sm font-bold text-primary mb-2 line-clamp-2 group-hover:text-primary-container transition-colors">
              Historical Significance of the Lucknow Pact 1916 clauses...
            </h4>
            <p className="text-xs text-on-surface-variant italic mb-4">"Factual confusion: 1916 vs 1907"</p>
            <div className="flex items-center gap-1 text-tertiary-container">
              <RotateCcw size={12} />
              <span className="text-[10px] font-bold">PYQ Repeat</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Strategy Insight */}
      <div className="bg-primary rounded-2xl p-8 text-white relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-2xl"></div>
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div className="col-span-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 backdrop-blur-sm">
              <Sparkles size={12} />
              AI Strategy Insight
            </div>
            <h3 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">
              You're losing 12% of marks in Mathematics due to time pressure.
            </h3>
            <p className="text-primary-fixed-dim text-sm mb-8 max-w-xl leading-relaxed">
              Data suggests that spending 15 seconds less on 'General Awareness' will give you the window to solve at least 3 more high-scoring 'Math' problems.
            </p>
            <div className="flex gap-4">
              <button className="px-6 py-3 bg-white text-primary text-sm font-bold rounded-lg hover:bg-surface-container-lowest transition-colors shadow-sm">
                Apply Strategy
              </button>
              <button className="px-6 py-3 bg-white/10 text-white text-sm font-bold rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm">
                Detailed Breakdown
              </button>
            </div>
          </div>
          <div className="col-span-1 flex justify-center">
            <div className="w-48 h-48 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center backdrop-blur-md">
              <TrendingUp size={64} className="text-tertiary-fixed opacity-80" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
