"use client";

import 'regenerator-runtime/runtime';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Scenario {
  id: string;
  title: string;
  opening: string;
}

interface Message {
  role: 'USER' | 'AI';
  content: string;
  score?: number;
}

const SCENARIO_EMOJIS: Record<string, string> = {
  restaurant: '🍽️',
  interview: '💼',
  travel: '✈️',
  daily: '☀️',
  business: '📊',
  doctor: '🏥',
  shopping: '🛍️',
  hotel: '🏨',
};

export default function ConversationPage() {
  const { logout } = useAuth();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

  useEffect(() => {
    api.conversations.scenarios()
      .then(setScenarios)
      .catch(() => {});
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiThinking]);

  const startConversation = async (scenario: Scenario) => {
    setStarting(true);
    setSelectedScenario(scenario);
    setMessages([]);
    setConversationId(null);
    try {
      const conv = await api.conversations.start(scenario.id);
      setConversationId(conv.id);
      setMessages(conv.messages || [{ role: 'AI', content: scenario.opening }]);
    } catch {
      setMessages([{ role: 'AI', content: scenario.opening }]);
    } finally {
      setStarting(false);
    }
  };

  const sendMessage = async () => {
    if (!transcript.trim()) return;
    const userMsg: Message = { role: 'USER', content: transcript };
    setMessages((prev) => [...prev, userMsg]);
    const msgText = transcript;
    resetTranscript();
    SpeechRecognition.stopListening();
    setAiThinking(true);

    try {
      let reply = '';
      if (conversationId) {
        const data = await api.conversations.message(conversationId, msgText);
        reply = data.reply;
      } else {
        // Fallback local response
        reply = "I understand. Could you tell me more about that?";
      }
      setMessages((prev) => [...prev, { role: 'AI', content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'AI', content: "I'm here — could you repeat that?" }]);
    } finally {
      setAiThinking(false);
    }
  };

  const endConversation = () => {
    setSelectedScenario(null);
    setConversationId(null);
    setMessages([]);
    resetTranscript();
    SpeechRecognition.stopListening();
  };

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md border border-red-100">
          <h2 className="text-xl font-bold text-red-500 mb-3">Browser Not Supported</h2>
          <p className="text-slate-600 text-sm">Please use Google Chrome for speech recognition.</p>
          <Link href="/student" className="mt-4 inline-block text-indigo-600 font-medium">← Back</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/student" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <span className="text-white font-black text-sm">E</span>
            </div>
            <span className="font-bold text-slate-900">AI Conversations</span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/library" className="text-slate-500 text-sm font-medium hover:text-slate-900">Library</Link>
          {selectedScenario && (
            <button onClick={endConversation} className="px-4 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 text-sm font-semibold hover:bg-red-100 transition-all">
              End Chat
            </button>
          )}
          <button onClick={logout} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600">↩</button>
        </div>
      </nav>

      {!selectedScenario ? (
        /* Scenario Selection */
        <div className="flex-1 max-w-4xl mx-auto w-full p-6 md:p-8">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-slate-900">AI Conversation Practice 🤖</h1>
            <p className="text-slate-500 mt-2">Choose a real-life scenario and practice speaking with AI</p>
          </div>

          {scenarios.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {['Restaurant', 'Interview', 'Travel', 'Daily Life', 'Business', 'Doctor', 'Shopping', 'Hotel'].map((s, i) => (
                <div key={i} className="h-40 bg-white rounded-3xl border border-slate-200 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {scenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  id={`scenario-${scenario.id}`}
                  onClick={() => startConversation(scenario)}
                  disabled={starting}
                  className="flex flex-col items-center gap-4 p-6 bg-white rounded-3xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group text-center disabled:opacity-60"
                >
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                    {SCENARIO_EMOJIS[scenario.id] || '💬'}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{scenario.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{scenario.opening.slice(0, 60)}...</p>
                  </div>
                  <span className="mt-auto px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 text-sm font-semibold group-hover:bg-indigo-600 group-hover:text-white transition-all border border-indigo-100 group-hover:border-indigo-600">
                    Start Chat
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="mt-8 bg-indigo-50 rounded-3xl p-6 border border-indigo-100">
            <h3 className="font-bold text-indigo-800 mb-2">How it works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { step: '1', title: 'Choose a scenario', desc: 'Pick from 8 real-life English situations', icon: '🎯' },
                { step: '2', title: 'Speak naturally', desc: 'Use the mic button to speak your response', icon: '🎤' },
                { step: '3', title: 'AI replies', desc: 'The AI responds and continues the conversation', icon: '🤖' },
              ].map((s) => (
                <div key={s.step} className="flex items-start gap-3">
                  <span className="text-2xl">{s.icon}</span>
                  <div>
                    <p className="font-semibold text-indigo-900">{s.title}</p>
                    <p className="text-indigo-600 text-sm">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Chat View */
        <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
          {/* Scenario Header */}
          <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-3">
            <span className="text-2xl">{SCENARIO_EMOJIS[selectedScenario.id] || '💬'}</span>
            <div>
              <h2 className="font-bold text-slate-900">{selectedScenario.title}</h2>
              <p className="text-xs text-slate-500">AI Conversation Practice</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'AI' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold mr-2 mt-1 flex-shrink-0">
                    AI
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-3xl px-5 py-3 text-sm leading-relaxed ${
                    msg.role === 'USER'
                      ? 'bg-indigo-600 text-white rounded-br-lg'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-lg shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {aiThinking && (
              <div className="flex justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold mr-2 mt-1">AI</div>
                <div className="bg-white border border-slate-200 rounded-3xl rounded-bl-lg px-5 py-4 shadow-sm">
                  <div className="flex gap-1.5">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-white border-t border-slate-200 p-4">
            {transcript && (
              <div className="bg-slate-50 rounded-2xl px-4 py-3 mb-3 text-slate-700 text-sm italic border border-slate-200">
                &ldquo;{transcript}&rdquo;
              </div>
            )}
            <div className="flex items-center gap-3">
              <button
                id="conv-record-btn"
                onClick={listening ? sendMessage : () => { resetTranscript(); SpeechRecognition.startListening({ continuous: false, language: 'en-US' }); }}
                disabled={aiThinking}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all shadow-lg flex-shrink-0 ${
                  listening
                    ? 'bg-red-500 text-white animate-pulse shadow-red-500/30'
                    : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-indigo-500/30 hover:scale-105 disabled:opacity-50'
                }`}
              >
                {listening ? '✅' : '🎤'}
              </button>
              <div className="flex-1 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-200 text-slate-500 text-sm">
                {listening ? 'Listening... tap ✅ to send' : 'Tap 🎤 to speak your response'}
              </div>
              {transcript && !listening && (
                <button
                  onClick={sendMessage}
                  disabled={aiThinking}
                  className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center text-xl shadow-lg disabled:opacity-50 transition-all"
                >
                  ➤
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
