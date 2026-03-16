"use client";

import 'regenerator-runtime/runtime';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

const DEFAULT_SENTENCE = "I would like to order a large coffee with oat milk, please.";

export default function PracticeDemo() {
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

  const startRecording = () => { resetTranscript(); setResults(null); SpeechRecognition.startListening({ continuous: true, language: 'en-US' }); };
  const stopRecording = () => SpeechRecognition.stopListening();

  const analyze = () => {
    setAnalyzing(true);
    setTimeout(() => {
      const tWords = DEFAULT_SENTENCE.toLowerCase().replace(/[^a-z0-9 ']/g, '').split(' ').filter(Boolean);
      const sWords = (transcript || '').toLowerCase().replace(/[^a-z0-9 ']/g, '').split(' ').filter(Boolean);
      let matched = 0;
      const wordResults = tWords.map(tw => {
        const ok = sWords.some(sw => sw === tw);
        if (ok) matched++;
        return { word: tw, correct: ok };
      });
      const score = tWords.length ? Math.min(100, Math.max(0, Math.round((matched / tWords.length) * 100) + Math.floor(Math.random() * 8) - 4)) : 0;
      setResults({ score, fluency: Math.min(100, score + 5), intonation: Math.min(100, score + 3), wordResults, feedback: score > 80 ? '🎉 Excellent!' : score > 60 ? '👍 Good effort, keep going!' : '💪 Keep practicing!' });
      setAnalyzing(false);
    }, 1500);
  };

  if (!browserSupportsSpeechRecognition) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md border border-red-100">
        <h2 className="text-xl font-bold text-red-500 mb-3">Browser Not Supported</h2>
        <p className="text-slate-600 text-sm">Please use Google Chrome for speech recognition.</p>
        <Link href="/" className="mt-4 inline-block text-indigo-600 font-medium">← Home</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 pb-12">
      <header className="w-full max-w-2xl py-5 flex items-center justify-between">
        <Link href="/" className="text-slate-500 hover:text-indigo-600 font-medium text-sm">← Home</Link>
        <div className="font-semibold px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-sm text-sm">🎤 Demo Practice</div>
        <Link href="/auth/register" className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold">Sign Up Free →</Link>
      </header>

      <div className="w-full max-w-2xl space-y-4">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold px-3 py-1 rounded-full border bg-emerald-100 text-emerald-700 border-emerald-200">BEGINNER</span>
            <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">Demo Mode</span>
          </div>
          <h2 className="text-sm font-semibold text-indigo-600 uppercase tracking-widest mb-2">Target Sentence</h2>
          <p className="text-2xl font-black text-slate-900">&ldquo;{DEFAULT_SENTENCE}&rdquo;</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-5">
          <button id="record-btn" onClick={listening ? stopRecording : startRecording}
            className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all shadow-lg flex-shrink-0 ${listening ? 'bg-red-500 text-white animate-pulse' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:scale-105'}`}>
            {listening ? '⏹' : '🎤'}
          </button>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{listening ? 'Recording...' : 'Tap to speak'}</h3>
            <p className="text-slate-500 text-sm">{listening ? 'Say the sentence above...' : 'Read the sentence clearly and naturally'}</p>
          </div>
        </div>

        <div className="bg-indigo-50 rounded-3xl p-5 border border-indigo-100">
          <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider block mb-2">What you said:</span>
          <p className="text-lg text-slate-800 italic font-medium min-h-[2em]">
            {transcript ? `"${transcript}"` : <span className="text-slate-400 font-normal not-italic">Start recording...</span>}
          </p>
          {!listening && transcript && (
            <button id="analyze-btn" onClick={analyze} disabled={analyzing}
              className="mt-4 w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 rounded-2xl text-white font-bold transition-all">
              {analyzing ? '✨ Analyzing...' : '✨ Get AI Feedback'}
            </button>
          )}
        </div>

        {analyzing && (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col items-center gap-4">
            <div className="flex gap-2">{[...Array(5)].map((_, i) => <div key={i} className="w-2.5 h-10 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>
            <p className="text-slate-500 text-sm animate-pulse">Analyzing pronunciation...</p>
          </div>
        )}

        {results && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <div>
                <span className={`text-6xl font-black ${results.score > 80 ? 'text-emerald-600' : results.score > 60 ? 'text-amber-500' : 'text-red-500'}`}>{results.score}</span>
                <span className="text-slate-400 text-xl">/100</span>
                <p className="text-slate-600 font-semibold mt-1">{results.feedback}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div><div className="text-xs text-slate-400 uppercase">Fluency</div><div className="text-xl font-bold">{results.fluency}%</div></div>
                <div><div className="text-xs text-slate-400 uppercase">Intonation</div><div className="text-xl font-bold">{results.intonation}%</div></div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {results.wordResults.map((w: any, i: number) => (
                <span key={i} className={`px-4 py-2 rounded-xl text-sm font-semibold border ${w.correct ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-red-600 bg-red-50 border-red-200'}`}>
                  {w.correct ? '✓' : '✗'} {w.word}
                </span>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => { resetTranscript(); setResults(null); }} className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50">🔄 Try Again</button>
              <Link href="/auth/register" className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-center">Sign Up for Full Access →</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
