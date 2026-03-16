"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      // Redirect based on role happens in auth context
      const stored = localStorage.getItem('elsa_token');
      if (stored) {
        const decoded: any = JSON.parse(atob(stored.split('.')[1]));
        router.push(decoded.role === 'TEACHER' ? '/teacher' : '/student');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xl font-black">E</span>
            </div>
            <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              ELSA Learn
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mt-6">Welcome back</h1>
          <p className="text-slate-500 mt-2">Sign in to continue practicing</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8">
          {/* Demo credentials hint */}
          <div className="mb-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-sm">
            <p className="font-semibold text-indigo-700 mb-1">Demo accounts:</p>
            <p className="text-indigo-600">🎓 Student: <code className="bg-indigo-100 px-1 rounded">alex@elsa.com</code> / <code className="bg-indigo-100 px-1 rounded">student123</code></p>
            <p className="text-indigo-600 mt-1">👩‍🏫 Teacher: <code className="bg-indigo-100 px-1 rounded">teacher@elsa.com</code> / <code className="bg-indigo-100 px-1 rounded">teacher123</code></p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
              id="login-btn"
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-300 disabled:to-slate-300 text-white font-bold text-lg transition-all shadow-lg shadow-indigo-600/20 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-slate-500 text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-indigo-600 hover:text-indigo-700 font-semibold">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
