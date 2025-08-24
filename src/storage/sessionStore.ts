// storage/sessionStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import { PROGRESS_UPDATED_EVENT } from './progressStore';

const SESSIONS_KEY = 'focusnest:sessions:v1';

export type SessionKind = 'focus' | 'break';
export type Session = {
  kind: SessionKind;
  seconds: number;    // whole seconds
  ts: number;         // Date.now() when it finished
};

async function readAll(): Promise<Session[]> {
  const raw = await AsyncStorage.getItem(SESSIONS_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as Session[]; } catch { return []; }
}

async function writeAll(list: Session[]) {
  await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(list));
  DeviceEventEmitter.emit(PROGRESS_UPDATED_EVENT);
}

export async function appendSession(kind: SessionKind, seconds: number, at = Date.now()) {
  const list = await readAll();
  list.push({ kind, seconds: Math.max(0, Math.floor(seconds)), ts: at });
  await writeAll(list);
}

export async function getSessionsInRange(start: Date, end: Date): Promise<Session[]> {
  const s = +start, e = +end;
  const list = await readAll();
  return list.filter(x => x.ts >= s && x.ts <= e);
}

export async function clearAllSessions() {
  await AsyncStorage.removeItem(SESSIONS_KEY);
  DeviceEventEmitter.emit(PROGRESS_UPDATED_EVENT);
}
