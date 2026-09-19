// Shared data shapes used across every screen.
// Keeping these in one file is what fixed bug #4 (schedule autofill pulling
// from field names that didn't actually exist on CourseItem).

export interface FileItem {
  id: string;
  name: string;
  uri: string;
  mimeType?: string;
  size?: number;
}

export interface LinkItem {
  id: string;
  title: string;
  url: string;
}

export interface TodoItem {
  id: string;
  title: string;
  course: string;
  description: string;
  status: 'ongoing' | 'missed' | 'completed';
  hasDeadline: boolean;
  deadlineDate?: string; // ISO date string
}

export interface CourseItem {
  id: string;
  code: string;
  instructorName?: string;
  instructorEmail?: string;
  roomLocation?: string;
  profilePhoto?: string | null;
  files: FileItem[];
  links: LinkItem[];
  todos: TodoItem[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  category: string;
  description?: string;
  date: string; // 'YYYY-MM-DD'
  hasTime: boolean;
  time?: string; // 'HH:mm'
}

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
export type Weekday = typeof WEEKDAYS[number];

export interface ScheduleItem {
  id: string;
  courseId?: string; // link back to the source course, when picked from Courses
  code: string;
  instructor?: string;
  room?: string;
  days: Weekday[];
  startTime: string; // 'HH:mm'
  endTime: string; // 'HH:mm'
  color: string;
}

export interface StudentIdData {
  name: string;
  birthday: string;
  school: string;
  year: string;
  color: string;
  photo?: string | null;
}

export interface UserSettings {
  username: string;
  accentColor: string;
  weekStartsMonday: boolean;
}
