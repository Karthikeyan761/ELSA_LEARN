"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const DIFFICULTY_COLORS: Record<string, string> = {
  BEGINNER: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  INTERMEDIATE: 'bg-amber-100 text-amber-700 border-amber-200',
  ADVANCED: 'bg-red-100 text-red-700 border-red-200',
};

const TYPE_ICONS: Record<string, string> = {
  WORD: '🔤',
  SENTENCE: '📝',
  PARAGRAPH: '📄',
  CONVERSATION: '💬',
  ROLEPLAY: '🎭',
};

export default function LibraryPage() {
  const { logout, user } = useAuth();
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [type, setType] = useState('');
  const [topic, setTopic] = useState('');

  const dashboardLink = user?.role === 'TEACHER' ? '/teacher' : '/student';

  const fetchExercises = () => {
    setLoading(true);
    const params: any = {};
    if (search) params.search = search;
    if (difficulty) params.difficulty = difficulty;
    if (type) params.type = type;
    if (topic) params.topic = topic;
    api.exercises.list(params)
      .then(setExercises)
      .catch(() => setExercises([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchExercises();
  }, [difficulty, type, topic]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href={dashboardLink} className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <span className="text-white font-black text-sm">E</span>
            </div>
            <span className="font-bold text-slate-900">ELSA Learn</span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href={dashboardLink} className="text-slate-500 hover:text-slate-900 text-sm font-medium">Dashboard</Link>
          <Link href="/conversation" className="text-slate-500 hover:text-slate-900 text-sm font-medium">AI Chat</Link>
          <button onClick={logout} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600">↩</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Exercise Library 📖</h1>
          <p className="text-slate-500 mt-1">Browse and practice from 100+ exercises across all skill levels</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm mb-6">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-64 relative">
              <input
                id="search-input"
                type="text"
                placeholder="Search exercises..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchExercises()}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-900 placeholder:text-slate-400 text-sm bg-slate-50"
              />
              <span className="absolute left-3.5 top-3.5 text-slate-400">🔍</span>
            </div>

            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="px-4 py-3 rounded-xl border border-slate-200 text-slate-700 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
            >
              <option value="">All Levels</option>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>

            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="px-4 py-3 rounded-xl border border-slate-200 text-slate-700 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
            >
              <option value="">All Types</option>
              <option value="WORD">Word</option>
              <option value="SENTENCE">Sentence</option>
              <option value="PARAGRAPH">Paragraph</option>
              <option value="ROLEPLAY">Roleplay</option>
              <option value="CONVERSATION">Conversation</option>
            </select>

            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="px-4 py-3 rounded-xl border border-slate-200 text-slate-700 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
            >
              <option value="">All Topics</option>
              <option value="restaurant">🍽️ Restaurant</option>
              <option value="business">💼 Business</option>
              <option value="travel">✈️ Travel</option>
              <option value="interview">🤝 Interview</option>
              <option value="social">💬 Social</option>
              <option value="medical">🏥 Medical</option>
              <option value="shopping">🛍️ Shopping</option>
              <option value="academic">📚 Academic</option>
            </select>

            <button
              id="search-btn"
              onClick={fetchExercises}
              className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all shadow-sm"
            >
              Search
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-slate-500 text-sm">{loading ? 'Loading...' : `${exercises.length} exercises found`}</p>
        </div>

        {/* Exercise Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="h-48 bg-white rounded-3xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : exercises.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No exercises found</h3>
            <p className="text-slate-500">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exercises.map((ex: any) => (
              <div
                key={ex.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col gap-4 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{TYPE_ICONS[ex.type] || '📝'}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[ex.difficulty]}`}>
                        {ex.difficulty}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors leading-tight">{ex.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{ex.type} • {ex.topic}</p>
                  </div>
                </div>

                <div className="flex-1">
                  <p className="text-slate-700 text-sm leading-relaxed line-clamp-2 bg-slate-50 rounded-xl p-3 border border-slate-100 italic">
                    &ldquo;{ex.targetText}&rdquo;
                  </p>
                </div>

                <Link
                  href={`/practice/${ex.id}`}
                  id={`exercise-${ex.id}`}
                  className="mt-auto flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-indigo-50 text-indigo-700 font-semibold text-sm hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 hover:border-indigo-600 group-hover:bg-indigo-600 group-hover:text-white"
                >
                  🎤 Practice this
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
