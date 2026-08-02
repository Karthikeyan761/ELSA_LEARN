export const DEMO_MODE = true; // Set to false to reconnect to the real backend

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// ── Mock Data Structures for DEMO_MODE ────────────────────────────────

const mockExercises: any[] = [
  { id: 'ex-1', title: 'Greeting a Friend', type: 'SENTENCE', difficulty: 'BEGINNER', targetText: "Hello my friend, how have you been lately?", topic: 'general', instructions: 'Pronounce clearly with rising intonation.' },
  { id: 'ex-2', title: 'Ordering Coffee', type: 'SENTENCE', difficulty: 'BEGINNER', targetText: "I would like to order a large hot latte with oat milk please.", topic: 'restaurant', instructions: 'Stress the nouns like Coffee, Latte, Milk.' },
  { id: 'ex-3', title: 'Introducing Yourself', type: 'SENTENCE', difficulty: 'INTERMEDIATE', targetText: "Good morning everyone, my name is Alex and I am the new project manager.", topic: 'business', instructions: 'Keep a steady and confident tone.' },
  { id: 'ex-4', title: 'Asking for Directions', type: 'SENTENCE', difficulty: 'INTERMEDIATE', targetText: "Excuse me, could you please tell me where the nearest subway station is?", topic: 'general', instructions: 'Focus on clear pronunciation of "excuse" and "subway".' },
  { id: 'ex-5', title: 'Giving a Presentation', type: 'PARAGRAPH', difficulty: 'ADVANCED', targetText: "Today, we are going to explore our brand new product scaling strategies. By leveraging microservices, we can build highly resilient systems that handle Millions of active requests seamlessly.", topic: 'business', instructions: 'Pay close attention to breathing pauses.' }
];

const mockProgressData: any[] = [
  { exerciseId: 'ex-1', completed: true, bestScore: 92, attempts: 2 },
  { exerciseId: 'ex-2', completed: false, bestScore: 0, attempts: 0 },
  { exerciseId: 'ex-3', completed: true, bestScore: 84, attempts: 1 },
  { exerciseId: 'ex-4', completed: false, bestScore: 0, attempts: 0 }
];

const mockLessons: any[] = [
  {
    id: 'lesson-1',
    title: 'Daily Conversations',
    difficulty: 'BEGINNER',
    topic: 'general',
    exercises: [
      { id: 'ex-1', title: 'Greeting a Friend', type: 'SENTENCE', difficulty: 'BEGINNER', targetText: "Hello my friend, how have you been lately?" },
      { id: 'ex-2', title: 'Ordering Coffee', type: 'SENTENCE', difficulty: 'BEGINNER', targetText: "I would like to order a large hot latte with oat milk please." }
    ]
  },
  {
    id: 'lesson-2',
    title: 'Business English Basics',
    difficulty: 'INTERMEDIATE',
    topic: 'business',
    exercises: [
      { id: 'ex-3', title: 'Introducing Yourself', type: 'SENTENCE', difficulty: 'INTERMEDIATE', targetText: "Good morning everyone, my name is Alex and I am the new project manager." },
      { id: 'ex-4', title: 'Asking for Directions', type: 'SENTENCE', difficulty: 'INTERMEDIATE', targetText: "Excuse me, could you please tell me where the nearest subway station is?" }
    ]
  }
];

