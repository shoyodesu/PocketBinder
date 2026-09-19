import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

export interface Course {
  id: number;
  title: string;
  code: string;
  color: string;
  created_at?: string;
}

export interface ScheduleItem {
  id: number;
  course_id: number;
  title: string;
  due_date: string;
  is_completed: number;
}

export interface Flashcard {
  id: number;
  course_id: number;
  question: string;
  answer: string;
}

export const getDb = async () => {
  if (Platform.OS === 'web') {
    return null;
  }
  return await SQLite.openDatabaseAsync('pocketbinder.db');
};

export const initDatabase = async () => {
  if (Platform.OS === 'web') {
    console.log('SQLite disabled on Web platform.');
    return;
  }

  try {
    const db = await getDb();
    if (!db) return;

    await db.execAsync('PRAGMA foreign_keys = ON;');

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        code TEXT NOT NULL,
        color TEXT DEFAULT '#4A90E2',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER,
        title TEXT NOT NULL,
        due_date TEXT NOT NULL,
        is_completed INTEGER DEFAULT 0,
        FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS flashcards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
      );
    `);

    console.log('PocketBinder database tables initialized successfully.');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// --- COURSE DATABASE OPERATIONS ---

export const getCourses = async (): Promise<Course[]> => {
  try {
    const db = await getDb();
    if (!db) return [];
    const courses = await db.getAllAsync<Course>('SELECT * FROM courses ORDER BY id DESC;');
    return courses;
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
};

export const addCourse = async (title: string, code: string, color: string = '#4A90E2') => {
  try {
    const db = await getDb();
    if (!db) return;
    const result = await db.runAsync(
      'INSERT INTO courses (title, code, color) VALUES (?, ?, ?);',
      [title, code, color]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding course:', error);
  }
};

export const deleteCourse = async (id: number) => {
  try {
    const db = await getDb();
    if (!db) return;
    await db.runAsync('DELETE FROM courses WHERE id = ?;', [id]);
  } catch (error) {
    console.error('Error deleting course:', error);
  }
};

// --- SCHEDULE DATABASE OPERATIONS ---

export const getSchedulesByCourse = async (courseId: number): Promise<ScheduleItem[]> => {
  try {
    const db = await getDb();
    if (!db) return [];
    const tasks = await db.getAllAsync<ScheduleItem>(
      'SELECT * FROM schedules WHERE course_id = ? ORDER BY due_date ASC;',
      [courseId]
    );
    return tasks;
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return [];
  }
};

export const addSchedule = async (courseId: number, title: string, dueDate: string) => {
  try {
    const db = await getDb();
    if (!db) return;
    await db.runAsync(
      'INSERT INTO schedules (course_id, title, due_date, is_completed) VALUES (?, ?, ?, 0);',
      [courseId, title, dueDate]
    );
  } catch (error) {
    console.error('Error adding schedule:', error);
  }
};

export const toggleScheduleComplete = async (id: number, currentStatus: number) => {
  try {
    const db = await getDb();
    if (!db) return;
    const newStatus = currentStatus === 1 ? 0 : 1;
    await db.runAsync('UPDATE schedules SET is_completed = ? WHERE id = ?;', [newStatus, id]);
  } catch (error) {
    console.error('Error toggling schedule:', error);
  }
};

export const deleteSchedule = async (id: number) => {
  try {
    const db = await getDb();
    if (!db) return;
    await db.runAsync('DELETE FROM schedules WHERE id = ?;', [id]);
  } catch (error) {
    console.error('Error deleting schedule:', error);
  }
};
