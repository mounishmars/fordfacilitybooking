const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  ssoSubjectId: string;
};

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ford_token');
}

export function setSession(token: string, user: SessionUser) {
  localStorage.setItem('ford_token', token);
  localStorage.setItem('ford_user', JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem('ford_token');
  localStorage.removeItem('ford_user');
}

export function getStoredUser(): SessionUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('ford_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.message || JSON.stringify(body);
      if (Array.isArray(message)) message = message.join(', ');
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function mockLogin(input: {
  email: string;
  name: string;
  role: string;
}) {
  const data = await api<{ accessToken: string; user: SessionUser }>(
    '/auth/mock-login',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
  setSession(data.accessToken, data.user);
  return data;
}