const mockRecordings: any[] = [
  { id: 'rec-1', exerciseId: 'ex-1', score: 92, fluency: 88, intonation: 95, wordStress: 90, createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'rec-2', exerciseId: 'ex-3', score: 84, fluency: 80, intonation: 82, wordStress: 86, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'rec-3', exerciseId: 'ex-1', score: 88, fluency: 85, intonation: 90, wordStress: 88, createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
];

const mockClasses: any[] = [
  {
    id: 'mock-class-id',
    name: 'Advanced English A',
    description: 'Interactive pronunciation and conversation class',
    teacherId: 'mock-teacher-id',
    students: [
      { id: 'student-1', user: { name: 'Alex Student', email: 'alex@elsa.com' }, score: 88, streak: 5, xp: 1200 },
      { id: 'student-2', user: { name: 'Jane Doe', email: 'jane@elsa.com' }, score: 79, streak: 3, xp: 950 }
    ],
    lessons: [
      {
        id: 'lesson-1',
        title: 'Daily Conversations',
        difficulty: 'BEGINNER',
        topic: 'general',
        exercises: [
          { id: 'ex-1', title: 'Greeting a Friend', type: 'SENTENCE', difficulty: 'BEGINNER' },
          { id: 'ex-2', title: 'Ordering Coffee', type: 'SENTENCE', difficulty: 'BEGINNER' }
        ]
      }
    ]
  }
];

const mockScenarios: any[] = [
  { id: 'restaurant', title: 'Ordering in a Restaurant', opening: 'Hello! Welcome to the Bistro. Are you ready to order?' },
  { id: 'interview', title: 'Job Interview Practice', opening: 'Welcome! Thank you for coming today. Could you start by introducing yourself and sharing your background?' },
  { id: 'travel', title: 'Airport Check-in', opening: 'Good day. May I see your ticket and passport, please?' },
  { id: 'daily', title: 'Chatting with a Friend', opening: 'Hey! I haven\'t seen you in a while. What have you been up to lately?' },
  { id: 'business', title: 'Meeting Presentation', opening: 'Thanks for joining. Can everyone hear me clearly? Let\'s get started with our quarterly performance.' },
  { id: 'doctor', title: 'At the Doctor\'s Office', opening: 'Hello, what brings you in today? How are you feeling?' },
  { id: 'shopping', title: 'Buying Clothes', opening: 'Hi there! Let me know if you need help finding a different size or color.' },
  { id: 'hotel', title: 'Hotel Reception Desk', opening: 'Welcome to the Grand Hotel. Do you have a reservation under your name?' }
];

const mockConversations: any[] = [];

// ── Original API Utilities ───────────────────────────────────────────

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('elsa_token');
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

async function apiFetchMultipart(path: string, formData: FormData): Promise<any> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers, body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
}

// ── Exports ──────────────────────────────────────────────────────────

