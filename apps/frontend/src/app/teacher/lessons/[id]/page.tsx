"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function LessonDetailPage() {
  const params = useParams();
  const lessonId = params?.id as string;
  const { logout } = useAuth();
  
  const [lesson, setLesson] = useState<any>(null);
  const [allExercises, setAllExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!lessonId) return;
    
    Promise.all([
      api.lessons.get(lessonId),
      api.exercises.list()
    ]).then(([lessonData, exercisesData]) => {
      setLesson(lessonData);
      setAllExercises(exercisesData.filter((e:any) => !e.lessonId || e.lessonId === lessonId));
    }).catch(err => {
      console.error(err);
    }).finally(() => {
      setLoading(false);
    });
  }, [lessonId]);

  const toggleExercise = async (ex: any) => {
    setUpdating(true);
    try {
      const isRemoving = ex.lessonId === lessonId;
      await api.exercises.update(ex.id, {
        ...ex,
        lessonId: isRemoving ? null : lessonId
      });
      // Refresh
      const updatedExercises = await api.exercises.list();
      setAllExercises(updatedExercises.filter((e:any) => !e.lessonId || e.lessonId === lessonId));
      const updatedLesson = await api.lessons.get(lessonId);
      setLesson(updatedLesson);
    } catch (err) {
      alert('Failed to update exercise');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading lesson details...</div>;
  if (!lesson) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Lesson not found.</div>;

  const currentExercises = lesson.exercises || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <Link href="/teacher/lessons" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <span className="text-white font-black text-sm">E</span>
          </div>
          <span className="font-bold text-slate-900">Lesson Builder</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/teacher/lessons" className="text-slate-500 text-sm font-medium hover:text-slate-900">← Lessons</Link>
          <button onClick={logout} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600">↩</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-purple-100 text-purple-700 border border-purple-200 rounded-full text-xs font-bold uppercase tracking-widest">
                {lesson.difficulty}
              </span>
              <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">{lesson.topic}</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">{lesson.title}</h1>
            <p className="text-slate-500 mt-1 max-w-2xl">{lesson.description || 'No description provided'}</p>
          </div>
          <Link href="/teacher/exercises" className="px-5 py-3 bg-white border border-slate-200 hover:border-purple-300 rounded-2xl text-slate-700 font-semibold transition-all">
            + Create New Exercise
          </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Exercises */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center justify-between">
              Assigned to Lesson
              <span className="text-xs font-normal text-slate-400">{currentExercises.length} items</span>
            </h2>
            <div className="space-y-3">
              {currentExercises.map((ex: any) => (
                <div key={ex.id} className="bg-white p-4 rounded-2xl border border-purple-200 shadow-sm flex items-center justify-between group">
                  <div>
                    <h4 className="font-semibold text-slate-900">{ex.title}</h4>
                    <p className="text-xs text-slate-500 truncate max-w-xs">&ldquo;{ex.targetText}&rdquo;</p>
                  </div>
                  <button 
                    disabled={updating}
                    onClick={() => toggleExercise(ex)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {currentExercises.length === 0 && (
                <div className="bg-white/50 border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center text-slate-400">
                  No exercises assigned yet. Select from the bank or create new ones.
                </div>
              )}
            </div>
          </section>

          {/* Exercise Bank */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center justify-between">
              Exercise Bank
              <span className="text-xs font-normal text-slate-400">Unassigned or relevant</span>
            </h2>
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-50">
              {allExercises.filter(e => !e.lessonId).map((ex: any) => (
                <div key={ex.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-slate-900 text-sm truncate">{ex.title}</h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{ex.difficulty} • {ex.type}</span>
                  </div>
                  <button 
                    disabled={updating}
                    onClick={() => toggleExercise(ex)}
                    className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl text-xs font-bold transition-all border border-indigo-100"
                  >
                    Add +
                  </button>
                </div>
              ))}
              {allExercises.filter(e => !e.lessonId).length === 0 && (
                <div className="p-8 text-center text-slate-400 text-sm italic">
                  No unassigned exercises found.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
