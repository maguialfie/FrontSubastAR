import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Session } from '@/types/domain';

export const SESSION_KEY = 'subastar.session';

export async function readSessionValue() {
  return AsyncStorage.getItem(SESSION_KEY);
}

export async function writeSessionValue(value: string | null) {
  if (value) {
    await AsyncStorage.setItem(SESSION_KEY, value);
    return;
  }
  await AsyncStorage.removeItem(SESSION_KEY);
}

export async function readSession() {
  const stored = await readSessionValue();
  if (!stored) return null;
  try {
    return JSON.parse(stored) as Session;
  } catch {
    await writeSessionValue(null);
    return null;
  }
}

export async function storeSession(session: Session | null) {
  await writeSessionValue(session ? JSON.stringify(session) : null);
}

export async function getToken() {
  const session = await readSession();
  return session?.token;
}

