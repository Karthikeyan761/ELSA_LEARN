"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [newClass, setNewClass] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchData = () => {
    api.progress.teacherDashboard()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      await api.classes.create(newClass);
      setShowCreateClass(false);
      setNewClass({ name: '', description: '' });
      fetchData();
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const firstName = user?.name?.split(' ')[0] || 'Teacher';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <span className="text-white font-black text-sm">E</span>
          </div>
          <span className="font-bold text-slate-900">ELSA Learn — Teacher</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/teacher/lessons" className="text-slate-500 hover:text-slate-900 text-sm font-medium">Lessons</Link>
          <Link href="/teacher/exercises" className="text-slate-500 hover:text-slate-900 text-sm font-medium">Exercises</Link>
          <button onClick={logout} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600">↩</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Welcome, {firstName}! 📋</h1>
            <p className="text-slate-500 mt-1">Manage your classes and track student progress</p>
          </div>
          <button
            id="create-class-btn"
            onClick={() => setShowCreateClass(true)}
            className="px-5 py-3 bg-purple-600 hover:bg-purple-700 rounded-2xl text-white font-semibold transition-all shadow-sm shadow-purple-600/20"
          >
            + Create New Class
          </button>
        </header>

        {/* Create Class Modal */}
        {showCreateClass && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Create New Class</h2>
              <form onSubmit={handleCreateClass} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Class Name</label>
                  <input
                    type="text"
                    value={newClass.name}
                    onChange={(e) => setNewClass((c) => ({ ...c, name: e.target.value }))}
                    placeholder="e.g. Advanced English A"
                    required
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all text-slate-900 placeholder:text-slate-400 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Description (optional)</label>
                  <textarea
                    value={newClass.description}
                    onChange={(e) => setNewClass((c) => ({ ...c, description: e.target.value }))}
                    placeholder="Brief description of this class..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all text-slate-900 placeholder:text-slate-400 bg-slate-50 resize-none"
                  />
                </div>
                {createError && <p className="text-red-600 text-sm">{createError}</p>}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateClass(false)}
                    className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-semibold disabled:opacity-60"
                  >
                    {creating ? 'Creating...' : 'Create Class'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Students', value: loading ? '—' : data?.totalStudents || 0, sub: 'Enrolled', icon: '🧑‍🎓', bg: 'bg-indigo-50' },
            { label: 'Classes', value: loading ? '—' : data?.totalClasses || 0, sub: 'Active', icon: '🏫', bg: 'bg-purple-50' },
            { label: 'Avg Score', value: loading ? '—' : (data?.avgScore || 0) + '/100', sub: 'Class average', icon: '📈', bg: 'bg-emerald-50' },
            { label: 'Practice Time', value: loading ? '—' : data?.totalPracticeMin || 0, sub: 'Minutes total', icon: '⏱️', bg: 'bg-amber-50' },
          ].map((card, i) => (
            <div key={i} className={`${card.bg} p-5 rounded-3xl border border-slate-200 shadow-sm`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.label}</h3>
                <span className="text-xl">{card.icon}</span>
              </div>
              <div className="text-3xl font-black text-slate-900">{card.value}</div>
              <div className="text-slate-500 text-sm mt-1">{card.sub}</div>
            </div>
          ))}
        </section>

        {/* Classes Table */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">Classes Overview</h2>
          </div>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}</div>
            ) : !data?.classes?.length ? (
              <div className="p-10 text-center">
                <div className="text-5xl mb-4">🏫</div>
                <h3 className="text-xl font-semibold text-slate-700 mb-2">No classes yet</h3>
                <p className="text-slate-500 mb-5">Create your first class to start managing students</p>
                <button
                  onClick={() => setShowCreateClass(true)}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-2xl text-white font-semibold"
                >
                  + Create Class
                </button>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-slate-500 font-semibold uppercase text-xs tracking-wider">Class Name</th>
                    <th className="px-6 py-4 text-left text-slate-500 font-semibold uppercase text-xs tracking-wider">Students</th>
                    <th className="px-6 py-4 text-left text-slate-500 font-semibold uppercase text-xs tracking-wider">Avg Score</th>
                    <th className="px-6 py-4 text-left text-slate-500 font-semibold uppercase text-xs tracking-wider">Lessons</th>
                    <th className="px-6 py-4 text-left text-slate-500 font-semibold uppercase text-xs tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.classes.map((cls: any) => (
                    <tr key={cls.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">{cls.name}</td>
                      <td className="px-6 py-4 text-slate-600">{cls.studentCount}</td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${cls.avgScore > 80 ? 'text-emerald-600' : cls.avgScore > 60 ? 'text-amber-500' : 'text-red-500'}`}>
                          {cls.avgScore}/100
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{cls.lessonCount}</td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/teacher/class/${cls.id}`}
                          className="text-purple-600 hover:text-purple-800 font-semibold mr-4"
                        >
                          Manage →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Quick Links */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { href: '/teacher/exercises', icon: '➕', label: 'Create Exercise', sublabel: 'Build custom content', color: 'purple' },
              { href: '/teacher/lessons', icon: '📚', label: 'Manage Lessons', sublabel: 'Organize content', color: 'indigo' },
              { href: '/library', icon: '📖', label: 'Exercise Library', sublabel: '100+ exercises', color: 'emerald' },
            ].map((a, i) => (
              <Link
                key={i}
                href={a.href}
                className={`flex flex-col items-center gap-3 p-5 rounded-3xl bg-white border border-slate-200 hover:border-${a.color}-300 hover:shadow-md transition-all group text-center`}
              >
                <div className={`w-14 h-14 rounded-2xl bg-${a.color}-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
                  {a.icon}
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{a.label}</div>
                  <div className="text-xs text-slate-500">{a.sublabel}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
