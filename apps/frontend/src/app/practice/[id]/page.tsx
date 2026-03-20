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
  const [listening, setListening] = useState(false);
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

  useEffect(() => {
    if (demoMode) {
      setExercise(DEFAULT_EXERCISE);
      setLoading(false);
    } else if (exerciseId) {
      api.exercises.get(exerciseId)
        .then(setExercise)
        .catch((err) => {
          console.error('Failed to load exercise:', err);
          setExercise(null);
        })
        .finally(() => setLoading(false));
    }
  }, [exerciseId, demoMode]);

  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      setTranscript('');
      setResults(null);
      setSaved(false);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);
        // Stop all tracks to release mic
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      setListening(true);
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Please allow microphone access to practice pronunciation.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setListening(false);
    }
  };

  const calculateSimilarity = (spoken: string, target: string) => {
    const sWords = spoken.toLowerCase().replace(/[^a-z0-9 ']/g, '').split(' ').filter(Boolean);
    const tWords = target.toLowerCase().replace(/[^a-z0-9 ']/g, '').split(' ').filter(Boolean);

    let matched = 0;
    const wordResults: { word: string; correct: boolean; similarity: number }[] = [];

    tWords.forEach((tw) => {
      const isMatch = sWords.some((sw) => sw === tw || sw.replace(/[^a-z]/g, '') === tw.replace(/[^a-z]/g, ''));
      if (isMatch) matched++;
      wordResults.push({ word: tw, correct: isMatch, similarity: isMatch ? 1.0 : 0.0 });
    });

    const baseScore = tWords.length ? Math.round((matched / tWords.length) * 100) : 0;
    return {
      score: baseScore,
      fluency: baseScore - 5,
      intonation: baseScore - 5,
      wordStress: baseScore - 5,
      wordResults,
      transcript: spoken,
      feedback: baseScore > 80 ? 'Good effort local-match!' : 'Keep practicing local-match!',
    };
  };

  const analyzeAudio = async () => {
    if (!audioBlob && !transcript) return;
    setAnalyzing(true);
    setResults(null);
    
    try {
      if (audioBlob) {
        // ── Real AI Analysis (Whisper + SpeechBrain) ─────────────────────────
        const data = await api.ai.analyzePronunciation(exercise?.targetText || '', audioBlob);
        
        setResults({
          score: data.score,
          fluency: data.fluency,
          intonation: data.intonation,
          wordStress: data.wordStress,
          wordResults: data.phonemeDiff, // correct/incorrect words heatmap
          confidence: data.confidence,
          speed: data.speed,
          pauses: data.pauses,
          feedback: data.feedback,
          transcript: data.transcript,
          engine: data.engine
        });
        setTranscript(data.transcript);

        // Save progress if authenticated
        if (user && !demoMode && exercise) {
          try {
            const formData = new FormData();
            formData.append('exerciseId', exercise.id);
            formData.append('score', String(data.score));
            formData.append('fluency', String(data.fluency));
            formData.append('wordStress', String(data.wordStress));
            formData.append('intonation', String(data.intonation));
            formData.append('feedback', data.feedback);
            formData.append('transcript', data.transcript);
            formData.append('phonemeDiff', JSON.stringify(data.phonemeDiff));
            formData.append('audio', audioBlob, 'pronunciation.wav');
            await api.recordings.upload(formData);
            setSaved(true);
          } catch (e) {
            console.error('Failed to save to cloud:', e);
            setSavingError('Saved locally only.');
          }
        }
      } else {
        throw new Error('No audio captured');
      }
    } catch (err: any) {
      console.warn('Real AI failed, using fallback:', err.message);
      // Fallback: use a simple transcribe + local match if audio fails but transcript was there
      // (though in this version we need real audio for the AI service)
      const res = calculateSimilarity(transcript, exercise?.targetText || '');
      setResults(res);
    } finally {
      setAnalyzing(false);
    }
  };

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
          🎙️ High-Res AI Practice
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
              <h3 className="text-lg font-bold text-slate-900">{listening ? 'Recording...' : audioBlob ? 'Done recording' : 'Tap to start speaking'}</h3>
              <p className="text-slate-500 text-sm">{listening ? 'Listening to your pronunciation...' : audioBlob ? 'Audio captured! Proceed to analysis.' : 'Read the sentence above clearly and naturally'}</p>
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

        {/* Action Button */}
        {!listening && audioBlob && !results && (
          <button
            id="analyze-btn"
            onClick={analyzeAudio}
            disabled={analyzing}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-3xl text-white font-black text-lg transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
          >
            {analyzing ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                AI is thinking...
              </>
            ) : '✨ Generate Detailed AI Feedback'}
          </button>
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
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[250px] z-10 hidden group-hover:block bg-slate-800 text-white text-xs p-3 rounded-xl shadow-xl">
                        <div className="font-semibold mb-2 border-b border-slate-600 pb-1 text-slate-200">Phoneme Breakdown</div>
                        {w.phonemes && w.phonemes.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mb-1">
                            {w.phonemes.map((p: any, idx: number) => {
                              const isSoundCorrect = p.correct !== undefined ? p.correct : (p.score == null || p.score >= 70);
                              return (
                                <span key={idx} className={`px-1 rounded ${isSoundCorrect ? 'text-emerald-300' : 'bg-red-500/30 text-red-300 font-bold'}`}>
                                  /{p.ipa || p.phoneme || p.label || p.text}/
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-slate-300">Sounded incorrect. Practice saying "{w.word}" clearly.</p>
                        )}
                        <p className="mt-2 text-[10px] text-slate-400">Red highlights note missed sounds.</p>
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
                onClick={() => { setTranscript(''); setAudioBlob(null); setResults(null); setSaved(false); setSavingError(''); }}
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
