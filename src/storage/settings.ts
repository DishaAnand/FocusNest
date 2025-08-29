import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';

const K_AUTO_START_BREAK = 'settings:autoStartBreak';
const K_FOCUS_MIN = 'settings:focusMin';
const K_BREAK_MIN = 'settings:breakMin';

export const SETTINGS_CHANGED_EVENT = 'SETTINGS_CHANGED_EVENT';

export async function getAutoStartBreak(): Promise<boolean> {
  const v = await AsyncStorage.getItem(K_AUTO_START_BREAK);
  if (v === null) return true; // default ON
  return v === '1';
}
export async function setAutoStartBreak(value: boolean) {
  await AsyncStorage.setItem(K_AUTO_START_BREAK, value ? '1' : '0');
  DeviceEventEmitter.emit(SETTINGS_CHANGED_EVENT, { key: 'autoStartBreak', value });
}

/* NEW: Focus minutes */
export async function getFocusMinutes(): Promise<number> {
  const v = await AsyncStorage.getItem(K_FOCUS_MIN);
  return v ? Math.max(1, parseInt(v, 10)) : 25; // default 25
}
export async function setFocusMinutes(min: number) {
  const v = String(Math.max(1, Math.round(min)));
  await AsyncStorage.setItem(K_FOCUS_MIN, v);
  DeviceEventEmitter.emit(SETTINGS_CHANGED_EVENT, { key: 'focusMin', value: parseInt(v, 10) });
}

/* NEW: Break minutes */
export async function getBreakMinutes(): Promise<number> {
  const v = await AsyncStorage.getItem(K_BREAK_MIN);
  return v ? Math.max(1, parseInt(v, 10)) : 5; // default 5
}
export async function setBreakMinutes(min: number) {
  const v = String(Math.max(1, Math.round(min)));
  await AsyncStorage.setItem(K_BREAK_MIN, v);
  DeviceEventEmitter.emit(SETTINGS_CHANGED_EVENT, { key: 'breakMin', value: parseInt(v, 10) });
}
