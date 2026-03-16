"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function AnalyticsPage() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<any[]>([]);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.recordings.stats().catch(() => []),
      api.progress.my().catch(() => null),
    ]).then(([s, p]) => {
      setStats(s || []);
      setProgress(p);
    }).finally(() => setLoading(false));
  }, []);

  const scores = stats.map((r: any) => r.score);
  const maxScore = Math.max(...scores, 1);
  const avgScore = scores.length ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
  const bestScore = scores.length ? Math.round(Math.max(...scores)) : 0;
  const totalSessions = scores.length;
  const completedExercises = progress?.progress?.filter((p: any) => p.completed).length || 0;

  const topicsMap: Record<string, number[]> = {};
  progress?.progress?.forEach((p: any) => {
    const t = p.exercise?.topic || 'general';
    if (!topicsMap[t]) topicsMap[t] = [];
    topicsMap[t].push(p.bestScore);
  });
  const topicScores = Object.entries(topicsMap).map(([topic, scores]) => ({
    topic,
    avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    count: scores.length,
  })).sort((a, b) => b.avg - a.avg);

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/student" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <span className="text-white font-black text-sm">E</span>
            </div>
            <span className="font-bold text-slate-900">Analytics</span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/student" className="text-slate-500 text-sm font-medium hover:text-slate-900">Dashboard</Link>
          <button onClick={logout} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600">↩</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Progress Analytics 📊</h1>
          <p className="text-slate-500 mt-1">Track your English learning journey</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Avg Score', value: loading ? '—' : avatScore(avgScore), suffix: '/100', icon: '📊', color: 'indigo' },
            { label: 'Best Score', value: loading ? '—' : bestScore, suffix: '/100', icon: '🏆', color: 'emerald' },
            { label: 'Sessions', value: loading ? '—' : totalSessions, suffix: '', icon: '🎤', color: 'purple' },
            { label: 'Completed', value: loading ? '—' : completedExercises, suffix: ' exercises', icon: '✅', color: 'amber' },
          ].map((card, i) => (
            <div key={i} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.label}</span>
                <span className="text-lg">{card.icon}</span>
              </div>
              <div className="text-4xl font-black text-slate-900">
                {card.value}
                <span className="text-sm text-slate-400 font-normal">{card.suffix}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Score Trend Chart */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Score Trend</h2>
          <p className="text-slate-500 text-sm mb-6">Your pronunciation score over practice sessions</p>
          {loading ? (
            <div className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
          ) : scores.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <div className="text-4xl mb-2">🎤</div>
                <p>Complete practice sessions to see your trend</p>
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-end justify-between gap-2">
              {scores.slice(-14).map((s, i) => (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className={`w-full rounded-t-lg transition-all hover:opacity-80 ${
                      s > 80 ? 'bg-gradient-to-t from-emerald-300 to-emerald-500' :
                      s > 60 ? 'bg-gradient-to-t from-amber-300 to-amber-500' :
                      'bg-gradient-to-t from-red-300 to-red-500'
                    }`}
                    style={{ height: `${(s / maxScore) * 100}%`, minHeight: '4px' }}
                    title={`Score: ${Math.round(s)}`}
                  />
                  <span className="text-xs text-slate-400">{Math.round(s)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Topic Breakdown */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Performance by Topic</h2>
          <p className="text-slate-500 text-sm mb-6">How well you&apos;ve done in each area</p>
          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}</div>
          ) : topicScores.length === 0 ? (
            <div className="text-center py-8 text-slate-400">Complete exercises to see topic breakdown</div>
          ) : (
            <div className="space-y-4">
              {topicScores.map((t) => (
                <div key={t.topic} className="flex items-center gap-4">
                  <div className="w-24 text-sm font-semibold text-slate-700 capitalize">{t.topic}</div>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${t.avg > 80 ? 'bg-emerald-500' : t.avg > 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                      style={{ width: `${t.avg}%` }}
                    />
                  </div>
                  <div className="w-16 text-right">
                    <span className={`text-sm font-bold ${t.avg > 80 ? 'text-emerald-600' : t.avg > 60 ? 'text-amber-600' : 'text-red-500'}`}>
                      {t.avg}%
                    </span>
                    <span className="text-xs text-slate-400 ml-1">({t.count})</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Exercise History */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Recent Exercises</h2>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}</div>
          ) : (progress?.progress || []).length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <div className="text-4xl mb-2">📖</div>
              <p>Start practicing to see your history here</p>
              <Link href="/library" className="mt-3 inline-block text-indigo-600 font-semibold hover:text-indigo-800">Browse exercises →</Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 text-left text-slate-500 font-semibold uppercase text-xs tracking-wider">Exercise</th>
                  <th className="px-6 py-3 text-left text-slate-500 font-semibold uppercase text-xs tracking-wider">Best Score</th>
                  <th className="px-6 py-3 text-left text-slate-500 font-semibold uppercase text-xs tracking-wider">Attempts</th>
                  <th className="px-6 py-3 text-left text-slate-500 font-semibold uppercase text-xs tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(progress?.progress || []).slice(0, 10).map((p: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="font-semibold text-slate-900">{p.exercise?.title}</div>
                      <div className="text-slate-500 text-xs capitalize">{p.exercise?.topic} • {p.exercise?.type}</div>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`font-bold ${p.bestScore > 80 ? 'text-emerald-600' : p.bestScore > 60 ? 'text-amber-500' : 'text-red-500'}`}>
                        {Math.round(p.bestScore)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-600">{p.attempts}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${p.completed ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-amber-700 bg-amber-50 border-amber-200'}`}>
                        {p.completed ? '✓ Done' : '⟳ In Progress'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function avatScore(s: number) { return isNaN(s) ? '—' : s; }
