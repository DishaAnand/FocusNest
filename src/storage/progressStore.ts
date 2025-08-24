// storage/progressStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { toISODate } from '../utils/date';
import { DeviceEventEmitter } from 'react-native';

const KEY = 'focusnest:daily:v1';
export const PROGRESS_UPDATED_EVENT = 'progress:updated'; // <— add this

export type DailyTotals = Record<string, { focus: number; break: number }>;

async function readAll(): Promise<DailyTotals> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return {};
  try { return JSON.parse(raw) as DailyTotals; } catch { return {}; }
}

async function writeAll(data: DailyTotals) {
  await AsyncStorage.setItem(KEY, JSON.stringify(data));
  DeviceEventEmitter.emit(PROGRESS_UPDATED_EVENT);  // <— notify listeners
}

export async function addSessionSeconds(
  type: 'focus' | 'break',
  seconds: number,
  at: Date = new Date()
) {
  const dateKey = toISODate(at);
  const all = await readAll();
  const prev = all[dateKey] ?? { focus: 0, break: 0 };
  all[dateKey] = {
    ...prev,
    [type]: (prev as any)[type] + Math.max(0, Math.floor(seconds)),
  };
  await writeAll(all); // <— emits
}

export async function setDayTotals(dateKey: string, focus: number, brk: number) {
  const all = await readAll();
  all[dateKey] = { focus: Math.max(0, focus), break: Math.max(0, brk) };
  await writeAll(all); // <— emits
}

export async function getDayTotals(dateKey: string) {
  const all = await readAll();
  return all[dateKey] ?? { focus: 0, break: 0 };
}

export async function getRangeTotals(start: Date, end: Date) {
  const all = await readAll();
  const out: Array<{ date: string; focus: number; break: number }> = [];
  const s = new Date(start);
  const e = new Date(end);
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    const k = toISODate(d);
    const t = all[k] ?? { focus: 0, break: 0 };
    out.push({ date: k, ...t });
  }
  return out;
}

export async function clearAllProgress() {
  await AsyncStorage.removeItem(KEY);
  DeviceEventEmitter.emit(PROGRESS_UPDATED_EVENT); // <— emits
}
