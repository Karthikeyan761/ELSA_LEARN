"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function ClassDetailPage() {
  const params = useParams();
  const classId = params?.id as string;
  const { logout } = useAuth();
  
  const [cls, setCls] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [allLessons, setAllLessons] = useState<any[]>([]);
  const [emailToAdd, setEmailToAdd] = useState('');
  const [addingStudent, setAddingStudent] = useState(false);
  const [addError, setAddError] = useState('');
  const [assigningLesson, setAssigningLesson] = useState(false);

  const fetchData = () => {
    if (!classId) return;
    setLoading(true);
    Promise.all([
      api.classes.get(classId),
      api.classes.analytics(classId),
      api.lessons.list()
    ]).then(([classData, analyticsData, lessonsData]) => {
      setCls(classData);
      setAnalytics(analyticsData);
      setAllLessons(lessonsData);
    }).catch(err => {
      console.error(err);
    }).finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, [classId]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailToAdd.trim()) return;
    setAddingStudent(true);
    setAddError('');
    try {
      await api.classes.addStudent(classId, emailToAdd);
      setEmailToAdd('');
      fetchData();
    } catch (err: any) {
      setAddError(err.message || 'Failed to add student');
    } finally {
      setAddingStudent(false);
    }
  };

  const handleRemoveStudent = async (studentProfileId: string) => {
    if (!confirm('Remove this student from the class?')) return;
    try {
      await api.classes.removeStudent(classId, studentProfileId);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to remove student');
    }
  };

  const handleAssignLesson = async (lessonId: string) => {
    setAssigningLesson(true);
    try {
      await api.classes.assignLesson(classId, lessonId);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to assign lesson');
    } finally {
      setAssigningLesson(false);
    }
  };

  const handleUnassignLesson = async (lessonId: string) => {
    if (!confirm('Unassign this lesson from the class?')) return;
    try {
      await api.lessons.update(lessonId, { classId: null });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to unassign lesson');
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading class details...</div>;
  if (!cls) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Class not found.</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <Link href="/teacher" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <span className="text-white font-black text-sm">E</span>
          </div>
          <span className="font-bold text-slate-900">Class Manager</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/teacher" className="text-slate-500 text-sm font-medium hover:text-slate-900">← Dashboard</Link>
          <button onClick={logout} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600">↩</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{cls.name}</h1>
            <p className="text-slate-500 mt-1">{cls.description || 'No description provided'}</p>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex flex-col items-end">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Class Enrollment ID</span>
            <span className="text-lg font-mono font-bold text-indigo-700 select-all tracking-wider">{cls.id}</span>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Total Students</div>
              <div className="text-4xl font-black text-slate-900">{analytics?.totalStudents || 0}</div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Lessons Assigned</div>
              <div className="text-4xl font-black text-slate-900">{cls.lessons?.length || 0}</div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Avg. Pronunciation</div>
              <div className="text-4xl font-black text-emerald-600">
                {analytics?.students?.length ? Math.round(analytics.students.reduce((a:any,s:any)=>a+s.score, 0)/analytics.students.length) : 0}%
              </div>
            </div>
          </div>
          
          {/* Add Student Form */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Add Student</h3>
            <form onSubmit={handleAddStudent} className="space-y-3">
              <input 
                type="email" 
                value={emailToAdd}
                onChange={(e) => setEmailToAdd(e.target.value)}
                placeholder="student@email.com"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-400"
              />
              <button 
                type="submit" 
                disabled={addingStudent}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                {addingStudent ? 'Adding...' : 'Add by Email'}
              </button>
              {addError && <p className="text-[10px] text-red-500 font-medium">{addError}</p>}
            </form>
          </div>
        </div>

        {/* Student Roster */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Student Roster & Performance</h2>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-left text-slate-500 font-semibold uppercase text-xs">Student</th>
                  <th className="px-6 py-4 text-left text-slate-500 font-semibold uppercase text-xs text-center">Avg Score</th>
                  <th className="px-6 py-4 text-left text-slate-500 font-semibold uppercase text-xs text-center">Lessons Done</th>
                  <th className="px-6 py-4 text-left text-slate-500 font-semibold uppercase text-xs text-center">Practice Min</th>
                  <th className="px-6 py-4 text-left text-slate-500 font-semibold uppercase text-xs text-center">Streak</th>
                  <th className="px-6 py-4 text-left text-slate-500 font-semibold uppercase text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(analytics?.students || []).map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{s.name}</div>
                      <div className="text-xs text-slate-400">{s.id}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <span className={`font-bold ${s.score > 80 ? 'text-emerald-600' : s.score > 60 ? 'text-amber-500' : 'text-red-500'}`}>
                        {Math.round(s.score)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="font-bold text-slate-900">{s.lessonsDone}</div>
                      <div className="text-[10px] text-slate-400 mt-1 flex flex-wrap justify-center gap-1">
                        {s.completedExercises?.slice(0, 3).map((ex: string, i: number) => (
                          <span key={i} className="bg-slate-100 px-1.5 py-0.5 rounded" title={ex}>{ex}</span>
                        ))}
                        {s.completedExercises?.length > 3 && <span>+{s.completedExercises.length - 3} move</span>}
                        {(!s.completedExercises || s.completedExercises.length === 0) && <span>None</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-600">{s.practiceMin}m</td>
                    <td className="px-6 py-4 text-center font-bold text-orange-500">{s.streak} 🔥</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleRemoveStudent(s.realProfileId || s.id)} 
                        className="text-red-400 hover:text-red-600 text-xs font-bold"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!analytics?.students || analytics.students.length === 0) && (
              <div className="p-12 text-center text-slate-400">No students enrolled in this class yet.</div>
            )}
          </div>
        </section>

        {/* Lesson List */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Assigned Lessons</h2>
              <span className="text-xs text-slate-400">{cls.lessons?.length || 0} active</span>
            </div>
            <div className="space-y-3">
              {(cls.lessons || []).map((lesson: any) => (
                <div key={lesson.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between group">
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">{lesson.title}</h3>
                    <div className="text-xs text-slate-500">{lesson.difficulty} • {lesson.exercises?.length || 0} Exercises</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link href={`/teacher/lessons/${lesson.id}`} className="text-purple-600 text-xs font-bold hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Edit</Link>
                    <button onClick={() => handleUnassignLesson(lesson.id)} className="text-red-400 hover:text-red-600 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      Unassign
                    </button>
                  </div>
                </div>
              ))}
              {(cls.lessons || []).length === 0 && (
                <div className="bg-white/50 border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center text-slate-400">
                  No lessons assigned. Select from the bank →
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Lesson Bank</h2>
              <Link href="/teacher/lessons" className="text-purple-600 text-xs font-bold hover:underline">+ Create New</Link>
            </div>
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-50">
              {allLessons.filter(l => l.classId !== classId).map((l: any) => (
                <div key={l.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-slate-900 text-sm truncate">{l.title}</h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{l.difficulty} • {l.topic}</span>
                  </div>
                  <button 
                    disabled={assigningLesson}
                    onClick={() => handleAssignLesson(l.id)}
                    className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl text-xs font-bold transition-all border border-indigo-100"
                  >
                    Assign +
                  </button>
                </div>
              ))}
              {allLessons.filter(l => l.classId !== classId).length === 0 && (
                <div className="p-8 text-center text-slate-400 text-sm italic">
                  No unassigned lessons found.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
