"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

interface DashboardData {
  user: any;
  recentRecordings: any[];
}

const STAT_CARDS = [
  { key: 'score', label: 'Avg Pronunciation', suffix: '/100', icon: '📊', color: 'indigo', getValue: (d: any) => Math.round(d?.user?.studentProfile?.score || 0) },
  { key: 'lessons', label: 'Lessons Done', suffix: '', icon: '📚', color: 'purple', getValue: (d: any) => d?.user?.studentProfile?.lessonsDone || 0 },
  { key: 'xp', label: 'Total XP', suffix: '✨', icon: '⭐', color: 'pink', getValue: (d: any) => d?.user?.studentProfile?.xp || 0 },
  { key: 'streak', label: 'Day Streak', suffix: '🔥', icon: '🎯', color: 'orange', getValue: (d: any) => d?.user?.studentProfile?.streak || 0 },
];


export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.progress.dashboard()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const scoreHistory = data?.recentRecordings?.map((r) => r.score) || [40, 55, 60, 75, 70, 85, 87];
  const maxScore = Math.max(...scoreHistory, 1);

  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Student';
  
  // Extract assigned exercises from class lessons
  const progressList = data?.user?.studentProfile?.progress || [];
  const assignedLessons = data?.user?.studentProfile?.class?.lessons || [];
  const assignedExercises = assignedLessons.flatMap((l: any) => 
    (l.exercises || []).map((e: any) => {
      const prog = progressList.find((p: any) => p.exerciseId === e.id);
      return { 
        ...e, 
        lessonTitle: l.title,
        completed: prog?.completed || false,
        score: prog?.bestScore || 0
      };
    })
  );
  const [classId, setClassId] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState('');

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId.trim()) return;
    setEnrolling(true);
    setEnrollError('');
    try {
      await api.classes.enroll(classId);
      window.location.reload();
    } catch (err: any) {
      setEnrollError(err.message || 'Invalid Class ID');
    } finally {
      setEnrolling(false);
    }
  };

  const handleLeaveClass = async () => {
    if (!confirm('Are you sure you want to leave this class?')) return;
    try {
      await api.classes.unenroll(data?.user?.studentProfile?.classId);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Failed to leave class');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Nav */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
            <span className="text-white font-black text-sm">E</span>
          </div>
          <span className="font-bold text-slate-900 text-lg">ELSA Learn</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/practice/demo" id="practice-btn" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white text-sm font-semibold transition-all shadow-sm">
            Start Practice
          </Link>
          <Link href="/library" className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-all">
            Exercise Library
          </Link>
          <Link href="/conversation" className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-all">
            AI Chat
          </Link>
          <button
            onClick={logout}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all"
            title="Logout"
          >
            ↩
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Welcome back, {firstName}! 👋</h1>
            <p className="text-slate-500 mt-1">Ready for your daily English practice?</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            {!data?.user?.studentProfile?.classId ? (
              <form onSubmit={handleJoinClass} className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                <input 
                  type="text" 
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  placeholder="Enter Class ID..."
                  className="bg-transparent border-none outline-none px-3 py-1.5 text-sm w-32 md:w-48 text-slate-700"
                />
                <button 
                  disabled={enrolling}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  {enrolling ? 'Joining...' : 'Join Class'}
                </button>
              </form>
            ) : (
              <div className="flex gap-3">
                <span className="px-4 py-2 bg-orange-50 rounded-xl border border-orange-200 font-semibold text-orange-600 shadow-sm text-sm">
                  {data?.user?.studentProfile?.streak || 0} Day Streak 🔥
                </span>
                <span className="px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-200 font-semibold text-indigo-600 shadow-sm text-sm flex items-center gap-2">
                  {data?.user?.studentProfile?.class?.name || 'Enrolled'}
                  <button onClick={handleLeaveClass} className="text-indigo-300 hover:text-red-500 transition-colors ml-1" title="Leave Class">✕</button>
                </span>
              </div>
            )}
          </div>
          {enrollError && <p className="w-full text-right text-red-500 text-xs font-medium -mt-4">{enrollError}</p>}
        </header>

        {/* Stat Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STAT_CARDS.map((card, i) => (
            <div key={i} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.label}</h3>
                <span className={`w-8 h-8 bg-${card.color}-100 rounded-full flex items-center justify-center text-sm`}>{card.icon}</span>
              </div>
              <div className="text-4xl font-black text-slate-900">
                {loading ? '—' : card.getValue(data)}
                <span className="text-lg text-slate-400 font-medium">{card.suffix}</span>
              </div>
            </div>
          ))}
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Daily Tasks */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Your Learning Path</h2>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  {assignedLessons.length} Lessons
                </span>
                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  {assignedExercises.length} Total Exercises
                </span>
              </div>
            </div>

            <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
              {assignedLessons.map((lesson: any) => (
                <div key={lesson.id} className="space-y-3">
                  <div className="flex items-center gap-2 px-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide italic">{lesson.title}</h3>
                    <span className="text-[10px] text-slate-400 font-medium">({lesson.exercises?.length || 0} exercises)</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(lesson.exercises || []).map((task: any) => {
                      const isDone = assignedExercises.find((ae: any) => ae.id === task.id)?.completed;
                      return (
                        <div key={task.id} className={`flex items-center justify-between p-4 rounded-2xl bg-white border transition-all group ${isDone ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${isDone ? 'bg-emerald-100' : 'bg-indigo-50'}`}>
                              {isDone ? '✅' : (task.type === 'WORD' ? '🔤' : task.type === 'SENTENCE' ? '🗣️' : '👨‍💻')}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors line-clamp-1 text-sm">{task.title}</h4>
                                {isDone && <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">COMPLETED</span>}
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium uppercase">{task.type} • {task.difficulty}</span>
                            </div>
                          </div>
                          <Link
                            href={`/practice/${task.id}`}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all border ${isDone ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-600 hover:text-white' : 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-600 hover:text-white'}`}
                            title={isDone ? 'Review' : 'Practice'}
                          >
                            →
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {assignedLessons.length === 0 && !loading && (
                <div className="p-10 text-center bg-white rounded-3xl border border-slate-100 text-slate-400">
                  <p className="text-2xl mb-2">🏖️</p>
                  <p className="font-medium">No lessons assigned to your class yet.</p>
                  <p className="text-xs mt-1">Check back later or explore the library!</p>
                </div>
              )}
            </div>
          </section>

          {/* Pronunciation Score Chart */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Score Trend</h2>
              <span className="text-slate-400 text-sm">Last 7 sessions</span>
            </div>
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 h-64 relative">
              <div className="absolute inset-x-6 bottom-10 top-6 flex items-end justify-between gap-2">
                {scoreHistory.slice(-7).map((h, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 flex-1">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-indigo-300 to-indigo-600 transition-all hover:from-indigo-400 hover:to-indigo-700"
                      style={{ height: `${(h / maxScore) * 100}%`, minHeight: '4px' }}
                      title={`Score: ${Math.round(h)}`}
                    />
                    <span className="text-xs text-slate-400">{Math.round(h)}</span>
                  </div>
                ))}
              </div>
              <div className="absolute top-4 left-6 text-slate-400 text-xs font-medium">Score /100</div>
              {scoreHistory.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
                  No practice sessions yet
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Quick Actions */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { href: '/tutor', icon: '🤖', label: 'AI Tutor', sublabel: 'Learn rules', color: 'pink' },
              { href: '/conversation', icon: '💬', label: 'AI Scenarios', sublabel: '8 scenarios', color: 'purple' },
              { href: '/library', icon: '🎤', label: 'Pronunciation', sublabel: 'Practice now', color: 'indigo' },
              { href: '/library', icon: '📖', label: 'Exercise Library', sublabel: '100+ exercises', color: 'emerald' },
            ].map((action, i) => (
              <Link
                key={i}
                href={action.href}
                className={`flex flex-col items-center gap-3 p-5 rounded-3xl bg-white border border-slate-200 hover:border-${action.color}-300 hover:shadow-md transition-all group text-center`}
              >
                <div className={`w-14 h-14 rounded-2xl bg-${action.color}-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
                  {action.icon}
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{action.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{action.sublabel}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent Practice */}
        {data?.recentRecordings && data.recentRecordings.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Practice</h2>
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-slate-500 font-semibold uppercase text-xs tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-slate-500 font-semibold uppercase text-xs tracking-wider">Score</th>
                    <th className="px-6 py-3 text-left text-slate-500 font-semibold uppercase text-xs tracking-wider">Fluency</th>
                    <th className="px-6 py-3 text-left text-slate-500 font-semibold uppercase text-xs tracking-wider">Intonation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.recentRecordings.slice(0, 5).map((r: any, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 text-slate-600">{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-3">
                        <span className={`font-bold ${r.score > 80 ? 'text-emerald-600' : r.score > 60 ? 'text-amber-500' : 'text-red-500'}`}>
                          {Math.round(r.score)}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-700 font-medium">{Math.round(r.fluency)}%</td>
                      <td className="px-6 py-3 text-slate-700 font-medium">{Math.round(r.intonation)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
