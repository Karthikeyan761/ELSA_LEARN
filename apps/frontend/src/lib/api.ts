const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';


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

// Auth
export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (email: string, password: string, name: string, role: string) =>
      apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name, role }) }),
    me: () => apiFetch('/auth/me'),
  },
  exercises: {
    list: (params?: { difficulty?: string; type?: string; topic?: string; search?: string }) => {
      const qs = new URLSearchParams(params as any).toString();
      return apiFetch(`/exercises${qs ? '?' + qs : ''}`);
    },
    get: (id: string) => apiFetch(`/exercises/${id}`),
    create: (data: any) => apiFetch('/exercises', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiFetch(`/exercises/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/exercises/${id}`, { method: 'DELETE' }),
    progress: (id: string) => apiFetch(`/exercises/${id}/progress`),
  },
  recordings: {
    upload: (formData: FormData) => apiFetchMultipart('/recordings/upload', formData),
    my: () => apiFetch('/recordings/my'),
    stats: () => apiFetch('/recordings/stats'),
  },
  classes: {
    list: () => apiFetch('/classes'),
    get: (id: string) => apiFetch(`/classes/${id}`),
    create: (data: { name: string; description?: string }) =>
      apiFetch('/classes', { method: 'POST', body: JSON.stringify(data) }),
    enroll: (id: string) => apiFetch(`/classes/${id}/enroll`, { method: 'POST' }),
    unenroll: (id: string) => apiFetch(`/classes/${id}/unenroll`, { method: 'POST' }),
    addStudent: (classId: string, email: string) => 
      apiFetch(`/classes/${classId}/add-student`, { method: 'POST', body: JSON.stringify({ email }) }),
    removeStudent: (classId: string, studentId: string) => 
      apiFetch(`/classes/${classId}/students/${studentId}`, { method: 'DELETE' }),
    assignLesson: (classId: string, lessonId: string) =>
      apiFetch(`/classes/${classId}/lessons`, { method: 'POST', body: JSON.stringify({ lessonId }) }),
    analytics: (id: string) => apiFetch(`/classes/${id}/analytics`),
  },
  lessons: {
    list: (params?: { classId?: string; difficulty?: string; topic?: string }) => {
      const qs = new URLSearchParams(params as any).toString();
      return apiFetch(`/lessons${qs ? '?' + qs : ''}`);
    },
    get: (id: string) => apiFetch(`/lessons/${id}`),
    create: (data: any) => apiFetch('/lessons', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiFetch(`/lessons/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  progress: {
    my: () => apiFetch('/progress/my'),
    dashboard: () => apiFetch('/progress/dashboard'),
    teacherDashboard: () => apiFetch('/progress/teacher-dashboard'),
  },
  conversations: {
    scenarios: () => apiFetch('/conversations/scenarios'),
    start: (scenario: string) => apiFetch('/conversations/start', { method: 'POST', body: JSON.stringify({ scenario }) }),
    list: () => apiFetch('/conversations'),
    get: (id: string) => apiFetch(`/conversations/${id}`),
    message: (id: string, userMessage: string, score?: number, phonemeDiff?: any) =>
      apiFetch(`/conversations/${id}/message`, { method: 'POST', body: JSON.stringify({ userMessage, score, phonemeDiff }) }),
  },
  ai: {
    analyzePronunciation: async (targetText: string, audioBlob: Blob) => {
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
    chat: (message: string, history: any[]) => {
      return fetch(`${API_BASE}/tutor/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history })
      }).then(res => res.json());
    }
  }
};
