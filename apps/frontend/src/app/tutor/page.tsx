"use client";

import 'regenerator-runtime/runtime';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Message {
  role: 'USER' | 'AI';
  content: string;
}

export default function TutorPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'AI', content: "Hi! I'm your AI English Tutor. Do you have any questions about grammar, pronunciation rules, or phrasing? Ask me anything!" }
  ]);
  const [inputText, setInputText] = useState("");
  const [aiThinking, setAiThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const dashboardLink = user?.role === 'TEACHER' ? '/teacher' : '/student';

  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiThinking]);

  // Sync spoken transcript to input text box
  useEffect(() => {
    if (transcript) setInputText(transcript);
  }, [transcript]);

  const sendMessage = async () => {
    const textToSend = inputText.trim();
    if (!textToSend) return;
    
    const userMsg: Message = { role: 'USER', content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    resetTranscript();
    setAiThinking(true);

    try {
      const data = await api.tutor.chat(textToSend, messages.filter(m => m.role === 'USER'));
      setMessages((prev) => [...prev, { role: 'AI', content: data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'AI', content: "Hmm, I am having trouble connecting to the Tutor microservice." }]);
    } finally {
      setAiThinking(false);
    }
  };

  const toggleMic = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      setInputText("");
      SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
    }
  };

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md border border-red-100">
          <h2 className="text-xl font-bold text-red-500 mb-3">Browser Not Supported</h2>
          <p className="text-slate-600 text-sm">Please use Google Chrome for speech interaction.</p>
          <Link href={dashboardLink} className="mt-4 inline-block text-pink-600 font-medium">← Back</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pink-50 flex flex-col">
      <nav className="bg-white border-b border-pink-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href={dashboardLink} className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <span className="text-white font-black text-sm">🤖</span>
            </div>
            <span className="font-bold text-slate-900">AI Tutor</span>
          </Link>
        </div>
        <Link href={dashboardLink} className="text-pink-600 text-sm font-medium hover:text-pink-800">Exit Tutor</Link>
      </nav>

      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full mt-4">
        {/* Messages Layout */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.role === 'USER' ? 'items-end' : 'items-start'}`}>
              <div className="flex gap-2 w-full max-w-[85%]">
                {msg.role === 'AI' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex flex-shrink-0 items-center justify-center text-white text-xs font-bold mt-1 shadow-sm">
                    AI
                  </div>
                )}
                <div
                  className={`rounded-3xl px-5 py-4 text-[15px] leading-relaxed max-w-full overflow-hidden ${
                    msg.role === 'USER'
                      ? 'bg-pink-600 text-white rounded-br-md ml-auto'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-md shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          ))}

          {aiThinking && (
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white text-xs font-bold mt-1 shadow-sm">AI</div>
              <div className="bg-white border border-slate-200 rounded-3xl rounded-bl-md px-5 py-4 shadow-sm h-[52px] flex items-center justify-center">
                <div className="flex gap-1.5 align-center justify-center m-auto">
                  <div className="w-2.5 h-2.5 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                  <div className="w-2.5 h-2.5 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <div className="w-2.5 h-2.5 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Action input box */}
        <div className="p-4 bg-transparent pb-8">
          <div className="flex items-center gap-2 bg-white rounded-full p-2 pr-3 shadow-lg border border-slate-200 relative">
            <button
               onClick={toggleMic}
               disabled={aiThinking}
               className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all shadow-sm flex-shrink-0 z-10 ${
                 listening ? 'bg-red-500 text-white animate-pulse' : 'bg-pink-100 text-pink-600 hover:bg-pink-200 disabled:opacity-50'
               }`}
             >
               {listening ? '⏹' : '🎤'}
             </button>
             <input 
               type="text" 
               className="flex-1 bg-transparent border-none outline-none text-slate-700 px-2 min-w-0" 
               placeholder="Chat with your tutor..." 
               value={inputText}
               onChange={(e) => setInputText(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
               disabled={aiThinking || listening}
             />
             <button
               onClick={sendMessage}
               disabled={aiThinking || !inputText.trim()}
               className="w-10 h-10 rounded-full bg-pink-600 hover:bg-pink-700 text-white flex items-center justify-center shadow-md disabled:opacity-50 transition-all flex-shrink-0"
             >
               ➤
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
