import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

function hostFromExpo(): string | null {
  const candidates = [
    Constants.expoConfig?.hostUri,
    // @ts-expect-error legacy manifest fields
    Constants.manifest2?.extra?.expoGo?.debuggerHost,
    // @ts-expect-error legacy
    Constants.manifest?.debuggerHost,
    Constants.linkingUri,
  ].filter(Boolean) as string[];

  for (const raw of candidates) {
    // e.g. "192.168.1.5:8081" or "exp://192.168.1.5:8081"
    const cleaned = raw.replace(/^exp:\/\//, '').replace(/^https?:\/\//, '');
    const host = cleaned.split(':')[0]?.split('/')[0];
    if (
      host &&
      host !== 'exp' &&
      host !== 'localhost' &&
      host !== '127.0.0.1'
    ) {
      return host;
    }
  }
  return null;
}

function resolveApiUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv;

  // Browser / Expo web → same machine
  if (Platform.OS === 'web') {
    return 'http://localhost:3001';
  }

  // Physical device / Expo Go → LAN IP of the Metro host
  const lanHost = hostFromExpo();
  if (lanHost) {
    return `http://${lanHost}:3001`;
  }

  // Android emulator fallback
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3001';
  }

  // iOS simulator
  return 'http://localhost:3001';
}

export const API_URL = resolveApiUrl();

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  ssoSubjectId: string;
};

const TOKEN_KEY = 'ford_token';
const USER_KEY = 'ford_user';

export async function setSession(token: string, user: SessionUser) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function clearSession() {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}

export async function getStoredUser(): Promise<SessionUser | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      `Cannot reach API at ${API_URL}. Start it with: npm run api`,
    );
  }

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
  await setSession(data.accessToken, data.user);
  return data;
}