export const api = {
  auth: {
    login: async (email: string, password: string) => {
      if (DEMO_MODE) {
        if (email === 'admin@elsa.com' && password !== 'admin123') {
          throw new Error('Invalid credentials. For admin demo, use admin123.');
        }
        const role = (email === 'teacher@elsa.com') ? 'TEACHER' : 'STUDENT';
        const name = email === 'admin@elsa.com' ? 'Admin User' : (email === 'teacher@elsa.com' ? 'Teacher User' : 'Alex Student');
        const user = {
          id: role === 'TEACHER' ? 'mock-teacher-id' : 'mock-student-id',
          email,
          name,
          role
        };
        const token = "mockheader." + btoa(JSON.stringify(user)) + ".mocksignature";
        return { user, token };
      }
      return apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    },
    register: async (email: string, password: string, name: string, role: string) => {
      if (DEMO_MODE) {
        const user = { id: `mock-${Date.now()}`, email, name, role };
        const token = "mockheader." + btoa(JSON.stringify(user)) + ".mocksignature";
        return { user, token };
      }
      return apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name, role }) });
    },
    me: async () => {
      if (DEMO_MODE) {
        const token = getToken();
        let userPayload: any = null;
        try {
          if (token) {
            userPayload = JSON.parse(atob(token.split('.')[1]));
          }
        } catch (e) {}

        const email = userPayload?.email || 'admin@elsa.com';
        const role = userPayload?.role || 'STUDENT';
        const name = userPayload?.name || 'Admin User';
        const userId = userPayload?.id || 'mock-student-id';

        if (role === 'TEACHER') {
          return {
            id: userId,
            email,
            name,
            role,
            teacherProfile: {
              id: 'mock-teacher-profile-id',
              userId
            }
          };
        } else {
          return {
            id: userId,
            email,
            name,
            role,
            studentProfile: {
              id: 'mock-student-profile-id',
              userId,
              score: 85,
              lessonsDone: mockProgressData.filter(p => p.completed).length,
              practiceMin: 45,
              streak: 5,
              xp: 1250,
              classId: 'mock-class-id',
              class: {
                id: 'mock-class-id',
                name: 'Advanced English A',
                description: 'Interactive pronunciation and conversation class',
                lessons: mockLessons
              },
              progress: mockProgressData
            }
          };
        }
      }
      return apiFetch('/auth/me');
    },
  },
  exercises: {
    list: async (params?: { difficulty?: string; type?: string; topic?: string; search?: string }) => {
      if (DEMO_MODE) {
        let list = [...mockExercises];
        if (params) {
          if (params.difficulty) list = list.filter(e => e.difficulty === params.difficulty);
          if (params.type) list = list.filter(e => e.type === params.type);
          if (params.topic) list = list.filter(e => e.topic === params.topic);
          if (params.search) {
            const s = params.search.toLowerCase();
            list = list.filter(e => e.title.toLowerCase().includes(s) || e.targetText.toLowerCase().includes(s));
          }
        }
        return list;
      }
      const qs = new URLSearchParams(params as any).toString();
      return apiFetch(`/exercises${qs ? '?' + qs : ''}`);
    },
    get: async (id: string) => {
      if (DEMO_MODE) {
        return mockExercises.find(e => e.id === id) || mockExercises[0];
      }
      return apiFetch(`/exercises/${id}`);
    },
    create: async (data: any) => {
      if (DEMO_MODE) {
        const newEx = { id: `ex-${Date.now()}`, ...data };
        mockExercises.push(newEx);
        return newEx;
      }
      return apiFetch('/exercises', { method: 'POST', body: JSON.stringify(data) });
    },
    update: async (id: string, data: any) => {
      if (DEMO_MODE) {
        const idx = mockExercises.findIndex(e => e.id === id);
        if (idx !== -1) {
          mockExercises[idx] = { ...mockExercises[idx], ...data };
          return mockExercises[idx];
        }
        return { id, ...data };
      }
      return apiFetch(`/exercises/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    delete: async (id: string) => {
      if (DEMO_MODE) {
        const idx = mockExercises.findIndex(e => e.id === id);
        if (idx !== -1) mockExercises.splice(idx, 1);
        return { success: true };
      }
      return apiFetch(`/exercises/${id}`, { method: 'DELETE' });
    },
    progress: async (id: string) => {
      if (DEMO_MODE) {
        return mockProgressData.find(p => p.exerciseId === id) || { exerciseId: id, completed: false, bestScore: 0, attempts: 0 };
      }
      return apiFetch(`/exercises/${id}/progress`);
    },
  },
  recordings: {
    upload: async (formData: FormData) => {
      if (DEMO_MODE) {
        const exId = formData.get('exerciseId') as string || 'ex-1';
        const score = parseInt(formData.get('score') as string) || 85;
        const fluency = parseInt(formData.get('fluency') as string) || 80;
        const intonation = parseInt(formData.get('intonation') as string) || 82;
        const wordStress = parseInt(formData.get('wordStress') as string) || 88;
        
        const newRec = {
          id: `rec-${Date.now()}`,
          exerciseId: exId,
          score,
          fluency,
          intonation,
          wordStress,
          createdAt: new Date().toISOString()
        };
        mockRecordings.push(newRec);

        // Update progress
        const prog = mockProgressData.find(p => p.exerciseId === exId);
        if (prog) {
          prog.completed = true;
          prog.attempts += 1;
          prog.bestScore = Math.max(prog.bestScore, score);
        } else {
          mockProgressData.push({
            exerciseId: exId,
            completed: true,
            attempts: 1,
            bestScore: score
          });
        }
        return { success: true, recording: newRec };
      }
      return apiFetchMultipart('/recordings/upload', formData);
    },
    my: async () => {
      if (DEMO_MODE) {
        return mockRecordings;
      }
      return apiFetch('/recordings/my');
    },
    stats: async () => {
      if (DEMO_MODE) {
        return mockRecordings;
      }
      return apiFetch('/recordings/stats');
    },
  },
  classes: {
    list: async () => {
      if (DEMO_MODE) {
        return mockClasses;
      }
      return apiFetch('/classes');
    },
    get: async (id: string) => {
      if (DEMO_MODE) {
        return mockClasses.find(c => c.id === id) || mockClasses[0];
      }
      return apiFetch(`/classes/${id}`);
    },
    create: async (data: { name: string; description?: string }) => {
      if (DEMO_MODE) {
        const newC = {
          id: `class-${Date.now()}`,
          name: data.name,
          description: data.description,
          teacherId: 'mock-teacher-id',
          students: [
            { id: 'student-1', user: { name: 'Alex Student', email: 'alex@elsa.com' }, score: 88, streak: 5, xp: 1200 }
          ],
          lessons: []
        };
        mockClasses.push(newC);
        return newC;
      }
      return apiFetch('/classes', { method: 'POST', body: JSON.stringify(data) });
    },
    enroll: async (id: string) => {
      if (DEMO_MODE) {
        const cls = mockClasses.find(c => c.id === id);
        if (!cls) throw new Error('Class not found');
        return { success: true };
      }
      return apiFetch(`/classes/${id}/enroll`, { method: 'POST' });
    },
    unenroll: async (id: string) => {
      if (DEMO_MODE) {
        return { success: true };
      }
      return apiFetch(`/classes/${id}/unenroll`, { method: 'POST' });
    },
    addStudent: async (classId: string, email: string) => {
      if (DEMO_MODE) {
        const cls = mockClasses.find(c => c.id === classId);
        if (!cls) throw new Error('Class not found');
        const newStudent = {
          id: `student-${Date.now()}`,
          user: { name: email.split('@')[0], email },
          score: 75,
          streak: 1,
          xp: 100
        };
        cls.students.push(newStudent);
        return { success: true };
      }
      return apiFetch(`/classes/${classId}/add-student`, { method: 'POST', body: JSON.stringify({ email }) });
    },
    removeStudent: async (classId: string, studentId: string) => {
      if (DEMO_MODE) {
        const cls = mockClasses.find(c => c.id === classId);
        if (!cls) throw new Error('Class not found');
        cls.students = cls.students.filter((s: any) => s.id !== studentId);
        return { success: true };
      }
      return apiFetch(`/classes/${classId}/students/${studentId}`, { method: 'DELETE' });
    },
    assignLesson: async (classId: string, lessonId: string) => {
      if (DEMO_MODE) {
        const cls = mockClasses.find(c => c.id === classId);
        const lesson = mockLessons.find(l => l.id === lessonId);
        if (cls && lesson) {
          if (!cls.lessons.some((l: any) => l.id === lessonId)) {
            cls.lessons.push(lesson);
          }
        }
        return { success: true };
      }
      return apiFetch(`/classes/${classId}/lessons`, { method: 'POST', body: JSON.stringify({ lessonId }) });
    },
    analytics: async (id: string) => {
      if (DEMO_MODE) {
        return {
          averageScore: 83.5,
          totalXP: 2150,
          lessonCompletionRate: 65,
          recentActivity: [
            { studentName: 'Alex Student', exerciseTitle: 'Greeting a Friend', score: 92, date: new Date().toISOString() },
            { studentName: 'Jane Doe', exerciseTitle: 'Greeting a Friend', score: 79, date: new Date(Date.now() - 86400000).toISOString() }
          ]
        };
      }
      return apiFetch(`/classes/${id}/analytics`);
    },
  },
  lessons: {
    list: async (params?: { classId?: string; difficulty?: string; topic?: string }) => {
      if (DEMO_MODE) {
        let list = [...mockLessons];
        if (params) {
          if (params.difficulty) list = list.filter(l => l.difficulty === params.difficulty);
          if (params.topic) list = list.filter(l => l.topic === params.topic);
        }
        return list;
      }
      const qs = new URLSearchParams(params as any).toString();
      return apiFetch(`/lessons${qs ? '?' + qs : ''}`);
    },
    get: async (id: string) => {
      if (DEMO_MODE) {
        return mockLessons.find(l => l.id === id) || mockLessons[0];
      }
      return apiFetch(`/lessons/${id}`);
    },
    create: async (data: any) => {
      if (DEMO_MODE) {
        const newL = { id: `lesson-${Date.now()}`, exercises: [], ...data };
        mockLessons.push(newL);
        return newL;
      }
      return apiFetch('/lessons', { method: 'POST', body: JSON.stringify(data) });
    },
    update: async (id: string, data: any) => {
      if (DEMO_MODE) {
        const idx = mockLessons.findIndex(l => l.id === id);
        if (idx !== -1) {
          mockLessons[idx] = { ...mockLessons[idx], ...data };
          return mockLessons[idx];
        }
        return { id, ...data };
      }
      return apiFetch(`/lessons/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
  },
  progress: {
    my: async () => {
      if (DEMO_MODE) {
        return {
          progress: mockProgressData.map(p => ({
            ...p,
            exercise: mockExercises.find(e => e.id === p.exerciseId)
          }))
        };
      }
      return apiFetch('/progress/my');
    },
    dashboard: async () => {
      if (DEMO_MODE) {
        const user = await api.auth.me();
        return {
          user,
          recentRecordings: mockRecordings
        };
      }
      return apiFetch('/progress/dashboard');
    },
    teacherDashboard: async () => {
      if (DEMO_MODE) {
        return {
          classes: mockClasses,
          stats: {
            totalStudents: mockClasses.reduce((acc, c) => acc + c.students.length, 0),
            averageScore: 83.5,
            activeAssignments: mockClasses.reduce((acc, c) => acc + c.lessons.length, 0)
          }
        };
      }
      return apiFetch('/progress/teacher-dashboard');
    },
  },
  conversations: {
    scenarios: async () => {
      if (DEMO_MODE) {
        return mockScenarios;
      }
      return apiFetch('/conversations/scenarios');
    },
    start: async (scenario: string) => {
      if (DEMO_MODE) {
        const sc = mockScenarios.find(s => s.id === scenario) || mockScenarios[0];
        const newConv = {
          id: `conv-${Date.now()}`,
          title: sc.title,
          scenario: sc.id,
          messages: [
            { role: 'AI', content: sc.opening }
          ],
          createdAt: new Date().toISOString()
        };
        mockConversations.push(newConv);
        return newConv;
      }
      return apiFetch('/conversations/start', { method: 'POST', body: JSON.stringify({ scenario }) });
    },
    list: async () => {
      if (DEMO_MODE) {
        return mockConversations;
      }
      return apiFetch('/conversations');
    },
    get: async (id: string) => {
      if (DEMO_MODE) {
        return mockConversations.find(c => c.id === id) || mockConversations[0];
      }
      return apiFetch(`/conversations/${id}`);
    },
    message: async (id: string, userMessage: string, score?: number, phonemeDiff?: any) => {
      if (DEMO_MODE) {
        const conv = mockConversations.find(c => c.id === id);
        let replyText = "That's very interesting! Could you tell me more?";
        if (conv) {
          conv.messages.push({ role: 'USER', content: userMessage, score, phonemeDiff });
          
          if (conv.scenario === 'restaurant') {
            replyText = "Got it. Would you like to add any drinks or dessert to your order?";
          } else if (conv.scenario === 'interview') {
            replyText = "Excellent. What do you believe is your greatest professional achievement so far?";
          } else if (conv.scenario === 'travel') {
            replyText = "Thank you. Will you be checking in any baggage, or do you have carry-on luggage only?";
          } else if (conv.scenario === 'daily') {
            replyText = "Nice! We should definitely hang out sometime next week. What days are you free?";
          } else if (conv.scenario === 'business') {
            replyText = "That is a valid point. Let's make sure we document these action items before the call ends.";
          }
          conv.messages.push({ role: 'AI', content: replyText });
        }
        return { reply: replyText };
      }
      return apiFetch(`/conversations/${id}/message`, { method: 'POST', body: JSON.stringify({ userMessage, score, phonemeDiff }) });
    },
  },
  ai: {
    analyzePronunciation: async (targetText: string, audioBlob: Blob) => {
      if (DEMO_MODE) {
        const words = targetText.split(/\s+/).filter(Boolean);
        const wordResults = words.map(w => {
          const cleanWord = w.replace(/[^a-zA-Z0-9']/g, '');
          const correct = Math.random() > 0.15; // 85% chance correct
          return {
            word: cleanWord,
            correct,
            similarity: correct ? 1.0 : 0.4
          };
        });
        
        const score = Math.round((wordResults.filter(w => w.correct).length / words.length) * 100) || 85;
        return {
          score,
          fluency: Math.max(50, score - 5),
          intonation: Math.max(50, score - 8),
          wordStress: Math.max(50, score - 4),
          phonemeDiff: wordResults,
          confidence: Math.max(50, score + 2),
          speed: 120 + Math.floor(Math.random() * 20),
          pauses: Math.floor(Math.random() * 3),
          feedback: score > 80 ? "Excellent pronunciation! Almost native-like." : "Good attempt. Practice the highlighted words for improvement.",
          transcript: targetText,
          engine: "Mock AI Engine (DEMO)"
        };
      }
      
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      formData.append('targetText', targetText);

      try {
        const res = await fetch(`${API_BASE}/ai/analyze-pronunciation`, {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'AI analysis failed');
        return data;
      } catch (err: any) {
        console.error('AI Service Error:', err);
        throw err;
      }
    },
    transcribe: async (audioBlob: Blob) => {
      if (DEMO_MODE) {
        return { text: "This is a mock transcription of your speech." };
      }
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      const res = await fetch(`${API_BASE}/ai/transcribe`, {
        method: 'POST',
        body: formData,
      });
      return res.json();
    }
  },
  tutor: {
    chat: async (message: string, history: any[]) => {
      if (DEMO_MODE) {
        const responses = [
          "That's a very good question! In English, word stress is crucial. Try putting more emphasis on the first syllable of 'project'.",
          "To improve your fluency, try grouping words into meaningful chunks and pausing slightly between them rather than after every word.",
          "Your pronunciation is very clear! One tip: for the 'th' sound in 'think', place your tongue between your teeth and blow air gently.",
          "Excellent practice session! I recommend doing the 'Daily Conversations' lesson next to practice common greetings."
        ];
        const reply = responses[Math.floor(Math.random() * responses.length)];
        return { reply };
      }
      return fetch(`${API_BASE}/tutor/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history })
      }).then(res => res.json());
    }
  }
};
