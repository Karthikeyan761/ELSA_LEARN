const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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
      apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (email: string, password: string, name: string, role: string) =>
      apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name, role }) }),
    me: () => apiFetch('/api/auth/me'),
  },
  exercises: {
    list: (params?: { difficulty?: string; type?: string; topic?: string; search?: string }) => {
      const qs = new URLSearchParams(params as any).toString();
      return apiFetch(`/api/exercises${qs ? '?' + qs : ''}`);
    },
    get: (id: string) => apiFetch(`/api/exercises/${id}`),
    create: (data: any) => apiFetch('/api/exercises', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiFetch(`/api/exercises/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/api/exercises/${id}`, { method: 'DELETE' }),
    progress: (id: string) => apiFetch(`/api/exercises/${id}/progress`),
  },
  recordings: {
    upload: (formData: FormData) => apiFetchMultipart('/api/recordings/upload', formData),
    my: () => apiFetch('/api/recordings/my'),
    stats: () => apiFetch('/api/recordings/stats'),
  },
  classes: {
    list: () => apiFetch('/api/classes'),
    get: (id: string) => apiFetch(`/api/classes/${id}`),
    create: (data: { name: string; description?: string }) =>
      apiFetch('/api/classes', { method: 'POST', body: JSON.stringify(data) }),
    enroll: (id: string) => apiFetch(`/api/classes/${id}/enroll`, { method: 'POST' }),
    unenroll: (id: string) => apiFetch(`/api/classes/${id}/unenroll`, { method: 'POST' }),
    addStudent: (classId: string, email: string) => 
      apiFetch(`/api/classes/${classId}/add-student`, { method: 'POST', body: JSON.stringify({ email }) }),
    removeStudent: (classId: string, studentId: string) => 
      apiFetch(`/api/classes/${classId}/students/${studentId}`, { method: 'DELETE' }),
    assignLesson: (classId: string, lessonId: string) =>
      apiFetch(`/api/classes/${classId}/lessons`, { method: 'POST', body: JSON.stringify({ lessonId }) }),
    analytics: (id: string) => apiFetch(`/api/classes/${id}/analytics`),
  },
  lessons: {
    list: (params?: { classId?: string; difficulty?: string; topic?: string }) => {
      const qs = new URLSearchParams(params as any).toString();
      return apiFetch(`/api/lessons${qs ? '?' + qs : ''}`);
    },
    get: (id: string) => apiFetch(`/api/lessons/${id}`),
    create: (data: any) => apiFetch('/api/lessons', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiFetch(`/api/lessons/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  progress: {
    my: () => apiFetch('/api/progress/my'),
    dashboard: () => apiFetch('/api/progress/dashboard'),
    teacherDashboard: () => apiFetch('/api/progress/teacher-dashboard'),
  },
  conversations: {
    scenarios: () => apiFetch('/api/conversations/scenarios'),
    start: (scenario: string) => apiFetch('/api/conversations/start', { method: 'POST', body: JSON.stringify({ scenario }) }),
    list: () => apiFetch('/api/conversations'),
    get: (id: string) => apiFetch(`/api/conversations/${id}`),
    message: (id: string, userMessage: string, score?: number) =>
      apiFetch(`/api/conversations/${id}/message`, { method: 'POST', body: JSON.stringify({ userMessage, score }) }),
  },
  ai: {
    analyzePronunciation: (targetText: string, transcript: string) => {
      // The AI service runs on port 4001
      return fetch('http://localhost:4001/api/ai/analyze-pronunciation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetText, transcript })
      }).then(res => res.json());
    }
  },
  tutor: {
    chat: (message: string, history: any[]) => {
      // AI Tutor Microservice runs on port 4004
      return fetch('http://localhost:4004/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history })
      }).then(res => res.json());
    }
  }
};
