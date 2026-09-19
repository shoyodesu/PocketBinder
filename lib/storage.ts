import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CalendarEvent,
  CourseItem,
  ScheduleItem,
  StudentIdData,
  TodoItem,
  UserSettings,
} from './types';

// ---------------------------------------------------------------------------
// Every read/write/create/update/delete operation for the whole app lives in
// this one file, per the "single file for CRUD" requirement. Screens never
// touch AsyncStorage directly — they go through the stores below (or the
// hooks in lib/hooks.ts), which is also what makes cross-page sync work:
// every mutation calls notify(), and every screen listening to that key
// picks the change up immediately, without a manual reload.
// ---------------------------------------------------------------------------

const KEYS = {
  courses: '@pocketbinder_courses',
  events: '@pocketbinder_events',
  schedules: '@pocketbinder_schedules',
  todos: '@pocketbinder_todos',
  studentId: '@pocketbinder_student_id',
  settings: '@pocketbinder_settings',
} as const;

type StoreKey = keyof typeof KEYS;

// --- tiny pub/sub so mounted screens react to changes made elsewhere -------
type Listener = () => void;
const listeners: Record<string, Set<Listener>> = {};

function notify(key: StoreKey) {
  listeners[key]?.forEach((fn) => fn());
}

export function subscribe(key: StoreKey, fn: Listener): () => void {
  if (!listeners[key]) listeners[key] = new Set();
  listeners[key].add(fn);
  return () => listeners[key].delete(fn);
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// --- generic list store (courses / events / schedules) ---------------------
function createListStore<T extends { id: string }>(key: StoreKey) {
  async function getAll(): Promise<T[]> {
    try {
      const raw = await AsyncStorage.getItem(KEYS[key]);
      return raw ? (JSON.parse(raw) as T[]) : [];
    } catch (e) {
      console.error(`[storage] failed to read ${key}`, e);
      return [];
    }
  }

  async function saveAll(items: T[]): Promise<void> {
    await AsyncStorage.setItem(KEYS[key], JSON.stringify(items));
    notify(key);
  }

  async function add(item: Omit<T, 'id'> & { id?: string }): Promise<T> {
    const all = await getAll();
    const withId = { ...item, id: item.id ?? uid() } as T;
    await saveAll([...all, withId]);
    return withId;
  }

  async function update(id: string, patch: Partial<T>): Promise<void> {
    const all = await getAll();
    await saveAll(all.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  async function remove(id: string): Promise<void> {
    const all = await getAll();
    await saveAll(all.filter((it) => it.id !== id));
  }

  async function replaceOne(item: T): Promise<void> {
    const all = await getAll();
    await saveAll(all.map((it) => (it.id === item.id ? item : it)));
  }

  return { getAll, saveAll, add, update, remove, replaceOne };
}

export const CoursesStore = createListStore<CourseItem>('courses');
export const EventsStore = createListStore<CalendarEvent>('events');
export const SchedulesStore = createListStore<ScheduleItem>('schedules');
export const TodosStore = createListStore<TodoItem>('todos');

// --- single-object stores (student ID card, settings) ----------------------
const DEFAULT_ID: StudentIdData = {
  name: '',
  birthday: '',
  school: '',
  year: '',
  color: '#FF5C7A',
  photo: null,
};

const DEFAULT_SETTINGS: UserSettings = {
  username: 'Student',
  accentColor: '#FF5C7A',
  weekStartsMonday: false,
};

export const StudentIdStore = {
  async get(): Promise<StudentIdData> {
    try {
      const raw = await AsyncStorage.getItem(KEYS.studentId);
      return raw ? { ...DEFAULT_ID, ...JSON.parse(raw) } : DEFAULT_ID;
    } catch (e) {
      console.error('[storage] failed to read studentId', e);
      return DEFAULT_ID;
    }
  },
  async save(data: StudentIdData): Promise<void> {
    await AsyncStorage.setItem(KEYS.studentId, JSON.stringify(data));
    notify('studentId');
  },
};

export const SettingsStore = {
  async get(): Promise<UserSettings> {
    try {
      const raw = await AsyncStorage.getItem(KEYS.settings);
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
    } catch (e) {
      console.error('[storage] failed to read settings', e);
      return DEFAULT_SETTINGS;
    }
  },
  async save(data: UserSettings): Promise<void> {
    await AsyncStorage.setItem(KEYS.settings, JSON.stringify(data));
    notify('settings');
  },
};

// --- danger zone: used by Settings > Clear all data -------------------------
export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
  (Object.keys(KEYS) as StoreKey[]).forEach(notify);
}

// --- export / import (Settings > Backup) ------------------------------------
export async function exportAllData(): Promise<string> {
  const entries = await AsyncStorage.multiGet(Object.values(KEYS));
  const payload: Record<string, unknown> = {};
  entries.forEach(([k, v]) => {
    const name = (Object.keys(KEYS) as StoreKey[]).find((n) => KEYS[n] === k);
    if (name) payload[name] = v ? JSON.parse(v) : null;
  });
  return JSON.stringify(payload, null, 2);
}

export async function importAllData(json: string): Promise<void> {
  const payload = JSON.parse(json) as Record<string, unknown>;
  const ops: [string, string][] = [];
  (Object.keys(KEYS) as StoreKey[]).forEach((name) => {
    if (payload[name] !== undefined) {
      ops.push([KEYS[name], JSON.stringify(payload[name])]);
    }
  });
  await AsyncStorage.multiSet(ops);
  (Object.keys(KEYS) as StoreKey[]).forEach(notify);
}

export type { StoreKey };
