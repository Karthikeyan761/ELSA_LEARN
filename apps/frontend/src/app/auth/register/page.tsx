"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams?.get('role')?.toUpperCase() === 'TEACHER' ? 'TEACHER' : 'STUDENT';
  
  const [form, setForm] = useState({ name: '', email: '', password: '', role: initialRole });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(form.email, form.password, form.name, form.role);
      router.push(form.role === 'TEACHER' ? '/teacher' : '/student');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xl font-black">E</span>
            </div>
            <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              ELSA Learn
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mt-6">Create your account</h1>
          <p className="text-slate-500 mt-2">Start your English journey today</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8">
          {/* Role Selector */}
          <div className="flex gap-3 mb-6 bg-slate-100 p-1.5 rounded-2xl">
            {['STUDENT', 'TEACHER'].map((r) => (
              <button
                key={r}
                type="button"
                id={`role-${r.toLowerCase()}`}
                onClick={() => setForm((f) => ({ ...f, role: r }))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  form.role === r
                    ? r === 'STUDENT'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                      : 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white'
                }`}
              >
                {r === 'STUDENT' ? '🎓 Student' : '👩‍🏫 Teacher'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Alex Rivera"
                required
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-900 placeholder:text-slate-400 bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-900 placeholder:text-slate-400 bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Min 6 characters"
                required
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-900 placeholder:text-slate-400 bg-slate-50"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
                ⚠️ {error}
              </div>
            )}

            <button
              id="register-btn"
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-2xl text-white font-bold text-lg transition-all shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 ${
                form.role === 'STUDENT'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-600/20'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-purple-600/20'
              }`}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-slate-500 text-sm">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
