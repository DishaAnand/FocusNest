import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';

export type Task = { id: string; title: string; icon: string };

const KEY = 'tasks:list';
export const TASKS_CHANGED_EVENT = 'TASKS_CHANGED_EVENT';

const DEFAULT_TASKS: Task[] = [{ id: 'other', title: 'Other', icon: 'refresh-outline' }];

export async function getTasks(): Promise<Task[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_TASKS;
    const arr = JSON.parse(raw) as Task[];
    return Array.isArray(arr) && arr.length > 0 ? arr : DEFAULT_TASKS;
  } catch {
    return DEFAULT_TASKS;
  }
}

async function save(tasks: Task[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(tasks));
  DeviceEventEmitter.emit(TASKS_CHANGED_EVENT, tasks);
}

export async function upsertTask(task: Task) {
  const tasks = await getTasks();
  const idx = tasks.findIndex(t => t.id === task.id);
  if (idx >= 0) tasks[idx] = task; else tasks.push(task);
  await save(tasks);
  return tasks;
}

export async function renameTask(id: string, title: string) {
  const tasks = await getTasks();
  const idx = tasks.findIndex(t => t.id === id);
  if (idx >= 0) tasks[idx] = { ...tasks[idx], title };
  await save(tasks);
  return tasks;
}

export async function deleteTask(id: string) {
  const tasks = (await getTasks()).filter(t => t.id !== id);
  await save(tasks.length ? tasks : DEFAULT_TASKS);
  return tasks.length ? tasks : DEFAULT_TASKS;
}
