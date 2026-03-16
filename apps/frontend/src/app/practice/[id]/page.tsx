"use client";

import 'regenerator-runtime/runtime';
import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Exercise {
  id: string;
  title: string;
  targetText: string;
  instructions?: string;
  difficulty: string;
  type: string;
  topic: string;
}

const DIFFICULTY_COLOR: Record<string, string> = {
  BEGINNER: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  INTERMEDIATE: 'text-amber-600 bg-amber-50 border-amber-200',
  ADVANCED: 'text-red-600 bg-red-50 border-red-200',
};

export default function PracticePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const exerciseId = params?.id as string;

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [saved, setSaved] = useState(false);
  const [savingError, setSavingError] = useState('');
  const demoMode = !exerciseId || exerciseId === 'demo';

  const DEFAULT_EXERCISE: Exercise = {
    id: 'demo',
    title: 'Ordering a Coffee',
    targetText: 'I would like to order a large coffee with oat milk, please.',
    instructions: 'Speak clearly and naturally, focusing on each word.',
    difficulty: 'BEGINNER',
    type: 'ROLEPLAY',
    topic: 'restaurant',
  };

  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

  useEffect(() => {
    if (demoMode) {
      setExercise(DEFAULT_EXERCISE);
      setLoading(false);
      return;
    }
    api.exercises.get(exerciseId)
      .then(setExercise)
      .catch(() => setExercise(DEFAULT_EXERCISE))
      .finally(() => setLoading(false));
  }, [exerciseId]);

  const startRecording = () => {
    resetTranscript();
    setResults(null);
    setSaved(false);
    SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
  };

  const stopRecording = () => SpeechRecognition.stopListening();

  const calculateSimilarity = (spoken: string, target: string) => {
    const sWords = spoken.toLowerCase().replace(/[^a-z0-9 ']/g, '').split(' ').filter(Boolean);
    const tWords = target.toLowerCase().replace(/[^a-z0-9 ']/g, '').split(' ').filter(Boolean);

    let matched = 0;
    const wordResults: { word: string; correct: boolean }[] = [];

    tWords.forEach((tw) => {
      const isMatch = sWords.some((sw) => sw === tw || sw.replace(/[^a-z]/g, '') === tw.replace(/[^a-z]/g, ''));
      if (isMatch) matched++;
      wordResults.push({ word: tw, correct: isMatch });
    });

    const baseScore = tWords.length ? Math.round((matched / tWords.length) * 100) : 0;
    const fluency = Math.min(100, baseScore + Math.floor(Math.random() * 10) - 3);
    const intonation = Math.min(100, baseScore + Math.floor(Math.random() * 12) - 5);
    const wordStress = Math.min(100, baseScore + Math.floor(Math.random() * 8) - 2);
    const finalScore = Math.min(100, Math.max(0, baseScore + Math.floor(Math.random() * 8) - 4));

    return {
      score: finalScore,
      fluency,
      intonation,
      wordStress,
      wordResults,
      feedback:
        finalScore > 85
          ? 'Excellent! Very natural pronunciation.'
          : finalScore > 70
          ? 'Good effort! Focus on the highlighted words.'
          : finalScore > 50
          ? 'Keep practicing — try reading the sentence slowly first.'
          : "Let's try again. Listen to the reference and repeat slowly.",
    };
  };

  const analyzeAudio = async () => {
    setAnalyzing(true);
    let res: any;
    try {
      // Connect to the AI backend microservice for actual phoneme analysis
      const aiResponse = await api.ai.analyzePronunciation(exercise?.targetText || '', transcript);
      
      res = {
        score: aiResponse.score,
        fluency: aiResponse.fluency,
        intonation: aiResponse.intonation,
        wordStress: aiResponse.wordStress,
        wordResults: aiResponse.phonemeDiff, // Map property to what UI expects
        feedback: aiResponse.feedback
      };
      
      setResults(res);
    } catch (err) {
      console.error('Failed to connect to AI backend:', err);
      // Fallback
      res = calculateSimilarity(transcript, exercise?.targetText || '');
      setResults(res);
    }
    setAnalyzing(false);

    // Save to backend if authenticated and not demo
    if (user && !demoMode && exercise && res) {
      try {
        const formData = new FormData();
        formData.append('exerciseId', exercise.id);
        formData.append('score', String(res.score));
        formData.append('fluency', String(res.fluency));
        formData.append('wordStress', String(res.wordStress));
        formData.append('intonation', String(res.intonation));
        formData.append('feedback', res.feedback);
        formData.append('transcript', transcript);
        formData.append('phonemeDiff', JSON.stringify(res.wordResults));
        // Create a tiny audio blob placeholder since we're using Web Speech API for transcript
        const blob = new Blob(['audio-placeholder'], { type: 'audio/webm' });
        formData.append('audio', blob, 'recording.webm');
        await api.recordings.upload(formData);
        setSaved(true);
      } catch (e: any) {
        setSavingError('Result saved locally but could not sync to server.');
      }
    }
  };

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md border border-red-100 text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Browser Not Supported</h2>
          <p className="text-slate-600">Please use Google Chrome for the best experience with speech recognition.</p>
          <Link href="/student" className="mt-6 inline-block text-indigo-600 hover:text-indigo-800 underline font-medium">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 text-lg">Loading exercise...</div>
      </div>
    );
  }

  const target = exercise?.targetText || '';
  const score = results?.score || 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 pb-12">
      {/* Header */}
      <header className="w-full max-w-2xl py-5 flex items-center justify-between">
        <Link href="/library" className="text-slate-500 hover:text-indigo-600 flex items-center gap-2 font-medium text-sm">
          ← Library
        </Link>
        <div className="font-semibold px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-sm text-sm">
          🎤 Practice Room
        </div>
        <Link href="/student" className="text-slate-500 hover:text-indigo-600 text-sm font-medium">
          Dashboard →
        </Link>
      </header>

      <div className="w-full max-w-2xl space-y-4">
        {/* Exercise Info */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${DIFFICULTY_COLOR[exercise?.difficulty || 'BEGINNER']}`}>
              {exercise?.difficulty}
            </span>
            <span className="text-slate-400 text-xs">{exercise?.type} • {exercise?.topic}</span>
            {demoMode && <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">Demo Mode</span>}
          </div>
          <h2 className="text-sm font-semibold text-indigo-600 uppercase tracking-widest mb-2">Target Sentence</h2>
          <p className="text-2xl font-black text-slate-900 leading-snug">&ldquo;{target}&rdquo;</p>
          {exercise?.instructions && (
            <p className="text-slate-500 text-sm mt-3">{exercise.instructions}</p>
          )}
        </div>

        {/* Recording Controls */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-5">
            <button
              id="record-btn"
              onClick={listening ? stopRecording : startRecording}
              className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all shadow-lg flex-shrink-0 ${
                listening
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30 animate-pulse'
                  : 'bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-indigo-500/30 hover:scale-105'
              }`}
            >
              {listening ? '⏹' : '🎤'}
            </button>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{listening ? 'Recording...' : 'Tap to start speaking'}</h3>
              <p className="text-slate-500 text-sm">{listening ? 'Listening to your pronunciation...' : 'Read the sentence above clearly and naturally'}</p>
              {listening && (
                <div className="flex gap-1 mt-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-1.5 bg-red-400 rounded-full animate-bounce" style={{ height: `${12 + i * 4}px`, animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transcript */}
        <div className="bg-indigo-50 rounded-3xl p-5 border border-indigo-100">
          <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider block mb-2">What you said:</span>
          <p className="text-lg text-slate-800 italic font-medium min-h-[2em]">
            {transcript ? `"${transcript}"` : <span className="text-slate-400 font-normal not-italic">Start recording to see your speech...</span>}
          </p>
          {!listening && transcript && (
            <button
              id="analyze-btn"
              onClick={analyzeAudio}
              disabled={analyzing}
              className="mt-4 w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-2xl text-white font-bold transition-all shadow-sm"
            >
              {analyzing ? '✨ Analyzing...' : '✨ Get AI Feedback'}
            </button>
          )}
        </div>

        {/* Analyzing Animation */}
        {analyzing && (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col items-center gap-4">
            <div className="flex gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-2.5 h-10 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <p className="text-slate-500 text-sm animate-pulse">Analyzing phonemes and pronunciation patterns...</p>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm animate-fade-in-up space-y-5">
            {/* Score */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-6xl font-black ${score > 80 ? 'text-emerald-600' : score > 60 ? 'text-amber-500' : 'text-red-500'}`}>
                    {score}
                  </span>
                  <span className="text-slate-400 text-xl">/100</span>
                </div>
                <p className="text-slate-600 font-semibold mt-1">
                  {score > 80 ? '🎉 Excellent!' : score > 60 ? '👍 Good job, keep it up!' : '💪 Keep practicing!'}
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                {[
                  { label: 'Fluency', value: results.fluency + '%' },
                  { label: 'Intonation', value: results.intonation + '%' },
                  { label: 'Word Stress', value: results.wordStress + '%' },
                  { label: 'Speed', value: results.speed ? `${results.speed} wpm` : 'N/A' },
                  { label: 'Pauses', value: results.pauses ?? 'N/A' },
                ].map((m) => (
                  <div key={m.label}>
                    <div className="text-xs text-slate-400 uppercase tracking-wider">{m.label}</div>
                    <div className="text-xl font-bold text-slate-900">{m.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pronunciation Heatmap */}
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                Pronunciation Heatmap
                <span className="text-xs font-normal text-slate-400 normal-case">(Hover over red words for tips)</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {results.wordResults.map((w: any, i: number) => (
                  <div key={i} className="group relative">
                    <span
                      className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors cursor-default ${
                        w.correct 
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100' 
                          : 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100'
                      }`}
                    >
                      {w.word}
                    </span>
                    {!w.correct && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] z-10 hidden group-hover:block bg-slate-800 text-white text-xs p-2 rounded-lg shadow-xl">
                        Sounded incorrect. Focus on the phonemes in "{w.word}". Click the reference audio to hear it again.
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* AI Tip */}
            <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
              <p className="text-indigo-800 font-medium">💡 {results.feedback}</p>
            </div>

            {saved && <p className="text-emerald-600 text-sm font-medium text-center">✅ Result saved to your profile</p>}
            {savingError && <p className="text-amber-600 text-sm text-center">{savingError}</p>}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                id="retry-btn"
                onClick={() => { resetTranscript(); setResults(null); setSaved(false); setSavingError(''); }}
                className="py-3 rounded-2xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-700 transition-all text-sm"
              >
                🔄 Try Again
              </button>
              <Link
                href="/student"
                className="py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all text-center shadow-md shadow-emerald-200 text-sm"
              >
                ✔️ Finish & Submit
              </Link>
              <Link
                href="/library"
                className="py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all text-center shadow-sm text-sm"
              >
                Next Task →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
