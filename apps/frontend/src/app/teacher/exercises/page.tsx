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

export default function TeacherExercisesPage() {
  const { logout } = useAuth();
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    title: '',
    targetText: '',
    instructions: '',
    difficulty: 'BEGINNER',
    type: 'SENTENCE',
    topic: 'general',
  });

  const fetchExercises = () => {
    api.exercises.list()
      .then(setExercises)
      .catch(() => setExercises([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchExercises(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      await api.exercises.create(form);
      setSuccess('Exercise created successfully!');
      setShowCreate(false);
      setForm({ title: '', targetText: '', instructions: '', difficulty: 'BEGINNER', type: 'SENTENCE', topic: 'general' });
      fetchExercises();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this exercise?')) return;
    try {
      await api.exercises.delete(id);
      setExercises((prev) => prev.filter((e) => e.id !== id));
    } catch (err: any) {
      alert('Failed to delete: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <Link href="/teacher" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <span className="text-white font-black text-sm">E</span>
          </div>
          <span className="font-bold text-slate-900">Exercise Manager</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/teacher" className="text-slate-500 text-sm font-medium hover:text-slate-900">Dashboard</Link>
          <button onClick={logout} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 items-center justify-center text-slate-600 flex">↩</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Exercise Management</h1>
            <p className="text-slate-500 mt-1">Create and manage speaking exercises for your students</p>
          </div>
          <button
            id="new-exercise-btn"
            onClick={() => setShowCreate(true)}
            className="px-5 py-3 bg-purple-600 hover:bg-purple-700 rounded-2xl text-white font-semibold shadow-sm"
          >
            + New Exercise
          </button>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 font-medium">
            ✅ {success}
          </div>
        )}

        {/* Create Exercise Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl my-4">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Create Exercise</h2>
              <form onSubmit={handleCreate} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Exercise Title *</label>
                  <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required
                    placeholder="e.g. Business Meeting Introduction"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 text-slate-900 placeholder:text-slate-400 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Target Text * <span className="text-slate-400 font-normal">(student must say this)</span></label>
                  <textarea value={form.targetText} onChange={(e) => setForm((f) => ({ ...f, targetText: e.target.value }))} required rows={3}
                    placeholder="Enter the exact text the student should pronounce..."
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 text-slate-900 placeholder:text-slate-400 bg-slate-50 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Instructions (optional)</label>
                  <input type="text" value={form.instructions} onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
                    placeholder="e.g. Speak clearly and focus on word stress"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 text-slate-900 placeholder:text-slate-400 bg-slate-50"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Difficulty</label>
                    <select value={form.difficulty} onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
                      className="w-full px-3 py-3 rounded-2xl border border-slate-200 text-slate-700 text-sm bg-slate-50 focus:outline-none focus:border-purple-400 cursor-pointer"
                    >
                      <option value="BEGINNER">Beginner</option>
                      <option value="INTERMEDIATE">Intermediate</option>
                      <option value="ADVANCED">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Type</label>
                    <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                      className="w-full px-3 py-3 rounded-2xl border border-slate-200 text-slate-700 text-sm bg-slate-50 focus:outline-none focus:border-purple-400 cursor-pointer"
                    >
                      <option value="WORD">Word</option>
                      <option value="SENTENCE">Sentence</option>
                      <option value="PARAGRAPH">Paragraph</option>
                      <option value="ROLEPLAY">Roleplay</option>
                      <option value="CONVERSATION">Conversation</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Topic</label>
                    <input type="text" value={form.topic} onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                      placeholder="e.g. business"
                      className="w-full px-3 py-3 rounded-2xl border border-slate-200 text-slate-700 text-sm bg-slate-50 focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>

                {error && <p className="text-red-600 text-sm">{error}</p>}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreate(false)}
                    className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={creating}
                    className="flex-1 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-semibold disabled:opacity-60">
                    {creating ? 'Creating...' : 'Create Exercise'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Exercises Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}</div>
          ) : exercises.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-5xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No exercises yet</h3>
              <button onClick={() => setShowCreate(true)} className="mt-3 px-6 py-3 bg-purple-600 rounded-2xl text-white font-semibold">
                + Create First Exercise
              </button>
            </div>
          ) : (
            <>
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <p className="text-slate-500 text-sm">{exercises.length} exercises total</p>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-slate-500 font-semibold uppercase text-xs tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-slate-500 font-semibold uppercase text-xs tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-slate-500 font-semibold uppercase text-xs tracking-wider">Level</th>
                    <th className="px-6 py-3 text-left text-slate-500 font-semibold uppercase text-xs tracking-wider">Topic</th>
                    <th className="px-6 py-3 text-left text-slate-500 font-semibold uppercase text-xs tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {exercises.map((ex: any) => (
                    <tr key={ex.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 font-semibold text-slate-900 max-w-xs truncate">{ex.title}</td>
                      <td className="px-6 py-3 text-slate-600">{ex.type}</td>
                      <td className="px-6 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${DIFF_COLORS[ex.difficulty]}`}>
                          {ex.difficulty}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-600 capitalize">{ex.topic}</td>
                      <td className="px-6 py-3">
                        <Link href={`/practice/${ex.id}`} className="text-indigo-600 hover:text-indigo-800 font-medium mr-4 text-xs">Preview</Link>
                        <button onClick={() => handleDelete(ex.id)} className="text-red-500 hover:text-red-700 font-medium text-xs">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
