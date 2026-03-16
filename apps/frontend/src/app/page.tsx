"use client";

import Link from "next/link";

const FEATURES = [
  { icon: "🎤", title: "Pronunciation AI", desc: "Real-time phoneme analysis with word-by-word feedback on every syllable you speak." },
  { icon: "🤖", title: "AI Conversations", desc: "Practice with an AI across 8 real-life scenarios: restaurants, interviews, travel and more." },
  { icon: "📊", title: "Progress Analytics", desc: "Track your score trends, fluency, intonation, and word stress over time." },
  { icon: "👩‍🏫", title: "Teacher Tools", desc: "Create classes, assign lessons, build exercises, and monitor every student's progress." },
  { icon: "📚", title: "Exercise Library", desc: "100+ ready-to-use exercises across beginner, intermediate, and advanced levels." },
  { icon: "🎯", title: "Targeted Practice", desc: "Focus on specific topics: business English, travel, medical, social conversations and more." },
];

const STATS = [
  { value: "100+", label: "Speaking Exercises" },
  { value: "8", label: "AI Scenarios" },
  { value: "3", label: "Difficulty Levels" },
  { value: "∞", label: "Practice Sessions" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 text-slate-900">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
            <span className="text-white text-xl font-black">E</span>
          </div>
          <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            ELSA Learn
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" id="login-link" className="px-4 py-2 text-slate-600 hover:text-indigo-600 font-semibold text-sm transition-colors">
            Sign In
          </Link>
          <Link href="/auth/register" id="register-link" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow-indigo-600/20">
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-12 pb-20 text-center">
        <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold mb-6 border border-indigo-200 animate-fade-in-up">
          🚀 AI-Powered English Speaking Platform
        </div>
        <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight leading-tight animate-fade-in-up">
          Speak English with{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">
            Absolute Confidence
          </span>
        </h1>
        <p className="text-slate-600 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10 animate-fade-in-up">
          Get real-time AI feedback on every word. Practice pronunciation, fluency, and conversational English through intelligent, personalized exercises.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up">
          <Link
            href="/auth/register"
            id="hero-cta"
            className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-lg transition-all shadow-xl shadow-indigo-600/20 hover:-translate-y-0.5 inline-flex items-center gap-2 justify-center"
          >
            Start Learning Free
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <Link
            href="/practice/demo"
            className="px-8 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-lg border border-slate-200 hover:border-slate-300 transition-all inline-flex items-center gap-2 justify-center"
          >
            🎤 Try Demo (No signup)
          </Link>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-8 justify-center mt-16">
          {STATS.map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl font-black text-slate-900">{s.value}</div>
              <div className="text-slate-500 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything you need to speak English fluently</h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">A complete platform for students and teachers, powered by cutting-edge AI technology.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                {f.icon}
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-10 text-center text-white shadow-2xl shadow-indigo-600/20">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to transform your English?</h2>
          <p className="text-indigo-200 text-lg mb-8 max-w-xl mx-auto">
            Join thousands of learners improving their pronunciation with AI feedback.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register?role=STUDENT"
              className="px-8 py-4 rounded-2xl bg-white text-indigo-700 font-bold text-lg hover:bg-indigo-50 transition-all shadow-lg"
            >
              🎓 I&apos;m a Student
            </Link>
            <Link
              href="/auth/register?role=TEACHER"
              className="px-8 py-4 rounded-2xl bg-indigo-500/50 text-white font-bold text-lg hover:bg-indigo-500/70 border border-white/30 transition-all"
            >
              👩‍🏫 I&apos;m a Teacher
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 text-center text-slate-400 text-sm">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xs font-black">E</span>
            </div>
            <span className="font-semibold text-slate-600">ELSA Learn</span>
          </div>
          <p>Built with Next.js, Node.js, PostgreSQL & AI · Running locally on localhost</p>
          <div className="flex gap-4">
            <Link href="/auth/login" className="hover:text-slate-700 transition-colors">Login</Link>
            <Link href="/auth/register" className="hover:text-slate-700 transition-colors">Register</Link>
            <Link href="/practice/demo" className="hover:text-slate-700 transition-colors">Demo</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
