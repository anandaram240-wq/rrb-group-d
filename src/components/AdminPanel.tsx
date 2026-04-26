import React, { useState, useEffect, useCallback } from 'react';
import {
  Crown, Users, TrendingUp, BarChart2, Bell, RefreshCw,
  Shield, Eye, Search, ChevronDown, AlertCircle, CheckCircle, X
} from 'lucide-react';
import { collection, getDocs, query, orderBy, limit, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { isAdmin, ADMIN_EMAIL } from '../lib/adminGuard';

export { isAdmin, ADMIN_EMAIL };


// ── Types ─────────────────────────────────────────────────────────────────────
interface UserRecord {
  email: string;
  name?: string;
  avatar?: string;
  updatedAt?: any;
  performance?: string;
}

interface ParsedUser {
  email: string;
  maskedEmail: string;
  name: string;
  avatar: string;
  lastActive: string;
  totalTests: number;
  totalQuestions: number;
  accuracy: number;
  streak: number;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  return local[0] + '***@' + domain;
}

function timeAgo(ts: any): string {
  if (!ts) return 'Never';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function parsePerf(raw?: string): { totalTests: number; totalQuestions: number; accuracy: number } {
  try {
    if (!raw) return { totalTests: 0, totalQuestions: 0, accuracy: 0 };
    const p = JSON.parse(raw);
    return {
      totalTests: p.overall?.total_tests ?? 0,
      totalQuestions: p.overall?.total_questions ?? 0,
      accuracy: p.overall?.overall_accuracy ?? 0,
    };
  } catch { return { totalTests: 0, totalQuestions: 0, accuracy: 0 }; }
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className={`rounded-2xl p-5 border ${color} flex items-start gap-4`}>
      <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0">{icon}</div>
      <div>
        <p className="text-white/60 text-xs font-bold uppercase tracking-widest">{label}</p>
        <p className="text-white text-2xl font-black mt-0.5">{value}</p>
        {sub && <p className="text-white/50 text-[11px] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Main AdminPanel ────────────────────────────────────────────────────────────
interface AdminPanelProps { userEmail: string; }

export function AdminPanel({ userEmail }: AdminPanelProps) {
  // Hard gate — never render for non-admins
  if (!isAdmin(userEmail)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Shield size={48} className="text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-black text-red-600">Access Denied</h2>
          <p className="text-slate-500 text-sm mt-1">This area is restricted to administrators only.</p>
        </div>
      </div>
    );
  }

  const [users, setUsers] = useState<ParsedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'leaderboard' | 'users'>('overview');
  const [search, setSearch] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [broadcastError, setBroadcastError] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const parsed: ParsedUser[] = [];
      snap.forEach(d => {
        const data = d.data() as UserRecord;
        const perf = parsePerf(data.performance);
        parsed.push({
          email: data.email || d.id,
          maskedEmail: maskEmail(data.email || d.id),
          name: data.name || data.email?.split('@')[0] || 'Student',
          avatar: data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || 'S')}&background=1a365d&color=fff`,
          lastActive: timeAgo(data.updatedAt),
          ...perf,
          streak: 0, // extend later if stored
        });
      });
      parsed.sort((a, b) => b.totalQuestions - a.totalQuestions);
      setUsers(parsed);
      setLastRefresh(new Date());
    } catch (e) {
      console.error('[AdminPanel] Load failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    const t = setInterval(loadUsers, 30_000);
    return () => clearInterval(t);
  }, [loadUsers]);

  // Stats
  const totalUsers = users.length;
  const activeToday = users.filter(u => u.lastActive.includes('h ago') || u.lastActive.includes('m ago') || u.lastActive.includes('s ago')).length;
  const avgAccuracy = users.length > 0 ? Math.round(users.reduce((s, u) => s + u.accuracy, 0) / users.length) : 0;
  const totalQsSolved = users.reduce((s, u) => s + u.totalQuestions, 0);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const sendBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    try {
      await setDoc(doc(db, 'broadcasts', `msg_${Date.now()}`), {
        message: broadcastMsg,
        sentBy: userEmail,
        sentAt: serverTimestamp(),
      });
      setBroadcastSent(true);
      setBroadcastMsg('');
      setTimeout(() => setBroadcastSent(false), 3000);
    } catch {
      setBroadcastError('Failed to send. Check Firestore rules.');
      setTimeout(() => setBroadcastError(''), 3000);
    }
  };

  const tabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'leaderboard', label: '🏆 Leaderboard' },
    { id: 'users', label: '👥 All Users' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
            <Crown size={22} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">Admin Console</h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs text-slate-500 font-medium">
                Live · {totalUsers} users · Last refreshed {lastRefresh ? timeAgo({ toDate: () => lastRefresh }) : '—'}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={loadUsers}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-60"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users size={20} className="text-white" />} label="Total Users" value={totalUsers} sub="Registered" color="bg-gradient-to-br from-blue-600 to-indigo-700 border-blue-500/30" />
        <StatCard icon={<TrendingUp size={20} className="text-white" />} label="Active Today" value={activeToday} sub="Last 24h" color="bg-gradient-to-br from-emerald-600 to-teal-700 border-emerald-500/30" />
        <StatCard icon={<BarChart2 size={20} className="text-white" />} label="Avg Accuracy" value={`${avgAccuracy}%`} sub="Across all users" color="bg-gradient-to-br from-violet-600 to-purple-700 border-violet-500/30" />
        <StatCard icon={<Crown size={20} className="text-white" />} label="Qs Solved" value={totalQsSolved.toLocaleString()} sub="Total platform" color="bg-gradient-to-br from-amber-500 to-orange-600 border-amber-400/30" />
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === t.id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Subject accuracy heatmap */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
              <BarChart2 size={16} className="text-blue-600" /> Platform Accuracy by Subject
            </h3>
            {['Mathematics', 'General Science', 'Reasoning', 'General Awareness'].map(subj => {
              const subAccuracies = users.map(u => {
                try {
                  const p = JSON.parse(users.find(x => x.email === u.email) ? '{}' : '{}');
                  return p.overall?.subject_accuracy?.[subj] ?? 0;
                } catch { return 0; }
              }).filter(n => n > 0);
              const avg = subAccuracies.length > 0 ? Math.round(subAccuracies.reduce((a, b) => a + b, 0) / subAccuracies.length) : 0;
              const color = avg >= 70 ? 'bg-emerald-500' : avg >= 50 ? 'bg-amber-500' : 'bg-red-500';
              return (
                <div key={subj} className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-semibold text-slate-700">{subj}</span>
                    <span className="text-sm font-black text-slate-800">{avgAccuracy}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${avgAccuracy}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Broadcast */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
              <Bell size={16} className="text-violet-600" /> Broadcast to All Users
            </h3>
            <textarea
              value={broadcastMsg}
              onChange={e => setBroadcastMsg(e.target.value)}
              placeholder="Type your message to all students… (e.g. 'New questions added! Check Practice Engine.')"
              rows={5}
              className="w-full border border-slate-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
            />
            {broadcastError && (
              <div className="flex items-center gap-2 text-red-600 text-xs font-bold mt-2">
                <AlertCircle size={13} /> {broadcastError}
              </div>
            )}
            <button
              onClick={sendBroadcast}
              disabled={!broadcastMsg.trim() || broadcastSent}
              className={`mt-3 w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${broadcastSent ? 'bg-emerald-500 text-white' : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 disabled:opacity-50'}`}
            >
              {broadcastSent ? <><CheckCircle size={15} /> Sent!</> : <><Bell size={15} /> Send Broadcast</>}
            </button>
            <p className="text-[10px] text-slate-400 mt-2 text-center">Stored in Firestore broadcasts collection</p>
          </div>
        </div>
      )}

      {/* ── Leaderboard Tab ── */}
      {activeTab === 'leaderboard' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-black text-slate-800">🏆 Top Students by Questions Solved</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-5 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Rank</th>
                  <th className="px-5 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Student</th>
                  <th className="px-5 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Qs Solved</th>
                  <th className="px-5 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Accuracy</th>
                  <th className="px-5 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Tests</th>
                  <th className="px-5 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {users.slice(0, 20).map((u, i) => (
                  <tr key={u.email} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-slate-300 text-slate-700' : i === 2 ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                        <div>
                          <p className="text-sm font-bold text-slate-800">{u.name}</p>
                          <p className="text-[10px] text-slate-400">{u.maskedEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-black text-blue-700">{u.totalQuestions.toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-black px-2 py-1 rounded-lg ${u.accuracy >= 70 ? 'bg-emerald-100 text-emerald-700' : u.accuracy >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {u.accuracy}%
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold text-slate-600">{u.totalTests}</td>
                    <td className="px-5 py-3 text-xs text-slate-400 font-medium">{u.lastActive}</td>
                  </tr>
                ))}
                {users.length === 0 && !loading && (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400">No user data found. Check Firestore rules.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── All Users Tab ── */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <span className="text-xs text-slate-400 font-bold">{filteredUsers.length} users</span>
          </div>
          <div className="divide-y divide-slate-50 max-h-[60vh] overflow-y-auto">
            {filteredUsers.map(u => (
              <div key={u.email} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors">
                <img src={u.avatar} alt={u.name} className="w-9 h-9 rounded-full shrink-0" referrerPolicy="no-referrer" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{u.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{u.maskedEmail}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-center hidden sm:block">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Qs</p>
                    <p className="text-sm font-black text-blue-700">{u.totalQuestions}</p>
                  </div>
                  <div className="text-center hidden sm:block">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Acc</p>
                    <p className={`text-sm font-black ${u.accuracy >= 70 ? 'text-emerald-600' : u.accuracy >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{u.accuracy}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Last</p>
                    <p className="text-xs font-bold text-slate-500">{u.lastActive}</p>
                  </div>
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <div className="py-12 text-center text-slate-400 text-sm">No users match your search.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
