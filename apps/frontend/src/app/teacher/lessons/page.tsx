"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const DIFF_COLORS: Record<string, string> = {
  BEGINNER: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  INTERMEDIATE: 'bg-amber-100 text-amber-700 border-amber-200',
  ADVANCED: 'bg-red-100 text-red-700 border-red-200',
};

export default function TeacherLessonsPage() {
  const { logout } = useAuth();
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', description: '', difficulty: 'BEGINNER', topic: 'general' });

  const fetchLessons = () => {
    api.lessons.list()
      .then(setLessons)
      .catch(() => setLessons([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLessons(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      await api.lessons.create(form);
      setShowCreate(false);
      setForm({ title: '', description: '', difficulty: 'BEGINNER', topic: 'general' });
      fetchLessons();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <Link href="/teacher" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <span className="text-white font-black text-sm">E</span>
          </div>
          <span className="font-bold text-slate-900">Lesson Manager</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/teacher" className="text-slate-500 text-sm font-medium hover:text-slate-900">← Dashboard</Link>
          <button onClick={logout} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600">↩</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-6 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Lesson Management 📚</h1>
            <p className="text-slate-500 mt-1">Organize exercises into structured lesson plans</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="px-5 py-3 bg-purple-600 hover:bg-purple-700 rounded-2xl text-white font-semibold shadow-sm">
            + New Lesson
          </button>
        </div>

        {showCreate && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Create Lesson</h2>
              <form onSubmit={handleCreate} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Lesson Title*</label>
                  <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required
                    placeholder="e.g. Restaurant Vocabulary" 
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 bg-slate-50 placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3}
                    placeholder="What will students learn?" 
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 bg-slate-50 placeholder:text-slate-400 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Difficulty</label>
                    <select value={form.difficulty} onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
                      className="w-full px-3 py-3 rounded-2xl border border-slate-200 text-slate-700 text-sm bg-slate-50 focus:outline-none focus:border-purple-400 cursor-pointer">
                      <option value="BEGINNER">Beginner</option>
                      <option value="INTERMEDIATE">Intermediate</option>
                      <option value="ADVANCED">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Topic</label>
                    <input type="text" value={form.topic} onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                      placeholder="e.g. restaurant" 
                      className="w-full px-3 py-3 rounded-2xl border border-slate-200 text-slate-700 text-sm bg-slate-50 focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-700 font-semibold">Cancel</button>
                  <button type="submit" disabled={creating} className="flex-1 py-3 rounded-2xl bg-purple-600 text-white font-semibold disabled:opacity-60">
                    {creating ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            [...Array(6)].map((_, i) => <div key={i} className="h-40 bg-white rounded-3xl border border-slate-200 animate-pulse" />)
          ) : lessons.length === 0 ? (
            <div className="col-span-3 text-center py-16">
              <div className="text-5xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No lessons yet</h3>
              <button onClick={() => setShowCreate(true)} className="mt-3 px-6 py-3 bg-purple-600 rounded-2xl text-white font-semibold">+ Create First Lesson</button>
            </div>
          ) : (
            lessons.map((lesson: any) => (
              <div key={lesson.id} className="bg-white rounded-3xl border border-slate-200 p-5 hover:border-purple-300 hover:shadow-md transition-all group">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${DIFF_COLORS[lesson.difficulty]}`}>
                    {lesson.difficulty}
                  </span>
                  <span className="text-xs text-slate-400 capitalize">{lesson.topic}</span>
                </div>
                <h3 className="font-bold text-slate-900 mb-2 group-hover:text-purple-700 transition-colors">{lesson.title}</h3>
                {lesson.description && <p className="text-slate-500 text-sm mb-3 line-clamp-2">{lesson.description}</p>}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{lesson.exercises?.length || 0} exercises</span>
                  <Link href={`/teacher/lessons/${lesson.id}`} className="text-purple-600 hover:text-purple-800 text-xs font-semibold">
                    Manage →
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
