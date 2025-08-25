// storage/sessionStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'focusnest:sessions:v1';

export type Session = {
  type: 'focus' | 'break';
  seconds: number;     // whole seconds
  at: string;          // ISO timestamp
};

async function readAll(): Promise<Session[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as Session[]; } catch { return []; }
}

async function writeAll(sessions: Session[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(sessions));
}

/** Log a single session entry (use this in TimerScreen) */
export async function appendSession(
  type: 'focus' | 'break',
  seconds: number,
  at: Date = new Date()
) {
  const all = await readAll();
  all.push({ type, seconds: Math.max(0, Math.floor(seconds)), at: at.toISOString() });
  await writeAll(all);
}

/** Stats for sessions in [start, end] inclusive. Focus-only. */
export async function getSessionStatsInRange(start: Date, end: Date) {
  const all = await readAll();
  const sMs = new Date(start).setHours(0, 0, 0, 0);
  const eMs = new Date(end).setHours(23, 59, 59, 999);

  const focusLens: number[] = [];
  for (const sess of all) {
    if (sess.type !== 'focus') continue;
    const t = new Date(sess.at).getTime();
    if (t >= sMs && t <= eMs) focusLens.push(sess.seconds);
  }

  const sessionsCompleted = focusLens.length;
  const longestSession = sessionsCompleted ? Math.max(...focusLens) : 0;
  const avgSession = sessionsCompleted
    ? Math.round(focusLens.reduce((a, b) => a + b, 0) / sessionsCompleted)
    : 0;

  return { sessionsCompleted, avgSession, longestSession };
}

export async function clearSessions() {
  await AsyncStorage.removeItem(KEY);
}
